import * as THREE from 'three';

const bootEl = document.getElementById('boot')!;
const bootBtn = document.getElementById('boot-start') as HTMLButtonElement;
const appEl = document.getElementById('app')!;

bootBtn.addEventListener('click', () => {
  bootEl.remove();
  start();
});

const GROUND_Y = -1;
const WORLD_RADIUS = 22;
const GRAVITY = 22;
const MOVE_SPEED = 6;
const ROLL_SPEED = 10;
const JUMP_V = 8;

function start(): void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x2a1a4a);
  appEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffd4f0, 0x201040, 1.0));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(5, 10, 5);
  scene.add(keyLight);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS, 64),
    new THREE.MeshStandardMaterial({ color: 0x55337a, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  scene.add(ground);

  let playerRadius = 1;
  const player = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 3),
    new THREE.MeshStandardMaterial({ color: 0xff8fd8, roughness: 0.3 }),
  );
  player.position.set(0, GROUND_Y + playerRadius, 0);
  scene.add(player);

  const vel = new THREE.Vector3();
  let grounded = true;

  type Jelly = { mesh: THREE.Mesh; radius: number; phase: number };
  const jellies: Jelly[] = [];
  const palette = [0x8fffd8, 0xffd88f, 0xd88fff, 0x8fd8ff, 0xffb08f, 0xb0ff8f, 0xff8f8f];
  for (let i = 0; i < 16; i++) {
    const r = 0.3 + Math.random() * 1.3;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 2),
      new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.3 }),
    );
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 4 + Math.random() * (WORLD_RADIUS - 6);
    mesh.position.set(Math.cos(angle) * dist, GROUND_Y + r, Math.sin(angle) * dist);
    scene.add(mesh);
    jellies.push({ mesh, radius: r, phase: Math.random() * Math.PI * 2 });
  }

  const keys: Record<string, boolean> = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  const camYaw = 0;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    let ix = 0, iz = 0;
    if (keys['KeyW'] || keys['ArrowUp']) iz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) iz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) ix -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) ix += 1;
    const rolling = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyK']);

    const inputLen = Math.hypot(ix, iz);
    if (inputLen > 0) { ix /= inputLen; iz /= inputLen; }

    const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
    const dx = ix * cosY + iz * sinY;
    const dz = -ix * sinY + iz * cosY;

    const speed = rolling ? ROLL_SPEED : MOVE_SPEED;
    const targetVx = dx * speed;
    const targetVz = dz * speed;
    const responsiveness = grounded ? (rolling ? 5 : 10) : 2;
    const k = 1 - Math.exp(-responsiveness * dt);
    vel.x += (targetVx - vel.x) * k;
    vel.z += (targetVz - vel.z) * k;

    if (keys['Space'] && grounded) {
      vel.y = JUMP_V;
      grounded = false;
    }
    vel.y -= GRAVITY * dt;

    player.position.x += vel.x * dt;
    player.position.y += vel.y * dt;
    player.position.z += vel.z * dt;

    const floor = GROUND_Y + playerRadius;
    if (player.position.y <= floor) {
      player.position.y = floor;
      if (vel.y < -2) {
        vel.y = -vel.y * 0.35;
      } else {
        vel.y = 0;
      }
      grounded = vel.y < 0.2;
    } else {
      grounded = false;
    }

    const radial = Math.hypot(player.position.x, player.position.z);
    const maxR = WORLD_RADIUS - playerRadius;
    if (radial > maxR) {
      const s = maxR / radial;
      player.position.x *= s;
      player.position.z *= s;
      vel.x *= -0.2;
      vel.z *= -0.2;
    }

    const hSpeed = Math.hypot(vel.x, vel.z);
    let squash = 1, stretch = 1;
    if (grounded) {
      const bob = Math.sin(t * 8) * 0.05 * (0.5 + hSpeed * 0.08);
      squash = 1 + bob;
      stretch = 1 - bob;
    } else {
      stretch = 1 + Math.max(-0.15, Math.min(0.25, vel.y * 0.03));
      squash = 1 / Math.sqrt(stretch);
    }
    if (rolling && grounded) {
      squash *= 1.1; stretch *= 0.85;
    }
    player.scale.set(playerRadius * squash, playerRadius * stretch, playerRadius * squash);

    if (hSpeed > 0.5) {
      player.rotation.y = Math.atan2(vel.x, vel.z);
    }

    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      const jdx = j.mesh.position.x - player.position.x;
      const jdz = j.mesh.position.z - player.position.z;
      const jdy = j.mesh.position.y - player.position.y;
      const d = Math.hypot(jdx, jdy, jdz);
      const touch = playerRadius + j.radius;
      if (d < touch) {
        if (j.radius < playerRadius * 0.95) {
          const vPlayer = playerRadius ** 3;
          const vOther = j.radius ** 3;
          playerRadius = Math.cbrt(vPlayer + vOther * 0.55);
          scene.remove(j.mesh);
          j.mesh.geometry.dispose();
          (j.mesh.material as THREE.Material).dispose();
          jellies.splice(i, 1);
          continue;
        } else {
          const nx = jdx / (d || 1);
          const nz = jdz / (d || 1);
          const overlap = touch - d;
          player.position.x -= nx * overlap;
          player.position.z -= nz * overlap;
          const bump = 7;
          vel.x -= nx * bump;
          vel.z -= nz * bump;
          vel.y = Math.max(vel.y, 3);
          grounded = false;
        }
      }
      const s = 1 + Math.sin(t * 2 + j.phase) * 0.04;
      j.mesh.scale.set(s, 1 / s, s);
    }

    const camDist = 6 + playerRadius * 2.2;
    const camHeight = 3 + playerRadius * 1.2;
    const targetCamX = player.position.x - Math.sin(camYaw) * camDist;
    const targetCamZ = player.position.z + Math.cos(camYaw) * camDist;
    const targetCamY = player.position.y + camHeight;
    const cK = 1 - Math.exp(-5 * dt);
    camera.position.x += (targetCamX - camera.position.x) * cK;
    camera.position.y += (targetCamY - camera.position.y) * cK;
    camera.position.z += (targetCamZ - camera.position.z) * cK;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
  });
}
