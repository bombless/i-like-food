import * as THREE from 'three';
import { createInterior } from './interiors.js';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const neighbors = [
  {
    id: 'dumpling', name: '林奶奶', dish: '三鲜饺子', emoji: '🥟', avatar: '👵',
    aroma: '鲜甜麦香', color: '#e6ad55', wall: '#f1cf91', roof: '#b96048',
    position: new THREE.Vector3(-11, 0, -7.5),
    line: '鼻子挺灵呀！三鲜饺子刚出锅，快进来快进来，奶奶给你留了满满一碗。',
    caption: '薄皮大馅，一口一个鲜。'
  },
  {
    id: 'tofu', name: '川川家', dish: '麻婆豆腐', emoji: '🍲', avatar: '🧑🏻‍🍳',
    aroma: '麻辣辛香', color: '#df6a4d', wall: '#e9b49a', roof: '#814b43',
    position: new THREE.Vector3(11, 0, -7.5),
    line: '被麻辣香勾来了？正好豆腐还咕嘟着，米饭管够，可别跟我客气！',
    caption: '麻麻辣辣，米饭再来一碗！'
  },
  {
    id: 'curry', name: '小满家', dish: '咖喱鸡', emoji: '🍛', avatar: '👩🏻',
    aroma: '浓郁咖喱香', color: '#e4bb45', wall: '#b9d2b0', roof: '#47776b',
    position: new THREE.Vector3(-11, 0, 8),
    line: '咖喱要拌三圈半才好吃。你来得正是时候，把这儿当自己家就行！',
    caption: '浓浓咖喱，拌饭是一绝。'
  },
  {
    id: 'pork', name: '阿枣家', dish: '红烧肉', emoji: '🍖', avatar: '🧔🏻',
    aroma: '焦糖肉香', color: '#b77b9d', wall: '#c6bad8', roof: '#665b79',
    position: new THREE.Vector3(11, 0, 8),
    line: '红烧肉还差最后一步——找个会欣赏它的人。你可算来了，快坐快坐！',
    caption: '油亮软糯，今天幸福超标。'
  }
];

let gameState = 'welcome';
let previousState = 'welcome';
let activeNeighbor = null;
let currentHouse = null;
let interaction = null;
let startedAt = 0;
let elapsedBeforeWin = 0;
let audioContext = null;
let muted = false;
let toastTimer;
const keys = new Set();

const scene = new THREE.Scene();
let activeScene = scene;
scene.background = new THREE.Color('#e9e5d1');
scene.fog = new THREE.Fog('#e9e5d1', 45, 82);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
$('#game-canvas').appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera();
camera.position.set(27, 31, 29);
camera.lookAt(0, 0, 0);
const exteriorCameraPosition = camera.position.clone();
camera.near = 0.1;
camera.far = 120;

function resizeCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewHeight = currentHouse
    ? (aspect < 0.8 ? 25 : aspect < 1.2 ? 21 : 17.5)
    : (aspect < 0.8 ? 45 : aspect < 1.2 ? 38 : 31);
  camera.left = -viewHeight * aspect / 2;
  camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
resizeCamera();
window.addEventListener('resize', resizeCamera);

scene.add(new THREE.HemisphereLight('#fff4d6', '#9aab83', 2.25));
const sun = new THREE.DirectionalLight('#fff1cf', 3.1);
sun.position.set(-16, 30, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.0007;
sun.shadow.normalBias = 0.025;
scene.add(sun);
const fill = new THREE.DirectionalLight('#d7e6dd', 0.8);
fill.position.set(20, 10, -20);
scene.add(fill);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: '#a9bb86', roughness: 1 }),
  grassSide: new THREE.MeshStandardMaterial({ color: '#83966c', roughness: 1 }),
  path: new THREE.MeshStandardMaterial({ color: '#e6d9b9', roughness: 1 }),
  pathEdge: new THREE.MeshStandardMaterial({ color: '#cabe9e', roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ color: '#806348', roughness: 1 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#5e5041', roughness: 1 }),
  cream: new THREE.MeshStandardMaterial({ color: '#fff0ce', roughness: 0.9 }),
  leafA: new THREE.MeshStandardMaterial({ color: '#668968', roughness: 1, flatShading: true }),
  leafB: new THREE.MeshStandardMaterial({ color: '#87a878', roughness: 1, flatShading: true }),
  leafC: new THREE.MeshStandardMaterial({ color: '#a4b77d', roughness: 1, flatShading: true })
};

function mesh(geometry, material, x = 0, y = 0, z = 0, shadows = true) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = shadows;
  object.receiveShadow = shadows;
  return object;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
}

function cylinder(rt, rb, h, segments, material, x = 0, y = 0, z = 0) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material, x, y, z);
}

const island = box(42, 0.75, 36, mats.grassSide, 0, -0.5, 0);
scene.add(island);
const lawn = box(41.8, 0.22, 35.8, mats.grass, 0, -0.05, 0);
scene.add(lawn);

const roadVertical = box(5.4, 0.1, 34, mats.path, 0, 0.09, 0);
const roadHorizontal = box(39, 0.1, 4.8, mats.path, 0, 0.095, 0.4);
roadVertical.receiveShadow = roadHorizontal.receiveShadow = true;
roadVertical.castShadow = roadHorizontal.castShadow = false;
scene.add(roadVertical, roadHorizontal);
const plaza = cylinder(5.4, 5.4, 0.13, 64, mats.path, 0, 0.12, 0.4);
plaza.castShadow = false;
scene.add(plaza);
const plazaRing = mesh(new THREE.RingGeometry(4.95, 5.18, 64), mats.pathEdge, 0, 0.195, 0.4, false);
plazaRing.rotation.x = -Math.PI / 2;
scene.add(plazaRing);

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function makeLabel(neighbor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.5, 1.27, 1);
  sprite.position.copy(neighbor.position).add(new THREE.Vector3(0, 6.35, 0));
  sprite.renderOrder = 20;
  scene.add(sprite);
  neighbor.label = { canvas, texture, sprite };
  drawLabel(neighbor);
}

function drawLabel(neighbor) {
  const { canvas, texture } = neighbor.label;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(29,47,38,.2)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 7;
  roundedRect(ctx, 17, 12, 478, 112, 32);
  ctx.fillStyle = neighbor.eaten ? 'rgba(43,96,78,.94)' : 'rgba(255,250,237,.96)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = neighbor.eaten ? '#f5d797' : neighbor.color;
  roundedRect(ctx, 29, 25, 85, 85, 24);
  ctx.fill();
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(neighbor.eaten ? '✓' : neighbor.emoji, 71, 69);
  ctx.textAlign = 'left';
  ctx.fillStyle = neighbor.eaten ? '#fff9e9' : '#2c493e';
  ctx.font = '700 30px "Noto Sans SC", sans-serif';
  ctx.fillText(neighbor.dish, 135, 57);
  ctx.fillStyle = neighbor.eaten ? 'rgba(255,249,233,.66)' : '#879187';
  ctx.font = '500 21px "Noto Sans SC", sans-serif';
  ctx.fillText(neighbor.eaten ? `${neighbor.name} · 已吃到` : `${neighbor.name} · ${neighbor.aroma}`, 135, 93);
  texture.needsUpdate = true;
}

function createRoof(w, d, h, material) {
  const vertices = new Float32Array([
    -w / 2, 0, d / 2, w / 2, 0, d / 2, 0, h, d / 2,
    -w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 5, 4, 3, 3, 0, 2, 3, 2, 5, 1, 4, 5, 1, 5, 2, 3, 4, 1, 3, 1, 0]);
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  return mesh(flat, material, 0, 3.15, 0);
}

function createWindow(group, x) {
  const frame = box(1.32, 1.36, 0.15, mats.cream, x, 1.73, 2.3);
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#f8c875', emissive: '#f2a94e', emissiveIntensity: 0.55, roughness: 0.55 });
  const glass = box(1.08, 1.12, 0.18, glassMaterial, x, 1.73, 2.39);
  const barV = box(0.07, 1.12, 0.05, mats.cream, x, 1.73, 2.5);
  const barH = box(1.08, 0.07, 0.05, mats.cream, x, 1.73, 2.5);
  const flowerBox = box(1.38, 0.25, 0.42, mats.wood, x, 1.02, 2.55);
  group.add(frame, glass, barV, barH, flowerBox);
  for (let i = -1; i <= 1; i++) {
    const plant = mesh(new THREE.IcosahedronGeometry(0.19, 0), i === 0 ? mats.leafC : mats.leafB, x + i * 0.32, 1.24, 2.58);
    group.add(plant);
  }
}

function createHouse(neighbor) {
  neighbor.rotation = Math.atan2(-neighbor.position.x, -neighbor.position.z);
  neighbor.direction = new THREE.Vector3(Math.sin(neighbor.rotation), 0, Math.cos(neighbor.rotation));
  neighbor.side = new THREE.Vector3(neighbor.direction.z, 0, -neighbor.direction.x);
  neighbor.door = neighbor.position.clone().addScaledVector(neighbor.direction, 3.45);
  const group = new THREE.Group();
  group.position.copy(neighbor.position);
  group.rotation.y = neighbor.rotation;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: neighbor.wall, roughness: 0.92 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: neighbor.roof, roughness: 0.9, flatShading: true });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: neighbor.roof, roughness: 0.8 });
  group.add(box(5.25, 0.28, 4.75, mats.pathEdge, 0, 0.15, 0));
  group.add(box(5, 3.2, 4.5, wallMaterial, 0, 1.75, 0));
  group.add(createRoof(5.85, 5.25, 2.0, roofMaterial));
  group.add(box(0.72, 1.8, 0.72, wallMaterial, 1.55, 4.55, -0.75));
  group.add(box(0.88, 0.18, 0.88, mats.cream, 1.55, 5.47, -0.75));
  group.add(box(1.05, 1.95, 0.2, doorMaterial, 0, 1.12, 2.34));
  group.add(box(0.78, 0.63, 0.06, new THREE.MeshStandardMaterial({ color: '#f6cb82', emissive: '#eaa453', emissiveIntensity: 0.35 }), 0, 1.57, 2.46));
  const knob = mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshStandardMaterial({ color: '#f4d07a', metalness: 0.45, roughness: 0.35 }), 0.33, 1.05, 2.49);
  group.add(knob);
  group.add(box(1.45, 0.14, 0.7, mats.cream, 0, 2.25, 2.52));
  group.add(box(1.45, 0.16, 0.9, mats.pathEdge, 0, 0.19, 2.75));
  createWindow(group, -1.55);
  createWindow(group, 1.55);
  const mat = new THREE.MeshStandardMaterial({ color: neighbor.color, roughness: 1 });
  const doormat = box(1.2, 0.055, 0.58, mat, 0, 0.3, 3.12);
  group.add(doormat);
  scene.add(group);
  neighbor.group = group;
  const ringMaterial = new THREE.MeshBasicMaterial({ color: neighbor.color, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(0.65, 0.83, 32), ringMaterial, neighbor.door.x, 0.25, neighbor.door.z, false);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  neighbor.ring = ring;
  makeLabel(neighbor);
}

neighbors.forEach((neighbor) => {
  createHouse(neighbor);
  neighbor.interior = createInterior(neighbor);
});

function makeScentTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,.9)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}
const scentTexture = makeScentTexture();
const scentParticles = [];
neighbors.forEach((neighbor) => {
  neighbor.scent = [];
  for (let i = 0; i < 17; i++) {
    const material = new THREE.SpriteMaterial({ map: scentTexture, color: neighbor.color, transparent: true, opacity: 0, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 3;
    scene.add(sprite);
    const particle = { sprite, neighbor, offset: i / 17, phase: i * 1.73 };
    neighbor.scent.push(particle);
    scentParticles.push(particle);
  }
});

function createSteppingStones(neighbor) {
  const start = neighbor.door.clone().addScaledVector(neighbor.direction, 0.4);
  const length = Math.min(5.5, Math.hypot(start.x, start.z) - 4.7);
  for (let i = 0; i < 6; i++) {
    const p = start.clone().addScaledVector(neighbor.direction, i * length / 6);
    const stone = cylinder(0.53, 0.58, 0.11, 8, i % 2 ? mats.cream : mats.pathEdge, p.x, 0.17, p.z);
    stone.scale.z = 0.72;
    stone.rotation.y = neighbor.rotation + (i % 2 ? 0.12 : -0.1);
    stone.castShadow = false;
    scene.add(stone);
  }
}
neighbors.forEach(createSteppingStones);

function createTree(x, z, scale = 1, variant = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const trunk = cylinder(0.19, 0.27, 2.2, 7, mats.wood, 0, 1.1, 0);
  group.add(trunk);
  const leafMaterial = [mats.leafA, mats.leafB, mats.leafC][variant % 3];
  group.add(mesh(new THREE.IcosahedronGeometry(1.25, 1), leafMaterial, 0, 2.7, 0));
  group.add(mesh(new THREE.IcosahedronGeometry(0.92, 1), variant % 2 ? mats.leafC : mats.leafB, -0.7, 2.35, 0.15));
  group.add(mesh(new THREE.IcosahedronGeometry(0.85, 1), leafMaterial, 0.65, 2.35, -0.25));
  scene.add(group);
}

[
  [-18, -13, 1.15], [-13.8, -14.5, 0.9], [-5.8, -14.8, 1.05], [5.9, -14.7, 1.15], [16.8, -13.2, 1.2],
  [-18.4, -4.8, 0.95], [-18.1, 5.2, 1.15], [-17.2, 13.2, 1.1], [-6.5, 14.6, 0.9],
  [6.3, 14.7, 1.05], [17.4, 13.1, 1.2], [18.3, 4.5, 0.95], [18.2, -4.8, 1.1],
  [-5.2, -6.4, 0.68], [5.4, 7.1, 0.7], [-6, 6.4, 0.62], [6, -6.7, 0.65]
].forEach(([x, z, scale], i) => createTree(x, z, scale, i));

function createBush(x, z, scale = 1, color = mats.leafB) {
  const group = new THREE.Group();
  group.position.set(x, 0.1, z);
  group.scale.setScalar(scale);
  group.add(mesh(new THREE.IcosahedronGeometry(0.55, 1), color, -0.35, 0.45, 0));
  group.add(mesh(new THREE.IcosahedronGeometry(0.66, 1), color, 0.25, 0.5, 0));
  group.add(mesh(new THREE.IcosahedronGeometry(0.45, 1), mats.leafC, 0.65, 0.35, 0.1));
  scene.add(group);
}
[
  [-15, -11], [-8, -12], [8, -12], [15, -11], [-15, 11], [-8, 12], [8, 12], [15, 11],
  [-7.3, -3.8], [7.2, -3.8], [-7.3, 4.8], [7.4, 4.7], [-3.8, 9], [3.8, -9]
].forEach(([x, z], i) => createBush(x, z, 0.75 + (i % 3) * 0.12, i % 2 ? mats.leafA : mats.leafB));

function createLamp(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(cylinder(0.09, 0.14, 3.4, 10, mats.darkWood, 0, 1.7, 0));
  group.add(cylinder(0.28, 0.36, 0.15, 10, mats.darkWood, 0, 0.08, 0));
  group.add(box(0.65, 0.75, 0.65, new THREE.MeshStandardMaterial({ color: '#f8d38c', emissive: '#f2b653', emissiveIntensity: 0.7 }), 0, 3.55, 0));
  group.add(cylinder(0, 0.57, 0.42, 4, mats.darkWood, 0, 4.12, 0).rotateY(Math.PI / 4));
  scene.add(group);
}
[[-3.5, -4.2], [3.5, 4.8], [-3.5, 5], [3.5, -4.2]].forEach(([x, z]) => createLamp(x, z));

function createFlowerbed() {
  const bed = cylinder(1.55, 1.65, 0.34, 24, mats.pathEdge, 0, 0.28, 0.4);
  scene.add(bed);
  const soil = cylinder(1.38, 1.38, 0.08, 24, new THREE.MeshStandardMaterial({ color: '#76664b', roughness: 1 }), 0, 0.48, 0.4);
  scene.add(soil);
  const flowerColors = ['#f3d47c', '#ed9a81', '#f7eee0', '#c595b0'];
  for (let i = 0; i < 20; i++) {
    const angle = i * 2.4;
    const radius = 0.3 + (i % 5) * 0.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 0.4;
    const stem = cylinder(0.025, 0.025, 0.35 + (i % 3) * 0.08, 5, mats.leafA, x, 0.67, z);
    const bloom = mesh(new THREE.IcosahedronGeometry(0.12 + (i % 2) * 0.035, 0), new THREE.MeshStandardMaterial({ color: flowerColors[i % 4], flatShading: true }), x, 0.89 + (i % 3) * 0.08, z);
    scene.add(stem, bloom);
  }
}
createFlowerbed();

function createBench(x, z, rotation) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.add(box(2.25, 0.15, 0.65, mats.wood, 0, 0.72, 0));
  group.add(box(2.25, 0.72, 0.13, mats.wood, 0, 1.12, -0.28));
  group.add(box(0.13, 0.7, 0.55, mats.darkWood, -0.82, 0.37, 0));
  group.add(box(0.13, 0.7, 0.55, mats.darkWood, 0.82, 0.37, 0));
  scene.add(group);
}
createBench(-3.8, 0.5, Math.PI / 2);
createBench(3.8, 0.5, -Math.PI / 2);

function createNoticeBoard() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5e6bf'; ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#3b6553'; ctx.textAlign = 'center';
  ctx.font = '800 54px "Noto Sans SC", sans-serif'; ctx.fillText('今天吃什么？', 256, 105);
  ctx.font = '38px sans-serif'; ctx.fillText('🥟  🍲  🍛  🍖', 256, 190);
  ctx.fillStyle = '#9a805e'; ctx.font = '24px "Noto Sans SC", sans-serif'; ctx.fillText('闻到香味，就进来坐坐', 256, 260);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Group();
  board.position.set(0, 0, -3.4);
  board.add(box(2.65, 1.75, 0.15, mats.wood, 0, 1.95, 0));
  const face = mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: texture }), 0, 1.95, 0.081, false);
  board.add(face);
  board.add(box(0.15, 1.35, 0.15, mats.wood, -0.95, 0.68, 0));
  board.add(box(0.15, 1.35, 0.15, mats.wood, 0.95, 0.68, 0));
  board.rotation.y = 0.1;
  scene.add(board);
}
createNoticeBoard();

function createPlayer() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#f3c6a0', roughness: 0.9 });
  const jacket = new THREE.MeshStandardMaterial({ color: '#e9794f', roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: '#355c55', roughness: 0.95 });
  const hair = new THREE.MeshStandardMaterial({ color: '#3d342f', roughness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: '#fff0d3', roughness: 0.85 });
  const body = mesh(new THREE.CapsuleGeometry(0.43, 0.62, 5, 10), jacket, 0, 1.15, 0);
  body.scale.set(1, 1, 0.85);
  group.add(body);
  const head = mesh(new THREE.SphereGeometry(0.42, 16, 12), skin, 0, 1.98, 0);
  group.add(head);
  const hairCap = mesh(new THREE.SphereGeometry(0.435, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 2.06, -0.015);
  group.add(hairCap);
  const fringe = box(0.54, 0.16, 0.13, hair, 0, 2.22, 0.32);
  fringe.rotation.x = -0.18;
  group.add(fringe);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#3b3631' });
  group.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMaterial, -0.14, 2.0, 0.395, false));
  group.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMaterial, 0.14, 2.0, 0.395, false));
  const legLeft = mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 8), pants, -0.2, 0.45, 0);
  const legRight = mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 8), pants, 0.2, 0.45, 0);
  group.add(legLeft, legRight);
  const armLeft = mesh(new THREE.CapsuleGeometry(0.1, 0.43, 4, 8), jacket, -0.51, 1.25, 0.12);
  const armRight = mesh(new THREE.CapsuleGeometry(0.1, 0.43, 4, 8), jacket, 0.51, 1.25, 0.12);
  armLeft.rotation.x = armRight.rotation.x = -0.6;
  group.add(armLeft, armRight);
  const bowl = mesh(new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), white, 0, 1.15, 0.58);
  bowl.rotation.x = Math.PI;
  group.add(bowl);
  const rim = mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 20), white, 0, 1.15, 0.58);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  const chopstickMaterial = new THREE.MeshStandardMaterial({ color: '#85543d', roughness: 1 });
  const chopstick = cylinder(0.018, 0.018, 0.9, 6, chopstickMaterial, 0.22, 1.38, 0.57);
  chopstick.rotation.z = -0.35;
  group.add(chopstick);
  const shadow = mesh(new THREE.CircleGeometry(0.58, 24), new THREE.MeshBasicMaterial({ color: '#38533f', transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.04, 0, false);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
  group.position.set(0, 0.17, 5.2);
  scene.add(group);
  return { group, body, legLeft, legRight, armLeft, armRight, shadow };
}
const player = createPlayer();

const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const candidate = new THREE.Vector3();
let walking = false;
let walkTime = 0;
let nearest = null;

function collides(position) {
  if (currentHouse) {
    if (Math.abs(position.x) > 5.35 || position.z < -4.35 || position.z > 4.5) return true;
    return currentHouse.interior.obstacles.some(({ x, z, hx, hz }) => {
      const closestX = Math.max(x - hx, Math.min(position.x, x + hx));
      const closestZ = Math.max(z - hz, Math.min(position.z, z + hz));
      const dx = position.x - closestX;
      const dz = position.z - closestZ;
      return dx * dx + dz * dz < 0.16;
    });
  }
  if (Math.abs(position.x) > 19.2 || Math.abs(position.z) > 16.2) return true;
  return neighbors.some((neighbor) => {
    const dx = position.x - neighbor.position.x;
    const dz = position.z - neighbor.position.z;
    return dx * dx + dz * dz < 11.2;
  });
}

function updatePlayer(delta, time) {
  walking = false;
  if (gameState === 'playing') {
    camera.getWorldDirection(moveForward);
    moveForward.y = 0;
    moveForward.normalize();
    moveRight.crossVectors(moveForward, camera.up).normalize();
    const vertical = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const horizontal = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    moveVector.set(0, 0, 0).addScaledVector(moveForward, vertical).addScaledVector(moveRight, horizontal);
    if (moveVector.lengthSq() > 0) {
      walking = true;
      moveVector.normalize();
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7.7 : 5.1;
      candidate.copy(player.group.position).addScaledVector(moveVector, speed * delta);
      const tryX = player.group.position.clone();
      tryX.x = candidate.x;
      if (!collides(tryX)) player.group.position.x = tryX.x;
      const tryZ = player.group.position.clone();
      tryZ.z = candidate.z;
      if (!collides(tryZ)) player.group.position.z = tryZ.z;
      const targetAngle = Math.atan2(moveVector.x, moveVector.z);
      let angleDelta = targetAngle - player.group.rotation.y;
      angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
      player.group.rotation.y += angleDelta * Math.min(1, delta * 13);
      walkTime += delta * (speed > 6 ? 13 : 9);
    }
  }
  const swing = walking ? Math.sin(walkTime) * 0.5 : 0;
  player.legLeft.rotation.x = THREE.MathUtils.lerp(player.legLeft.rotation.x, swing, delta * 12);
  player.legRight.rotation.x = THREE.MathUtils.lerp(player.legRight.rotation.x, -swing, delta * 12);
  player.group.position.y = 0.17 + (walking ? Math.abs(Math.sin(walkTime)) * 0.075 : Math.sin(time * 2) * 0.015);
  player.shadow.position.set(player.group.position.x, currentHouse ? 0.07 : 0.19, player.group.position.z);
  player.shadow.scale.setScalar(walking ? 0.92 : 1);
}

function updateScents(time) {
  if (currentHouse) return;
  scentParticles.forEach(({ sprite, neighbor, offset, phase }) => {
    const t = (time * 0.075 + offset) % 1;
    const distance = t * 7.4;
    sprite.position.copy(neighbor.door)
      .addScaledVector(neighbor.direction, distance)
      .addScaledVector(neighbor.side, Math.sin(t * 9 + phase) * 0.48);
    sprite.position.y = 0.65 + Math.sin(t * Math.PI) * 1.25 + Math.sin(time * 1.8 + phase) * 0.1;
    const size = 0.35 + Math.sin(t * Math.PI) * 0.65;
    sprite.scale.set(size, size, 1);
    sprite.material.opacity = Math.sin(t * Math.PI) * (neighbor.eaten ? 0.12 : 0.3);
  });
  neighbors.forEach((neighbor, index) => {
    const pulse = 1 + Math.sin(time * 2.2 + index) * 0.12;
    neighbor.ring.scale.setScalar(neighbor === nearest && !neighbor.eaten ? pulse * 1.2 : pulse);
    neighbor.ring.material.opacity = neighbor.eaten ? 0.15 : 0.35 + Math.sin(time * 2 + index) * 0.13;
    neighbor.label.sprite.position.y = 6.35 + Math.sin(time * 1.3 + index * 1.4) * 0.12;
  });
}

function renderMealList() {
  $('#meal-list').innerHTML = neighbors.map((neighbor) => `
    <div class="meal-item ${neighbor.eaten ? 'done' : ''}" style="--dish-pale:${neighbor.color}35">
      <span class="meal-emoji">${neighbor.emoji}</span>
      <div class="meal-text"><strong>${neighbor.dish}</strong><small>${neighbor.name} · ${neighbor.aroma}</small></div>
      <span class="meal-state">${neighbor.eaten ? '已吃到 ✓' : '等着我'}</span>
    </div>`).join('');
  const count = neighbors.filter((neighbor) => neighbor.eaten).length;
  $('#meal-count').textContent = `${count}/4`;
  $('#meal-progress').style.width = `${count * 25}%`;
  const totalMinutes = 18 * 60 + 30 + count * 10;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  $('#clock').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
renderMealList();

function updateRadar() {
  nearest = null;
  interaction = null;
  const prompt = $('#interaction-prompt');
  const actionLabel = $('#mobile-action-label');
  prompt.classList.remove('visible');

  if (currentHouse) {
    const interior = currentHouse.interior;
    const diningDistance = player.group.position.distanceTo(interior.diningPoint);
    const exitDistance = player.group.position.distanceTo(interior.exitPoint);
    if (gameState === 'playing' && exitDistance < 1.25) {
      interaction = { type: 'exit' };
      prompt.classList.add('visible');
      $('#prompt-text').textContent = '回到街区，继续闻香';
      $('#prompt-subtitle').textContent = `${currentHouse.name} · 欢迎下次再来`;
      actionLabel.textContent = '出门';
    } else if (gameState === 'playing' && !currentHouse.eaten && diningDistance < 1.7) {
      interaction = { type: 'dine', neighbor: currentHouse };
      prompt.classList.add('visible');
      $('#prompt-text').textContent = `坐下尝尝${currentHouse.dish}`;
      $('#prompt-subtitle').textContent = `${currentHouse.name}已经备好了碗筷`;
      actionLabel.textContent = '开饭';
    } else {
      actionLabel.textContent = '互动';
    }
    $('.radar-icon').textContent = currentHouse.eaten ? '🏠' : '🍽️';
    $('#scent-dish').textContent = currentHouse.eaten ? `${currentHouse.name} · 欢迎常来` : `${currentHouse.emoji} ${currentHouse.dish}已经上桌`;
    $('#scent-detail').textContent = currentHouse.eaten ? '可以四处看看，或回到街区' : '走到餐桌前，按 E 坐下开饭';
    $('#scent-panel').style.setProperty('--scent-color', currentHouse.color);
    document.querySelectorAll('.scent-bars i').forEach((bar) => bar.classList.remove('active'));
    return;
  }

  $('.radar-icon').textContent = '👃';
  actionLabel.textContent = '敲门';
  let nearestDistance = Infinity;
  let doorNeighbor = null;
  let doorDistance = Infinity;
  neighbors.forEach((neighbor) => {
    const distance = player.group.position.distanceTo(neighbor.door);
    if (distance < doorDistance) {
      doorDistance = distance;
      doorNeighbor = neighbor;
    }
    if (!neighbor.eaten && distance < nearestDistance) {
      nearestDistance = distance;
      nearest = neighbor;
    }
  });
  if (gameState === 'playing' && doorNeighbor && doorDistance < 2.25) {
    interaction = { type: 'enter', neighbor: doorNeighbor };
    prompt.classList.add('visible');
    $('#prompt-text').textContent = doorNeighbor.eaten ? `再进${doorNeighbor.name}坐坐` : `敲开${doorNeighbor.name}的门`;
    $('#prompt-subtitle').textContent = doorNeighbor.eaten ? `${doorNeighbor.interior.style} · 欢迎回家看看` : `${doorNeighbor.dish} · ${doorNeighbor.aroma}扑面而来`;
    actionLabel.textContent = '进门';
  }
  if (!nearest) {
    $('#scent-dish').textContent = '今晚的香气都尝过啦';
    $('#scent-detail').textContent = '挨家挨户，全是幸福的味道';
    document.querySelectorAll('.scent-bars i').forEach((bar) => bar.classList.remove('active'));
    return;
  }
  $('#scent-dish').textContent = `${nearest.emoji} ${nearest.aroma}`;
  $('#scent-detail').textContent = `${nearest.name} · ${nearest.dish} · ${Math.max(1, Math.round(nearestDistance))}m`;
  $('#scent-panel').style.setProperty('--scent-color', nearest.color);
  const strength = Math.max(1, Math.min(5, 6 - Math.floor(nearestDistance / 4)));
  document.querySelectorAll('.scent-bars i').forEach((bar, index) => bar.classList.toggle('active', index < strength));
}

function initAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function tone(frequency, delay = 0, duration = 0.12, type = 'sine', volume = 0.055) {
  if (muted || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playKnock() {
  tone(155, 0, 0.1, 'triangle', 0.08);
  tone(135, 0.16, 0.12, 'triangle', 0.08);
  tone(440, 0.4, 0.15, 'sine', 0.04);
}

function playSuccess() {
  [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => tone(note, index * 0.1, 0.28, 'sine', 0.055));
}

function transitionScene(move) {
  gameState = 'transition';
  keys.clear();
  interaction = null;
  $('#interaction-prompt').classList.remove('visible');
  $('#scene-transition').classList.add('active');
  window.setTimeout(() => {
    move();
    resizeCamera();
  }, 200);
  window.setTimeout(() => {
    $('#scene-transition').classList.remove('active');
    gameState = 'playing';
  }, 460);
}

function enterHouse(neighbor) {
  if (!neighbor || currentHouse || gameState !== 'playing') return;
  playKnock();
  transitionScene(() => {
    currentHouse = neighbor;
    activeScene = neighbor.interior.scene;
    activeScene.add(player.group, player.shadow);
    player.group.position.copy(neighbor.interior.spawn);
    player.group.rotation.y = Math.PI;
    camera.position.set(10, 12, 14);
    camera.lookAt(0, 0, -0.6);
    $('#home-name').textContent = neighbor.name;
    $('#home-style').textContent = neighbor.interior.style;
    $('#home-indicator').classList.remove('hidden');
  });
}

function leaveHouse() {
  if (!currentHouse || gameState !== 'playing') return;
  const neighbor = currentHouse;
  transitionScene(() => {
    currentHouse = null;
    activeScene = scene;
    scene.add(player.group, player.shadow);
    player.group.position.copy(neighbor.door).addScaledVector(neighbor.direction, 0.85);
    player.group.position.y = 0.17;
    player.group.rotation.y = neighbor.rotation;
    camera.position.copy(exteriorCameraPosition);
    camera.lookAt(0, 0, 0);
    $('#home-indicator').classList.add('hidden');
  });
}

function startGame() {
  initAudio();
  if (gameState !== 'welcome') return;
  gameState = 'playing';
  startedAt = performance.now();
  $('#welcome-overlay').classList.add('leaving');
  tone(523, 0, 0.2);
  tone(659, 0.1, 0.2);
  tone(784, 0.2, 0.3);
}

function openDialog(neighbor) {
  if (!neighbor || neighbor.eaten || gameState !== 'playing') return;
  activeNeighbor = neighbor;
  gameState = 'dialog';
  keys.clear();
  playKnock();
  $('#neighbor-avatar').textContent = neighbor.avatar;
  $('#neighbor-avatar').style.background = `${neighbor.color}40`;
  $('#neighbor-name').textContent = neighbor.name;
  $('#neighbor-dish').textContent = `${neighbor.dish}出锅啦`;
  $('#neighbor-line').textContent = neighbor.line;
  $('#dialog-wrap').classList.remove('hidden');
  $('#interaction-prompt').classList.remove('visible');
}

function eatMeal() {
  if (gameState !== 'dialog' || !activeNeighbor) return;
  gameState = 'eating';
  $('#dialog-wrap').classList.add('hidden');
  $('#eating-emoji').textContent = activeNeighbor.emoji;
  $('#eating-caption').textContent = activeNeighbor.caption;
  $('#eating-overlay').classList.remove('hidden');
  tone(392, 0, 0.12, 'triangle');
  tone(523, 0.12, 0.18, 'triangle');
  window.setTimeout(finishMeal, 1550);
}

function finishMeal() {
  if (gameState !== 'eating' || !activeNeighbor) return;
  activeNeighbor.eaten = true;
  drawLabel(activeNeighbor);
  activeNeighbor.ring.material.color.set('#5f9d78');
  $('#eating-overlay').classList.add('hidden');
  const finished = activeNeighbor;
  activeNeighbor = null;
  gameState = 'playing';
  renderMealList();
  playSuccess();
  showToast(finished);
  if (neighbors.every((neighbor) => neighbor.eaten)) {
    elapsedBeforeWin = performance.now() - startedAt;
    window.setTimeout(showWin, 1000);
  }
}

function showToast(neighbor) {
  clearTimeout(toastTimer);
  $('#toast-icon').textContent = neighbor.emoji;
  $('#toast-title').textContent = `${neighbor.dish}，吃到！`;
  $('#toast-caption').textContent = `幸福值 +25 · ${neighbor.name}说下次再来`;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
}

function showWin() {
  if (!neighbors.every((neighbor) => neighbor.eaten)) return;
  gameState = 'won';
  const totalSeconds = Math.max(1, Math.floor(elapsedBeforeWin / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  $('#result-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  $('#win-overlay').classList.remove('hidden');
  [523, 659, 784, 1046, 1318].forEach((note, index) => tone(note, index * 0.12, 0.4, 'sine', 0.045));
}

function restartGame() {
  neighbors.forEach((neighbor) => {
    neighbor.eaten = false;
    neighbor.ring.material.color.set(neighbor.color);
    drawLabel(neighbor);
  });
  if (currentHouse) {
    currentHouse = null;
    activeScene = scene;
    scene.add(player.group, player.shadow);
    camera.position.copy(exteriorCameraPosition);
    camera.lookAt(0, 0, 0);
    $('#home-indicator').classList.add('hidden');
    resizeCamera();
  }
  player.group.position.set(0, 0.17, 5.2);
  player.group.rotation.y = 0;
  activeNeighbor = null;
  startedAt = performance.now();
  gameState = 'playing';
  keys.clear();
  $('#win-overlay').classList.add('hidden');
  $('#toast').classList.remove('show');
  renderMealList();
  tone(523, 0, 0.2);
  tone(784, 0.12, 0.3);
}

function handleAction() {
  if (gameState === 'dialog') {
    eatMeal();
    return;
  }
  if (gameState !== 'playing' || !interaction) return;
  if (interaction.type === 'enter') enterHouse(interaction.neighbor);
  if (interaction.type === 'dine') openDialog(interaction.neighbor);
  if (interaction.type === 'exit') leaveHouse();
}

function openHelp() {
  if (['eating', 'dialog', 'help', 'transition'].includes(gameState)) return;
  previousState = gameState;
  gameState = 'help';
  keys.clear();
  $('#help-overlay').classList.remove('hidden');
}

function closeHelp() {
  if (gameState !== 'help') return;
  gameState = previousState;
  $('#help-overlay').classList.add('hidden');
}

$('#start-button').addEventListener('click', startGame);
$('#eat-button').addEventListener('click', eatMeal);
$('#restart-button').addEventListener('click', restartGame);
$('#help-button').addEventListener('click', openHelp);
$('#close-help').addEventListener('click', closeHelp);
$('#got-it-button').addEventListener('click', closeHelp);
$('#mobile-action').addEventListener('pointerdown', (event) => { event.preventDefault(); handleAction(); });
$('#leave-house').addEventListener('click', leaveHouse);
$('.brand').addEventListener('click', (event) => event.preventDefault());
$('#sound-button').addEventListener('click', () => {
  initAudio();
  muted = !muted;
  $('#sound-button').classList.toggle('muted', muted);
  $('#sound-button').setAttribute('aria-label', muted ? '打开声音' : '关闭声音');
  if (!muted) tone(660, 0, 0.15);
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyE' && !event.repeat) handleAction();
  if (event.code === 'Enter' && gameState === 'welcome') startGame();
  if (event.code === 'Escape') {
    if (gameState === 'help') closeHelp();
    else if (gameState === 'dialog') {
      gameState = 'playing';
      activeNeighbor = null;
      $('#dialog-wrap').classList.add('hidden');
    }
  }
  if (event.code === 'KeyH' && !event.repeat) openHelp();
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

document.querySelectorAll('.dpad button').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key);
  });
  const release = () => keys.delete(button.dataset.key);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  updatePlayer(delta, time);
  updateScents(time);
  updateRadar();
  renderer.render(activeScene, camera);
}
animate();
