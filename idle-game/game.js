// 방치형 짬뽕 게임 로직 (DOM 없음, 순수 계산). 탭 + 자동 생산 + 자동 전투 + 뽑기 + 환생 + 트레이너(치트).
const Game = (() => {
  const UNITS = ["", "만", "억", "조", "경", "해", "자", "양", "구", "간", "정", "재", "극"];
  function fmt(n) {
    if (!isFinite(n)) return "∞";
    if (n < 10000) return String(Math.floor(n));
    let i = 0, v = n;
    while (v >= 10000 && i < UNITS.length - 1) { v /= 10000; i++; }
    if (v >= 10000) return n.toExponential(2);
    return (Math.floor(v * 100) / 100).toString() + UNITS[i];
  }

  const GENS = [
    { id: "farm",   icon: "🌾", name: "농장",        cost: 15,       inc: 0.1 },
    { id: "mine",   icon: "⛏️", name: "광산",        cost: 100,      inc: 1 },
    { id: "hunter", icon: "🗡️", name: "던전 사냥꾼", cost: 1100,     inc: 8 },
    { id: "party",  icon: "🛡️", name: "용사 파티",   cost: 12000,    inc: 47 },
    { id: "robot",  icon: "🤖", name: "로봇 공장",   cost: 130000,   inc: 260 },
    { id: "ship",   icon: "🚀", name: "우주선",      cost: 1.4e6,    inc: 1400 },
    { id: "portal", icon: "🌀", name: "차원문",      cost: 2e7,      inc: 7800 },
    { id: "server", icon: "🖥️", name: "신의 서버",   cost: 3.3e8,    inc: 44000 },
  ];
  const GROWTH = 1.15, MILESTONE = 25;
  const CHARS = {
    N:   [["slime", "슬라임"], ["goblin", "고블린"], ["cat", "길고양이"], ["parttime", "알바생"]],
    R:   [["mage", "마법사"], ["ninja", "닌자"], ["hacker", "해커"], ["fire", "소방관"]],
    SR:  [["dragon", "용기사"], ["cyber", "사이버 닌자"], ["chef", "마라탕 셰프"], ["idol", "던전 아이돌"]],
    SSR: [["timelord", "시간의 관리자"], ["godserver", "무한 서버의 신"], ["junk", "우주 폐지왕"]],
  };
  const GRADE_BONUS = { N: 0.01, R: 0.03, SR: 0.08, SSR: 0.2 };   // 별 1개당 전체 수익 가산
  const RATES = [["SSR", 0.02], ["SR", 0.12], ["R", 0.36], ["N", 0.5]];
  const PULL_COST = 100, PITY = 50, MAX_STARS = 10;
  const OFFLINE_CAP = 8 * 3600, OFFLINE_RATE = 0.5;

  function newState(now = Date.now()) {
    return { v: 1, gold: 0, gems: 300, souls: 0, runEarned: 0, lifeEarned: 0, gens: GENS.map(() => 0), tapLv: 0,
             owned: {}, pity: 0, pulls: 0, stage: 1, enemyHp: maxHp(1), speed: 1, cheated: false, lastSeen: now };
  }
  function maxHp(stage) { return 20 * Math.pow(1.45, stage - 1); }
  function reward(stage) { return maxHp(stage) * 2; }

  function starsOf(s, id) { return Math.min(MAX_STARS, s.owned[id] || 0); }
  function charMult(s) {
    let m = 1;
    for (const g of Object.keys(CHARS)) for (const [id] of CHARS[g]) m += GRADE_BONUS[g] * starsOf(s, id);
    return m;
  }
  function globalMult(s) { return (1 + 0.1 * s.souls) * charMult(s); }
  function genMult(count) { return Math.pow(2, Math.floor(count / MILESTONE)); }
  function income(s) {
    let t = 0;
    GENS.forEach((g, i) => { t += s.gens[i] * g.inc * genMult(s.gens[i]); });
    return t * globalMult(s);
  }
  function tapValue(s) { return (1 + s.tapLv) * globalMult(s) + income(s) * 0.01; }
  function dps(s) { return 10 + income(s) * 0.3 + s.tapLv * 5; }

  function genCost(s, i) { return Math.floor(GENS[i].cost * Math.pow(GROWTH, s.gens[i])); }
  function tapCost(s) { return Math.floor(50 * Math.pow(1.25, s.tapLv)); }
  function earn(s, amount) { s.gold += amount; s.runEarned += amount; s.lifeEarned += amount; }

  function tap(s) { earn(s, tapValue(s)); }
  function buyGen(s, i, n = 1) {                      // n: 숫자 또는 "max"
    let bought = 0;
    while ((n === "max" || bought < n) && s.gold >= genCost(s, i) && bought < 1000) { s.gold -= genCost(s, i); s.gens[i]++; bought++; }
    return bought;
  }
  function buyTap(s, n = 1) {
    let bought = 0;
    while ((n === "max" || bought < n) && s.gold >= tapCost(s) && bought < 1000) { s.gold -= tapCost(s); s.tapLv++; bought++; }
    return bought;
  }

  function tick(s, dt) {                               // dt: 초 (속도 배율 적용)
    dt *= s.speed;
    earn(s, income(s) * dt);
    s.enemyHp -= dps(s) * dt;
    let kills = 0;
    while (s.enemyHp <= 0 && kills < 200) {
      earn(s, reward(s.stage));
      if (s.stage % 5 === 0) s.gems += 5 + Math.floor(s.stage / 5);
      s.stage++; kills++;
      s.enemyHp = maxHp(s.stage);
    }
    return kills;
  }

  function offline(s, now) {
    const sec = Math.max(0, Math.min(OFFLINE_CAP, (now - s.lastSeen) / 1000));
    const gain = income(s) * sec * OFFLINE_RATE;
    earn(s, gain);
    s.lastSeen = now;
    return { sec, gain };
  }

  function pull(s, rng = Math.random) {
    if (s.gems < PULL_COST) return null;
    s.gems -= PULL_COST; s.pulls++; s.pity++;
    let grade = "N";
    if (s.pity >= PITY) grade = "SSR";
    else {
      let r = rng();
      for (const [g, p] of RATES) { if (r < p) { grade = g; break; } r -= p; }
    }
    if (grade === "SSR") s.pity = 0;
    const list = CHARS[grade], [id, name] = list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
    s.owned[id] = (s.owned[id] || 0) + 1;
    return { grade, id, name, stars: starsOf(s, id) };
  }

  function prestigeGain(s) { return Math.floor(Math.sqrt(s.runEarned / 1e6)); }
  function prestige(s) {
    const g = prestigeGain(s);
    if (g < 1) return 0;
    s.souls += g; s.gold = 0; s.runEarned = 0; s.gens = GENS.map(() => 0); s.tapLv = 0;
    s.stage = 1; s.enemyHp = maxHp(1);
    return g;
  }

  // ── 트레이너(치트): 혼자 즐기는 오프라인 게임용. 사용하면 s.cheated 기록 ──
  const Cheat = {
    gold(s, mult = 1000) { s.cheated = true; earn(s, Math.max(1000, s.gold) * (mult - 1) + 1e6); },
    gems(s, n = 1000) { s.cheated = true; s.gems += n; },
    tap(s, n = 100) { s.cheated = true; s.tapLv += n; },
    allGens(s, n = 50) { s.cheated = true; s.gens = s.gens.map(c => c + n); },
    speed(s, x) { if (![1, 5, 20, 100].includes(x)) return; s.cheated = true; s.speed = x; },
    stage(s, n = 10) { s.cheated = true; s.stage += n; s.enemyHp = maxHp(s.stage); },
    allChars(s) { s.cheated = true; for (const g of Object.keys(CHARS)) for (const [id] of CHARS[g]) s.owned[id] = Math.max(s.owned[id] || 0, MAX_STARS); },
    souls(s, n = 100) { s.cheated = true; s.souls += n; },
  };

  const num = (x, d = 0) => (typeof x === "number" && isFinite(x) && x >= 0 ? x : d);
  function serialize(s) { return JSON.stringify(s); }
  function deserialize(text, now = Date.now()) {       // 깨지거나 조작된 값은 안전한 기본값으로 대체
    const base = newState(now);
    let o; try { o = JSON.parse(text); } catch (e) { return base; }
    if (!o || typeof o !== "object") return base;
    base.gold = num(o.gold); base.gems = num(o.gems, 300); base.souls = Math.floor(num(o.souls));
    base.runEarned = num(o.runEarned); base.lifeEarned = num(o.lifeEarned);
    base.gens = GENS.map((_, i) => Math.floor(num(Array.isArray(o.gens) ? o.gens[i] : 0)));
    base.tapLv = Math.floor(num(o.tapLv)); base.pity = Math.floor(num(o.pity)); base.pulls = Math.floor(num(o.pulls));
    base.stage = Math.max(1, Math.floor(num(o.stage, 1))); base.enemyHp = num(o.enemyHp, maxHp(base.stage)) || maxHp(base.stage);
    base.speed = [1, 5, 20, 100].includes(o.speed) ? o.speed : 1; base.cheated = o.cheated === true;
    base.lastSeen = num(o.lastSeen, now) || now;
    const ids = new Set(); for (const g of Object.keys(CHARS)) for (const [id] of CHARS[g]) ids.add(id);
    if (o.owned && typeof o.owned === "object") for (const k of Object.keys(o.owned)) if (ids.has(k)) base.owned[k] = Math.floor(num(o.owned[k]));
    return base;
  }

  return { GENS, CHARS, RATES, PULL_COST, PITY, MAX_STARS, UNITS, fmt, newState, maxHp, reward, income, tapValue, dps, genCost, tapCost,
           starsOf, charMult, globalMult, genMult, earn, tap, buyGen, buyTap, tick, offline, pull, prestigeGain, prestige, Cheat, serialize, deserialize };
})();
if (typeof module !== "undefined") module.exports = Game;
