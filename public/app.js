import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const canvas = document.querySelector("#lotus-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 2.05, 7.7);
camera.lookAt(0, 0.35, 0);

const lotus = new THREE.Group();
scene.add(lotus);

const ambient = new THREE.HemisphereLight(0xfff6ef, 0x244a4f, 2.5);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xff9cb8, 7, 12);
fillLight.position.set(-3, 2.5, 3.5);
scene.add(fillLight);

const petalMaterials = [
  new THREE.MeshPhysicalMaterial({
    color: 0xff9dbc,
    emissive: 0x2b1018,
    emissiveIntensity: 0.08,
    roughness: 0.38,
    metalness: 0,
    transmission: 0.12,
    thickness: 0.5,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0xffc6d6,
    emissive: 0x2b1018,
    emissiveIntensity: 0.06,
    roughness: 0.44,
    metalness: 0,
    transmission: 0.08,
    thickness: 0.45,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0xf07999,
    emissive: 0x2b1018,
    emissiveIntensity: 0.08,
    roughness: 0.48,
    metalness: 0,
    side: THREE.DoubleSide
  })
];

const leafMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b8d70,
  roughness: 0.72,
  metalness: 0.02,
  side: THREE.DoubleSide
});

const centerMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4bf65,
  roughness: 0.45,
  metalness: 0.04
});

function createPetal(length, width, curve, material) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width, length * 0.28, width * 0.72, length * 0.82, 0, length);
  shape.bezierCurveTo(-width * 0.72, length * 0.82, -width, length * 0.28, 0, 0);

  const geometry = new THREE.ShapeGeometry(shape, 36);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const taper = Math.sin((y / length) * Math.PI);
    const z = curve * taper - Math.abs(x) * 0.12;
    position.setZ(i, z);
  }

  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.geometry.translate(0, 0, 0);
  return mesh;
}

function addPetalRing(count, radius, length, width, openTilt, closedTilt, y, material, phase = 0, ringDelay = 0) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + phase;
    const petal = createPetal(length, width, length * 0.18, material);
    petal.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    petal.rotation.order = "YXZ";
    petal.rotation.y = angle;
    petal.rotation.x = closedTilt;
    petal.scale.setScalar(0.72);
    petal.userData = {
      closedTilt,
      openTilt,
      delay: ringDelay + (i % 4) * 0.055,
      openScale: 1
    };
    lotus.add(petal);
  }
}

addPetalRing(18, 0.58, 2.02, 0.58, 0.98, 0.12, 0.02, petalMaterials[2], 0.08, 0);
addPetalRing(14, 0.34, 1.66, 0.48, 0.7, 0.08, 0.24, petalMaterials[0], 0.2, 0.28);
addPetalRing(10, 0.12, 1.25, 0.38, 0.38, 0.03, 0.45, petalMaterials[1], 0.04, 0.56);

const center = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 32, 20),
  centerMaterial
);
center.scale.set(1, 0.45, 1);
center.position.y = 0.42;
center.material.transparent = true;
center.material.opacity = 0;
lotus.add(center);

for (let i = 0; i < 20; i += 1) {
  const stamen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.32, 8),
    centerMaterial
  );
  const angle = (i / 20) * Math.PI * 2;
  stamen.position.set(Math.sin(angle) * 0.26, 0.66, Math.cos(angle) * 0.26);
  stamen.rotation.z = Math.sin(angle) * 0.28;
  stamen.rotation.x = Math.cos(angle) * 0.28;
  stamen.material = centerMaterial.clone();
  stamen.material.transparent = true;
  stamen.material.opacity = 0;
  lotus.add(stamen);
}

const pad = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 96),
  leafMaterial
);
pad.rotation.x = -Math.PI / 2;
pad.position.y = -0.46;
pad.scale.set(1.34, 0.72, 1);
lotus.add(pad);

const rippleMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.28,
  side: THREE.DoubleSide
});

const ripples = [];
for (let i = 0; i < 3; i += 1) {
  const ripple = new THREE.Mesh(new THREE.RingGeometry(1.2 + i * 0.65, 1.22 + i * 0.65, 96), rippleMaterial.clone());
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = -0.5;
  ripple.userData.offset = i * 0.9;
  scene.add(ripple);
  ripples.push(ripple);
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(now) {
  const seconds = now * 0.001;
  resize();

  lotus.rotation.y = Math.sin(seconds * 0.28) * 0.16;
  lotus.position.y = Math.sin(seconds * 0.7) * 0.045 - 0.04;
  const bloom = easeInOutSine(Math.min(1, Math.max(0, seconds * 0.42 - 0.1)));

  lotus.children.forEach((child) => {
    if (child.userData.closedTilt === undefined) {
      if (child.material?.opacity !== undefined && child !== pad) {
        child.material.opacity = bloom;
      }
      return;
    }

    const opening = easeOutCubic(Math.min(1, Math.max(0, seconds * 0.58 - child.userData.delay)));
    child.rotation.x = child.userData.closedTilt + (child.userData.openTilt - child.userData.closedTilt) * opening;
    child.rotation.z = Math.sin(seconds * 1.15 + child.userData.delay * 5) * 0.012 * opening;
    const scale = 0.72 + (child.userData.openScale - 0.72) * opening;
    child.scale.setScalar(scale);
  });

  ripples.forEach((ripple) => {
    const pulse = (seconds * 0.22 + ripple.userData.offset) % 1;
    const scale = 0.82 + pulse * 0.55;
    ripple.scale.set(scale, scale, scale);
    ripple.material.opacity = (1 - pulse) * 0.22;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function loadMemories() {
  const timeline = document.querySelector("#memory-timeline");
  const response = await fetch("/memories.json");
  const memories = await response.json();

  timeline.innerHTML = memories.map((memory) => {
    const memoryImages = (Array.isArray(memory.images) ? memory.images : [memory.image]).filter(Boolean);
    const theme = memory.theme ?? {};
    const themeStyle = [
      theme.accent ? `--memory-accent: ${theme.accent}` : "",
      theme.secondary ? `--memory-secondary: ${theme.secondary}` : "",
      theme.glow ? `--memory-glow: ${theme.glow}` : "",
      theme.paper ? `--memory-paper: ${theme.paper}` : ""
    ].filter(Boolean).join("; ");

    return `
    <article class="memory"${themeStyle ? ` style="${themeStyle}"` : ""}>
      ${memoryImages.length ? `
        <div class="memory-photo">
          ${memoryImages.map((image, index) => `
            <img src="${image}" alt="${memory.title}${memoryImages.length > 1 ? ` photo ${index + 1}` : ""}" loading="lazy" />
          `).join("")}
        </div>
      ` : `
        <div class="memory-photo memory-photo-empty" aria-hidden="true"></div>
      `}
      <div class="memory-copy">
        <span class="memory-date">${memory.date}</span>
        ${memory.day ? `<span class="memory-day">${memory.day}</span>` : ""}
        <h3>${memory.title}</h3>
        <p class="memory-place">${memory.place}</p>
        <p class="memory-description">${memory.description}</p>
      </div>
    </article>
  `;
  }).join("");
}

loadMemories();
requestAnimationFrame(animate);
