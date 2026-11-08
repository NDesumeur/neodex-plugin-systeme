// Système : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Système</span><span id=\"sysName\" class=\"hint\"></span></div>\n      <div class=\"sysGrid\">\n        <div class=\"sysCard px\"><span class=\"label\">Processeur</span><div class=\"sysBig\" id=\"sysCpu\">…</div><div class=\"hint\" id=\"sysCpuInfo\"></div></div>\n        <div class=\"sysCard px\"><span class=\"label\">Mémoire</span><div class=\"sysBig\" id=\"sysMem\">…</div><div class=\"hint\" id=\"sysMemInfo\"></div></div>\n        <div class=\"sysCard px\"><span class=\"label\">Réseau</span><div class=\"sysBig\" id=\"sysNet\">…</div><div class=\"hint\" id=\"sysNetInfo\"></div></div>\n        <div class=\"sysCard px\"><span class=\"label\" id=\"sysTempLbl\">Température</span><div class=\"sysBig\" id=\"sysTemp\">…</div><div class=\"hint\" id=\"sysTempInfo\"></div></div>\n      </div>\n      <div class=\"sysCard px\"><div class=\"chHead\"><span class=\"label\">Processeur et mémoire · 5 dernières minutes</span><span class=\"legend\" id=\"lgUse\"></span></div>\n        <div class=\"chart\"><canvas id=\"chUse\"></canvas><div class=\"chTip\"></div></div></div>\n      <div class=\"stCols\">\n        <div class=\"sysCard px\"><div class=\"chHead\"><span class=\"label\">Réseau · 5 dernières minutes</span><span class=\"legend\" id=\"lgNet\"></span></div>\n          <div class=\"chart small\"><canvas id=\"chNet\"></canvas><div class=\"chTip\"></div></div></div>\n        <div class=\"sysCard px\"><div class=\"chHead\"><span class=\"label\">Cœurs du processeur</span><span class=\"hint\" id=\"sysCoresInfo\"></span></div><div id=\"sysCores\"></div></div>\n      </div>\n      <div class=\"stCols\">\n        <div class=\"sysCard px\"><span class=\"label\">Mémoire par programme</span><div id=\"sysProcs\"></div></div>\n        <div class=\"sysCard px\"><span class=\"label\">Disques</span><div id=\"sysDisks\"></div><span class=\"label\" style=\"margin-top:8px\">Ce PC</span><div id=\"sysInfo\"></div></div>\n      </div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.chHead{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.legend{margin-left:auto;display:flex;gap:16px;font-size:14px;color:var(--lilac)}
.legend i{display:inline-block;width:10px;height:10px;margin-right:6px;background:var(--c)}
.chTip{position:absolute;top:4px;pointer-events:none;display:none;padding:8px 10px;background:var(--win);box-shadow:0 0 0 2px var(--line2);font-size:13px;color:#fff;white-space:nowrap;line-height:1.5}
.chTip b{display:block;font:7px var(--title);color:var(--muted);letter-spacing:1px;margin-bottom:4px}
.chTip i{display:inline-block;width:8px;height:8px;margin-right:6px;background:var(--c)}
#sysCores{display:flex;align-items:flex-end;gap:3px;height:120px;padding-top:6px}
#sysCores div{flex:1;background:var(--violet);min-height:2px}
#sysCores div:hover{background:var(--pink)}
#sysInfo .sysRow{grid-template-columns:120px 1fr}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "sysApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  // ---- ton code d'origine ----
function barRow(name, pct, value, src, warn) {
  const r = el('div', 'sysRow'), n = el('div', 'tn'), bar = el('div', 'dlBar'), f = el('i', warn ? 'warn' : '');
  if (src) { const im = el('img'); im.onerror = () => im.remove(); im.src = src; n.append(im); }
  n.append(name); n.title = name; f.style.width = Math.max(1, pct) + '%'; bar.append(f);
  r.append(n, bar, el('span', 'v', value));
  return r;
}

/* ---------- Système app: sampled every second while its tab is shown, charts keep the last 5 minutes ---------- */
const gb = b => (b / 1073741824).toFixed(b < 107374182400 ? 1 : 0).replace('.', ',') + ' Go';
const mo = b => b >= 1073741824 ? gb(b) : Math.round(b / 1048576) + ' Mo';
const rate = b => b < 1024 ? Math.round(b) + ' o/s' : b < 1048576 ? Math.round(b / 1024) + ' Ko/s' : (b / 1048576).toFixed(1).replace('.', ',') + ' Mo/s';
const pct = v => Math.round(v) + ' %';
const fmtAgo = s => s < 60 ? s + ' s' : (s / 60 | 0) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
const HIST = 300, hist = {cpu: [], mem: [], down: [], up: []};
// Line chart drawn in steps: series = [{label, color: CSS variable, data, fmt}], newest value on the right, one sample per second.
// max: top of the scale (null = from the data). Hovering shows a crosshair and the values at that moment.
function lineChart(cv, series, max) {
  cv._args = [series, max];
  const dpr = devicePixelRatio, w = cv.clientWidth, h = cv.clientHeight, tip = cv.nextElementSibling;
  if (!w) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d'), css = getComputedStyle(document.documentElement), col = v => css.getPropertyValue(v).trim();
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const top = max ?? Math.max(1024, ...series.flatMap(s => s.data)) * 1.25, pad = 6, Y = v => Math.round(h - pad - v / top * (h - 2 * pad)), step = w / (HIST - 1);
  g.font = '12px ' + css.getPropertyValue('--text');
  for (const q of [.25, .5, .75]) { const y = Y(top * q); g.fillStyle = col('--line'); g.fillRect(0, y, w, 1); g.fillStyle = col('--muted'); g.fillText(series[0].fmt(top * q), 4, y - 4); }
  series.forEach((s, k) => {
    const X = i => Math.round(w - (s.data.length - 1 - i) * step);
    g.fillStyle = col(s.color);
    for (let i = 0; i < s.data.length - 1; i++) {
      const x0 = X(i), x1 = X(i + 1), y0 = Y(s.data[i]), y1 = Y(s.data[i + 1]);
      if (k === 0) { g.globalAlpha = .14; g.fillRect(x0, y0, x1 - x0, h - pad - y0); g.globalAlpha = 1; }  // the first series is an area
      g.fillRect(x0, y0 - 1, x1 - x0 + 2, 2); g.fillRect(x1, Math.min(y0, y1) - 1, 2, Math.abs(y1 - y0) + 2);
    }
  });
  const back = cv._hx == null ? -1 : Math.round((w - cv._hx) / step);
  if (back < 0 || back >= series[0].data.length) { tip.style.display = 'none'; return; }
  const hx = Math.round(w - back * step);
  g.fillStyle = col('--muted'); g.fillRect(hx, 0, 1, h);
  tip.replaceChildren(el('b', '', back ? 'IL Y A ' + fmtAgo(back).toUpperCase() : 'MAINTENANT'), ...series.map(s => {
    const v = s.data[s.data.length - 1 - back], d = el('div'), sw = el('i');
    sw.style.setProperty('--c', `var(${s.color})`); d.append(sw, s.label + ' : ' + (v == null ? '—' : s.fmt(v)));
    if (v != null) { g.fillStyle = col('--win'); g.fillRect(hx - 5, Y(v) - 5, 10, 10); g.fillStyle = col(s.color); g.fillRect(hx - 4, Y(v) - 4, 8, 8); }
    return d;
  }));
  tip.style.display = 'block';
  tip.style.left = (hx + 14 + tip.offsetWidth > w ? hx - 14 - tip.offsetWidth : hx + 14) + 'px';
}
for (const id of ['chUse', 'chNet']) { const cv = $(id); cv.onmousemove = e => { cv._hx = e.offsetX; cv._args && lineChart(cv, ...cv._args); }; cv.onmouseleave = () => { cv._hx = null; cv._args && lineChart(cv, ...cv._args); }; }
const legend = (id, items) => $(id).replaceChildren(...items.map(([label, c]) => { const s = el('span'), i = el('i'); i.style.setProperty('--c', `var(${c})`); s.append(i, label); return s; }));
legend('lgUse', [['Processeur', '--pink'], ['Mémoire', '--violet']]);
legend('lgNet', [['Reçu', '--pink'], ['Envoyé', '--violet']]);
let sysTimer = null, battery = null;
navigator.getBattery?.().then(b => battery = b).catch(() => {});
async function sysTick() {
  clearTimeout(sysTimer);
  if (!window.neo || !view.classList.contains('on')) return;  // stops by itself once the tab is left
  sysTimer = setTimeout(sysTick, 1000);
  const s = await neo.sysStats(), mem = (1 - s.memFree / s.memTotal) * 100;
  const push = (k, v) => { hist[k].push(v); if (hist[k].length > HIST) hist[k].shift(); };
  if (s.cpu != null) push('cpu', s.cpu);
  push('mem', mem);
  if (s.down != null) { push('down', s.down); push('up', s.up); }
  $('sysName').textContent = s.cpuName + ' · ' + s.cores + ' cœurs logiques';
  $('sysCpu').textContent = s.cpu == null ? '…' : pct(s.cpu);
  $('sysCpuInfo').textContent = 'Moyenne 5 min : ' + (hist.cpu.length ? pct(hist.cpu.reduce((a, b) => a + b, 0) / hist.cpu.length) : '…') + (s.mhz ? ' · base ' + (s.mhz / 1000).toFixed(1).replace('.', ',') + ' GHz' : '');
  $('sysMem').textContent = pct(mem);
  $('sysMemInfo').textContent = gb(s.memTotal - s.memFree) + ' utilisés sur ' + gb(s.memTotal);
  $('sysNet').textContent = s.down == null ? '…' : '↓ ' + rate(s.down);
  $('sysNetInfo').textContent = s.up == null ? 'Mesure en cours…' : '↑ ' + rate(s.up) + ' envoyés';
  $('sysTemp').textContent = s.temp == null ? '—' : s.temp + ' °C';
  $('sysTempInfo').textContent = s.temp === undefined ? 'Mesure en cours…' : s.temp === null ? "Windows ne donne pas la température à NeoDex sur ce PC (souvent réservée aux administrateurs)." : 'Capteur de la carte mère';
  lineChart($('chUse'), [{label: 'Processeur', color: '--pink', data: hist.cpu, fmt: pct}, {label: 'Mémoire', color: '--violet', data: hist.mem, fmt: pct}], 100);
  lineChart($('chNet'), [{label: 'Reçu', color: '--pink', data: hist.down, fmt: rate}, {label: 'Envoyé', color: '--violet', data: hist.up, fmt: rate}], null);
  if (s.perCore) {
    $('sysCores').replaceChildren(...s.perCore.map((v, i) => { const b = el('div'); b.style.height = Math.max(1, v) + '%'; b.title = 'Cœur ' + (i + 1) + ' : ' + pct(v); return b; }));
    const hot = s.perCore.filter(v => v > 80).length;
    $('sysCoresInfo').textContent = hot ? hot + ' cœur' + (hot > 1 ? 's' : '') + ' au-dessus de 80 %' : 'aucun cœur saturé';
  }
  const topMem = s.procs[0]?.mem || 1;
  $('sysProcs').replaceChildren(...(s.procs.length ? s.procs.map(p => barRow(p.name, p.mem / topMem * 100, mo(p.mem))) : [el('div', 'hint', 'Lecture en cours…')]));
  $('sysDisks').replaceChildren(...s.disks.map(k => { const used = 1 - k.free / k.total; return barRow(k.name, used * 100, gb(k.free) + ' libres sur ' + gb(k.total), '', used > .9); }));
  const up = s.uptime, d = up / 86400 | 0, h = up % 86400 / 3600 | 0, m = up % 3600 / 60 | 0;
  const info = [['Nom du PC', s.host], ['Windows', s.osName + ' (' + s.osRelease + ')'], ['Allumé depuis', (d ? d + ' j ' : '') + h + ' h ' + String(m).padStart(2, '0')], ['NeoDex utilise', mo(s.self) + ' de mémoire']];
  const desktop = !battery || (battery.charging && battery.level === 1 && battery.dischargingTime === Infinity);  // a PC without battery reports "full and charging"
  if (!desktop) info.push(['Batterie', pct(battery.level * 100) + (battery.charging ? ' · en charge' : '')]);
  $('sysInfo').replaceChildren(...info.map(([k, v]) => { const r = el('div', 'sysRow'); r.append(el('div', 'v', k), el('div', 'tn', v)); return r; }));
}
addEventListener('resize', () => { for (const id of ['chUse', 'chNet']) $(id)._args && lineChart($(id), ...$(id)._args); });  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { sysTick(); });
}
