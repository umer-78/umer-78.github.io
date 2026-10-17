/**
 * The home page's gallery: one obsidian monolith per project, standing in a
 * ring on polished black stone around a sculpture of liquid gold held in a
 * golden armillary. Monoliths are grouped by category, so each gem colour forms
 * its own arc of the ring.
 *
 * Hover a monolith to name its project; click it to walk into that project's
 * environment. The key under the hero lights one category, and searching or
 * filtering the index dims the monoliths it hides.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { hashString, mulberry32 } from './environments.js';
import { NOISE, GLOW_POINTS_FRAG } from './glsl.js';

const RADIUS = 9.2;
const GAP = 1.6; // empty slots between categories
const PLINTH = 0.08;

// The monolith's light: a seam down each broad face with pulses running up it,
// and a gold hairline framing the face. Shared by the monoliths and their reflections.
const SLAB_ATTRS = /* glsl */ `
attribute vec3 aGem; attribute float aHover; attribute float aOn; attribute float aSeed; attribute float aHeight;`;
const SLAB_VARYINGS = /* glsl */ `
varying vec3 vGem; varying float vHover; varying float vOn; varying float vSeed; varying float vHeight; varying vec3 vObj; varying vec3 vObjN;`;
const SLAB_PASS = /* glsl */ `
vGem = aGem; vHover = aHover; vOn = aOn; vSeed = aSeed; vHeight = aHeight; vObj = position; vObjN = normal;`;
const SLAB_GLOW = /* glsl */ `
vec3 slabGlow(float time) {
  float face = step(0.6, abs(vObjN.z));
  float lit = mix(0.12, 1.0, vOn);
  float y = (vObj.y + 0.5) * vHeight;
  float pulse = 0.5 + 0.5 * sin(y * 3.1 - time * 1.7 + vSeed * 6.2832);
  float seam = (1.0 - smoothstep(0.003, 0.016, abs(vObj.x))) * face;
  vec3 col = vGem * seam * (0.3 + 0.7 * pulse) * (1.0 + 2.8 * vHover) * lit;
  float ax = abs(vObj.x);
  float frameX = smoothstep(0.236, 0.243, ax) * (1.0 - smoothstep(0.249, 0.256, ax));
  float ey = abs(vObj.y) * vHeight;
  float top = vHeight * 0.5 - 0.075;
  float frameY = smoothstep(top - 0.008, top, ey) * (1.0 - smoothstep(top + 0.006, top + 0.014, ey));
  float inside = step(ax, 0.256) * step(ey, top + 0.014);
  col += vec3(0.95, 0.73, 0.4) * (frameX * step(ey, top + 0.014) + frameY * step(ax, 0.256)) * face * inside * 0.6 * mix(0.35, 1.0, vOn) * (1.0 + vHover);
  col += vGem * vHover * 0.1 * face;
  return col;
}`;

export function createGallery({ envMap, quality, pixelRatio }, { projects, categories, styles, tip }) {
  const q = quality();
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#060607');
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 15, 46);
  scene.environment = envMap;
  scene.environmentIntensity = 0.65;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 160);
  const uTime = { value: 0 };
  const gold = new THREE.Color('#d8b46e');

  // ---- where each monolith stands: category by category round the ring
  const ordered = [
    ...categories.flatMap((c) => projects.filter((p) => p.category === c)),
    ...projects.filter((p) => !categories.includes(p.category)),
  ];
  const groups = new Set(ordered.map((p) => p.category)).size;
  const slots = ordered.length + GAP * groups;
  let cursor = 0;
  let previous = null;
  const items = ordered.map((project) => {
    if (project.category !== previous) {
      cursor += GAP;
      previous = project.category;
    }
    const angle = ((cursor + 0.5) / slots) * Math.PI * 2;
    cursor += 1;
    const rng = mulberry32(hashString(project.name));
    return {
      project,
      angle,
      height: 2.45 + rng() * 1.35,
      seed: rng(),
      color: new THREE.Color(styles[project.category]?.color || '#d6b46c'),
      hover: 0,
      hoverTo: 0,
      on: 1,
      onTo: 1,
    };
  });
  const N = items.length;

  // ---- monoliths, their reflections and their gold plinths
  const slabGeo = new RoundedBoxGeometry(0.62, 1, 0.17, 3, 0.035);
  const aGem = new Float32Array(N * 3);
  const aSeed = new Float32Array(N);
  const aHeight = new Float32Array(N);
  items.forEach((it, i) => {
    it.color.toArray(aGem, i * 3);
    aSeed[i] = it.seed;
    aHeight[i] = it.height;
  });
  const hoverAttr = new THREE.InstancedBufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage);
  const onAttr = new THREE.InstancedBufferAttribute(new Float32Array(N).fill(1), 1).setUsage(THREE.DynamicDrawUsage);
  slabGeo.setAttribute('aGem', new THREE.InstancedBufferAttribute(aGem, 3));
  slabGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  slabGeo.setAttribute('aHeight', new THREE.InstancedBufferAttribute(aHeight, 1));
  slabGeo.setAttribute('aHover', hoverAttr);
  slabGeo.setAttribute('aOn', onAttr);

  const slabMat = new THREE.MeshPhysicalMaterial({
    color: 0x09090b, metalness: 0.25, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 0.95,
  });
  slabMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${SLAB_ATTRS}\n${SLAB_VARYINGS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${SLAB_PASS}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\n${SLAB_VARYINGS}\n${SLAB_GLOW}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += slabGlow(uTime);');
  };

  const mirrorMat = new THREE.ShaderMaterial({
    uniforms: { uTime },
    vertexShader: /* glsl */ `
      ${SLAB_ATTRS}
      ${SLAB_VARYINGS}
      varying float vDepth;
      void main() {
        ${SLAB_PASS}
        vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vDepth = -world.y;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      ${SLAB_VARYINGS}
      varying float vDepth;
      ${SLAB_GLOW}
      void main() {
        vec3 col = vec3(0.012) + slabGlow(uTime);
        gl_FragColor = vec4(col * exp(-vDepth * 0.85) * 0.85, 1.0);
        #include <colorspace_fragment>
      }`,
  });

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: gold, metalness: 1, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.45,
  });

  const slabs = new THREE.InstancedMesh(slabGeo, slabMat, N);
  const mirror = new THREE.InstancedMesh(slabGeo, mirrorMat, N);
  const plinths = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, PLINTH, 0.3), goldMat, N);
  for (const mesh of [slabs, mirror, plinths]) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(slabs, mirror, plinths);

  const m4 = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  function place(i) {
    const it = items[i];
    const lift = it.hover * 0.24;
    const x = Math.sin(it.angle) * RADIUS;
    const z = Math.cos(it.angle) * RADIUS;
    quat.setFromAxisAngle(UP, it.angle + Math.PI); // broad faces turned to the core
    pos.set(x, PLINTH + lift + it.height / 2, z);
    scl.set(1, it.height, 1);
    slabs.setMatrixAt(i, m4.compose(pos, quat, scl));
    pos.y = -pos.y;
    scl.y = -it.height;
    mirror.setMatrixAt(i, m4.compose(pos, quat, scl));
    pos.y = PLINTH / 2;
    scl.set(1, 1, 1);
    plinths.setMatrixAt(i, m4.compose(pos, quat, scl));
  }
  items.forEach((_, i) => place(i));
  slabs.computeBoundingSphere();

  // ---- polished black stone with inlaid gold rings; see-through enough to show the reflections
  const floorMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uGold: { value: gold }, uBg: { value: bg }, uRing: { value: RADIUS } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uGold; uniform vec3 uBg; uniform float uRing;
      varying vec3 vWorld;
      float ring(float r, float at, float px) { return 1.0 - smoothstep(0.0, px * 1.4, abs(r - at)); }
      void main() {
        float r = length(vWorld.xz);
        float px = fwidth(r);
        vec3 col = vec3(0.010, 0.0095, 0.0105);
        float lines = ring(r, uRing + 0.62, px) * 0.9 + ring(r, uRing - 0.62, px) * 0.9
                    + ring(r, 3.1, px) * 0.7 + ring(r, 4.6, px) * 0.4 + ring(r, uRing + 2.6, px) * 0.3;
        float ang = atan(vWorld.z, vWorld.x);
        float d = abs(fract(ang / 6.2831853 * 32.0 + 0.5) - 0.5) * 6.2831853 / 32.0 * r;
        float spoke = (1.0 - smoothstep(0.0, px * 1.4, d)) * step(3.1, r) * step(r, 4.6);
        col += uGold * (lines + spoke * 0.32) * 0.75;
        col += uGold * 0.1 * exp(-r * r / 7.0);
        float fade = smoothstep(30.0, 9.0, r);
        gl_FragColor = vec4(mix(uBg, col, fade), mix(1.0, 0.72, fade));
        #include <colorspace_fragment>
      }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ---- the centrepiece: liquid gold on an obsidian pedestal, inside an armillary
  let coreGeo = new THREE.IcosahedronGeometry(1.12, q >= 2 ? 56 : 30);
  coreGeo.deleteAttribute('normal');
  coreGeo.deleteAttribute('uv');
  coreGeo = mergeVertices(coreGeo);
  coreGeo.computeVertexNormals();
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: '#e9c47e', metalness: 1, roughness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 1.35,
  });
  coreMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        ${NOISE}
        float field(vec3 n) {
          return snoise(n * 1.15 + vec3(0.0, uTime * 0.16, uTime * 0.09)) * 0.16
               + snoise(n * 2.6 - vec3(uTime * 0.12)) * 0.045;
        }`)
      .replace('#include <beginnormal_vertex>', `
        vec3 nrm0 = normalize(position);
        float disp0 = field(nrm0);
        vec3 tng = normalize(cross(nrm0, abs(nrm0.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 btg = cross(nrm0, tng);
        vec3 nA = normalize(nrm0 + tng * 0.012);
        vec3 nB = normalize(nrm0 + btg * 0.012);
        vec3 pO = nrm0 * (1.0 + disp0);
        vec3 pA = nA * (1.0 + field(nA));
        vec3 pB = nB * (1.0 + field(nB));
        vec3 objectNormal = normalize(cross(pA - pO, pB - pO));`)
      .replace('#include <begin_vertex>', 'vec3 transformed = position * (1.0 + disp0);');
  };
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const obsidian = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0c, metalness: 0.2, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2,
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.62, 0.36, 128), obsidian);
  pedestal.position.y = 0.18;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.03, 12, 160), goldMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.36;
  scene.add(pedestal, lip);

  const armillary = [1.7, 2.02, 2.34].map((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 1 ? 0.022 : 0.014, 16, 240), goldMat);
    scene.add(ring);
    return ring;
  });

  // a soft shaft of light falling on the sculpture
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color('#ffe2a8') } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vY = (position.y + 4.5) / 9.0;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal;
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float a = facing * pow(1.0 - vY, 1.3) * smoothstep(0.0, 0.08, vY) * 0.085;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.1, 9, 64, 1, true), beamMat);
  beam.position.y = 0.36 + 4.5;
  scene.add(beam);

  // ---- gold dust drifting through the room
  const DUST = q >= 2 ? 900 : q === 1 ? 500 : 260;
  const dustGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST * 3);
  const dSize = new Float32Array(DUST);
  const dSeed = new Float32Array(DUST);
  const dColor = new Float32Array(DUST * 3);
  const dustColor = new THREE.Color('#f0d39a');
  for (let i = 0; i < DUST; i += 1) {
    const r = Math.sqrt(Math.random()) * 17;
    const a = Math.random() * Math.PI * 2;
    dPos.set([Math.cos(a) * r, Math.random() * 9, Math.sin(a) * r], i * 3);
    dSize[i] = 0.6 + Math.random() * Math.random() * 2.6;
    dSeed[i] = Math.random();
    dustColor.toArray(dColor, i * 3);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  dustGeo.setAttribute('aColor', new THREE.BufferAttribute(dColor, 3));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime, uPR: { value: pixelRatio() }, uOpacity: { value: 0.5 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aSeed; attribute vec3 aColor;
      uniform float uTime; uniform float uPR;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.07 + aSeed * 0.12), 9.0);
        p.x += sin(uTime * 0.21 + aSeed * 40.0) * 0.45;
        p.z += cos(uTime * 0.17 + aSeed * 31.0) * 0.45;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vColor = aColor;
        vAlpha = smoothstep(0.0, 1.2, p.y) * smoothstep(9.0, 7.0, p.y) * (0.55 + 0.45 * sin(uTime * 1.7 + aSeed * 60.0));
        gl_PointSize = aSize * uPR * (10.0 / max(-mv.z, 0.5));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLOW_POINTS_FRAG,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // ---- light
  const coreLight = new THREE.PointLight('#ffcf8a', 22, 0, 2);
  coreLight.position.set(0, 2.5, 0);
  const key = new THREE.DirectionalLight('#fff0d8', 0.7);
  key.position.set(4, 10, 6);
  scene.add(coreLight, key);

  // ---- interaction
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const target = new THREE.Vector3(0, 1.75, 0);
  const look = new THREE.Vector3();
  const label = tipParts(tip);
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, px: -1, py: -1, moved: false, inside: false };
  let width = 1;
  let height = 1;
  let orbit = 0.55;
  let scrollP = 0;
  let hovered = null;
  let fly = null;
  let shown = null;
  let highlight = null;

  function pick(x, y) {
    ndc.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(slabs, false)[0];
    return hit && hit.instanceId != null ? items[hit.instanceId] : null;
  }

  function setHover(item) {
    if (item === hovered) return;
    if (hovered) hovered.hoverTo = 0;
    hovered = item;
    if (item) item.hoverTo = 1;
    if (label) {
      if (item) {
        label.cat.textContent = `${styles[item.project.category]?.gem || ''} · ${item.project.category}`;
        label.title.textContent = item.project.title;
        tip.style.setProperty('--gem', `#${item.color.getHexString()}`);
        tip.hidden = false;
      } else {
        tip.hidden = true;
      }
    }
    document.body.style.cursor = item ? 'pointer' : '';
  }

  function applyOn() {
    for (const it of items) {
      const visible = !shown || shown.has(it.project.name);
      const lit = !highlight || it.project.category === highlight;
      it.onTo = visible && lit ? 1 : 0.1;
    }
  }

  const tipAt = new THREE.Vector3();
  function placeTip() {
    if (!hovered || !label) return;
    tipAt.set(Math.sin(hovered.angle) * RADIUS, PLINTH + hovered.height + 0.55, Math.cos(hovered.angle) * RADIUS).project(camera);
    const x = (tipAt.x * 0.5 + 0.5) * width;
    const y = (-tipAt.y * 0.5 + 0.5) * height;
    tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function update(t, dt) {
    uTime.value = t;
    const follow = dt > 0 ? Math.min(1, dt * 3) : 1;
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;
    orbit += dt * 0.03;

    const portrait = width / height < 0.9;
    const dist = (portrait ? 31 : 25) + scrollP * 2;
    const a = orbit + pointer.sx * 0.12;
    camera.position.set(Math.sin(a) * dist, 8.2 + pointer.sy * 0.8 + scrollP * 3.5, Math.cos(a) * dist);
    target.set(0, 1.1 - scrollP * 0.8, 0);
    if (fly) {
      if (fly.t0 === null) fly.t0 = t;
      const k = easeInOut(Math.min(1, (t - fly.t0) / 0.95));
      const it = fly.item;
      const ix = Math.sin(it.angle) * RADIUS;
      const iz = Math.cos(it.angle) * RADIUS;
      look.set(camera.position.x - ix, 0, camera.position.z - iz).normalize().multiplyScalar(2.3);
      camera.position.lerp(look.set(ix + look.x, 1.9, iz + look.z), k);
      target.lerp(look.set(ix, PLINTH + it.height * 0.55, iz), k);
      if (!fly.fired && k > 0.55) {
        fly.fired = true;
        fly.done();
      }
    }
    camera.lookAt(target);

    core.position.y = 2.45 + Math.sin(t * 0.7) * 0.08;
    core.rotation.y = t * 0.12;
    armillary[0].rotation.set(t * 0.21, 0.6, 0);
    armillary[1].rotation.set(1.15, t * 0.15, 0);
    armillary[2].rotation.set(Math.PI / 2 + Math.sin(t * 0.2) * 0.3, 0, t * 0.11);
    for (const ring of armillary) ring.position.y = core.position.y;

    if (pointer.moved) {
      pointer.moved = false;
      setHover(pointer.inside && !fly ? pick(pointer.px, pointer.py) : null);
    }

    const ease = dt > 0 ? Math.min(1, dt * 7) : 1;
    let moved = false;
    let lit = false;
    items.forEach((it, i) => {
      if (Math.abs(it.hoverTo - it.hover) > 0.001) {
        it.hover += (it.hoverTo - it.hover) * ease;
        hoverAttr.array[i] = it.hover;
        place(i);
        moved = true;
      }
      if (Math.abs(it.onTo - it.on) > 0.001) {
        it.on += (it.onTo - it.on) * ease;
        onAttr.array[i] = it.on;
        lit = true;
      }
    });
    if (moved) {
      hoverAttr.needsUpdate = true;
      for (const mesh of [slabs, mirror, plinths]) mesh.instanceMatrix.needsUpdate = true;
    }
    if (lit) onAttr.needsUpdate = true;
    placeTip();
    return moved || lit;
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) {
      width = w;
      height = h;
      const wide = w / h > 1.15;
      camera.aspect = w / h;
      camera.fov = wide ? 33 : 44;
      camera.setViewOffset(w, h, wide ? -w * 0.19 : 0, wide ? h * 0.05 : h * (w / h < 0.8 ? 0.27 : 0.17), w, h);
      camera.updateProjectionMatrix();
    },
    pointerMove(x, y, inside) {
      pointer.x = (x / width) * 2 - 1;
      pointer.y = (y / height) * 2 - 1;
      pointer.px = x;
      pointer.py = y;
      pointer.inside = inside;
      pointer.moved = true;
    },
    pointerLeave() {
      pointer.inside = false;
      pointer.moved = true;
    },
    /** The project under a click, if any. */
    pick(x, y) {
      return pick(x, y)?.project || null;
    },
    /** Glides towards a monolith, then hands over to the environment. */
    flyTo(name, done, reduced) {
      const item = items.find((it) => it.project.name === name);
      if (!item || reduced) {
        done();
        return;
      }
      setHover(null);
      fly = { item, t0: null, fired: false, done };
    },
    scroll(p) {
      scrollP = Math.max(0, Math.min(1, p));
    },
    highlight(category) {
      highlight = category || null;
      applyOn();
    },
    shown(names) {
      shown = names ? new Set(names) : null;
      applyOn();
    },
    reset() {
      fly = null;
      setHover(null);
    },
  };
}

/** The hover label's parts, made once; text goes in through textContent only. */
function tipParts(tip) {
  if (!tip) return null;
  tip.textContent = '';
  const cat = document.createElement('span');
  cat.className = 'tip-cat';
  const title = document.createElement('strong');
  title.className = 'tip-title';
  const cta = document.createElement('span');
  cta.className = 'tip-cta';
  cta.textContent = 'Enter its world →';
  tip.append(cat, title, cta);
  return { cat, title };
}
