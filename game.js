const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const floorLabel = document.getElementById("floorLabel");
const missionLabel = document.getElementById("missionLabel");
const timerLabel = document.getElementById("timerLabel");
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
};
const arenaModifiers = [
  { id: "reactor", title: "REACTOR SURGE", detail: "Energy bursts sweep across the arena." },
  { id: "lowGravity", title: "LOW GRAVITY", detail: "Movement and enemy drift are amplified." },
  { id: "hazard", title: "HAZARD ZONE", detail: "A marked area periodically becomes dangerous." },
  { id: "blackout", title: "BLACKOUT", detail: "Visibility briefly narrows around the operator." },
  { id: "overdrive", title: "WEAPON OVERDRIVE", detail: "All weapon cooldowns are reduced." },
  { id: "containment", title: "CONTAINMENT", detail: "Some hostiles deploy temporary shields." },
];
const floorConfigs = {
  1: { title: "MOVEMENT & BASIC HOSTILES", mix: ["runner", "runner", "grunt"], detail: "tutorial" },
  2: { title: "CROSS-FIRE", mix: ["runner", "gunner", "grunt"], detail: "crossfire" },
  3: { title: "ARMORED HOSTILES", mix: ["armored", "armored", "runner"], detail: "armor" },
  4: { title: "RANGED PRESSURE", mix: ["gunner", "gunner", "runner", "grunt"], detail: "ranged" },
  5: { title: "MIXED ASSAULT", mix: ["armored", "gunner", "exploder", "runner"], detail: "assault" },
  6: { title: "WARDEN // MID-TOWER BOSS", mix: ["boss"], detail: "boss" },
  7: { title: "HOSTILE REINFORCEMENTS", mix: ["armored", "gunner", "runner"], detail: "reinforcements" },
  8: { title: "EXPLOSIVE CROSS-FIRE", mix: ["gunner", "exploder", "armored", "runner"], detail: "crossfire" },
  9: { title: "ARMORED GAUNTLET", mix: ["armored", "gunner", "armored", "exploder"], detail: "gauntlet" },
  10: { title: "FINAL APPROACH", mix: ["gunner", "armored", "exploder", "runner"], detail: "final-approach" },
  11: { title: "WARDEN // FINAL ENCOUNTER", mix: ["gunner", "armored", "exploder"], detail: "boss" },
};
const tutorialLessons = [
  { title: "MOVEMENT & FLOATING", detail: "Move horizontally and control your height. Use the arena space to avoid incoming fire." },
  { title: "AIM & FIRE", detail: "Aim and fire your equipped weapon using your selected controls. Keep moving between shots to make yourself harder to hit." },
  { title: "DASHING", detail: "Use your dash control to quickly reposition and briefly avoid damage. Time it to pass through incoming attacks." },
  { title: "PICKUPS & RECOVERY", detail: "Walk over weapon and rocket pickups to collect them. Medkits restore health; rockets deal area damage to groups." },
  { title: "FIELD SKILLS", detail: "Use dash to evade attacks, float to change elevation, and wall-kick by pushing into an arena edge. Keep moving during every fight." },
  { title: "GRUNT", detail: "Grunts chase you across the arena. Keep moving and aim before firing.", enemy: "grunt" },
  { title: "RUNNER", detail: "Runners rush in with a knife and strike at close range. Dash away or through danger to evade their attack.", enemy: "runner" },
  { title: "RANGED GUNNER", detail: "Gunners keep their distance and shoot aimed projectiles. Watch for the attack tell and dodge sideways.", enemy: "gunner" },
  { title: "ARMORED HOSTILE", detail: "Armored enemies take reduced weapon damage. Use a Heavy Cannon if available, or keep firing while avoiding their shots.", enemy: "armored" },
  { title: "EXPLODER", detail: "Exploders sprint toward you and detonate nearby. Keep your distance and shoot them before they get close.", enemy: "exploder" },
  { title: "MEDIC", detail: "Medics hang back and restore nearby allies. Prioritize them so the rest of the group cannot recover.", enemy: "medic", ally: "grunt" },
  { title: "TELEPORTER", detail: "Teleporters blink to new positions, making their movement unpredictable. Track their new location before aiming.", enemy: "teleporter" },
  { title: "SPLITTER", detail: "A Splitter deploys two fast Runners when defeated. Be ready to reposition as soon as it breaks apart.", enemy: "splitter" },
  { title: "SHIELDBEARER", detail: "Shieldbearers protect enemies behind their shield. Flank them or reposition until you have a clear shot.", enemy: "shieldbearer", ally: "grunt" },
  { title: "WARDEN // PHASE 1", detail: "The Warden tracks your position and fires aimed volleys. Keep moving and watch its attack tell.", enemy: "boss", bossPhase: 1 },
  { title: "WARDEN // PHASE 2", detail: "At 75% health, the Warden speeds up and alternates aimed shots with a spread. Move through the gaps.", enemy: "boss", bossPhase: 2 },
  { title: "WARDEN // PHASE 3", detail: "Below 30% health, the Warden fires a wider spread. Stay mobile and dash through a safe gap.", enemy: "boss", bossPhase: 3 },
];
const towerFloorEnemyCounts = [0, 5, 7, 9, 11, 13, 1, 11, 13, 15, 17, 4];
function storageGet(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } }
function storageSet(key, value) { try { localStorage.setItem(key, String(value)); } catch (_) { /* Storage can be disabled by the browser. */ } }
let audioContext = null;

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
  floor: 1,
  enemies: [],
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
  weaponAmmo: { rifle: 0, smg: 0, heavy: 0 },
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
  blackoutActive: 0,
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
function damageEnemy(enemy, damage, x, y, particleColor = "#9ae6ff", weaponType = "pistol") {
  const mitigated = enemy.shielded ? damage * 0.35 : enemy.type === "armored" ? damage * 0.55 : damage;
  enemy.hp -= mitigated;
  enemy.hitFlash = 0.12;
  if (state.particles.length < 220) state.particles.push({ x, y: y - 12, vx: rand(-12, 12), vy: -42, life: 0.65, maxLife: 0.65, size: 13, color: "#fff0d8", text: String(Math.round(mitigated)) });
  spawnParticles(x, y, particleColor, enemy.type === "boss" ? 10 : 5);
  playTone(damage >= 3 ? 120 : 250, 0.035, "square", 0.008);
  if (enemy.isBoss && !enemy.phaseTwo && enemy.hp <= enemy.maxHp * 0.75) {
    enemy.phaseTwo = true;
    enemy.speed *= 1.25;
    enemy.fireCooldown = 0.15;
    enemy.phaseChangeTimer = 1.4;
    setStatus("WARDEN PHASE 2 // 75% // SPEED AND FIRE RATE INCREASED");
    state.announcement = 2.5;
  }
  if (enemy.isBoss && enemy.phaseTwo && !enemy.phaseThree && enemy.hp <= enemy.maxHp * 0.3) {
    enemy.phaseThree = true;
    enemy.speed *= 1.1;
    enemy.attackPattern = "fan";
    enemy.fireCooldown = 0.25;
    enemy.phaseChangeTimer = 1.8;
    setStatus("WARDEN PHASE 3 // 30% // LAST STAND");
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
        setStatus("AIR COMBO // +100 SCORE");
      }
    }
    state.particles.push({ x: enemy.x, y: enemy.y - 25, vx: 0, vy: -35, life: 0.8, maxLife: 0.8, size: 14, color: "#ffe2a5", text: `+${scoreBonus}` });
    recordKill(weaponType, enemy);
    if (state.killStreak > 0 && state.killStreak % 5 === 0) { state.score += 125; setStatus(`${state.killStreak} HOSTILE STREAK // +125 BONUS`); }
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
      setStatus("SPLITTER // TWO RUNNERS DEPLOYED");
    }
    if (enemy.isBoss) { state.score += 250; state.shakeTimer = Math.max(state.shakeTimer, 0.45); state.slowMo = 0.75; playTone(75, 0.45, "sawtooth", 0.07); }
    if (state.killStreak >= 10) setStatus(`KILLING SPREE // ${state.killStreak} HOSTILES // x${comboMultiplier.toFixed(1)}`);
    else if (state.killStreak >= 3) setStatus(`${state.killStreak}X COMBO // +${scoreBonus} SCORE`);
    else setStatus(enemy.isBoss ? "TARGET ELIMINATED // BOSS DOWN!" : "Enemy down.");
  }
}

function explodeRocket(rocket) {
  const blastRadius = 120;
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

const achievementDefinitions = [
  { id: "first-blood", title: "FIRST BLOOD", requirement: "Defeat one hostile.", target: 1 },
  { id: "untouchable", title: "UNTOUCHABLE", requirement: "Clear a floor without taking damage.", target: 1 },
  { id: "rocket-scientist", title: "ROCKET SCIENTIST", requirement: "Defeat three hostiles with one rocket.", target: 1 },
  { id: "boss-breaker", title: "BOSS BREAKER", requirement: "Defeat a Warden.", target: 1 },
  { id: "arsenal", title: "ARSENAL", requirement: "Get a kill with each firearm.", target: 4 },
  { id: "survivor", title: "SURVIVOR", requirement: "Survive for five minutes.", target: 300 },
  { id: "speedrunner", title: "SPEEDRUNNER", requirement: "Clear the tower in under five minutes.", target: 1 },
  { id: "perfect-run", title: "PERFECT RUN", requirement: "Clear the tower without taking damage.", target: 1 },
];
function savedProgress(key, fallback = {}) {
  try { return JSON.parse(storageGet(key, JSON.stringify(fallback))) || fallback; } catch (_) { return fallback; }
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
  if (achievement) setStatus(`ACHIEVEMENT UNLOCKED // ${achievement.title}`);
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
    setStatus(`DAILY CHALLENGE COMPLETE // +250 SCORE`);
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
  if (challengeNode) challengeNode.textContent = `DAILY // ${state.dailyChallenge.title} // ${Math.min(state.dailyProgress, state.dailyChallenge.target)}/${state.dailyChallenge.target}${state.dailyChallenge.complete ? " // COMPLETE" : ""}`;
  const unlocked = savedProgress("sgtAchievements", []);
  const achievementNode = document.getElementById("achievementList");
  if (achievementNode) achievementNode.innerHTML = `<p><strong>ACHIEVEMENTS</strong></p>${achievementDefinitions.map(item => `<p>${unlocked.includes(item.id) ? "✓" : "○"} ${item.title} — ${item.requirement}</p>`).join("")}`;
  const mastery = getWeaponMastery();
  const goals = { pistol: 100, rifle: 250, smg: 300, heavy: 75 };
  const masteryNode = document.getElementById("masteryList");
  if (masteryNode) masteryNode.innerHTML = `<p><strong>WEAPON MASTERY // COSMETIC GUN TINTS</strong></p>${Object.keys(goals).map(weapon => {
    const kills = mastery[weapon] || 0;
    const rank = kills >= goals[weapon] * 2 ? "ELITE TINT" : kills >= goals[weapon] ? "EXPERT TINT" : "ROOKIE";
    return `<p>${weaponStats[weapon].label}: ${kills}/${goals[weapon]} kills // ${rank}</p>`;
  }).join("")}`;
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
  document.getElementById("bestScoreLabel").textContent = state.mode === "survival" ? "SURVIVAL BEST" : "TOWER BEST";
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
      : "Tower run started. Clear the floor!");
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
  document.getElementById("resultEyebrow").textContent = victory ? "TOWER CONQUERED" : "MISSION REPORT";
  document.getElementById("resultTitle").textContent = victory ? "TOWER CLEARED" : "RUN ENDED";
  document.getElementById("resultMessage").textContent = victory && state.mode === "tower" ? "CONGRATULATIONS FOR CLEARING THE GAME" : victory ? "Every floor is clear. Operator, excellent work." : "The tower won this round. Re-arm and try again.";
  document.getElementById("resultScore").textContent = String(state.score).padStart(6, "0");
  document.getElementById("resultFloor").textContent = String(state.floor);
  document.getElementById("resultTime").textContent = formatTime(state.runTime);
  const recordKey = state.mode === "tower" ? "sgtTowerBestScore" : "sgtSurvivalBestScore";
  const previousBest = Number(storageGet(recordKey, "0")) || 0;
  const best = Math.max(previousBest, state.score);
  const newRecord = state.score > previousBest;
  storageSet(recordKey, best);
  document.getElementById("bestScore").textContent = String(best).padStart(6, "0");
  document.getElementById("resultBestScore").textContent = String(best).padStart(6, "0");
  document.getElementById("resultEnemies").textContent = String(state.enemiesDefeated);
  document.getElementById("resultRockets").textContent = String(state.rocketsUsed);
  document.getElementById("resultRecord").textContent = newRecord ? "NEW PERSONAL RECORD" : "PERSONAL RECORD NOT BEATEN";
  document.getElementById("resultMode").textContent = state.mode === "tower"
    ? `${settings.difficulty.toUpperCase()} TOWER RUN`
    : state.mode === "survival" ? `${getSurvivalThreatLabel()} SURVIVAL // FLOOR ${state.floor}` : "TRAINING SIM";
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
  floorLabel.textContent = `Floor ${state.floor}`;
  timerLabel.textContent = formatTime(state.runTime);
  missionLabel.textContent = state.paused
    ? "Mission: paused"
    : state.gameOver
      ? (state.victory ? "Mission: complete" : "Mission: failed")
      : state.levelCleared
        ? "Mission: advance"
        : state.mode === "survival" ? "Mission: survive"
          : state.mode === "tutorial" ? "Mission: training simulation" : "Mission: clear the floor";
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(state.paused));
  pauseButton.disabled = state.gameOver;
  weaponLabel.textContent = weaponStats[state.weapon].label;
}

function updateControlHints() {
  const classic = settings.controlScheme === "classic";
  const touch = settings.controlScheme === "touch";
  document.body.classList.toggle("mouse-aim-enabled", !classic && !touch);
  document.body.classList.toggle("touch-controls-enabled", touch);
  document.getElementById("aimKeyHint").textContent = classic ? "A / D / W / S" : touch ? "Aim stick" : "Mouse";
  document.getElementById("aimHint").textContent = classic ? "Aim in the direction you move" : touch ? "Use the right stick to aim" : "Aim with the cursor";
  document.getElementById("weaponKeysHint").textContent = "1 / 2 / 3";
  document.getElementById("weaponSelectHint").textContent = "Equip rifle / SMG / cannon";
  document.getElementById("weaponSelectControl").classList.toggle("hidden", classic || touch);
  document.getElementById("mouseFireControl").classList.toggle("hidden", classic || touch);
  document.getElementById("classicFireControl").classList.toggle("hidden", !classic);
  document.getElementById("rocketKeyHint").textContent = classic ? "L" : touch ? "Touch" : "Right click";
  document.getElementById("menuWeaponHint").textContent = classic ? "J FIRE EQUIPPED // PICKUPS AUTO-EQUIP" : touch ? "TOUCH AIM / MOVE // EDGE TO FIRE" : "1 / 2 / 3 EQUIP // LEFT CLICK FIRE";
  document.getElementById("menuFireHint").textContent = classic ? "K DASH // L ROCKET" : touch ? "DASH LEFT // ROCKET ABOVE AIM" : "SPACE DASH // RIGHT CLICK ROCKET";
  document.getElementById("dashKeyHint").textContent = classic ? "K" : touch ? "Touch" : "Space";
  document.getElementById("helpDashHint").textContent = classic ? "K" : touch ? "Touch dash button" : "Space";
  document.getElementById("pauseKeyHint").textContent = classic ? "ESC" : "P / ESC";
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
  const touch = settings.controlScheme === "touch";
  const classic = settings.controlScheme === "classic";
  const controls = touch
    ? "Left stick moves. Push the right aim stick to its outer edge to fire; DASH is beside it, and ROCKET launches."
    : classic
      ? "A / D move, W / S float, J fires, K dashes, and L launches a rocket."
      : "A / D move, W / S float, mouse aims, left click fires, Space dashes, and right click launches a rocket.";
  document.getElementById("tutorialProgress").textContent = `TUTORIAL // LESSON ${state.tutorialLesson + 1} OF ${tutorialLessons.length}`;
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
  const dashX = directionX * 95;
  const dashY = directionY * 95;
  player.x = clamp(player.x + dashX, 30, WIDTH - 30);
  player.y = clamp(player.y + dashY, 30, HEIGHT - 30);
  player.vx = directionX * 420;
  player.vy = directionY * 420;
  player.dashCooldown = 0.8;
  player.invuln = 0.25;
  player.dashFlash = 0.24;
  spawnParticles(player.x, player.y, "#9be7ff", 12);
  if (nearProjectile) {
    state.perfectDodges += 1;
    state.slowMo = 0.45;
    state.score += 100;
    setStatus("PERFECT DODGE // +100 SCORE");
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
    boss: { speed: 78, hp: 2000 + Math.min(state.floor, 12) * 100, cooldown: 1.05, behavior: "boss", color: "#ff9275" },
  };
  const profile = profiles[type];
  const scale = state.mode === "survival" ? state.threatScale : 1;
  const hp = profile.hp;
  const enemy = {
    x: rand(980, WIDTH - 70),
    y: rand(110, HEIGHT - 110),
    width: boss ? 38 : type === "armored" ? 24 : 18,
    height: boss ? 84 : 54,
    speed: profile.speed * difficulty.speed * Math.min(scale, 1.5),
    vx: rand(-60, 60), vy: rand(-45, 45),
    hp, maxHp: hp,
    fireCooldown: rand(profile.cooldown * 0.75, profile.cooldown * 1.35) / (difficulty.fireRate * Math.min(scale, 1.65)),
    isBoss: boss,
    type, behavior: profile.behavior, color: elite ? "#ffe46b" : profile.color, elite,
    hitFlash: 0, phaseTwo: false, phaseThree: false, phaseChangeTimer: 0, explodeTimer: 0,
    summonCooldown: boss ? 10 : 0,
    abilityCooldown: type === "teleporter" ? 3 : type === "medic" ? 2.2 : 0,
    meleeCooldown: type === "runner" ? rand(0.25, 0.7) : 0,
    knifeSwing: 0,
    attackPattern: "aimed",
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
  const weapons = ["rifle", "smg", "heavy"];
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
  setStatus(`WAVE ${state.wave} // ${event.name} // ${event.message}`);
}

function updateWeaponPickup(dt) {
  if (state.weaponPickup) return;
  state.weaponSpawnTimer -= dt;
  if (state.weaponSpawnTimer > 0) return;
  spawnWeaponPickup();
  state.weaponSpawnTimer = rand(5, 9);
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
  const noun = state.mode === "survival" ? "WAVE" : "FLOOR";
  panel.classList.remove("floor-starting", "floor-ending");
  const finalFloorIntro = starting && state.mode === "tower" && state.floor === 11;
  document.getElementById("floorClearEyebrow").textContent = finalFloorIntro ? "FINAL CHALLENGE" : starting ? "HOSTILE SECTOR INCOMING" : "HOSTILE SECTOR SECURED";
  document.getElementById("floorClearTitle").textContent = finalFloorIntro
    ? "FINAL FLOOR GOODLUCK!!"
    : starting
      ? `${noun} ${state.floor} STARTING`
    : `${noun} ${state.floor} CLEARED`;
  document.getElementById("floorClearDetail").textContent = finalFloorIntro
    ? "THE WARDEN AWAITS"
    : starting
      ? "NEW SECTOR DETECTED: PREPARE TO DEPLOY"
    : state.mode === "tower" ? "PREPARING NEXT FLOOR..." : "PREPARING NEXT WAVE...";
  panel.classList.add(starting ? "floor-starting" : "floor-ending");
  panel.classList.remove("hidden");
  void panel.offsetWidth;
  state.floorTransition = duration;
}

function buildLevel() {
  state.enemies = [];
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
  setStatus(state.mode === "tutorial" ? "TRAINING SIMULATION // ENCOUNTERS ON DEMAND"
    : state.mode === "tower" ? `FLOOR ${state.floor} // ${config.title} // ${state.arenaModifier.title}`
      : `WAVE ${state.wave} // ${getSurvivalThreatLabel()} THREAT // ${state.arenaModifier.title}`);
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
  setStatus(`TRAINING // ${tutorialLessons[state.tutorialLesson].title}`);
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
  if (settings.shake) state.shakeTimer = 0.16;
  playTone(105, 0.12, "sawtooth", 0.045);
  spawnParticles(player.x, player.y, "#ff8c8c", 16);
  if (player.hp <= 0) {
    player.hp = 0;
    state.gameOver = true;
    setStatus("You were knocked out. Press R to restart.");
    showResult(false);
  }
}

function findLoadedWeapon(preferredWeapon = state.weapon) {
  if (preferredWeapon !== "pistol" && state.weaponAmmo[preferredWeapon] > 0) return preferredWeapon;
  return ["rifle", "smg", "heavy"].find(weapon => state.weaponAmmo[weapon] > 0) || "pistol";
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
  const shotAngles = [0];
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
  const spread = fan
    ? enemy.phaseThree ? [-0.32, -0.16, 0, 0.16, 0.32] : [-0.34, -0.17, 0, 0.17, 0.34]
    : [0];
  for (const offset of spread) {
    const angle = aimAngle + offset;
    const speed = enemy.isBoss ? 300 : 235;
    state.enemyBullets.push({
      x: enemy.x + enemy.width * 0.4 * Math.sign(dx || 1),
      y: enemy.y + 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: enemy.isBoss ? 6 : 5,
        damage: (enemy.isBoss ? 12 * (enemy.phaseThree ? 1.2 : enemy.phaseTwo ? 1.25 : 1) : enemy.type === "gunner" ? 7 : 8) * getDifficultyStats().damage * Math.min(state.threatScale, 1.4) * (state.lastStandActive ? 1.25 : 1),
      team: "enemy",
    });
  }
}

function nextFloor() {
  state.floor += 1;
  if (state.mode === "tower") state.wave = state.floor;
  document.getElementById("floorClearPanel").classList.add("hidden");
  if (state.floor > 11) {
    if (state.mode === "survival") { /* Survival mode keeps climbing indefinitely. */ }
    else { state.floor = 11; state.gameOver = true; showResult(true); setStatus("Tower cleared! Mission complete."); return; }
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

  if (!event.repeat && state.screen === "playing") {
    const weaponKeys = settings.controlScheme === "classic"
      ? {}
      : { "1": "rifle", "2": "smg", "3": "heavy" };
    const selectedWeapon = weaponKeys[key];
    if (selectedWeapon) {
      if (selectedWeapon === "pistol" || state.weaponAmmo[selectedWeapon] > 0) {
        state.weapon = selectedWeapon;
        setStatus(`${weaponStats[selectedWeapon].label} ready.`);
        updateHud();
      } else {
        setStatus(`No ${weaponStats[selectedWeapon].label} ammo. Find a pickup first.`);
      }
    }
  }

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
    const ammoGranted = pickedUpWeapon === "rifle" ? 15 : pickedUpWeapon === "smg" ? 30 : 3;
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
    setStatus("WALL KICK // OPERATOR REPOSITIONED");
  }
  player.recoilVx *= Math.exp(-8 * dt);
  player.recoilVy *= Math.exp(-8 * dt);
  player.x = clamp(player.x, 18, WIDTH - 18);
  player.y = clamp(player.y, 50, HEIGHT - 40);
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
          if (bullet.impact === "burst" && settings.shake) state.shakeTimer = Math.max(state.shakeTimer, 0.14);
      
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
      enemy.summonCooldown -= dt;
      if (enemy.summonCooldown <= 0) {
        enemy.summonCooldown = 10;
        for (let i = 0; i < 5; i += 1) {
          const minion = createEnemy("armored");
          minion.shielded = true;
          minion.x = clamp(enemy.x + rand(-130, 130), 30, WIDTH - 30);
          minion.y = clamp(enemy.y + rand(-100, 100), 20, HEIGHT - 40);
          state.enemies.push(minion);
          spawnParticles(minion.x, minion.y, "#7be5ff", 8);
        }
        setStatus("WARDEN SUMMONS // 5 SHIELDED HOSTILES DEPLOYED");
      }
    }

    const dirX = player.x - enemy.x;
    const dirY = player.y - enemy.y;
    const dist = Math.hypot(dirX, dirY) || 1;
    const canFire = enemy.type === "gunner" || enemy.type === "teleporter" || enemy.type === "shieldbearer" || enemy.isBoss || enemy.type === "grunt" || enemy.type === "armored";
    enemy.phaseChangeTimer = Math.max(0, (enemy.phaseChangeTimer || 0) - dt);

    if (enemy.behavior === "keep-distance" || enemy.behavior === "medic") {
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
    const maxSpeed = enemy.speed * (state.lastStandActive ? 1.15 : 1);
    if (speed > maxSpeed) { enemy.vx = enemy.vx / speed * maxSpeed; enemy.vy = enemy.vy / speed * maxSpeed; }
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.x < 30 || enemy.x > WIDTH - 30) enemy.vx *= -0.85;
    if (enemy.y < 20 || enemy.y > HEIGHT - 40) enemy.vy *= -0.85;

    enemy.x = clamp(enemy.x, 30, WIDTH - 30);
    enemy.y = clamp(enemy.y, 20, HEIGHT - 40);

    enemy.angle = Math.atan2(dirY, dirX);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.knifeSwing = Math.max(0, enemy.knifeSwing - dt);
    enemy.abilityCooldown -= dt;
    if (enemy.behavior === "teleport" && enemy.abilityCooldown <= 0 && dist < 340) {
      enemy.abilityCooldown = 4.5;
      spawnParticles(enemy.x, enemy.y, enemy.color, 10);
      enemy.x = rand(160, WIDTH - 100);
      enemy.y = rand(90, HEIGHT - 100);
      spawnParticles(enemy.x, enemy.y, enemy.color, 10);
      setStatus("TELEPORTER REPOSITIONED");
    }
    if (enemy.behavior === "medic" && enemy.abilityCooldown <= 0) {
      const ally = state.enemies.find(other => other !== enemy && other.alive && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 170 && other.hp < other.maxHp);
      if (ally) {
        ally.hp = Math.min(ally.maxHp, ally.hp + 1.2);
        enemy.abilityCooldown = 2.4;
        spawnParticles(ally.x, ally.y, "#78f0a0", 5);
      }
    }
    enemy.fireCooldown -= dt;
    enemy.attackTell = ((enemy.isBoss || enemy.type === "gunner" || enemy.type === "teleporter") && enemy.fireCooldown < 0.42 && enemy.fireCooldown > 0)
      || (enemy.type === "runner" && dist < 58 && enemy.meleeCooldown < 0.24);
    if (enemy.behavior === "explode" && dist < 70) {
      enemy.alive = false;
      spawnParticles(enemy.x, enemy.y, "#ff7c3d", 28);
      state.particles.push({ x: enemy.x, y: enemy.y, radius: 8, life: 0.32, maxLife: 0.32, shockwave: true, color: "#ffb64f" });
      if (dist < 145) hitPlayer(24 * getDifficultyStats().damage);
      continue;
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
    if (enemy.fireCooldown <= 0 && canFire && firingDistance < firingRange) {
      shootEnemy(enemy);
      enemy.fireCooldown = (enemy.isBoss ? enemy.phaseThree ? 0.9 : enemy.phaseTwo ? 1.05 : 1.55 : enemy.type === "gunner" ? 1.9 : enemy.type === "teleporter" ? 2.2 : 2.8) / (getDifficultyStats().fireRate * Math.min(state.threatScale, 1.6));
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
    setStatus(`Floor ${state.floor} cleared!`);
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
      setStatus(`${completedEvent} SURVIVED // +300 SCORE`);
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
  updateParticles(dt);
  if (state.mode === "survival" && state.runTime > 0 && Math.floor(state.runTime / 60) > state.wave - 1) {
    state.wave = Math.floor(state.runTime / 60) + 1;
    state.score += state.wave * 50;
    state.announcement = 2.5;
    setStatus(`SURVIVAL MILESTONE // ${getSurvivalThreatLabel()} THREAT // +${state.wave * 50} SCORE`);
    if (state.enemies.length > 0) for (let i = 0; i < Math.min(2, state.wave); i += 1) state.enemies.push(createEnemy("runner"));
    if (state.wave % 4 === 0) triggerSurvivalEvent();
  }

  updateHud();
}

function updateArenaModifier(dt) {
  if (!state.arenaModifier) return;
  if (state.arenaModifier.id === "blackout") {
    if (state.blackoutActive > 0) state.blackoutActive = Math.max(0, state.blackoutActive - dt);
    else {
      state.arenaTimer -= dt;
      if (state.arenaTimer <= 0) {
        state.blackoutActive = 2;
        state.arenaTimer = 8;
        setStatus("BLACKOUT // VISIBILITY REDUCED");
      }
    }
    return;
  }
  if (state.arenaModifier.id !== "reactor" && state.arenaModifier.id !== "hazard") return;
  if (state.hazardWarning > 0) {
    state.hazardWarning -= dt;
    if (state.hazardWarning <= 0) {
      state.hazardActive = 0.7;
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
      setStatus(`${state.arenaModifier.title} // DANGER ZONE MARKED`);
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
  ctx.strokeStyle = player.hitFlash > 0 ? "#ffffff" : "#dff7ff";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(0, -18 + Math.sin(gait * 2) * moveAmount, 12, 0, Math.PI * 2);
  ctx.stroke();

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
  ctx.strokeStyle = masteryCount >= masteryGoal * 2 ? "#ff675c" : masteryCount >= masteryGoal ? "#ffb266" : "#7ee5ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(32 - player.recoil, 2);
  ctx.stroke();

  if (player.gunFlash > 0) {
    ctx.strokeStyle = "#fff3a3";
    ctx.beginPath();
    ctx.moveTo(30, 2);
    ctx.lineTo(42, 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "#dff7ff";
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

  ctx.fillStyle = "#9beeff";
  ctx.beginPath();
  ctx.arc(17, 0, 3, 0, Math.PI * 2);
  ctx.arc(17, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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
    ctx.fillText(enemy.phaseThree ? "WARDEN // PHASE III" : enemy.phaseTwo ? "WARDEN // PHASE II" : "WARDEN // PHASE I", 0, healthBarY - 5);
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

  ctx.fillStyle = bullet.team === "player" ? "#8de7ff" : "#ff8f82";
  ctx.save();
  ctx.strokeStyle = bullet.team === "player" ? "rgba(141,231,255,.55)" : "rgba(255,143,130,.5)";
  ctx.lineWidth = bullet.radius;
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
  const panelY = clamp((topbarRect.bottom - canvasRect.top + 8) * scaleY, 8, HEIGHT - 76);
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
  ctx.fillText("ROCKET", panelX + 303, panelY + 25);
  ctx.fillStyle = "#ffe2a5";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(player.rocketCount), panelX + 303, panelY + 51);

  ctx.fillStyle = "rgba(141, 231, 255, 0.78)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("SMG", panelX + 363, panelY + 25);
  ctx.fillStyle = "#b8f2ff";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.smg), panelX + 363, panelY + 51);

  ctx.fillStyle = "rgba(255, 179, 138, 0.82)";
  ctx.font = "600 9px Orbitron, Segoe UI, sans-serif";
  ctx.fillText("HEAVY", panelX + 416, panelY + 25);
  ctx.fillStyle = "#ffd0b8";
  ctx.font = "700 18px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(String(state.weaponAmmo.heavy), panelX + 416, panelY + 51);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "600 16px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(`Score ${state.score}`, 1248, barY + 14);
  ctx.fillStyle = "#ffe2a5";
  ctx.font = "600 11px Orbitron, Segoe UI, sans-serif";
  ctx.fillText(`${state.killStreak > 1 ? `${state.killStreak}X COMBO` : "COMBAT READY"}`, 1248, barY + 31);
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

function drawArenaEffects() {
  if (!state.arenaModifier) return;
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
    const playerLight = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 88);
    playerLight.addColorStop(0, "rgba(255, 226, 190, 0.24)");
    playerLight.addColorStop(0.35, "rgba(255, 190, 145, 0.12)");
    playerLight.addColorStop(1, "rgba(255, 150, 120, 0)");
    ctx.fillStyle = playerLight;
    ctx.fillRect(player.x - 88, player.y - 88, 176, 176);
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
    canvas.style.transform = `translate(${rand(-4, 4)}px, ${rand(-3, 3)}px)`;
  } else canvas.style.transform = "";
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
  const modeName = state.mode === "survival" ? "ENDLESS SURVIVAL"
    : state.mode === "tutorial" ? "TRAINING SIMULATION" : "TOWER BREACH";
  const difficulty = state.mode === "survival"
    ? " / STARTS EASY, ESCALATES EACH FLOOR"
    : state.mode === "tower" ? ` / ${settings.difficulty.toUpperCase()} THREAT` : "";
  document.getElementById("loadoutSummary").textContent = `${modeName}${difficulty} // WEAPONS IN FIELD`;
  const scoreKey = state.mode === "survival" ? "sgtSurvivalBestScore" : "sgtTowerBestScore";
  document.getElementById("bestScore").textContent = String(Number(storageGet(scoreKey, "0")) || 0).padStart(6, "0");
  document.getElementById("bestScoreLabel").textContent = state.mode === "survival" ? "SURVIVAL BEST" : "TOWER BEST";
}

document.getElementById("playButton").addEventListener("click", () => {
  closeMenuPanels();
  document.getElementById("settingsRows").classList.add("hidden");
  document.getElementById("towerDifficultyRow").classList.toggle("hidden", state.mode !== "tower");
  document.getElementById("confirmDeploy").classList.remove("hidden");
  loadoutPanel.classList.remove("hidden");
  updateLoadoutSummary();
});
document.getElementById("settingsButton").addEventListener("click", () => {
  closeMenuPanels(); loadoutPanel.classList.remove("hidden");
  document.getElementById("settingsRows").classList.remove("hidden");
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
document.getElementById("shakeToggle").addEventListener("change", event => { settings.shake = event.target.checked; storageSet("sgtShake", settings.shake); if (!settings.shake) canvas.style.transform = ""; });
settings.sound = storageGet("sgtSound", "true") !== "false";
settings.shake = storageGet("sgtShake", "true") !== "false";
document.getElementById("soundToggle").checked = settings.sound;
document.getElementById("shakeToggle").checked = settings.shake;
document.getElementById("resumeButton").addEventListener("click", togglePause);
document.getElementById("restartButton").addEventListener("click", startMission);
document.getElementById("retryButton").addEventListener("click", startMission);
document.getElementById("returnMenuButton").addEventListener("click", showMainMenu);
document.getElementById("resultMenuButton").addEventListener("click", showMainMenu);

window.addEventListener("blur", pauseForFocusLoss);

resetRun();
showMainMenu();
requestAnimationFrame(loop);

