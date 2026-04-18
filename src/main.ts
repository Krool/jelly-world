import * as THREE from 'three';

const bootEl = document.getElementById('boot')!;
const bootBtn = document.getElementById('boot-start') as HTMLButtonElement;
const appEl = document.getElementById('app')!;

bootBtn.addEventListener('click', () => {
  bootEl.remove();
  start();
});

function start(): void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x2a1a4a);
  appEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3, 6);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffd4f0, 0x201040, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(5, 10, 5);
  scene.add(key);

  const jelly = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 3),
    new THREE.MeshStandardMaterial({ color: 0xff8fd8, roughness: 0.3, metalness: 0.0 }),
  );
  scene.add(jelly);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(10, 48),
    new THREE.MeshStandardMaterial({ color: 0x55337a, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  scene.add(ground);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    jelly.scale.set(1 + Math.sin(t * 3) * 0.04, 1 - Math.sin(t * 3) * 0.04, 1 + Math.sin(t * 3) * 0.04);
    jelly.rotation.y = t * 0.3;
    renderer.render(scene, camera);
  });
}
