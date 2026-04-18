import * as THREE from 'three';

const bootEl = document.getElementById('boot')!;
const bootBtn = document.getElementById('boot-start') as HTMLButtonElement;
const appEl = document.getElementById('app')!;

bootBtn.addEventListener('click', () => {
  bootEl.remove();
  start();
});

const GRAVITY = 22;
const MOVE_SPEED = 6;
const ROLL_SPEED = 10;
const JUMP_V = 8;
const BOUNCE_PAD_V = 17;
const FALL_LIMIT = -18;

type Platform = {
  aabb: THREE.Box3;
  bouncy: boolean;
};

type Jelly = {
  mesh: THREE.Mesh;
  radius: number;
  phase: number;
  homeY: number;
};

function start(): void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x2a1a4a);
  appEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2a1a4a, 40, 120);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xffd4f0, 0x201040, 1.0));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(8, 20, 10);
  scene.add(keyLight);

  const platforms: Platform[] = [];

  const addPlatform = (
    x: number, y: number, z: number,
    sx: number, sy: number, sz: number,
    color: number,
    bouncy = false,
  ): void => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: bouncy ? 0.2 : 0.7,
      emissive: bouncy ? color : 0x000000,
      emissiveIntensity: bouncy ? 0.25 : 0,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const half = new THREE.Vector3(sx / 2, sy / 2, sz / 2);
    platforms.push({
      aabb: new THREE.Box3(
        new THREE.Vector3(x - half.x, y - half.y, z - half.z),
        new THREE.Vector3(x + half.x, y + half.y, z + half.z),
      ),
      bouncy,
    });
  };

  addPlatform(0, -1.25, 0, 48, 0.5, 48, 0x55337a);

  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(7, 34, 48, 1, false),
    new THREE.MeshStandardMaterial({ color: 0x3e2560, roughness: 0.95, flatShading: true }),
  );
  mountain.position.set(0, 16, 0);
  scene.add(mountain);

  const NUM_STEPS = 11;
  const STEP_HEIGHT = 2.6;
  for (let i = 0; i < NUM_STEPS; i++) {
    const angle = (i / NUM_STEPS) * Math.PI * 4 + 0.3;
    const radius = 9.5 - i * 0.35;
    const y = i * STEP_HEIGHT;
    const bouncy = i > 0 && i % 3 === 2;
    const color = bouncy ? 0xff99cc : (i % 2 === 0 ? 0x8870b0 : 0x9a82c0);
    addPlatform(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
      3.6, 0.5, 3.6,
      color,
      bouncy,
    );
  }

  const SUMMIT_Y = NUM_STEPS * STEP_HEIGHT;
  addPlatform(0, SUMMIT_Y, 0, 8, 0.6, 8, 0xffd88f);

  const finishRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.28, 18, 64),
    new THREE.MeshStandardMaterial({
      color: 0xfff0a0,
      emissive: 0xffd15c,
      emissiveIntensity: 1.1,
      roughness: 0.4,
    }),
  );
  finishRing.position.set(0, SUMMIT_Y + 1.8, 0);
  finishRing.rotation.x = Math.PI / 2;
  scene.add(finishRing);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 60, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffe88a, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
    }),
  );
  beam.position.set(0, SUMMIT_Y + 30, 0);
  scene.add(beam);

  let playerRadius = 1;
  const player = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 3),
    new THREE.MeshStandardMaterial({ color: 0xff8fd8, roughness: 0.3 }),
  );
  const spawn = new THREE.Vector3(0, 1, 8);
  player.position.copy(spawn);
  scene.add(player);

  const vel = new THREE.Vector3();
  let grounded = true;
  const lastSafe = spawn.clone();
  let lastSafeTimer = 0;

  const jellies: Jelly[] = [];
  const palette = [0x8fffd8, 0xffd88f, 0xd88fff, 0x8fd8ff, 0xffb08f, 0xb0ff8f, 0xff8f8f];

  const spawnJelly = (x: number, y: number, z: number, r: number): void => {
    const color = palette[jellies.length % palette.length] ?? 0xffffff;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3 }),
    );
    mesh.position.set(x, y + r, z);
    scene.add(mesh);
    jellies.push({ mesh, radius: r, phase: Math.random() * Math.PI * 2, homeY: y + r });
  };

  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 6 + Math.random() * 14;
    spawnJelly(Math.cos(a) * d, -1, Math.sin(a) * d, 0.35 + Math.random() * 0.5);
  }

  for (let i = 0; i < platforms.length; i++) {
    if (i === 0) continue;
    const p = platforms[i]!;
    if (Math.random() < 0.75) {
      const cx = (p.aabb.min.x + p.aabb.max.x) / 2 + (Math.random() - 0.5) * 1.2;
      const cz = (p.aabb.min.z + p.aabb.max.z) / 2 + (Math.random() - 0.5) * 1.2;
      const growFactor = Math.min(1, i / platforms.length + 0.3);
      const r = 0.35 + Math.random() * 0.7 * growFactor;
      spawnJelly(cx, p.aabb.max.y, cz, r);
    }
  }

  const hud = document.createElement('div');
  hud.style.cssText =
    'position:fixed;top:0.8rem;left:0.8rem;font:600 0.95rem/1.2 system-ui,sans-serif;' +
    'color:#fff;text-shadow:0 1px 4px #000a;pointer-events:none;z-index:5;';
  document.body.appendChild(hud);

  const victoryEl = document.createElement('div');
  victoryEl.style.cssText =
    'position:fixed;inset:0;display:none;place-items:center;' +
    'background:radial-gradient(circle at 50% 40%, rgba(57,35,110,0.88), rgba(18,8,38,0.94));' +
    'color:#fff;font-family:system-ui,sans-serif;text-align:center;z-index:10;';
  victoryEl.innerHTML =
    '<div><h1 style="margin:0 0 0.3em;font-size:2.6rem">You made it!</h1>' +
    '<p id="victory-stats" style="margin:0.4em 0 1.4em;font-size:1.1rem;opacity:0.9"></p>' +
    '<button id="restart-btn" style="font:inherit;font-size:1.05rem;padding:0.7rem 1.5rem;' +
    'border-radius:999px;border:none;background:#ff8fd8;color:#1a1030;cursor:pointer">' +
    'Play again</button></div>';
  document.body.appendChild(victoryEl);
  (victoryEl.querySelector('#restart-btn') as HTMLButtonElement).addEventListener('click', () => {
    location.reload();
  });

  const respawn = (): void => {
    player.position.copy(lastSafe);
    vel.set(0, 0, 0);
  };

  const keys: Record<string, boolean> = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyR') respawn();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const startTime = performance.now();
  let won = false;
  let winTime = 0;
  let absorbCount = 0;

  const tmpClamp = new THREE.Vector3();
  const camYaw = 0;
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    if (!won) {
      let ix = 0, iz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) iz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) iz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) ix -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) ix += 1;
      const rolling = !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyK']);
      const inLen = Math.hypot(ix, iz);
      if (inLen > 0) { ix /= inLen; iz /= inLen; }

      const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
      const dx = ix * cosY + iz * sinY;
      const dz = -ix * sinY + iz * cosY;

      const speed = rolling ? ROLL_SPEED : MOVE_SPEED;
      const responsiveness = grounded ? (rolling ? 5 : 10) : 2;
      const k = 1 - Math.exp(-responsiveness * dt);
      vel.x += (dx * speed - vel.x) * k;
      vel.z += (dz * speed - vel.z) * k;

      if (keys['Space'] && grounded) {
        vel.y = JUMP_V;
        grounded = false;
      }
      vel.y -= GRAVITY * dt;

      player.position.x += vel.x * dt;
      player.position.y += vel.y * dt;
      player.position.z += vel.z * dt;

      grounded = false;
      for (const p of platforms) {
        tmpClamp.set(
          Math.max(p.aabb.min.x, Math.min(player.position.x, p.aabb.max.x)),
          Math.max(p.aabb.min.y, Math.min(player.position.y, p.aabb.max.y)),
          Math.max(p.aabb.min.z, Math.min(player.position.z, p.aabb.max.z)),
        );
        const ddx = player.position.x - tmpClamp.x;
        const ddy = player.position.y - tmpClamp.y;
        const ddz = player.position.z - tmpClamp.z;
        const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
        if (d2 < playerRadius * playerRadius && d2 > 1e-8) {
          const d = Math.sqrt(d2);
          const nx = ddx / d, ny = ddy / d, nz = ddz / d;
          const overlap = playerRadius - d;
          player.position.x += nx * overlap;
          player.position.y += ny * overlap;
          player.position.z += nz * overlap;
          const vn = vel.x * nx + vel.y * ny + vel.z * nz;
          if (vn < 0) {
            vel.x -= nx * vn;
            vel.y -= ny * vn;
            vel.z -= nz * vn;
          }
          if (ny > 0.6) {
            if (p.bouncy) {
              vel.y = BOUNCE_PAD_V;
            } else {
              grounded = true;
            }
          }
        }
      }

      if (grounded) {
        lastSafeTimer += dt;
        if (lastSafeTimer > 0.4) {
          lastSafe.copy(player.position);
          lastSafe.y += 0.5;
          lastSafeTimer = 0;
        }
      } else {
        lastSafeTimer = 0;
      }

      if (player.position.y < FALL_LIMIT) respawn();

      for (let i = jellies.length - 1; i >= 0; i--) {
        const j = jellies[i]!;
        j.mesh.position.y = j.homeY + Math.sin(t * 1.6 + j.phase) * 0.12;
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
            absorbCount++;
            continue;
          } else {
            const nrm = d || 1;
            const nx = jdx / nrm, nz = jdz / nrm;
            const overlap = touch - d;
            player.position.x -= nx * overlap;
            player.position.z -= nz * overlap;
            vel.x -= nx * 7;
            vel.z -= nz * 7;
            vel.y = Math.max(vel.y, 3);
            grounded = false;
          }
        }
        const s = 1 + Math.sin(t * 2 + j.phase) * 0.04;
        j.mesh.scale.set(s, 1 / s, s);
      }

      if (
        player.position.y > SUMMIT_Y + 0.2 &&
        Math.hypot(player.position.x, player.position.z) < 3
      ) {
        won = true;
        winTime = (performance.now() - startTime) / 1000;
        const stats = victoryEl.querySelector('#victory-stats') as HTMLParagraphElement;
        stats.textContent =
          `Time: ${winTime.toFixed(1)}s · Jellies absorbed: ${absorbCount} · Size: ${playerRadius.toFixed(2)}`;
        victoryEl.style.display = 'grid';
      }
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
    player.scale.set(playerRadius * squash, playerRadius * stretch, playerRadius * squash);
    if (hSpeed > 0.5) player.rotation.y = Math.atan2(vel.x, vel.z);

    finishRing.rotation.z = t * 0.5;

    const camDist = 7 + playerRadius * 2.2;
    const camHeight = 3.5 + playerRadius * 1.2;
    const targetCamX = player.position.x - Math.sin(camYaw) * camDist;
    const targetCamZ = player.position.z + Math.cos(camYaw) * camDist;
    const targetCamY = player.position.y + camHeight;
    const cK = 1 - Math.exp(-5 * dt);
    camera.position.x += (targetCamX - camera.position.x) * cK;
    camera.position.y += (targetCamY - camera.position.y) * cK;
    camera.position.z += (targetCamZ - camera.position.z) * cK;
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

    const heightPct = Math.max(0, Math.min(1, player.position.y / SUMMIT_Y));
    hud.innerHTML =
      `<div>Jellies: ${absorbCount}</div>` +
      `<div>Height: ${(heightPct * 100).toFixed(0)}%</div>` +
      `<div style="opacity:0.7;font-size:0.85em;margin-top:0.4em">` +
      `WASD / arrows · Space hop · Shift roll · R respawn</div>`;

    renderer.render(scene, camera);
  });
}
