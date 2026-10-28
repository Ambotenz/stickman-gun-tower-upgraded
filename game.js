const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const floorLabel = document.getElementById("floorLabel");
const missionLabel = document.getElementById("missionLabel");
const weaponLabel = document.getElementById("weaponLabel");
const statusText = document.getElementById("statusText");
const pauseButton = document.getElementById("pauseButton");
const mainMenu = document.getElementById("mainMenu");
const loadoutPanel = document.getElementById("loadoutPanel");
const helpPanel = document.getElementById("helpPanel");
const pausePanel = document.getElementById("pausePanel");
const resultPanel = document.getElementById("resultPanel");
const allMenuPanels = [loadoutPanel, helpPanel];
const settings = {
  sound: true,
  shake: true,
  difficulty: ["easy", "normal", "hard"].includes(storageGet("sgtTowerDifficulty"))
    ? storageGet("sgtTowerDifficulty")
    : "normal",
  controlScheme: ["mouse", "classic"].includes(storageGet("sgtControlScheme"))
    ? storageGet("sgtControlScheme")
    : "mouse",
};
const survivalDifficultyStats = {
  easy: { speed: 0.65, damage: 0.65, count: 0.8, fireRate: 0.6 },
  normal: { speed: 1, damage: 1, count: 1, fireRate: 1 },
  hard: { speed: 1.4, damage: 1.5, count: 1.35, fireRate: 1.25 },
};
const towerDifficultyStats = {
  easy: { speed: 0.8, damage: 0.8, count: 0.8, fireRate: 0.6 },
  normal: { speed: 1, damage: 1, count: 1, fireRate: 1 },
  hard: { speed: 1.25, damage: 1.25, count: 1.35, fireRate: 1.25 },
};
const weaponStats = {
  pistol: { label: "Pistol", cooldown: 0.24, damage: 18, speed: 510, radius: 4, spread: 0.04, recoil: 1, impact: "spark" },
  rifle: { label: "Assault Rifle", cooldown: 0.18, damage: 25, speed: 540, radius: 5, spread: 0.025, recoil: 2, impact: "spark" },
  smg: { label: "Rapid SMG", cooldown: 0.07, damage: 11, speed: 600, radius: 3, spread: 0.12, recoil: 1, impact: "spark" },
  heavy: { label: "Heavy Cannon", cooldown: 0.55, damage: 100, speed: 400, radius: 9, spread: 0.012, recoil: 7, impact: "burst" },
  burst: { label: "Burst Rifle", cooldown: 0.48, damage: 18, speed: 590, radius: 4, spread: 0.045, recoil: 2, impact: "spark", pellets: 3 },
};
function normalizeOperatorColor(color) { return /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#dff7ff"; }
const operatorStyle = { name: storageGet("sgtOperatorName", "OPERATOR 01"), accessory: storageGet("sgtOperatorAccessory", "none"), color: normalizeOperatorColor(storageGet("sgtOperatorColor", "#dff7ff")), gunColor: normalizeOperatorColor(storageGet("sgtOperatorGunColor", "#7ee5ff")) };
const arenaModifiers = [
  { id: "reactor", title: "REACTOR SURGE", detail: "Energy bursts sweep across the arena." },
  { id: "lowGravity", title: "LOW GRAVITY", detail: "Movement and enemy drift are amplified." },
  { id: "hazard", title: "HAZARD ZONE", detail: "A marked area periodically becomes dangerous." },
  { id: "blackout", title: "BLACKOUT", detail: "Visibility briefly narrows around the operator." },
  { id: "overdrive", title: "WEAPON OVERDRIVE", detail: "All weapon cooldowns are reduced." },
  { id: "containment", title: "CONTAINMENT", detail: "Some hostiles deploy temporary shields." },
  { id: "crossfire", title: "CROSS-LANE VOLLEY", detail: "Marked firing lanes sweep across the arena. Break line or dodge through the gaps." },
  { id: "surge", title: "THREAT SURGE", detail: "Hostiles briefly increase their fire rate. Watch for the warning pulse and keep moving." },
];
const floorConfigs = {
  1: { title: "MOVEMENT & BASIC HOSTILES", mix: ["runner", "runner", "grunt"], detail: "tutorial" },
  2: { title: "CROSS-FIRE", mix: ["runner", "gunner", "grunt"], detail: "crossfire" },
  3: { title: "ARMORED HOSTILES", mix: ["armored", "armored", "runner"], detail: "armor" },
  4: { title: "RANGED PRESSURE", mix: ["gunner", "gunner", "runner", "grunt"], detail: "ranged" },
  5: { title: "MIXED ASSAULT", mix: ["armored", "gunner", "exploder", "runner"], detail: "assault" },
  6: { title: "WARDEN  ▸  MID-SECTOR BOSS", mix: ["boss"], detail: "boss" },
  7: { title: "HOSTILE REINFORCEMENTS", mix: ["armored", "gunner", "runner"], detail: "reinforcements" },
  8: { title: "EXPLOSIVE CROSS-FIRE", mix: ["gunner", "exploder", "armored", "runner"], detail: "crossfire" },
  9: { title: "ARMORED GAUNTLET", mix: ["armored", "gunner", "armored", "exploder"], detail: "gauntlet" },
  10: { title: "FINAL APPROACH", mix: ["gunner", "armored", "exploder", "runner"], detail: "final-approach" },
  11: { title: "WARDEN  ▸  FINAL ENCOUNTER", mix: ["gunner", "armored", "exploder"], detail: "boss" },
};
const tutorialLessons = [
  { title: "MOVEMENT & FLOATING", detail: "Move horizontally and control your height. Use the arena space to avoid incoming fire." },
  { title: "AIM & FIRE", detail: "Aim and fire your equipped weapon using your selected controls. Keep moving between shots to make yourself harder to hit." },
  { title: "DASHING", detail: "Use your dash control to quickly reposition and briefly avoid damage. Time it to pass through incoming attacks." },
  { title: "PICKUPS & RECOVERY", detail: "Walk over weapon and rocket pickups to collect them. Medkits restore health; rockets deal area damage to groups." },
  { title: "FIELD SKILLS", detail: "Use dash to evade attacks, float to change elevation, and wall-kick by pushing into an arena edge. Keep moving during every fight." },
  { title: "GRUNT", detail: "Grunts chase you, then flash a red charge line before lunging. Sidestep the line and punish the recovery.", enemy: "grunt" },
  { title: "RUNNER", detail: "Runners rush in with a knife. Watch for the knife swing and dash away or through the strike.", enemy: "runner" },
  { title: "RANGED GUNNER", detail: "Gunners keep their distance. A gold targeting line signals a charged shot; break the line before it fires.", enemy: "gunner" },
  { title: "ARMORED HOSTILE", detail: "Armored enemies resist most weapons. A purple expanding circle marks their ground slam; escape its radius, then attack.", enemy: "armored" },
  { title: "EXPLODER", detail: "Exploders sprint toward you and flash an orange blast ring before detonating. Shoot them early or leave the marked radius.", enemy: "exploder" },
  { title: "MEDIC", detail: "Medics hang back and heal nearby allies. A green energy link shows who they are restoring; prioritize the Medic.", enemy: "medic", ally: "grunt" },
  { title: "TELEPORTER", detail: "Teleporters blink when their purple energy ring flares. Track the particles at their new position before aiming.", enemy: "teleporter" },
  { title: "SPLITTER", detail: "A Splitter releases two fast Runners when defeated. Keep firing, then reposition as soon as it breaks apart.", enemy: "splitter" },
  { title: "SHIELDBEARER", detail: "Shieldbearers guard enemies behind them. A blue charge line warns of their rush; dodge it, then flank their shield.", enemy: "shieldbearer", ally: "grunt" },
  { title: "WARDEN  ▸  PHASE 1", detail: "The Warden tracks your position and fires aimed volleys. The red attack tell means a shot is close; keep moving and dodge sideways.", enemy: "boss", bossPhase: 1 },
  { title: "WARDEN  ▸  PHASE 2", detail: "At 75% health, an orange ring signals the radial Nova. Move through the gaps as it expands; fan volleys alternate with the Nova.", enemy: "boss", bossPhase: 2 },
  { title: "WARDEN  ▸  PHASE 3", detail: "Below 30% health, a red lock line marks your position before bombardment. Leave every impact circle; attack count and warning time scale with difficulty.", enemy: "boss", bossPhase: 3 },
];
const towerFloorEnemyCounts = [0, 6, 8, 11, 13, 16, 1, 14, 16, 18, 21, 5];
function storageGet(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } }
function storageSet(key, value) { try { localStorage.setItem(key, String(value)); } catch (_) { /* Storage can be disabled by the browser. */ } }
let audioContext = null;
let backgroundMusicTimer = null;
let backgroundMusicStep = 0;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ROCKET_PICKUP_RESPAWN_SECONDS = 12;
const keys = {};
let mouseAim = null;

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const resolutionWidth = Math.round(width * pixelRatio);
  const resolutionHeight = Math.round(height * pixelRatio);
  if (canvas.width !== resolutionWidth || canvas.height !== resolutionHeight) {
    canvas.width = resolutionWidth;
    canvas.height = resolutionHeight;
  }
  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);

const state = {
  screen: "menu",
  mode: "tower",
  weapon: "pistol",
  victory: false,
  shakeTimer: 0,
  shakeDuration: 0,
  shakeStrength: 0,
  shakeBiasX: 0,
  shakeBiasY: 0,
  floor: 1,
  enemies: [],
  stones: [],
  bullets: [],
  enemyBullets: [],
  particles: [],
  stars: [],
  time: 0,
  gameOver: false,
  paused: false,
  levelCleared: false,
  score: 0,
  runTime: 0,
  weaponAmmo: { rifle: 0, smg: 0, heavy: 0, burst: 0 },
  rocketPickup: null,
  rocketSpawnTimer: 0,
  healPickup: null,
  weaponPickup: null,
  weaponSpawnTimer: 0,
  healSpawnTimer: 0,
  enemiesDefeated: 0,
  rocketsUsed: 0,
  wave: 1,
  announcement: 0,
  threatScale: 1,
  floorTransition: 0,
  slowMo: 0,
  floorHealSpawned: false,
  killStreak: 0,
  streakTimer: 0,
  arenaModifier: null,
  arenaTimer: 0,
  hazardCooldown: 6,
  hazardWarning: 0,
  hazardActive: 0,
  hazardX: 0,
  hazardY: 0,
  laneWarning: 0,
  laneY: 0,
  laneDirection: 1,
  surgeWarning: 0,
  surgeActive: 0,
  bombTimer: 0,
  bombZones: [],
  blackoutActive: 0,
  blackoutCooldown: 8,
  survivalEvent: null,
  eventTimer: 0,
  lastStandActive: false,
  perfectDodges: 0,
  noDamageFloor: true,
  floorTookDamage: false,
  lastHitTime: 0,
  dailyChallenge: null,
  dailyProgress: 0,
  floorStartingHp: 100,
  aerialKills: 0,
  dailySaveTimer: 0,
  tutorialLesson: 0,
  damageIndicator: 0,
  damageDirection: 0,
};

const player = {
  x: 120,
  y: 360,
  width: 18,
  height: 58,
  speed: 270,
  floatForce: 330,
  vx: 0,
  vy: 0,
  hp: 100,
  maxHp: 100,
  fireCooldown: 0,
  invuln: 0,
  facing: 1,
  angle: 0,
  targetAngle: 0,
  dashCooldown: 0,
  onGround: false,
  recoilVx: 0,
  recoilVy: 0,
  gunFlash: 0,
  rocketLauncher: false,
  rocketCount: 0,
  totalRocketsCollected: 0,
  hitFlash: 0,
  recoil: 0,
  dashFlash: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function pushOutOfFloatingStones(actor, actorRadius, bounce = 0) {
  for (const stone of state.stones) {
    const dx = actor.x - stone.x;
    const dy = actor.y - stone.y;
    const distance = Math.hypot(dx, dy) || 0.001;
    const minimumDistance = stone.radius + actorRadius;
    if (distance >= minimumDistance) continue;
    const nx = dx / distance;
    const ny = dy / distance;
    actor.x = stone.x + nx * minimumDistance;
    actor.y = stone.y + ny * minimumDistance;
    const inwardVelocity = actor.vx * nx + actor.vy * ny;
    if (inwardVelocity < 0) {
      actor.vx -= nx * inwardVelocity * (1 + bounce);
      actor.vy -= ny * inwardVelocity * (1 + bounce);
    }
  }
}
function damageEnemy(enemy, damage, x, y, particleColor = "#9ae6ff", weaponType = "pistol") {
  const mitigated = enemy.shielded ? damage * 0.35 : enemy.type === "armored" ? damage * 0.55 : damage;
  enemy.hp -= mitigated;
  enemy.hitFlash = 0.12;
  if (state.particles.length < 220) state.particles.push({ x, y: y - 12, vx: rand(-12, 12), vy: -42, life: 0.65, maxLife: 0.65, size: 13, color: "#fff0d8", text: String(Math.round(mitigated)) });
  spawnParticles(x, y, particleColor, enemy.type === "boss" ? 10 : 5);
  playTone(damage >= 3 ? 120 : 250, 0.035, "square", 0.008);
  if (enemy.isBoss && !enemy.phaseTwo && enemy.hp <= enemy.maxHp * 0.75) {
    enemy.phaseTwo = true;
    enemy.speed *= isHardTowerWarden() ? 1.2 : 1.25;
    enemy.fireCooldown = 0.15;
    enemy.phaseChangeTimer = 1.4;
    triggerScreenShake(5, 0.28, enemy.x, enemy.y);
    setStatus("WARDEN PHASE 2  ▸  75%  ▸  SPEED AND FIRE RATE INCREASED");
    state.announcement = 2.5;
  }
  if (enemy.isBoss && enemy.phaseTwo && !enemy.phaseThree && enemy.hp <= enemy.maxHp * 0.3) {
    enemy.phaseThree = true;
    enemy.speed *= isHardTowerWarden() ? 1.06 : 1.1;
    enemy.attackPattern = "fan";
    enemy.fireCooldown = 0.25;
    enemy.phaseChangeTimer = 1.8;
    enemy.bossSkillCooldown = 1.5;
    triggerScreenShake(8, 0.38, enemy.x, enemy.y);
    setStatus("WARDEN PHASE 3  ▸  30%  ▸  LAST STAND");
    state.announcement = 3;
  }
  if (enemy.hp <= 0) {
    enemy.alive = false;
    state.enemiesDefeated += 1;
    state.killStreak += 1;
    state.streakTimer = 6;
    const comboMultiplier = 1 + Math.min(1, Math.max(0, state.killStreak - 1) * 0.08);
    const scoreBonus = Math.round((enemy.isBoss ? 500 : enemy.elite ? 90 : 35) * comboMultiplier);
    state.score += scoreBonus;
    if (player.y < HEIGHT - 120) {
      state.aerialKills += 1;
      if (state.aerialKills === 3) {
        state.score += 100;
        setStatus("AIR COMBO  ▸  +100 SCORE");
      }
    }
    state.particles.push({ x: enemy.x, y: enemy.y - 25, vx: 0, vy: -35, life: 0.8, maxLife: 0.8, size: 14, color: "#ffe2a5", text: `+${scoreBonus}` });
    recordKill(weaponType, enemy);
    if (state.killStreak > 0 && state.killStreak % 5 === 0) { state.score += 125; setStatus(`${state.killStreak} HOSTILE STREAK  ▸  +125 BONUS`); }
    spawnParticles(enemy.x, enemy.y, enemy.isBoss ? "#ffb380" : "#ffd98d", enemy.isBoss ? 36 : 16);
    if (enemy.type === "splitter" && !enemy.splitSpawned) {
      enemy.splitSpawned = true;
      for (let i = 0; i < 2; i += 1) {
        const fragment = createEnemy("runner");
        fragment.width = 12;
        fragment.speed *= 1.2;
        fragment.x = clamp(enemy.x + (i ? 24 : -24), 30, WIDTH - 30);
        fragment.y = clamp(enemy.y + rand(-22, 22), 20, HEIGHT - 40);
        state.enemies.push(fragment);
      }
      triggerScreenShake(3.5, 0.18, enemy.x, enemy.y);
      setStatus("SPLITTER  ▸  TWO RUNNERS DEPLOYED");
    }
    if (enemy.isBoss) { state.score += 250; triggerScreenShake(10, 0.48, enemy.x, enemy.y); state.slowMo = 0.75; playTone(75, 0.45, "sawtooth", 0.07); }
    if (state.killStreak >= 10) setStatus(`KILLING SPREE  ▸  ${state.killStreak} HOSTILES  ▸  x${comboMultiplier.toFixed(1)}`);
    else if (state.killStreak >= 3) setStatus(`${state.killStreak}X COMBO  ▸  +${scoreBonus} SCORE`);
    else setStatus(enemy.isBoss ? "TARGET ELIMINATED  ▸  BOSS DOWN!" : "Enemy down.");
  }
}

function explodeRocket(rocket) {
  const blastRadius = 120;
  const distanceToPlayer = Math.hypot(player.x - rocket.x, player.y - rocket.y);
  const proximity = clamp(1 - distanceToPlayer / 520, 0, 1);
  triggerScreenShake(3 + proximity * 12, 0.3 + proximity * 0.24, rocket.x, rocket.y);
  const previousKills = state.enemiesDefeated;
  spawnParticles(rocket.x, rocket.y, "#ffb266", 30);
  state.particles.push({ x: rocket.x, y: rocket.y, radius: 12, life: 0.38, maxLife: 0.38, shockwave: true, color: "#ffb64f" });
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const distance = Math.hypot(enemy.x - rocket.x, enemy.y - rocket.y);
    if (distance > blastRadius) continue;
    const damage = rocket.damage * (1 - (distance / blastRadius) * 0.5);
    damageEnemy(enemy, damage, enemy.x, enemy.y, "#ffb266", "rocket");
  }
  if (state.enemiesDefeated - previousKills >= 3) unlockAchievement("rocket-scientist");
  setStatus("Rocket blast!");
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function setStatus(message) {
  statusText.textContent = message;
}

function triggerScreenShake(strength, duration, sourceX, sourceY) {
  if (!settings.shake) return;
  const incomingStrength = clamp(strength, 0, 18);
  const previousStrength = state.shakeTimer > 0 ? state.shakeStrength : 0;
  if (sourceX !== undefined && sourceY !== undefined) {
    const dx = player.x - sourceX;
    const dy = player.y - sourceY;
    const distance = Math.hypot(dx, dy) || 1;
    const weight = previousStrength + incomingStrength || 1;
    state.shakeBiasX = (state.shakeBiasX * previousStrength + dx / distance * incomingStrength) / weight;
    state.shakeBiasY = (state.shakeBiasY * previousStrength + dy / distance * incomingStrength) / weight;
  }
  state.shakeStrength = Math.min(18, Math.hypot(previousStrength, incomingStrength));
  state.shakeTimer = Math.max(state.shakeTimer, duration);
  state.shakeDuration = Math.max(state.shakeDuration, duration);
}

const achievementDefinitions = [
  { id: "first-blood", title: "FIRST BLOOD", requirement: "Defeat one hostile.", target: 1 },
  { id: "untouchable", title: "UNTOUCHABLE", requirement: "Clear a floor without taking damage.", target: 1 },
  { id: "rocket-scientist", title: "ROCKET SCIENTIST", requirement: "Defeat three hostiles with one rocket.", target: 1 },
  { id: "boss-breaker", title: "BOSS BREAKER", requirement: "Defeat a Warden.", target: 1 },
  { id: "arsenal", title: "ARSENAL", requirement: "Get a kill with each firearm.", target: 4 },
  { id: "survivor", title: "SURVIVOR", requirement: "Survive for five minutes.", target: 300 },
  { id: "speedrunner", title: "SPEEDRUNNER", requirement: "Clear the space campaign in under five minutes.", target: 1 },
  { id: "perfect-run", title: "PERFECT RUN", requirement: "Clear the space campaign without taking damage.", target: 1 },
];
function savedProgress(key, fallback = {}) {
  try { return JSON.parse(storageGet(key, JSON.stringify(fallback))) || fallback; } catch (_) { return fallback; }
}
function getLeaderboardThreat(mode = state.mode) {
  return mode === "tower" ? settings.difficulty : mode === "survival" ? state.screen === "menu" ? "EASY" : getSurvivalThreatLabel() : "normal";
}
function getModeDisplayName(mode = state.mode) {
  return mode === "tower" ? "SPACE CAMPAIGN" : mode === "survival" ? "ENDLESS SURVIVAL" : "TRAINING SIMULATION";
}
function leaderboardStorageKey(mode, threat) {
  const threatKey = String(threat).toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `sgtLeaderboardV2-${mode}-${threatKey}`;
}
function saveLeaderboardEntry(mode, threat, score, duration, cleared = false) {
  const key = leaderboardStorageKey(mode, threat);
  const board = savedProgress(key, []);
  const entry = { name: String(operatorStyle.name || "OPERATOR").trim().slice(0, 14) || "OPERATOR", mode, threat, score: Math.max(0, Math.floor(score)), duration: Math.max(0, Number(duration) || 0), cleared: Boolean(cleared), date: new Date().toISOString().slice(0, 10) };
  board.push(entry);
  board.sort((a, b) => b.score - a.score || a.duration - b.duration);
  const ranked = board.slice(0, 11);
  storageSet(key, JSON.stringify(ranked));
  const rank = ranked.findIndex(item => item === entry);
  return rank < 0 ? null : rank + 1;
}
function renderLeaderboard(nodeId = "leaderboardList", mode = state.mode, threat = getLeaderboardThreat(mode), limit = 5) {
  const node = document.getElementById(nodeId);
  if (!node) return;
  const board = savedProgress(leaderboardStorageKey(mode, threat), []);
  node.replaceChildren();
  if (!board.length) {
    const empty = document.createElement("p");
    empty.className = "leaderboard-empty";
    empty.textContent = nodeId === "missionLeaderboardList" ? "No runs saved for this threat yet." : "No saved runs yet. Finish a run to post your callsign.";
    node.appendChild(empty);
    return;
  }
  board.slice(0, limit).forEach((entry, index) => {
    const row = document.createElement("p");
    if (index === 0) row.classList.add("leaderboard-row-gold");
    if (index === 1) row.classList.add("leaderboard-row-silver");
    if (index === 2) row.classList.add("leaderboard-row-bronze");
    if (entry.cleared) row.classList.add("leaderboard-cleared");
    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    if (index < 3) rank.classList.add(["rank-gold", "rank-silver", "rank-bronze"][index]);
    rank.textContent = String(index + 1).padStart(2, "0");
    const details = document.createElement("span");
    details.className = "leaderboard-details";
    const name = document.createElement("span");
    name.className = "leaderboard-name";
    name.classList.add(index < 3 ? ["rank-gold", "rank-silver", "rank-bronze"][index] : "rank-gray");
    name.textContent = entry.name;
    const currentCallsign = String(operatorStyle.name || "").trim().toLocaleUpperCase();
    if (index < 5 && String(entry.name || "").trim().toLocaleUpperCase() === currentCallsign) {
      name.classList.add("rank-current-operator");
    }
    const stats = document.createElement("span");
    stats.className = "leaderboard-stats";
    stats.textContent = `${entry.score.toLocaleString()} pts  ▸  ${formatTime(entry.duration)}`;
    details.append(name, stats);
    row.append(rank, details);
    node.appendChild(row);
  });
}
let weaponMasteryCache = null;
function getWeaponMastery() {
  if (!weaponMasteryCache) weaponMasteryCache = savedProgress("sgtWeaponMastery", {});
  return weaponMasteryCache;
}
function unlockAchievement(id) {
  const unlocked = savedProgress("sgtAchievements", []);
  if (unlocked.includes(id)) return;
  unlocked.push(id);
  storageSet("sgtAchievements", JSON.stringify(unlocked));
  const achievement = achievementDefinitions.find(item => item.id === id);
  if (achievement) setStatus(`ACHIEVEMENT UNLOCKED  ▸  ${achievement.title}`);
}
function updateDailyChallenge(type, amount = 1) {
  if (!state.dailyChallenge) return;
  if (state.dailyChallenge.type !== type || state.dailyChallenge.complete) return;
  state.dailyProgress = type === "floor"
    ? Math.max(state.dailyProgress, amount)
    : state.dailyProgress + amount;
  state.dailySaveTimer += amount;
  if (type !== "survive" || state.dailySaveTimer >= 1 || state.dailyProgress >= state.dailyChallenge.target) {
    storageSet(`sgtDailyState-${state.dailyChallenge.date}`, JSON.stringify({ progress: state.dailyProgress }));
    state.dailySaveTimer = 0;
  }
  if (state.dailyProgress >= state.dailyChallenge.target) {
    state.dailyChallenge.complete = true;
    storageSet(`sgtDaily-${state.dailyChallenge.date}`, "complete");
    state.score += 250;
    setStatus(`DAILY CHALLENGE COMPLETE  ▸  +250 SCORE`);
  }
}
function recordKill(weaponType, enemy) {
  updateDailyChallenge("kills", 1);
  const mastery = getWeaponMastery();
  if (weaponType && weaponType !== "rocket") mastery[weaponType] = (mastery[weaponType] || 0) + 1;
  storageSet("sgtWeaponMastery", JSON.stringify(mastery));
  const firearms = ["pistol", "rifle", "smg", "heavy"];
  if (firearms.every(weapon => mastery[weapon] > 0)) unlockAchievement("arsenal");
  if (state.enemiesDefeated === 1) unlockAchievement("first-blood");
  if (enemy.isBoss) unlockAchievement("boss-breaker");
}
function renderRecords() {
  const today = new Date().toISOString().slice(0, 10);
  const challenges = [
    { type: "kills", target: 20, title: "ELIMINATE 20 HOSTILES" },
    { type: "survive", target: 180, title: "SURVIVE FOR 3 MINUTES" },
    { type: "floor", target: 5, title: "REACH FLOOR 5" },
  ];
  const dailyIndex = today.split("-").join("").split("").reduce((sum, digit) => sum + Number(digit), 0) % challenges.length;
  const savedChallenge = savedProgress(`sgtDailyState-${today}`, { progress: 0 });
  state.dailyChallenge = { ...challenges[dailyIndex], date: today, complete: storageGet(`sgtDaily-${today}`) === "complete" };
  state.dailyProgress = savedChallenge.progress || 0;
  if (state.dailyChallenge.complete) state.dailyProgress = state.dailyChallenge.target;
  const challengeNode = document.getElementById("dailyChallengeText");
  if (challengeNode) challengeNode.textContent = `DAILY  ▸  ${state.dailyChallenge.title}  ▸  ${Math.min(state.dailyProgress, state.dailyChallenge.target)}/${state.dailyChallenge.target}${state.dailyChallenge.complete ? "  ▸  COMPLETE" : ""}`;
  const unlocked = savedProgress("sgtAchievements", []);
  const achievementNode = document.getElementById("achievementList");
  if (achievementNode) achievementNode.innerHTML = `<p><strong>ACHIEVEMENTS</strong></p>${achievementDefinitions.map(item => `<p>${unlocked.includes(item.id) ? "✓" : "○"} ${item.title} — ${item.requirement}</p>`).join("")}`;
  const mastery = getWeaponMastery();
  const goals = { pistol: 100, rifle: 250, smg: 300, heavy: 75 };
  const masteryNode = document.getElementById("masteryList");
  if (masteryNode) masteryNode.innerHTML = `<p><strong>WEAPON MASTERY  ▸  COSMETIC GUN TINTS</strong></p>${Object.keys(goals).map(weapon => {
    const kills = mastery[weapon] || 0;
    const rank = kills >= goals[weapon] * 2 ? "ELITE TINT" : kills >= goals[weapon] ? "EXPERT TINT" : "ROOKIE";
    return `<p>${weaponStats[weapon].label}: ${kills}/${goals[weapon]} kills  ▸  ${rank}</p>`;
  }).join("")}`;
  const recordsBoardTitle = document.getElementById("recordsLeaderboardTitle");
  if (recordsBoardTitle) recordsBoardTitle.textContent = `${getModeDisplayName()} // ${getLeaderboardThreat().toUpperCase()} THREAT`;
  renderLeaderboard();
}

function formatTime(seconds) {
  const centiseconds = Math.floor(seconds * 100);
  const minutes = Math.floor(centiseconds / 6000);
  const remainingSeconds = Math.floor(centiseconds / 100) % 60;
  const fraction = centiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}.${String(fraction).padStart(2, "0")}`;
}

function getDifficultyStats() {
  if (state.mode === "survival") {
    if (state.floor <= 1) return survivalDifficultyStats.easy;
    if (state.floor === 2) return survivalDifficultyStats.normal;
    const escalation = state.floor - 3;
    return {
      speed: Math.min(1.9, 1.4 + escalation * 0.04),
      damage: Math.min(3, 1.5 + escalation * 0.12),
      count: Math.min(2, 1.35 + escalation * 0.05),
      fireRate: Math.min(2, 1.25 + escalation * 0.06),
    };
  }
  return state.mode === "tower" ? towerDifficultyStats[settings.difficulty] : survivalDifficultyStats.normal;
}

function getWardenDifficultyProfile() {
  const difficulty = state.mode === "survival"
    ? state.floor <= 1 ? "easy" : state.floor === 2 ? "normal" : "hard"
    : settings.difficulty;
  const profiles = {
    easy: {
      novaCooldown: 12, novaWarning: 1.2, novaShots: 6, novaDamage: 7, novaSpeed: 225,
      barrageCooldown: 13, barrageCharge: 1.35, barrageCount: 1, barrageWarning: 1.65, barrageDamage: 12, barrageRadius: 82,
      summonCooldown: 14, summonCount: 3, summonShieldChance: 0.1, fanOffsets: [-0.24, 0, 0.24],
    },
    normal: {
      novaCooldown: 9.5, novaWarning: 1, novaShots: 8, novaDamage: 9, novaSpeed: 250,
      barrageCooldown: 10.5, barrageCharge: 1.1, barrageCount: 2, barrageWarning: 1.4, barrageDamage: 16, barrageRadius: 96,
      summonCooldown: 10, summonCount: 4, summonShieldChance: 0.2, fanOffsets: [-0.34, -0.17, 0, 0.17, 0.34],
    },
    hard: {
      novaCooldown: 7.5, novaWarning: 0.82, novaShots: 10, novaDamage: 11, novaSpeed: 280,
      barrageCooldown: 8, barrageCharge: 0.9, barrageCount: 3, barrageWarning: 1.1, barrageDamage: 20, barrageRadius: 108,
      summonCooldown: 8, summonCount: 5, summonShieldChance: 0.32, fanOffsets: [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48],
    },
  };
  const profile = profiles[difficulty] || profiles.normal;
  if (state.mode === "tower" && [6, 11].includes(state.floor) && settings.difficulty === "hard") {
    return {
      ...profile,
      novaCooldown: profile.novaCooldown * 1.2,
      novaWarning: profile.novaWarning + 0.16,
      novaShots: 8,
      novaDamage: profile.novaDamage * 0.85,
      novaSpeed: profile.novaSpeed * 0.94,
      barrageCooldown: profile.barrageCooldown * 1.2,
      barrageCharge: profile.barrageCharge + 0.16,
      barrageCount: 2,
      barrageWarning: profile.barrageWarning + 0.18,
      barrageDamage: profile.barrageDamage * 0.85,
      barrageRadius: profile.barrageRadius * 0.92,
      summonCooldown: profile.summonCooldown * 1.2,
      summonCount: 3,
      summonShieldChance: profile.summonShieldChance * 0.75,
      fanOffsets: [-0.34, -0.17, 0, 0.17, 0.34],
    };
  }
  return profile;
}

function isHardTowerWarden() {
  return state.mode === "tower" && [6, 11].includes(state.floor) && settings.difficulty === "hard";
}

function getSurvivalThreatLabel() {
  if (state.floor <= 1) return "EASY";
  if (state.floor === 2) return "NORMAL";
  return state.floor === 3 ? "HARD" : `HARD +${state.floor - 3}`;
}

function playTone(frequency = 180, duration = 0.055, type = "square", volume = 0.025) {
  if (!settings.sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.45), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional; gameplay still works if the browser blocks it. */ }
}

function stopBackgroundMusic() {
  if (backgroundMusicTimer !== null) clearInterval(backgroundMusicTimer);
  backgroundMusicTimer = null;
}

function startBackgroundMusic() {
  stopBackgroundMusic();
  if (!settings.sound || state.screen !== "playing") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    const melody = [220, 261.63, 293.66, 261.63, 196, 220, 246.94, 220];
    backgroundMusicTimer = setInterval(() => {
      if (!settings.sound || state.screen !== "playing" || !audioContext) {
        stopBackgroundMusic();
        return;
      }
      const now = audioContext.currentTime;
      const frequency = melody[backgroundMusicStep++ % melody.length];
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.64);
    }, 480);
  } catch (_) { stopBackgroundMusic(); }
}

function closeMenuPanels() {
  allMenuPanels.forEach(panel => panel.classList.add("hidden"));
  document.getElementById("recordsPanel").classList.add("hidden");
}

function showMainMenu() {
  clearHeldInput();
  state.mode = "tower";
  state.screen = "menu";
  state.paused = false;
  document.body.classList.remove("playing");
  mainMenu.classList.remove("hidden");
  pausePanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  document.getElementById("floorClearPanel").classList.add("hidden");
  document.getElementById("tutorialPanel").classList.add("hidden");
  document.getElementById("tutorialFinishConfirm").classList.add("hidden");
  closeMenuPanels();
  document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item.dataset.mode === "tower"));
  document.getElementById("towerDifficultyRow").classList.add("hidden");
  const scoreKey = state.mode === "survival" ? "sgtSurvivalBestScore" : "sgtTowerBestScore";
  document.getElementById("bestScore").textContent = String(Number(storageGet(scoreKey, "0")) || 0).padStart(6, "0");
  document.getElementById("bestScoreLabel").textContent = state.mode === "survival" ? "SURVIVAL BEST" : "SPACE BEST";
  updateLoadoutSummary();
}

function startMission() {
  clearHeldInput();
  closeMenuPanels();
  mainMenu.classList.add("hidden");
  pausePanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  document.getElementById("floorClearPanel").classList.add("hidden");
  document.getElementById("tutorialFinishConfirm").classList.add("hidden");
  document.getElementById("tutorialPanel").classList.toggle("hidden", state.mode !== "tutorial");
  document.body.classList.add("playing");
  state.screen = "playing";
  resetRun();
  updateControlHints();
  setStatus(state.mode === "survival" ? "Survival started. Stay alive as long as you can!"
    : state.mode === "tutorial" ? "Training simulation active. Follow the lesson prompts."
      : "Space campaign started. Clear the sector!");
  playTone(240, 0.12, "sawtooth", 0.035);
}

function showResult(victory = false) {
  clearHeldInput();
  document.getElementById("floorClearPanel").classList.add("hidden");
  state.victory = victory;
  resultPanel.classList.toggle("result-victory", victory && state.mode === "tower");
  if (victory) playTone(520, 0.38, "triangle", 0.06);
  state.screen = "result";
  resultPanel.classList.remove("hidden");
  pausePanel.classList.add("hidden");
  document.getElementById("resultEyebrow").textContent = victory ? "SECTOR CONQUERED" : "MISSION REPORT";
  document.getElementById("resultTitle").textContent = victory ? "SPACE CAMPAIGN CLEARED" : "RUN ENDED";
  document.getElementById("resultMessage").textContent = victory && state.mode === "tower" ? "CONGRATULATIONS FOR CLEARING THE CAMPAIGN" : victory ? "Every sector is clear. Operator, excellent work." : "The hostile sector won this round. Re-arm and try again.";
  document.getElementById("resultScore").textContent = String(state.score).padStart(6, "0");
  document.getElementById("resultFloor").textContent = String(state.floor);
  document.getElementById("resultTime").textContent = formatTime(state.runTime);
  const recordKey = state.mode === "tower" ? "sgtTowerBestScore" : "sgtSurvivalBestScore";
  const previousBest = Number(storageGet(recordKey, "0")) || 0;
  const leaderboardThreat = getLeaderboardThreat(state.mode);
  const leaderboardRank = saveLeaderboardEntry(state.mode, leaderboardThreat, state.score, state.runTime, victory && state.mode === "tower");
  document.getElementById("resultLeaderboardTitle").textContent = `${getModeDisplayName()} ${leaderboardThreat.toUpperCase()} THREAT`;
  renderLeaderboard("resultLeaderboardList", state.mode, leaderboardThreat);
  const best = Math.max(previousBest, state.score);
  const newRecord = state.score > previousBest;
  storageSet(recordKey, best);
  document.getElementById("bestScore").textContent = String(best).padStart(6, "0");
  document.getElementById("resultBestScore").textContent = String(best).padStart(6, "0");
  document.getElementById("resultEnemies").textContent = String(state.enemiesDefeated);
  document.getElementById("resultRockets").textContent = String(state.rocketsUsed);
  document.getElementById("resultRecord").textContent = leaderboardRank
    ? `${operatorStyle.name}  ▸  LOCAL RANK #${leaderboardRank}`
    : newRecord ? "NEW PERSONAL RECORD" : "SCORE OUTSIDE LOCAL TOP 5";
  document.getElementById("resultMode").textContent = state.mode === "tower"
    ? `${settings.difficulty.toUpperCase()} SPACE CAMPAIGN`
    : state.mode === "survival" ? `${getSurvivalThreatLabel()} SURVIVAL  ▸  WAVE ${state.floor}` : "TRAINING SIM";
  document.getElementById("bestScore").textContent = String(best).padStart(6, "0");

  if (victory && state.mode === "tower") {
    if (state.noDamageFloor) unlockAchievement("perfect-run");
    if (state.runTime < 300) unlockAchievement("speedrunner");
    const previousBestTime = Number(storageGet("sgtTowerBestClearTime"));
    const isNewBestTime = !Number.isFinite(previousBestTime) || previousBestTime <= 0 || state.runTime < previousBestTime;
    if (isNewBestTime) storageSet("sgtTowerBestClearTime", state.runTime);
    document.getElementById("resultMessage").textContent = "CONGRATULATIONS FOR CLEARING THE GAME";
    document.getElementById("bestClearTime").textContent = formatTime(Math.min(previousBestTime || state.runTime, state.runTime));
  }
}

function updateHud() {
  floorLabel.textContent = `Sector ${state.floor}`;
  missionLabel.textContent = state.paused
    ? "Mission: paused"
    : state.gameOver
      ? (state.victory ? "Mission: complete" : "Mission: failed")
      : state.levelCleared
        ? "Mission: advance"
        : state.mode === "survival" ? "Mission: survive"
        : state.mode === "tutorial" ? "Mission: training simulation" : "Mission: clear the sector";
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(state.paused));
  pauseButton.disabled = state.gameOver;
}

function updateControlHints() {
  const classic = settings.controlScheme === "classic";
  const touch = settings.controlScheme === "touch";
  document.body.classList.toggle("mouse-aim-enabled", !classic && !touch);
  document.body.classList.toggle("touch-controls-enabled", touch);
  document.getElementById("moveKeyHint").textContent = classic ? "A / D / W / S" : touch ? "Left stick" : "A / D + W / S";
  document.getElementById("fireKeyHint").textContent = classic ? "J" : touch ? "Aim edge" : "Left click";
  document.getElementById("rocketKeyHint").textContent = classic ? "L" : touch ? "Rocket btn" : "Right click";
  document.getElementById("menuWeaponHint").textContent = classic ? "J FIRE EQUIPPED  ▸  PICKUPS AUTO-EQUIP" : touch ? "TOUCH AIM / MOVE  ▸  EDGE TO FIRE" : "PICKUPS AUTO-EQUIP  ▸  LEFT CLICK FIRE";
  document.getElementById("menuFireHint").textContent = classic ? "K DASH  ▸  L ROCKET" : touch ? "DASH LEFT  ▸  ROCKET ABOVE AIM" : "SPACE DASH  ▸  RIGHT CLICK ROCKET";
  document.getElementById("dashKeyHint").textContent = classic ? "K" : touch ? "Touch" : "Space";
  document.getElementById("helpDashHint").textContent = classic ? "K" : touch ? "Touch dash button" : "Space";
  document.getElementById("pauseKeyHint").textContent = "ESC";
  document.getElementById("helpPauseHint").textContent = classic ? "ESC" : "P / ESC";
  document.getElementById("helpClassicControls").classList.toggle("hidden", !classic);
  document.getElementById("helpMouseControls").classList.toggle("hidden", classic || touch);
  document.getElementById("helpMouseAim").classList.toggle("hidden", classic || touch);
  document.getElementById("helpClassicAim").classList.toggle("hidden", !classic);
  document.getElementById("helpTouchControls").classList.toggle("hidden", !touch);
  document.getElementById("touchControls").classList.toggle("hidden", !touch || state.screen !== "playing");
}

function renderTutorialLesson() {
  const lesson = tutorialLessons[state.tutorialLesson];
  const tutorialPanel = document.getElementById("tutorialPanel");
  tutorialPanel.classList.remove("lesson-change");
  void tutorialPanel.offsetWidth;
  tutorialPanel.classList.add("lesson-change");
  const touch = settings.controlScheme === "touch";
  const classic = settings.controlScheme === "classic";
  const controls = touch
    ? "Left stick moves. Push the right aim stick to its outer edge to fire; DASH is beside it, and ROCKET launches."
    : classic
      ? "A / D move, W / S float, J fires, K dashes, and L launches a rocket."
      : "A / D move, W / S float, mouse aims, left click fires, Space dashes, and right click launches a rocket.";
  document.getElementById("tutorialProgress").textContent = `TUTORIAL  ▸  LESSON ${state.tutorialLesson + 1} OF ${tutorialLessons.length}`;
  document.getElementById("tutorialTitle").textContent = lesson.title;
  document.getElementById("tutorialDetail").textContent = `${lesson.detail} ${controls}`;
  document.getElementById("tutorialPrevious").disabled = state.tutorialLesson === 0;
  document.getElementById("tutorialNext").textContent = state.tutorialLesson === tutorialLessons.length - 1 ? "FINISH →" : "NEXT LESSON →";
}

function performDash() {
  if (state.screen !== "playing" || player.dashCooldown > 0) return;
  const nearProjectile = state.enemyBullets.some(bullet => Math.hypot(bullet.x - player.x, bullet.y - player.y) < 72);
  let directionX = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let directionY = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  let directionLength = Math.hypot(directionX, directionY);
  if (directionLength === 0) {
    directionX = player.vx;
    directionY = player.vy;
    directionLength = Math.hypot(directionX, directionY);
  }
  if (directionLength < 1) {
    directionX = player.facing || 1;
    directionY = 0;
    directionLength = 1;
  }
  directionX /= directionLength;
  directionY /= directionLength;
  const dashX = directionX * 110;
  const dashY = directionY * 110;
  player.x = clamp(player.x + dashX, 30, WIDTH - 30);
  player.y = clamp(player.y + dashY, 30, HEIGHT - 30);
  player.vx = directionX * 420;
  player.vy = directionY * 420;
  player.dashCooldown = 0.8;
  player.invuln = 0.25;
  player.dashFlash = 0.24;
  triggerScreenShake(2.2, 0.13, player.x - directionX * 24, player.y - directionY * 24);
  spawnParticles(player.x, player.y, "#9be7ff", 12);
  if (nearProjectile) {
    state.perfectDodges += 1;
    state.slowMo = 0.45;
    state.score += 100;
    triggerScreenShake(3.8, 0.2);
    setStatus("PERFECT DODGE  ▸  +100 SCORE");
    playTone(680, 0.12, "triangle", 0.04);
  } else setStatus("Dash burst.");
}

function applyPlayerRecoil(aimX, aimY, force) {
  player.recoilVx -= aimX * force;
  player.recoilVy -= aimY * force;
}

function createStars() {
  state.stars = [];
  for (let i = 0; i < 58; i += 1) {
    state.stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 0.8 + 1,
      speed: Math.random() * 14 + 10,
    });
  }
}

function spawnParticles(x, y, color, count) {
  const available = Math.max(0, 240 - state.particles.length);
  for (let i = 0; i < Math.min(Math.ceil(count), available); i += 1) {
    state.particles.push({
      x,
      y,
      vx: rand(-160, 160),
      vy: rand(-150, 120),
      life: rand(0.2, 0.8),
      maxLife: rand(0.2, 0.8),
      size: rand(2, 6),
      color,
    });
  }
}

function createEnemy(forcedType = null) {
  const difficulty = getDifficultyStats();
  const config = state.mode === "survival"
    ? { title: state.floor % 5 === 0 ? "ELITE BOSS WAVE" : "ENDLESS ASSAULT", mix: ["runner", "gunner", "armored", "exploder"] }
    : floorConfigs[Math.min(state.floor, 11)] || floorConfigs[11];
  let type = forcedType || config.mix[Math.floor(Math.random() * config.mix.length)];
  if (!forcedType && type !== "boss" && Math.random() < 0.12) {
    type = ["medic", "teleporter", "splitter", "shieldbearer"][Math.floor(Math.random() * 4)];
  }
  const boss = type === "boss";
  if (boss) type = "boss";
  const hardTowerBoss = boss && isHardTowerWarden();
  const elite = state.mode === "survival" && state.runTime >= 90 && Math.random() < Math.min(0.24, 0.06 + state.runTime / 1800);
  if (elite && !boss) type = "armored";
  const profiles = {
    grunt: { speed: 82, hp: 100, cooldown: 2.2, behavior: "chase", color: "#f6d37b" },
    runner: { speed: 175, hp: 100, cooldown: 0, behavior: "rush", color: "#ff7268" },
    gunner: { speed: 62, hp: 125, cooldown: 1.75, behavior: "keep-distance", color: "#88d9ff" },
    armored: { speed: 48, hp: 250, cooldown: 2.5, behavior: "chase", color: "#c5a6ff" },
    exploder: { speed: 112, hp: 100, cooldown: 0, behavior: "explode", color: "#ff9d44" },
    medic: { speed: 70, hp: 125, cooldown: 2.4, behavior: "medic", color: "#78f0a0" },
    teleporter: { speed: 105, hp: 100, cooldown: 1.8, behavior: "teleport", color: "#d49aff" },
    splitter: { speed: 88, hp: 150, cooldown: 0, behavior: "split", color: "#ffad5c" },
    shieldbearer: { speed: 56, hp: 225, cooldown: 2.7, behavior: "shield", color: "#80b6ff" },
    boss: { speed: 78, hp: (2000 + Math.min(state.floor, 12) * 100) * (hardTowerBoss ? 0.9 : 1), cooldown: 1.05, behavior: "boss", color: "#ff9275" },
  };
  const profile = profiles[type];
  const scale = state.mode === "survival" ? state.threatScale : 1;
  const hp = profile.hp;
  const enemy = {
    x: rand(980, WIDTH - 70),
    y: rand(110, HEIGHT - 110),
    width: boss ? 38 : type === "armored" ? 24 : 18,
    height: boss ? 84 : 54,
    speed: profile.speed * difficulty.speed * Math.min(scale, 1.5) * (hardTowerBoss ? 0.94 : 1),
    vx: rand(-60, 60), vy: rand(-45, 45),
    hp, maxHp: hp,
    fireCooldown: rand(profile.cooldown * 0.75, profile.cooldown * 1.35) / (difficulty.fireRate * Math.min(scale, 1.65)),
    isBoss: boss,
    type, behavior: profile.behavior, color: elite ? "#ffe46b" : profile.color, elite,
    hitFlash: 0, phaseTwo: false, phaseThree: false, phaseChangeTimer: 0, explodeTimer: 0,
    skillTimer: 0, skillKind: "", skillTargetX: 0, skillTargetY: 0,
    signatureCooldown: type === "gunner" ? rand(3.5, 5.5) : type === "shieldbearer" ? rand(4, 6) : type === "grunt" ? rand(3.5, 5) : type === "armored" ? rand(4, 6) : 0,
    signatureTimer: 0, signatureAngle: 0, rushTimer: 0, rushHit: false,
    summonCooldown: boss ? getWardenDifficultyProfile().summonCooldown : 0,
    abilityCooldown: type === "teleporter" ? 3 : type === "medic" ? 2.2 : 0,
    meleeCooldown: type === "runner" ? rand(0.25, 0.7) : 0,
    knifeSwing: 0,
    attackPattern: "aimed",
    bossSkillCooldown: 5,
    bossSkillTimer: 0,
    bossSkillKind: "",
    bossSkillTargetX: 0,
    bossSkillTargetY: 0,
    alive: true,
    angle: 0,
  };

  if (enemy.vx === 0) enemy.vx = 60;
  return enemy;
}

function spawnRocketPickup() {
  if (state.gameOver || state.rocketPickup) return;

  state.rocketSpawnTimer = 0;
  state.rocketPickup = {
    x: rand(180, WIDTH - 180),
    y: rand(140, HEIGHT - 140),
    radius: 13,
    pulse: rand(0, Math.PI * 2),
    active: true,
  };
}

function spawnHealPickup() {
  state.healPickup = {
    x: rand(180, WIDTH - 180),
    y: rand(140, HEIGHT - 140),
    radius: 13,
    pulse: rand(0, Math.PI * 2),
  };
}

function spawnWeaponPickup() {
  const weapons = ["rifle", "smg", "heavy", "burst"];
  const weapon = weapons[Math.floor(Math.random() * weapons.length)];
  state.weaponPickup = {
    x: rand(220, WIDTH - 220),
    y: rand(150, HEIGHT - 150),
    radius: 17,
    pulse: rand(0, Math.PI * 2),
    weapon,
  };
}

function triggerSurvivalEvent() {
  const events = [
    { name: "HORDE", message: "MANY WEAK RUNNERS INBOUND", spawn: () => { for (let i = 0; i < 7; i += 1) state.enemies.push(createEnemy("runner")); } },
    { name: "ELITE HUNT", message: "ELITE HOSTILES DETECTED", spawn: () => { for (let i = 0; i < 3; i += 1) { const elite = createEnemy("armored"); elite.elite = true; elite.color = "#ffe46b"; state.enemies.push(elite); } } },
    { name: "BOSS RUSH", message: "WARDEN SIGNATURES DETECTED", spawn: () => { for (let i = 0; i < 2; i += 1) state.enemies.push(createEnemy("boss")); } },
    { name: "AMMO CRISIS", message: "SUPPLY ROUTES DISRUPTED", spawn: () => { state.weaponPickup = null; state.weaponSpawnTimer = 18; } },
    { name: "ROCKET FRENZY", message: "EXPLOSIVE SUPPLIES INBOUND", spawn: () => { player.rocketCount += 1; spawnRocketPickup(); } },
    { name: "LAST STAND", message: "HOSTILE DAMAGE AND REWARDS INCREASED", spawn: () => { state.lastStandActive = true; } },
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  state.survivalEvent = event.name;
  state.eventTimer = 20;
  event.spawn();
  state.announcement = 3.2;
  setStatus(`WAVE ${state.wave}  ▸  ${event.name}  ▸  ${event.message}`);
}

function updateWeaponPickup(dt) {
  if (state.weaponPickup) return;
  state.weaponSpawnTimer -= dt;
  if (state.weaponSpawnTimer > 0) return;
  spawnWeaponPickup(); state.weaponSpawnTimer = rand(5, 9);
}

function updateRocketPickup(dt) {
  if (state.rocketPickup || state.rocketSpawnTimer <= 0 || state.gameOver) return;
  state.rocketSpawnTimer = Math.max(0, state.rocketSpawnTimer - dt);
  if (state.rocketSpawnTimer === 0) spawnRocketPickup();
}

function updateHealPickup(dt) {
  state.healSpawnTimer -= dt;
  if (state.healSpawnTimer > 0) return;

  const recoveryFloor = state.mode === "tower" && state.floor % 5 === 0;
  if (recoveryFloor && state.floorHealSpawned) return;
  if (!state.healPickup && player.hp < player.maxHp) {
    spawnHealPickup();
    if (recoveryFloor) state.floorHealSpawned = true;
  }
  state.healSpawnTimer = rand(10, 22);
}

function showFloorNotification(kind, duration) {
  const panel = document.getElementById("floorClearPanel");
  const starting = kind === "starting";
  const noun = state.mode === "survival" ? "WAVE" : "SECTOR";
  panel.classList.remove("floor-starting", "floor-ending");
  const finalFloorIntro = starting && state.mode === "tower" && state.floor === 11;
  document.getElementById("floorClearEyebrow").textContent = finalFloorIntro ? "FINAL CHALLENGE" : starting ? "HOSTILE SECTOR INCOMING" : "HOSTILE SECTOR SECURED";
  document.getElementById("floorClearTitle").textContent = finalFloorIntro
    ? "FINAL SECTOR GOODLUCK!!"
    : starting
      ? `${noun} ${state.floor} STARTING`
    : `${noun} ${state.floor} CLEARED`;
  document.getElementById("floorClearDetail").textContent = finalFloorIntro
    ? "THE WARDEN AWAITS"
    : starting
      ? "NEW SECTOR DETECTED: PREPARE TO DEPLOY"
    : state.mode === "tower" ? "PREPARING NEXT SECTOR..." : "PREPARING NEXT WAVE...";
  panel.classList.add(starting ? "floor-starting" : "floor-ending");
  panel.classList.remove("hidden");
  void panel.offsetWidth;
  state.floorTransition = duration;
}

function buildLevel() {
  state.enemies = [];
  state.stones = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.particles = [];
  state.levelCleared = false;
  state.floorTransition = 0;
  state.floorHealSpawned = false;
  state.floorTookDamage = false;
  state.killStreak = 0;
  state.streakTimer = 0;
  state.rocketPickup = null;
  state.rocketSpawnTimer = 0;
  state.healPickup = null;
  state.weaponPickup = null;
  state.weaponSpawnTimer = 0;
  state.healSpawnTimer = state.mode === "tower" && state.floor % 5 === 0 ? 25 : rand(5, 15);
  state.arenaModifier = state.mode === "tutorial" ? null : arenaModifiers[Math.floor(Math.random() * arenaModifiers.length)];
  state.arenaTimer = 7;
  state.hazardCooldown = 6;
  state.hazardWarning = 0;
  state.hazardActive = 0;
  state.blackoutActive = 0;
  state.laneWarning = 0;
  state.laneY = 0;
  state.laneDirection = Math.random() < 0.5 ? 1 : -1;
  state.surgeWarning = 0;
  state.surgeActive = 0;
  state.bombTimer = state.mode === "tutorial" ? 0 : 6;
  state.bombZones = [];

  const config = state.mode === "tutorial"
    ? { title: "TRAINING SIMULATION", mix: [] }
    : state.mode === "survival"
    ? { title: state.floor % 5 === 0 ? "ELITE BOSS WAVE" : "ENDLESS ASSAULT", mix: ["runner", "gunner", "armored", "exploder"] }
    : floorConfigs[Math.min(state.floor, 11)] || floorConfigs[11];
  const count = state.mode === "tutorial" ? 0 : state.mode === "tower"
    ? Math.ceil(towerFloorEnemyCounts[state.floor] * getDifficultyStats().count)
    : Math.min(28, Math.ceil((4 + Math.min(state.floor, 14) * 1.4) * getDifficultyStats().count));
  for (let i = 0; i < count; i += 1) {
    let type = state.mode === "tower" && (state.floor === 6 || state.floor === 11) && i === 0
      ? "boss"
      : state.mode === "survival" && state.floor % 5 === 0 && i === 0
        ? "boss"
        : config.mix[i % config.mix.length];
    if (type !== "boss" && Math.random() < 0.12) type = ["medic", "teleporter", "splitter", "shieldbearer"][Math.floor(Math.random() * 4)];
    const enemy = createEnemy(type);
    const lane = i % 4;
    enemy.x = rand(730, WIDTH - 55);
    enemy.y = 145 + lane * 135 + rand(-25, 25);
    state.enemies.push(enemy);
  }
  if (state.mode !== "tutorial") {
    const stoneCount = state.mode === "survival" ? 5
      : state.floor <= 4 ? 0
        : state.floor <= 6 ? 2
          : state.floor <= 8 ? 3
            : state.floor <= 10 ? 4 : 5;
    const stoneSpots = [
      [310, 205], [455, 465], [595, 285], [735, 500], [850, 165],
      [390, 340], [680, 390], [520, 145], [820, 365], [275, 515],
    ];
    const shuffledSpots = stoneSpots.sort(() => Math.random() - 0.5);
    for (const [x, y] of shuffledSpots) {
      if (state.stones.length >= stoneCount) break;
      if (Math.hypot(player.x - x, player.y - y) < 115) continue;
      if (state.enemies.some(enemy => Math.hypot(enemy.x - x, enemy.y - y) < 78)) continue;
      state.stones.push({ x, y, radius: rand(22, 34), phase: rand(0, Math.PI * 2), facets: 7 + Math.floor(Math.random() * 3) });
    }
  }
  spawnRocketPickup();
  spawnWeaponPickup();
  state.weaponSpawnTimer = rand(5, 9);

  state.announcement = 2.3;
  if (state.mode === "tutorial") {
    state.tutorialLesson = 0;
    spawnTutorialLesson();
    renderTutorialLesson();
  }
  if (state.arenaModifier?.id === "containment") {
    for (const enemy of state.enemies) if (!enemy.isBoss && Math.random() < 0.22) enemy.shielded = true;
  }
  setStatus(state.mode === "tutorial" ? "TRAINING SIMULATION  ▸  ENCOUNTERS ON DEMAND"
    : state.mode === "tower" ? `SECTOR ${state.floor}  ▸  ${config.title}  ▸  ${state.arenaModifier.title}`
      : `WAVE ${state.wave}  ▸  ${getSurvivalThreatLabel()} THREAT  ▸  ${state.arenaModifier.title}`);
  if (state.mode !== "tutorial") showFloorNotification("starting", 2);
}

function spawnTutorialLesson() {
  state.enemies = [];
  state.enemyBullets = [];
  state.bullets = [];
  const lesson = tutorialLessons[state.tutorialLesson];
  if (!lesson.enemy) return;
  const types = lesson.ally ? [lesson.enemy, lesson.ally] : [lesson.enemy];
  types.forEach((type, index) => {
    const enemy = createEnemy(type);
    if (lesson.bossPhase) {
      enemy.hp = enemy.maxHp * (lesson.bossPhase === 1 ? 1 : lesson.bossPhase === 2 ? 0.6 : 0.2);
      enemy.phaseTwo = lesson.bossPhase >= 2;
      enemy.phaseThree = lesson.bossPhase >= 3;
      enemy.attackPattern = lesson.bossPhase >= 2 ? "fan" : "aimed";
      enemy.speed *= lesson.bossPhase === 2 ? 1.25 : lesson.bossPhase === 3 ? 1.5 : 1;
      enemy.fireCooldown = lesson.bossPhase === 3 ? 0.9 : lesson.bossPhase === 2 ? 1.05 : 1.55;
    }
    enemy.x = 820 + index * 120;
    enemy.y = index % 2 ? 410 : 300;
    if (lesson.enemy === "shieldbearer" && type === "shieldbearer") enemy.angle = Math.PI;
    state.enemies.push(enemy);
  });
}

function changeTutorialLesson(direction) {
  if (state.mode !== "tutorial") return;
  state.tutorialLesson = clamp(state.tutorialLesson + direction, 0, tutorialLessons.length - 1);
  spawnTutorialLesson();
  renderTutorialLesson();
  setStatus(`TRAINING  ▸  ${tutorialLessons[state.tutorialLesson].title}`);
}

function resetRun() {
  clearHeldInput();
  state.floor = 1;
  state.tutorialLesson = 0;
  state.victory = false;
  state.score = 0;
  state.enemiesDefeated = 0;
  state.rocketsUsed = 0;
  state.wave = 1;
  state.threatScale = 1;
  state.announcement = 2.3;
  state.slowMo = 0;
  state.arenaModifier = null;
  state.arenaTimer = 0;
  state.survivalEvent = null;
  state.eventTimer = 0;
  state.lastStandActive = false;
  state.perfectDodges = 0;
  state.noDamageFloor = true;
  state.floorTookDamage = false;
  state.aerialKills = 0;
  state.dailySaveTimer = 0;
  state.damageIndicator = 0;
  state.gameOver = false;
  state.paused = false;
  state.time = 0;
  state.runTime = 0;
  state.shakeTimer = 0;
  state.shakeDuration = 0;
  state.shakeStrength = 0;
  state.shakeBiasX = 0;
  state.shakeBiasY = 0;
  player.x = 120;
  player.y = 360;
  player.maxHp = 100;
  player.vx = 0;
  player.vy = 0;
  player.hp = player.maxHp;
  player.fireCooldown = 0;
  player.gunFlash = 0;
  player.invuln = 0;
  player.dashCooldown = 0;
  player.onGround = false;
  player.recoilVx = 0;
  player.recoilVy = 0;
  player.facing = 1;
  player.angle = 0;
  player.targetAngle = 0;
  player.rocketLauncher = false;
  player.rocketCount = 0;
  player.totalRocketsCollected = 0;
  player.hitFlash = 0;
  player.recoil = 0;
  player.dashFlash = 0;
  state.weaponAmmo.rifle = 0;
  state.weaponAmmo.smg = 0;
  state.weaponAmmo.heavy = 0;
  state.weaponAmmo.burst = 0;
  state.weapon = "pistol";
  state.floorStartingHp = player.maxHp;
  state.dailyProgress = 0;
  renderRecords();
  updateDailyChallenge("floor", state.floor);
  createStars();
  buildLevel();
  updateHud();
}

function hitPlayer(amount) {
  if (state.mode === "tutorial" || player.invuln > 0 || state.gameOver) return;
  state.noDamageFloor = false;
  state.floorTookDamage = true;
  state.lastHitTime = state.runTime;
  state.damageIndicator = 0.55;
  const towerDamageScale = state.mode === "tower" ? getDifficultyStats().damage : 1;
  player.hp -= amount * towerDamageScale;
  player.invuln = 1.1;
  player.hitFlash = 0.2;
  const knockSource = state.enemies.filter(enemy => enemy.alive).sort((a, b) => Math.hypot(player.x - a.x, player.y - a.y) - Math.hypot(player.x - b.x, player.y - b.y))[0];
  if (knockSource) { const angle = Math.atan2(player.y - knockSource.y, player.x - knockSource.x); state.damageDirection = angle; player.vx += Math.cos(angle) * 180; player.vy += Math.sin(angle) * 140; }
  triggerScreenShake(4, 0.2, knockSource?.x, knockSource?.y);
  playTone(105, 0.12, "sawtooth", 0.045);
  spawnParticles(player.x, player.y, "#ff8c8c", 16);
  if (player.hp <= 0) {
    player.hp = 0;
    state.gameOver = true;
    setStatus("Player 1 knocked out.");
    showResult(false);
  }
}

function findLoadedWeapon(preferredWeapon = state.weapon) {
  if (preferredWeapon !== "pistol" && state.weaponAmmo[preferredWeapon] > 0) return preferredWeapon;
  return ["rifle", "smg", "heavy", "burst"].find(weapon => state.weaponAmmo[weapon] > 0) || "pistol";
}

function shootPlayer(useRocket = false, selectedWeapon = state.weapon) {
  if (state.gameOver) return;
  if (player.fireCooldown > 0) return;

  const aimX = Math.cos(player.angle || 0) || 1;
  const aimY = Math.sin(player.angle || 0) || 0;

  if (useRocket) {
    if (player.rocketCount <= 0) {
      setStatus("No rockets left.");
      return;
    }

    player.fireCooldown = 0.52;
    player.rocketCount -= 1;
    state.rocketsUsed += 1;
    state.bullets.push({
      x: player.x + aimX * 30,
      y: player.y + aimY * 30,
      vx: aimX * 420,
      vy: aimY * 420,
      radius: 9,
      damage: 200,
      team: "player",
      rocket: true,
    });
    applyPlayerRecoil(aimX, aimY, 110);
    triggerScreenShake(2, 0.12, player.x - aimX * 24, player.y - aimY * 24);
    player.gunFlash = 0.12;
    setStatus(`Rocket fired. ${player.rocketCount} left.`);
    updateHud();
    return;
  }

  const weaponType = findLoadedWeapon(selectedWeapon);
  state.weapon = weaponType;
  const weapon = weaponStats[weaponType] || weaponStats.rifle;

  if (weaponType !== "pistol") {
    state.weaponAmmo[weaponType] -= 1;
  }
  const arenaFireRate = state.arenaModifier?.id === "overdrive" ? 1.2 : 1;
  player.fireCooldown = weapon.cooldown / arenaFireRate;
  const spread = weapon.spread;
  const shotAngles = weapon.pellets
    ? Array.from({ length: weapon.pellets }, (_, i) => (i - (weapon.pellets - 1) / 2) * 0.035)
    : [0];
  for (const offset of shotAngles) {
    const angle = player.angle + rand(-spread, spread) + offset;
    state.bullets.push({
      x: player.x + Math.cos(angle) * 22,
      y: player.y + Math.sin(angle) * 22,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      radius: weapon.radius,
      damage: weapon.damage,
      pierce: 0,
      team: "player",
      rocket: false, weapon: weaponType, impact: weapon.impact,
    });
  }
  if (weaponType === "heavy") applyPlayerRecoil(aimX, aimY, 70);
  player.recoil = weapon.recoil;
  spawnParticles(player.x + aimX * 28, player.y + aimY * 28, "#fff0a8", weaponType === "heavy" ? 8 : 3);
  player.gunFlash = 0.08;
  playTone(weaponType === "heavy" ? 95 : weaponType === "smg" ? 290 : 180, weaponType === "heavy" ? 0.1 : 0.045, "square", weaponType === "heavy" ? 0.04 : 0.018);
  if (weaponType !== "pistol" && state.weaponAmmo[weaponType] === 0 && state.weapon === weaponType) {
    state.weapon = findLoadedWeapon();
    setStatus(state.weapon === "pistol"
      ? `${weapon.label} empty. Switching to Pistol.`
      : `${weapon.label} empty. Switching to ${weaponStats[state.weapon].label}.`);
  }
  updateHud();
}

function shootEnemy(enemy) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lead = Math.min(0.35, dist / 900);
  const aimAngle = Math.atan2(dy + player.vy * lead, dx + player.vx * lead) + rand(-0.09, 0.09);
  const fan = enemy.isBoss && enemy.phaseTwo && enemy.attackPattern === "fan";
  const spread = fan ? getWardenDifficultyProfile().fanOffsets : [0];
  for (const offset of spread) {
    const angle = aimAngle + offset;
    const speed = enemy.isBoss ? 300 : 235;
    state.enemyBullets.push({
      x: enemy.x + enemy.width * 0.4 * Math.sign(dx || 1),
      y: enemy.y + 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: enemy.isBoss ? 6 : 5,
        damage: (enemy.isBoss ? 12 * (enemy.phaseThree ? 1.2 : enemy.phaseTwo ? 1.25 : 1) : enemy.type === "gunner" ? 7 : 8) * getDifficultyStats().damage * Math.min(state.threatScale, 1.4) * (state.lastStandActive ? 1.25 : 1) * (enemy.isBoss && isHardTowerWarden() ? 0.85 : 1),
      team: "enemy",
    });
  }
}

function fireWardenNova(enemy, profile) {
  const startAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI / profile.novaShots;
  for (let i = 0; i < profile.novaShots; i += 1) {
    const angle = startAngle + (Math.PI * 2 * i) / profile.novaShots;
    state.enemyBullets.push({
      x: enemy.x + Math.cos(angle) * 30,
      y: enemy.y + Math.sin(angle) * 30,
      vx: Math.cos(angle) * profile.novaSpeed,
      vy: Math.sin(angle) * profile.novaSpeed,
      radius: 6,
      damage: profile.novaDamage,
      team: "enemy",
      bossNova: true,
    });
  }
  setStatus("WARDEN NOVA  ▸  RADIAL VOLLEY RELEASED");
  triggerScreenShake(6, 0.3, enemy.x, enemy.y);
  playTone(110, 0.24, "sawtooth", 0.04);
}

function updateWardenSkills(enemy, dt) {
  if (!enemy.isBoss || !enemy.phaseTwo || enemy.phaseChangeTimer > 0) return;
  const profile = getWardenDifficultyProfile();
  if (enemy.bossSkillTimer > 0) {
    enemy.bossSkillTimer = Math.max(0, enemy.bossSkillTimer - dt);
    if (enemy.bossSkillTimer === 0) {
      if (enemy.bossSkillKind === "nova") {
        fireWardenNova(enemy, profile);
      } else if (enemy.bossSkillKind === "barrage") {
        const offsets = profile.barrageCount === 1
          ? [{ x: 0, y: 0 }]
          : profile.barrageCount === 2
            ? [{ x: -54, y: -30 }, { x: 54, y: 30 }]
            : [{ x: -76, y: 42 }, { x: 0, y: -34 }, { x: 76, y: 42 }];
        for (const offset of offsets) {
          state.bombZones.push({
            x: clamp(enemy.bossSkillTargetX + offset.x, 130, WIDTH - 130),
            y: clamp(enemy.bossSkillTargetY + offset.y, 100, HEIGHT - 100),
            warning: profile.barrageWarning,
            warningDuration: profile.barrageWarning,
            active: 0,
            radius: profile.barrageRadius,
            damage: profile.barrageDamage,
            fromBoss: true,
          });
        }
        setStatus(`WARDEN BOMBARDMENT  ▸  ${profile.barrageCount} IMPACT ZONE${profile.barrageCount > 1 ? "S" : ""}`);
        playTone(85, 0.3, "sawtooth", 0.05);
      }
      enemy.bossSkillKind = "";
    }
    return;
  }

  enemy.bossSkillCooldown -= dt;
  if (enemy.bossSkillCooldown > 0) return;
  if (enemy.phaseThree) {
    enemy.bossSkillKind = "barrage";
    enemy.bossSkillTimer = profile.barrageCharge;
    enemy.bossSkillCooldown = profile.barrageCooldown;
    enemy.bossSkillTargetX = player.x;
    enemy.bossSkillTargetY = player.y;
    setStatus("WARDEN TARGET LOCK  ▸  MOVE BEFORE IMPACT");
    triggerScreenShake(3.5, 0.2, enemy.x, enemy.y);
  } else {
    enemy.bossSkillKind = "nova";
    enemy.bossSkillTimer = profile.novaWarning;
    enemy.bossSkillCooldown = profile.novaCooldown;
    setStatus("WARDEN NOVA CHARGING  ▸  PREPARE TO DODGE");
  }
}

function nextFloor() {
  state.floor += 1;
  if (state.mode === "tower") state.wave = state.floor;
  document.getElementById("floorClearPanel").classList.add("hidden");
  if (state.floor > 11) {
    if (state.mode === "survival") { /* Survival mode keeps climbing indefinitely. */ }
    else { state.floor = 11; state.gameOver = true; showResult(true); setStatus("Space campaign cleared! Mission complete."); return; }
  }
  updateDailyChallenge("floor", state.floor);
  state.floorStartingHp = player.hp;
  buildLevel();
  updateHud();
}

function triggerKeyDown(event) {
  const key = event.key.toLowerCase();
  if (((key === " " && settings.controlScheme === "mouse") || (key === "k" && settings.controlScheme === "classic")) && state.screen === "playing") event.preventDefault();

  if (((key === "p" && settings.controlScheme !== "classic") || key === "escape") && !event.repeat && (state.screen === "playing" || state.screen === "paused")) {
    event.preventDefault();
    togglePause();
    return;
  }

  keys[key] = true;
  if (key === "r" && (state.gameOver || state.screen === "playing" || state.screen === "result")) { startMission(); return; }
  if (state.screen !== "playing") return;

  if (settings.controlScheme === "classic" && key === "l" && !event.repeat) {
    shootPlayer(true);
  }

  if (key === "w") {
    player.vy = -player.floatForce;
  } else if (key === "s") {
    player.vy = player.floatForce;
  }

  const dashKeyPressed = settings.controlScheme === "classic" ? key === "k" : key === " ";
  if (dashKeyPressed && !event.repeat) performDash();

}

function triggerKeyUp(event) {
  const key = event.key.toLowerCase();
  keys[key] = false;
}

window.addEventListener("keydown", triggerKeyDown);
window.addEventListener("keyup", triggerKeyUp);
canvas.addEventListener("contextmenu", event => event.preventDefault());
function updateMouseAim(event, snap = false) {
  const rect = canvas.getBoundingClientRect();
  mouseAim = {
    x: (event.clientX - rect.left) * WIDTH / rect.width,
    y: (event.clientY - rect.top) * HEIGHT / rect.height,
  };
  if (snap && state.screen === "playing") {
    player.targetAngle = Math.atan2(mouseAim.y - player.y, mouseAim.x - player.x);
    player.angle = player.targetAngle;
  }
}
canvas.addEventListener("mousemove", event => {
  if (state.screen === "playing") updateMouseAim(event);
});
canvas.addEventListener("mousedown", event => {
  if (state.screen !== "playing" || settings.controlScheme !== "mouse") return;
  updateMouseAim(event, true);
  if (event.button === 0) {
    event.preventDefault();
    keys.mouseLeft = true;
  } else if (event.button === 2) {
    event.preventDefault();
    shootPlayer(true);
  }
});
window.addEventListener("mouseup", event => {
  if (event.button === 0) keys.mouseLeft = false;
});

let touchAimAngle = null;
let touchAimFiring = false;
document.querySelectorAll(".touch-stick").forEach(stick => {
  let activePointer = null;
  const knob = stick.querySelector("span");
  const updateStick = event => {
    const rect = stick.getBoundingClientRect();
    const maxDistance = rect.width * 0.34;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const scale = distance > maxDistance ? maxDistance / distance : 1;
    const x = dx * scale / maxDistance;
    const y = dy * scale / maxDistance;
    knob.style.transform = `translate(${x * maxDistance}px, ${y * maxDistance}px)`;
    if (stick.dataset.stick === "move") {
      keys.a = x < -0.28;
      keys.d = x > 0.28;
      keys.w = y < -0.28;
      keys.s = y > 0.28;
    } else {
      if (distance > rect.width * 0.12) touchAimAngle = Math.atan2(dy, dx);
      touchAimFiring = distance >= maxDistance * 0.9;
    }
  };
  const releaseStick = event => {
    if (activePointer !== event.pointerId) return;
    activePointer = null;
    knob.style.transform = "";
    if (stick.dataset.stick === "move") {
      keys.a = keys.d = keys.w = keys.s = false;
    } else {
      touchAimFiring = false;
    }
  };
  stick.addEventListener("pointerdown", event => {
    if (settings.controlScheme !== "touch" || state.screen !== "playing") return;
    event.preventDefault();
    activePointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    updateStick(event);
  });
  stick.addEventListener("pointermove", event => {
    if (activePointer === event.pointerId) updateStick(event);
  });
  stick.addEventListener("pointerup", releaseStick);
  stick.addEventListener("pointercancel", releaseStick);
});
document.querySelectorAll("[data-touch-action]").forEach(button => {
  const action = button.dataset.touchAction;
  button.addEventListener("pointerdown", event => {
    if (settings.controlScheme !== "touch" || state.screen !== "playing") return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (action === "dash") performDash();
    else if (action === "rocket") shootPlayer(true);
  });
});

function togglePause() {
  if (state.gameOver || (state.screen !== "playing" && state.screen !== "paused")) return;
  state.paused = !state.paused;
  if (state.paused) clearHeldInput();
  state.screen = state.paused ? "paused" : "playing";
  pausePanel.classList.toggle("hidden", !state.paused);
  setStatus(state.paused ? "Game paused." : "Game resumed.");
  updateHud();
}

pauseButton.addEventListener("click", togglePause);

function clearHeldInput() { Object.keys(keys).forEach(key => { keys[key] = false; }); }
function pauseForFocusLoss() {
  clearHeldInput();
  if (state.screen === "playing") togglePause();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseForFocusLoss(); else clearHeldInput(); });

function updatePlayer(dt) {
  const left = !!keys.a || !!keys.arrowleft;
  const right = !!keys.d || !!keys.arrowright;
  const up = !!keys.w || !!keys.arrowup;
  const down = !!keys.s || !!keys.arrowdown;

  if (state.rocketPickup && state.rocketPickup.active) {
    const pickupDx = player.x - state.rocketPickup.x;
    const pickupDy = player.y - state.rocketPickup.y;
    const pickupDist = Math.hypot(pickupDx, pickupDy);
    if (pickupDist < 28) {
      player.rocketLauncher = true;
      player.totalRocketsCollected += 1;
      player.rocketCount += 1;
      state.rocketPickup.active = false;
      state.rocketPickup = null;
      state.rocketSpawnTimer = ROCKET_PICKUP_RESPAWN_SECONDS;
      setStatus(`Rocket acquired! +1 rocket (${player.rocketCount} total).`);
      playTone(420, 0.09, "triangle", 0.035);
      updateHud();
    }
  }

  if (state.healPickup) {
    const pickupDx = player.x - state.healPickup.x;
    const pickupDy = player.y - state.healPickup.y;
    if (Math.hypot(pickupDx, pickupDy) < 28 && player.hp < player.maxHp) {
      const healed = Math.min(20, player.maxHp - player.hp);
      player.hp += healed;
      state.healPickup = null;
      setStatus(`Recovered ${Math.ceil(healed)} HP.`);
      playTone(640, 0.12, "sine", 0.035);
      spawnParticles(player.x, player.y, "#80f0a0", 14);
      updateHud();
    }
  }

  if (state.weaponPickup && Math.hypot(player.x - state.weaponPickup.x, player.y - state.weaponPickup.y) < 34) {
    const pickedUpWeapon = state.weaponPickup.weapon;
    const ammoGranted = pickedUpWeapon === "rifle" ? 15 : pickedUpWeapon === "smg" ? 30 : pickedUpWeapon === "burst" ? 8 : 3;
    state.weaponAmmo[pickedUpWeapon] += ammoGranted;
    state.weapon = pickedUpWeapon;
    setStatus(`${weaponStats[pickedUpWeapon].label} equipped! +${ammoGranted} shots.`);
    playTone(510, 0.1, "triangle", 0.04);
    spawnParticles(state.weaponPickup.x, state.weaponPickup.y, "#9beeff", 14);
    state.weaponPickup = null;
    state.weaponSpawnTimer = rand(5, 9);
    updateHud();
  }

  if (left && !right) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (right && !left) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.7;
  }

  if (up && !down) {
    player.vy = -player.floatForce * (state.arenaModifier?.id === "lowGravity" ? 1.35 : 1);
  } else if (down && !up) {
    player.vy = player.floatForce * (state.arenaModifier?.id === "lowGravity" ? 1.35 : 1);
  } else {
    player.vy *= 0.72;
  }

  player.x += (player.vx + player.recoilVx) * dt;
  player.y += (player.vy + player.recoilVy) * dt;
  if (player.x <= 19 && right || player.x >= WIDTH - 19 && left) {
    player.vx = player.x <= 19 ? 350 : -350;
    player.vy = -180;
    player.invuln = Math.max(player.invuln, 0.16);
    player.dashFlash = 0.18;
    player.x = clamp(player.x + player.vx * dt, 20, WIDTH - 20);
    triggerScreenShake(2.8, 0.15, player.x - Math.sign(player.vx) * 24, player.y + 20);
    setStatus("WALL KICK  ▸  OPERATOR REPOSITIONED");
  }
  player.recoilVx *= Math.exp(-8 * dt);
  player.recoilVy *= Math.exp(-8 * dt);
  player.x = clamp(player.x, 18, WIDTH - 18);
  player.y = clamp(player.y, 50, HEIGHT - 40);
  pushOutOfFloatingStones(player, 14);
  if (player.y > HEIGHT - 100) state.aerialKills = 0;

  const moveX = (right ? 1 : 0) - (left ? 1 : 0);
  const moveY = (down ? 1 : 0) - (up ? 1 : 0);
  if (settings.controlScheme === "touch" && touchAimAngle !== null) {
    player.targetAngle = touchAimAngle;
  } else if (settings.controlScheme === "mouse" && mouseAim) {
    player.targetAngle = Math.atan2(mouseAim.y - player.y, mouseAim.x - player.x);
  } else if (moveX || moveY) {
    player.targetAngle = Math.atan2(moveY, moveX);
    if (moveX) player.facing = moveX;
  }
  let angleDifference = player.targetAngle - player.angle;
  angleDifference = Math.atan2(Math.sin(angleDifference), Math.cos(angleDifference));
  player.angle += angleDifference * Math.min(1, dt * 10);
  if ((settings.controlScheme === "classic" && keys.j)
    || (settings.controlScheme === "mouse" && keys.mouseLeft)
    || (settings.controlScheme === "touch" && touchAimFiring)) {
    shootPlayer(false, state.weapon);
  }

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.gunFlash = Math.max(0, player.gunFlash - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.recoil = Math.max(0, player.recoil - dt * 30);
  player.dashFlash = Math.max(0, player.dashFlash - dt);
  state.damageIndicator = Math.max(0, state.damageIndicator - dt);
}

function isShieldProtected(target) {
  const lineX = target.x - player.x;
  const lineY = target.y - player.y;
  const lineLength = Math.hypot(lineX, lineY) || 1;
  return state.enemies.some(guard => {
    if (!guard.alive || guard.type !== "shieldbearer" || guard === target) return false;
    const projection = ((guard.x - player.x) * lineX + (guard.y - player.y) * lineY) / lineLength;
    if (projection <= 0 || projection >= lineLength) return false;
    const nearestX = player.x + lineX * (projection / lineLength);
    const nearestY = player.y + lineY * (projection / lineLength);
    return Math.hypot(guard.x - nearestX, guard.y - nearestY) < 28;
  });
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (bullet.x < -40 || bullet.x > WIDTH + 40 || bullet.y < -40 || bullet.y > HEIGHT + 40) {
      state.bullets.splice(i, 1);
      continue;
    }

    const stoneHit = state.stones.find(stone => Math.hypot(bullet.x - stone.x, bullet.y - stone.y) < stone.radius + bullet.radius);
    if (stoneHit) {
      if (bullet.rocket) explodeRocket(bullet);
      else spawnParticles(bullet.x, bullet.y, "#c3c8d1", 4);
      state.bullets.splice(i, 1);
      continue;
    }

    let hitRocket = false;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const hitRadius = (enemy.width + bullet.radius) * 0.8 + 8;
      if (Math.hypot(dx, dy) < hitRadius) {
        if (isShieldProtected(enemy)) {
          spawnParticles(bullet.x, bullet.y, "#7be5ff", 3);
          state.bullets.splice(i, 1);
          break;
        }
        if (bullet.rocket) {
          explodeRocket(bullet);
          hitRocket = true;
        } else {
          damageEnemy(enemy, bullet.damage, bullet.x, bullet.y, bullet.weapon === "heavy" ? "#ffb46b" : "#9ae6ff", bullet.weapon);
          spawnParticles(bullet.x, bullet.y, bullet.impact === "burst" ? "#ffb46b" : "#e9fbff", bullet.impact === "burst" ? 14 : 5);
          if (bullet.impact === "burst") triggerScreenShake(2.8, 0.14, bullet.x, bullet.y);
      
        }
        state.bullets.splice(i, 1);
        break;
      }
    }
    if (hitRocket) continue;
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (bullet.x < -40 || bullet.x > WIDTH + 40 || bullet.y < -40 || bullet.y > HEIGHT + 40) {
      state.enemyBullets.splice(i, 1);
      continue;
    }

    if (state.stones.some(stone => Math.hypot(bullet.x - stone.x, bullet.y - stone.y) < stone.radius + bullet.radius)) {
      spawnParticles(bullet.x, bullet.y, "#c3c8d1", 3);
      state.enemyBullets.splice(i, 1);
      continue;
    }

    const dx = bullet.x - player.x;
    const dy = bullet.y - player.y;
    if (Math.hypot(dx, dy) < (player.width + bullet.radius) * 0.9) {
      state.enemyBullets.splice(i, 1);
      hitPlayer(bullet.damage);
    }
  }
}

function updateEnemies(dt) {
  let alive = 0;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    alive += 1;

    if (enemy.isBoss && state.mode === "tower" && state.floor === 11) {
      const wardenProfile = getWardenDifficultyProfile();
      enemy.summonCooldown -= dt;
      if (enemy.summonCooldown <= 0) {
        enemy.summonCooldown = wardenProfile.summonCooldown;
        enemy.skillTimer = 0.9;
        enemy.skillKind = "summon";
        const summonTypes = ["grunt", "runner", "gunner", "armored", "exploder", "medic", "teleporter", "splitter", "shieldbearer"];
        for (let i = 0; i < wardenProfile.summonCount; i += 1) {
          const summonType = summonTypes[Math.floor(Math.random() * summonTypes.length)];
          const minion = createEnemy(summonType);
          minion.shielded = Math.random() < wardenProfile.summonShieldChance;
          minion.x = clamp(enemy.x + rand(-130, 130), 30, WIDTH - 30);
          minion.y = clamp(enemy.y + rand(-100, 100), 20, HEIGHT - 40);
          state.enemies.push(minion);
          spawnParticles(minion.x, minion.y, minion.shielded ? "#7be5ff" : minion.color, 8);
        }
        setStatus(`WARDEN SUMMONS  ▸  ${wardenProfile.summonCount} RANDOM HOSTILES DEPLOYED`);
      }
    }

    const dirX = player.x - enemy.x;
    const dirY = player.y - enemy.y;
    const dist = Math.hypot(dirX, dirY) || 1;
    const canFire = enemy.type === "gunner" || enemy.type === "teleporter" || enemy.type === "shieldbearer" || enemy.isBoss || enemy.type === "grunt" || enemy.type === "armored";
    enemy.phaseChangeTimer = Math.max(0, (enemy.phaseChangeTimer || 0) - dt);
    updateWardenSkills(enemy, dt);
    enemy.signatureCooldown = Math.max(0, (enemy.signatureCooldown || 0) - dt);
    let signatureResolved = false;
    if (enemy.signatureTimer > 0) {
      enemy.signatureTimer = Math.max(0, enemy.signatureTimer - dt);
      if (enemy.signatureTimer === 0) {
        signatureResolved = true;
        if (enemy.type === "gunner") {
          const angle = enemy.signatureAngle;
          state.enemyBullets.push({
            x: enemy.x + Math.cos(angle) * 22,
            y: enemy.y + Math.sin(angle) * 22,
            vx: Math.cos(angle) * 390,
            vy: Math.sin(angle) * 390,
            radius: 8,
            damage: 16 * getDifficultyStats().damage * Math.min(state.threatScale, 1.4),
            team: "enemy",
            charged: true,
          });
          enemy.skillTimer = 0.38;
          enemy.skillKind = "charged";
          playTone(160, 0.08, "sawtooth", 0.025);
        } else if (enemy.type === "shieldbearer" || enemy.type === "grunt") {
          enemy.rushTimer = enemy.type === "shieldbearer" ? 0.55 : 0.38;
          enemy.rushHit = false;
          enemy.skillTimer = enemy.rushTimer;
          enemy.skillKind = enemy.type === "shieldbearer" ? "rush" : "lunge";
        } else if (enemy.type === "armored") {
          enemy.skillTimer = 0.55;
          enemy.skillKind = "slam";
          spawnParticles(enemy.x, enemy.y, "#c5a6ff", 22);
          state.particles.push({ x: enemy.x, y: enemy.y, radius: 12, life: 0.34, maxLife: 0.34, shockwave: true, color: "#c5a6ff" });
          triggerScreenShake(7, 0.3, enemy.x, enemy.y);
          if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 132) {
            hitPlayer(20 * getDifficultyStats().damage);
          }
        }
      }
    }
    if (enemy.type === "gunner" && enemy.signatureCooldown === 0 && enemy.signatureTimer === 0 && dist < 620) {
      enemy.signatureCooldown = 7.5;
      enemy.signatureTimer = 0.9;
      enemy.signatureAngle = Math.atan2(dirY + player.vy * 0.12, dirX + player.vx * 0.12);
      enemy.skillKind = "charge";
      setStatus("GUNNER CHARGING  ▸  BREAK THE FIRING LINE");
    } else if (enemy.type === "shieldbearer" && enemy.signatureCooldown === 0 && enemy.signatureTimer === 0 && dist > 110 && dist < 350) {
      enemy.signatureCooldown = 8;
      enemy.signatureTimer = 0.72;
      enemy.signatureAngle = Math.atan2(dirY, dirX);
      enemy.skillKind = "shieldCharge";
      setStatus("SHIELDBEARER RUSH  ▸  DODGE THE CHARGE");
    } else if (enemy.type === "grunt" && enemy.signatureCooldown === 0 && enemy.signatureTimer === 0 && dist > 90 && dist < 260) {
      enemy.signatureCooldown = 6.5;
      enemy.signatureTimer = 0.6;
      enemy.signatureAngle = Math.atan2(dirY, dirX);
      enemy.skillKind = "lungeCharge";
      setStatus("GRUNT LUNGE  ▸  EVADE THE ADVANCE");
    } else if (enemy.type === "armored" && enemy.signatureCooldown === 0 && enemy.signatureTimer === 0 && dist < 185) {
      enemy.signatureCooldown = 7.5;
      enemy.signatureTimer = 0.85;
      enemy.skillKind = "slamCharge";
      setStatus("ARMORED SLAM  ▸  MOVE OUT OF RANGE");
    }

    if (enemy.rushTimer > 0) {
      enemy.rushTimer = Math.max(0, enemy.rushTimer - dt);
      const rushSpeed = enemy.type === "grunt" ? 2.7 : 3.6;
      enemy.vx = Math.cos(enemy.signatureAngle) * enemy.speed * rushSpeed;
      enemy.vy = Math.sin(enemy.signatureAngle) * enemy.speed * rushSpeed;
    } else if (enemy.signatureTimer > 0) {
      enemy.vx *= 0.86;
      enemy.vy *= 0.86;
    } else if (enemy.behavior === "keep-distance" || enemy.behavior === "medic") {
      const desired = enemy.behavior === "medic" ? 300 : 390;
      const approach = dist > desired + 45 ? 1 : dist < desired - 45 ? -1 : 0;
      enemy.vx += (dirX / dist) * approach * 105 * dt;
      enemy.vy += (dirY / dist) * approach * 105 * dt;
    } else {
      const acceleration = enemy.behavior === "rush" ? 300 : enemy.behavior === "explode" ? 190 : 80;
      enemy.vx += (dirX / dist) * acceleration * dt;
      enemy.vy += (dirY / dist) * acceleration * dt;
    }
    enemy.vx *= 0.986; enemy.vy *= 0.986;
    const speed = Math.hypot(enemy.vx, enemy.vy);
    const maxSpeed = enemy.speed * (enemy.rushTimer > 0 ? enemy.type === "grunt" ? 2.7 : 3.6 : state.lastStandActive ? 1.15 : 1);
    if (speed > maxSpeed) { enemy.vx = enemy.vx / speed * maxSpeed; enemy.vy = enemy.vy / speed * maxSpeed; }
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.x < 30 || enemy.x > WIDTH - 30) enemy.vx *= -0.85;
    if (enemy.y < 20 || enemy.y > HEIGHT - 40) enemy.vy *= -0.85;

    enemy.x = clamp(enemy.x, 30, WIDTH - 30);
    enemy.y = clamp(enemy.y, 20, HEIGHT - 40);
    pushOutOfFloatingStones(enemy, enemy.isBoss ? 27 : Math.max(15, enemy.width * 0.72), 0.35);
    if (enemy.rushTimer > 0 && !enemy.rushHit && Math.hypot(player.x - enemy.x, player.y - enemy.y) < 48) {
      enemy.rushHit = true;
      hitPlayer((enemy.type === "grunt" ? 11 : 18) * getDifficultyStats().damage);
    }

    enemy.angle = Math.atan2(dirY, dirX);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.knifeSwing = Math.max(0, enemy.knifeSwing - dt);
    enemy.skillTimer = Math.max(0, (enemy.skillTimer || 0) - dt);
    enemy.abilityCooldown -= dt;
    if (enemy.behavior === "teleport" && enemy.abilityCooldown <= 0 && dist < 340) {
      enemy.abilityCooldown = 4.5;
      enemy.skillTimer = 0.55;
      enemy.skillKind = "teleport";
      triggerScreenShake(2.6, 0.17, enemy.x, enemy.y);
      spawnParticles(enemy.x, enemy.y, enemy.color, 10);
      enemy.x = rand(160, WIDTH - 100);
      enemy.y = rand(90, HEIGHT - 100);
      spawnParticles(enemy.x, enemy.y, enemy.color, 10);
      setStatus("TELEPORTER REPOSITIONED");
    }
    if (enemy.behavior === "medic" && enemy.abilityCooldown <= 0) {
      const nearbyAllies = state.enemies.filter(other => other !== enemy && other.alive
        && other.hp < other.maxHp && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 260);
      if (nearbyAllies.length) {
        for (const ally of nearbyAllies) {
          ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.2);
          spawnParticles(ally.x, ally.y, "#78f0a0", 7);
        }
        const ally = nearbyAllies[0];
        enemy.abilityCooldown = 3;
        enemy.skillTimer = 0.85;
        enemy.skillKind = "heal";
        enemy.skillTargetX = ally.x;
        enemy.skillTargetY = ally.y;
      }
    }
    enemy.fireCooldown -= dt * (state.surgeActive > 0 ? 1.8 : 1);
    enemy.attackTell = ((enemy.isBoss || enemy.type === "gunner" || enemy.type === "teleporter") && enemy.fireCooldown < 0.42 && enemy.fireCooldown > 0)
      || (enemy.type === "runner" && dist < 58 && enemy.meleeCooldown < 0.24);
    if (enemy.behavior === "explode") {
      if (dist < 105 && enemy.skillKind !== "explode") {
        enemy.skillKind = "explode";
        enemy.skillTimer = 0.65;
        enemy.explodeTimer = 0.65;
      }
      if (enemy.skillKind === "explode") {
        enemy.explodeTimer -= dt;
        if (enemy.explodeTimer <= 0) {
          enemy.alive = false;
          spawnParticles(enemy.x, enemy.y, "#ff7c3d", 28);
          state.particles.push({ x: enemy.x, y: enemy.y, radius: 8, life: 0.32, maxLife: 0.32, shockwave: true, color: "#ffb64f" });
          if (dist < 145) hitPlayer(24 * getDifficultyStats().damage);
          const proximity = clamp(1 - Math.hypot(player.x - enemy.x, player.y - enemy.y) / 260, 0, 1);
          triggerScreenShake(3 + proximity * 9, 0.28 + proximity * 0.18, enemy.x, enemy.y);
          continue;
        }
      }
    }
    if (enemy.type === "runner") {
      enemy.meleeCooldown = Math.max(0, enemy.meleeCooldown - dt);
      if (dist < 48 && enemy.meleeCooldown === 0) {
        enemy.meleeCooldown = 1.15;
        enemy.knifeSwing = 0.22;
        spawnParticles((enemy.x + player.x) / 2, (enemy.y + player.y) / 2, "#ff7268", 5);
        hitPlayer(12 * getDifficultyStats().damage);
      }
    }
    const firingRange = enemy.type === "gunner" ? 620 : enemy.isBoss ? 700 : 560;
    const firingDistance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (enemy.fireCooldown <= 0 && canFire && firingDistance < firingRange && enemy.signatureTimer === 0 && !signatureResolved) {
      shootEnemy(enemy);
      enemy.skillTimer = 0.22;
      enemy.skillKind = "fire";
      enemy.fireCooldown = (enemy.isBoss ? enemy.phaseThree ? 0.9 : enemy.phaseTwo ? 1.05 : 1.55 : enemy.type === "gunner" ? 1.9 : enemy.type === "teleporter" ? 2.2 : 2.8) / (getDifficultyStats().fireRate * Math.min(state.threatScale, 1.6)) * (enemy.isBoss && isHardTowerWarden() ? 1.18 : 1);
      if (enemy.isBoss && enemy.phaseTwo && !enemy.phaseThree) enemy.attackPattern = enemy.attackPattern === "fan" ? "aimed" : "fan";
    }

    if (state.mode === "survival") {
    }
  }

  if (state.mode === "tutorial") return;
  if (alive === 0 && !state.gameOver && !state.levelCleared) {
    state.levelCleared = true;
    if (!state.floorTookDamage) unlockAchievement("untouchable");
    showFloorNotification("ending", 2);
    clearHeldInput();
    setStatus(`Sector ${state.floor} cleared!`);
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    if (p.shockwave) p.radius += 520 * dt;
    else { p.x += p.vx * dt; p.y += p.vy * dt; }
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function updateStars(dt) {
  for (const star of state.stars) {
    star.y += star.speed * dt;
    if (star.y > HEIGHT) {
      star.y = -10;
      star.x = Math.random() * WIDTH;
    }
  }
}

function update(dt) {
  if (state.screen !== "playing" || state.paused) return;
  const realDt = dt;
  if (state.slowMo > 0) { state.slowMo = Math.max(0, state.slowMo - realDt); dt *= 0.3; }

  if (state.gameOver) {
    updateParticles(dt);
    updateStars(dt);
    return;
  }

  state.runTime += dt;
  updateDailyChallenge("survive", dt);
  if (state.runTime >= 300) unlockAchievement("survivor");
  if (state.survivalEvent) {
    state.eventTimer -= realDt;
    if (state.eventTimer <= 0) {
      state.score += 300;
      const completedEvent = state.survivalEvent;
      setStatus(`${completedEvent} SURVIVED  ▸  +300 SCORE`);
      state.survivalEvent = null;
      state.lastStandActive = false;
    }
  }
  if (state.floorTransition > 0) {
    state.floorTransition = Math.max(0, state.floorTransition - realDt);
    if (state.floorTransition === 0 && state.levelCleared && !state.gameOver) {
      nextFloor();
      return;
    }
    if (state.floorTransition === 0) {
      document.getElementById("floorClearPanel").classList.add("hidden");
    }
    updateHud();
    return;
  }
  state.threatScale = state.mode === "survival" ? 1 : Math.min(1.55, 1 + state.runTime / 300);
  state.streakTimer = Math.max(0, state.streakTimer - realDt);
  if (state.streakTimer === 0) state.killStreak = 0;
  state.announcement = Math.max(0, state.announcement - dt);
  state.time += dt;
  updateArenaModifier(dt);
  updateRocketPickup(dt);
  updateWeaponPickup(dt);
  updateHealPickup(dt);
  updateStars(dt);
  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateBombardment(dt);
  updateParticles(dt);
  if (state.mode === "survival" && state.runTime > 0 && Math.floor(state.runTime / 60) > state.wave - 1) {
    state.wave = Math.floor(state.runTime / 60) + 1;
    state.score += state.wave * 50;
    state.announcement = 2.5;
    setStatus(`SURVIVAL MILESTONE  ▸  ${getSurvivalThreatLabel()} THREAT  ▸  +${state.wave * 50} SCORE`);
    if (state.enemies.length > 0) for (let i = 0; i < Math.min(2, state.wave); i += 1) state.enemies.push(createEnemy("runner"));
    if (state.wave % 4 === 0) triggerSurvivalEvent();
  }

  updateHud();
}

function updateArenaModifier(dt) {
  if (!state.arenaModifier) return;
  if (state.arenaModifier.id === "surge") {
    if (state.surgeWarning > 0) {
      state.surgeWarning -= dt;
      if (state.surgeWarning <= 0) {
        state.surgeActive = 3.5;
        setStatus("THREAT SURGE  ▸  HOSTILE FIRE RATE INCREASED");
      }
    } else if (state.surgeActive > 0) {
      state.surgeActive = Math.max(0, state.surgeActive - dt);
      if (state.surgeActive === 0) state.arenaTimer = 7;
    } else {
      state.arenaTimer -= dt;
      if (state.arenaTimer <= 0) {
        state.surgeWarning = 1.4;
        setStatus("THREAT SURGE INCOMING  ▸  REPOSITION");
      }
    }
    return;
  }
  if (state.arenaModifier.id === "crossfire") {
    if (state.laneWarning > 0) {
      state.laneWarning -= dt;
      if (state.laneWarning <= 0) {
        for (let offset = -2; offset <= 2; offset += 1) {
          const y = clamp(state.laneY + offset * 34, 30, HEIGHT - 30);
          state.enemyBullets.push({
            x: state.laneDirection > 0 ? -12 : WIDTH + 12,
            y,
            vx: state.laneDirection * 285,
            vy: 0,
            radius: 7,
            damage: 9 * getDifficultyStats().damage,
            team: "enemy",
          });
        }
        state.arenaTimer = 6.5;
      }
    } else {
      state.arenaTimer -= dt;
      if (state.arenaTimer <= 0) {
        state.laneY = rand(95, HEIGHT - 95);
        state.laneDirection = Math.random() < 0.5 ? 1 : -1;
        state.laneWarning = 1.25;
        setStatus("CROSS-LANE VOLLEY  ▸  EVADE THE MARKED SECTOR");
      }
    }
    return;
  }
  if (state.arenaModifier.id === "blackout") {
    if (state.blackoutActive > 0) state.blackoutActive = Math.max(0, state.blackoutActive - dt);
    else {
      state.arenaTimer -= dt;
      if (state.arenaTimer <= 0) {
        state.blackoutActive = 4;
        state.arenaTimer = 8;
        setStatus("BLACKOUT  ▸  VISIBILITY REDUCED");
      }
    }
    return;
  }
  if (state.arenaModifier.id !== "reactor" && state.arenaModifier.id !== "hazard") return;
  if (state.hazardWarning > 0) {
    state.hazardWarning -= dt;
    if (state.hazardWarning <= 0) {
      state.hazardActive = 0.7;
      triggerScreenShake(5, 0.24, state.hazardX, state.hazardY);
      if (Math.hypot(player.x - state.hazardX, player.y - state.hazardY) < 95) hitPlayer(18);
    }
  } else if (state.hazardActive > 0) {
    state.hazardActive -= dt;
    if (state.hazardActive <= 0) state.hazardCooldown = 8;
  } else {
    state.hazardCooldown -= dt;
    if (state.hazardCooldown <= 0) {
      state.hazardX = rand(150, WIDTH - 150);
      state.hazardY = rand(130, HEIGHT - 120);
      state.hazardWarning = 1.5;
      setStatus(`${state.arenaModifier.title}  ▸  DANGER ZONE MARKED`);
    }
  }
}

function updateBombardment(dt) {
  if (state.mode !== "tutorial" && state.floor >= 3 && !state.gameOver && !state.levelCleared) {
    state.bombTimer -= dt;
    if (state.bombTimer <= 0) {
      const bombCount = Math.min(3, 1 + Math.floor((state.floor - 3) / 3));
      for (let i = 0; i < bombCount; i += 1) {
        state.bombZones.push({
          x: rand(130, WIDTH - 130),
          y: rand(100, HEIGHT - 100),
          warning: 1.6,
          warningDuration: 1.6,
          active: 0,
          radius: Math.min(112, 88 + state.floor * 2),
        });
      }
      state.bombTimer = Math.max(4.5, 12 - (state.floor - 3) * 0.7);
      setStatus(`INCOMING BOMBARDMENT  ▸  ${bombCount} IMPACT ZONE${bombCount > 1 ? "S" : ""} MARKED`);
    }
  }

  for (let i = state.bombZones.length - 1; i >= 0; i -= 1) {
    const zone = state.bombZones[i];
    if (zone.warning > 0) {
      zone.warning = Math.max(0, zone.warning - dt);
      if (zone.warning === 0) {
        zone.active = 0.42;
        if (Math.hypot(player.x - zone.x, player.y - zone.y) < zone.radius) {
          hitPlayer(zone.damage ?? 16 * getDifficultyStats().damage);
        }
        const distanceToPlayer = Math.hypot(player.x - zone.x, player.y - zone.y);
        const proximity = clamp(1 - distanceToPlayer / 560, 0, 1);
        triggerScreenShake(4 + proximity * 13, 0.36 + proximity * 0.24, zone.x, zone.y);
        spawnParticles(zone.x, zone.y, "#ff7047", 24);
        state.particles.push({ x: zone.x, y: zone.y, radius: 12, life: 0.38, maxLife: 0.38, shockwave: true, color: "#ff7047" });
      }
    } else if (zone.active > 0) {
      zone.active = Math.max(0, zone.active - dt);
    } else {
      state.bombZones.splice(i, 1);
    }
  }
}

function drawPlayer() {
  if (player.dashFlash > 0) { ctx.save(); ctx.globalAlpha = player.dashFlash / 0.24 * 0.55; ctx.translate(player.x - player.vx * 0.035, player.y - player.vy * 0.035); ctx.strokeStyle = "#ff6559"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -18, 12, 0, Math.PI * 2); ctx.moveTo(0, -6); ctx.lineTo(0, 18); ctx.moveTo(0, 18); ctx.lineTo(-8, 34); ctx.moveTo(0, 18); ctx.lineTo(8, 34); ctx.stroke(); ctx.restore(); }
  ctx.save();
  const moveAmount = Math.min(1, Math.hypot(player.vx, player.vy) / 150);
  const gait = state.time * 13;
  const stride = Math.sin(gait) * moveAmount * 8;
  const bob = Math.abs(Math.sin(gait)) * moveAmount * 2.5 + Math.sin(state.time * 3.2) * 1.2;
  const bodyLean = clamp(player.vx / Math.max(1, player.speed) * 0.12, -0.12, 0.12);
  ctx.translate(player.x, player.y + bob);

  if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  ctx.rotate(bodyLean);
  ctx.strokeStyle = player.hitFlash > 0 ? "#ffffff" : operatorStyle.color;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(0, -18 + Math.sin(gait * 2) * moveAmount, 12, 0, Math.PI * 2);
  ctx.stroke();
  if (operatorStyle.accessory === "visor") { ctx.fillStyle = "#66f4ff"; ctx.fillRect(-9, -21, 18, 4); }
  if (operatorStyle.accessory === "crown") { ctx.beginPath(); ctx.moveTo(-8, -30); ctx.lineTo(-8, -36); ctx.lineTo(-3, -32); ctx.lineTo(0, -39); ctx.lineTo(3, -32); ctx.lineTo(8, -36); ctx.lineTo(8, -30); ctx.closePath(); ctx.fillStyle = "#ffd45d"; ctx.fill(); }
  if (operatorStyle.accessory === "bandana") { ctx.fillStyle = "#ff6464"; ctx.fillRect(-10, -28, 20, 5); ctx.fillRect(8, -27, 7, 3); }
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 18);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(-8 + stride, 34);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(8 - stride, 34);
  ctx.stroke();

  ctx.save();
  ctx.rotate(player.angle - bodyLean);
  const masteryCount = getWeaponMastery()[state.weapon] || 0;
  const masteryGoal = { pistol: 100, rifle: 250, smg: 300, heavy: 75 }[state.weapon];
  const masteryColor = masteryCount >= masteryGoal * 2 ? "#ff675c" : masteryCount >= masteryGoal ? "#ffb266" : "#7ee5ff";
  ctx.strokeStyle = operatorStyle.gunColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(32 - player.recoil, 2);
  ctx.stroke();
  if (masteryCount >= masteryGoal) {
    ctx.strokeStyle = masteryColor;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(17, -1);
    ctx.lineTo(27, -1);
    ctx.stroke();
  }

  if (player.gunFlash > 0) {
    ctx.strokeStyle = "#fff3a3";
    ctx.beginPath();
    ctx.moveTo(30, 2);
    ctx.lineTo(42, 2);
    ctx.stroke();
  }

  ctx.strokeStyle = player.hitFlash > 0 ? "#ffffff" : operatorStyle.color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(8, -5);
  ctx.lineTo(17, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(9, 8);
  ctx.lineTo(17, 3);
  ctx.stroke();

  ctx.fillStyle = player.hitFlash > 0 ? "#ffffff" : operatorStyle.color;
  ctx.beginPath();
  ctx.arc(17, 0, 3, 0, Math.PI * 2);
  ctx.arc(17, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
  ctx.save();
  if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) ctx.globalAlpha = 0.4;
  ctx.fillStyle = operatorStyle.color;
  ctx.font = "700 10px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(operatorStyle.name, player.x, player.y + bob - 43);
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  const movement = Math.min(1, Math.hypot(enemy.vx, enemy.vy) / 120);
  const gait = state.time * (enemy.type === "runner" ? 20 : 14) + enemy.x * 0.08;
  const stride = Math.sin(gait) * movement * (enemy.isBoss ? 8 : 6);
  const leadFootLift = Math.max(0, Math.cos(gait)) * movement * 3;
  const trailFootLift = Math.max(0, Math.cos(gait + Math.PI)) * movement * 3;
  const facing = enemy.vx < -8 ? -1 : enemy.vx > 8 ? 1 : Math.sign(Math.cos(enemy.angle)) || 1;
  const bob = Math.abs(Math.sin(gait)) * movement * (enemy.isBoss ? 2.5 : 1.8);
  ctx.translate(enemy.x, enemy.y + Math.sin(state.time * 3 + enemy.x) * movement - bob);
  if (enemy.signatureTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(state.time * 28) * 0.2;
    ctx.strokeStyle = enemy.type === "gunner" ? "#ffe38c" : enemy.type === "armored" ? "#c5a6ff" : enemy.type === "grunt" ? "#ff7268" : "#80b6ff";
    ctx.lineWidth = enemy.type === "gunner" ? 2 : enemy.type === "armored" ? 3 : 5;
    if (enemy.type === "armored") {
      ctx.beginPath();
      ctx.arc(0, 0, 132, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.rotate(enemy.signatureAngle);
      ctx.setLineDash(enemy.type === "gunner" ? [10, 8] : []);
      ctx.beginPath();
      ctx.moveTo(10, enemy.type === "shieldbearer" ? 22 : 0);
      ctx.lineTo(enemy.type === "gunner" ? 700 : enemy.type === "grunt" ? 185 : 104, enemy.type === "shieldbearer" ? 22 : 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (enemy.rushTimer > 0) {
    ctx.save();
    ctx.rotate(enemy.signatureAngle);
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = enemy.type === "grunt" ? "#ff7268" : "#80b6ff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-10, 22);
    ctx.lineTo(62, 22);
    ctx.stroke();
    ctx.restore();
  }
  if (enemy.skillTimer > 0) {
    const duration = enemy.skillKind === "summon" ? 0.9 : enemy.skillKind === "heal" ? 0.85 : enemy.skillKind === "explode" ? 0.65 : enemy.skillKind === "teleport" || enemy.skillKind === "rush" ? 0.55 : enemy.skillKind === "charged" ? 0.38 : enemy.skillKind === "slam" ? 0.55 : 0.38;
    const progress = 1 - enemy.skillTimer / duration;
    const skillColor = enemy.skillKind === "heal" ? "#78f0a0"
      : enemy.skillKind === "explode" ? "#ff7c3d"
      : enemy.skillKind === "summon" ? "#7be5ff"
        : enemy.skillKind === "slam" ? "#c5a6ff"
        : enemy.skillKind === "teleport" ? "#d49aff"
          : enemy.skillKind === "rush" ? "#80b6ff" : enemy.skillKind === "lunge" ? "#ff7268" : "#ffad67";
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress) * 0.85;
    ctx.strokeStyle = skillColor;
    ctx.lineWidth = enemy.skillKind === "fire" ? 3 : 2;
    if (enemy.skillKind === "heal") {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(enemy.skillTargetX - enemy.x, enemy.skillTargetY - enemy.y);
      ctx.stroke();
    }
    const ringCount = enemy.skillKind === "summon" || enemy.skillKind === "heal" ? 3 : 1;
    for (let i = 0; i < ringCount; i += 1) {
      const ringProgress = (progress + i / ringCount) % 1;
      ctx.globalAlpha = Math.max(0, 1 - ringProgress) * 0.8;
      ctx.beginPath();
      const maxRadius = enemy.skillKind === "heal" ? 260 : enemy.skillKind === "summon" ? 88 : enemy.skillKind === "explode" ? 105 : enemy.skillKind === "slam" ? 132 : 46;
      ctx.arc(0, 0, 14 + ringProgress * maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.skillKind === "fire") {
      ctx.globalAlpha = 0.8;
      ctx.rotate(enemy.angle);
      ctx.beginPath();
      ctx.moveTo(12, 1);
      ctx.lineTo(30 + progress * 16, 1);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (enemy.isBoss && enemy.phaseChangeTimer > 0) {
    const progress = 1 - enemy.phaseChangeTimer / (enemy.phaseThree ? 1.8 : 1.4);
    const pulseRadius = 38 + progress * 125;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.85;
    ctx.strokeStyle = enemy.phaseThree ? "#ff4b55" : "#ff9a58";
    ctx.lineWidth = 5 * (1 - progress) + 1;
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (enemy.isBoss && enemy.bossSkillTimer > 0) {
    const profile = getWardenDifficultyProfile();
    const duration = enemy.bossSkillKind === "nova" ? profile.novaWarning : profile.barrageCharge;
    const progress = 1 - enemy.bossSkillTimer / duration;
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(state.time * 26) * 0.2;
    ctx.strokeStyle = enemy.bossSkillKind === "nova" ? "#ffb266" : "#ff5368";
    ctx.lineWidth = 3;
    if (enemy.bossSkillKind === "nova") {
      ctx.beginPath();
      ctx.arc(0, 0, 48 + progress * 82, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const targetX = enemy.bossSkillTargetX - enemy.x;
      const targetY = enemy.bossSkillTargetY - enemy.y;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(targetX, targetY, 30 + progress * 50, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (enemy.attackTell) { ctx.save(); ctx.globalAlpha = 0.28 + Math.sin(state.time * 24) * 0.12; ctx.strokeStyle = "#ff5d58"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, enemy.isBoss ? 58 : 38, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (enemy.shielded) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(state.time * 7 + enemy.x) * 0.12;
    ctx.strokeStyle = "#7be5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (enemy.type === "shieldbearer") {
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(state.time * 5 + enemy.x) * 0.08;
    ctx.strokeStyle = "#80b6ff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 42, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.stroke();
    ctx.restore();
  }
  if (enemy.attackTell && enemy.isBoss && enemy.phaseThree) {
    ctx.save();
    ctx.globalAlpha = 0.48 + Math.sin(state.time * 28) * 0.18;
    ctx.strokeStyle = "#ff6258";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(enemy.angle) * 640, Math.sin(enemy.angle) * 640);
    ctx.stroke();
    ctx.restore();
  }

  const enemyColor = enemy.hitFlash > 0 ? "#ffffff"
    : enemy.isBoss && enemy.phaseThree ? "#ff6258"
      : enemy.isBoss && enemy.phaseTwo ? "#ff9a58" : enemy.color;
  const bodyLean = clamp(enemy.vx / Math.max(1, enemy.speed) * 0.1, -0.1, 0.1);
  ctx.save();
  ctx.rotate(bodyLean);
  ctx.strokeStyle = enemyColor;
  ctx.lineWidth = enemy.type === "armored" ? 6 : 4;

  ctx.beginPath();
  ctx.arc(0, -18, enemy.isBoss ? 18 : enemy.type === "armored" ? 13 : 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 18);
  ctx.stroke();
  if (enemy.type === "armored") { ctx.strokeRect(-14, -8, 28, 30); }
  if (enemy.type === "exploder") { ctx.beginPath(); ctx.arc(0, 5, 17 + Math.sin(state.time * 8) * 2, 0, Math.PI * 2); ctx.stroke(); }

  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(-5 + stride * 0.55, 25);
  ctx.lineTo(-8 + stride, 32 - leadFootLift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(5 - stride * 0.55, 25);
  ctx.lineTo(8 - stride, 32 - trailFootLift);
  ctx.stroke();

  ctx.save();
  ctx.rotate(enemy.angle - bodyLean);
  if (enemy.type === "runner") {
    const swingProgress = enemy.knifeSwing > 0 ? 1 - enemy.knifeSwing / 0.22 : 0;
    const swingAngle = enemy.knifeSwing > 0 ? Math.sin(swingProgress * Math.PI) * 0.9 : 0;
    ctx.save();
    ctx.rotate(swingAngle);
    ctx.strokeStyle = enemyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(9, 3);
    ctx.lineTo(23, 1);
    ctx.stroke();
    ctx.strokeStyle = "#3b2026";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(23, 1);
    ctx.lineTo(29, -1);
    ctx.stroke();
    ctx.strokeStyle = "#e8edf3";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(28, -1);
    ctx.lineTo(41, -7);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = enemyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(27, 2);
    ctx.stroke();
  }

  ctx.strokeStyle = enemyColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(7, -5);
  ctx.lineTo(15, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(8, 8);
  ctx.lineTo(15, 3);
  ctx.stroke();

  ctx.fillStyle = enemyColor;
  ctx.beginPath();
  ctx.arc(15, 0, 3, 0, Math.PI * 2);
  ctx.arc(15, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  const healthRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const healthBarWidth = enemy.isBoss ? 150 : 30;
  const healthBarHeight = enemy.isBoss ? 7 : 4;
  const healthBarY = enemy.isBoss ? -47 : -38;
  ctx.fillStyle = "rgba(8, 10, 15, 0.9)";
  ctx.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
  ctx.fillStyle = healthRatio > 0.5 ? "#80f0a0" : healthRatio > 0.25 ? "#ffc857" : "#ff526b";
  ctx.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
  ctx.strokeStyle = enemy.isBoss ? "#ffb38a" : "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
  if (enemy.isBoss) {
    ctx.fillStyle = enemy.phaseThree ? "#ff5d58" : enemy.phaseTwo ? "#ff9866" : "#ffe0d7";
    ctx.font = "700 8px Orbitron, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(enemy.phaseThree ? "WARDEN  ▸  PHASE III" : enemy.phaseTwo ? "WARDEN  ▸  PHASE II" : "WARDEN  ▸  PHASE I", 0, healthBarY - 5);
  }

  ctx.restore();
}

function drawBullet(bullet) {
  if (bullet.rocket) {
    ctx.fillStyle = bullet.team === "player" ? "#ffb266" : "#ff6b57";
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y - bullet.radius * 1.4);
    ctx.lineTo(bullet.x + bullet.radius * 0.8, bullet.y);
    ctx.lineTo(bullet.x, bullet.y + bullet.radius * 1.4);
    ctx.lineTo(bullet.x - bullet.radius * 0.8, bullet.y);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillStyle = bullet.team === "player" ? "#8de7ff" : bullet.charged ? "#ffe38c" : bullet.bossNova ? "#ff956d" : "#ff8f82";
  ctx.save();
  ctx.strokeStyle = bullet.team === "player" ? "rgba(141,231,255,.55)" : bullet.charged ? "rgba(255,227,140,.8)" : bullet.bossNova ? "rgba(255,149,109,.8)" : "rgba(255,143,130,.5)";
  ctx.lineWidth = bullet.charged ? bullet.radius * 1.8 : bullet.radius;
  ctx.beginPath(); ctx.moveTo(bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025); ctx.lineTo(bullet.x, bullet.y); ctx.stroke();
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRocketPickup() {
  if (!state.rocketPickup || !state.rocketPickup.active) return;

  const pulse = 1 + Math.sin(state.time * 6 + state.rocketPickup.pulse) * 0.18;
  ctx.save();
  ctx.translate(state.rocketPickup.x, state.rocketPickup.y);
  ctx.translate(0, Math.sin(state.time * 3 + state.rocketPickup.pulse) * 4);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "#ffd58d";
  ctx.fillStyle = "rgba(255, 190, 95, 0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, state.rocketPickup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff0b3";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHealPickup() {
  if (!state.healPickup) return;

  const pulse = 1 + Math.sin(state.time * 6 + state.healPickup.pulse) * 0.14;
  ctx.save();
  ctx.translate(state.healPickup.x, state.healPickup.y);
  ctx.translate(0, Math.sin(state.time * 3 + state.healPickup.pulse) * 4);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(90, 230, 140, 0.2)";
  ctx.strokeStyle = "#80f0a0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, state.healPickup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d8ffe0";
  ctx.fillRect(-3, -8, 6, 16);
  ctx.fillRect(-8, -3, 16, 6);
  ctx.restore();
}

function drawWeaponPickup() {
  const pickup = state.weaponPickup;
  if (!pickup) return;

  const pulse = 1 + Math.sin(state.time * 6 + pickup.pulse) * 0.12;
  ctx.save();
  ctx.translate(pickup.x, pickup.y);
  ctx.translate(0, Math.sin(state.time * 3 + pickup.pulse) * 4);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(88, 202, 255, 0.22)";
  ctx.strokeStyle = "#83e7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "#e5fbff";
  ctx.fillRect(-9, -3, 18, 6);
  ctx.fillRect(4, -6, 6, 12);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#d7f8ff";
  ctx.font = "700 11px Orbitron, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(weaponStats[pickup.weapon].label.toUpperCase(), pickup.x, pickup.y + 34);
  ctx.restore();
}

function drawStars() {
  for (const star of state.stars) {
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.shockwave) { ctx.strokeStyle = p.color; ctx.lineWidth = 5 * alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); continue; }
    if (p.text) { ctx.fillStyle = p.color; ctx.font = "700 13px Orbitron, Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.text, p.x, p.y); ctx.restore(); continue; }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

function drawHudBars() {
  const canvasRect = canvas.getBoundingClientRect();
  const topbarRect = document.getElementById("topbar").getBoundingClientRect();
  const scaleX = WIDTH / Math.max(1, canvasRect.width);
  const scaleY = HEIGHT / Math.max(1, canvasRect.height);
  // Anchor the canvas HUD to the real topbar so it stays just below the
  // floor / mission panel at every shell size and responsive breakpoint.
  const panelX = clamp((topbarRect.left - canvasRect.left + 8) * scaleX, 8, WIDTH - 478);
  const panelY = clamp((topbarRect.bottom - canvasRect.top + 8) * scaleY, 8, HEIGHT - 140);
  const panelWidth = 470;
  const panelHeight = 68;
  const barX = panelX + 12;
  const barY = panelY + 39;
  const barWidth = 204;
  const barHeight = 16;
  const healthRatio = clamp(player.hp / player.maxHp, 0, 1);
  const healthColor = healthRatio <= 0.25 ? "#ff526b" : healthRatio <= 0.5 ? "#ffc857" : "#51e5d0";

  ctx.save();
  ctx.shadowColor = "rgba(70, 200, 255, 0.22)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(5, 13, 27, 0.88)";
  ctx.strokeStyle = "rgba(106, 212, 255, 0.62)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.fillStyle = "rgba(118, 220, 255, 0.85)";
  ctx.fillRect(panelX + 12, panelY + 10, 3, 18);
  ctx.font = "600 11px Orbitron, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(196, 225, 242, 0.78)";
  ctx.fillText("VITALS", panelX + 22, panelY + 19);
  ctx.textAlign = "right";
  ctx.fillStyle = "#f1fbff";
  ctx.font = "600 13px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(`${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp} HP`, barX + barWidth, panelY + 25);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(1, 7, 16, 0.92)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 5);
  ctx.fill();

  if (healthRatio > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * healthRatio, barHeight, 5);
    ctx.clip();
    const healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    healthGradient.addColorStop(0, healthColor);
    healthGradient.addColorStop(1, healthRatio <= 0.25 ? "#b9254f" : healthRatio <= 0.5 ? "#e47b43" : "#168fae");
    ctx.fillStyle = healthGradient;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    for (let segment = 1; segment < 10; segment += 1) {
      const tickX = barX + (barWidth / 10) * segment;
      ctx.fillRect(tickX, barY, 2, barHeight);
    }
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(181, 225, 244, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + 232, panelY + 12);
  ctx.lineTo(panelX + 232, panelY + panelHeight - 12);
  ctx.stroke();

  ctx.fillStyle = "rgba(131, 231, 255, 0.78)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("RIFLE", panelX + 246, panelY + 25);
  ctx.fillStyle = "#b8f2ff";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.rifle), panelX + 246, panelY + 51);

  ctx.fillStyle = "rgba(255, 213, 133, 0.72)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("ROCKET", panelX + 290, panelY + 25);
  ctx.fillStyle = "#ffe2a5";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(player.rocketCount), panelX + 290, panelY + 51);

  ctx.fillStyle = "rgba(141, 231, 255, 0.78)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("SMG", panelX + 334, panelY + 25);
  ctx.fillStyle = "#b8f2ff";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.smg), panelX + 334, panelY + 51);

  ctx.fillStyle = "rgba(255, 179, 138, 0.82)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("HEAVY", panelX + 378, panelY + 25);
  ctx.fillStyle = "#ffd0b8";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.heavy), panelX + 378, panelY + 51);

  ctx.fillStyle = "rgba(196, 166, 255, 0.82)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("BURST", panelX + 422, panelY + 25);
  ctx.fillStyle = "#dfcaff";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.burst), panelX + 422, panelY + 51);

  const scoreBoxX = WIDTH - 244;
  const scoreBoxY = panelY;
  const scoreBoxWidth = 226;
  const blackout = state.arenaModifier?.id === "blackout";
  const scoreBoxHeight = blackout ? 126 : 94;
  ctx.shadowColor = blackout ? "#ffbd46" : "rgba(255,74,57,.24)";
  ctx.shadowBlur = blackout ? 18 : 10;
  ctx.fillStyle = "rgba(13, 9, 13, 0.94)";
  ctx.strokeStyle = blackout ? "#ffc857" : "rgba(255,100,86,.58)";
  ctx.lineWidth = blackout ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 9);
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffb1a8";
  ctx.font = "700 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("SCORE", scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 17);
  ctx.fillStyle = "#fff";
  ctx.font = "800 20px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.score).padStart(6, "0"), scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 41);
  ctx.strokeStyle = "#ffffff24"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(scoreBoxX + 14, scoreBoxY + 50); ctx.lineTo(scoreBoxX + scoreBoxWidth - 14, scoreBoxY + 50); ctx.stroke();
  ctx.fillStyle = "#d3d8df";
  ctx.font = "600 8px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("RUN TIME", scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 64);
  ctx.fillStyle = "#fff2bc";
  ctx.font = "700 16px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(formatTime(state.runTime), scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 84);
  ctx.fillStyle = "#ffe2a5";
  ctx.font = "600 8px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(`${state.killStreak > 1 ? `${state.killStreak}X COMBO` : "COMBAT READY"}`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 92);
  if (blackout) {
    const lightTimer = state.blackoutActive > 0
      ? `LIGHT RETURNS IN 0:${String(Math.ceil(state.blackoutActive)).padStart(2, "0")}`
      : `BLACKOUT IN 0:${String(Math.ceil(state.arenaTimer)).padStart(2, "0")}`;
    const pulse = 0.75 + (Math.sin(state.time * 8) + 1) * 0.12;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ffd15a";
    ctx.beginPath(); ctx.roundRect(scoreBoxX + 10, scoreBoxY + 99, scoreBoxWidth - 20, 20, 4); ctx.fill();
    ctx.fillStyle = "#211405";
    ctx.font = "900 9px Orbitron, Segoe UI, sans-serif";
    ctx.fillText(`⚠ ${lightTimer}`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 113);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = "left";
  ctx.textAlign = "left";
  ctx.restore();
}

function drawDamageIndicator() {
  if (state.damageIndicator <= 0) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(state.damageDirection);
  ctx.globalAlpha = state.damageIndicator / 0.55;
  ctx.fillStyle = "#ff5d58";
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(49, -9);
  ctx.lineTo(49, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBanner(title, subtitle) {
  const boxWidth = WIDTH * 0.44;
  const boxHeight = HEIGHT * 0.2;
  const boxX = (WIDTH - boxWidth) / 2;
  const boxY = (HEIGHT - boxHeight) / 2;

  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 20, 0.72)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeStyle = "rgba(255, 120, 120, 0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  ctx.shadowColor = "rgba(255, 120, 120, 0.8)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fff0f0";
  ctx.font = "700 46px Orbitron, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 10);

  ctx.shadowColor = "rgba(147, 198, 255, 0.8)";
  ctx.shadowBlur = 14;
  ctx.font = "500 22px Orbitron, Segoe UI, sans-serif";
  ctx.fillStyle = "#dfeeff";
  ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 30);
  ctx.restore();

  ctx.textAlign = "left";
}

function drawArenaBackground() {
  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, "#11111a");
  background.addColorStop(0.56, "#1d1117");
  background.addColorStop(1, "#090b10");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawFloatingStones() {
  for (const stone of state.stones) {
    const bob = Math.sin(state.time * 1.7 + stone.phase) * 5;
    const rotation = Math.sin(state.time * 0.55 + stone.phase) * 0.08;
    ctx.save();
    ctx.translate(stone.x, stone.y + bob);
    ctx.rotate(rotation);
    ctx.shadowColor = "rgba(137, 169, 196, 0.38)";
    ctx.shadowBlur = 15;
    const rock = ctx.createLinearGradient(-stone.radius, -stone.radius, stone.radius, stone.radius);
    rock.addColorStop(0, "#8997a5");
    rock.addColorStop(0.48, "#4b5662");
    rock.addColorStop(1, "#252d37");
    ctx.fillStyle = rock;
    ctx.strokeStyle = "rgba(190, 211, 226, 0.62)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < stone.facets; i += 1) {
      const angle = (Math.PI * 2 * i) / stone.facets - Math.PI / 2;
      const unevenRadius = stone.radius * (0.78 + 0.22 * Math.sin(i * 12.3 + stone.phase));
      const x = Math.cos(angle) * unevenRadius;
      const y = Math.sin(angle) * unevenRadius * 0.82;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#d8e5ee";
    ctx.beginPath();
    ctx.ellipse(-stone.radius * 0.22, -stone.radius * 0.22, stone.radius * 0.3, stone.radius * 0.12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawArenaEffects() {
  for (const zone of state.bombZones) {
    ctx.save();
    const warning = zone.warning > 0;
    const pulse = 0.45 + Math.sin(state.time * 24) * 0.2;
    ctx.globalAlpha = warning ? pulse : 0.7;
    ctx.fillStyle = warning ? "#ff553522" : "#ff553566";
    ctx.strokeStyle = zone.fromBoss ? "#ff5368" : warning ? "#ffb14f" : "#ff5a43";
    ctx.lineWidth = warning ? 3 : 4;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (warning) {
      const progress = 1 - zone.warning / (zone.warningDuration || 1.6);
      ctx.strokeStyle = "#fff0c2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius * 0.72, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff0c2";
      ctx.font = "700 12px Orbitron, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(zone.fromBoss ? "WARDEN LOCK" : "IMPACT", zone.x, zone.y + 4);
    }
    ctx.restore();
  }
  if (state.arenaModifier?.id === "surge" && (state.surgeWarning > 0 || state.surgeActive > 0)) {
    const warning = state.surgeWarning > 0;
    ctx.save();
    ctx.globalAlpha = warning
      ? 0.25 + Math.sin(state.time * 22) * 0.2
      : 0.22 + Math.sin(state.time * 12) * 0.08;
    ctx.strokeStyle = warning ? "#ffd166" : "#ff5368";
    ctx.lineWidth = 7;
    ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);
    ctx.restore();
  }
  if (state.arenaModifier?.id === "crossfire" && state.laneWarning > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(state.time * 28) * 0.18;
    ctx.strokeStyle = "#ff5368";
    ctx.fillStyle = "#ff5368";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(0, state.laneY);
    ctx.lineTo(WIDTH, state.laneY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(state.laneDirection > 0 ? 16 : WIDTH - 16, state.laneY);
    ctx.lineTo(state.laneDirection > 0 ? 34 : WIDTH - 34, state.laneY - 8);
    ctx.lineTo(state.laneDirection > 0 ? 34 : WIDTH - 34, state.laneY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (state.hazardWarning > 0 || state.hazardActive > 0) {
    ctx.save();
    ctx.globalAlpha = state.hazardActive > 0 ? 0.45 : 0.32 + Math.sin(state.time * 22) * 0.12;
    ctx.strokeStyle = state.hazardActive > 0 ? "#ff4d43" : "#ffc857";
    ctx.fillStyle = state.hazardActive > 0 ? "#ff342a22" : "#ffc85712";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.hazardX, state.hazardY, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawMouseAimUI() {
  if (state.screen !== "playing" || settings.controlScheme !== "mouse" || !mouseAim) return;
  const { x, y } = mouseAim;
  const pulse = 1 + Math.sin(state.time * 8) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "rgba(6, 10, 15, 0.9)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.moveTo(-21, 0); ctx.lineTo(-9, 0);
  ctx.moveTo(9, 0); ctx.lineTo(21, 0);
  ctx.moveTo(0, -21); ctx.lineTo(0, -9);
  ctx.moveTo(0, 9); ctx.lineTo(0, 21);
  ctx.stroke();
  ctx.strokeStyle = "#9beeff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.moveTo(-21, 0); ctx.lineTo(-9, 0);
  ctx.moveTo(9, 0); ctx.lineTo(21, 0);
  ctx.moveTo(0, -21); ctx.lineTo(0, -9);
  ctx.moveTo(0, 9); ctx.lineTo(0, 21);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorld() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawArenaBackground();
  drawArenaEffects();
  drawStars();
  drawFloatingStones();

  for (const bullet of state.bullets) drawBullet(bullet);
  for (const bullet of state.enemyBullets) drawBullet(bullet);
  drawRocketPickup();
  drawHealPickup();
  drawWeaponPickup();

  for (const enemy of state.enemies) {
    if (enemy.alive) drawEnemy(enemy);
  }

  drawPlayer();
  drawDamageIndicator();
  drawParticles();
  if (state.arenaModifier?.id === "blackout" && state.blackoutActive > 0 && state.screen === "playing") {
    ctx.fillStyle = "rgba(2, 3, 6, 0.99)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const playerLight = ctx.createRadialGradient(player.x, player.y, 12, player.x, player.y, 158);
    playerLight.addColorStop(0, "rgba(255, 226, 190, 0.24)");
    playerLight.addColorStop(0.35, "rgba(255, 190, 145, 0.12)");
    playerLight.addColorStop(1, "rgba(255, 150, 120, 0)");
    ctx.fillStyle = playerLight;
    ctx.fillRect(player.x - 158, player.y - 158, 316, 316);
    for (const bullet of state.bullets) drawBullet(bullet);
    for (const bullet of state.enemyBullets) drawBullet(bullet);
    drawPlayer();
  }
  if (document.body.classList.contains("playing")) drawHudBars();

  if (state.gameOver && state.screen === "playing") {
    drawBanner("GAME OVER", "Press R to restart");
  } else if (state.paused && state.screen === "playing") {
    drawBanner("PAUSED", "Press P or Esc to resume");
  }
  drawMouseAimUI();
}

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.024);
  lastTime = timestamp;

  update(dt);
  drawWorld();
  if (state.screen === "playing") state.shakeTimer = Math.max(0, state.shakeTimer - dt);
  if (settings.shake && state.shakeTimer > 0 && state.screen === "playing" && document.body.classList.contains("playing")) {
    const decay = Math.pow(clamp(state.shakeTimer / Math.max(0.01, state.shakeDuration), 0, 1), 2);
    const amplitude = state.shakeStrength * decay;
    const jitterX = state.shakeBiasX * 0.55 + rand(-0.45, 0.45);
    const jitterY = state.shakeBiasY * 0.55 + rand(-0.45, 0.45);
    canvas.style.transform = `translate(${jitterX * amplitude}px, ${jitterY * amplitude}px)`;
  } else {
    canvas.style.transform = "";
    if (state.shakeTimer === 0) {
      state.shakeStrength = 0;
      state.shakeDuration = 0;
      state.shakeBiasX = 0;
      state.shakeBiasY = 0;
    }
  }
  requestAnimationFrame(loop);
}

// Menu and mission selection
const bestScoreStored = Number(storageGet("sgtTowerBestScore", "0")) || 0;
document.getElementById("bestScore").textContent = String(bestScoreStored).padStart(6, "0");
const bestClearTimeStored = Number(storageGet("sgtTowerBestClearTime"));
document.getElementById("bestClearTime").textContent = Number.isFinite(bestClearTimeStored) && bestClearTimeStored > 0
  ? formatTime(bestClearTimeStored)
  : "--:--.--";
document.getElementById("towerDifficultySelect").value = settings.difficulty;
document.getElementById("controlSchemeSelect").value = settings.controlScheme;
updateControlHints();

function updateLoadoutSummary() {
  const isSurvival = state.mode === "survival";
  loadoutPanel.classList.toggle("survival-mode", isSurvival);
  document.getElementById("survivalBrief").classList.toggle("hidden", !isSurvival || !document.getElementById("settingsRows").classList.contains("hidden"));
  const modeName = state.mode === "survival" ? "ENDLESS SURVIVAL"
    : state.mode === "tutorial" ? "TRAINING SIMULATION" : "SPACE CAMPAIGN";
  const difficulty = state.mode === "survival"
    ? " / STARTS EASY, ESCALATES EACH FLOOR"
    : state.mode === "tower" ? ` / ${settings.difficulty.toUpperCase()} THREAT` : "";
  document.getElementById("loadoutSummary").textContent = `${modeName}${difficulty}  ▸  WEAPONS IN FIELD`;
  const scoreKey = state.mode === "survival" ? "sgtSurvivalBestScore" : "sgtTowerBestScore";
  document.getElementById("bestScore").textContent = String(Number(storageGet(scoreKey, "0")) || 0).padStart(6, "0");
  document.getElementById("bestScoreLabel").textContent = state.mode === "survival" ? "SURVIVAL BEST" : "SPACE BEST";
  const leaderboardThreat = getLeaderboardThreat(state.mode);
  document.getElementById("missionLeaderboardTitle").textContent = `${getModeDisplayName()} ${leaderboardThreat.toUpperCase()} THREAT`;
  renderLeaderboard("missionLeaderboardList", state.mode, leaderboardThreat, 5);
}

document.getElementById("playButton").addEventListener("click", () => {
  closeMenuPanels();
  document.getElementById("settingsRows").classList.add("hidden");
  document.getElementById("operatorCustomize").classList.remove("hidden");
  document.getElementById("towerDifficultyRow").classList.toggle("hidden", state.mode !== "tower");
  document.getElementById("confirmDeploy").classList.remove("hidden");
  loadoutPanel.classList.remove("hidden");
  updateLoadoutSummary();
});
document.getElementById("settingsButton").addEventListener("click", () => {
  closeMenuPanels(); loadoutPanel.classList.remove("hidden");
  document.getElementById("settingsRows").classList.remove("hidden");
  document.getElementById("operatorCustomize").classList.add("hidden");
  document.getElementById("survivalBrief").classList.add("hidden");
  document.getElementById("towerDifficultyRow").classList.add("hidden");
  document.getElementById("confirmDeploy").classList.add("hidden");
});
document.getElementById("recordsButton").addEventListener("click", () => {
  closeMenuPanels();
  renderRecords();
  document.getElementById("recordsPanel").classList.remove("hidden");
});
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => {
  const panel = document.getElementById(button.dataset.close); panel.classList.add("hidden");
  if (panel === loadoutPanel) {
    document.getElementById("settingsRows").classList.add("hidden");
    document.getElementById("operatorCustomize").classList.add("hidden");
    document.getElementById("towerDifficultyRow").classList.toggle("hidden", state.mode !== "tower");
    document.getElementById("confirmDeploy").classList.remove("hidden");
  }
}));
document.getElementById("confirmDeploy").addEventListener("click", startMission);
document.getElementById("howToButton").addEventListener("click", () => helpPanel.classList.remove("hidden"));
document.getElementById("startTutorialButton").addEventListener("click", () => {
  state.mode = "tutorial";
  helpPanel.classList.add("hidden");
  startMission();
});
document.getElementById("tutorialPrevious").addEventListener("click", () => changeTutorialLesson(-1));
let tutorialConfirmAction = "finish";
function openTutorialConfirmation(action) {
  tutorialConfirmAction = action;
  const exiting = action === "exit";
  document.getElementById("tutorialConfirmEyebrow").textContent = exiting ? "LEAVE TRAINING" : "TRAINING COMPLETE";
  document.getElementById("tutorialFinishTitle").textContent = exiting ? "EXIT TUTORIAL?" : "END TUTORIAL?";
  document.getElementById("tutorialConfirmMessage").textContent = exiting
    ? "Are you sure you want to exit the tutorial?"
    : "Are you sure you want to finish the tutorial and choose your mission?";
  document.getElementById("tutorialFinishYes").textContent = exiting ? "YES. EXIT TUTORIAL" : "YES. LET'S DO THIS";
  document.getElementById("tutorialFinishNo").textContent = exiting ? "NO. KEEP LEARNING" : "NO. I WANT TO LEARN MORE";
  document.getElementById("tutorialFinishConfirm").classList.remove("hidden");
}
document.getElementById("tutorialNext").addEventListener("click", () => {
  if (state.tutorialLesson === tutorialLessons.length - 1) openTutorialConfirmation("finish");
  else changeTutorialLesson(1);
});
document.getElementById("tutorialFinishYes").addEventListener("click", () => {
  if (tutorialConfirmAction === "exit") {
    document.getElementById("tutorialFinishConfirm").classList.add("hidden");
    showMainMenu();
    return;
  }
  clearHeldInput();
  state.mode = "tower";
  state.screen = "menu";
  state.paused = false;
  document.body.classList.remove("playing");
  document.getElementById("tutorialPanel").classList.add("hidden");
  document.getElementById("tutorialFinishConfirm").classList.add("hidden");
  mainMenu.classList.remove("hidden");
  closeMenuPanels();
  document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item.dataset.mode === "tower"));
  document.getElementById("settingsRows").classList.add("hidden");
  document.getElementById("towerDifficultyRow").classList.remove("hidden");
  document.getElementById("confirmDeploy").classList.remove("hidden");
  loadoutPanel.classList.remove("hidden");
  updateLoadoutSummary();
});
document.getElementById("tutorialFinishNo").addEventListener("click", () => {
  document.getElementById("tutorialFinishConfirm").classList.add("hidden");
  if (tutorialConfirmAction === "finish") changeTutorialLesson(-1);
});
document.getElementById("tutorialExit").addEventListener("click", () => openTutorialConfirmation("exit"));
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item === button));
  document.getElementById("towerDifficultyRow").classList.toggle("hidden", state.mode !== "tower");
  updateLoadoutSummary();
}));
document.getElementById("towerDifficultySelect").addEventListener("change", event => {
  settings.difficulty = ["easy", "normal", "hard"].includes(event.target.value) ? event.target.value : "normal";
  storageSet("sgtTowerDifficulty", settings.difficulty);
  updateLoadoutSummary();
});
document.getElementById("controlSchemeSelect").addEventListener("change", event => {
  settings.controlScheme = ["mouse", "classic"].includes(event.target.value) ? event.target.value : "mouse";
  storageSet("sgtControlScheme", settings.controlScheme);
  clearHeldInput();
  updateControlHints();
  if (state.mode === "tutorial" && state.screen === "playing") renderTutorialLesson();
});
document.getElementById("soundToggle").addEventListener("change", event => { settings.sound = event.target.checked; storageSet("sgtSound", settings.sound); });
document.getElementById("shakeToggle").addEventListener("change", event => {
  settings.shake = event.target.checked;
  storageSet("sgtShake", settings.shake);
  if (!settings.shake) {
    state.shakeTimer = 0;
    state.shakeDuration = 0;
    state.shakeStrength = 0;
    state.shakeBiasX = 0;
    state.shakeBiasY = 0;
    canvas.style.transform = "";
  }
});
settings.sound = storageGet("sgtSound", "true") !== "false";
settings.shake = storageGet("sgtShake", "true") !== "false";
document.getElementById("soundToggle").checked = settings.sound;
document.getElementById("shakeToggle").checked = settings.shake;
const operatorNameInput = document.getElementById("operatorName");
const operatorAccessoryInput = document.getElementById("operatorAccessory");
const operatorColorInput = document.getElementById("operatorColor");
const operatorGunColorInput = document.getElementById("operatorGunColor");
const operatorPreview = document.getElementById("operatorPreview");
operatorNameInput.value = operatorStyle.name;
operatorAccessoryInput.value = ["none", "visor", "crown", "bandana"].includes(operatorStyle.accessory) ? operatorStyle.accessory : "none";
operatorColorInput.value = operatorStyle.color;
operatorGunColorInput.value = operatorStyle.gunColor;
function updateOperatorPreview() {
  operatorPreview.style.setProperty("--preview-suit", operatorStyle.color);
  operatorPreview.style.setProperty("--preview-gun", operatorStyle.gunColor);
  document.getElementById("operatorPreviewName").textContent = operatorStyle.name;
  document.getElementById("previewVisor").classList.toggle("hidden", operatorStyle.accessory !== "visor");
  document.getElementById("previewCrown").classList.toggle("hidden", operatorStyle.accessory !== "crown");
  document.getElementById("previewBandana").classList.toggle("hidden", operatorStyle.accessory !== "bandana");
}
updateOperatorPreview();
operatorNameInput.addEventListener("input", () => { operatorStyle.name = operatorNameInput.value.trim().slice(0, 14) || "OPERATOR"; storageSet("sgtOperatorName", operatorStyle.name); updateOperatorPreview(); });
operatorAccessoryInput.addEventListener("change", () => { operatorStyle.accessory = operatorAccessoryInput.value; storageSet("sgtOperatorAccessory", operatorStyle.accessory); updateOperatorPreview(); });
operatorColorInput.addEventListener("input", () => { operatorStyle.color = normalizeOperatorColor(operatorColorInput.value); storageSet("sgtOperatorColor", operatorStyle.color); updateOperatorPreview(); });
operatorGunColorInput.addEventListener("input", () => { operatorStyle.gunColor = normalizeOperatorColor(operatorGunColorInput.value); storageSet("sgtOperatorGunColor", operatorStyle.gunColor); updateOperatorPreview(); });
document.getElementById("resumeButton").addEventListener("click", togglePause);
document.getElementById("restartButton").addEventListener("click", startMission);
document.getElementById("retryButton").addEventListener("click", startMission);
document.getElementById("returnMenuButton").addEventListener("click", showMainMenu);
document.getElementById("resultMenuButton").addEventListener("click", showMainMenu);

window.addEventListener("blur", pauseForFocusLoss);

resetRun();
showMainMenu();
requestAnimationFrame(loop);

