import * as THREE from 'three';

const styles = {
  dumpling: { wall: '#efd6a6', side: '#d7b67e', floor: '#a8754e', accent: '#a94f3f', background: '#d8c9aa', name: '红木暖居 · 花香满屋' },
  tofu: { wall: '#eadcc2', side: '#c98468', floor: '#c58b70', accent: '#9e4033', background: '#d8c5ae', name: '川味厨房 · 热辣烟火' },
  curry: { wall: '#cbd8bd', side: '#aebf9f', floor: '#d5b487', accent: '#d3a13c', background: '#d8dfca', name: '森系小家 · 清新明亮' },
  pork: { wall: '#b8a7b8', side: '#8d778c', floor: '#765c50', accent: '#6e4a60', background: '#c9bcc2', name: '复古餐厅 · 黑胶相伴' }
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...options });
}

function mesh(geometry, mat, x = 0, y = 0, z = 0, shadows = true) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = shadows;
  object.receiveShadow = shadows;
  return object;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
}

function cylinder(rt, rb, h, segments, mat, x = 0, y = 0, z = 0) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat, x, y, z);
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function floorMaterial(id, base) {
  const texture = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);
    if (id === 'tofu') {
      ctx.strokeStyle = 'rgba(102,65,50,.22)';
      ctx.lineWidth = 5;
      for (let i = 0; i <= 512; i += 128) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      return;
    }
    for (let y = 0; y < 512; y += 86) {
      ctx.fillStyle = y % 172 ? 'rgba(255,240,207,.045)' : 'rgba(52,31,20,.035)';
      ctx.fillRect(0, y, 512, 84);
      ctx.strokeStyle = 'rgba(55,35,24,.22)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      const offset = (y / 86) % 2 ? 130 : 350;
      ctx.beginPath(); ctx.moveTo(offset, y); ctx.lineTo(offset, y + 86); ctx.stroke();
      for (let x = 25; x < 512; x += 95) {
        ctx.strokeStyle = 'rgba(71,42,26,.07)';
        ctx.beginPath(); ctx.moveTo(x, y + 25); ctx.bezierCurveTo(x + 20, y + 15, x + 45, y + 45, x + 70, y + 28); ctx.stroke();
      }
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 });
}

function wallpaperMaterial(id, base) {
  const texture = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    if (id === 'dumpling') {
      for (let y = 32; y < 256; y += 64) {
        for (let x = 32; x < 256; x += 64) {
          ctx.fillStyle = 'rgba(151,100,67,.12)';
          for (let p = 0; p < 5; p++) {
            const a = p * Math.PI * 0.4;
            ctx.beginPath(); ctx.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(171,115,64,.2)';
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (id === 'tofu') {
      ctx.strokeStyle = 'rgba(130,92,68,.12)';
      ctx.lineWidth = 3;
      for (let y = 0; y < 256; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        for (let x = (y / 48) % 2 ? 0 : 64; x < 256; x += 128) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 48); ctx.stroke();
        }
      }
    } else if (id === 'pork') {
      ctx.strokeStyle = 'rgba(255,237,219,.07)';
      ctx.lineWidth = 2;
      for (let x = 16; x < 256; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96 });
}

function addRug(group, w, d, color, border, x = 0, z = -0.5) {
  const rug = new THREE.Group();
  rug.position.set(x, 0.025, z);
  rug.add(box(w, 0.035, d, material(color), 0, 0, 0));
  rug.add(box(w - 0.22, 0.012, 0.055, material(border), 0, 0.025, d / 2 - 0.15));
  rug.add(box(w - 0.22, 0.012, 0.055, material(border), 0, 0.025, -d / 2 + 0.15));
  rug.add(box(0.055, 0.012, d - 0.22, material(border), w / 2 - 0.15, 0.025, 0));
  rug.add(box(0.055, 0.012, d - 0.22, material(border), -w / 2 + 0.15, 0.025, 0));
  group.add(rug);
}

function addChair(group, x, z, rotation, wood, cushion) {
  const chair = new THREE.Group();
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  chair.add(box(0.88, 0.16, 0.86, wood, 0, 0.72, 0));
  chair.add(box(0.76, 0.12, 0.74, cushion, 0, 0.84, 0.02));
  chair.add(box(0.88, 0.92, 0.13, wood, 0, 1.23, -0.38));
  chair.add(box(0.65, 0.42, 0.08, cushion, 0, 1.32, -0.29));
  [-0.32, 0.32].forEach((px) => [-0.3, 0.3].forEach((pz) => chair.add(box(0.1, 0.72, 0.1, wood, px, 0.36, pz))));
  group.add(chair);
}

function addDiningTable(group, wood, round = false) {
  const table = new THREE.Group();
  table.position.set(0, 0, -0.8);
  if (round) {
    table.add(cylinder(1.52, 1.52, 0.18, 32, wood, 0, 1.25, 0));
    table.add(cylinder(0.22, 0.28, 1.18, 12, wood, 0, 0.62, 0));
    table.add(cylinder(0.72, 0.82, 0.13, 16, wood, 0, 0.08, 0));
  } else {
    table.add(box(3.05, 0.18, 1.72, wood, 0, 1.25, 0));
    [-1.25, 1.25].forEach((x) => [-0.59, 0.59].forEach((z) => table.add(box(0.14, 1.18, 0.14, wood, x, 0.61, z))));
  }
  group.add(table);
}

function addDish(group, id) {
  const setting = new THREE.Group();
  setting.position.set(0, 1.39, -0.55);
  const ceramic = material('#fff2d8', { roughness: 0.45 });
  const rim = material('#d9e2d1', { roughness: 0.5 });
  if (id === 'dumpling') {
    setting.add(cylinder(0.69, 0.58, 0.1, 28, ceramic, 0, 0, 0));
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const dumpling = mesh(new THREE.SphereGeometry(0.18, 12, 8), material('#f3dfb5'), Math.cos(a) * 0.39, 0.13, Math.sin(a) * 0.34);
      dumpling.scale.set(1.25, 0.6, 0.75);
      dumpling.rotation.y = -a;
      setting.add(dumpling);
    }
  } else if (id === 'tofu') {
    setting.add(cylinder(0.63, 0.42, 0.28, 24, ceramic, 0, 0.04, 0));
    setting.add(cylinder(0.54, 0.54, 0.045, 24, material('#a93626'), 0, 0.2, 0));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1;
      setting.add(box(0.19, 0.13, 0.19, material('#f1d9ad'), Math.cos(a) * 0.34, 0.25, Math.sin(a) * 0.3));
    }
    for (let i = 0; i < 5; i++) setting.add(mesh(new THREE.SphereGeometry(0.045, 7, 5), material('#54834d'), Math.cos(i * 2.3) * 0.4, 0.34, Math.sin(i * 2.3) * 0.3));
  } else if (id === 'curry') {
    setting.add(cylinder(0.72, 0.62, 0.09, 28, ceramic, 0, 0, 0));
    const rice = mesh(new THREE.SphereGeometry(0.35, 18, 12), material('#fff3d8'), -0.25, 0.19, 0);
    rice.scale.y = 0.72;
    setting.add(rice);
    const curry = mesh(new THREE.SphereGeometry(0.4, 18, 10), material('#bd772d'), 0.27, 0.12, 0);
    curry.scale.set(1, 0.35, 0.85);
    setting.add(curry);
    [[0.18, 0.25, 0.08], [0.4, 0.22, -0.12], [0.25, 0.22, 0.25]].forEach(([x, y, z]) => setting.add(box(0.16, 0.13, 0.16, material('#e2ad45'), x, y, z)));
  } else {
    setting.add(cylinder(0.72, 0.61, 0.1, 28, ceramic, 0, 0, 0));
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      const pork = box(0.26, 0.2, 0.25, material(i % 2 ? '#7d3425' : '#9b472b', { roughness: 0.35 }), Math.cos(a) * 0.36, 0.16 + (i % 3) * 0.07, Math.sin(a) * 0.31);
      pork.rotation.y = a;
      setting.add(pork);
    }
    for (let i = 0; i < 4; i++) setting.add(mesh(new THREE.IcosahedronGeometry(0.13, 0), material('#507447'), -0.5 + i * 0.3, 0.16, -0.43));
  }
  setting.add(cylinder(0.19, 0.14, 0.13, 20, rim, 1.0, 0.02, 0.18));
  const chopstick = material('#71452e');
  const stickA = cylinder(0.018, 0.018, 0.92, 6, chopstick, -0.92, 0.1, 0.05);
  stickA.rotation.z = Math.PI / 2;
  stickA.rotation.y = 0.12;
  const stickB = stickA.clone();
  stickB.position.z += 0.1;
  setting.add(stickA, stickB);
  group.add(setting);
}

function addPlant(group, x, z, scale = 1, potColor = '#b97751') {
  const plant = new THREE.Group();
  plant.position.set(x, 0, z);
  plant.scale.setScalar(scale);
  plant.add(cylinder(0.32, 0.24, 0.52, 12, material(potColor), 0, 0.27, 0));
  const leaf = material('#537653', { flatShading: true });
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    const foliage = mesh(new THREE.IcosahedronGeometry(0.33, 0), leaf, Math.cos(a) * 0.27, 0.73 + (i % 3) * 0.23, Math.sin(a) * 0.25);
    foliage.scale.set(0.7, 1.5, 0.65);
    foliage.rotation.z = Math.cos(a) * 0.45;
    plant.add(foliage);
  }
  group.add(plant);
}

function addSofa(group, x, z, rotation, color, cushionColor) {
  const sofa = new THREE.Group();
  sofa.position.set(x, 0, z);
  sofa.rotation.y = rotation;
  const upholstery = material(color);
  sofa.add(box(2.75, 0.48, 1.05, upholstery, 0, 0.47, 0));
  sofa.add(box(2.75, 1.15, 0.32, upholstery, 0, 1.05, -0.43));
  sofa.add(box(0.3, 0.78, 1.12, upholstery, -1.27, 0.72, 0));
  sofa.add(box(0.3, 0.78, 1.12, upholstery, 1.27, 0.72, 0));
  sofa.add(box(1.03, 0.17, 0.79, material(cushionColor), -0.56, 0.79, 0.08));
  sofa.add(box(1.03, 0.17, 0.79, material(cushionColor), 0.56, 0.79, 0.08));
  const pillow = box(0.53, 0.53, 0.18, material('#e5bc69'), -0.72, 1.13, -0.16);
  pillow.rotation.z = -0.15;
  sofa.add(pillow);
  group.add(sofa);
}

function addSideboard(group, x, z, width, wood) {
  const cabinet = new THREE.Group();
  cabinet.position.set(x, 0, z);
  cabinet.add(box(width, 1.18, 0.75, wood, 0, 0.68, 0));
  cabinet.add(box(width + 0.16, 0.12, 0.86, wood, 0, 1.32, 0));
  const trim = material('#d7ae6c', { metalness: 0.2 });
  for (let i = -1; i <= 1; i++) {
    cabinet.add(box(0.035, 0.88, 0.03, trim, i * width / 3, 0.68, 0.39));
    cabinet.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), trim, i * width / 3 + 0.18, 0.78, 0.43));
  }
  group.add(cabinet);
  return cabinet;
}

function addWallArt(group, x, y, width, height, draw, frameColor = '#6e5038', z = -4.86) {
  const texture = canvasTexture(384, 300, draw);
  const frame = new THREE.Group();
  frame.position.set(x, y, z);
  frame.add(box(width + 0.16, height + 0.16, 0.1, material(frameColor), 0, 0, 0));
  frame.add(mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }), 0, 0, 0.061, false));
  group.add(frame);
}

function addWindow(group, x, width, curtainColor, z = -4.83) {
  const windowGroup = new THREE.Group();
  windowGroup.position.set(x, 2.75, z);
  const frame = material('#f7e8c9');
  const glass = material('#9fc8c2', { emissive: '#8bb6b0', emissiveIntensity: 0.18, roughness: 0.25 });
  windowGroup.add(box(width + 0.18, 2.05, 0.12, frame));
  windowGroup.add(box(width, 1.86, 0.14, glass, 0, 0, 0.04));
  windowGroup.add(box(0.07, 1.86, 0.05, frame, 0, 0, 0.14));
  windowGroup.add(box(width, 0.07, 0.05, frame, 0, 0, 0.14));
  windowGroup.add(box(width + 0.5, 0.08, 0.08, material('#6b5542'), 0, 1.18, 0.18));
  windowGroup.add(box(0.38, 2.25, 0.16, material(curtainColor), -width / 2 - 0.12, 0.03, 0.2));
  windowGroup.add(box(0.38, 2.25, 0.16, material(curtainColor), width / 2 + 0.12, 0.03, 0.2));
  group.add(windowGroup);
}

function addPendant(scene, group, x, z, color) {
  group.add(cylinder(0.025, 0.025, 1.45, 8, material('#4c443a'), x, 4.3, z));
  group.add(cylinder(0.18, 0.65, 0.55, 24, material(color), x, 3.45, z));
  group.add(cylinder(0.48, 0.48, 0.04, 24, material('#ffe3a1', { emissive: '#ffc76c', emissiveIntensity: 0.8 }), x, 3.18, z));
  const light = new THREE.PointLight('#ffd494', 16, 10, 2);
  light.position.set(x, 3.05, z);
  scene.add(light);
}

function addBookshelf(group, x, z, width, wood) {
  const shelf = new THREE.Group();
  shelf.position.set(x, 0, z);
  shelf.add(box(width, 2.75, 0.42, wood, 0, 1.45, 0));
  shelf.add(box(width - 0.18, 2.48, 0.45, material('#d5bd91'), 0, 1.46, 0.05));
  for (let row = 0; row < 3; row++) {
    shelf.add(box(width, 0.1, 0.58, wood, 0, 0.55 + row * 0.78, 0.1));
    for (let i = 0; i < 7; i++) {
      const colors = ['#9b5545', '#d2a54f', '#637b67', '#706279', '#d9c49a'];
      const book = box(0.14 + (i % 2) * 0.04, 0.45 + (i % 3) * 0.06, 0.3, material(colors[(i + row) % colors.length]), -width / 2 + 0.25 + i * (width - 0.5) / 7, 0.84 + row * 0.78, 0.36);
      book.rotation.z = i === 5 ? 0.12 : 0;
      shelf.add(book);
    }
  }
  group.add(shelf);
}

function addHost(group, id) {
  const host = new THREE.Group();
  host.position.set(0, 0, -2.35);
  const palettes = {
    dumpling: ['#8f5c66', '#d6c5b7', '#f0c5a0'],
    tofu: ['#f1e6d2', '#3e3430', '#eeb98f'],
    curry: ['#d6a846', '#67473a', '#f1c29c'],
    pork: ['#536c68', '#3a302d', '#e7b38c']
  };
  const [shirt, hair, skin] = palettes[id];
  host.add(mesh(new THREE.CapsuleGeometry(0.46, 0.65, 5, 10), material(shirt), 0, 1.15, 0));
  host.add(mesh(new THREE.SphereGeometry(0.41, 16, 12), material(skin), 0, 2.0, 0));
  host.add(mesh(new THREE.SphereGeometry(0.425, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), material(hair), 0, 2.08, -0.02));
  const eyes = new THREE.MeshBasicMaterial({ color: '#3c332e' });
  host.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), eyes, -0.14, 2.01, 0.39, false));
  host.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), eyes, 0.14, 2.01, 0.39, false));
  const armA = mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 8), material(shirt), -0.5, 1.3, 0.15);
  const armB = armA.clone(); armB.position.x = 0.5;
  armA.rotation.x = armB.rotation.x = -0.75;
  host.add(armA, armB);
  if (id === 'dumpling') host.add(mesh(new THREE.SphereGeometry(0.22, 12, 8), material(hair), 0, 2.42, -0.12));
  if (id === 'tofu') {
    host.add(cylinder(0.43, 0.43, 0.18, 20, material('#fff5df'), 0, 2.35, 0));
    host.add(mesh(new THREE.SphereGeometry(0.37, 16, 10), material('#fff5df'), 0, 2.52, 0));
    host.add(box(0.54, 0.78, 0.05, material('#b94e3d'), 0, 1.12, 0.43));
  }
  if (id === 'curry') {
    host.add(box(0.18, 0.75, 0.18, material(hair), -0.34, 1.83, -0.08));
    host.add(box(0.18, 0.75, 0.18, material(hair), 0.34, 1.83, -0.08));
  }
  if (id === 'pork') host.add(box(0.35, 0.16, 0.08, material(hair), 0, 1.79, 0.36));
  group.add(host);
}

function addExitMat(group, accent) {
  group.add(box(1.65, 0.045, 0.8, material(accent), 0, 0.04, 4.18));
  const arrow = new THREE.Shape();
  arrow.moveTo(-0.35, -0.12); arrow.lineTo(0.12, -0.12); arrow.lineTo(0.12, -0.3);
  arrow.lineTo(0.48, 0); arrow.lineTo(0.12, 0.3); arrow.lineTo(0.12, 0.12); arrow.lineTo(-0.35, 0.12);
  const arrowMesh = mesh(new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: '#fff2d2', side: THREE.DoubleSide }), 0, 0.07, 4.18, false);
  arrowMesh.rotation.x = -Math.PI / 2;
  arrowMesh.rotation.z = -Math.PI / 2;
  group.add(arrowMesh);
}

function decorateDumpling(scene, group, obstacles) {
  const wood = material('#76503a');
  const red = material('#a84f43');
  addRug(group, 4.8, 3.65, '#a95848', '#d9ae62');
  addDiningTable(group, wood, true);
  addChair(group, -2.05, -0.8, -Math.PI / 2, wood, red);
  addChair(group, 2.05, -0.8, Math.PI / 2, wood, red);
  addDish(group, 'dumpling');
  addSofa(group, -4.85, 0.65, Math.PI / 2, '#986554', '#d6b77b');
  addSideboard(group, -3.55, -4.35, 2.65, wood);
  addPlant(group, 4.75, -3.85, 1.2, '#a85f42');
  addPlant(group, -4.8, 3.55, 0.85, '#b98051');
  addWindow(group, 2.8, 2.25, '#a95548');
  addWallArt(group, -1.2, 3.05, 1.75, 1.25, (ctx, w, h) => {
    ctx.fillStyle = '#f4e4bc'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#694b38'; ctx.textAlign = 'center'; ctx.font = '700 66px "Noto Sans SC", sans-serif';
    ctx.fillText('家和', w / 2, 125); ctx.fillText('万事兴', w / 2, 220);
  });
  const tea = material('#d7dfc3', { roughness: 0.4 });
  group.add(cylinder(0.25, 0.2, 0.35, 16, tea, -3.55, 1.58, -4.28));
  group.add(cylinder(0.12, 0.09, 0.15, 14, tea, -2.95, 1.48, -4.15));
  group.add(cylinder(0.12, 0.09, 0.15, 14, tea, -4.15, 1.48, -4.15));
  addPendant(scene, group, 0, -0.8, '#a64b3e');
  obstacles.push({ x: -4.85, z: 0.65, hx: 0.85, hz: 1.65 }, { x: -3.55, z: -4.1, hx: 1.55, hz: 0.65 });
}

function decorateTofu(scene, group, obstacles) {
  const wood = material('#795444');
  const red = material('#a64134');
  const steel = material('#a8a9a0', { metalness: 0.5, roughness: 0.4 });
  addRug(group, 4.6, 3.5, '#b45240', '#e2b783');
  addDiningTable(group, wood);
  addChair(group, -2.05, -0.8, -Math.PI / 2, red, material('#d9b186'));
  addChair(group, 2.05, -0.8, Math.PI / 2, red, material('#d9b186'));
  addDish(group, 'tofu');
  group.add(box(6.6, 1.25, 0.9, material('#9a493c'), -0.6, 0.67, -4.25));
  group.add(box(6.8, 0.14, 1.02, material('#e0cfaf'), -0.6, 1.36, -4.22));
  for (let x = -3.2; x <= 2.1; x += 1.3) group.add(box(0.05, 0.85, 0.05, material('#e1b486'), x, 0.72, -3.77));
  group.add(box(1.25, 0.06, 0.72, material('#3e3b36'), -1.6, 1.46, -4.1));
  group.add(cylinder(0.42, 0.35, 0.32, 20, steel, -1.6, 1.64, -4.08));
  group.add(cylinder(0.46, 0.46, 0.06, 20, steel, -1.6, 1.84, -4.08));
  group.add(box(2.0, 0.82, 0.55, material('#b85847'), 1.65, 3.55, -4.53));
  group.add(box(0.06, 0.65, 0.04, material('#e0b586'), 1.65, 3.55, -4.23));
  addWindow(group, -2.35, 1.7, '#d49a69');
  addWallArt(group, 4.25, 2.8, 1.5, 1.65, (ctx, w, h) => {
    ctx.fillStyle = '#34433a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8d8b4'; ctx.lineWidth = 5; ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = '#f4e6c7'; ctx.textAlign = 'center'; ctx.font = '700 46px "Noto Sans SC", sans-serif';
    ctx.fillText('今日菜单', w / 2, 85); ctx.font = '700 56px "Noto Sans SC", sans-serif'; ctx.fillText('麻婆豆腐', w / 2, 175);
    ctx.font = '28px sans-serif'; ctx.fillText('米饭管够！', w / 2, 240);
  }, '#79503c');
  const spiceColors = ['#b8442f', '#d68e37', '#806143', '#d6b25f', '#8b3c2c'];
  for (let i = 0; i < 5; i++) {
    group.add(cylinder(0.12, 0.12, 0.33 + (i % 2) * 0.09, 12, material(spiceColors[i]), -0.2 + i * 0.37, 1.64, -4.1));
    group.add(cylinder(0.13, 0.13, 0.04, 12, steel, -0.2 + i * 0.37, 1.84 + (i % 2) * 0.045, -4.1));
  }
  for (let i = 0; i < 6; i++) {
    const chili = mesh(new THREE.CapsuleGeometry(0.055, 0.22, 3, 6), material('#b52e25'), -5.68, 2.85 - i * 0.3, -2.6 + (i % 2) * 0.18);
    chili.rotation.z = i % 2 ? 0.35 : -0.35;
    group.add(chili);
  }
  addPlant(group, 4.8, 3.45, 0.85, '#9c4c3b');
  addPendant(scene, group, 0, -0.8, '#97392f');
  obstacles.push({ x: -0.6, z: -4.15, hx: 3.6, hz: 0.7 });
}

function decorateCurry(scene, group, obstacles) {
  const wood = material('#b28c5e');
  const white = material('#eee5ce');
  const yellow = material('#d6a641');
  addRug(group, 4.9, 3.7, '#e4d7b5', '#a7ad79');
  addDiningTable(group, white);
  addChair(group, -2.05, -0.8, -Math.PI / 2, wood, yellow);
  addChair(group, 2.05, -0.8, Math.PI / 2, wood, yellow);
  addDish(group, 'curry');
  addSofa(group, -4.85, 0.7, Math.PI / 2, '#7e9774', '#e3c774');
  addBookshelf(group, -3.6, -4.45, 2.6, wood);
  addPlant(group, 4.75, -3.85, 1.35, '#d9c39b');
  addPlant(group, -4.75, 3.55, 0.95, '#c68c62');
  addPlant(group, 4.6, 2.75, 0.65, '#e1c78f');
  addWindow(group, 2.45, 2.8, '#f0d488');
  addWallArt(group, -0.6, 3.0, 1.45, 1.55, (ctx, w, h) => {
    ctx.fillStyle = '#f5efd9'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#718568'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(w / 2, h - 30); ctx.quadraticCurveTo(w / 2 - 25, h / 2, w / 2 + 20, 35); ctx.stroke();
    ctx.fillStyle = '#9dad7d';
    [[130, 100, -0.6], [225, 135, 0.6], [130, 190, -0.5], [220, 230, 0.5]].forEach(([x, y, r]) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.ellipse(0, 0, 55, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }, '#9a8057');
  addPendant(scene, group, 0, -0.8, '#d8b44f');
  obstacles.push({ x: -4.85, z: 0.7, hx: 0.85, hz: 1.65 }, { x: -3.6, z: -4.2, hx: 1.5, hz: 0.6 });
}

function decoratePork(scene, group, obstacles) {
  const wood = material('#4f3c35');
  const leather = material('#6e493e');
  const cushion = material('#9a6d61');
  addRug(group, 4.9, 3.7, '#67485b', '#c59a75');
  addDiningTable(group, wood);
  addChair(group, -2.05, -0.8, -Math.PI / 2, wood, cushion);
  addChair(group, 2.05, -0.8, Math.PI / 2, wood, cushion);
  addDish(group, 'pork');
  addSofa(group, -4.85, 0.7, Math.PI / 2, '#69483f', '#966757');
  const cabinet = addSideboard(group, -3.55, -4.35, 2.75, wood);
  cabinet.add(box(1.05, 0.15, 0.62, material('#342f2d'), -0.45, 1.48, 0));
  const vinyl = cylinder(0.29, 0.29, 0.025, 28, material('#252426'), -0.45, 1.58, 0);
  cabinet.add(vinyl);
  cabinet.add(cylinder(0.07, 0.07, 0.03, 16, material('#c07956'), -0.45, 1.6, 0));
  const tonearm = box(0.04, 0.04, 0.48, material('#c6b8a1', { metalness: 0.6 }), -0.02, 1.62, 0);
  tonearm.rotation.y = -0.4;
  cabinet.add(tonearm);
  addWindow(group, 2.8, 2.1, '#705165');
  addWallArt(group, -0.85, 3.0, 1.55, 1.3, (ctx, w, h) => {
    ctx.fillStyle = '#d9b991'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7e8b72'; ctx.beginPath(); ctx.moveTo(0, 240); ctx.lineTo(120, 90); ctx.lineTo(205, 210); ctx.lineTo(290, 115); ctx.lineTo(w, 235); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = '#b46f52'; ctx.beginPath(); ctx.arc(295, 65, 30, 0, Math.PI * 2); ctx.fill();
  }, '#4e3b34');
  const lamp = new THREE.Group();
  lamp.position.set(4.7, 0, -3.75);
  lamp.add(cylinder(0.07, 0.09, 2.8, 10, material('#493e38'), 0, 1.45, 0));
  lamp.add(cylinder(0.34, 0.45, 0.12, 16, material('#493e38'), 0, 0.08, 0));
  lamp.add(cylinder(0.36, 0.7, 0.85, 24, material('#d5aa78'), 0, 2.9, 0));
  group.add(lamp);
  const lampLight = new THREE.PointLight('#ffc985', 11, 7, 2);
  lampLight.position.set(4.7, 2.6, -3.75);
  scene.add(lampLight);
  addPlant(group, 4.75, 3.4, 0.85, '#7b594a');
  addPendant(scene, group, 0, -0.8, '#6a4a5e');
  obstacles.push({ x: -4.85, z: 0.7, hx: 0.85, hz: 1.65 }, { x: -3.55, z: -4.1, hx: 1.6, hz: 0.65 });
}

export function createInterior(neighbor) {
  const style = styles[neighbor.id];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(style.background);
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.HemisphereLight('#fff2d7', '#776451', 2.35));
  const light = new THREE.DirectionalLight('#fff0ce', 2.8);
  light.position.set(3, 10, 7);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -9;
  light.shadow.camera.right = 9;
  light.shadow.camera.top = 9;
  light.shadow.camera.bottom = -9;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 30;
  light.shadow.bias = -0.0007;
  scene.add(light);

  group.add(box(12.2, 0.35, 10.2, material('#655342'), 0, -0.2, 0));
  group.add(box(12, 0.12, 10, floorMaterial(neighbor.id, style.floor), 0, -0.01, 0));
  group.add(box(12.2, 5.4, 0.22, wallpaperMaterial(neighbor.id, style.wall), 0, 2.65, -5.05));
  group.add(box(0.22, 5.4, 10.2, material(style.side), -6.05, 2.65, 0));
  const trim = material(neighbor.id === 'curry' ? '#eee3c9' : '#785943');
  group.add(box(12, 0.22, 0.12, trim, 0, 0.15, -4.88));
  group.add(box(0.12, 0.22, 10, trim, -5.88, 0.15, 0));
  group.add(box(12, 0.18, 0.25, trim, 0, 5.18, -4.98));
  group.add(box(0.25, 0.18, 10, trim, -5.98, 5.18, 0));
  addExitMat(group, style.accent);
  addHost(group, neighbor.id);

  const obstacles = [{ x: 0, z: -0.8, hx: 1.7, hz: 1.12 }];
  if (neighbor.id === 'dumpling') decorateDumpling(scene, group, obstacles);
  if (neighbor.id === 'tofu') decorateTofu(scene, group, obstacles);
  if (neighbor.id === 'curry') decorateCurry(scene, group, obstacles);
  if (neighbor.id === 'pork') decoratePork(scene, group, obstacles);

  return {
    scene,
    obstacles,
    style: style.name,
    spawn: new THREE.Vector3(0, 0.17, 3.25),
    diningPoint: new THREE.Vector3(0, 0.17, 1.05),
    exitPoint: new THREE.Vector3(0, 0.17, 4.05)
  };
}
