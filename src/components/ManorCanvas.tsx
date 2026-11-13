import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildManorWorld, ColliderBox, ManorWorldHandle } from '../three/manorWorld';
import { GamePhase, InteractableTarget, WorldFlags } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';

interface ManorCanvasProps {
  phase: GamePhase;
  flags: WorldFlags;
  inventory: string[];
  lanternOn: boolean;
  resetSignal: number;
  onTargetChange: (target: InteractableTarget | null) => void;
  onRoomChange: (roomName: string, dread: number) => void;
  onInteract: (targetId: string) => void;
  onPointerLockChange: (locked: boolean) => void;
}

// Pre-allocated math helpers outside render loop (zero GC)
const _centerNdc = new THREE.Vector2(0, 0);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _raycaster = new THREE.Raycaster();
_raycaster.layers.set(1);
_raycaster.far = 3.6;

function resolveCircleAabb(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[],
): { x: number; z: number } {
  let nx = x;
  let nz = z;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (!b.active) continue;

      const closestX = Math.max(b.minX, Math.min(nx, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(nz, b.maxZ));
      const dx = nx - closestX;
      const dz = nz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = radius - dist;
          nx += (dx / dist) * push;
          nz += (dz / dist) * push;
        } else {
          // Inside box: push out along shallowest axis
          const penLeft = Math.abs(nx - b.minX);
          const penRight = Math.abs(b.maxX - nx);
          const penTop = Math.abs(nz - b.minZ);
          const penBottom = Math.abs(b.maxZ - nz);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) nx = b.minX - radius;
          else if (minPen === penRight) nx = b.maxX + radius;
          else if (minPen === penTop) nz = b.minZ - radius;
          else nz = b.maxZ + radius;
        }
      }
    }
  }
  return { x: nx, z: nz };
}

export const ManorCanvas: React.FC<ManorCanvasProps> = ({
  phase,
  flags,
  inventory,
  lanternOn,
  resetSignal,
  onTargetChange,
  onRoomChange,
  onInteract,
  onPointerLockChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Latest reactive props stored in refs so WebGL effect never tears down
  const phaseRef = useRef(phase);
  const flagsRef = useRef(flags);
  const inventoryRef = useRef(inventory);
  const lanternRef = useRef(lanternOn);
  const callbacksRef = useRef({
    onTargetChange,
    onRoomChange,
    onInteract,
    onPointerLockChange,
  });

  phaseRef.current = phase;
  flagsRef.current = flags;
  inventoryRef.current = inventory;
  lanternRef.current = lanternOn;
  callbacksRef.current = {
    onTargetChange,
    onRoomChange,
    onInteract,
    onPointerLockChange,
  };

  const worldHandleRef = useRef<ManorWorldHandle | null>(null);
  const maxAnisoRef = useRef(1);
  const playerResetRef = useRef<(() => void) | null>(null);

  // Sync dynamic world flags whenever puzzle state or inventory updates
  useEffect(() => {
    worldHandleRef.current?.syncFlags(flags, inventory, maxAnisoRef.current);
  }, [flags, inventory]);

  // Reset player position when starting a new investigation
  useEffect(() => {
    if (resetSignal > 0) {
      playerResetRef.current?.();
    }
  }, [resetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.062);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(64, width / height, 0.1, 80);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    maxAnisoRef.current = maxAniso;

    // Mandatory studio environment reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.24;
    pmrem.dispose();

    // Build 3D Mansion World
    const world = buildManorWorld(scene, maxAniso, isSoftwareGl);
    worldHandleRef.current = world;
    world.syncFlags(flagsRef.current, inventoryRef.current, maxAniso);

    // Player Brass Lantern SpotLight + warm fill PointLight
    const lanternSpot = new THREE.SpotLight(0xffcb84, 7.5, 16, Math.PI / 4.2, 0.55, 1.45);
    lanternSpot.castShadow = !isSoftwareGl;
    lanternSpot.shadow.mapSize.set(1024, 1024);
    lanternSpot.shadow.bias = -0.0005;
    scene.add(lanternSpot, lanternSpot.target);

    const lanternFill = new THREE.PointLight(0xffb563, 1.4, 5.5, 1.6);
    scene.add(lanternFill);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Player FPS State
    const player = {
      x: 0,
      z: 8.1,
      yaw: 0,
      pitch: 0.04,
      stepDist: 0,
      bobPhase: 0,
    };

    playerResetRef.current = () => {
      player.x = 0;
      player.z = 8.1;
      player.yaw = 0;
      player.pitch = 0.04;
      player.stepDist = 0;
    };

    const keys: Record<string, boolean> = {};
    let isDragging = false;
    let dragMoved = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastTargetId: string | null = null;
    let lastRoomName = '';
    let lastTickSound = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyE' && phaseRef.current === 'playing' && lastTargetId) {
        callbacksRef.current.onInteract(lastTargetId);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (phaseRef.current !== 'playing') return;
      isDragging = true;
      dragMoved = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (phaseRef.current !== 'playing') return;
      if (document.pointerLockElement === renderer.domElement) {
        player.yaw -= e.movementX * 0.0022;
        player.pitch = THREE.MathUtils.clamp(
          player.pitch - e.movementY * 0.0022,
          -Math.PI * 0.42,
          Math.PI * 0.42,
        );
      } else if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        player.yaw -= dx * 0.004;
        player.pitch = THREE.MathUtils.clamp(
          player.pitch - dy * 0.004,
          -Math.PI * 0.42,
          Math.PI * 0.42,
        );
      }
    };

    const handleMouseUp = () => {
      if (phaseRef.current !== 'playing') {
        isDragging = false;
        return;
      }
      if (!dragMoved) {
        // Click either locks pointer (if unlocked) OR interacts if targeting an object
        if (lastTargetId) {
          callbacksRef.current.onInteract(lastTargetId);
        } else if (document.pointerLockElement !== renderer.domElement) {
          try {
            renderer.domElement.requestPointerLock();
          } catch {
            // Pointer lock may be unavailable in restricted sandboxes; drag-to-look remains active
          }
        }
      }
      isDragging = false;
    };

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      callbacksRef.current.onPointerLockChange(locked);
    };

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let raycastTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const proxyMeshes = world.interactables.map((i) => i.mesh);

    const tick = () => {
      if (disposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.08);
      const elapsed = clock.getElapsedTime();

      world.updateAnimations(elapsed, delta, flagsRef.current);

      if (phaseRef.current === 'title') {
        // Gentle atmospheric title camera sway inside the Foyer
        camera.position.set(Math.sin(elapsed * 0.18) * 0.45, 1.65, 8.2);
        camera.rotation.set(0.04, Math.sin(elapsed * 0.12) * 0.14, 0);
      } else {
        let moving = false;
        let currentSurface: 'marble' | 'wood' | 'stone' = 'marble';

        if (phaseRef.current === 'playing') {
          const moveForward = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
          const moveStrafe = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
          const turnYaw = (keys['KeyQ'] ? 1 : 0) - (keys['KeyR'] ? 1 : 0);
          if (turnYaw !== 0) player.yaw += turnYaw * 1.8 * delta;

          if (moveForward !== 0 || moveStrafe !== 0) {
            moving = true;
            const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? 4.3 : 2.95;
            _forward.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
            _right.crossVectors(_forward, _up).normalize();

            let vx = _forward.x * moveForward + _right.x * moveStrafe;
            let vz = _forward.z * moveForward + _right.z * moveStrafe;
            const len = Math.hypot(vx, vz) || 1;
            vx = (vx / len) * speed * delta;
            vz = (vz / len) * speed * delta;

            const resolved = resolveCircleAabb(
              player.x + vx,
              player.z + vz,
              0.36,
              world.colliders,
            );
            const movedDist = Math.hypot(resolved.x - player.x, resolved.z - player.z);
            player.x = resolved.x;
            player.z = resolved.z;
            player.stepDist += movedDist;
            player.bobPhase += delta * (keys['ShiftLeft'] ? 12 : 8.5);
          }

          // Room & Dread detection
          const roomInfo = world.getRoomAt(player.x, player.z);
          currentSurface = roomInfo.surface;
          if (roomInfo.name !== lastRoomName) {
            lastRoomName = roomInfo.name;
            callbacksRef.current.onRoomChange(roomInfo.name, roomInfo.dread);
            horrorAudio.setDreadLevel(roomInfo.dread);
          }

          // Footstep cadence
          if (moving && player.stepDist >= 1.18) {
            player.stepDist = 0;
            horrorAudio.playFootstep(currentSurface);
          }

          // Grandfather clock ambient tick near Foyer
          if (
            flagsRef.current.pendulumInserted &&
            elapsed - lastTickSound > 1.0 &&
            Math.hypot(player.x + 3.4, player.z - 0.55) < 8.5
          ) {
            lastTickSound = elapsed;
            horrorAudio.playClockTick();
          }

          // Throttled center-screen raycast (~20Hz)
          raycastTimer += delta;
          if (raycastTimer >= 0.05) {
            raycastTimer = 0;
            _raycaster.setFromCamera(_centerNdc, camera);
            const hits = _raycaster.intersectObjects(proxyMeshes, false);
            if (hits.length > 0) {
              const hitId = hits[0].object.userData.interactId as string;
              if (hitId !== lastTargetId) {
                lastTargetId = hitId;
                const found = world.interactables.find((i) => i.id === hitId);
                callbacksRef.current.onTargetChange(
                  found
                    ? {
                        id: found.id,
                        title: found.title,
                        prompt: found.prompt,
                        room: found.room,
                        distance: hits[0].distance,
                      }
                    : null,
                );
              }
            } else if (lastTargetId !== null) {
              lastTargetId = null;
              callbacksRef.current.onTargetChange(null);
            }
          }
        }

        const bobOffset = !reducedMotion && moving ? Math.sin(player.bobPhase) * 0.038 : 0;
        camera.position.set(player.x, 1.65 + bobOffset, player.z);
        camera.rotation.set(player.pitch, player.yaw, 0);
      }

      // Position player lantern slightly down-right of camera view
      const lanternEnabled = phaseRef.current === 'title' ? true : lanternRef.current;
      const flicker = 1 + Math.sin(elapsed * 9.3) * 0.06 + Math.sin(elapsed * 17.1) * 0.04;
      lanternSpot.intensity = lanternEnabled ? 7.8 * flicker : 0.4;
      lanternFill.intensity = lanternEnabled ? 1.35 * flicker : 0.25;

      camera.getWorldDirection(_forward);
      _right.crossVectors(_forward, _up).normalize();
      lanternSpot.position
        .copy(camera.position)
        .addScaledVector(_right, 0.24)
        .addScaledVector(_up, -0.18);
      lanternSpot.target.position
        .copy(camera.position)
        .addScaledVector(_forward, 6.0);
      lanternSpot.target.updateMatrixWorld();
      lanternFill.position.copy(lanternSpot.position);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      world.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#090A0F] text-[#E8E2D5] p-8 text-center">
          <div className="max-w-md space-y-3">
            <h2 className="font-display text-2xl font-semibold">Graphics Context Interrupted</h2>
            <p className="text-sm text-[#A9A295]">
              The 3D renderer paused momentarily. Restoring Blackwood Hollow...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
