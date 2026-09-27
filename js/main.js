// Interactions: clock, windows, terminal, dragging icons, photo zoom.
(function () {
  /* ---------- clock ---------- */
  const clock = document.getElementById('clock');
  function tick() { const d = new Date(); clock.textContent = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + '  ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  tick(); setInterval(tick, 20000);

  /* ---------- seeded random ---------- */
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- canvas art ---------- */
  function drawRadar(c) {
    const x = c.getContext('2d'), W = c.width, H = c.height, r = rng(7);
    x.fillStyle = '#0B0F1A'; x.fillRect(0, 0, W, H);
    const img = x.getImageData(0, 0, W, H), d = img.data;
    const cx = W * .5, cy = H * .2, R = H * .62;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const dx = (i - cx) / (R * 1.25), dy = (j - cy) / R;
      const rr = Math.sqrt(dx * dx + dy * dy);
      let v = 0;
      if (j > cy) { const edge = Math.exp(-Math.pow((rr - 1) / 0.035, 2)); const fall = rr < 1 ? Math.exp(-(1 - rr) * 5) * 0.55 : 0; v = edge + fall; v *= Math.max(0, 1 - Math.abs(dx) * 0.6); }
      v += (r() - .5) * 0.18;
      v = Math.max(0, Math.min(1, v));
      const k = (j * W + i) * 4;
      d[k] = 40 + 215 * Math.pow(v, 1.3); d[k + 1] = 60 + 195 * v; d[k + 2] = 90 + 160 * Math.pow(v, .8); d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }
  function drawKombucha(c) {
    const x = c.getContext('2d'), W = c.width, H = c.height, r = rng(11);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F6D38A'); g.addColorStop(.55, '#E0A04A'); g.addColorStop(1, '#B96B2A');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < Math.round(W * H / 900); i++) { const px = r() * W, py = r() * H, s = (1 + r() * 4) * (W / 300); x.beginPath(); x.arc(px, py, s, 0, Math.PI * 2); x.fillStyle = `rgba(255,248,230,${.25 + r() * .45})`; x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(W * .1, 0, W * .06, H);
  }
  function drawTee(c) {
    const x = c.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = '#E0456B'; x.fillRect(0, 0, W, H);
    x.save(); x.translate(W / 2, H / 2); const s = W / 110; x.scale(s, s);
    x.fillStyle = '#fff'; x.beginPath();
    x.moveTo(-20, -38); x.lineTo(-8, -42); x.quadraticCurveTo(0, -34, 8, -42); x.lineTo(20, -38); x.lineTo(42, -22); x.lineTo(32, -6); x.lineTo(22, -12); x.lineTo(22, 48); x.lineTo(-22, 48); x.lineTo(-22, -12); x.lineTo(-32, -6); x.lineTo(-42, -22); x.closePath(); x.fill();
    x.fillStyle = '#E0456B'; x.font = '700 11px Arial, sans-serif'; x.textAlign = 'center'; x.fillText('DOOKED', 0, 4);
    x.restore();
  }
  const DRAW = { radar: drawRadar, 'radar-big': drawRadar, kombucha: drawKombucha, 'kombucha-big': drawKombucha, tee: drawTee };
  function paint(root) { root.querySelectorAll('canvas[data-draw]').forEach(c => DRAW[c.dataset.draw](c)); }
  function fillImgs(root) { root.querySelectorAll('img.zoomable').forEach(im => { if (!im.closest('.item')) im.addEventListener('click', () => zoom(im)); }); }
  function zoom(im) { const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.innerHTML = `<figure style="margin:0"><img src="${im.src}" alt="${im.alt}"><p>${im.alt}</p></figure>`; lb.addEventListener('click', () => lb.remove()); addEventListener('keydown', function k(e) { if (e.key === 'Escape') { lb.remove(); removeEventListener('keydown', k); } }); document.body.appendChild(lb); }
  fillImgs(document);
  paint(document);
  document.querySelectorAll('.pg .js-copy').forEach(b => b.addEventListener('click', () => copyEmail(b)));

  /* ---------- windows ---------- */
  let z = 1000, count = 0; const open = {};
  const mobile = () => matchMedia('(max-width: 760px)').matches;

  function focusWin(w) { Object.values(open).forEach(o => o.classList.remove('front')); w.classList.add('front'); w.style.zIndex = ++z; }

  function openWin(id) {
    if (open[id]) { focusWin(open[id]); return; }
    const tpl = document.getElementById('tpl-' + id); if (!tpl) return;
    const w = document.createElement('section');
    w.className = 'win'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', tpl.dataset.title);
    w.innerHTML = `<div class="bar"><div class="dots"><i class="x" role="button" tabindex="0" aria-label="Close window"></i><i></i><i></i></div><div class="t">${tpl.dataset.title}</div></div>`;
    w.appendChild(tpl.content.cloneNode(true));
    const width = Math.min(+tpl.dataset.w || 520, innerWidth - 24);
    w.style.width = width + 'px';
    const off = (count++ % 6) * 26;
    w.style.left = Math.max(12, (innerWidth - width) / 2 - 60 + off) + 'px';
    w.style.top = Math.max(44, innerHeight * 0.12 + off) + 'px';
    document.body.appendChild(w);
    open[id] = w; focusWin(w);
    paint(w); fillImgs(w);
    const close = () => { w.classList.add('closing'); setTimeout(() => w.remove(), 140); delete open[id]; };
    const x = w.querySelector('.x');
    x.addEventListener('click', close);
    x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } });
    w.addEventListener('pointerdown', () => focusWin(w));
    w._close = close;
    dragWin(w);
    setup(id, w);
    const first = w.querySelector('input, button:not(.x)'); if (id === 'terminal' && first) first.focus();
  }

  function dragWin(w) {
    const bar = w.querySelector('.bar'); let sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', e => { if (mobile() || e.target.classList.contains('x')) return; on = true; sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', e => { if (!on) return; const nx = Math.min(innerWidth - 80, Math.max(-w.offsetWidth + 120, ox + e.clientX - sx)); const ny = Math.min(innerHeight - 50, Math.max(32, oy + e.clientY - sy)); w.style.left = nx + 'px'; w.style.top = ny + 'px'; });
    bar.addEventListener('pointerup', () => { on = false; });
  }

  addEventListener('keydown', e => { if (e.key === 'Escape') { const top = Object.values(open).sort((a, b) => b.style.zIndex - a.style.zIndex)[0]; if (top) top._close(); } });

  /* ---------- per-window behavior ---------- */
  const NAMES = { portfolio: 'folder', experience: 'folder', projects: 'folder', dooked: 'folder', photos: 'folder', design: 'folder', about: 'text', resume: 'pdf', radar: 'image', kombucha: 'image', terminal: 'app', contact: 'app', links: 'app', trash: 'trash' };
  const LABEL = { experience: 'experience', projects: 'projects', dooked: 'dooked', photos: 'photography', design: 'graphic_design', about: 'about_me.txt', resume: 'resume.pdf', radar: 'radar_echo.png', kombucha: 'kombucha_batch.jpeg', terminal: 'terminal', contact: 'contact', trash: 'trash' };

  function copyEmail(btn) {
    const label = btn.textContent;
    const done = () => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = label, 1500); };
    const fail = () => { btn.textContent = 'fh95@duke.edu'; };
    try { navigator.clipboard.writeText('fh95@duke.edu').then(done, fail); } catch (_) { fail(); }
  }

  function setup(id, w) {
    w.querySelectorAll('.js-copy').forEach(b => b.addEventListener('click', () => copyEmail(b)));
    if (id === 'trash') {
      const b = w.querySelector('.js-empty'), n = w.querySelector('.trash-note');
      b.addEventListener('click', () => { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); n.hidden = false; });
    }
    if (id === 'portfolio') {
      const tb = w.querySelector('#index');
      tb.innerHTML = Object.keys(LABEL).map(k => `<tr><td><button type="button" data-go="${k}">${LABEL[k]}</button></td><td class="k">${NAMES[k]}</td></tr>`).join('');
      tb.querySelectorAll('button').forEach(b => b.addEventListener('click', () => openWin(b.dataset.go)));
    }
    if (id === 'terminal') terminal(w);
  }

  function terminal(w) {
    const out = w.querySelector('.o'), form = w.querySelector('form'), input = w.querySelector('input'), box = w.querySelector('.term');
    box.addEventListener('click', () => input.focus());
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const C = {
      help: () => `commands:
  <span class="hl">whoami</span>         who is fabi
  <span class="hl">ls</span>             list the desktop
  <span class="hl">open</span> &lt;name&gt;    open a file or folder (try: open resume)
  <span class="hl">skills</span>         what i work with
  <span class="hl">contact</span>        how to reach me
  <span class="hl">hola</span>           :)
  <span class="hl">clear</span>          clear the screen`,
      whoami: () => `fabiana henríquez. cs @ duke '29, from puerto rico.
kinesis foundation scholar. founder of dooked.
looking for swe, ml/ai, and health tech
internships, summer 2027.`,
      ls: () => 'experience/  projects/  dooked/  photography/  graphic_design/\nabout_me.txt  resume.pdf  radar_echo.png  kombucha_batch.jpeg',
      skills: () => 'python · c++ · redcap · excel · final cut pro · canva\nlanguages: español, english (both native)',
      contact: () => 'fh95@duke.edu\nfabiana.henriquez@duke.edu (same inbox)',
      hola: () => '¡hola! gracias por pasar por aquí.',
      'sudo hire fabi': () => 'permission granted. email fh95@duke.edu to finish setup.'
    };
    const ALIAS = { resume: 'resume', 'resume.pdf': 'resume', experience: 'experience', projects: 'projects', dooked: 'dooked', photography: 'photos', photos: 'photos', graphic_design: 'design', design: 'design', 'about_me.txt': 'about', about: 'about', 'radar_echo.png': 'radar', radar: 'radar', 'kombucha_batch.jpeg': 'kombucha', kombucha: 'kombucha', trash: 'trash', contact: 'contact' };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = input.value.trim(), cmd = raw.toLowerCase(); input.value = '';
      let res = '';
      if (cmd === 'clear') { out.innerHTML = ''; return; }
      if (!cmd) { res = ''; }
      else if (C[cmd]) res = C[cmd]();
      else if (cmd.startsWith('open ')) { const t = ALIAS[cmd.slice(5).trim()]; if (t) { openWin(t); res = 'opening ' + esc(cmd.slice(5).trim()) + '...'; } else res = 'no file called ' + esc(cmd.slice(5)) + '. try: ls'; }
      else if (cmd.startsWith('sudo')) res = 'nice try. try: sudo hire fabi';
      else res = 'command not found: ' + esc(raw) + '. type help';
      out.innerHTML += `<span class="p">fabi@duke ~ %</span> ${esc(raw)}\n${res}${res ? '\n' : ''}`;
      box.scrollTop = box.scrollHeight; w.querySelector('.term').parentElement.scrollTop = 1e6;
    });
  }

  /* ---------- desktop items: click to open, drag to move ---------- */
  const desk = document.getElementById('top');
  document.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', () => {
      if (el._dragged) { el._dragged = false; return; }
      openWin(el.dataset.open);
    });
  });
  document.querySelectorAll('.item').forEach(el => {
    let sx, sy, bx, by, down = false;
    el.addEventListener('pointerdown', e => {
      document.querySelectorAll('.item.sel').forEach(i => i.classList.remove('sel')); el.classList.add('sel');
      if (mobile()) return;
      down = true; sx = e.clientX; sy = e.clientY;
      const r = desk.getBoundingClientRect(), er = el.getBoundingClientRect();
      bx = er.left + er.width / 2 - r.left; by = er.top + er.height / 2 - r.top;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!el._dragged && Math.hypot(dx, dy) < 5) return;
      el._dragged = true; el.classList.add('dragging');
      const r = desk.getBoundingClientRect();
      const nx = Math.min(r.width - 40, Math.max(40, bx + dx)), ny = Math.min(r.height - 40, Math.max(40, by + dy));
      el.style.setProperty('--x', (nx / r.width * 100) + '%'); el.style.setProperty('--y', (ny / r.height * 100) + '%');
    });
    el.addEventListener('pointerup', () => { down = false; el.classList.remove('dragging'); });
  });
  desk.addEventListener('pointerdown', e => { if (e.target === desk) document.querySelectorAll('.item.sel').forEach(i => i.classList.remove('sel')); });
})();
