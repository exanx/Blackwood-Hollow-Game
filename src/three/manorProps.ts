import * as THREE from 'three';

export interface MaterialPalette {
  mahogany: THREE.MeshStandardMaterial;
  darkOak: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  velvetCrimson: THREE.MeshStandardMaterial;
  parchment: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  obsidian: THREE.MeshStandardMaterial;
  wax: THREE.MeshStandardMaterial;
  flame: THREE.MeshBasicMaterial;
  silver: THREE.MeshStandardMaterial;
  moonstone: THREE.MeshStandardMaterial;
  ivory: THREE.MeshStandardMaterial;
}

export function createMaterialPalette(): MaterialPalette {
  return {
    mahogany: new THREE.MeshStandardMaterial({
      color: 0x3b2218,
      roughness: 0.72,
      metalness: 0.05,
      flatShading: true,
    }),
    darkOak: new THREE.MeshStandardMaterial({
      color: 0x241914,
      roughness: 0.85,
      metalness: 0.04,
      flatShading: true,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0xc29b57,
      roughness: 0.28,
      metalness: 0.88,
      flatShading: true,
    }),
    iron: new THREE.MeshStandardMaterial({
      color: 0x2a2d34,
      roughness: 0.52,
      metalness: 0.78,
      flatShading: true,
    }),
    velvetCrimson: new THREE.MeshStandardMaterial({
      color: 0x4b151a,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    }),
    parchment: new THREE.MeshStandardMaterial({
      color: 0xd2c4a8,
      roughness: 0.88,
      metalness: 0.0,
      flatShading: true,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0x353944,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    }),
    obsidian: new THREE.MeshStandardMaterial({
      color: 0x161820,
      roughness: 0.36,
      metalness: 0.22,
      flatShading: true,
    }),
    wax: new THREE.MeshStandardMaterial({
      color: 0xd9d2c0,
      roughness: 0.65,
      metalness: 0.0,
      flatShading: true,
    }),
    flame: new THREE.MeshBasicMaterial({
      color: 0xffb85c,
    }),
    silver: new THREE.MeshStandardMaterial({
      color: 0xbac4d4,
      roughness: 0.22,
      metalness: 0.92,
      flatShading: true,
    }),
    moonstone: new THREE.MeshStandardMaterial({
      color: 0x8bb8e8,
      emissive: 0x274c78,
      emissiveIntensity: 0.75,
      roughness: 0.18,
      metalness: 0.15,
      flatShading: true,
    }),
    ivory: new THREE.MeshStandardMaterial({
      color: 0xe2dac8,
      roughness: 0.45,
      metalness: 0.05,
      flatShading: true,
    }),
  };
}

export function addContactShadow(
  parent: THREE.Object3D,
  shadowTex: THREE.Texture,
  width: number,
  depth: number,
): void {
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.015;
  parent.add(plane);
}

export function createGrandfatherClock(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
  pendulum: THREE.Group;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 1.35, 0.95);

  // Base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.38, 0.56), mats.darkOak);
  base.position.y = 0.19;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Waist trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.55, 0.46), mats.mahogany);
  trunk.position.y = 0.38 + 0.775;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Recessed pendulum window backing
  const recess = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.95, 0.06), mats.obsidian);
  recess.position.set(0, 1.12, 0.22);
  group.add(recess);

  // Clock hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.78, 0.54), mats.mahogany);
  hood.position.y = 1.93 + 0.39;
  hood.castShadow = true;
  group.add(hood);

  // Pediment crown + brass finials
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.38, 4), mats.darkOak);
  crown.rotation.y = Math.PI / 4;
  crown.position.y = 2.71 + 0.19;
  group.add(crown);

  [-0.36, 0.36].forEach((fx) => {
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), mats.brass);
    finial.position.set(fx, 2.78, 0.2);
    group.add(finial);
  });

  // Dial face
  const dialRing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), mats.brass);
  dialRing.rotation.x = Math.PI / 2;
  dialRing.position.set(0, 2.32, 0.26);
  group.add(dialRing);

  const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.045, 16), mats.ivory);
  dialFace.rotation.x = Math.PI / 2;
  dialFace.position.set(0, 2.32, 0.265);
  group.add(dialFace);

  // Hands pivoted cleanly at center
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.14, 0.02), mats.obsidian);
  hourHand.geometry.translate(0, 0.055, 0);
  hourHand.position.set(0, 2.32, 0.295);
  group.add(hourHand);

  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.2, 0.02), mats.brass);
  minuteHand.geometry.translate(0, 0.085, 0);
  minuteHand.position.set(0, 2.32, 0.305);
  group.add(minuteHand);

  // Silver pendulum (hidden until inserted)
  const pendulum = new THREE.Group();
  pendulum.position.set(0, 1.56, 0.265);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), mats.silver);
  rod.position.y = -0.32;
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 10), mats.silver);
  bob.rotation.x = Math.PI / 2;
  bob.position.y = -0.66;
  pendulum.add(rod, bob);
  pendulum.visible = false;
  group.add(pendulum);

  return { group, hourHand, minuteHand, pendulum };
}

export function createChandelier(
  mats: MaterialPalette,
  flames: THREE.Mesh[],
): THREE.Group {
  const group = new THREE.Group();

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), mats.iron);
  chain.position.y = -0.55;
  group.add(chain);

  const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), mats.brass);
  hub.position.y = -1.15;
  group.add(hub);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 6, 12), mats.iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.25;
  group.add(ring);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const armX = Math.cos(angle) * 0.68;
    const armZ = Math.sin(angle) * 0.68;

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.05, 6), mats.brass);
    dish.position.set(armX, -1.2, armZ);
    group.add(dish);

    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.18, 6), mats.wax);
    candle.position.set(armX, -1.09, armZ);
    group.add(candle);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 5), mats.flame);
    flame.position.set(armX, -0.96, armZ);
    group.add(flame);
    flames.push(flame);
  }

  return group;
}

export function createFireplaceAndMantle(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  chimeRods: THREE.Mesh[];
  nicheDoor: THREE.Mesh;
  pendulumItem: THREE.Group;
  emberMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 1.8, 3.2);

  // Stone hearth base
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 2.8), mats.stone);
  hearth.position.set(0.15, 0.08, 0);
  hearth.receiveShadow = true;
  group.add(hearth);

  // Chimney surround pillars & hood
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.3, 2.4), mats.stone);
  backWall.position.set(-0.22, 1.15, 0);
  group.add(backWall);

  [-0.88, 0.88].forEach((pz) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.42), mats.mahogany);
    pillar.position.set(0.12, 0.88, pz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Mantle shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 2.55), mats.mahogany);
  shelf.position.set(0.18, 1.72, 0);
  shelf.castShadow = true;
  group.add(shelf);

  // Upper chimney breast
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.7, 2.1), mats.stone);
  upper.position.set(-0.1, 3.15, 0);
  group.add(upper);

  // Glowing embers
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x3b120c,
    emissive: 0xd94814,
    emissiveIntensity: 1.4,
    roughness: 0.7,
    flatShading: true,
  });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 6), emberMat);
    log.rotation.x = Math.PI / 2 + (i - 1.5) * 0.16;
    log.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.25;
    log.position.set(0.14, 0.25 + (i % 2) * 0.05, (i - 1.5) * 0.18);
    group.add(log);
  }

  // Four brass mantle chime rods above shelf
  const chimeRods: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const height = 0.46 - i * 0.05;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, height, 6), mats.brass);
    rod.position.set(0.28, 1.82 + height / 2, -0.52 + i * 0.35);
    group.add(rod);
    chimeRods.push(rod);
  }

  // Hidden chimney brick niche on right side (Z = +1.35)
  const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.55), mats.obsidian);
  nicheFrame.position.set(-0.08, 1.15, 1.38);
  group.add(nicheFrame);

  const nicheDoor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.48), mats.stone);
  nicheDoor.position.set(0.14, 1.15, 1.38);
  group.add(nicheDoor);

  const pendulumItem = new THREE.Group();
  pendulumItem.position.set(0.02, 1.08, 1.38);
  const pDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10), mats.silver);
  pDisc.rotation.z = Math.PI / 2;
  const pStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 6), mats.silver);
  pStem.position.y = 0.13;
  pendulumItem.add(pDisc, pStem);
  group.add(pendulumItem);

  return { group, chimeRods, nicheDoor, pendulumItem, emberMat };
}

export function createUprightPiano(mats: MaterialPalette, shadowTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 2.0, 1.1);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.32, 0.56), mats.mahogany);
  body.position.y = 0.66;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const keybed = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.14, 0.36), mats.darkOak);
  keybed.position.set(0, 0.72, 0.36);
  group.add(keybed);

  const whiteKeys = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 0.24), mats.ivory);
  whiteKeys.position.set(0, 0.8, 0.38);
  group.add(whiteKeys);

  // Black sharp keys
  for (let i = 0; i < 14; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.14), mats.obsidian);
    key.position.set(-0.66 + i * 0.1, 0.825, 0.33);
    group.add(key);
  }

  // Brass sheet music ledge + sheet
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.02), mats.parchment);
  sheet.position.set(0, 1.12, 0.29);
  sheet.rotation.x = -0.15;
  group.add(sheet);

  // Piano stool
  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 8), mats.velvetCrimson);
  stoolSeat.position.set(0, 0.48, 0.86);
  const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.44, 6), mats.darkOak);
  stoolLeg.position.set(0, 0.22, 0.86);
  group.add(stoolSeat, stoolLeg);

  return group;
}

export function createVelvetArmchair(mats: MaterialPalette, shadowTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 1.2, 1.2);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.24, 0.82), mats.velvetCrimson);
  seat.position.y = 0.36;
  seat.castShadow = true;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.72, 0.2), mats.velvetCrimson);
  back.position.set(0, 0.74, -0.32);
  back.castShadow = true;
  group.add(back);

  [-0.38, 0.38].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.78), mats.velvetCrimson);
    arm.position.set(ax, 0.54, 0.02);
    group.add(arm);
  });

  [
    [-0.34, -0.32],
    [0.34, -0.32],
    [-0.34, 0.32],
    [0.34, 0.32],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.24, 6), mats.darkOak);
    leg.position.set(lx, 0.12, lz);
    group.add(leg);
  });

  return group;
}

export function createTeaTableWithMusicBox(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  keyMesh: THREE.Group;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 1.35, 1.35);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.56, 0.07, 10), mats.mahogany);
  top.position.y = 0.68;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 0.64, 8), mats.darkOak);
  stem.position.y = 0.34;
  group.add(stem);

  // Ornate Music Box
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.26), mats.darkOak);
  box.position.set(0, 0.78, 0);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.26), mats.brass);
  lid.position.set(0, 0.87, -0.1);
  lid.rotation.x = -0.65;
  group.add(box, lid);

  // Brass Skeleton Key nestled inside
  const keyMesh = new THREE.Group();
  keyMesh.position.set(0, 0.86, 0.02);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 5, 8), mats.brass);
  bow.rotation.x = Math.PI / 2;
  bow.position.x = -0.06;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), mats.brass);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.02;
  const bit = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.035), mats.brass);
  bit.position.set(0.075, 0, 0.018);
  keyMesh.add(bow, shaft, bit);
  group.add(keyMesh);

  return { group, keyMesh };
}

export function createWritingDesk(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  sheetMesh: THREE.Mesh;
  winchHandleMesh: THREE.Group;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 2.3, 1.3);

  // Twin pedestals
  [-0.75, 0.75].forEach((px) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.74, 0.92), mats.darkOak);
    ped.position.set(px, 0.37, 0);
    ped.castShadow = true;
    ped.receiveShadow = true;
    group.add(ped);
  });

  // Desktop
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.04), mats.mahogany);
  top.position.y = 0.79;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Leather blotter
  const blotter = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.62), mats.velvetCrimson);
  blotter.position.set(0, 0.85, 0.05);
  group.add(blotter);

  // Torn Sheet Music on desk
  const sheetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.42), mats.parchment);
  sheetMesh.position.set(-0.22, 0.865, 0.08);
  sheetMesh.rotation.y = 0.18;
  group.add(sheetMesh);

  // Brass Inkwell
  const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.08, 6), mats.brass);
  inkwell.position.set(0.28, 0.88, -0.15);
  group.add(inkwell);

  // Iron Winch Handle beside desk edge
  const winchHandleMesh = new THREE.Group();
  winchHandleMesh.position.set(0.58, 0.86, 0.14);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.05), mats.iron);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6), mats.mahogany);
  grip.rotation.x = Math.PI / 2;
  grip.position.set(0.14, 0.02, 0.06);
  winchHandleMesh.add(arm, grip);
  group.add(winchHandleMesh);

  return { group, sheetMesh, winchHandleMesh };
}

export function createBookcase(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
  width = 2.1,
  height = 3.1,
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, width + 0.3, 0.85);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.48), mats.darkOak);
  frame.position.y = height / 2;
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  const bookColors = [0x591d22, 0x223843, 0x3f4a2e, 0x5c4328, 0x2e283b];
  const bookMats = bookColors.map(
    (c) =>
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.78,
        metalness: 0.05,
        flatShading: true,
      }),
  );

  for (let shelfIdx = 0; shelfIdx < 4; shelfIdx++) {
    const sy = 0.42 + shelfIdx * 0.66;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.14, 0.06, 0.44), mats.mahogany);
    shelf.position.set(0, sy, 0.04);
    group.add(shelf);

    // Low-poly books
    let cursorX = -width / 2 + 0.22;
    let bi = shelfIdx * 5;
    while (cursorX < width / 2 - 0.24) {
      const bw = 0.075 + ((bi % 3) * 0.02);
      const bh = 0.34 + ((bi % 4) * 0.04);
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.32), bookMats[bi % bookMats.length]);
      book.position.set(cursorX, sy + 0.03 + bh / 2, 0.06);
      group.add(book);
      cursorX += bw + 0.022;
      bi++;
    }
  }

  return group;
}

export function createLunarAstrolabe(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  rings: THREE.Mesh[];
  medallion: THREE.Mesh;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 1.5, 1.5);

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 1.05, 8), mats.stone);
  plinth.position.y = 0.525;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.48, 0.12, 8), mats.brass);
  collar.position.y = 1.1;
  group.add(collar);

  const rings: THREE.Mesh[] = [];
  const radii = [0.42, 0.31, 0.21];
  radii.forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.024, 6, 14), mats.brass);
    ring.position.y = 1.65;
    ring.rotation.x = idx * 0.55;
    ring.rotation.y = idx * 0.7;
    group.add(ring);
    rings.push(ring);
  });

  const medallion = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), mats.moonstone);
  medallion.position.y = 1.65;
  group.add(medallion);

  return { group, rings, medallion };
}

export function createSanctumAltar(
  mats: MaterialPalette,
  shadowTex: THREE.Texture,
): {
  group: THREE.Group;
  relicMeshes: {
    crimson_seal: THREE.Mesh;
    moonstone_medallion: THREE.Mesh;
    signet_ring: THREE.Mesh;
  };
  sigilRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  addContactShadow(group, shadowTex, 2.2, 1.6);

  const step = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 1.35), mats.stone);
  step.position.y = 0.09;
  step.receiveShadow = true;
  group.add(step);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.92, 0.92), mats.obsidian);
  body.position.y = 0.64;
  body.castShadow = true;
  group.add(body);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 1.08), mats.stone);
  slab.position.y = 1.14;
  group.add(slab);

  const sigilMat = new THREE.MeshStandardMaterial({
    color: 0x7c1f22,
    emissive: 0x6b1418,
    emissiveIntensity: 0.9,
    roughness: 0.35,
    flatShading: true,
  });
  const sigilRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 12), sigilMat);
  sigilRing.rotation.x = Math.PI / 2;
  sigilRing.position.y = 1.21;
  group.add(sigilRing);

  // Three Relic Slots (hidden until placed)
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x9e2a2b,
    emissive: 0x4b0d0e,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    flatShading: true,
  });
  const crimsonSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), crimsonMat);
  crimsonSeal.position.set(-0.42, 1.24, 0.12);
  crimsonSeal.visible = false;

  const moonstoneMedallion = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), mats.moonstone);
  moonstoneMedallion.position.set(0, 1.26, -0.15);
  moonstoneMedallion.visible = false;

  const signetRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 6, 10), mats.silver);
  signetRing.rotation.x = Math.PI / 2;
  signetRing.position.set(0.42, 1.24, 0.12);
  signetRing.visible = false;

  group.add(crimsonSeal, moonstoneMedallion, signetRing);

  return {
    group,
    relicMeshes: {
      crimson_seal: crimsonSeal,
      moonstone_medallion: moonstoneMedallion,
      signet_ring: signetRing,
    },
    sigilRing,
  };
}

export function createWallSconce(
  mats: MaterialPalette,
  flames: THREE.Mesh[],
): THREE.Group {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.04), mats.brass);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), mats.iron);
  arm.position.set(0, -0.04, 0.11);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.18, 6), mats.wax);
  candle.position.set(0, 0.07, 0.2);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 5), mats.flame);
  flame.position.set(0, 0.2, 0.2);
  flames.push(flame);
  group.add(plate, arm, candle, flame);
  return group;
}

export function createGothicWindow(mats: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x3b587a,
    emissive: 0x1d314d,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
  });

  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.7), glassMat);
  pane.position.y = 1.35;
  group.add(pane);

  // Mullions
  [-0.72, 0, 0.72].forEach((mx) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.8, 0.12), mats.obsidian);
    bar.position.set(mx, 1.4, 0.03);
    group.add(bar);
  });
  [0, 1.0, 2.0, 2.8].forEach((my) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.09, 0.12), mats.obsidian);
    bar.position.set(0, my, 0.03);
    group.add(bar);
  });

  return group;
}
