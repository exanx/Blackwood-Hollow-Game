import * as THREE from 'three';
import {
  createContactShadowTexture,
  createDamaskWallTexture,
  createLunarFrescoTexture,
  createMarbleTileTexture,
  createPortraitTexture,
  createStoneFlagTexture,
  createWoodPlankTexture,
} from './proceduralTextures';
import {
  addContactShadow,
  createBookcase,
  createChandelier,
  createFireplaceAndMantle,
  createGothicWindow,
  createGrandfatherClock,
  createLunarAstrolabe,
  createMaterialPalette,
  createSanctumAltar,
  createTeaTableWithMusicBox,
  createUprightPiano,
  createVelvetArmchair,
  createWallSconce,
  createWritingDesk,
} from './manorProps';
import { WorldFlags } from '../types/game';

export interface ColliderBox {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  active: boolean;
}

export interface InteractableProxy {
  id: string;
  title: string;
  prompt: string;
  room: string;
  mesh: THREE.Mesh;
}

export interface ManorWorldHandle {
  colliders: ColliderBox[];
  interactables: InteractableProxy[];
  flames: THREE.Mesh[];
  flickerLights: { light: THREE.PointLight; base: number; seed: number }[];
  dustPoints: THREE.Points;
  clockRefs: {
    hourHand: THREE.Mesh;
    minuteHand: THREE.Mesh;
    pendulum: THREE.Group;
  };
  mantleRefs: {
    nicheDoor: THREE.Mesh;
    pendulumItem: THREE.Group;
    chimeRods: THREE.Mesh[];
  };
  studyDoorGroup: THREE.Group;
  secretBookcaseGroup: THREE.Group;
  conservatoryGateGroup: THREE.Group;
  wallPassagePanelGroup: THREE.Group;
  frescoMesh: THREE.Mesh;
  astrolabeRefs: {
    rings: THREE.Mesh[];
    medallion: THREE.Mesh;
  };
  altarRefs: {
    relicMeshes: {
      crimson_seal: THREE.Mesh;
      moonstone_medallion: THREE.Mesh;
      signet_ring: THREE.Mesh;
    };
    sigilRing: THREE.Mesh;
    sanctumLight: THREE.PointLight;
  };
  musicBoxKeyMesh: THREE.Group;
  deskSheetMesh: THREE.Mesh;
  deskWinchMesh: THREE.Group;
  alcoveGearMesh: THREE.Mesh;
  alcoveSealMesh: THREE.Mesh;
  wallRingMesh: THREE.Mesh;
  phosphorLensMesh: THREE.Mesh;
  syncFlags: (flags: WorldFlags, inventory: string[], maxAnisotropy: number) => void;
  updateAnimations: (elapsed: number, delta: number, flags: WorldFlags) => void;
  getRoomAt: (x: number, z: number) => { name: string; surface: 'marble' | 'wood' | 'stone'; dread: number };
  dispose: () => void;
}

export function buildManorWorld(
  scene: THREE.Scene,
  maxAnisotropy: number,
  isSoftwareGl: boolean,
): ManorWorldHandle {
  const mats = createMaterialPalette();
  const shadowTex = createContactShadowTexture();
  const marbleTex = createMarbleTileTexture(maxAnisotropy);
  const woodTex = createWoodPlankTexture(maxAnisotropy, false);
  const darkWoodTex = createWoodPlankTexture(maxAnisotropy, true);
  const stoneTex = createStoneFlagTexture(maxAnisotropy);
  const foyerWallTex = createDamaskWallTexture(maxAnisotropy, '#191d28', '#202636');
  const parlourWallTex = createDamaskWallTexture(maxAnisotropy, '#291519', '#341a20');
  const studyWallTex = createDamaskWallTexture(maxAnisotropy, '#16211e', '#1d2b27');
  const portraitTex = createPortraitTexture(maxAnisotropy);
  const frescoHiddenTex = createLunarFrescoTexture(false, maxAnisotropy);
  let frescoRevealedTex: THREE.CanvasTexture | null = null;

  const colliders: ColliderBox[] = [];
  const interactables: InteractableProxy[] = [];
  const flames: THREE.Mesh[] = [];
  const flickerLights: { light: THREE.PointLight; base: number; seed: number }[] = [];
  const disposables: { dispose: () => void }[] = [
    shadowTex,
    marbleTex,
    woodTex,
    darkWoodTex,
    stoneTex,
    foyerWallTex,
    parlourWallTex,
    studyWallTex,
    portraitTex,
    frescoHiddenTex,
  ];

  const WALL_H = 4.6;

  const foyerWallMat = new THREE.MeshStandardMaterial({
    map: foyerWallTex,
    roughness: 0.88,
    metalness: 0.02,
  });
  const parlourWallMat = new THREE.MeshStandardMaterial({
    map: parlourWallTex,
    roughness: 0.9,
    metalness: 0.02,
  });
  const studyWallMat = new THREE.MeshStandardMaterial({
    map: studyWallTex,
    roughness: 0.88,
    metalness: 0.02,
  });
  const conservatoryWallMat = new THREE.MeshStandardMaterial({
    color: 0x1b212a,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });
  const passageWallMat = new THREE.MeshStandardMaterial({
    color: 0x1c1613,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: true,
  });

  function addWall(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    mat: THREE.Material,
    thickness = 0.24,
    height = WALL_H,
    addCollider = true,
  ): THREE.Mesh {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, len), mat);
    mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
    mesh.rotation.y = angle;
    mesh.receiveShadow = true;
    mesh.castShadow = !isSoftwareGl;
    scene.add(mesh);

    // Baseboard trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(thickness + 0.04, 0.22, len), mats.darkOak);
    trim.position.set((x1 + x2) / 2, 0.11, (z1 + z2) / 2);
    trim.rotation.y = angle;
    scene.add(trim);

    if (addCollider) {
      const halfT = thickness / 2;
      const minX = Math.min(x1, x2) - halfT;
      const maxX = Math.max(x1, x2) + halfT;
      const minZ = Math.min(z1, z2) - halfT;
      const maxZ = Math.max(z1, z2) + halfT;
      colliders.push({
        id: `wall_${colliders.length}`,
        minX,
        maxX,
        minZ,
        maxZ,
        active: true,
      });
    }
    return mesh;
  }

  function addStaticBoxCollider(id: string, cx: number, cz: number, w: number, d: number, active = true): ColliderBox {
    const box: ColliderBox = {
      id,
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      active,
    };
    colliders.push(box);
    return box;
  }

  function addInteractable(
    id: string,
    title: string,
    prompt: string,
    room: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ): THREE.Mesh {
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    proxy.position.set(x, y, z);
    proxy.layers.set(1);
    proxy.userData.interactId = id;
    scene.add(proxy);
    interactables.push({ id, title, prompt, room, mesh: proxy });
    return proxy;
  }

  function addFloorAndCeiling(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    floorTex: THREE.Texture | null,
    floorColor: number,
    height = WALL_H,
  ): void {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      color: floorColor,
      roughness: floorTex === marbleTex ? 0.35 : 0.82,
      metalness: floorTex === marbleTex ? 0.12 : 0.04,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    scene.add(floor);

    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x0e1016,
      roughness: 0.94,
      metalness: 0.02,
      flatShading: true,
    });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, height, cz);
    scene.add(ceil);
  }

  // ==================== 1. GRAND FOYER (X: -5..5, Z: 0..10) ====================
  addFloorAndCeiling(-5, 5, 0, 10, marbleTex, 0xffffff, 4.8);
  // Crimson runner rug (offset +0.02 on Y to prevent Z-fighting)
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.02, 7.6), mats.velvetCrimson);
  rug.position.set(0, 0.02, 5.4);
  rug.receiveShadow = true;
  scene.add(rug);

  // South wall + front doors
  addWall(-5, 10, 5, 10, foyerWallMat);
  const frontDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.34), mats.darkOak);
  frontDoorFrame.position.set(0, 1.7, 9.9);
  scene.add(frontDoorFrame);
  addInteractable('front_door', 'Front Entrance Doors', 'Inspect Sealed Front Doors', 'Grand Foyer', 0, 1.5, 9.75, 2.4, 2.8, 0.5);

  // North Foyer Wall + Decorative Grand Staircase Alcove
  addWall(-5, 0, -2.0, 0, foyerWallMat);
  addWall(2.0, 0, 5.0, 0, foyerWallMat);
  addWall(-2.0, 0, -2.0, -2.2, foyerWallMat);
  addWall(2.0, 0, 2.0, -2.2, foyerWallMat);
  addWall(-2.0, -2.2, 2.0, -2.2, foyerWallMat);
  addFloorAndCeiling(-2.0, 2.0, -2.2, 0, darkWoodTex, 0xffffff, 4.8);
  for (let s = 0; s < 6; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 0.42), mats.mahogany);
    step.position.set(0, 0.12 + s * 0.24, -0.25 - s * 0.34);
    step.receiveShadow = true;
    scene.add(step);
  }
  addStaticBoxCollider('stair_block', 0, -0.35, 3.9, 0.6, true);

  // West Foyer Wall (Study Doorway Z: 0.8..2.8, Parlour Open Z: 4.8..7.0)
  addWall(-5, 0, -5, 0.8, foyerWallMat);
  addWall(-5, 2.8, -5, 4.8, foyerWallMat);
  addWall(-5, 7.0, -5, 10, foyerWallMat);
  // Lintels over openings
  const studyLintel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.6, 2.0), foyerWallMat);
  studyLintel.position.set(-5, 4.0, 1.8);
  scene.add(studyLintel);
  const parlourLintel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.6, 2.2), foyerWallMat);
  parlourLintel.position.set(-5, 4.0, 5.9);
  scene.add(parlourLintel);

  // Study Oak Door (pivots on Z=0.8 edge)
  const studyDoorGroup = new THREE.Group();
  studyDoorGroup.position.set(-5, 0, 0.8);
  const sDoorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.15, 1.96), mats.mahogany);
  sDoorLeaf.position.set(0, 1.575, 0.98);
  sDoorLeaf.castShadow = true;
  const sDoorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mats.brass);
  sDoorKnob.position.set(0.1, 1.35, 1.75);
  studyDoorGroup.add(sDoorLeaf, sDoorKnob);
  scene.add(studyDoorGroup);
  const studyDoorCollider = addStaticBoxCollider('study_door', -5, 1.8, 0.36, 2.0, true);
  addInteractable('study_door', 'Study & Library Door', 'Inspect Locked Study Door', 'Grand Foyer', -4.8, 1.4, 1.8, 0.7, 2.6, 1.9);

  // East Foyer Wall (Conservatory Lattice Gate Z: 3.8..6.2)
  addWall(5, 0, 5, 3.8, foyerWallMat);
  addWall(5, 6.2, 5, 10, foyerWallMat);
  const consLintel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.6, 2.4), foyerWallMat);
  consLintel.position.set(5, 4.0, 5.0);
  scene.add(consLintel);

  // Conservatory Iron Lattice Gate
  const conservatoryGateGroup = new THREE.Group();
  conservatoryGateGroup.position.set(5, 0, 5.0);
  for (let b = -4; b <= 4; b++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.15, 6), mats.iron);
    bar.position.set(0, 1.575, b * 0.25);
    conservatoryGateGroup.add(bar);
  }
  [0.6, 1.6, 2.6].forEach((hy) => {
    const hbar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.35), mats.iron);
    hbar.position.set(0, hy, 0);
    conservatoryGateGroup.add(hbar);
  });
  scene.add(conservatoryGateGroup);
  const conservatoryGateCollider = addStaticBoxCollider('cons_gate', 5, 5.0, 0.36, 2.4, true);

  // Gate Winch Pedestal beside Conservatory Gate
  const winchBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 0.32), mats.iron);
  winchBox.position.set(4.65, 1.15, 3.35);
  scene.add(winchBox);
  addInteractable('gate_winch', 'Conservatory Gate Winch', 'Inspect Gate Winch', 'Grand Foyer', 4.65, 1.25, 3.35, 0.65, 1.2, 0.65);

  // Foyer Console Table + Archivist's Note
  const consoleTable = new THREE.Group();
  consoleTable.position.set(2.3, 0, 5.6);
  addContactShadow(consoleTable, shadowTex, 1.5, 0.9);
  const ctTop = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.66), mats.mahogany);
  ctTop.position.y = 0.84;
  ctTop.castShadow = true;
  consoleTable.add(ctTop);
  [-0.52, 0.52].forEach((lx) =>
    [-0.24, 0.24].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.8, 6), mats.darkOak);
      leg.position.set(lx, 0.4, lz);
      consoleTable.add(leg);
    }),
  );
  const foyerLedger = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.44), mats.parchment);
  foyerLedger.position.set(-0.15, 0.9, 0.05);
  foyerLedger.rotation.y = -0.25;
  consoleTable.add(foyerLedger);
  scene.add(consoleTable);
  addStaticBoxCollider('console_table', 2.3, 5.6, 1.3, 0.72, true);
  addInteractable('foyer_note', 'Archivist’s Assignment', 'Read Archivist’s Ledger', 'Grand Foyer', 2.3, 1.0, 5.6, 1.1, 0.8, 0.7);

  // Grandfather Clock (North-West Foyer)
  const clockObj = createGrandfatherClock(mats, shadowTex);
  clockObj.group.position.set(-3.4, 0, 0.55);
  scene.add(clockObj.group);
  addStaticBoxCollider('grandfather_clock', -3.4, 0.55, 1.05, 0.7, true);
  addInteractable('grandfather_clock', 'Grandfather Clock', 'Examine Grandfather Clock', 'Grand Foyer', -3.4, 1.55, 0.68, 1.0, 2.5, 0.85);

  // Alistair's Portrait (North-East Foyer)
  const portraitFrame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.05, 0.08), mats.brass);
  portraitFrame.position.set(3.5, 2.05, 0.16);
  const portraitCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 1.82),
    new THREE.MeshStandardMaterial({ map: portraitTex, roughness: 0.75 }),
  );
  portraitCanvas.position.set(3.5, 2.05, 0.21);
  scene.add(portraitFrame, portraitCanvas);
  addInteractable('alistair_portrait', 'Portrait of Alistair Blackwood', 'Inspect Portrait', 'Grand Foyer', 3.5, 1.9, 0.35, 1.4, 2.0, 0.5);

  // Foyer Chandelier
  const chandelier = createChandelier(mats, flames);
  chandelier.position.set(0, 4.8, 5.0);
  scene.add(chandelier);

  // ==================== 2. THE PARLOUR (X: -13..-5, Z: 3.2..10.0) ====================
  addFloorAndCeiling(-13, -5, 3.2, 10, woodTex, 0xffffff);
  addWall(-13, 3.2, -5, 3.2, parlourWallMat); // Partition to Study
  addWall(-13, 3.2, -13, 10, parlourWallMat);
  addWall(-13, 10, -5, 10, parlourWallMat);

  // Parlour Rug
  const pRug = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.02, 3.4), mats.velvetCrimson);
  pRug.position.set(-8.8, 0.02, 6.7);
  pRug.receiveShadow = true;
  scene.add(pRug);

  // Fireplace & Mantle Chimes (West Wall)
  const fireplace = createFireplaceAndMantle(mats, shadowTex);
  fireplace.group.position.set(-12.55, 0, 6.7);
  scene.add(fireplace.group);
  addStaticBoxCollider('fireplace', -12.35, 6.7, 1.0, 2.7, true);
  addInteractable('mantle_chimes', 'Fireplace Mantle Chimes', 'Inspect Mantle Chimes', 'The Parlour', -12.15, 1.95, 6.7, 0.9, 1.0, 1.9);
  addInteractable('silver_pendulum_pickup', 'Silver Pendulum', 'Take Silver Pendulum', 'The Parlour', -12.15, 1.15, 8.08, 0.85, 0.85, 0.85);

  // Tea Table & Velvet Armchairs
  const teaTable = createTeaTableWithMusicBox(mats, shadowTex);
  teaTable.group.position.set(-8.8, 0, 6.7);
  scene.add(teaTable.group);
  addStaticBoxCollider('tea_table', -8.8, 6.7, 1.15, 1.15, true);
  addInteractable('music_box_key', 'Brass Music Box', 'Inspect Music Box', 'The Parlour', -8.8, 0.95, 6.7, 0.8, 0.7, 0.8);

  const chair1 = createVelvetArmchair(mats, shadowTex);
  chair1.position.set(-8.8, 0, 5.1);
  scene.add(chair1);
  addStaticBoxCollider('chair1', -8.8, 5.1, 0.9, 0.9, true);

  const chair2 = createVelvetArmchair(mats, shadowTex);
  chair2.position.set(-7.1, 0, 6.7);
  chair2.rotation.y = -Math.PI / 2;
  scene.add(chair2);
  addStaticBoxCollider('chair2', -7.1, 6.7, 0.9, 0.9, true);

  // Upright Piano (South Wall)
  const piano = createUprightPiano(mats, shadowTex);
  piano.position.set(-9.6, 0, 9.5);
  piano.rotation.y = Math.PI;
  scene.add(piano);
  addStaticBoxCollider('piano', -9.6, 9.3, 1.85, 1.1, true);
  addInteractable('upright_piano', 'Evelyn’s Upright Piano', 'Inspect Piano & Score', 'The Parlour', -9.6, 1.25, 9.15, 1.7, 1.3, 0.9);

  // Apothecary Cabinet (North-East Parlour) holding Phosphor Lens
  const apoth = new THREE.Group();
  apoth.position.set(-6.3, 0, 3.68);
  addContactShadow(apoth, shadowTex, 1.4, 0.8);
  const apBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.75, 0.54), mats.darkOak);
  apBody.position.y = 0.875;
  apBody.castShadow = true;
  apoth.add(apBody);
  const phosphorLensMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 10), mats.moonstone);
  phosphorLensMesh.position.set(0.15, 1.78, 0.05);
  apoth.add(phosphorLensMesh);
  scene.add(apoth);
  addStaticBoxCollider('apothecary', -6.3, 3.68, 1.25, 0.65, true);
  addInteractable('phosphor_lens_pickup', 'Apothecary Cabinet', 'Inspect Cabinet & Cobalt Lens', 'The Parlour', -6.3, 1.55, 3.85, 1.1, 1.4, 0.7);

  // ==================== 3. STUDY & LIBRARY (X: -13..-5, Z: -4.2..3.2) ====================
  addFloorAndCeiling(-13, -5, -4.2, 3.2, darkWoodTex, 0xffffff);
  addWall(-13, -4.2, -13, 3.2, studyWallMat);
  addWall(-5, -4.2, -5, 0, studyWallMat);
  // North Study Wall with False Bookcase Doorway (X: -10.2..-8.0)
  addWall(-13, -4.2, -10.2, -4.2, studyWallMat);
  addWall(-8.0, -4.2, -5, -4.2, studyWallMat);
  const studyArchLintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.28), studyWallMat);
  studyArchLintel.position.set(-9.1, 3.9, -4.2);
  scene.add(studyArchLintel);

  // Side Bookcases
  const bcWest = createBookcase(mats, shadowTex, 2.2, 3.1);
  bcWest.position.set(-12.6, 0, -0.5);
  bcWest.rotation.y = Math.PI / 2;
  scene.add(bcWest);
  addStaticBoxCollider('bc_west', -12.6, -0.5, 0.6, 2.2, true);

  // Secret Sliding Bookcase on North Wall
  const secretBookcaseGroup = createBookcase(mats, shadowTex, 2.25, 3.2);
  secretBookcaseGroup.position.set(-9.1, 0, -4.18);
  scene.add(secretBookcaseGroup);
  const secretBookcaseCollider = addStaticBoxCollider('secret_bookcase', -9.1, -4.18, 2.25, 0.55, true);
  addInteractable('false_bookcase', 'North Mahogany Bookcase', 'Inspect Bookcase', 'Study & Library', -9.1, 1.55, -3.9, 2.0, 2.5, 0.7);

  // Writing Desk + Torn Sheet Music + Winch Handle
  const desk = createWritingDesk(mats, shadowTex);
  desk.group.position.set(-9.2, 0, -0.8);
  scene.add(desk.group);
  addStaticBoxCollider('writing_desk', -9.2, -0.8, 2.15, 1.1, true);
  addInteractable('torn_sheet_pickup', 'Alistair’s Ledger & Sheet Music', 'Take Torn Sheet Music & Read Ledger', 'Study & Library', -9.45, 0.95, -0.75, 0.75, 0.7, 0.75);
  addInteractable('winch_handle_pickup', 'Iron Winch Handle', 'Take Iron Winch Handle', 'Study & Library', -8.62, 0.95, -0.7, 0.65, 0.7, 0.65);

  // ==================== 4. HIDDEN ALCOVE (X: -11.2..-7.2, Z: -7.4..-4.2) ====================
  addFloorAndCeiling(-11.2, -7.2, -7.4, -4.2, darkWoodTex, 0xffffff, 3.8);
  addWall(-11.2, -7.4, -11.2, -4.2, passageWallMat, 0.24, 3.8);
  addWall(-7.2, -7.4, -7.2, -4.2, passageWallMat, 0.24, 3.8);
  addWall(-11.2, -7.4, -7.2, -7.4, passageWallMat, 0.24, 3.8);

  const alcovePed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.72), mats.darkOak);
  alcovePed.position.set(-9.1, 0.425, -6.5);
  scene.add(alcovePed);
  addStaticBoxCollider('alcove_ped', -9.1, -6.5, 1.35, 0.75, true);

  const alcoveGearMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 10), mats.iron);
  alcoveGearMesh.position.set(-9.45, 0.88, -6.5);
  const alcoveSealMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0x9e2a2b, emissive: 0x450b0d, roughness: 0.4, flatShading: true }),
  );
  alcoveSealMesh.position.set(-8.8, 0.88, -6.5);
  const masonNoteMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.34), mats.parchment);
  masonNoteMesh.position.set(-9.12, 0.865, -6.38);
  scene.add(alcoveGearMesh, alcoveSealMesh, masonNoteMesh);

  addInteractable('iron_gear_pickup', 'Toothed Iron Gear', 'Take Toothed Iron Gear', 'Hidden Alcove', -9.45, 0.95, -6.5, 0.55, 0.7, 0.65);
  addInteractable('crimson_seal_pickup', 'Crimson Wax Seal', 'Take Crimson Wax Seal', 'Hidden Alcove', -8.8, 0.95, -6.5, 0.55, 0.7, 0.65);
  addInteractable('masons_note', 'Mason’s Confession', 'Read Mason’s Confession', 'Hidden Alcove', -9.12, 0.95, -6.38, 0.5, 0.6, 0.55);

  // ==================== 5. MOONLIT CONSERVATORY (X: 5..13, Z: -1.0..10.0) ====================
  addFloorAndCeiling(5, 13, -1.0, 10.0, stoneTex, 0xffffff, 4.8);
  addWall(5, -1.0, 5, 0, conservatoryWallMat);
  addWall(5, 10.0, 13, 10.0, conservatoryWallMat);
  // North wall with Secret Wall Panel Doorway (X: 7.6..9.6)
  addWall(5, -1.0, 7.6, -1.0, conservatoryWallMat);
  addWall(9.6, -1.0, 13, -1.0, conservatoryWallMat);
  const wpLintel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.28), conservatoryWallMat);
  wpLintel.position.set(8.6, 4.05, -1.0);
  scene.add(wpLintel);

  // Secret Wall Passage Panel (slides along X)
  const wallPassagePanelGroup = new THREE.Group();
  wallPassagePanelGroup.position.set(8.6, 0, -1.0);
  const panelSlab = new THREE.Mesh(new THREE.BoxGeometry(2.05, 3.3, 0.24), mats.stone);
  panelSlab.position.y = 1.65;
  const panelTrim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.28), mats.darkOak);
  panelTrim.position.y = 1.5;
  wallPassagePanelGroup.add(panelSlab, panelTrim);
  scene.add(wallPassagePanelGroup);
  const wallPassageCollider = addStaticBoxCollider('wall_panel', 8.6, -1.0, 2.05, 0.36, true);
  addInteractable('wall_panel_inspect', 'Ivy-Wreathed Wainscoting', 'Inspect Hollow Wall Panel', 'Moonlit Conservatory', 8.6, 1.5, -0.75, 1.8, 2.4, 0.6);

  // East Conservatory Wall with 3 Gothic Windows
  addWall(13, -1.0, 13, 1.2, conservatoryWallMat);
  addWall(13, 2.8, 13, 4.2, conservatoryWallMat);
  addWall(13, 5.8, 13, 7.2, conservatoryWallMat);
  addWall(13, 8.8, 13, 10.0, conservatoryWallMat);
  [2.0, 5.0, 8.0].forEach((wz) => {
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 1.65), conservatoryWallMat);
    sill.position.set(13, 0.425, wz);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.15, 1.65), conservatoryWallMat);
    head.position.set(13, 4.225, wz);
    const win = createGothicWindow(mats);
    win.position.set(12.95, 0.85, wz);
    win.rotation.y = -Math.PI / 2;
    scene.add(sill, head, win);
  });
  addStaticBoxCollider('cons_east_wall', 13.0, 4.5, 0.3, 11.0, true);

  // Exterior Moonlit Grounds (visible through Gothic Windows — prevents empty void!)
  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 28),
    new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.95, flatShading: true }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(25, -0.1, 4.5);
  scene.add(lawn);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x101722, roughness: 0.95, flatShading: true });
  [
    [16.5, 1.5, 5.2],
    [18.2, 6.2, 6.4],
    [15.8, 9.0, 4.8],
    [20.5, 3.8, 7.1],
  ].forEach(([tx, tz, th]) => {
    const tree = new THREE.Group();
    tree.position.set(tx, -0.1, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, th * 0.35, 5), mats.darkOak);
    trunk.position.y = th * 0.175;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1, th * 0.75, 6), treeMat);
    crown.position.y = th * 0.62;
    tree.add(trunk, crown);
    scene.add(tree);
  });

  // Lunar Astrolabe Pedestal (Center of Conservatory)
  const astrolabe = createLunarAstrolabe(mats, shadowTex);
  astrolabe.group.position.set(9.0, 0, 4.8);
  scene.add(astrolabe.group);
  addStaticBoxCollider('astrolabe', 9.0, 4.8, 1.15, 1.15, true);
  addInteractable('lunar_astrolabe', 'Lunar Astrolabe', 'Operate Lunar Astrolabe', 'Moonlit Conservatory', 9.0, 1.4, 4.8, 1.2, 1.8, 1.2);

  // Faded Lunar Fresco on South Conservatory Wall
  const frescoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshStandardMaterial({ map: frescoHiddenTex, roughness: 0.7 }),
  );
  frescoMesh.position.set(9.0, 2.0, 9.84);
  frescoMesh.rotation.y = Math.PI;
  scene.add(frescoMesh);
  addInteractable('lunar_fresco', 'Faded Lunar Fresco', 'Examine Lunar Fresco', 'Moonlit Conservatory', 9.0, 1.8, 9.65, 3.0, 1.7, 0.6);

  // ==================== 6. PASSAGE WITHIN THE WALLS & SANCTUM ====================
  // Northbound wall passage (X: 7.4..9.8, Z: -6.4..-1.0)
  addFloorAndCeiling(7.4, 9.8, -6.4, -1.0, darkWoodTex, 0xffffff, 3.2);
  addWall(9.8, -6.4, 9.8, -1.0, passageWallMat, 0.24, 3.2);
  addWall(7.4, -4.1, 7.4, -1.0, passageWallMat, 0.24, 3.2);

  // Westbound wall passage (X: -0.4..9.8, Z: -6.4..-4.1)
  addFloorAndCeiling(-0.4, 7.4, -6.4, -4.1, darkWoodTex, 0xffffff, 3.2);
  addWall(-0.4, -6.4, 9.8, -6.4, passageWallMat, 0.24, 3.2);
  addWall(-0.4, -4.1, 7.4, -4.1, passageWallMat, 0.24, 3.2);

  // Timber support studs inside the wall cavity for authentic "inside the walls" atmosphere
  for (let wx = 0.6; wx <= 7.0; wx += 1.6) {
    const stud = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), mats.darkOak);
    stud.position.set(wx, 1.6, -4.25);
    scene.add(stud);
  }

  // Loose Brick Niche in Wall Passage (Blackwood Signet Ring + Evelyn's Letter)
  const brickNiche = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.35), mats.obsidian);
  brickNiche.position.set(2.8, 1.18, -6.28);
  const wallRingMesh = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 6, 10), mats.silver);
  wallRingMesh.rotation.x = Math.PI / 2;
  wallRingMesh.position.set(2.68, 1.04, -6.18);
  const evelynNoteMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.3), mats.parchment);
  evelynNoteMesh.position.set(2.94, 1.03, -6.18);
  scene.add(brickNiche, wallRingMesh, evelynNoteMesh);
  addInteractable('wall_niche_ring', 'Loose Masonry Brick Niche', 'Search Wall Cavity', 'Passage Within the Walls', 2.8, 1.15, -6.05, 0.9, 0.9, 0.65);

  // Occult Sanctum Chamber (X: -4.6..-0.4, Z: -7.2..-3.8)
  addFloorAndCeiling(-4.6, -0.4, -7.2, -3.8, stoneTex, 0xffffff, 3.8);
  addWall(-4.6, -7.2, -4.6, -3.8, passageWallMat, 0.24, 3.8);
  addWall(-4.6, -7.2, -0.4, -7.2, passageWallMat, 0.24, 3.8);
  addWall(-4.6, -3.8, -0.4, -3.8, passageWallMat, 0.24, 3.8);
  addWall(-0.4, -7.2, -0.4, -6.4, passageWallMat, 0.24, 3.8);
  addWall(-0.4, -4.1, -0.4, -3.8, passageWallMat, 0.24, 3.8);

  const altar = createSanctumAltar(mats, shadowTex);
  altar.group.position.set(-2.6, 0, -5.5);
  altar.group.rotation.y = Math.PI / 2;
  scene.add(altar.group);
  addStaticBoxCollider('sanctum_altar', -2.6, -5.5, 1.35, 1.95, true);
  addInteractable('sanctum_altar', 'Blackwood Sanctum Altar', 'Approach Sanctum Altar', 'Occult Sanctum', -2.6, 1.25, -5.5, 1.6, 1.6, 2.0);

  // ==================== LIGHTING & ATMOSPHERE ====================
  // Cool nocturnal hemisphere + moonlight directional key
  const hemi = new THREE.HemisphereLight(0x4a668a, 0x1a1412, 0.45);
  scene.add(hemi);

  const moonKey = new THREE.DirectionalLight(0x7fa8d9, 0.85);
  moonKey.position.set(18, 12, 6);
  moonKey.castShadow = !isSoftwareGl;
  moonKey.shadow.mapSize.set(1024, 1024);
  moonKey.shadow.camera.near = 1;
  moonKey.shadow.camera.far = 45;
  moonKey.shadow.camera.left = -16;
  moonKey.shadow.camera.right = 16;
  moonKey.shadow.camera.top = 16;
  moonKey.shadow.camera.bottom = -16;
  moonKey.shadow.bias = -0.0005;
  scene.add(moonKey);

  // Helper to place warm flickering sconces & lights
  function addCandleLight(x: number, y: number, z: number, color: number, intensity: number, distance: number, seed: number): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance, 1.8);
    light.position.set(x, y, z);
    scene.add(light);
    flickerLights.push({ light, base: intensity, seed });
    return light;
  }

  // Foyer Chandelier warm glow
  addCandleLight(0, 3.4, 5.0, 0xffae52, 4.2, 13, 1.1);
  // Parlour fireplace warm glow
  addCandleLight(-11.8, 0.7, 6.7, 0xff7028, 3.8, 11, 2.3);
  // Parlour wall sconce
  const sconce1 = createWallSconce(mats, flames);
  sconce1.position.set(-8.8, 2.2, 3.34);
  scene.add(sconce1);
  addCandleLight(-8.8, 2.35, 3.6, 0xffaa4d, 2.2, 9, 3.4);

  // Study desk sconce
  const sconce2 = createWallSconce(mats, flames);
  sconce2.position.set(-9.2, 2.2, 3.06);
  sconce2.rotation.y = Math.PI;
  scene.add(sconce2);
  addCandleLight(-9.2, 2.3, 2.7, 0xffa64d, 2.5, 10, 4.5);

  // Alcove sconce
  const sconce3 = createWallSconce(mats, flames);
  sconce3.position.set(-9.1, 2.1, -7.25);
  scene.add(sconce3);
  addCandleLight(-9.1, 2.2, -6.9, 0xff9b44, 1.8, 7, 5.2);

  // Conservatory cool moonlight pool
  const consMoon = new THREE.PointLight(0x7fb4eb, 3.4, 14, 1.6);
  consMoon.position.set(10.5, 3.4, 5.0);
  scene.add(consMoon);

  // Wall passage eerie candle sconce
  const sconce4 = createWallSconce(mats, flames);
  sconce4.position.set(2.8, 2.0, -6.25);
  scene.add(sconce4);
  addCandleLight(2.8, 2.1, -5.9, 0xff9238, 1.6, 7.5, 6.7);

  // Sanctum Crimson Ritual Light
  const sanctumLight = addCandleLight(-2.6, 2.3, -5.5, 0xa82628, 3.2, 9.5, 7.9);

  // Floating dust motes across the manor
  const dustCount = 260;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = -12.5 + Math.random() * 25;
    dustPositions[i * 3 + 1] = 0.3 + Math.random() * 3.8;
    dustPositions[i * 3 + 2] = -6.8 + Math.random() * 16.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xcbd5e1,
    size: 0.035,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);
  disposables.push(dustGeo, dustMat);

  // Target animated values
  let studyDoorAngle = 0;
  let bookcaseOffset = 0;
  let gateLift = 0;
  let panelOffset = 0;
  let nicheSlide = 0;

  function syncFlags(flags: WorldFlags, inventory: string[], maxAniso: number): void {
    studyDoorCollider.active = !flags.studyDoorUnlocked;
    secretBookcaseCollider.active = !flags.bookcaseSlid;
    conservatoryGateCollider.active = !flags.conservatoryGateUnlocked;
    wallPassageCollider.active = !flags.wallPassageOpened;

    // Picked-up world mesh visibility
    const hasOrPlaced = (id: string) =>
      inventory.includes(id) ||
      (id === 'crimson_seal' && flags.placedRelics.crimson_seal) ||
      (id === 'moonstone_medallion' && flags.placedRelics.moonstone_medallion) ||
      (id === 'signet_ring' && flags.placedRelics.signet_ring);

    teaTable.keyMesh.visible = !inventory.includes('brass_key') && !flags.studyDoorUnlocked;
    phosphorLensMesh.visible = !inventory.includes('phosphor_lens');
    desk.sheetMesh.visible = !inventory.includes('torn_sheet');
    desk.winchHandleMesh.visible = !inventory.includes('winch_handle') && !inventory.includes('assembled_crank') && !flags.conservatoryGateUnlocked;
    fireplace.pendulumItem.visible = !inventory.includes('silver_pendulum') && !flags.pendulumInserted;
    clockObj.pendulum.visible = flags.pendulumInserted;
    alcoveGearMesh.visible = !inventory.includes('iron_gear') && !inventory.includes('assembled_crank') && !flags.conservatoryGateUnlocked;
    alcoveSealMesh.visible = !hasOrPlaced('crimson_seal');
    astrolabe.medallion.visible = !flags.astrolabeSolved;
    wallRingMesh.visible = !hasOrPlaced('signet_ring');

    // Sanctum Altar placed relics
    altar.relicMeshes.crimson_seal.visible = flags.placedRelics.crimson_seal;
    altar.relicMeshes.moonstone_medallion.visible = flags.placedRelics.moonstone_medallion;
    altar.relicMeshes.signet_ring.visible = flags.placedRelics.signet_ring;

    if (flags.ritualBroken) {
      sanctumLight.color.setHex(0x8bc6ff);
      (altar.sigilRing.material as THREE.MeshStandardMaterial).emissive.setHex(0x3b78b8);
      (altar.sigilRing.material as THREE.MeshStandardMaterial).color.setHex(0x88bff2);
    }

    // Update Fresco Texture when Phosphor Lens reveals it
    if (flags.frescoRevealed && !frescoRevealedTex) {
      frescoRevealedTex = createLunarFrescoTexture(true, maxAniso);
      disposables.push(frescoRevealedTex);
      const mat = frescoMesh.material as THREE.MeshStandardMaterial;
      mat.map = frescoRevealedTex;
      mat.emissive = new THREE.Color(0x1f3557);
      mat.emissiveMap = frescoRevealedTex;
      mat.emissiveIntensity = 0.85;
      mat.needsUpdate = true;
    }
  }

  function updateAnimations(elapsed: number, delta: number, flags: WorldFlags): void {
    // Flickering candles
    for (const item of flickerLights) {
      const wave =
        Math.sin(elapsed * 7.2 + item.seed * 3.1) * 0.14 +
        Math.sin(elapsed * 13.7 + item.seed * 5.7) * 0.08;
      item.light.intensity = item.base * (1 + wave);
    }
    for (let i = 0; i < flames.length; i++) {
      const f = flames[i];
      const s = 1 + Math.sin(elapsed * 11 + i * 2.1) * 0.14;
      f.scale.set(1, s, 1);
    }

    // Fireplace ember pulse
    fireplace.emberMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 3.4) * 0.3;

    // Smoothly animate doors, secret bookcase, conservatory gate, wall panel, chimney niche
    studyDoorAngle = THREE.MathUtils.damp(
      studyDoorAngle,
      flags.studyDoorUnlocked ? -Math.PI * 0.48 : 0,
      5.5,
      delta,
    );
    studyDoorGroup.rotation.y = studyDoorAngle;

    bookcaseOffset = THREE.MathUtils.damp(
      bookcaseOffset,
      flags.bookcaseSlid ? 2.25 : 0,
      3.0,
      delta,
    );
    secretBookcaseGroup.position.x = -9.1 + bookcaseOffset;

    gateLift = THREE.MathUtils.damp(
      gateLift,
      flags.conservatoryGateUnlocked ? 2.65 : 0,
      3.5,
      delta,
    );
    conservatoryGateGroup.position.y = gateLift;

    panelOffset = THREE.MathUtils.damp(
      panelOffset,
      flags.wallPassageOpened ? 2.05 : 0,
      3.0,
      delta,
    );
    wallPassagePanelGroup.position.x = 8.6 + panelOffset;

    nicheSlide = THREE.MathUtils.damp(
      nicheSlide,
      flags.mantleSolved ? 0.55 : 0,
      4.5,
      delta,
    );
    fireplace.nicheDoor.position.z = 1.38 + nicheSlide;

    // Grandfather Clock hands & pendulum swing
    if (flags.clockSolved) {
      // 11:45 -> hour near 12 (-11.75/12 * 2PI), minute at 9 (-0.75 * 2PI)
      clockObj.hourHand.rotation.z = THREE.MathUtils.damp(clockObj.hourHand.rotation.z, 0.14, 5, delta);
      clockObj.minuteHand.rotation.z = THREE.MathUtils.damp(clockObj.minuteHand.rotation.z, Math.PI * 0.5, 5, delta);
    }
    if (flags.pendulumInserted) {
      clockObj.pendulum.rotation.z = Math.sin(elapsed * 2.4) * 0.12;
    }

    // Lunar Astrolabe gentle gyroscopic motion
    astrolabe.rings.forEach((ring, i) => {
      ring.rotation.y += delta * (flags.astrolabeSolved ? 0.65 : 0.18) * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x += delta * 0.12;
    });
    astrolabe.medallion.rotation.y += delta * 0.9;

    // Subtle dust drift
    dustPoints.rotation.y = Math.sin(elapsed * 0.04) * 0.06;
  }

  function getRoomAt(
    x: number,
    z: number,
  ): { name: string; surface: 'marble' | 'wood' | 'stone'; dread: number } {
    if (x < -4.8 && z >= 3.2) {
      return { name: 'The Parlour', surface: 'wood', dread: 0.3 };
    }
    if (x < -4.8 && z < 3.2 && z >= -4.2) {
      return { name: 'Study & Library', surface: 'wood', dread: 0.42 };
    }
    if (x < -4.8 && z < -4.2) {
      return { name: 'Hidden Alcove', surface: 'wood', dread: 0.65 };
    }
    if (x >= -4.8 && x <= -0.4 && z < -3.7) {
      return { name: 'Occult Sanctum', surface: 'stone', dread: 0.92 };
    }
    if (z < -1.0 && x >= -0.4 && x <= 10.0) {
      return { name: 'Passage Within the Walls', surface: 'wood', dread: 0.85 };
    }
    if (x > 5.0) {
      return { name: 'Moonlit Conservatory', surface: 'stone', dread: 0.52 };
    }
    return { name: 'Grand Foyer', surface: 'marble', dread: 0.22 };
  }

  function dispose(): void {
    disposables.forEach((d) => d.dispose());
    Object.values(mats).forEach((m) => m.dispose());
    foyerWallMat.dispose();
    parlourWallMat.dispose();
    studyWallMat.dispose();
    conservatoryWallMat.dispose();
    passageWallMat.dispose();
  }

  return {
    colliders,
    interactables,
    flames,
    flickerLights,
    dustPoints,
    clockRefs: {
      hourHand: clockObj.hourHand,
      minuteHand: clockObj.minuteHand,
      pendulum: clockObj.pendulum,
    },
    mantleRefs: {
      nicheDoor: fireplace.nicheDoor,
      pendulumItem: fireplace.pendulumItem,
      chimeRods: fireplace.chimeRods,
    },
    studyDoorGroup,
    secretBookcaseGroup,
    conservatoryGateGroup,
    wallPassagePanelGroup,
    frescoMesh,
    astrolabeRefs: {
      rings: astrolabe.rings,
      medallion: astrolabe.medallion,
    },
    altarRefs: {
      relicMeshes: altar.relicMeshes,
      sigilRing: altar.sigilRing,
      sanctumLight,
    },
    musicBoxKeyMesh: teaTable.keyMesh,
    deskSheetMesh: desk.sheetMesh,
    deskWinchMesh: desk.winchHandleMesh,
    alcoveGearMesh,
    alcoveSealMesh,
    wallRingMesh,
    phosphorLensMesh,
    syncFlags,
    updateAnimations,
    getRoomAt,
    dispose,
  };
}
