import * as THREE from 'three';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   HERO SCENE — floating wireframe torus knot + particle field
   ============================================================ */
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // --- Torus knot (wireframe, monochrome) ---
  const knotGeo = new THREE.TorusKnotGeometry(1.7, 0.45, 220, 28);
  const knotMat = new THREE.MeshBasicMaterial({
    color: 0xfafafa,
    wireframe: true,
    transparent: true,
    opacity: 0.14,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  scene.add(knot);

  // --- Inner solid icosahedron ---
  const icoGeo = new THREE.IcosahedronGeometry(0.85, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0xfafafa,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  // --- Particle field ---
  const particleCount = 700;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xfafafa,
    size: 0.02,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Mouse parallax ---
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('pointermove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- Scroll influence ---
  let scrollProgress = 0;
  window.addEventListener(
    'scroll',
    () => {
      scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
    },
    { passive: true }
  );

  const clock = new THREE.Clock();
  let rafId;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    if (!prefersReducedMotion) {
      knot.rotation.x = t * 0.12 + targetY * 0.3;
      knot.rotation.y = t * 0.18 + targetX * 0.3;

      ico.rotation.x = -t * 0.25;
      ico.rotation.y = t * 0.3;
      ico.position.y = Math.sin(t * 0.8) * 0.15;

      particles.rotation.y = t * 0.015 + targetX * 0.05;
      particles.rotation.x = targetY * 0.03;
    }

    // Fade out and pull back on scroll
    const fade = 1 - scrollProgress;
    knotMat.opacity = 0.14 * fade;
    icoMat.opacity = 0.35 * fade;
    particleMat.opacity = 0.55 * fade;
    camera.position.z = 7 + scrollProgress * 3;

    renderer.render(scene, camera);
  }
  animate();

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      clock.getDelta();
      animate();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ============================================================
   CONTACT SCENE — subtle particle wave grid
   ============================================================ */
function initContactScene() {
  const canvas = document.getElementById('contact-canvas');
  const section = document.getElementById('contact');
  if (!canvas || !section) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 3.2, 7);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    const { width, height } = section.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Wave grid of points ---
  const cols = 70;
  const rows = 40;
  const sep = 0.35;
  const count = cols * rows;
  const positions = new Float32Array(count * 3);

  let i = 0;
  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      positions[i * 3] = (x - cols / 2) * sep;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (z - rows / 2) * sep;
      i++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfafafa,
    size: 0.03,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const clock = new THREE.Clock();
  let visible = false;
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const pos = geo.attributes.position;

    if (!prefersReducedMotion) {
      let idx = 0;
      for (let x = 0; x < cols; x++) {
        for (let z = 0; z < rows; z++) {
          const px = pos.getX(idx);
          const pz = pos.getZ(idx);
          pos.setY(idx, Math.sin(px * 0.55 + t * 0.9) * 0.35 + Math.cos(pz * 0.7 + t * 0.6) * 0.25);
          idx++;
        }
      }
      pos.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  // Only render when section is in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          clock.getDelta();
          animate();
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          if (rafId) cancelAnimationFrame(rafId);
        }
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(section);
}

initHeroScene();
initContactScene();
