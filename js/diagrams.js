/* Rubikovka – 2D náhledy situací (SVG) generované přímo ze stavu kostky,
 * takže obrázek vždy přesně odpovídá algoritmu. */
(function (root) {
  'use strict';
  var C = root.Cube;
  var HEX = { W: '#ffffff', Y: '#ffd500', G: '#06a35a', B: '#1f5fd1', R: '#d62839', O: '#ff7a1a' };
  function col(c) { return c === 'X' ? 'var(--diag-x)' : (HEX[c] || c); }
  function f1(n) { return Math.round(n * 10) / 10; }

  /* Pohled shora: horní stěna + proužky bočních nálepek horní vrstvy.
   * opts.sides: 'all' | 'yellow' (ukáže jen žluté boční nálepky) */
  function topView(cube, mask, opts) {
    opts = opts || {};
    var N = cube.N, cell = 80 / N, o = 19, gap = 7, th = 6, size = opts.size || 128;
    var col_ = function (s) { return s ? (mask ? mask(s, cube) : s.c) : 'X'; };
    var out = ['<svg viewBox="0 0 118 118" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'];
    var U = C.faceGrid(cube, 'U');
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      out.push('<rect x="' + f1(o + c * cell) + '" y="' + f1(o + r * cell) + '" width="' + f1(cell) + '" height="' + f1(cell) + '" fill="' + col(col_(U[r][c])) + '" stroke="var(--diag-bd)" stroke-width="2"/>');
    }
    var sides = {
      B: C.faceGrid(cube, 'B')[0], F: C.faceGrid(cube, 'F')[0],
      L: C.faceGrid(cube, 'L')[0], R: C.faceGrid(cube, 'R')[0]
    };
    var showSide = function (cc) { return opts.sides === 'yellow' ? cc === 'Y' : cc !== 'X'; };
    var pad = cell * 0.12;
    for (var i = 0; i < N; i++) {
      var b = col_(sides.B[N - 1 - i]), f = col_(sides.F[i]), l = col_(sides.L[i]), rr = col_(sides.R[N - 1 - i]);
      var a = o + i * cell + pad, w = cell - 2 * pad;
      if (showSide(b)) out.push('<rect x="' + f1(a) + '" y="' + (o - gap - th) + '" width="' + f1(w) + '" height="' + th + '" rx="1.5" fill="' + col(b) + '" stroke="var(--diag-bd)" stroke-width=".8"/>');
      if (showSide(f)) out.push('<rect x="' + f1(a) + '" y="' + (o + 80 + gap) + '" width="' + f1(w) + '" height="' + th + '" rx="1.5" fill="' + col(f) + '" stroke="var(--diag-bd)" stroke-width=".8"/>');
      if (showSide(l)) out.push('<rect x="' + (o - gap - th) + '" y="' + f1(a) + '" width="' + th + '" height="' + f1(w) + '" rx="1.5" fill="' + col(l) + '" stroke="var(--diag-bd)" stroke-width=".8"/>');
      if (showSide(rr)) out.push('<rect x="' + (o + 80 + gap) + '" y="' + f1(a) + '" width="' + th + '" height="' + f1(w) + '" rx="1.5" fill="' + col(rr) + '" stroke="var(--diag-bd)" stroke-width=".8"/>');
    }
    out.push('<rect x="' + o + '" y="' + o + '" width="80" height="80" fill="none" stroke="var(--diag-bd)" stroke-width="3"/>');
    if (opts.arrows) out.push(opts.arrows);
    out.push('</svg>');
    return out.join('');
  }

  /* Izometrický náhled (stěny U, F, R). opts.highlight: [{p:[x,y,z]}] zvýrazní kostičky */
  function iso(cube, mask, opts) {
    opts = opts || {};
    var N = cube.N, m = N - 1, size = opts.size || 136;
    var k = 36 / N; // měřítko (polovina kostičky)
    var c30 = Math.cos(Math.PI / 6), s30 = 0.5;
    function P(x, y, z) { return [f1(80 + (x - z) * c30 * k), f1(80 - y * k + (x + z) * s30 * k)]; }
    var out = ['<svg viewBox="0 0 160 160" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'];
    var hl = [];
    var faces = [{ n: [0, 1, 0], a: 0, b: 2 }, { n: [0, 0, 1], a: 0, b: 1 }, { n: [1, 0, 0], a: 2, b: 1 }];
    faces.forEach(function (fd) {
      cube.st.forEach(function (s) {
        if (s.n[0] !== fd.n[0] || s.n[1] !== fd.n[1] || s.n[2] !== fd.n[2]) return;
        var c = [s.p[0] + s.n[0], s.p[1] + s.n[1], s.p[2] + s.n[2]];
        var pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (d) {
          var q = c.slice(); q[fd.a] += d[0] * 0.92; q[fd.b] += d[1] * 0.92; return P(q[0], q[1], q[2]).join(',');
        });
        var cc = mask ? mask(s, cube) : s.c;
        var poly = '<polygon points="' + pts.join(' ') + '" fill="' + col(cc) + '" stroke="var(--diag-bd)" stroke-width="1.6" stroke-linejoin="round"/>';
        out.push(poly);
        if (opts.highlight && opts.highlight.some(function (h) { return h[0] === s.p[0] && h[1] === s.p[1] && h[2] === s.p[2]; })) {
          hl.push('<polygon points="' + pts.join(' ') + '" fill="none" stroke="var(--cy)" stroke-width="3.2" stroke-linejoin="round"/>');
        }
      });
    });
    // obrys kostky
    var cs = [P(-N, N, -N), P(N, N, -N), P(N, N, N), P(N, -N, N), P(-N, -N, N), P(-N, N, N)];
    out.push('<polygon points="' + cs.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="var(--diag-bd)" stroke-width="2.4" stroke-linejoin="round"/>');
    out.push(hl.join(''));
    if (opts.slot) {
      var sp = opts.slot, sc = [sp[0], sp[1], sp[2]];
      // naznačí volné místo (čárkovaně) na přední a pravé stěně
      [[{ a: 0, b: 1 }, [0, 0, 1]], [{ a: 2, b: 1 }, [1, 0, 0]]].forEach(function (fd) {
        var n = fd[1], cc2 = [sc[0] + n[0], sc[1] + n[1], sc[2] + n[2]];
        var pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (d) { var q = cc2.slice(); q[fd[0].a] += d[0] * 0.92; q[fd[0].b] += d[1] * 0.92; return P(q[0], q[1], q[2]).join(','); });
        out.push('<polygon points="' + pts.join(' ') + '" fill="none" stroke="var(--cy)" stroke-width="2.4" stroke-dasharray="4 3" stroke-linejoin="round"/>');
      });
    }
    out.push('</svg>');
    return out.join('');
  }

  root.Diagrams = { topView: topView, iso: iso, HEX: HEX };
})(window);
