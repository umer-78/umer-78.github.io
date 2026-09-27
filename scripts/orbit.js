/**
 * The hero's 3D scene (three.js). A glowing core slowly changes shape inside a
 * geodesic cage; around it, one orbit per category carries one light per
 * project, and small pulses travel from the core out to the lights.
 *
 * Hover a light to name its project; click it to scroll to that project's card.
 * The key under the scene filters the list by category, and searching or
 * filtering the list dims the lights that no longer match, so the scene always
 * shows the same selection as the cards.
 *
 * Progressive: without WebGL, or if three.js fails to load, the hero keeps its
 * plain gradient. With reduced motion the scene holds still and only redraws
 * when something changes. It pauses while scrolled out of view.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';
import site from './data.js';
import { CATEGORY_STYLE } from './palette.js';

const hero = document.querySelector('header.hero');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

const BASE_Z = 10; // camera distance at rest
const CORE = 1.2; // radius of the core
const RING_BASE = 2.05; // radius of the innermost orbit
const RING_STEP = 0.27;
const RING_TILT = [[0.95, 0.15, 0.35], [1.15, -0.4, -0.55], [0.8, 0.3, 1.0], [1.2, 0.55, -0.15], [0.9, -0.25, -1.05], [1.05, 0.1, 0.25]];
const RING_SPIN = [0.11, -0.08, 0.06, -0.05, 0.045, -0.07]; // radians per second
const PACKETS = 18;

// Simplex noise, Ashima Arts and Stefan Gustavson (MIT licence).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`;

const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
varying vec3 vN;
varying vec3 vView;
varying float vDisp;
${NOISE}
float field(vec3 n) {
  return snoise(n * 1.1 + vec3(0.0, uTime * 0.2, uTime * 0.1)) * (0.13 + 0.09 * uEnergy)
       + snoise(n * 2.4 - vec3(uTime * 0.14)) * 0.035;
}
void main() {
  float r = length(position);
  vec3 n = position / r;
  float d = field(n);
  vec3 p = n * r * (1.0 + d);
  // the displaced surface's normal, from two nearby points on it
  vec3 t = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 b = cross(n, t);
  vec3 n1 = normalize(n + t * 0.02);
  vec3 n2 = normalize(n + b * 0.02);
  vec3 q1 = n1 * r * (1.0 + field(n1));
  vec3 q2 = n2 * r * (1.0 + field(n2));
  vN = normalize(normalMatrix * normalize(cross(q1 - p, q2 - p)));
  vDisp = d;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const CORE_FRAG = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uTime;
varying vec3 vN;
varying vec3 vView;
varying float vDisp;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vView);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 2.4);
  vec3 base = mix(uA, uB, smoothstep(-0.16, 0.2, vDisp));
  // thin-film shimmer: the hue turns with the viewing angle and the surface's swell
  vec3 film = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + fres * 1.1 + vDisp * 2.2 + uTime * 0.035));
  vec3 col = mix(base, film * 0.9, 0.2 + 0.3 * fres);
  vec3 L = normalize(vec3(-0.45, 0.75, 0.6));
  float diff = 0.5 + 0.5 * max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), v), 0.0), 30.0);
  col = col * diff + spec * 0.55 + uC * fres * 1.05;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// Lines and lights fade with depth, so the far side of each orbit recedes.
const FADE_VERT = /* glsl */ `
uniform float uCenter;
uniform float uSpan;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFade = clamp(0.5 + (uCenter + mv.z) / uSpan, 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}`;

const LINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  gl_FragColor = vec4(uColor, uOpacity * mix(0.18, 1.0, vFade));
  #include <colorspace_fragment>
}`;

const NODE_VERT = /* glsl */ `
attribute float aHot;
attribute float aOn;
attribute float aSeed;
uniform float uTime;
uniform float uPR;
uniform float uSize;
uniform float uCenter;
uniform float uSpan;
varying float vFade;
varying float vHot;
varying float vOn;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = -mv.z;
  vFade = clamp(0.5 + (uCenter - depth) / uSpan, 0.0, 1.0);
  vHot = aHot;
  vOn = aOn;
  float twinkle = 0.9 + 0.1 * sin(uTime * 2.4 + aSeed * 6.2832);
  gl_PointSize = uSize * uPR * twinkle * (1.0 + 1.1 * aHot) * mix(0.8, 1.15, vFade) * (${BASE_Z.toFixed(1)} / depth);
  gl_Position = projectionMatrix * mv;
}`;

const NODE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uLight;
uniform float uFocus;
varying float vFade;
varying float vHot;
varying float vOn;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = smoothstep(0.36, 0.16, d);
  float halo = pow(1.0 - d, 2.4) * (1.0 - 0.35 * uLight);
  float ring = smoothstep(0.07, 0.0, abs(d - 0.72)) * vHot;
  float k = mix(0.4, 1.0, vFade) * mix(0.12, 1.0, vOn) * uFocus;
  vec3 c = mix(uColor, vec3(1.0), core * 0.75 * (1.0 - uLight));
  gl_FragColor = vec4(c, clamp((core + halo * 0.6 + ring * 0.9) * k, 0.0, 1.0));
  #include <colorspace_fragment>
}`;

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aSeed;
uniform float uTime;
uniform float uPR;
varying float vTwinkle;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTwinkle = 0.55 + 0.45 * sin(uTime * (0.5 + 1.5 * aSeed) + aSeed * 50.0);
  gl_PointSize = aSize * uPR;
  gl_Position = projectionMatrix * mv;
}`;

const STAR_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor, pow(1.0 - d, 1.8) * vTwinkle * uAlpha);
  #include <colorspace_fragment>
}`;

const PACKET_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aAlpha;
uniform float uPR;
uniform float uSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor;
  vAlpha = aAlpha;
  gl_PointSize = uSize * uPR * (${BASE_Z.toFixed(1)} / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const PACKET_FRAG = /* glsl */ `
uniform float uLight;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = (smoothstep(0.5, 0.0, d) + pow(1.0 - d, 2.0) * 0.5) * vAlpha;
  gl_FragColor = vec4(mix(vColor, vec3(1.0), smoothstep(0.35, 0.0, d) * 0.8 * (1.0 - uLight)), a);
  #include <colorspace_fragment>
}`;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

/** A soft round glow, drawn once and tinted per use. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRenderer() {
  try {
    return new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL: the hero keeps its gradient
  }
}

const renderer = hero ? createRenderer() : null;
if (renderer) start(renderer);

function start(renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const pixelRatio = renderer.getPixelRatio();

  const box = document.createElement('div');
  box.className = 'hero-3d';
  box.setAttribute('aria-hidden', 'true');
  box.appendChild(renderer.domElement);
  hero.insertBefore(box, hero.querySelector('.hero-inner'));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 0, BASE_Z);
  const root = new THREE.Group();
  scene.add(root);

  const time = { value: 0 };
  const center = { value: BASE_Z };
  const span = { value: 6 };
  const light = { value: 0 };
  const glowing = []; // materials that glow additively on dark and blend normally on light

  // ── The core, its halo and its cage ────────────────────────────
  const coreGroup = new THREE.Group();
  root.add(coreGroup);
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uEnergy: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() } },
    vertexShader: CORE_VERT,
    fragmentShader: CORE_FRAG,
  });
  coreGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(CORE, 40), coreMat));

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false }));
  halo.scale.setScalar(CORE * 4.6);
  coreGroup.add(halo);
  glowing.push(halo.material);

  const cageShape = new THREE.IcosahedronGeometry(CORE * 1.42, 1);
  const cage = new THREE.Group();
  const cageLines = new THREE.LineSegments(new THREE.EdgesGeometry(cageShape), new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false }));
  const corners = new Map();
  const shape = cageShape.getAttribute('position');
  for (let i = 0; i < shape.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(shape, i);
    corners.set(v.toArray().map((x) => x.toFixed(3)).join(), v);
  }
  const cagePoints = new THREE.Points(new THREE.BufferGeometry().setFromPoints([...corners.values()]), new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0.85, depthWrite: false }));
  cage.add(cageLines, cagePoints);
  coreGroup.add(cage);
  glowing.push(cageLines.material, cagePoints.material);

  // ── One orbit per category, one light per project ──────────────
  const categories = site.categories.filter((c) => site.projects.some((p) => p.category === c));
  const nodes = [];
  const rings = categories.map((category, i) => {
    const members = site.projects.filter((p) => p.category === category);
    const radius = RING_BASE + i * RING_STEP;
    const tilt = new THREE.Group();
    tilt.rotation.set(...RING_TILT[i % RING_TILT.length]);
    const spin = new THREE.Group();
    spin.rotation.z = i * 0.9;
    tilt.add(spin);
    root.add(tilt);

    const path = [];
    for (let k = 0; k <= 240; k++) {
      const a = (k / 240) * Math.PI * 2;
      path.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(path, 3));
    const lineMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 0 }, uCenter: center, uSpan: span },
      vertexShader: FADE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false,
    });
    spin.add(new THREE.Line(lineGeo, lineMat));

    const local = members.map((_, k) => {
      const a = (k / members.length) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    });
    // faint spokes from the core's surface to each light
    const spokes = new THREE.BufferGeometry();
    spokes.setAttribute('position', new THREE.Float32BufferAttribute(local.flatMap((v) => [...v.clone().setLength(CORE * 1.1).toArray(), ...v.toArray()]), 3));
    const spokeMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 0 }, uCenter: center, uSpan: span },
      vertexShader: FADE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false,
    });
    spin.add(new THREE.LineSegments(spokes, spokeMat));

    const geo = new THREE.BufferGeometry().setFromPoints(local);
    const hot = new THREE.BufferAttribute(new Float32Array(members.length), 1);
    const on = new THREE.BufferAttribute(new Float32Array(members.length).fill(1), 1);
    geo.setAttribute('aHot', hot);
    geo.setAttribute('aOn', on);
    geo.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from(members, () => Math.random()), 1));
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uLight: light, uFocus: { value: 1 }, uPR: { value: pixelRatio }, uTime: time, uSize: { value: 20 }, uCenter: center, uSpan: span },
      vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, transparent: true, depthWrite: false,
    });
    spin.add(new THREE.Points(geo, nodeMat));
    glowing.push(lineMat, spokeMat, nodeMat);

    const ring = { category, style: CATEGORY_STYLE[category] || { short: category, light: '#2563eb', dark: '#60a5fa' }, index: i, tilt, spin, lineMat, spokeMat, nodeMat, hot, on, color: new THREE.Color(), focus: 1, grow: 0, count: members.length };
    members.forEach((project, k) => nodes.push({ project, ring, k, local: local[k], world: new THREE.Vector3(), sx: 0, sy: 0, depth: 0, hidden: false, hover: 0, ping: 0, on: 1 }));
    return ring;
  });

  // ── Pulses from the core to the lights ─────────────────────────
  const packetGeo = new THREE.BufferGeometry();
  const packetPos = new THREE.BufferAttribute(new Float32Array(PACKETS * 3), 3);
  const packetColor = new THREE.BufferAttribute(new Float32Array(PACKETS * 3), 3);
  const packetAlpha = new THREE.BufferAttribute(new Float32Array(PACKETS), 1);
  packetGeo.setAttribute('position', packetPos);
  packetGeo.setAttribute('aColor', packetColor);
  packetGeo.setAttribute('aAlpha', packetAlpha);
  const packetMat = new THREE.ShaderMaterial({
    uniforms: { uPR: { value: pixelRatio }, uSize: { value: 7 }, uLight: light },
    vertexShader: PACKET_VERT, fragmentShader: PACKET_FRAG, transparent: true, depthWrite: false,
  });
  const packetPoints = new THREE.Points(packetGeo, packetMat);
  packetPoints.frustumCulled = false;
  scene.add(packetPoints);
  glowing.push(packetMat);
  const packets = Array.from({ length: PACKETS }, () => ({ node: null, t: 0, speed: 0 }));
  let spawnIn = 0.6;

  // the line from the core to the light under the pointer
  const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  beam.frustumCulled = false;
  scene.add(beam);
  glowing.push(beam.material);

  // ── Stars ──────────────────────────────────────────────────────
  const STARS = 900;
  const starPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) starPos.set([(Math.random() - 0.5) * 46, (Math.random() - 0.5) * 24, -2 - Math.random() * 18], i * 3);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(Float32Array.from({ length: STARS }, () => 0.8 + Math.random() * Math.random() * 2.6), 1));
  starGeo.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from({ length: STARS }, () => Math.random()), 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uTime: time, uPR: { value: pixelRatio } },
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  glowing.push(starMat);
  let starAlpha = 0.85;

  // ── The tooltip and the key ────────────────────────────────────
  const tip = document.createElement('div');
  tip.className = 'orbit-tip';
  tip.setAttribute('aria-hidden', 'true');
  tip.innerHTML = '<b></b><span></span><small></small>';
  hero.appendChild(tip);

  const key = document.createElement('div');
  key.className = 'orbit-key';
  key.innerHTML = `<p>Each light is a project, one orbit per field. Hover a light to name it, click to open its card.</p>
<div class="orbit-cats" role="group" aria-label="Show one field">${rings.map((r) => `<button type="button" data-i="${r.index}" aria-pressed="false" title="Show only ${escapeHtml(r.category)}"><i aria-hidden="true"></i>${escapeHtml(r.style.short)} <span>${r.count}</span></button>`).join('')}</div>`;
  hero.appendChild(key);

  // ── State shared with the list below ───────────────────────────
  let shown = new Set(site.projects.map((p) => p.name));
  let category = 'all';
  let keyHover = -1;
  let hovered = null;
  let side = true;
  const syncKey = () => {
    for (const b of key.querySelectorAll('button')) b.setAttribute('aria-pressed', String(rings[b.dataset.i].category === category));
  };
  // The list rendered before this module ran, so read its first selection from the page.
  if (document.getElementById('count')?.textContent) {
    shown = new Set([...document.querySelectorAll('#cards > .card[id^="project-"]')].map((el) => el.id.slice('project-'.length)));
    category = document.querySelector('#chips .chip[aria-pressed="true"]')?.dataset.category || 'all';
    syncKey();
  }
  document.addEventListener('portfolio:shown', (event) => {
    shown = new Set(event.detail?.names || []);
    category = event.detail?.category || 'all';
    syncKey();
    wake();
  });

  key.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) { keyHover = Number(b.dataset.i); wake(); } });
  key.addEventListener('pointerleave', () => { keyHover = -1; wake(); });
  key.addEventListener('focusin', (e) => { const b = e.target.closest('button'); if (b) { keyHover = Number(b.dataset.i); wake(); } });
  key.addEventListener('focusout', () => { keyHover = -1; wake(); });
  key.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const picked = rings[b.dataset.i].category;
    document.dispatchEvent(new CustomEvent('portfolio:category', { detail: { category: picked === category ? 'all' : picked } }));
  });

  // ── Theme ──────────────────────────────────────────────────────
  function theme() {
    const dark = darkQuery.matches;
    const css = getComputedStyle(document.documentElement);
    const accent = new THREE.Color(css.getPropertyValue('--accent').trim() || '#2563eb');
    coreMat.uniforms.uA.value.copy(accent);
    coreMat.uniforms.uB.value.set(dark ? '#8b5cf6' : '#7c3aed');
    coreMat.uniforms.uC.value.set(dark ? '#22d3ee' : '#0891b2');
    light.value = dark ? 0 : 1;
    for (const m of glowing) m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    halo.material.color.copy(accent);
    halo.material.opacity = dark ? 0.75 : 0.32;
    cageLines.material.color.set(dark ? '#a5b4fc' : '#6366f1');
    cageLines.material.opacity = dark ? 0.26 : 0.3;
    cagePoints.material.color.set(dark ? '#e0e7ff' : '#4f46e5');
    starMat.uniforms.uColor.value.set(dark ? '#dbe4ff' : '#6366f1');
    starAlpha = dark ? 0.85 : 0.32;
    for (const r of rings) {
      r.color.set(dark ? r.style.dark : r.style.light);
      r.lineMat.uniforms.uColor.value.copy(r.color);
      r.spokeMat.uniforms.uColor.value.copy(r.color);
      r.nodeMat.uniforms.uColor.value.copy(r.color);
    }
    for (const b of key.querySelectorAll('button')) b.style.setProperty('--c', dark ? rings[b.dataset.i].style.dark : rings[b.dataset.i].style.light);
    if (hovered) showTip(hovered);
  }
  theme();
  darkQuery.addEventListener('change', () => { theme(); wake(); });

  // ── Layout: the scene takes the free column right of the text ──
  let pxPerUnit = 1;
  function layout() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pxPerUnit = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * BASE_Z);
    const heroLeft = hero.getBoundingClientRect().left;
    // the intro and the stats end well left of the tagline; the scene takes the room beside them
    const textRight = Math.max(0, ...['#site-intro', '#stats'].map((s) => {
      const el = hero.querySelector(s);
      return el ? el.getBoundingClientRect().right - heroLeft : 0;
    })) + 12;
    const free = w - textRight;
    const outer = RING_BASE + (rings.length - 1) * RING_STEP + 0.12;
    let cx;
    let cy;
    let radius;
    side = w >= 960 && free >= 300;
    if (side) {
      radius = Math.min(free / 2, 300) / 1.18; // the near side of an orbit looks about 18% larger
      cx = textRight + free / 2 + 10;
      cy = (h - 110) / 2 + 24;
      key.style.left = `${cx}px`;
      key.style.width = `${Math.min(400, free - 24)}px`;
    } else {
      // phones and tablets: the hero makes room above the text (.hero.orbit-top) and the scene sits there
      radius = Math.min(w * 0.4, 170) / 1.18;
      cx = w / 2;
      cy = 150;
    }
    key.hidden = !side;
    hero.classList.toggle('orbit-top', !side);
    const scale = radius / (outer * pxPerUnit);
    root.scale.setScalar(scale);
    root.position.set((cx - w / 2) / pxPerUnit, -(cy - h / 2) / pxPerUnit, 0);
    span.value = 2 * outer * scale;
    const size = 20 * Math.min(1.15, Math.max(0.7, scale * 1.25));
    for (const r of rings) r.nodeMat.uniforms.uSize.value = size;
    packetMat.uniforms.uSize.value = size * 0.45;
    wake();
  }
  const resize = new ResizeObserver(layout);
  resize.observe(hero);
  resize.observe(hero.querySelector('.hero-inner'));

  // ── Pointer, scroll and picking ────────────────────────────────
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let scroll = 0;
  addEventListener('pointermove', (e) => {
    pointer.tx = e.clientX / innerWidth;
    pointer.ty = e.clientY / innerHeight;
    if (!motionQuery.matches) wake();
  }, { passive: true });
  addEventListener('scroll', () => {
    const r = hero.getBoundingClientRect();
    scroll = clamp01(-r.top / Math.max(1, r.height));
    if (!motionQuery.matches) wake();
  }, { passive: true });

  function nearest(x, y, reach) {
    let best = null;
    let bestD = reach;
    for (const node of nodes) {
      if (node.hidden || node.ring.grow < 0.9) continue;
      const d = Math.hypot(node.sx - x, node.sy - y) - (node.on > 0.5 ? 3 : 0);
      if (d < bestD) { bestD = d; best = node; }
    }
    return best;
  }

  function showTip(node) {
    const [title, meta, cta] = tip.children;
    title.textContent = node.project.title;
    meta.textContent = `${node.project.category} · ${node.project.language}`;
    cta.textContent = node.project.demo ? 'Click to open its card · live demo' : 'Click to open its card';
    tip.style.setProperty('--c', darkQuery.matches ? node.ring.style.dark : node.ring.style.light);
  }

  function setHover(node) {
    if (node === hovered) return;
    hovered = node;
    hero.classList.toggle('orbit-hover', Boolean(node));
    if (node) showTip(node);
    tip.classList.toggle('on', Boolean(node));
    wake();
  }

  const overControl = (target) => Boolean(target.closest('a, button, input, label, .orbit-key'));
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || overControl(e.target)) { setHover(null); return; }
    const r = hero.getBoundingClientRect();
    setHover(nearest(e.clientX - r.left, e.clientY - r.top, 18));
  });
  hero.addEventListener('pointerleave', () => setHover(null));
  hero.addEventListener('click', (e) => {
    if (overControl(e.target) || String(getSelection?.() || '').length) return;
    const r = hero.getBoundingClientRect();
    const node = nearest(e.clientX - r.left, e.clientY - r.top, e.pointerType === 'touch' ? 26 : 18);
    if (!node) return;
    node.ping = 1;
    coreMat.uniforms.uEnergy.value = 1;
    wake();
    document.dispatchEvent(new CustomEvent('portfolio:focus', { detail: { name: node.project.name } }));
  });

  // ── The frame ──────────────────────────────────────────────────
  const born = performance.now();
  const v = new THREE.Vector3();
  const coreWorld = new THREE.Vector3();

  function project(node) {
    node.ring.spin.localToWorld(node.world.copy(node.local));
    v.copy(node.world).applyMatrix4(camera.matrixWorldInverse);
    node.depth = -v.z;
    v.copy(node.world).project(camera);
    node.sx = ((v.x + 1) / 2) * hero.clientWidth;
    node.sy = ((1 - v.y) / 2) * hero.clientHeight;
  }

  function step(dt) {
    const still = motionQuery.matches;
    const k = still ? 1 : 1 - Math.pow(0.0015, dt); // frame-rate independent easing
    if (!still) time.value += dt;
    const elapsed = still ? Infinity : performance.now() - born;

    // entrance: the core swells, then each orbit opens outward from it
    coreGroup.scale.setScalar(0.35 + 0.65 * easeOutBack(clamp01(elapsed / 1300)));
    for (const r of rings) {
      r.grow = easeOutCubic(clamp01((elapsed - 250 - r.index * 120) / 1500));
      r.tilt.scale.setScalar(Math.max(r.grow, 0.001));
      if (!still) r.spin.rotation.z += RING_SPIN[r.index % RING_SPIN.length] * dt;
    }
    starMat.uniforms.uAlpha.value = starAlpha * clamp01(elapsed / 1600);

    pointer.x += (pointer.tx - pointer.x) * k * 0.6;
    pointer.y += (pointer.ty - pointer.y) * k * 0.6;
    const px = still ? 0 : pointer.x - 0.5;
    const py = still ? 0 : pointer.y - 0.5;
    camera.position.set(px * 0.7, -py * 0.45, BASE_Z + (still ? 0 : scroll * 2.4));
    camera.updateMatrixWorld();
    root.rotation.x = 0.12 + py * 0.25 + (still ? 0 : scroll * 0.6);
    root.rotation.y = Math.sin(time.value * 0.1) * 0.25 + px * 0.35;
    if (!still) {
      cage.rotation.y -= dt * 0.08;
      cage.rotation.x += dt * 0.03;
      stars.rotation.z = scroll * 0.12 + time.value * 0.004;
    }
    center.value = camera.position.z - root.position.z;
    const energy = coreMat.uniforms.uEnergy;
    energy.value += ((hovered ? 0.8 : 0) - energy.value) * k * 0.25;

    // orbit focus: the key's hover wins, then the category filter
    for (const r of rings) {
      const target = keyHover >= 0 ? (r.index === keyHover ? 1 : 0.18)
        : category === 'all' || category === r.category ? 1 : 0.2;
      const boost = hovered && hovered.ring === r ? 0.25 : 0;
      r.focus += (target - r.focus) * k * 0.5;
      r.lineMat.uniforms.uOpacity.value = (light.value ? 0.42 : 0.34) * (0.25 + 0.75 * r.focus + boost) * r.grow;
      r.spokeMat.uniforms.uOpacity.value = (light.value ? 0.12 : 0.09) * r.focus * r.grow;
      r.nodeMat.uniforms.uFocus.value = 0.3 + 0.7 * r.focus;
    }

    scene.updateMatrixWorld();
    coreWorld.setFromMatrixPosition(root.matrixWorld);
    v.copy(coreWorld).project(camera);
    const coreX = ((v.x + 1) / 2) * hero.clientWidth;
    const coreY = ((1 - v.y) / 2) * hero.clientHeight;
    const coreR = CORE * root.scale.x * coreGroup.scale.x * pxPerUnit;
    for (const node of nodes) {
      project(node);
      node.hidden = node.depth > center.value && Math.hypot(node.sx - coreX, node.sy - coreY) < coreR; // behind the core
      node.hover += ((node === hovered ? 1 : 0) - node.hover) * k * 0.6;
      node.on += ((shown.has(node.project.name) ? 1 : 0) - node.on) * k * 0.5;
      node.ping = still ? 0 : Math.max(0, node.ping - dt * 1.6);
      node.ring.hot.array[node.k] = Math.max(node.hover, node.ping * 0.7);
      node.ring.on.array[node.k] = node.on;
    }
    for (const r of rings) { r.hot.needsUpdate = true; r.on.needsUpdate = true; }

    // pulses: launch one every so often toward a light that is on
    spawnIn -= dt;
    if (!still && spawnIn <= 0) {
      spawnIn = 0.22 + Math.random() * 0.25;
      const idle = packets.find((p) => !p.node);
      const live = nodes.filter((n) => n.on > 0.5 && n.ring.grow > 0.95);
      if (idle && live.length) Object.assign(idle, { node: live[(Math.random() * live.length) | 0], t: 0, speed: 0.45 + Math.random() * 0.35 });
    }
    packets.forEach((p, i) => {
      if (!p.node) { packetAlpha.array[i] = 0; return; }
      p.t += dt * p.speed;
      if (p.t >= 1) { p.node.ping = 1; p.node = null; packetAlpha.array[i] = 0; return; }
      const from = v.copy(p.node.world).sub(coreWorld).setLength(CORE * root.scale.x * coreGroup.scale.x * 1.08).add(coreWorld);
      const at = from.lerp(p.node.world, easeInOut(p.t));
      packetPos.setXYZ(i, at.x, at.y, at.z);
      const c = p.node.ring.color;
      packetColor.setXYZ(i, c.r, c.g, c.b);
      packetAlpha.array[i] = Math.sin(Math.PI * p.t) * (0.4 + 0.6 * p.node.ring.focus);
    });
    packetPos.needsUpdate = true;
    packetColor.needsUpdate = true;
    packetAlpha.needsUpdate = true;

    // the hovered light: a beam from the core and the tooltip beside it
    const beamPos = beamGeo.getAttribute('position');
    if (hovered) {
      beamPos.setXYZ(0, coreWorld.x, coreWorld.y, coreWorld.z);
      beamPos.setXYZ(1, hovered.world.x, hovered.world.y, hovered.world.z);
      beamPos.needsUpdate = true;
      beam.material.color.copy(hovered.ring.color);
      const w = hero.clientWidth;
      tip.style.left = `${Math.min(w - 150, Math.max(150, hovered.sx))}px`;
      tip.style.top = `${hovered.sy}px`;
    }
    beam.material.opacity += ((hovered ? 0.75 : 0) - beam.material.opacity) * k * 0.6;
  }

  // ── Loop: only while the hero is on screen and the tab is visible ──
  let raf = 0;
  let last = 0;
  let visible = true;
  let first = true;
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
    last = now;
    step(dt);
    renderer.render(scene, camera);
    if (first) {
      first = false;
      box.classList.add('on');
      key.classList.add('on');
    }
    if (!motionQuery.matches) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function wake() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    last = 0;
    if (visible) wake();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden) wake(); });
  motionQuery.addEventListener('change', wake);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visible = false; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { visible = true; wake(); });
  layout();
}
