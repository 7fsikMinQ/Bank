
// ── 실적 퀘스트 화면 ──────────────────────────────────────────────────────
// 홈 위젯: 카드별 캐릭터 + 경험치 바 + 레벨. 앱에서 실행(위젯 탭): 애니메이션 전체 화면(WebView, 인터넷 없음).
const FS = 13;                                   // 글자 크기(중간 위젯 11~14 권장)
const man = v => (v / 10000).toFixed(2).replace(/\.?0+$/, "");
const won = v => Math.max(0, Math.floor(v)).toLocaleString() + "원";
const pctColor = (q) => q.max ? "#30d158" : q.pct >= 0.67 ? "#ffd60a" : q.pct >= 0.34 ? "#ff9f0a" : "#ff453a";

function barImage(pct, hex, w, h) {              // 둥근 막대 그림 (실패하면 호출한 쪽에서 글자 막대로 대체)
  const dc = new DrawContext(); dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;
  dc.setFillColor(new Color("#8e8e93", 0.35)); dc.addPath(Path.roundedRect(new Rect(0, 0, w, h), h / 2, h / 2)); dc.fillPath();
  if (pct > 0) { dc.setFillColor(new Color(hex)); dc.addPath(Path.roundedRect(new Rect(0, 0, Math.max(h, w * pct), h), h / 2, h / 2)); dc.fillPath(); }
  return dc.getImage();
}
function textBar(pct) { const k = Math.round(pct * 8); return "▰".repeat(k) + "▱".repeat(8 - k); }

// 지난번에 본 레벨(앱 화면 레벨업 연출 중복 방지). 달이 바뀌면 초기화, 첫 실행이면 연출 없음.
const stateFile = fm.joinPath(root, "quest-state.json");
function readState(ym) {
  try {
    if (!fm.fileExists(stateFile)) return null;
    const s = JSON.parse(fm.readString(stateFile));
    return s && s.ym === ym && s.levels && typeof s.levels === "object" ? s.levels : {};
  } catch (e) { return null; }
}
function writeState(ym, levels) { try { fm.writeString(stateFile, JSON.stringify({ ym, levels })); } catch (e) {} }

function viewHtml(data) {                         // 숫자·고정 문구만 주입한다(문자 원문은 넣지 않음)
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{color-scheme:dark light;--bg:#101018;--fg:#f2f2f7;--sub:#9a9aa5;--card:#1c1c28;--track:#33334a}
@media (prefers-color-scheme:light){:root{--bg:#f2f2f7;--fg:#1c1c1e;--sub:#6c6c70;--card:#fff;--track:#d8d8e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,system-ui,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px 28px}
h1{font-size:20px;margin:6px 0 2px}#sub{color:var(--sub);font-size:13px;margin-bottom:14px}
.card{background:var(--card);border-radius:16px;padding:14px;margin-bottom:12px}
.row{display:flex;align-items:center;gap:12px}.emo{font-size:44px;line-height:1}.emo.hop{animation:hop .8s ease 3}
.nm{font-weight:700;font-size:16px}.lv{font-size:13px;color:var(--sub)}.amt{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}
.track{height:14px;border-radius:7px;background:var(--track);overflow:hidden;margin-top:10px}.fill{height:100%;width:0;border-radius:7px;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}
.note{font-size:12px;color:var(--sub);margin-top:6px}.badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:12px;font-weight:700;background:#30d158;color:#04210d;margin-left:6px}
#pv{display:none;background:#5e5ce6;color:#fff;border-radius:10px;padding:8px 12px;margin-bottom:12px;font-size:13px}
.dev{display:none;margin-top:8px}.dev input{width:100%}
.pop{position:fixed;left:0;right:0;top:34%;text-align:center;font-size:30px;font-weight:800;pointer-events:none;opacity:0}.pop.go{animation:pop 2.2s ease}
.p{position:fixed;top:-30px;font-size:24px;pointer-events:none;animation:fall 2.4s linear forwards}
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}20%{opacity:1;transform:scale(1.15)}80%{opacity:1}100%{opacity:0;transform:scale(1)}}
@keyframes fall{to{transform:translateY(110vh) rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.fill{transition:none}.emo.hop,.pop.go,.p{animation:none}}
</style></head><body>
<h1 id="t">실적 퀘스트</h1><div id="sub"></div><div id="pv">🔧 미리보기: 실제 합계·저장 파일은 바뀌지 않습니다</div><div id="list"></div><div class="pop" id="pop"></div>
<script>
const D = ${json};
const questOf = ${questOf.toString()};
const fmtMan = v => (v / 10000).toFixed(2).replace(/\\.?0+$/, "");
const color = q => q.max ? "#30d158" : q.pct >= 0.67 ? "#ffd60a" : q.pct >= 0.34 ? "#ff9f0a" : "#ff453a";
let values = {}, taps = 0, preview = false;
D.cards.forEach(c => values[c.id] = c.value);
function celebrate(names) {
  const pop = document.getElementById("pop"); pop.textContent = "🎉 LEVEL UP! " + names.join(" · "); pop.classList.remove("go"); void pop.offsetWidth; pop.classList.add("go");
  for (let i = 0; i < 18; i++) { const p = document.createElement("div"); p.className = "p"; p.textContent = ["🎉","✨","⭐"][i % 3]; p.style.left = (Math.random() * 95) + "%"; p.style.animationDelay = (Math.random() * 0.8) + "s"; document.body.appendChild(p); setTimeout(() => p.remove(), 3600); }
}
function render(up) {
  const list = document.getElementById("list"); list.innerHTML = ""; let got = 0, total = 0; const ups = [];
  D.cards.forEach(c => {
    const q = questOf(c, values[c.id]); got += q.level; total += q.levels;
    const lvUp = up.includes(c.id); if (lvUp) ups.push(c.name);
    const el = document.createElement("div"); el.className = "card";
    const right = c.noTarget ? (values[c.id] > 0 ? Math.floor(values[c.id]).toLocaleString() + "원" : "0원") : fmtMan(Math.max(0, values[c.id])) + "만";
    const note = q.kind === "active" ? (q.level ? "이번 달 사용 중! (목표 없음)" : "아직 사용 내역이 없어요")
      : q.max ? "퀘스트 클리어!" : (fmtMan(q.toNext) + "만 더 쓰면 " + (q.level + 1 <= q.levels ? "Lv" + (q.level + 1) : "클리어") + " (목표 " + fmtMan(q.nextTarget) + "만)");
    el.innerHTML = '<div class="row"><div class="emo' + (lvUp ? " hop" : "") + '">' + c.emoji + '</div><div><div class="nm">' + c.name + (q.max ? '<span class="badge">' + q.label + '</span>' : '') + '</div><div class="lv">' + (q.kind === "active" ? q.label : q.label) + '</div></div><div class="amt">' + right + '</div></div>'
      + (q.kind === "tier" ? '<div class="track"><div class="fill" style="background:' + color(q) + '"></div></div>' : '') + '<div class="note">' + note + '</div>';
    list.appendChild(el);
    const f = el.querySelector(".fill"); if (f) requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = Math.round(q.pct * 100) + "%"; }));
  });
  document.getElementById("sub").textContent = D.month + "월 " + D.day + "일 현재 · 파티 레벨 " + got + "/" + total;
  if (ups.length) celebrate(ups);
  if (preview) { const dv = document.createElement("div"); dv.className = "card"; dv.innerHTML = "<div class='nm'>미리보기 (화면 시험용)</div>"; D.cards.forEach(c => { const mx = c.noTarget ? 50000 : Math.max.apply(null, c.tiers) * 1.2; const r = document.createElement("div"); r.innerHTML = "<div class='note'>" + c.name + "</div><input type='range' min='0' max='" + mx + "' step='" + Math.max(1, Math.round(mx / 120)) + "' value='" + Math.max(0, values[c.id]) + "'>"; r.querySelector("input").oninput = e => { const before = questOf(c, values[c.id]).level; values[c.id] = +e.target.value; const after = questOf(c, values[c.id]).level; render(after > before ? [c.id] : []); }; dv.appendChild(r); }); list.appendChild(dv); }
}
document.getElementById("t").onclick = () => { if (++taps >= 7 && !preview) { preview = true; document.getElementById("pv").style.display = "block"; render([]); } };
render(D.leveledUp);
</script></body></html>`;
}

const w = new ListWidget();
w.backgroundColor = typeof Color.dynamic === "function" ? Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e")) : new Color("#1c1c1e");
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
w.url = "scriptable:///run/" + encodeURIComponent(Script.name());   // 탭 → 앱에서 실행(애니메이션 화면)

try {
  const now = new Date();
  const { items, failed } = await load(now);
  const res = core.aggregate(items, now.toISOString(), loadAdjust());
  const { sum, unparsed, info } = res;
  const warn = unparsed + failed;
  const quests = {}; core.CARDS.forEach(c => { quests[c.id] = questOf(c, sum[c.id]); });
  const party = partyOf(core.CARDS, sum);

  if (!config.runsInWidget) {
    // 앱 실행: 레벨업 연출 대상 계산 → 상태 저장 → 전체 화면
    const prior = readState(info.ym);
    const levels = {}; core.CARDS.forEach(c => { levels[c.id] = quests[c.id].level; });
    const leveledUp = prior === null ? [] : core.CARDS.filter(c => levels[c.id] > (prior[c.id] || 0)).map(c => c.id);
    writeState(info.ym, levels);
    const data = { month: info.month, day: info.day, days: info.days, leveledUp,
      cards: core.CARDS.map(c => ({ id: c.id, name: SHORT[c.id], emoji: EMOJI[c.id], noTarget: !!c.noTarget, tiers: c.tiers, value: sum[c.id] })) };
    const wv = new WebView(); await wv.loadHTML(viewHtml(data)); await wv.present(true);
  }

  const title = w.addText(`${info.month}월 실적 퀘스트  파티 ${party.got}/${party.total}` + (warn ? `  ⚠︎${warn}` : ""));
  title.font = Font.boldSystemFont(FS - 1); title.textColor = Color.gray();
  w.addSpacer(4);
  for (const c of core.CARDS) {
    const q = quests[c.id], v = sum[c.id];
    const row = w.addStack(); row.centerAlignContent();
    const e = row.addText(EMOJI[c.id]); e.font = Font.systemFont(FS + 5);
    row.addSpacer(4);
    const ns = row.addStack(); ns.size = new Size(FS * 5.4, 0);
    const n = ns.addText(SHORT[c.id]); n.font = Font.systemFont(FS); n.lineLimit = 1;
    if (q.kind === "tier") {
      let img = null; try { img = barImage(q.pct, pctColor(q), 90, 8); } catch (err) { img = null; }
      if (img) { const im = row.addImage(img); im.imageSize = new Size(90, 8); }
      else { const tb = row.addText(textBar(q.pct)); tb.font = Font.systemFont(FS - 3); tb.textColor = new Color(pctColor(q)); }
    } else {
      const a = row.addText(q.level ? "활동 중" : "대기"); a.font = Font.systemFont(FS - 1); a.textColor = q.level ? Color.green() : Color.gray();
    }
    row.addSpacer();
    const r = row.addText(q.kind === "active" ? won(v) : `${q.label} · ${man(Math.max(0, v))}만`);
    r.font = Font.boldMonospacedSystemFont(FS - 1); r.textColor = q.max || q.level && q.kind === "active" ? Color.green() : Color.gray();
    w.addSpacer(3);
  }
  const todo = core.CARDS.filter(c => quests[c.id].kind === "tier" && !quests[c.id].max)
    .sort((a, b) => quests[b.id].pct - quests[a.id].pct)[0];
  const foot = w.addText((todo ? `다음: ${SHORT[todo.id]} ${man(quests[todo.id].nextTarget)}만까지 ${man(quests[todo.id].toNext)}만` : "모든 퀘스트 클리어!")
    + ` · ${info.month}월 ${info.day}일 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
  foot.font = Font.systemFont(FS - 3); foot.textColor = Color.gray(); foot.lineLimit = 1;
} catch (e) {
  const t = w.addText("오류: " + e.message + (e.line ? " (줄 " + e.line + ":" + e.column + ")" : "")); t.font = Font.systemFont(11); t.textColor = Color.red();
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
