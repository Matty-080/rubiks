/* Rubikovka – 3D zobrazení kostky čistě v CSS (bez knihoven).
 * Kostičky jsou divy se 6 stěnami. Animace tahu = dočasná rotace kostiček vrstvy,
 * po jejím skončení se jen přebarví nálepky podle nového stavu. */
(function (root) {
  'use strict';
  var C = root.Cube;

  var HEX = { W: '#ffffff', Y: '#ffd500', G: '#06a35a', B: '#1f5fd1', R: '#d62839', O: '#ff7a1a', X: '#59616e' };
  var FACE_DEF = [
    { n: [1, 0, 0], tr: 'rotateY(90deg)' }, { n: [-1, 0, 0], tr: 'rotateY(-90deg)' },
    { n: [0, 1, 0], tr: 'rotateX(90deg)' }, { n: [0, -1, 0], tr: 'rotateX(-90deg)' },
    { n: [0, 0, 1], tr: '' }, { n: [0, 0, -1], tr: 'rotateY(180deg)' }
  ];

  function key(p, n) { return p.join(',') + '|' + n.join(','); }

  function CubeView(el, N, opts) {
    opts = opts || {};
    this.el = el; this.N = N; this.rx = -28; this.ry = -36;
    this.size = opts.size || 210;
    this.build();
    this.bindDrag();
  }

  CubeView.prototype.build = function () {
    var N = this.N, m = N - 1, L = this.size, s = L / N, h = s / 2;
    this.el.innerHTML = '';
    this.el.classList.add('cv-scene');
    this.el.style.setProperty('--cv-size', L + 'px');
    var cube = document.createElement('div'); cube.className = 'cv-cube';
    this.cubeEl = cube; this.el.appendChild(cube);
    this.cubies = []; this.stickers = {};
    for (var x = -m; x <= m; x += 2) for (var y = -m; y <= m; y += 2) for (var z = -m; z <= m; z += 2) {
      if (Math.abs(x) !== m && Math.abs(y) !== m && Math.abs(z) !== m) continue;
      var cb = document.createElement('div'); cb.className = 'cv-cubie';
      var base = 'translate3d(' + (x * h) + 'px,' + (-y * h) + 'px,' + (z * h) + 'px)';
      cb.style.transform = base;
      var info = { el: cb, p: [x, y, z], base: base };
      FACE_DEF.forEach(function (fd) {
        var f = document.createElement('div'); f.className = 'cv-face';
        f.style.width = f.style.height = s + 'px';
        f.style.left = f.style.top = (-h) + 'px';
        f.style.transform = fd.tr + ' translateZ(' + h + 'px)';
        var outer = fd.n[0] * x === m || fd.n[1] * y === m || fd.n[2] * z === m;
        if (outer && (fd.n[0] * x + fd.n[1] * y + fd.n[2] * z) === m) {
          var st = document.createElement('div'); st.className = 'cv-sticker'; f.appendChild(st);
          this.stickers[key([x, y, z], fd.n)] = st;
        }
        cb.appendChild(f);
      }, this);
      cube.appendChild(cb); this.cubies.push(info);
    }
    // vrstva se šipkou (ukazuje směr dalšího tahu)
    var ar = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ar.setAttribute('class', 'cv-arrow'); this.arrowEl = ar; this.el.appendChild(ar);
    this.applyView();
  };

  CubeView.prototype.applyView = function () {
    this.cubeEl.style.transform = 'rotateX(' + this.rx + 'deg) rotateY(' + this.ry + 'deg)';
    if (this.arrowTok) this.drawArrow();
  };
  CubeView.prototype.resetView = function () { this.rx = -28; this.ry = -36; this.applyView(); };

  CubeView.prototype.bindDrag = function () {
    var self = this, sx, sy, rx0, ry0, active = false;
    this.el.addEventListener('pointerdown', function (e) {
      active = true; sx = e.clientX; sy = e.clientY; rx0 = self.rx; ry0 = self.ry;
      self.el.setPointerCapture(e.pointerId); self.el.classList.add('dragging');
    });
    this.el.addEventListener('pointermove', function (e) {
      if (!active) return;
      self.ry = ry0 + (e.clientX - sx) * 0.5;
      self.rx = Math.max(-85, Math.min(85, rx0 - (e.clientY - sy) * 0.5));
      self.applyView();
    });
    var end = function () { active = false; self.el.classList.remove('dragging'); };
    this.el.addEventListener('pointerup', end); this.el.addEventListener('pointercancel', end);
  };

  /* mask(s) -> barva nebo 'X' (šedá = na barvě teď nezáleží) */
  CubeView.prototype.setState = function (cube, mask) {
    var self = this;
    cube.st.forEach(function (s) {
      var el = self.stickers[key(s.p, s.n)];
      if (!el) return;
      var c = mask ? mask(s, cube) : s.c;
      el.style.background = HEX[c] || c;
      el.classList.toggle('muted', c === 'X');
    });
  };

  CubeView.prototype.animateMove = function (tok, ms) {
    var self = this, mv = C.parseMove(tok, this.N);
    var axis = [0, 0, 0]; axis[mv.axis] = 1; axis[1] = -axis[1];         // osa y je v CSS obráceně
    var deg = -mv.q * 90;
    var moving = this.cubies.filter(function (c) { return mv.test(c.p[mv.axis]); });
    if (!ms) return Promise.resolve();
    return new Promise(function (resolve) {
      moving.forEach(function (c) {
        c.el.style.transition = 'none';
        c.el.style.transform = 'rotate3d(' + axis.join(',') + ',0deg) ' + c.base;
      });
      self.cubeEl.offsetWidth; // vynutí přepočet stylů
      requestAnimationFrame(function () {
        moving.forEach(function (c) {
          c.el.style.transition = 'transform ' + ms + 'ms cubic-bezier(.45,.05,.3,1)';
          c.el.style.transform = 'rotate3d(' + axis.join(',') + ',' + deg + 'deg) ' + c.base;
        });
        setTimeout(function () {
          moving.forEach(function (c) { c.el.style.transition = 'none'; c.el.style.transform = c.base; });
          resolve();
        }, ms + 20);
      });
    });
  };

  /* šipka pro tah – kreslí se do 2D vrstvy nad kostkou (promítnutím 3D bodů),
   * takže ji nikdy nepřekryjí kostičky. Osy x, y → přední stěna, osa z → horní stěna. */
  CubeView.prototype.showArrow = function (tok) {
    this.arrowTok = tok || null;
    this.drawArrow();
  };
  CubeView.prototype.project = function (p) {
    var rx = this.rx * Math.PI / 180, ry = this.ry * Math.PI / 180;
    var x = p[0] * Math.cos(ry) + p[2] * Math.sin(ry), z = -p[0] * Math.sin(ry) + p[2] * Math.cos(ry), y = p[1];
    var y2 = y * Math.cos(rx) - z * Math.sin(rx), z2 = y * Math.sin(rx) + z * Math.cos(rx);
    var sr = this.el.getBoundingClientRect(), cr = this.cubeEl.getBoundingClientRect();
    var cx = cr.left - sr.left, cy = cr.top - sr.top, ox = sr.width * 0.5, oy = sr.height * 0.45, d = 900;
    var k = d / (d - z2);
    return [ox + (cx + x - ox) * k, oy + (cy + y2 - oy) * k];
  };
  CubeView.prototype.drawArrow = function () {
    var svg = this.arrowEl, tok = this.arrowTok, N = this.N, L = this.size, s = L / N, h = L / 2;
    if (!tok) { svg.innerHTML = ''; return; }
    var mv; try { mv = C.parseMove(tok, N); } catch (e) { svg.innerHTML = ''; return; }
    var m = N - 1, idx = [];
    for (var c = -m; c <= m; c += 2) if (mv.test(c)) idx.push(mv.axis === 1 ? (m - c) / 2 : (c + m) / 2);
    var lo = Math.min.apply(null, idx), hi = Math.max.apply(null, idx) + 1, mid = (lo + hi) / 2;
    var sign = mv.q > 0 ? 1 : -1, onTop = mv.axis === 2, vertical = mv.axis === 0;
    var dir = mv.axis === 2 ? -sign : sign;
    var self = this;
    // bod (u, v) v buňkách stěny → 2D obrazovka
    function P(u, v) {
      var x = -h + u * s, w = -h + v * s;
      return self.project(onTop ? [x, -h - 3, w] : [x, w, h + 3]);
    }
    var pad = 0.18, bw = (hi - lo) * 0.47, a1, a2, band;
    if (vertical) {
      a1 = [mid, dir > 0 ? pad : N - pad]; a2 = [mid, dir > 0 ? N - pad : pad];
      band = [P(mid - bw, 0.04), P(mid + bw, 0.04), P(mid + bw, N - 0.04), P(mid - bw, N - 0.04)];
    } else {
      a1 = [dir > 0 ? pad : N - pad, mid]; a2 = [dir > 0 ? N - pad : pad, mid];
      band = [P(0.04, mid - bw), P(N - 0.04, mid - bw), P(N - 0.04, mid + bw), P(0.04, mid + bw)];
    }
    var p1 = P(a1[0], a1[1]), p2 = P(a2[0], a2[1]);
    var dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
    var hl = Math.min(26, len * 0.35), hw = hl * 0.62;
    var base = [p2[0] - ux * hl, p2[1] - uy * hl];
    var head = [p2, [base[0] - uy * hw, base[1] + ux * hw], [base[0] + uy * hw, base[1] - ux * hw]];
    var pts = function (arr) { return arr.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); };
    var line = 'x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + base[0].toFixed(1) + '" y2="' + base[1].toFixed(1) + '"';
    var html = '<polygon points="' + pts(band) + '" class="cv-band"/>' +
      '<line ' + line + ' class="cv-line-o"/><polygon points="' + pts(head) + '" class="cv-head"/>' +
      '<line ' + line + ' class="cv-line"/><polygon points="' + pts(head) + '" class="cv-head-i"/>';
    if (mv.turns === 2) {
      var mx = (p1[0] + base[0]) / 2, my = (p1[1] + base[1]) / 2;
      html += '<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="13" class="cv-badge"/><text x="' + mx.toFixed(1) + '" y="' + my.toFixed(1) + '" class="cv-badge-t">2×</text>';
    }
    svg.innerHTML = html;
  };

  CubeView.HEX = HEX;
  root.CubeView = CubeView;
})(window);
