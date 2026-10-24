/**
 * The project environments. Each kind of world is a builder that fills a scene
 * from a seeded random generator, so a project's name decides the details: how
 * many dials its vault has, which path its star chart lights, how its skyline
 * is laid out. Builders return the camera they want and an update(t, dt) that
 * the render loop calls; with reduced motion t stands still.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mulberry32 } from './environments.js';
import { NOISE, GLOW_POINTS_VERT, GLOW_POINTS_FRAG } from './glsl.js';

const TAU = Math.PI * 2;
const GOLD = '#d8b46e';
const IVORY = '#f3e6c8';
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function at(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

/** Hairline shader helpers: anti-aliased lines at whole numbers of v. */
const HAIR = /* glsl */ `
float hair(float v, float w) { float d = abs(fract(v + 0.5) - 0.5); return 1.0 - smoothstep(0.0, fwidth(v) * w, d); }`;

export function createEnvironment({ envMap, quality, pixelRatio }, project, env, color) {
  // every project gets its own shade of its category's gem, and its own vantage point (below)
  const own = mulberry32(env.seed ^ 0x5bd1e995);
  const gem = new THREE.Color(color);
  const hsl = {};
  gem.getHSL(hsl);
  gem.setHSL(
    (hsl.h + (own() - 0.5) * 0.07 + 1) % 1,
    Math.min(1, hsl.s * (0.9 + own() * 0.2)),
    Math.min(0.8, Math.max(0.45, hsl.l + (own() - 0.5) * 0.1)),
  );
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#050506').lerp(gem, 0.05);
  scene.background = bg;
  scene.environment = envMap;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 240);
  const time = { value: 0 };
  const k = makeKit(scene, gem, mulberry32(env.seed), quality(), time, bg, pixelRatio());
  const world = (BUILDERS[env.kind] || BUILDERS.oracle)(k);
  const view = {
    fov: 40, position: [0, 2.5, 12], target: [0, 1, 0], minDistance: 4.5, maxDistance: 26,
    maxPolar: Math.PI * 0.49, spin: 0.3, fog: [16, 54], dust: 1, floor: null, ...world.view,
  };
  camera.fov = view.fov;
  // turn the builder's viewpoint by up to 26° round the target, and raise or pull it back a little
  const turn = (own() - 0.5) * 0.9;
  const lift = 0.85 + own() * 0.3;
  const reach = 0.92 + own() * 0.16;
  const [tx, ty, tz] = view.target;
  const dx = view.position[0] - tx;
  const dz = view.position[2] - tz;
  camera.position.set(
    tx + (dx * Math.cos(turn) - dz * Math.sin(turn)) * reach,
    ty + (view.position[1] - ty) * lift * reach,
    tz + (dx * Math.sin(turn) + dz * Math.cos(turn)) * reach,
  );
  view.position = camera.position.toArray();
  camera.lookAt(...view.target);
  scene.fog = new THREE.Fog(bg, view.fog[0], view.fog[1]);
  k.lights();
  if (view.floor) k.floor(view.floor);
  if (view.dust) k.dust(view.dust);
  if (view.ring !== false) {
    const ring = view.floor
      ? { y: view.floor.y + 0.015, radius: Math.min(view.floor.radius * 0.45, 9.5) }
      : { y: -3.8, radius: 8 };
    k.inscription({ ...ring, ...(view.ring || {}), text: `${project.title} · ${env.title} · Nº ${String(env.edition).padStart(2, '0')}` });
  }

  return {
    scene,
    camera,
    view,
    update(t, dt) {
      time.value = t;
      world.update?.(t, dt);
      for (const fn of k.updaters) fn(t, dt);
    },
    dispose() {
      scene.traverse((object) => {
        object.geometry?.dispose();
        for (const material of [].concat(object.material || [])) material.dispose();
      });
      for (const texture of k.owned) texture.dispose();
    },
  };
}

function makeKit(scene, gem, rng, q, time, bg, pr) {
  const k = {
    scene, gem, rng, q, time, bg, pr,
    gold: new THREE.Color(GOLD),
    ivory: new THREE.Color(IVORY),
    owned: [],
    updaters: [],
    rand: (a, b) => a + (b - a) * rng(),
    int: (a, b) => Math.floor(a + (b - a + 1) * rng()),
    pick: (list) => list[Math.floor(rng() * list.length)],
    gauss: () => Math.sqrt(-2 * Math.log(Math.max(rng(), 1e-7))) * Math.cos(TAU * rng()),
    add(...objects) {
      scene.add(...objects);
      return objects[0];
    },
    own(texture) {
      k.owned.push(texture);
      return texture;
    },
    goldMat: (o = {}) => new THREE.MeshPhysicalMaterial({
      color: GOLD, metalness: 1, roughness: 0.24, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 1.4, ...o,
    }),
    obsidianMat: (o = {}) => new THREE.MeshPhysicalMaterial({
      color: 0x0b0b0e, metalness: 0.2, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1, ...o,
    }),
    gemMat: (intensity = 1.4, c = gem) => new THREE.MeshPhysicalMaterial({
      color: c.clone().multiplyScalar(0.25), emissive: c, emissiveIntensity: intensity,
      metalness: 0, roughness: 0.16, clearcoat: 1, envMapIntensity: 0.9,
    }),
    glowMat: (c = gem, strength = 1) => new THREE.MeshBasicMaterial({
      color: c.clone().multiplyScalar(strength), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
    lineMat: (c = GOLD, opacity = 0.3) => new THREE.LineBasicMaterial({
      color: c, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
    /** A cloud of soft glowing points. Fill the arrays it returns, then flag them. */
    points(count, { twinkle = 0.25, opacity = 1 } = {}) {
      const geo = new THREE.BufferGeometry();
      const position = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const size = new Float32Array(count);
      const seed = new Float32Array(count);
      for (let i = 0; i < count; i += 1) seed[i] = rng();
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: time, uPR: { value: pr }, uTwinkle: { value: twinkle }, uOpacity: { value: opacity } },
        vertexShader: GLOW_POINTS_VERT,
        fragmentShader: GLOW_POINTS_FRAG,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      const flag = () => {
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aColor.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
      };
      return { points, position, colors, size, flag };
    },
    lights() {
      const key = new THREE.DirectionalLight('#fff1da', 1.3);
      key.position.set(5, 9, 7);
      const rim = new THREE.DirectionalLight(gem, 1.1);
      rim.position.set(-7, 3, -6);
      scene.add(key, rim, new THREE.HemisphereLight('#3a3128', '#050505', 0.35));
    },
    /** Polished stone floor with gold hairlines, fading into the dark. */
    floor({ y = -2, radius = 18, rings = 24, grid = false } = {}) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uGold: { value: k.gold }, uGem: { value: gem }, uBg: { value: bg },
          uRadius: { value: radius }, uRings: { value: rings }, uGrid: { value: grid ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uGold; uniform vec3 uGem; uniform vec3 uBg; uniform float uRadius; uniform float uRings; uniform float uGrid;
          varying vec3 vWorld;
          ${HAIR}
          void main() {
            float r = length(vWorld.xz);
            vec3 col = uBg * 0.7 + vec3(0.004);
            float lines = mix(hair(r / uRadius * uRings, 1.2) * 0.32, max(hair(vWorld.x * 1.05, 1.2), hair(vWorld.z * 1.05, 1.2)) * 0.22, uGrid);
            col += uGold * lines * smoothstep(uRadius, uRadius * 0.12, r);
            col += uGem * 0.05 * exp(-r * r / (uRadius * 1.4));
            gl_FragColor = vec4(mix(uBg, col, smoothstep(uRadius, uRadius * 0.4, r)), 1.0);
            #include <colorspace_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.8, 96), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      scene.add(mesh);
    },
    /** The project's name engraved in gold round its world, turning slowly. */
    inscription({ y, radius, x = 0, z = 0, text, band = 0.5 }) {
      const font = '600 56px Manrope, system-ui, sans-serif';
      const label = [...`${text.toUpperCase()}   ·   `];
      const measure = document.createElement('canvas').getContext('2d');
      measure.font = font;
      const widths = label.map((ch) => measure.measureText(ch).width + 12);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(widths.reduce((sum, w) => sum + w, 0));
      canvas.height = 96;
      const g = canvas.getContext('2d');
      g.font = font;
      g.fillStyle = '#fff';
      g.textBaseline = 'middle';
      let at = 0;
      label.forEach((ch, i) => {
        g.fillText(ch, at, 50);
        at += widths[i];
      });
      const map = k.own(new THREE.CanvasTexture(canvas));
      map.wrapS = THREE.RepeatWrapping;
      const r0 = radius - band / 2;
      const r1 = radius + band / 2;
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uMap: { value: map }, uR0: { value: r0 }, uR1: { value: r1 }, uGold: { value: k.gold },
          uRepeats: { value: Math.max(1, Math.round((TAU * radius) / (band * (canvas.width / canvas.height)))) },
        },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap; uniform float uR0; uniform float uR1; uniform float uRepeats; uniform vec3 uGold;
          varying vec2 vP;
          void main() {
            float r = length(vP);
            float k = uRepeats / 6.2831853;
            float u = atan(vP.y, vP.x) * k;
            float v = (uR1 - r) / (uR1 - uR0);
            // gradients from whichever angle has no seam here, so the wrap leaves no line
            float a1 = atan(vP.y, vP.x);
            float a2 = atan(-vP.y, -vP.x);
            vec2 g1 = vec2(dFdx(a1), dFdy(a1));
            vec2 g2 = vec2(dFdx(a2), dFdy(a2));
            vec2 gu = (dot(g1, g1) < dot(g2, g2) ? g1 : g2) * k;
            vec2 gv = vec2(dFdx(v), dFdy(v));
            float ink = textureGrad(uMap, vec2(u, v), vec2(gu.x, gv.x), vec2(gu.y, gv.y)).a;
            float px = fwidth(r);
            float edges = (1.0 - smoothstep(0.0, px * 1.5, abs(r - uR0 - px))) + (1.0 - smoothstep(0.0, px * 1.5, abs(r - uR1 + px)));
            float a = clamp(ink * 0.85 + edges * 0.5, 0.0, 1.0);
            gl_FragColor = vec4(uGold * a * 1.25, a);
          }`,
      });
      const mesh = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 256, 1), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      scene.add(mesh);
      k.updaters.push((t) => { mesh.rotation.z = t * 0.02; });
    },
    /** Gold dust hanging in the air, turning slowly. */
    dust(amount = 1) {
      const n = Math.round((q >= 2 ? 520 : q === 1 ? 300 : 160) * amount);
      const d = k.points(n, { twinkle: 0.7, opacity: 0.5 });
      for (let i = 0; i < n; i += 1) {
        const r = 2 + Math.sqrt(rng()) * 15;
        const a = rng() * TAU;
        d.position.set([Math.cos(a) * r, -2 + rng() * 11, Math.sin(a) * r], i * 3);
        (rng() < 0.72 ? k.gold : gem).toArray(d.colors, i * 3);
        d.size[i] = 1.6 + rng() * rng() * 4.5;
      }
      scene.add(d.points);
      k.updaters.push((t) => { d.points.rotation.y = t * 0.012; });
    },
  };
  return k;
}

/** Adds a per-instance glow (attribute aGlow, 0..n) to a standard material. */
function glowable(material, glowColor) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlowColor = { value: glowColor };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGlowColor;\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlowColor * vGlow;');
  };
  material.customProgramCacheKey = () => 'glowable';
  return material;
}

function glowAttribute(geometry, count) {
  const attr = new THREE.InstancedBufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('aGlow', attr);
  return attr;
}

function segments(pairs) {
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(pairs.length * 6);
  pairs.forEach(([a, b], i) => {
    a.toArray(arr, i * 6);
    b.toArray(arr, i * 6 + 3);
  });
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return geo;
}

// ---------------------------------------------------------------------------

const BUILDERS = {
  /** Password strength, a bank ledger, a cache: gold dials round a guarded stone. */
  vault(k) {
    // a vault is all gold faces turned to the viewer, so it takes far less of the studio light
    k.scene.environmentIntensity = 0.22;
    const g = k.add(new THREE.Group());
    const gold = k.goldMat({ roughness: 0.32 });
    const brushed = k.goldMat({ roughness: 0.5, clearcoat: 0 });
    const door = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.42, 160), k.obsidianMat({ roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5, envMapIntensity: 0.3 }));
    door.rotation.x = Math.PI / 2;
    door.position.z = -0.45;
    g.add(door, new THREE.Mesh(new THREE.TorusGeometry(4.52, 0.1, 24, 220), gold));
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(4.18, 0.016, 8, 220), brushed), 0, 0, -0.2));

    const count = k.int(3, 5);
    const dials = [];
    const tickGeo = new THREE.BoxGeometry(0.035, 0.2, 0.06);
    const notchMat = k.gemMat(2.4);
    for (let i = 0; i < count; i += 1) {
      const r = 1.35 + (i * 2.45) / Math.max(1, count - 1);
      const dial = new THREE.Group();
      dial.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 14, 220), gold));
      const n = Math.round(r * k.pick([9, 12, 15]));
      const ticks = new THREE.InstancedMesh(tickGeo, brushed, n);
      for (let j = 0; j < n; j += 1) {
        const a = (j / n) * TAU;
        _q.setFromAxisAngle(Z, a - Math.PI / 2);
        ticks.setMatrixAt(j, _m.compose(_p.set(Math.cos(a) * (r + 0.19), Math.sin(a) * (r + 0.19), 0.02), _q, _s.set(1, j % 5 === 0 ? 1.7 : 1, 1)));
      }
      dial.add(ticks, at(new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), notchMat), r + 0.19, 0, 0.08));
      g.add(dial);
      dials.push({ dial, dir: i % 2 ? -1 : 1, period: k.rand(1.8, 3.6), step: TAU / k.pick([10, 12, 16, 20]), phase: k.rand(0, 20) });
    }

    const stone = new THREE.Mesh(
      k.pick([new THREE.OctahedronGeometry(0.72, 0), new THREE.IcosahedronGeometry(0.7, 0), new THREE.DodecahedronGeometry(0.68, 0)]),
      k.gemMat(1.5),
    );
    stone.position.z = 0.6;
    g.add(stone);
    const halo = k.points(1, { twinkle: 0 });
    halo.size[0] = 46;
    k.gem.toArray(halo.colors, 0);
    halo.position.set([0, 0, 0.2]);
    g.add(halo.points);

    const boltCount = k.pick([6, 8, 10, 12]);
    const bolts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 32), gold, boltCount);
    g.add(bolts);
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.03), k.glowMat(k.gem, 1.8));
    scan.position.z = 0.3;
    g.add(scan);

    return {
      view: { position: [0, 1.2, 12.5], target: [0, 0.2, 0], floor: { y: -4.8, radius: 20, rings: 30 }, spin: 0.22, maxPolar: Math.PI * 0.56 },
      update(t) {
        for (const d of dials) {
          const x = t / d.period + d.phase;
          const whole = Math.floor(x);
          d.dial.rotation.z = d.dir * (whole + ease(clamp01((x - whole - 0.62) / 0.38))) * d.step;
        }
        stone.rotation.set(Math.sin(t * 0.4) * 0.35, t * 0.45, 0);
        stone.material.emissiveIntensity = 1.35 + Math.sin(t * 1.6) * 0.4;
        const y = Math.sin(t * 0.55) * 4.1;
        scan.position.y = y;
        scan.scale.x = 2 * Math.sqrt(Math.max(0.0001, 4.45 * 4.45 - y * y));
        const out = ease(0.5 + 0.5 * Math.sin(t * 0.5));
        for (let i = 0; i < boltCount; i += 1) {
          const a = (i / boltCount) * TAU;
          const r = 4.7 + out * 0.45;
          _q.setFromAxisAngle(Z, a - Math.PI / 2);
          bolts.setMatrixAt(i, _m.compose(_p.set(Math.cos(a) * r, Math.sin(a) * r, -0.45), _q, _s.set(1, 0.9, 1)));
        }
        bolts.instanceMatrix.needsUpdate = true;
      },
    };
  },

  /** Intrusion and anomaly detection: a radar table whose beam lights what it finds. */
  radar(k) {
    const R = 6;
    const gold = k.goldMat();
    k.add(at(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.35, R + 0.55, 0.32, 160), k.obsidianMat()), 0, -0.16, 0));
    const sweep = { value: 0 };
    const face = new THREE.Mesh(new THREE.CircleGeometry(R, 160), new THREE.ShaderMaterial({
      uniforms: { uSweep: sweep, uGold: { value: k.gold }, uGem: { value: k.gem }, uR: { value: R } },
      vertexShader: /* glsl */ `
        varying vec2 vP;
        void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uSweep; uniform vec3 uGold; uniform vec3 uGem; uniform float uR;
        varying vec2 vP;
        ${HAIR}
        float radial(float a, float rr, float count, float px) {
          float d = abs(fract(a / 6.2831853 * count + 0.5) - 0.5) * 6.2831853 / count * rr;
          return 1.0 - smoothstep(0.0, px * 1.3, d);
        }
        void main() {
          float rr = length(vP);
          float r = rr / uR;
          float px = length(fwidth(vP));
          float a = atan(vP.y, vP.x);
          float rings = hair(r * 5.0, 1.2) * step(0.04, r);
          float spokes = radial(a, rr, 12.0, px) * smoothstep(0.08, 0.12, r);
          float ticks = radial(a, rr, 120.0, px) * smoothstep(0.945, 0.96, r);
          float behind = mod(uSweep - a, 6.2831853);
          float trail = exp(-behind * 2.4);
          float off = abs(atan(sin(a - uSweep), cos(a - uSweep))) * rr;
          float beam = 1.0 - smoothstep(0.0, px * 1.6, off);
          vec3 col = vec3(0.006, 0.006, 0.008);
          col += uGold * (rings * 0.5 + spokes * 0.16 + ticks * 0.6);
          col += uGem * (trail * 0.42 + beam * 1.8) * smoothstep(1.0, 0.985, r);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.005;
    k.add(face);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(R + 0.36, 0.07, 16, 220), gold);
    bezel.rotation.x = Math.PI / 2;
    k.add(bezel);
    k.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.4, 32), gold), 0, 1.2, 0));
    k.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), k.gemMat(2.2)), 0, 2.48, 0));

    const n = k.int(12, 22);
    const blips = Array.from({ length: n }, () => {
      const a = k.rand(0, TAU);
      const r = k.rand(0.15, 0.92) * R;
      const threat = k.rng() < 0.35;
      return { a, x: Math.cos(a) * r, z: -Math.sin(a) * r, threat, h: threat ? k.rand(1.4, 2.7) : k.rand(0.4, 1.0) };
    });
    const pillarGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 10, 1, true).translate(0, 0.5, 0);
    const pillars = new THREE.InstancedMesh(pillarGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), n);
    blips.forEach((b, i) => pillars.setColorAt(i, k.gem));
    k.add(pillars);
    const glow = k.points(n * 2, { twinkle: 0 });
    k.add(glow.points);
    const speed = k.rand(0.6, 1.05);

    return {
      view: { position: [0, 8.2, 10.8], target: [0, 0.4, 0], floor: { y: -0.33, radius: 24, rings: 34 }, spin: 0.18, maxPolar: Math.PI * 0.46 },
      update(t) {
        const s = t * speed;
        sweep.value = s;
        blips.forEach((b, i) => {
          const behind = (((s - b.a) % TAU) + TAU) % TAU;
          const hit = Math.exp(-behind * 1.3);
          const h = b.h * (0.12 + 0.88 * hit);
          pillars.setMatrixAt(i, _m.compose(_p.set(b.x, 0, b.z), _q.identity(), _s.set(1, h, 1)));
          pillars.setColorAt(i, _c.copy(b.threat ? k.gem : k.gold).multiplyScalar(0.25 + 2.2 * hit));
          glow.position.set([b.x, h, b.z, b.x, 0.02, b.z], i * 6);
          _c.copy(b.threat ? k.gem : k.gold).toArray(glow.colors, i * 6);
          _c.toArray(glow.colors, i * 6 + 3);
          glow.size[i * 2] = (b.threat ? 6 : 3.5) * (0.35 + hit);
          glow.size[i * 2 + 1] = 9 * hit;
        });
        pillars.instanceMatrix.needsUpdate = true;
        pillars.instanceColor.needsUpdate = true;
        glow.flag();
      },
    };
  },

  /** Neural networks and models: arches of neurons down a nave, signal running between them. */
  neural(k) {
    const L = k.int(4, 6);
    const sizes = Array.from({ length: L }, (_, i) => (i === 0 ? k.int(5, 7) : i === L - 1 ? k.int(3, 5) : k.int(7, 11)));
    const spacing = 2.3;
    const radius = 3.3;
    const nodes = [];
    const layers = sizes.map((n, li) => {
      const z = (li - (L - 1) / 2) * spacing;
      const ids = [];
      for (let j = 0; j < n; j += 1) {
        const th = Math.PI * (0.08 + 0.84 * (n === 1 ? 0.5 : j / (n - 1)));
        ids.push(nodes.length);
        nodes.push({ p: new THREE.Vector3(Math.cos(th) * radius, Math.sin(th) * radius, z), glow: 0 });
      }
      return { z, ids };
    });
    const gold = k.goldMat();
    const rib = new THREE.TorusGeometry(radius, 0.03, 10, 140, Math.PI);
    for (const { z } of layers) {
      k.add(at(new THREE.Mesh(rib, gold), 0, 0, z));
      for (const side of [-1, 1]) k.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.3, 24), gold), side * radius, 0.15, z));
    }
    const edges = [];
    for (let li = 0; li < L - 1; li += 1) {
      for (const a of layers[li].ids) for (const b of layers[li + 1].ids) edges.push([a, b]);
    }
    k.add(new THREE.LineSegments(segments(edges.map(([a, b]) => [nodes[a].p, nodes[b].p])), k.lineMat(k.gold, 0.09)));
    const nodeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }), nodes.length);
    nodes.forEach((n, i) => {
      nodeMesh.setMatrixAt(i, _m.makeTranslation(n.p.x, n.p.y, n.p.z));
      nodeMesh.setColorAt(i, k.gem);
    });
    k.add(nodeMesh);
    const halo = k.points(nodes.length, { twinkle: 0.15 });
    nodes.forEach((n, i) => {
      n.p.toArray(halo.position, i * 3);
      k.gem.toArray(halo.colors, i * 3);
      halo.size[i] = 6;
    });
    halo.flag();
    k.add(halo.points);

    const out = nodes.map(() => []);
    edges.forEach(([a], i) => out[a].push(i));
    const firstLayer = layers[0].ids;
    const P = k.q >= 2 ? 70 : k.q === 1 ? 45 : 26;
    const pulses = Array.from({ length: P }, () => ({ e: Math.floor(k.rng() * edges.length), u: k.rng(), speed: k.rand(0.45, 0.85) }));
    const sparks = k.points(P, { twinkle: 0 });
    pulses.forEach((p, i) => {
      _c.copy(k.rng() < 0.5 ? k.gold : k.gem).multiplyScalar(1.6).toArray(sparks.colors, i * 3);
      sparks.size[i] = 5.5;
    });
    k.add(sparks.points);
    const tmp = new THREE.Vector3();

    return {
      view: { position: [0, 2.3, 11.5], target: [0, 1.8, 0], floor: { y: 0, radius: 20, rings: 26 }, spin: 0.25, maxPolar: Math.PI * 0.48 },
      update(t, dt) {
        for (const pulse of pulses) {
          pulse.u += dt * pulse.speed;
          if (pulse.u >= 1) {
            pulse.u -= 1;
            const end = edges[pulse.e][1];
            nodes[end].glow = 1;
            const next = out[end].length ? out[end] : out[firstLayer[Math.floor(Math.random() * firstLayer.length)]];
            pulse.e = next[Math.floor(Math.random() * next.length)];
          }
        }
        pulses.forEach((pulse, i) => {
          const [a, b] = edges[pulse.e];
          tmp.lerpVectors(nodes[a].p, nodes[b].p, pulse.u).toArray(sparks.position, i * 3);
        });
        sparks.flag();
        nodes.forEach((n, i) => {
          n.glow = Math.max(0, n.glow - dt * 1.6);
          nodeMesh.setColorAt(i, _c.copy(k.gem).multiplyScalar(0.9 + n.glow * 2.4));
          halo.size[i] = 6 + n.glow * 10;
        });
        nodeMesh.instanceColor.needsUpdate = true;
        halo.flag();
      },
    };
  },

  /** Graphs and routes: a star chart, its links, and the shortest path lit across it. */
  constellation(k) {
    const n = k.q >= 1 ? k.int(80, 110) : 60;
    const P = Array.from({ length: n }, () => {
      const th = k.rng() * TAU;
      const ph = Math.acos(2 * k.rng() - 1);
      const r = 6.4 * Math.cbrt(0.12 + 0.88 * k.rng());
      return new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th));
    });
    const adj = P.map(() => new Map());
    const link = (a, b) => {
      const d = P[a].distanceTo(P[b]);
      adj[a].set(b, d);
      adj[b].set(a, d);
    };
    P.forEach((p, i) => {
      P.map((q, j) => [j, q.distanceToSquared(p)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => link(i, j));
    });
    // join islands so a route always exists
    const reached = new Set([0]);
    const grow = (from) => {
      const stack = [from];
      while (stack.length) {
        const v = stack.pop();
        for (const w of adj[v].keys()) if (!reached.has(w)) { reached.add(w); stack.push(w); }
      }
    };
    grow(0);
    while (reached.size < n) {
      let best = null;
      for (const a of reached) {
        for (let b = 0; b < n; b += 1) {
          if (reached.has(b)) continue;
          const d = P[a].distanceToSquared(P[b]);
          if (!best || d < best[2]) best = [a, b, d];
        }
      }
      link(best[0], best[1]);
      reached.add(best[1]);
      grow(best[1]);
    }
    let s = 0;
    let e = 0;
    P.forEach((p, i) => {
      if (p.x < P[s].x) s = i;
      if (p.x > P[e].x) e = i;
    });
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const done = new Array(n).fill(false);
    dist[s] = 0;
    for (let iter = 0; iter < n; iter += 1) {
      let v = -1;
      for (let i = 0; i < n; i += 1) if (!done[i] && (v < 0 || dist[i] < dist[v])) v = i;
      if (v < 0 || dist[v] === Infinity) break;
      done[v] = true;
      for (const [w, d] of adj[v]) if (dist[v] + d < dist[w]) { dist[w] = dist[v] + d; prev[w] = v; }
    }
    const path = [];
    for (let v = e; v >= 0; v = prev[v]) path.unshift(v);

    const sky = k.add(new THREE.Group());
    const pairs = [];
    adj.forEach((m, a) => m.forEach((_, b) => { if (a < b) pairs.push([P[a], P[b]]); }));
    sky.add(new THREE.LineSegments(segments(pairs), k.lineMat(k.gold, 0.07)));
    const route = new THREE.CurvePath();
    for (let i = 1; i < path.length; i += 1) route.add(new THREE.LineCurve3(P[path[i - 1]], P[path[i]]));
    if (path.length > 1) sky.add(new THREE.Mesh(new THREE.TubeGeometry(route, path.length * 12, 0.032, 8, false), k.glowMat(k.gem, 2.4)));
    const total = path.length > 1 ? route.getLength() : 1;
    const lengths = route.getCurveLengths();
    const marks = path.map((_, i) => (i === 0 ? 0 : lengths[i - 1] / total));

    const stars = k.points(n, { twinkle: 0.35 });
    const onPath = new Set(path);
    P.forEach((p, i) => {
      p.toArray(stars.position, i * 3);
      (onPath.has(i) ? k.gem : k.rng() < 0.2 ? k.gem : k.ivory).toArray(stars.colors, i * 3);
      stars.size[i] = onPath.has(i) ? 7 : 1.6 + k.rng() * 3;
    });
    stars.flag();
    sky.add(stars.points);
    const goldMat = k.goldMat();
    path.forEach((v) => sky.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), goldMat), P[v].x, P[v].y, P[v].z)));
    const comet = k.points(14, { twinkle: 0 });
    for (let i = 0; i < 14; i += 1) {
      _c.copy(k.ivory).lerp(k.gem, i / 14).multiplyScalar(1.6 - i * 0.08).toArray(comet.colors, i * 3);
      comet.size[i] = 11 * (1 - i / 15);
    }
    sky.add(comet.points);

    const rings = [0, 1, 2].map((i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(7.6 + i * 0.35, 0.013, 8, 260), goldMat);
      ring.rotation.set(k.rand(0, Math.PI), k.rand(0, Math.PI), 0);
      k.add(ring);
      return ring;
    });
    const far = k.points(k.q ? 700 : 350, { twinkle: 0.5, opacity: 0.7 });
    for (let i = 0; i < far.size.length; i += 1) {
      const th = k.rng() * TAU;
      const ph = Math.acos(2 * k.rng() - 1);
      const r = 45 + k.rng() * 20;
      far.position.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      k.ivory.toArray(far.colors, i * 3);
      far.size[i] = 2 + k.rng() * 4;
    }
    far.flag();
    k.add(far.points);
    const speed = k.rand(0.06, 0.1);
    const pt = new THREE.Vector3();

    return {
      view: { position: [0, 2.6, 14.5], target: [0, 0, 0], maxPolar: Math.PI * 0.9, fog: [24, 90], spin: 0.3 },
      update(t) {
        sky.rotation.y = t * 0.035;
        rings.forEach((ring, i) => { ring.rotation.z = t * (0.03 + i * 0.015); });
        const u = (t * speed) % 1;
        for (let i = 0; i < 14; i += 1) {
          if (path.length > 1) route.getPointAt(Math.max(0, u - i * 0.006), pt);
          else pt.copy(P[path[0]] || P[0]);
          pt.toArray(comet.position, i * 3);
        }
        comet.flag();
        path.forEach((v, i) => {
          const near = Math.exp(-((u - marks[i]) ** 2) / 0.0015);
          stars.size[v] = 7 + near * 16;
        });
        stars.flag();
      },
    };
  },

  /** Clustering and evaluation sets: clouds of points that settle into their own kind. */
  nebula(k) {
    const K = k.int(3, 6);
    const total = k.q >= 2 ? 9000 : k.q === 1 ? 5200 : 2600;
    const hsl = {};
    k.gem.getHSL(hsl);
    const clusters = Array.from({ length: K }, (_, c) => {
      const a = (c / K) * TAU + k.rand(-0.3, 0.3);
      const r = k.rand(3.2, 4.6);
      return {
        center: new THREE.Vector3(Math.cos(a) * r, k.rand(-1.2, 1.2), Math.sin(a) * r),
        color: c === 0 ? k.gold.clone() : new THREE.Color().setHSL((hsl.h + (c / K - 0.5) * 0.16 + 1) % 1, Math.min(1, hsl.s * 0.9 + 0.1), Math.min(0.78, hsl.l + k.rand(-0.06, 0.12))),
        spread: new THREE.Vector3(k.rand(0.7, 1.3), k.rand(0.4, 0.9), k.rand(0.7, 1.3)),
        spin: k.rand(0.08, 0.2) * (k.rng() < 0.5 ? -1 : 1),
      };
    });
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(total * 3);
    const center = new Float32Array(total * 3);
    const color = new Float32Array(total * 3);
    const size = new Float32Array(total);
    const seed = new Float32Array(total);
    const spin = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      const c = clusters[i % K];
      pos.set([c.center.x + k.gauss() * c.spread.x, c.center.y + k.gauss() * c.spread.y, c.center.z + k.gauss() * c.spread.z], i * 3);
      c.center.toArray(center, i * 3);
      _c.copy(c.color).multiplyScalar(0.55 + k.rng() * 0.7).toArray(color, i * 3);
      size[i] = k.rng() < 0.015 ? 12 : 2.4 + k.rng() * 3.6;
      seed[i] = k.rng();
      spin[i] = c.spin;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aCenter', new THREE.BufferAttribute(center, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aSpin', new THREE.BufferAttribute(spin, 1));
    const cloud = new THREE.Points(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: k.time, uPR: { value: k.pr }, uOpacity: { value: 0.85 } },
      vertexShader: /* glsl */ `
        attribute vec3 aCenter; attribute vec3 aColor; attribute float aSize; attribute float aSeed; attribute float aSpin;
        uniform float uTime; uniform float uPR;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vec3 rel = position - aCenter;
          float ang = uTime * aSpin * (1.6 / (0.6 + length(rel)));
          float c = cos(ang); float s = sin(ang);
          rel = vec3(rel.x * c - rel.z * s, rel.y + sin(uTime * 0.5 + aSeed * 6.2832) * 0.05, rel.x * s + rel.z * c);
          vec4 mv = modelViewMatrix * vec4(aCenter + rel, 1.0);
          vColor = aColor;
          vAlpha = 0.75 + 0.25 * sin(uTime * 1.3 + aSeed * 40.0);
          gl_PointSize = aSize * uPR * (10.0 / max(-mv.z, 0.5));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: GLOW_POINTS_FRAG,
    }));
    cloud.frustumCulled = false;
    k.add(cloud);

    const outliers = k.points(14, { twinkle: 0.9 });
    const warn = new THREE.Color('#ff6b72');
    for (let i = 0; i < 14; i += 1) {
      const a = k.rng() * TAU;
      const r = k.rand(6.2, 8);
      outliers.position.set([Math.cos(a) * r, k.rand(-2.5, 2.5), Math.sin(a) * r], i * 3);
      warn.toArray(outliers.colors, i * 3);
      outliers.size[i] = 7;
    }
    outliers.flag();
    k.add(outliers.points);

    const goldMat = k.goldMat();
    const markers = clusters.map((c) => {
      const ring = at(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.012, 8, 72), goldMat), c.center.x, c.center.y, c.center.z);
      k.add(ring, at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), goldMat), c.center.x, c.center.y, c.center.z));
      return ring;
    });
    // the minimum spanning tree between cluster centres
    const inTree = [0];
    const links = [];
    while (inTree.length < K) {
      let best = null;
      for (const a of inTree) {
        for (let b = 0; b < K; b += 1) {
          if (inTree.includes(b)) continue;
          const d = clusters[a].center.distanceTo(clusters[b].center);
          if (!best || d < best[2]) best = [a, b, d];
        }
      }
      inTree.push(best[1]);
      links.push([clusters[best[0]].center, clusters[best[1]].center]);
    }
    k.add(new THREE.LineSegments(segments(links), k.lineMat(k.gold, 0.35)));

    return {
      view: { position: [0, 3.4, 14], target: [0, 0, 0], maxPolar: Math.PI * 0.85, dust: 0.5, spin: 0.35 },
      update(t) {
        markers.forEach((ring, i) => ring.rotation.set(t * 0.4 + i, t * 0.3, 0));
      },
    };
  },

  /** Forecasting: a moving landscape in gold contour lines, and a forecast drawn above it. */
  terrain(k) {
    const seg = k.q >= 2 ? 220 : k.q === 1 ? 150 : 96;
    const size = 26;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
    const land = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: {
        uTime: k.time, uGold: { value: k.gold }, uGem: { value: k.gem }, uBg: { value: k.bg },
        uAmp: { value: k.rand(1.7, 2.6) }, uFreq: { value: k.rand(0.1, 0.16) }, uSeed: { value: k.rand(0, 50) },
        uLines: { value: k.rand(2.4, 3.6) }, uSize: { value: size },
      },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uSeed; uniform float uSize;
        varying vec3 vWorld; varying float vH;
        ${NOISE}
        void main() {
          vec3 p = position;
          float fall = smoothstep(uSize * 0.5, uSize * 0.18, length(p.xz));
          p.y = fbm(vec3(p.xz * uFreq, uSeed + uTime * 0.035)) * uAmp * fall;
          vH = p.y;
          vec4 w = modelMatrix * vec4(p, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uGold; uniform vec3 uGem; uniform vec3 uBg; uniform float uLines; uniform float uSize;
        varying vec3 vWorld; varying float vH;
        void main() {
          vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
          vec3 L = normalize(vec3(-0.45, 0.8, 0.35));
          vec3 V = normalize(cameraPosition - vWorld);
          float diff = max(dot(n, L), 0.0);
          float spec = pow(max(dot(reflect(-L, n), V), 0.0), 28.0);
          vec3 col = vec3(0.010, 0.0095, 0.011) + uBg * 0.6 + vec3(0.025) * diff;
          float c = vH * uLines;
          float minor = 1.0 - smoothstep(0.0, fwidth(c) * 1.1, abs(fract(c + 0.5) - 0.5));
          float c4 = c / 4.0;
          float major = 1.0 - smoothstep(0.0, fwidth(c4) * 1.3, abs(fract(c4 + 0.5) - 0.5));
          col += uGold * minor * 0.5 + uGem * major * 1.1 + uGold * spec * 0.35;
          gl_FragColor = vec4(mix(uBg, col, smoothstep(uSize * 0.5, uSize * 0.26, length(vWorld.xz))), 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    land.frustumCulled = false;
    k.add(land);

    // the series: solid where it is history, dashed with a widening band where it is forecast
    const N = 120;
    const split = Math.round(N * k.rand(0.55, 0.68));
    const ph = k.rand(0, TAU);
    const f = (x, t) => 4.2 + 0.55 * Math.sin(x * 0.55 + t * 0.35 + ph) + 0.3 * Math.sin(x * 1.3 + t * 0.6 + ph * 2);
    const xAt = (i) => -9 + (18 * i) / (N - 1);
    const pastGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array((split + 1) * 3), 3));
    const futureGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array((N - split) * 3), 3));
    k.add(new THREE.Line(pastGeo, new THREE.LineBasicMaterial({ color: k.gem.clone().multiplyScalar(1.6) })));
    const future = new THREE.Line(futureGeo, new THREE.LineDashedMaterial({ color: k.gold.clone().multiplyScalar(1.4), dashSize: 0.18, gapSize: 0.12 }));
    k.add(future);
    const bandGeo = new THREE.PlaneGeometry(1, 1, N - split - 1, 1);
    const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: k.gold, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    band.frustumCulled = false;
    k.add(band);
    const marker = k.points(1, { twinkle: 0 });
    marker.size[0] = 14;
    k.gem.toArray(marker.colors, 0);
    k.add(marker.points);
    const z = -3;

    return {
      view: { position: [0, 7.2, 15], target: [0, 1.2, 0], maxPolar: Math.PI * 0.47, dust: 0.6, spin: 0.2, ring: { y: 5.6, radius: 9.5 } },
      update(t) {
        const past = pastGeo.attributes.position;
        for (let i = 0; i <= split; i += 1) past.setXYZ(i, xAt(i), f(xAt(i), t), z);
        past.needsUpdate = true;
        const fut = futureGeo.attributes.position;
        const bp = bandGeo.attributes.position;
        const cols = N - split;
        for (let i = 0; i < cols; i += 1) {
          const x = xAt(split + i);
          const y = f(x, t);
          fut.setXYZ(i, x, y, z);
          const w = 0.05 + (i / cols) * 1.1;
          bp.setXYZ(i, x, y + w, z);
          bp.setXYZ(i + cols, x, y - w, z);
        }
        fut.needsUpdate = true;
        bp.needsUpdate = true;
        future.computeLineDistances();
        marker.position.set([xAt(split), f(xAt(split), t), z]);
        marker.flag();
      },
    };
  },

  /** Analytics and stock levels: obsidian columns rising and falling like a live chart. */
  skyline(k) {
    const radial = k.rng() < 0.5;
    const spots = [];
    if (radial) {
      const rings = k.int(4, 6);
      for (let r = 1; r <= rings; r += 1) {
        const n = Math.round(r * 7.5);
        for (let j = 0; j < n; j += 1) {
          const a = (j / n) * TAU + r * 0.3;
          spots.push([Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05]);
        }
      }
    } else {
      const G = k.int(9, 12);
      for (let i = 0; i < G; i += 1) for (let j = 0; j < G; j += 1) spots.push([(i - (G - 1) / 2) * 0.95, (j - (G - 1) / 2) * 0.95]);
    }
    const n = spots.length;
    const colGeo = new RoundedBoxGeometry(0.62, 1, 0.62, 2, 0.05).translate(0, 0.5, 0);
    const cols = new THREE.InstancedMesh(colGeo, k.obsidianMat({ roughness: 0.24 }), n);
    const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 0.05, 0.64), new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 1, roughness: 0.42, clearcoat: 0, envMapIntensity: 0.55,
    }), n);
    const params = spots.map(([x, z]) => ({ x, z, base: k.rand(0.3, 1.1), amp: k.rand(0.6, 2.6), w: k.rand(0.25, 0.7), ph: k.rand(0, TAU) }));
    params.forEach((_, i) => caps.setColorAt(i, k.gold));
    k.add(cols, caps);
    const sparks = k.points(n, { twinkle: 0 });
    k.add(sparks.points);

    return {
      view: {
        position: radial ? [0, 9.5, 12] : [9, 8, 11.5], target: [0, 1.3, 0],
        floor: { y: 0, radius: 18, rings: 22, grid: !radial }, spin: 0.25, maxPolar: Math.PI * 0.46,
      },
      update(t) {
        params.forEach((c, i) => {
          const h = c.base + c.amp * (0.5 + 0.5 * Math.sin(t * c.w + c.ph)) * (0.65 + 0.35 * Math.sin(t * 0.21 + c.x * 0.35 + c.z * 0.2));
          cols.setMatrixAt(i, _m.compose(_p.set(c.x, 0, c.z), _q.identity(), _s.set(1, h, 1)));
          caps.setMatrixAt(i, _m.makeTranslation(c.x, h + 0.025, c.z));
          const top = h > 2.75;
          caps.setColorAt(i, top ? k.gem : k.gold);
          sparks.position.set([c.x, h + 0.08, c.z], i * 3);
          _c.copy(k.gem).multiplyScalar(1.5).toArray(sparks.colors, i * 3);
          sparks.size[i] = top ? 7 + (h - 2.75) * 4 : 0;
        });
        cols.instanceMatrix.needsUpdate = true;
        caps.instanceMatrix.needsUpdate = true;
        caps.instanceColor.needsUpdate = true;
        sparks.flag();
      },
    };
  },

  /** Series data: ribbons of silk drifting through the dark, data points riding them. */
  silk(k) {
    const count = k.int(4, 7);
    const len = 30;
    const segs = k.q >= 2 ? 420 : 240;
    const hsl = {};
    k.gem.getHSL(hsl);
    const ribbons = [];
    for (let c = 0; c < count; c += 1) {
      const p = {
        phase: k.rand(0, TAU), amp: k.rand(0.6, 1.5), freq: k.rand(0.18, 0.32), yOff: (c - (count - 1) / 2) * k.rand(0.55, 0.85),
        zOff: k.rand(-2.5, 2.5), twist: k.rand(0.6, 1.6), speed: k.rand(0.15, 0.32) * (k.rng() < 0.3 ? -1 : 1),
      };
      const color = c % 3 === 0 ? k.gold.clone() : new THREE.Color().setHSL((hsl.h + k.rand(-0.04, 0.04) + 1) % 1, hsl.s, Math.min(0.75, hsl.l + k.rand(-0.05, 0.1)));
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uTime: k.time, uColor: { value: color }, uPhase: { value: p.phase }, uAmp: { value: p.amp }, uFreq: { value: p.freq },
          uYOff: { value: p.yOff }, uZOff: { value: p.zOff }, uTwist: { value: p.twist }, uSpeed: { value: p.speed },
        },
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uPhase; uniform float uAmp; uniform float uFreq; uniform float uYOff; uniform float uZOff; uniform float uTwist; uniform float uSpeed;
          varying vec3 vN; varying vec3 vV; varying vec2 vUv;
          void main() {
            float x = position.x;
            float s = x * uFreq + uTime * uSpeed + uPhase;
            float y = uYOff + uAmp * (sin(s) * 0.6 + sin(s * 2.3 + 1.7) * 0.25 + sin(s * 0.47 + 0.4) * 0.5);
            float z = uZOff + sin(s * 0.8 + uPhase) * 1.2;
            float tw = sin(s * 0.5 + uPhase) * uTwist;
            vec3 across = vec3(0.0, cos(tw), sin(tw));
            vec3 p = vec3(x, y, z) + across * position.y;
            vN = normalMatrix * vec3(0.0, -sin(tw), cos(tw));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vV = -mv.xyz;
            vUv = uv;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec3 vN; varying vec3 vV; varying vec2 vUv;
          void main() {
            vec3 n = normalize(vN);
            vec3 v = normalize(vV);
            float facing = abs(dot(n, v));
            float sheen = pow(abs(dot(n, normalize(vec3(0.3, 0.8, 0.5)))), 7.0);
            float fres = pow(1.0 - facing, 2.0);
            vec3 col = uColor * (0.22 + 1.1 * sheen) + uColor * fres * 0.7;
            float edge = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
            float ends = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
            gl_FragColor = vec4(col, (0.5 + 0.5 * sheen) * edge * ends);
            #include <colorspace_fragment>
          }`,
      });
      const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(len, k.rand(0.25, 0.6), segs, 1), mat);
      ribbon.frustumCulled = false;
      k.add(ribbon);
      ribbons.push({ ...p, color });
    }
    const per = 6;
    const beads = k.points(count * per, { twinkle: 0 });
    ribbons.forEach((r, c) => {
      for (let j = 0; j < per; j += 1) {
        _c.copy(r.color).multiplyScalar(1.7).toArray(beads.colors, (c * per + j) * 3);
        beads.size[c * per + j] = 6;
      }
    });
    k.add(beads.points);

    return {
      view: { position: [0, 1, 13], target: [0, 0, 0], maxPolar: Math.PI * 0.8, spin: 0.25 },
      update(t) {
        ribbons.forEach((r, c) => {
          for (let j = 0; j < per; j += 1) {
            const x = ((((j / per) * len + t * 1.2 + c * 3) % len) + len) % len - len / 2;
            const s = x * r.freq + t * r.speed + r.phase;
            const y = r.yOff + r.amp * (Math.sin(s) * 0.6 + Math.sin(s * 2.3 + 1.7) * 0.25 + Math.sin(s * 0.47 + 0.4) * 0.5);
            const z = r.zOff + Math.sin(s * 0.8 + r.phase) * 1.2;
            beads.position.set([x, y, z], (c * per + j) * 3);
            beads.size[c * per + j] = 6 * Math.min(1, (len / 2 - Math.abs(x)) / 3);
          }
        });
        beads.flag();
      },
    };
  },

  /** Storage engines and structured data: levels of stone blocks, a lookup falling through them. */
  foundry(k) {
    const L = k.int(3, 5);
    const fan = k.pick([2, 2, 3]);
    const levels = [];
    for (let i = 0, c = 1; i < L; i += 1, c *= fan) levels.push(Math.min(c, 18));
    const W = 12;
    const H = 1.45;
    const blocks = [];
    const starts = [];
    levels.forEach((c, li) => {
      starts.push(blocks.length);
      const slot = W / c;
      const w = Math.min(3.2, Math.max(0.42, slot * 0.8));
      for (let j = 0; j < c; j += 1) {
        blocks.push({
          x: -W / 2 + slot * (j + 0.5), y: (L - 1 - li) * H + 0.5, w, level: li,
          parent: li ? starts[li - 1] + Math.floor((j * levels[li - 1]) / c) : -1, children: [],
        });
      }
    });
    blocks.forEach((b, i) => { if (b.parent >= 0) blocks[b.parent].children.push(i); });

    const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.05);
    const glow = glowAttribute(geo, blocks.length);
    const mesh = new THREE.InstancedMesh(geo, glowable(k.obsidianMat(), k.gem), blocks.length);
    blocks.forEach((b, i) => mesh.setMatrixAt(i, _m.compose(_p.set(b.x, b.y, 0), _q.identity(), _s.set(b.w, 0.5, 1.1))));
    k.add(mesh);
    const edges = [];
    const corner = (b, sx, sy, sz) => new THREE.Vector3(b.x + (sx * b.w) / 2, b.y + sy * 0.25, sz * 0.55);
    for (const b of blocks) {
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) edges.push([corner(b, -1, sy, sz), corner(b, 1, sy, sz)]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) edges.push([corner(b, sx, -1, sz), corner(b, sx, 1, sz)]);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) edges.push([corner(b, sx, sy, -1), corner(b, sx, sy, 1)]);
    }
    k.add(new THREE.LineSegments(segments(edges), k.lineMat(k.gold, 0.55)));
    const links = blocks.filter((b) => b.parent >= 0).map((b) => [new THREE.Vector3(blocks[b.parent].x, blocks[b.parent].y - 0.25, 0), new THREE.Vector3(b.x, b.y + 0.25, 0)]);
    k.add(new THREE.LineSegments(segments(links), k.lineMat(k.gold, 0.3)));

    const packet = k.points(4, { twinkle: 0 });
    for (let i = 0; i < 4; i += 1) {
      _c.copy(i ? k.gem : k.ivory).multiplyScalar(1.6 - i * 0.3).toArray(packet.colors, i * 3);
      packet.size[i] = 14 - i * 3;
    }
    k.add(packet.points);
    const route = (cycle) => {
      const r = mulberry32(cycle * 7919 + 13);
      const out = [0];
      while (blocks[out[out.length - 1]].children.length) {
        const kids = blocks[out[out.length - 1]].children;
        out.push(kids[Math.floor(r() * kids.length)]);
      }
      return out;
    };
    const period = 2.6;
    const tmp = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();

    return {
      view: { position: [0, 4.4, 16.5], target: [0, ((L - 1) * H) / 2 + 0.4, 0], floor: { y: -0.05, radius: 20, rings: 26 }, spin: 0.22, maxPolar: Math.PI * 0.5 },
      update(t) {
        const cycle = Math.floor(t / period);
        const u = (t % period) / period;
        const path = route(cycle);
        const stepU = u * (path.length - 1);
        const at = Math.min(path.length - 2, Math.floor(stepU));
        blocks.forEach((blk, i) => {
          const wave = Math.max(0, 1 - Math.abs(((t * 0.35 + blk.level * 0.12) % 3) - 1.5 - blk.x / 24) * 6) * 0.25;
          const idx = path.indexOf(i);
          const lit = idx >= 0 && idx <= stepU + 0.5 ? 1.4 * Math.max(0.25, 1 - (stepU - idx) * 0.3) : 0;
          glow.array[i] = (lit + wave) * 0.7;
        });
        glow.needsUpdate = true;
        if (path.length > 1) {
          for (let i = 0; i < 4; i += 1) {
            const v = Math.max(0, stepU - i * 0.06);
            const s = Math.min(path.length - 2, Math.floor(v));
            a.set(blocks[path[s]].x, blocks[path[s]].y, 0.7);
            b.set(blocks[path[s + 1]].x, blocks[path[s + 1]].y, 0.7);
            tmp.lerpVectors(a, b, ease(clamp01(v - s))).toArray(packet.position, i * 3);
          }
        } else {
          packet.position.set([blocks[0].x, blocks[0].y, 0.7]);
        }
        packet.flag();
        return at;
      },
    };
  },

  /** Language models and languages: a dark orb in a golden armillary, tokens in orbit. */
  oracle(k) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 64), new THREE.MeshPhysicalMaterial({
      color: 0x07070a, metalness: 0.3, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04,
      iridescence: 0.5, iridescenceIOR: 1.6, envMapIntensity: 1.5,
    }));
    k.add(orb);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(1.56, 64, 48), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: k.gem }, uTime: k.time },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uTime;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
          gl_FragColor = vec4(uColor * f * (1.3 + 0.3 * sin(uTime * 1.2)), f);
        }`,
    }));
    k.add(rim);

    const gold = k.goldMat();
    const beadMat = k.gemMat(2.2);
    const rings = [0, 1, 2, 3].slice(0, k.int(3, 4)).map((i) => {
      const r = 2.1 + i * 0.28;
      const ring = new THREE.Group();
      ring.add(new THREE.Mesh(new THREE.TorusGeometry(r, i === 0 ? 0.025 : 0.016, 12, 240), gold));
      for (let j = 0; j < 3; j += 1) {
        const a = (j / 3) * TAU + i;
        ring.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), beadMat), Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      ring.userData = { ax: k.rand(0, Math.PI), ay: k.rand(0, Math.PI), sx: k.rand(0.1, 0.25) * (i % 2 ? -1 : 1), sy: k.rand(0.05, 0.15) };
      k.add(ring);
      return ring;
    });

    const planes = k.int(3, 6);
    const per = k.q >= 2 ? k.int(50, 70) : k.q === 1 ? 40 : 26;
    const tokens = [];
    for (let pl = 0; pl < planes; pl += 1) {
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(k.rand(-0.9, 0.9), k.rand(0, TAU), k.rand(-0.5, 0.5)));
      const radius = k.rand(3.3, 5.2);
      const speed = k.rand(0.12, 0.3) * (k.rng() < 0.4 ? -1 : 1);
      const ecc = k.rand(0.75, 1);
      for (let j = 0; j < per; j += 1) tokens.push({ tilt, radius: radius + k.rand(-0.15, 0.15), speed, ecc, phase: (j / per) * TAU + k.rand(-0.04, 0.04), gold: k.rng() < 0.35, len: k.rand(0.12, 0.3) });
    }
    const tokenMesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 0.07, 0.035, 2, 0.015), new THREE.MeshBasicMaterial({ color: 0xffffff }), tokens.length);
    tokens.forEach((tk, i) => tokenMesh.setColorAt(i, _c.copy(tk.gold ? k.gold : k.gem).multiplyScalar(tk.gold ? 1.2 : 1.5)));
    k.add(tokenMesh);
    const dais = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.04, 12, 200), gold);
    dais.rotation.x = Math.PI / 2;
    dais.position.y = -2.7;
    k.add(dais);
    const pos = new THREE.Vector3();
    const tan = new THREE.Vector3();

    return {
      view: { position: [0, 1.4, 10.5], target: [0, 0, 0], floor: { y: -3.2, radius: 18, rings: 22 }, maxPolar: Math.PI * 0.56, spin: 0.3 },
      update(t) {
        orb.rotation.y = t * 0.1;
        rings.forEach((ring) => ring.rotation.set(ring.userData.ax + t * ring.userData.sx, ring.userData.ay + t * ring.userData.sy, 0));
        tokens.forEach((tk, i) => {
          const a = tk.phase + t * tk.speed;
          pos.set(Math.cos(a) * tk.radius, 0, Math.sin(a) * tk.radius * tk.ecc).applyQuaternion(tk.tilt);
          tan.set(-Math.sin(a), 0, Math.cos(a) * tk.ecc).normalize().applyQuaternion(tk.tilt);
          if (tk.speed < 0) tan.negate();
          _q.setFromUnitVectors(X, tan);
          tokenMesh.setMatrixAt(i, _m.compose(pos, _q, _s.set(tk.len, 1, 1)));
        });
        tokenMesh.instanceMatrix.needsUpdate = true;
      },
    };
  },

  /** Search and retrieval: pages on a spiral stair, the right one drawn out and lit. */
  library(k) {
    const P = k.q >= 1 ? k.int(30, 44) : 24;
    const radius = 3.4;
    const rise = 0.19;
    const turn = k.rand(0.36, 0.48);
    const textures = [0, 1, 2].map((i) => k.own(pageTexture(k, i)));
    const pageGeo = new THREE.PlaneGeometry(0.95, 1.3);
    const edgeGeo = new THREE.EdgesGeometry(pageGeo);
    const edgeMat = k.lineMat(k.gold, 0.75);
    const helix = k.add(new THREE.Group());
    const pages = [];
    for (let i = 0; i < P; i += 1) {
      const a = i * turn;
      const map = textures[i % 3];
      const mat = new THREE.MeshStandardMaterial({ map, emissive: k.gem, emissiveMap: map, emissiveIntensity: 0, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
      const page = new THREE.Mesh(pageGeo, mat);
      const base = new THREE.Vector3(Math.cos(a) * radius, 0.85 + i * rise, Math.sin(a) * radius);
      page.position.copy(base);
      page.lookAt(base.x * 2, base.y, base.z * 2);
      page.rotateX(-0.08);
      page.add(new THREE.LineSegments(edgeGeo, edgeMat));
      helix.add(page);
      pages.push({ page, mat, base, out: base.clone().setY(0).normalize() });
    }
    const height = 0.85 + P * rise;
    helix.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height + 1, 16), k.goldMat()), 0, (height + 1) / 2 - 0.3, 0));
    const query = at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), k.gemMat(2)), 0, height + 0.5, 0);
    helix.add(query);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8, 1, true), k.glowMat(k.gem, 1.6));
    helix.add(beam);
    const order = Array.from({ length: P }, (_, i) => i).sort(() => k.rng() - 0.5);
    const period = 1.9;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    const mid = new THREE.Vector3();

    return {
      view: { position: [0, height * 0.55, 12], target: [0, height * 0.45, 0], floor: { y: -0.2, radius: 18, rings: 24 }, spin: 0.25, maxPolar: Math.PI * 0.55 },
      update(t) {
        helix.rotation.y = t * 0.08;
        const cycle = Math.floor(t / period);
        const u = (t % period) / period;
        const current = order[((cycle % P) + P) % P];
        const previous = order[((cycle % P) + P - 1) % P];
        pages.forEach((pg, i) => {
          let lit = 0;
          if (i === current) lit = ease(clamp01(u * 3));
          else if (i === previous) lit = 1 - ease(clamp01(u * 3));
          pg.mat.emissiveIntensity = lit * 1.4;
          pg.page.position.copy(pg.base).addScaledVector(pg.out, lit * 0.7);
        });
        const pg = pages[current];
        from.set(0, pg.page.position.y, 0);
        to.copy(pg.page.position);
        mid.lerpVectors(from, to, 0.5);
        beam.position.copy(mid);
        beam.quaternion.setFromUnitVectors(Y, to.clone().sub(from).normalize());
        beam.scale.set(1, from.distanceTo(to), 1);
        beam.material.opacity = ease(clamp01(u * 3));
        query.scale.setScalar(1 + 0.15 * Math.sin(t * 3));
      },
    };
  },

  /** Games and play: a neon grid under a setting sun, a snake of gold, coins to collect. */
  arcade(k) {
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(90, 90).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: k.time, uGem: { value: k.gem }, uGold: { value: k.gold }, uBg: { value: k.bg }, uSpeed: { value: k.rand(1.2, 2) } },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uGem; uniform vec3 uGold; uniform vec3 uBg; uniform float uSpeed;
        varying vec3 vWorld;
        ${HAIR}
        void main() {
          float z = vWorld.z + uTime * uSpeed;
          float g = max(hair(vWorld.x, 1.3), hair(z, 1.3));
          float major = max(hair(vWorld.x / 4.0, 1.5), hair(z / 4.0, 1.5));
          float dist = length(vWorld.xz - vec2(0.0, -6.0));
          float fade = smoothstep(42.0, 4.0, dist);
          vec3 col = uBg + (uGem * g * 0.7 + uGold * major * 0.9) * fade;
          col += uGem * 0.12 * smoothstep(20.0, 40.0, -vWorld.z) * smoothstep(48.0, 30.0, -vWorld.z);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    k.add(grid);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(7, 96), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: k.time, uTop: { value: k.gold.clone().multiplyScalar(1.6) }, uBottom: { value: k.gem.clone().multiplyScalar(1.4) } },
      vertexShader: /* glsl */ `
        varying vec2 vP;
        void main() { vP = position.xy / 7.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uTop; uniform vec3 uBottom;
        varying vec2 vP;
        void main() {
          float y = vP.y;
          float bands = step(0.0, sin((y + uTime * 0.04) * 40.0)) ;
          float cut = y < 0.15 ? mix(1.0, bands, smoothstep(0.15, -0.4, y)) : 1.0;
          if (cut < 0.5) discard;
          vec3 col = mix(uBottom, uTop, smoothstep(-0.9, 0.8, y));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    sun.position.set(0, 4.2, -40);
    k.add(sun);
    const ridge = (side) => {
      const geo = new THREE.PlaneGeometry(40, 10, 40, 8).rotateX(-Math.PI / 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i);
        const zz = p.getZ(i);
        const edge = Math.abs(x) / 20;
        p.setY(i, Math.max(0, (Math.sin(x * 0.5 + side) + Math.sin(zz * 0.9 + x * 0.2) * 0.6 + 1.2) * edge * 3.2 + k.rand(-0.3, 0.3) * edge));
      }
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: k.gem.clone().multiplyScalar(0.8), wireframe: true, transparent: true, opacity: 0.35 }));
      mesh.position.set(side * 24, 0, -26);
      return mesh;
    };
    k.add(ridge(-1), ridge(1));

    const len = k.int(12, 18);
    const cube = new RoundedBoxGeometry(0.42, 0.42, 0.42, 2, 0.06);
    const snake = new THREE.InstancedMesh(cube, new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.2, emissive: k.gem, emissiveIntensity: 0.35, envMapIntensity: 1.4 }), len);
    for (let i = 0; i < len; i += 1) snake.setColorAt(i, i === 0 ? k.gem : i % 2 ? k.gold : _c.copy(k.gold).lerp(k.gem, 0.35));
    k.add(snake);
    const ph = k.rand(0, TAU);
    const head = (t, out) => out.set(Math.sin(t * 0.8 + ph) * 3.2 + Math.sin(t * 0.37) * 1.2, 0.24, -6 + Math.cos(t * 0.55 + ph) * 3);

    const coinMat = k.goldMat({ roughness: 0.18 });
    const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 40).rotateX(Math.PI / 2);
    const gemGeo = new THREE.OctahedronGeometry(0.3, 0);
    const gemMat = k.gemMat(1.6);
    const pickups = Array.from({ length: k.int(6, 10) }, (_, i) => {
      const mesh = new THREE.Mesh(i % 3 === 2 ? gemGeo : coinGeo, i % 3 === 2 ? gemMat : coinMat);
      mesh.position.set(k.rand(-7, 7), k.rand(0.8, 2.6), k.rand(-14, -1));
      mesh.userData.base = mesh.position.y;
      mesh.userData.ph = k.rand(0, TAU);
      k.add(mesh);
      return mesh;
    });
    const p = new THREE.Vector3();

    return {
      view: { position: [0, 2.6, 8.5], target: [0, 1.2, -6], maxPolar: Math.PI * 0.49, fog: [20, 60], dust: 0.5, spin: 0.15, maxDistance: 18, ring: { y: 0.02, radius: 5.6, z: -6 } },
      update(t) {
        for (let i = 0; i < len; i += 1) {
          head(t - i * 0.13, p);
          snake.setMatrixAt(i, _m.compose(p, _q.setFromAxisAngle(Y, t * 0.5 + i * 0.2), _s.setScalar(i === 0 ? 1.15 : 1 - i * 0.012)));
        }
        snake.instanceMatrix.needsUpdate = true;
        pickups.forEach((m) => {
          m.rotation.y = t * 1.4 + m.userData.ph;
          m.position.y = m.userData.base + Math.sin(t * 1.6 + m.userData.ph) * 0.18;
        });
      },
    };
  },

  /** Trees, rollouts and agent hierarchies: a grove of gold where every fork is a decision. */
  grove(k) {
    const T = k.int(3, 6);
    const depth = k.q >= 1 ? k.int(4, 5) : 4;
    const branches = [];
    const leaves = [];
    const trees = [];
    const perp = new THREE.Vector3();
    const grow = (tree, from, dir, length, radius, d, parentNode) => {
      const to = from.clone().addScaledVector(dir, length);
      branches.push({ from: from.clone(), dir: dir.clone(), length, radius });
      const node = { p: to, kids: [], leaf: -1 };
      parentNode.kids.push(node);
      if (d === 0) {
        node.leaf = leaves.length;
        leaves.push({ p: to, glow: 0 });
        return;
      }
      for (const side of [-1, 1]) {
        perp.set(k.rand(-1, 1), 0, k.rand(-1, 1)).cross(dir).normalize();
        if (perp.lengthSq() < 0.01) perp.set(1, 0, 0);
        const child = dir.clone().applyAxisAngle(perp, side * k.rand(0.35, 0.65)).normalize();
        child.y = Math.max(child.y, 0.25);
        grow(tree, to, child.normalize(), length * k.rand(0.66, 0.78), radius * 0.68, d - 1, node);
      }
    };
    for (let i = 0; i < T; i += 1) {
      const a = T === 1 ? 0 : (i / T) * TAU + 0.4;
      const ring = T === 1 ? 0 : k.rand(3.4, 4.4);
      const root = new THREE.Vector3(Math.cos(a) * ring, 0, Math.sin(a) * ring);
      const tree = { root: { p: root, kids: [] } };
      grow(tree, root, new THREE.Vector3(k.rand(-0.1, 0.1), 1, k.rand(-0.1, 0.1)).normalize(), k.rand(1.3, 1.8), 0.09, depth, tree.root);
      trees.push(tree);
      k.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 48), k.obsidianMat()), root.x, 0.06, root.z));
    }
    const limb = new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0);
    const limbs = new THREE.InstancedMesh(limb, k.goldMat({ roughness: 0.3 }), branches.length);
    branches.forEach((b, i) => limbs.setMatrixAt(i, _m.compose(b.from, _q.setFromUnitVectors(Y, b.dir), _s.set(b.radius, b.length, b.radius))));
    k.add(limbs);
    const leafMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), leaves.length);
    leaves.forEach((lf, i) => leafMesh.setColorAt(i, k.gem));
    k.add(leafMesh);
    const runners = k.points(T, { twinkle: 0 });
    for (let i = 0; i < T; i += 1) {
      _c.copy(k.ivory).multiplyScalar(1.6).toArray(runners.colors, i * 3);
      runners.size[i] = 11;
    }
    k.add(runners.points);
    const walk = (tree, cycle) => {
      const r = mulberry32(cycle * 104729 + trees.indexOf(tree));
      const pts = [tree.root.p];
      let node = tree.root.kids[0];
      pts.push(node.p);
      while (node.kids.length) {
        node = node.kids[Math.floor(r() * node.kids.length)];
        pts.push(node.p);
      }
      return { pts, leaf: node.leaf };
    };
    const period = 2.4;
    const tmp = new THREE.Vector3();

    return {
      view: { position: [0, 3.8, 13], target: [0, 2.4, 0], floor: { y: 0, radius: 18, rings: 24 }, spin: 0.25, maxPolar: Math.PI * 0.5 },
      update(t, dt) {
        trees.forEach((tree, i) => {
          const offset = i * 0.37;
          const cycle = Math.floor((t + offset) / period);
          const u = ((t + offset) % period) / period;
          const { pts, leaf } = walk(tree, cycle);
          const v = clamp01(u * 1.25) * (pts.length - 1);
          const s = Math.min(pts.length - 2, Math.floor(v));
          tmp.lerpVectors(pts[s], pts[s + 1], v - s).toArray(runners.position, i * 3);
          if (u > 0.78 && leaf >= 0) leaves[leaf].glow = Math.max(leaves[leaf].glow, 1);
        });
        runners.flag();
        leaves.forEach((lf, i) => {
          lf.glow = Math.max(0, lf.glow - (dt || 0) * 1.2);
          const pulse = 1 + 0.12 * Math.sin(t * 2 + i);
          leafMesh.setMatrixAt(i, _m.compose(lf.p, _q.setFromAxisAngle(Y, t + i), _s.setScalar(pulse + lf.glow * 0.8)));
          leafMesh.setColorAt(i, _c.copy(k.gem).multiplyScalar(1 + lf.glow * 2.5));
        });
        leafMesh.instanceMatrix.needsUpdate = true;
        leafMesh.instanceColor.needsUpdate = true;
      },
    };
  },

  /** Images, dashboards and traces: a wall of tiles rewritten one window at a time. */
  mosaic(k) {
    // a flat wall facing the viewer mirrors the studio's ceiling lights, so this room is lit softly
    k.scene.environmentIntensity = 0.3;
    const W = k.q >= 1 ? 30 : 22;
    const H = k.q >= 1 ? 17 : 12;
    const step = 0.44;
    const n = W * H;
    const fx = k.rand(0.15, 0.35);
    const fy = k.rand(0.15, 0.35);
    const ph = k.rand(0, TAU);
    const value = (i, j) => 0.5 + 0.25 * Math.sin(i * fx + ph) * Math.cos(j * fy - ph) + 0.25 * Math.sin(Math.hypot(i - W * 0.6, j - H * 0.4) * 0.45 + ph);
    const raw = [];
    for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) raw.push(value(i, j));
    const v = (i, j) => raw[Math.max(0, Math.min(H - 1, j)) * W + Math.max(0, Math.min(W - 1, i))];
    const edge = raw.map((_, idx) => {
      const i = idx % W;
      const j = Math.floor(idx / W);
      const gx = v(i + 1, j - 1) + 2 * v(i + 1, j) + v(i + 1, j + 1) - v(i - 1, j - 1) - 2 * v(i - 1, j) - v(i - 1, j + 1);
      const gy = v(i - 1, j + 1) + 2 * v(i, j + 1) + v(i + 1, j + 1) - v(i - 1, j - 1) - 2 * v(i, j - 1) - v(i + 1, j - 1);
      return Math.min(1, Math.hypot(gx, gy) * 2.2);
    });
    // mostly obsidian, the gem where the picture brightens, gold only at its peaks
    const dark = new THREE.Color(0x0c0b0e);
    const ramp = (x, out) => {
      const v = Math.pow(clamp01((x - 0.3) / 0.7), 1.5);
      if (v < 0.55) return out.copy(dark).lerp(k.gem, (v / 0.55) * 0.45);
      return out.copy(k.gem).multiplyScalar(0.45).lerp(k.gold, (v - 0.55) / 0.45).multiplyScalar(0.7);
    };
    const geo = new THREE.BoxGeometry(0.38, 0.38, 0.08);
    const glow = glowAttribute(geo, n);
    const tiles = new THREE.InstancedMesh(geo, glowable(new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.6 }), k.gold), n);
    const state = new Int8Array(n).fill(-1);
    const wall = k.add(new THREE.Group());
    wall.position.y = 0.9 + (H * step) / 2;
    wall.add(tiles);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(step * 3, step * 3)), k.lineMat(k.gold.clone().multiplyScalar(1.8), 1));
    wall.add(frame);
    const backing = at(new THREE.Mesh(new THREE.BoxGeometry(W * step + 0.5, H * step + 0.5, 0.12), k.obsidianMat({ roughness: 0.75, clearcoat: 0, envMapIntensity: 0.15 })), 0, 0, -0.12);
    wall.add(backing);
    wall.add(at(new THREE.Mesh(new THREE.BoxGeometry(W * step + 0.8, 0.08, 0.6), k.goldMat()), 0, -(H * step) / 2 - 0.3, 0));
    const xOf = (i) => (i - (W - 1) / 2) * step;
    const yOf = (j) => ((H - 1) / 2 - j) * step;
    const speed = k.rand(24, 40);

    return {
      view: { position: [0, 4, 12.5], target: [0, wall.position.y, 0], floor: { y: 0, radius: 18, rings: 24 }, maxPolar: Math.PI * 0.55, spin: 0.12 },
      update(t) {
        const s = t * speed;
        const pass = Math.floor(s / n);
        const at = s % n;
        const ki = Math.floor(at) % W;
        const kj = Math.floor(Math.floor(at) / W);
        frame.position.set(xOf(ki), yOf(kj), 0.12);
        for (let idx = 0; idx < n; idx += 1) {
          const i = idx % W;
          const j = Math.floor(idx / W);
          const done = idx < at;
          const showEdge = (pass % 2 === 0) === done ? 1 : 0;
          const near = Math.abs(i - ki) <= 1 && Math.abs(j - kj) <= 1;
          if (state[idx] !== showEdge) {
            state[idx] = showEdge;
            tiles.setColorAt(idx, ramp(showEdge ? edge[idx] : raw[idx], _c));
            tiles.instanceColor.needsUpdate = true;
          }
          glow.array[idx] = near ? 0.35 : 0;
          tiles.setMatrixAt(idx, _m.makeTranslation(xOf(i), yOf(j), near ? 0.1 : 0));
        }
        glow.needsUpdate = true;
        tiles.instanceMatrix.needsUpdate = true;
      },
    };
  },

  /** Traffic, funnels and allocation: a vortex of light drawn down into a golden ring. */
  maelstrom(k) {
    const N = k.q >= 2 ? 14000 : k.q === 1 ? 8000 : 4000;
    const geo = new THREE.BufferGeometry();
    const seeds = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i += 1) seeds[i] = k.rng();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const top = k.rand(4.7, 6.1);
    const bottom = 0.65;
    const rim = k.rand(5.4, 6.9);
    const flare = k.rand(0.5, 1.5); // how fast the funnel narrows: a trumpet below 1, a bowl above
    const arms = k.pick([0, 2, 3, 5]); // 0 is a loose swirl, otherwise the light gathers into that many arms
    const spin = k.pick([1, -1]);
    const vortex = new THREE.Points(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: k.time, uPR: { value: k.pr }, uGold: { value: k.gold }, uGem: { value: k.gem },
        uTurns: { value: k.rand(2, 3.4) }, uTop: { value: top }, uBottom: { value: bottom },
        uRim: { value: rim }, uFlare: { value: flare }, uArms: { value: arms }, uSpin: { value: spin },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime; uniform float uPR; uniform float uTurns; uniform float uTop; uniform float uBottom;
        uniform float uRim; uniform float uFlare; uniform float uArms; uniform float uSpin;
        uniform vec3 uGold; uniform vec3 uGem;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          float life = fract(uTime * (0.05 + aSeed.w * 0.07) + aSeed.x);
          float r = mix(uRim, 0.5, pow(life, uFlare)) + (aSeed.z - 0.5) * 0.5 * (1.0 - life);
          float y = mix(uTop, uBottom, pow(life, 1.4)) + (fract(aSeed.x * 13.7) - 0.5) * 0.5 * (1.0 - life);
          float lane = uArms > 0.5 ? (floor(aSeed.y * uArms) + (fract(aSeed.y * uArms) - 0.5) * 0.35) / uArms : aSeed.y;
          float ang = lane * 6.2832 + uSpin * (uTime * 0.22 + life * uTurns * 6.2832);
          vec4 mv = modelViewMatrix * vec4(cos(ang) * r, y, sin(ang) * r, 1.0);
          vColor = mix(uGold, uGem, smoothstep(0.2, 0.85, life)) * (1.0 + 1.5 * smoothstep(0.9, 1.0, life));
          vAlpha = smoothstep(0.0, 0.08, life) * smoothstep(1.0, 0.92, life);
          gl_PointSize = mix(6.5, 3.0, life) * (0.45 + aSeed.w) * uPR * (10.0 / max(-mv.z, 0.5));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          float a = pow(1.0 - d, 2.0) * vAlpha;
          gl_FragColor = vec4(vColor * a, a);
          #include <colorspace_fragment>
        }`,
    }));
    vortex.frustumCulled = false;
    k.add(vortex);
    const gold = k.goldMat();
    const rimTop = new THREE.Mesh(new THREE.TorusGeometry(rim + 0.15, 0.035, 12, 260), gold);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = top;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 16, 120), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = bottom;
    const heart = at(new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 24), k.gemMat(2.6)), 0, bottom, 0);
    const light = at(new THREE.PointLight(k.gem, 8, 0, 2), 0, bottom + 0.4, 0);
    k.add(rimTop, ring, heart, light);
    k.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.3, 64), k.obsidianMat()), 0, 0.15, 0));
    // fine gold bands where the funnel passes through them, 0 to 2 of them
    const bands = k.int(0, 2);
    for (let i = 1; i <= bands; i += 1) {
      const l = i / (bands + 1);
      const band = new THREE.Mesh(new THREE.TorusGeometry(rim + (0.5 - rim) * Math.pow(l, flare) + 0.12, 0.022, 10, 200), gold);
      band.rotation.x = Math.PI / 2;
      band.position.y = top + (bottom - top) * Math.pow(l, 1.4);
      k.add(band);
    }

    return {
      view: { position: [0, 7.6, 11.5], target: [0, 2.4, 0], floor: { y: 0, radius: 20, rings: 28 }, spin: 0.2, maxPolar: Math.PI * 0.48 },
      update(t) {
        heart.scale.setScalar(1 + 0.1 * Math.sin(t * 2.4));
        rimTop.rotation.z = t * 0.05;
      },
    };
  },

  /** Guardrails, proxies and redirects: gates in procession, and what gets stopped at them. */
  gatehouse(k) {
    const G = k.int(7, 11);
    const spacing = 2.6;
    const style = k.pick(['arch', 'ring', 'frame']);
    const bend = k.pick([0, 1, -1]) * k.rand(0.005, 0.009); // the procession runs straight or curves away
    const along = (z) => bend * z * z;
    // round bars and a dimmer room: flat gold faces turned to the viewer mirror the studio's brightest panel as a glare
    k.scene.environmentIntensity = 0.3;
    const gold = k.goldMat();
    const pillar = new THREE.CylinderGeometry(0.12, 0.12, 3, 24);
    const archTop = new THREE.TorusGeometry(1.6, 0.11, 12, 80, Math.PI);
    const ringGeo = new THREE.TorusGeometry(1.9, 0.08, 16, 140);
    const bar = new THREE.CylinderGeometry(0.09, 0.09, 3.44, 20).rotateZ(Math.PI / 2);
    const post = new THREE.CylinderGeometry(0.09, 0.09, 4.02, 20);
    const knot = new THREE.SphereGeometry(0.14, 24, 16);
    const gates = [];
    for (let i = 0; i < G; i += 1) {
      const z = -i * spacing;
      const gate = new THREE.Group();
      gate.position.set(along(z), 0, z);
      gate.rotation.y = Math.atan(2 * bend * z);
      if (style === 'arch') {
        gate.add(at(new THREE.Mesh(pillar, gold), -1.6, 1.5, 0), at(new THREE.Mesh(pillar, gold), 1.6, 1.5, 0), at(new THREE.Mesh(archTop, gold), 0, 3, 0));
      } else if (style === 'ring') {
        gate.add(at(new THREE.Mesh(ringGeo, gold), 0, 2.1, 0));
      } else {
        gate.add(at(new THREE.Mesh(bar, gold), 0, 4, 0), at(new THREE.Mesh(bar, gold), 0, 0.08, 0), at(new THREE.Mesh(post, gold), -1.72, 2, 0), at(new THREE.Mesh(post, gold), 1.72, 2, 0));
        for (const [x, y] of [[-1.72, 4], [1.72, 4], [-1.72, 0.08], [1.72, 0.08]]) gate.add(at(new THREE.Mesh(knot, gold), x, y, 0));
      }
      const hit = { value: 0 };
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.4), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: k.time, uHit: hit, uColor: { value: k.gem }, uShape: { value: style === 'ring' ? 1 : style === 'arch' ? 2 : 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uHit; uniform vec3 uColor; uniform float uShape;
          varying vec2 vP;
          void main() {
            vec2 p = vP + vec2(0.0, 2.2);
            float inside = 1.0;
            if (uShape > 1.5) inside = step(abs(p.x), 1.5) * (p.y < 3.0 ? 1.0 : step(length(p - vec2(0.0, 3.0)), 1.5));
            else if (uShape > 0.5) inside = step(length(p - vec2(0.0, 2.1)), 1.82);
            else inside = step(abs(p.x), 1.6) * step(0.2, p.y) * step(p.y, 3.9);
            float lines = 0.5 + 0.5 * sin(p.y * 22.0 - uTime * 2.0);
            float a = inside * (0.035 + 0.05 * lines + uHit * 0.35);
            gl_FragColor = vec4(uColor * a, a);
          }`,
      }));
      veil.position.y = 2.2;
      gate.add(veil);
      k.add(gate);
      gates.push({ z, hit });
    }
    const length = (G - 1) * spacing + 8.6;
    const lane = new THREE.CatmullRomCurve3(Array.from({ length: 24 }, (_, i) => {
      const z = 4.3 - (i / 23) * length;
      return new THREE.Vector3(along(z), 0.02, z);
    }));
    k.add(new THREE.Mesh(new THREE.TubeGeometry(lane, 160, 0.025, 6, false), k.glowMat(k.gold, 1.2)));

    const R = k.q >= 1 ? 70 : 40;
    const start = 4;
    const end = -(G - 1) * spacing - 3;
    const travel = start - end;
    const reqs = Array.from({ length: R }, () => ({
      x: k.rand(-1.1, 1.1), y: k.rand(0.6, 3.4), speed: k.rand(1.6, 2.8), phase: k.rand(0, 100),
      stop: k.rng() < 0.3 ? k.int(0, G - 1) : -1,
    }));
    const lights = k.points(R, { twinkle: 0 });
    k.add(lights.points);
    const warn = new THREE.Color('#ff6b72');

    return {
      view: { position: [3.2, 2.6, 9.5], target: [0, 2, -6], floor: { y: 0, radius: 26, rings: 30 }, spin: 0.12, maxPolar: Math.PI * 0.5, maxDistance: 22, ring: { radius: 4.2, z: 2.6 } },
      update(t) {
        for (const g of gates) g.hit.value *= 0.9;
        reqs.forEach((r, i) => {
          const life = ((t * r.speed + r.phase) % (travel + 4)) - 2;
          let z = start - life;
          let blocked = false;
          let fade = clamp01(life / 1.5) * clamp01((z - end) / 1.5);
          if (r.stop >= 0 && z <= gates[r.stop].z) {
            const over = gates[r.stop].z - z;
            z = gates[r.stop].z + 0.25;
            blocked = true;
            fade = clamp01(1 - over / 2);
            if (over < 0.3) gates[r.stop].hit.value = Math.max(gates[r.stop].hit.value, 1);
          }
          const turn = Math.atan(2 * bend * z); // across the lane, square to the gates where it curves
          lights.position.set([along(z) + r.x * Math.cos(turn), r.y, z - r.x * Math.sin(turn)], i * 3);
          _c.copy(blocked ? warn : k.gold).multiplyScalar(blocked ? 1.6 : 1.3).toArray(lights.colors, i * 3);
          lights.size[i] = (blocked ? 9 : 5) * fade;
        });
        lights.flag();
      },
    };
  },
};

/** A page of the library: a dark card with a gold rule and faint lines of text. */
function pageTexture(k, variant) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 352;
  const g = canvas.getContext('2d');
  g.fillStyle = '#16130f';
  g.fillRect(0, 0, 256, 352);
  g.fillStyle = '#d8b46e';
  g.fillRect(22, 26, 120 + variant * 30, 10);
  g.fillRect(22, 46, 212, 2);
  g.fillStyle = 'rgba(243, 230, 200, 0.42)';
  for (let y = 66; y < 320; y += 14) {
    if ((y + variant * 14) % 98 < 14) continue;
    g.fillRect(22, y, 140 + ((y * 37 + variant * 53) % 72), 4);
  }
  g.fillStyle = `#${k.gem.getHexString()}`;
  g.fillRect(200, 300, 34, 26);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
