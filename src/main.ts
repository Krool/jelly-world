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
const AIR_JUMP_V = 6.8;
const MAX_JUMPS = 3;
const BOUNCE_PAD_V = 17;
const TRAMPOLINE_V = 24;
const PIN_TIP_SPEED = 3.5;
const PIN_GRAVITY_ANG = 18;
const FALL_LIMIT = -18;
const MIN_PLAYER_RADIUS = 0.5;
const SHED_SPEED_THRESHOLD = 14;

type Platform = {
  aabb: THREE.Box3;
  bounceV: number;
  halfSize?: THREE.Vector3;
  mesh?: THREE.Mesh;
  update?: (t: number) => void;
};

type Jelly = {
  mesh: THREE.Mesh;
  radius: number;
  phase: number;
  homeY: number;
};

type Pin = {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  height: number;
  radius: number;
  tipDir: THREE.Vector3;
  tipAngle: number;
  angVel: number;
};

type Shard = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  radius: number;
  spin: THREE.Vector3;
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
    bounceV = 0,
  ): void => {
    const glow = bounceV > 0;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: glow ? 0.2 : 0.7,
      emissive: glow ? color : 0x000000,
      emissiveIntensity: glow ? 0.3 : 0,
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
      bounceV,
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
    const isBouncy = i > 0 && i % 3 === 2;
    const color = isBouncy ? 0xff99cc : (i % 2 === 0 ? 0x8870b0 : 0x9a82c0);
    addPlatform(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
      3.6, 0.5, 3.6,
      color,
      isBouncy ? BOUNCE_PAD_V : 0,
    );
  }

  const SUMMIT_Y = NUM_STEPS * STEP_HEIGHT;
  addPlatform(0, SUMMIT_Y, 0, 8, 0.6, 8, 0xffd88f);

  const addTrampoline = (x: number, z: number, groundY = -1, r = 1.8): void => {
    const topThick = 0.25;
    const legH = 0.9;
    const topY = groundY + legH + topThick / 2;
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x33ffc8, emissive: 0x22bb88, emissiveIntensity: 0.4, roughness: 0.2,
    });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, topThick, 28), topMat);
    top.position.set(x, topY, z);
    scene.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x225544, roughness: 0.8 });
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r * 0.7, legH, 20), legMat);
    legs.position.set(x, groundY + legH / 2, z);
    scene.add(legs);
    platforms.push({
      aabb: new THREE.Box3(
        new THREE.Vector3(x - r, topY - topThick / 2, z - r),
        new THREE.Vector3(x + r, topY + topThick / 2, z + r),
      ),
      bounceV: TRAMPOLINE_V,
    });
  };

  addTrampoline(8, 8);
  addTrampoline(-9, 10);
  addTrampoline(12, -10);
  addTrampoline(-11, -8);

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
  const player = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>(
    new THREE.IcosahedronGeometry(1, 3),
    new THREE.MeshStandardMaterial({ color: 0xff8fd8, roughness: 0.3 }),
  );
  const spawn = new THREE.Vector3(0, 1, 8);
  player.position.copy(spawn);
  scene.add(player);

  const vel = new THREE.Vector3();
  let grounded = true;
  let wasGrounded = true;
  let fallPeakVy = 0;
  let jumpsLeft = MAX_JUMPS;
  let jumpQueued = false;
  const lastSafe = spawn.clone();
  let lastSafeTimer = 0;

  const pins: Pin[] = [];
  const addPin = (x: number, z: number, groundY = -1): void => {
    const height = 1.6;
    const radius = 0.22;
    const geom = new THREE.BoxGeometry(radius * 2, height, radius * 2);
    geom.translate(0, height / 2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfff0dd, roughness: 0.4 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, groundY, z);
    scene.add(mesh);
    pins.push({
      mesh,
      base: new THREE.Vector3(x, groundY, z),
      height, radius,
      tipDir: new THREE.Vector3(1, 0, 0),
      tipAngle: 0,
      angVel: 0,
    });
  };

  const addPinCluster = (cx: number, cz: number, groundY = -1): void => {
    const s = 0.7;
    const offsets: Array<[number, number]> = [
      [0, 0], [s, 0], [-s, 0],
      [s / 2, s * 0.87], [-s / 2, s * 0.87],
      [0, s * 1.73],
    ];
    for (const [dx, dz] of offsets) addPin(cx + dx, cz + dz, groundY);
  };

  addPinCluster(6, -6);
  addPinCluster(-12, 6);
  addPinCluster(10, 14);

  type Swinger = {
    pivot: THREE.Vector3;
    length: number;
    amplitude: number;
    period: number;
    phase: number;
    axisYaw: number;
    mesh: THREE.Mesh;
    rope: THREE.Mesh;
    halfSize: THREE.Vector3;
    aabb: THREE.Box3;
  };
  const swingers: Swinger[] = [];
  const addSwinger = (
    pivotX: number, pivotY: number, pivotZ: number,
    length: number, axisYaw: number,
    amplitude = 1.0, period = 2.6, phase = 0,
  ): void => {
    const bs = 1.4;
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff5533, roughness: 0.5, emissive: 0x441100, emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bs, bs, bs), mat);
    scene.add(mesh);
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x332244, roughness: 0.9 }),
    );
    scene.add(rope);
    swingers.push({
      pivot: new THREE.Vector3(pivotX, pivotY, pivotZ),
      length, amplitude, period, phase, axisYaw,
      mesh, rope,
      halfSize: new THREE.Vector3(bs / 2, bs / 2, bs / 2),
      aabb: new THREE.Box3(),
    });
  };

  addSwinger(0, 13, -2, 4.0, 0, 1.0, 2.4, 0);
  addSwinger(-4, 22, 3, 4.5, Math.PI / 3, 1.1, 2.9, 0.9);

  type Pusher = {
    mesh: THREE.Mesh;
    restPos: THREE.Vector3;
    extendDir: THREE.Vector3;
    extendDist: number;
    period: number;
    phase: number;
    halfSize: THREE.Vector3;
    aabb: THREE.Box3;
  };
  const pushers: Pusher[] = [];
  const addPusher = (
    x: number, y: number, z: number,
    sx: number, sy: number, sz: number,
    dirX: number, dirZ: number,
    extendDist: number, period: number, phase = 0,
  ): void => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc3366, roughness: 0.35, emissive: 0x551133, emissiveIntensity: 0.25,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    pushers.push({
      mesh,
      restPos: new THREE.Vector3(x, y, z),
      extendDir: new THREE.Vector3(dirX, 0, dirZ).normalize(),
      extendDist, period, phase,
      halfSize: new THREE.Vector3(sx / 2, sy / 2, sz / 2),
      aabb: new THREE.Box3(),
    });
  };

  addPusher(-6, 4.5, -6, 0.8, 1.4, 1.8, 1, 0, 3.0, 2.2, 0);
  addPusher(7, 17, 0, 0.8, 1.4, 1.8, -1, 0, 3.0, 2.6, 1.0);

  const jellies: Jelly[] = [];
  const shards: Shard[] = [];
  const palette = [0x8fffd8, 0xffd88f, 0xd88fff, 0x8fd8ff, 0xffb08f, 0xb0ff8f, 0xff8f8f];

  const spawnShard = (x: number, y: number, z: number, r: number, dirX: number, dirZ: number, speed: number): void => {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 1),
      new THREE.MeshStandardMaterial({
        color: 0xff8fd8, roughness: 0.3, emissive: 0x661a55, emissiveIntensity: 0.35,
      }),
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    shards.push({
      mesh,
      vel: new THREE.Vector3(dirX * speed, 4.5 + Math.random() * 2.5, dirZ * speed),
      radius: r,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
    });
  };

  const shedPieces = (impactSpeed: number): void => {
    if (playerRadius <= MIN_PLAYER_RADIUS + 0.01) return;
    const excess = Math.min(impactSpeed - SHED_SPEED_THRESHOLD, 22);
    const shedFrac = Math.min(0.28, excess / 60);
    const playerVol = playerRadius ** 3;
    const minVol = MIN_PLAYER_RADIUS ** 3;
    const maxShedVol = Math.max(0, playerVol - minVol);
    const shedVol = Math.min(playerVol * shedFrac, maxShedVol);
    if (shedVol < 0.015) return;
    const numShards = 4;
    const shardVol = shedVol / numShards;
    const shardRadius = Math.cbrt(shardVol);
    if (shardRadius < 0.14) return;
    for (let i = 0; i < numShards; i++) {
      const a = (i / numShards) * Math.PI * 2 + Math.random() * 0.4;
      const outDir = { x: Math.cos(a), z: Math.sin(a) };
      const outSpeed = 3 + Math.random() * 3;
      spawnShard(
        player.position.x + outDir.x * (playerRadius * 0.6),
        player.position.y + shardRadius,
        player.position.z + outDir.z * (playerRadius * 0.6),
        shardRadius, outDir.x, outDir.z, outSpeed,
      );
    }
    playerRadius = Math.cbrt(playerVol - shedVol);
  };

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
    'position:fixed;top:0.8rem;left:0.8rem;z-index:5;' +
    'font:600 0.95rem/1.35 system-ui,sans-serif;color:#fff;' +
    'padding:0.6rem 0.85rem;border-radius:0.6rem;' +
    'background:rgba(26,16,48,0.55);backdrop-filter:blur(6px);' +
    '-webkit-backdrop-filter:blur(6px);' +
    'box-shadow:0 2px 10px #0006;pointer-events:none;' +
    'display:grid;grid-template-columns:auto auto;column-gap:0.6rem;row-gap:0.1rem;';
  document.body.appendChild(hud);

  const infoBtn = document.createElement('button');
  infoBtn.type = 'button';
  infoBtn.setAttribute('aria-label', 'Controls');
  infoBtn.textContent = '?';
  infoBtn.style.cssText =
    'position:fixed;top:0.8rem;right:0.8rem;z-index:6;' +
    'width:2.4rem;height:2.4rem;border-radius:50%;border:none;' +
    'font:700 1.1rem system-ui,sans-serif;color:#1a1030;' +
    'background:#ff8fd8;cursor:pointer;box-shadow:0 2px 10px #0008;';
  document.body.appendChild(infoBtn);

  const infoPanel = document.createElement('div');
  infoPanel.style.cssText =
    'position:fixed;top:3.6rem;right:0.8rem;z-index:6;display:none;' +
    'min-width:17rem;max-width:22rem;padding:1rem 1.15rem;' +
    'border-radius:0.8rem;background:rgba(26,16,48,0.92);color:#fff;' +
    'font:400 0.95rem/1.45 system-ui,sans-serif;' +
    'box-shadow:0 8px 24px #000a;';
  infoPanel.innerHTML =
    '<div style="font-weight:700;margin-bottom:0.5rem;font-size:1rem">Controls</div>' +
    '<div style="display:grid;grid-template-columns:auto 1fr;gap:0.3rem 0.8rem">' +
    '<kbd>WASD</kbd><span>Move</span>' +
    '<kbd>Arrows</kbd><span>Move</span>' +
    '<kbd>Space</kbd><span>Jump (triple)</span>' +
    '<kbd>Shift</kbd><span>Roll (fast)</span>' +
    '<kbd>R</kbd><span>Respawn</span>' +
    '<kbd>1–5</kbd><span>Change shape</span>' +
    '</div>' +
    '<div style="margin-top:0.7rem;font-size:0.85rem;opacity:0.75">' +
    'Climb the spiral mountain and reach the golden ring at the summit.</div>';
  infoPanel.querySelectorAll('kbd').forEach((k) => {
    (k as HTMLElement).style.cssText =
      'font:600 0.8rem/1 ui-monospace,monospace;' +
      'padding:0.2rem 0.45rem;border-radius:0.3rem;' +
      'background:#2a1a4a;border:1px solid #5d4a8a;color:#ffd4f0;' +
      'white-space:nowrap;';
  });
  document.body.appendChild(infoPanel);

  let infoOpen = false;
  const setInfoOpen = (open: boolean): void => {
    infoOpen = open;
    infoPanel.style.display = open ? 'block' : 'none';
    infoBtn.style.background = open ? '#fff' : '#ff8fd8';
  };
  infoBtn.addEventListener('click', () => setInfoOpen(!infoOpen));

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
    fallPeakVy = 0;
  };

  const setShape = (n: number): void => {
    player.geometry.dispose();
    let g: THREE.BufferGeometry;
    switch (n) {
      case 2: g = new THREE.CylinderGeometry(1, 1, 0.55, 36); break;
      case 3: g = new THREE.BoxGeometry(1.55, 1.55, 1.55); break;
      case 4: {
        const ico = new THREE.IcosahedronGeometry(1, 3);
        ico.scale(1.45, 0.7, 1.45);
        g = ico;
        break;
      }
      case 5: g = new THREE.ConeGeometry(1.25, 1.9, 4); break;
      default: g = new THREE.IcosahedronGeometry(1, 3);
    }
    player.geometry = g;
  };

  const keys: Record<string, boolean> = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) jumpQueued = true;
    }
    if (e.code === 'KeyR') respawn();
    if (e.code === 'Escape' && infoOpen) setInfoOpen(false);
    if (e.code.startsWith('Digit') && !e.repeat) {
      const n = parseInt(e.code.slice(5), 10);
      if (n >= 1 && n <= 5) setShape(n);
    }
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
  const tmpVec = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const camYaw = 0;
  const clock = new THREE.Clock();

  const collideAabb = (aabb: THREE.Box3, bounceV: number): void => {
    tmpClamp.set(
      Math.max(aabb.min.x, Math.min(player.position.x, aabb.max.x)),
      Math.max(aabb.min.y, Math.min(player.position.y, aabb.max.y)),
      Math.max(aabb.min.z, Math.min(player.position.z, aabb.max.z)),
    );
    const ddx = player.position.x - tmpClamp.x;
    const ddy = player.position.y - tmpClamp.y;
    const ddz = player.position.z - tmpClamp.z;
    const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
    if (d2 >= playerRadius * playerRadius || d2 <= 1e-8) return;
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
      jumpsLeft = MAX_JUMPS;
      if (bounceV > 0) vel.y = bounceV;
      else grounded = true;
    }
  };

  const updateSwingers = (time: number): void => {
    for (const s of swingers) {
      const theta = Math.sin(time * (Math.PI * 2 / s.period) + s.phase) * s.amplitude;
      const sint = Math.sin(theta), cost = Math.cos(theta);
      const dirX = Math.cos(s.axisYaw), dirZ = Math.sin(s.axisYaw);
      s.mesh.position.set(
        s.pivot.x + sint * s.length * dirX,
        s.pivot.y - cost * s.length,
        s.pivot.z + sint * s.length * dirZ,
      );
      s.aabb.min.copy(s.mesh.position).sub(s.halfSize);
      s.aabb.max.copy(s.mesh.position).add(s.halfSize);
      tmpVec.subVectors(s.mesh.position, s.pivot);
      const len = tmpVec.length();
      s.rope.position.copy(s.pivot).lerp(s.mesh.position, 0.5);
      s.rope.scale.set(1, Math.max(len, 0.01), 1);
      if (len > 1e-5) s.rope.quaternion.setFromUnitVectors(yAxis, tmpVec.divideScalar(len));
    }
  };

  const updatePushers = (time: number): void => {
    for (const pu of pushers) {
      const ph = ((time + pu.phase) % pu.period) / pu.period;
      const cycle = 0.5 * (1 - Math.cos(ph * Math.PI * 2));
      pu.mesh.position.copy(pu.restPos).addScaledVector(pu.extendDir, cycle * pu.extendDist);
      pu.aabb.min.copy(pu.mesh.position).sub(pu.halfSize);
      pu.aabb.max.copy(pu.mesh.position).add(pu.halfSize);
    }
  };

  const updatePins = (dtLocal: number): void => {
    for (const pin of pins) {
      if (pin.tipAngle >= Math.PI / 2) continue;
      if (pin.tipAngle > 0 || pin.angVel > 0) {
        pin.angVel += PIN_GRAVITY_ANG * Math.sin(Math.max(pin.tipAngle, 0.02)) * dtLocal;
        pin.tipAngle += pin.angVel * dtLocal;
        if (pin.tipAngle >= Math.PI / 2) {
          pin.tipAngle = Math.PI / 2;
          pin.angVel = 0;
        }
        tmpVec.set(pin.tipDir.z, 0, -pin.tipDir.x);
        pin.mesh.setRotationFromAxisAngle(tmpVec, pin.tipAngle);
      }
    }
  };

  const collidePins = (): void => {
    for (const pin of pins) {
      if (pin.tipAngle > 0.25) continue;
      const dxp = player.position.x - pin.base.x;
      const dzp = player.position.z - pin.base.z;
      const hd = Math.hypot(dxp, dzp);
      const touch = playerRadius + pin.radius;
      if (hd >= touch) continue;
      const pTop = player.position.y + playerRadius;
      const pBot = player.position.y - playerRadius;
      if (pTop <= pin.base.y || pBot >= pin.base.y + pin.height) continue;
      const pSpeed = Math.hypot(vel.x, vel.z);
      if (pSpeed > PIN_TIP_SPEED) {
        pin.tipDir.set(vel.x / pSpeed, 0, vel.z / pSpeed);
        pin.angVel = Math.min(pSpeed * 1.3, 9);
      } else {
        const nrm = hd || 1e-3;
        const nx = dxp / nrm, nz = dzp / nrm;
        const ov = touch - hd;
        player.position.x += nx * ov;
        player.position.z += nz * ov;
        vel.x *= 0.4;
        vel.z *= 0.4;
      }
    }
  };

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

      if (jumpQueued && jumpsLeft > 0) {
        vel.y = grounded ? JUMP_V : AIR_JUMP_V;
        grounded = false;
        jumpsLeft--;
      }
      jumpQueued = false;
      vel.y -= GRAVITY * dt;
      if (!grounded && vel.y < fallPeakVy) fallPeakVy = vel.y;

      player.position.x += vel.x * dt;
      player.position.y += vel.y * dt;
      player.position.z += vel.z * dt;

      updateSwingers(t);
      updatePushers(t);
      updatePins(dt);

      wasGrounded = grounded;
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
            jumpsLeft = MAX_JUMPS;
            if (p.bounceV > 0) {
              vel.y = p.bounceV;
            } else {
              grounded = true;
            }
          }
        }
      }

      for (const s of swingers) collideAabb(s.aabb, 0);
      for (const pu of pushers) collideAabb(pu.aabb, 0);
      collidePins();

      if (grounded && !wasGrounded) {
        const impactSpeed = -fallPeakVy;
        if (impactSpeed > SHED_SPEED_THRESHOLD) shedPieces(impactSpeed);
      }
      if (grounded) fallPeakVy = 0;

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

      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i]!;
        const sdx = s.mesh.position.x - player.position.x;
        const sdy = s.mesh.position.y - player.position.y;
        const sdz = s.mesh.position.z - player.position.z;
        const sd = Math.hypot(sdx, sdy, sdz);
        if (sd < playerRadius + s.radius) {
          const vPlayer = playerRadius ** 3;
          const vShard = s.radius ** 3;
          playerRadius = Math.cbrt(vPlayer + vShard);
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          (s.mesh.material as THREE.Material).dispose();
          shards.splice(i, 1);
          continue;
        }

        s.vel.y -= GRAVITY * dt;
        s.mesh.position.x += s.vel.x * dt;
        s.mesh.position.y += s.vel.y * dt;
        s.mesh.position.z += s.vel.z * dt;
        s.vel.x *= Math.exp(-0.6 * dt);
        s.vel.z *= Math.exp(-0.6 * dt);
        s.mesh.rotation.x += s.spin.x * dt;
        s.mesh.rotation.y += s.spin.y * dt;
        s.mesh.rotation.z += s.spin.z * dt;

        for (const p of platforms) {
          const cx = Math.max(p.aabb.min.x, Math.min(s.mesh.position.x, p.aabb.max.x));
          const cy = Math.max(p.aabb.min.y, Math.min(s.mesh.position.y, p.aabb.max.y));
          const cz = Math.max(p.aabb.min.z, Math.min(s.mesh.position.z, p.aabb.max.z));
          const ddx = s.mesh.position.x - cx;
          const ddy = s.mesh.position.y - cy;
          const ddz = s.mesh.position.z - cz;
          const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
          if (d2 < s.radius * s.radius && d2 > 1e-8) {
            const dd = Math.sqrt(d2);
            const nx = ddx / dd, ny = ddy / dd, nz = ddz / dd;
            const ov = s.radius - dd;
            s.mesh.position.x += nx * ov;
            s.mesh.position.y += ny * ov;
            s.mesh.position.z += nz * ov;
            const vn = s.vel.x * nx + s.vel.y * ny + s.vel.z * nz;
            if (vn < 0) {
              const restitution = 0.35;
              s.vel.x -= nx * vn * (1 + restitution);
              s.vel.y -= ny * vn * (1 + restitution);
              s.vel.z -= nz * vn * (1 + restitution);
              s.spin.multiplyScalar(0.7);
            }
            if (ny > 0.6) {
              s.vel.x *= 0.85;
              s.vel.z *= 0.85;
            }
          }
        }

        if (s.mesh.position.y < FALL_LIMIT) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          (s.mesh.material as THREE.Material).dispose();
          shards.splice(i, 1);
        }
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
    const elapsed = won ? winTime : (performance.now() - startTime) / 1000;
    const label = 'opacity:0.7;font-weight:500';
    hud.innerHTML =
      `<span style="${label}">Time</span><span>${elapsed.toFixed(1)}s</span>` +
      `<span style="${label}">Height</span><span>${(heightPct * 100).toFixed(0)}%</span>` +
      `<span style="${label}">Jellies</span><span>${absorbCount}</span>` +
      `<span style="${label}">Jumps</span><span>${jumpsLeft}/${MAX_JUMPS}</span>` +
      `<span style="${label}">Size</span><span>${playerRadius.toFixed(2)}</span>`;

    renderer.render(scene, camera);
  });
}
