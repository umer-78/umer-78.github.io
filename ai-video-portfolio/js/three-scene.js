/* Three.js Scene — Immersive 3D Background */
(function () {
  'use strict';

  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Wrap everything in try/catch: a WebGL failure must never blank the page.
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  // Use sRGB color output (works across Three.js r149-r160+)
if (THREE.SRGBColorSpace && 'outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
else if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.025);

  // Camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x6366f1, 2.4, 30);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x06b6d4, 1.8, 30);
  pointLight2.position.set(-5, -3, 5);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0x8b5cf6, 1.2, 25);
  pointLight3.position.set(0, 8, -5);
  scene.add(pointLight3);

  // === Main Torus Knot ===
  const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.5, 0.8, 140, 28),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.9, roughness: 0.12 })
  );
  scene.add(torusKnot);

  // === Wireframe Overlay ===
  const wireMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.5, 0.8, 72, 14),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.14 })
  );
  wireMesh.scale.setScalar(1.15);
  scene.add(wireMesh);

  // === Orbiting icosahedron cluster ===
  const icoGroup = new THREE.Group();
  const icoGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const orbiters = [];
  const orbiterColors = [0x6366f1, 0x06b6d4, 0x8b5cf6, 0x22d3ee];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(icoGeo, new THREE.MeshStandardMaterial({
      color: orbiterColors[i % orbiterColors.length],
      metalness: 0.8,
      roughness: 0.25,
      flatShading: true,
    }));
    const angle = (i / 4) * Math.PI * 2;
    const rad = 4.6;
    mesh.position.set(Math.cos(angle) * rad, Math.sin(angle) * rad * 0.5, Math.sin(angle * 2) * 1.2);
    mesh.userData = { angle, rad, phase: i };
    icoGroup.add(mesh);
    orbiters.push(mesh);
  }
  scene.add(icoGroup);

  // === Particle Field ===
  const particleCount = 2200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorPalette = [new THREE.Color(0x6366f1), new THREE.Color(0x8b5cf6), new THREE.Color(0x06b6d4), new THREE.Color(0xffffff)];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 5 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi) - 5;
    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(particles);

  // === Floating Rings ===
  const rings = [];
  const ringColors = [0x6366f1, 0x06b6d4, 0x8b5cf6];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4 + i * 1.5, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({ color: ringColors[i], transparent: true, opacity: 0.15 + i * 0.05 })
    );
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    ring.rotation.y = i * 0.5;
    scene.add(ring);
    rings.push(ring);
  }

  // === Input & scroll ===
  const mouse = { x: 0, y: 0 };
  let scrollProgress = 0;

  document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // === Visibility: pause when hidden to save battery ===
  let animationId = null;
  const clock = new THREE.Clock();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function startAnim() {
    if (reduceMotion) { renderFrame(0); return; } // one still frame, no motion
    if (animationId === null) {
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        renderFrame(clock.getElapsedTime());
      };
      animate();
    }
  }
  function stopAnim() {
    if (animationId !== null) { cancelAnimationFrame(animationId); animationId = null; }
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stopAnim() : startAnim()));

  // Gracefully handle WebGL context loss (e.g. GPU reset, tab suspension)
  const glCanvas = renderer.domElement;
  glCanvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stopAnim();
  });
  glCanvas.addEventListener('webglcontextrestored', () => {
    startAnim();
  });

  // === Render frame ===
  let mouseX = 0, mouseY = 0;
  function renderFrame(t) {
    mouseX += (mouse.x - mouseX) * 0.05;
    mouseY += (mouse.y - mouseY) * 0.05;

    // Torus rotation + gentle morph scale driven by scroll
    const morph = 1 + Math.sin(scrollProgress * Math.PI) * 0.4;
    torusKnot.rotation.x = t * 0.15 + mouseY * 0.3;
    torusKnot.rotation.y = t * 0.2 + mouseX * 0.3;
    torusKnot.scale.setScalar((1 + Math.sin(t * 0.5) * 0.05) * morph);

    wireMesh.rotation.x = -t * 0.1 + mouseY * 0.2;
    wireMesh.rotation.y = -t * 0.15 + mouseX * 0.2;
    wireMesh.scale.setScalar(1.15 * morph);

    // Orbiters
    orbiters.forEach((o) => {
      const a = o.userData.angle + t * 0.25;
      o.position.set(Math.cos(a) * o.userData.rad, Math.sin(a) * o.userData.rad * 0.5, Math.sin(a * 2) * 1.2);
      o.rotation.x += 0.01; o.rotation.y += 0.02;
    });
    icoGroup.position.y = -scrollProgress * 6;

    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;

    rings.forEach((ring, i) => {
      ring.rotation.z = t * 0.1 * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.3 + i) * 0.1;
    });

    // Camera parallax (eased)
    const camY = -scrollProgress * 6;
    const camZ = 12 + scrollProgress * 4;
    camera.position.y += (camY - camera.position.y) * 0.05;
    camera.position.z += (camZ - camera.position.z) * 0.05;
    camera.lookAt(0, camY - 2, 0);

    // Animated hue-shifting lights
    pointLight1.position.x = 5 + Math.sin(t * 0.5) * 2;
    pointLight1.position.y = 5 + Math.cos(t * 0.3) * 2;
    pointLight1.color.setHSL(0.66 + Math.sin(t * 0.2) * 0.05, 0.8, 0.6);
    pointLight2.position.x = -5 + Math.cos(t * 0.4) * 2;
    pointLight2.color.setHSL(0.5 + Math.cos(t * 0.15) * 0.05, 0.8, 0.55);

    renderer.render(scene, camera);
  }

  startAnim();

  // === Resize ===
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
})();
