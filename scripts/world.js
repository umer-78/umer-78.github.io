/**
 * The 3D layer behind the page: one full-screen canvas that shows the gallery
 * on the home page and a project's own environment when one is opened.
 *
 * It talks to app.js only through events on `document`:
 *   in:  portfolio:open {name}, portfolio:close, portfolio:shown {names}, portfolio:highlight {category}
 *   out: portfolio:enter {name} (a monolith was clicked), world:ready, world:explored
 *
 * Progressive: without WebGL, or if three.js fails to load, the page works
 * the same on a still background. With reduced motion nothing moves on its own
 * and frames are drawn only when something changes. Rendering pauses while the
 * gallery is scrolled out of sight or the tab is hidden, and steps down in
 * resolution and bloom if the device cannot keep up.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import site from './data.js';
import { environmentFor } from './environments.js';
import { CATEGORY_STYLE } from './palette.js';
import { createGallery } from './gallery.js';
import { createEnvironment } from './scenes.js';

const canvas = document.getElementById('world');
const root = document.documentElement;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const STILL = 7.5; // the moment every scene is frozen at when motion is reduced

function supportsWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

if (!canvas || !supportsWebGL()) {
  root.classList.add('no-webgl');
} else {
  try {
    boot();
  } catch (error) {
    console.error(error);
    root.classList.add('no-webgl');
  }
}

function boot() {
  let tier = finePointer.matches && Math.min(innerWidth, innerHeight) > 700 ? 2 : 1;
  const dprFor = (t) => Math.min(devicePixelRatio || 1, t === 2 ? 1.75 : t === 1 ? 1.35 : 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(dprFor(tier));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: tier === 2 ? 4 : 2 });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.55, 0.82);
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const ctx = { renderer, envMap, quality: () => tier, pixelRatio: () => renderer.getPixelRatio() };
  const gallery = createGallery(ctx, {
    projects: site.projects,
    categories: site.categories,
    styles: CATEGORY_STYLE,
    tip: document.getElementById('tip'),
  });

  let stage = null; // the open project's environment, when there is one
  let controls = null;
  let intro = null; // the camera's glide into a newly opened world
  let mode = 'gallery';
  let width = 1;
  let height = 1;
  let needsRender = true;
  let galleryVisible = true;
  let paused = false;
  let switchToken = 0;
  let readySent = false;

  // ---- sizing: the scene sits beside the text on wide screens and above it on narrow ones
  function frameEnvironment() {
    if (!stage) return;
    const cam = stage.camera;
    const wide = width >= 980 && width / height > 1.1;
    cam.aspect = width / height;
    cam.fov = stage.view.fov * (width / height < 0.8 ? 1.35 : 1);
    cam.setViewOffset(width, height, wide ? -width * 0.17 : 0, wide ? 0 : height * 0.2, width, height);
    cam.updateProjectionMatrix();
  }

  function resize() {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    gallery.resize(width, height);
    frameEnvironment();
    needsRender = true;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---- quality steps down, never up, so it cannot flicker between the two
  let frames = 0;
  let slow = 0;
  let warmup = 45;
  function setTier(next) {
    tier = Math.max(0, next);
    renderer.setPixelRatio(dprFor(tier));
    bloom.enabled = tier > 0;
    resize();
  }
  function adapt(dt) {
    if (warmup > 0) {
      warmup -= 1;
      return;
    }
    if (tier === 0 || motion.matches) return;
    frames += 1;
    if (dt > 1 / 38) slow += 1;
    if (frames >= 90) {
      if (slow > 45) setTier(tier - 1);
      frames = 0;
      slow = 0;
    }
  }

  // ---- switching between the gallery and an environment, behind a fade
  const fadeMs = () => (motion.matches ? 0 : 480);
  function fade(out) {
    canvas.classList.toggle('is-fading', out);
    return new Promise((resolve) => setTimeout(resolve, out ? fadeMs() : 0));
  }

  function dropStage() {
    intro = null;
    controls?.dispose();
    controls = null;
    canvas.style.touchAction = '';
    stage?.dispose();
    stage = null;
  }

  async function openEnvironment(name) {
    const index = site.projects.findIndex((p) => p.name === name);
    if (index < 0) return;
    const token = ++switchToken;
    await fade(true);
    if (token !== switchToken) return;
    dropStage();
    const project = site.projects[index];
    stage = createEnvironment(ctx, project, environmentFor(project, index), CATEGORY_STYLE[project.category]?.color || '#d6b46c');
    mode = 'env';
    const { view } = stage;
    controls = new OrbitControls(stage.camera, canvas);
    controls.target.set(...view.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.6;
    controls.minDistance = view.minDistance;
    controls.maxDistance = view.maxDistance;
    controls.maxPolarAngle = view.maxPolar;
    controls.autoRotate = !motion.matches;
    controls.autoRotateSpeed = view.spin;
    controls.addEventListener('change', () => { needsRender = true; });
    controls.addEventListener('start', () => {
      intro = null; // the visitor took over
      emit('world:explored');
    });
    controls.update();
    frameEnvironment();
    intro = null;
    if (!motion.matches) {
      const to = stage.camera.position.clone();
      const out = to.clone().sub(controls.target);
      const from = controls.target.clone().addScaledVector(out, 1.6).add(new THREE.Vector3(0, out.length() * 0.25, 0));
      stage.camera.position.copy(from);
      intro = { from, to, start: null };
    }
    try {
      if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(stage.scene, stage.camera);
      else renderer.compile(stage.scene, stage.camera);
    } catch {
      /* compiles on first frame instead */
    }
    if (token !== switchToken) return;
    warmup = 45;
    needsRender = true;
    fade(false);
  }

  async function closeEnvironment() {
    const token = ++switchToken;
    if (mode === 'gallery' && !stage) {
      // closed before the opening fade finished: nothing was built, but the canvas is still faded out
      fade(false);
      gallery.reset();
      needsRender = true;
      return;
    }
    await fade(true);
    if (token !== switchToken) return;
    dropStage();
    mode = 'gallery';
    gallery.reset();
    warmup = 30;
    needsRender = true;
    fade(false);
  }

  // ---- the loop
  let last = performance.now();
  let time = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    // a frame's timestamp can precede the clock reading taken before it was requested, so never step backwards
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
    last = now;
    if (paused || document.hidden) return;
    const reduced = motion.matches;
    const showing = mode === 'env' ? stage : gallery;
    if (!showing) return;
    if (mode === 'gallery' && !galleryVisible && !needsRender) return;
    if (reduced && !needsRender && !controls) return;
    if (!reduced) time += dt;
    if (intro && stage) {
      if (intro.start === null) intro.start = now;
      const k = Math.min(1, (now - intro.start) / 2000);
      const e = 1 - Math.pow(1 - k, 3);
      stage.camera.position.lerpVectors(intro.from, intro.to, e);
      if (k >= 1) intro = null;
    }
    if (controls) controls.update(reduced ? 0 : dt);
    if (reduced && !needsRender) return;
    const changed = showing.update(reduced ? STILL : time, reduced ? 0 : dt);
    renderPass.scene = showing.scene;
    renderPass.camera = showing.camera;
    composer.render(dt);
    needsRender = Boolean(reduced && changed);
    adapt(dt);
    if (!readySent) {
      readySent = true;
      root.classList.add('webgl');
      emit('world:ready');
    }
  }
  requestAnimationFrame(loop);

  // ---- input
  addEventListener('pointermove', (e) => {
    if (mode !== 'gallery') return;
    gallery.pointerMove(e.clientX, e.clientY, e.target === canvas);
    needsRender = true;
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => {
    if (mode === 'gallery') gallery.pointerLeave();
    needsRender = true;
  });
  canvas.addEventListener('click', (e) => {
    if (mode !== 'gallery') return;
    const project = gallery.pick(e.clientX, e.clientY);
    if (!project) return;
    gallery.flyTo(project.name, () => emit('portfolio:enter', { name: project.name }), motion.matches);
    needsRender = true;
  });
  addEventListener('scroll', () => {
    gallery.scroll(scrollY / Math.max(1, innerHeight));
    needsRender = true;
  }, { passive: true });

  const hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      galleryVisible = entry.isIntersecting;
      if (galleryVisible) needsRender = true;
    }).observe(hero);
  }

  document.addEventListener('portfolio:open', (e) => openEnvironment(e.detail?.name));
  document.addEventListener('portfolio:close', () => closeEnvironment());
  document.addEventListener('portfolio:shown', (e) => {
    gallery.shown(e.detail?.names || null);
    needsRender = true;
  });
  document.addEventListener('portfolio:highlight', (e) => {
    gallery.highlight(e.detail?.category || null);
    needsRender = true;
  });
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    needsRender = true;
  });
  motion.addEventListener('change', () => {
    if (controls) controls.autoRotate = !motion.matches;
    needsRender = true;
  });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    paused = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    paused = false;
    needsRender = true;
  });

  // app.js may have opened a project before this module finished loading
  if (root.dataset.env) openEnvironment(root.dataset.env);
}
