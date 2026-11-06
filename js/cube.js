/* Rubikovka – simulátor kostky NxN (2×2, 3×3, 4×4 …)
 * Model: seznam nálepek. Každá nálepka má pozici kostičky p=[x,y,z],
 * normálu n (kam míří) a barvu c. Souřadnice: x vpravo, y nahoru, z k pozorovateli.
 * Pozice kostiček jsou -(N-1) … (N-1) po 2 (aby i sudé kostky měly celá čísla).
 * Natočení: U = žlutá, D = bílá, F = zelená, B = modrá, R = oranžová, L = červená.
 */
(function (root) {
  'use strict';

  var FACE_COLORS = { U: 'Y', D: 'W', F: 'G', B: 'B', R: 'O', L: 'R' };
  var FACES = {
    R: { axis: 0, side: 1 }, L: { axis: 0, side: -1 },
    U: { axis: 1, side: 1 }, D: { axis: 1, side: -1 },
    F: { axis: 2, side: 1 }, B: { axis: 2, side: -1 }
  };
  var ROTATIONS = { x: 'R', y: 'U', z: 'F' };

  function faceOfNormal(n) {
    if (n[0] === 1) return 'R'; if (n[0] === -1) return 'L';
    if (n[1] === 1) return 'U'; if (n[1] === -1) return 'D';
    if (n[2] === 1) return 'F'; return 'B';
  }

  function solved(N) {
    var st = [], m = N - 1;
    Object.keys(FACES).forEach(function (f) {
      var a = FACES[f].axis, s = FACES[f].side;
      for (var i = -m; i <= m; i += 2) for (var j = -m; j <= m; j += 2) {
        var p = [0, 0, 0], n = [0, 0, 0], k = 0;
        for (var d = 0; d < 3; d++) {
          if (d === a) { p[d] = s * m; n[d] = s; }
          else { p[d] = k === 0 ? i : j; k++; }
        }
        st.push({ p: p, n: n, c: FACE_COLORS[f], id: st.length });
      }
    });
    return { N: N, st: st };
  }

  function clone(cube) {
    return { N: cube.N, st: cube.st.map(function (s) { return { p: s.p.slice(), n: s.n.slice(), c: s.c, id: s.id }; }) };
  }

  // otočení vektoru o +90° (pravotočivě) kolem osy
  function rot90(v, axis) {
    var x = v[0], y = v[1], z = v[2];
    if (axis === 0) return [x, -z, y];
    if (axis === 1) return [z, y, -x];
    return [-y, x, z];
  }
  function rotQ(v, axis, q) { q = ((q % 4) + 4) % 4; for (var i = 0; i < q; i++) v = rot90(v, axis); return v; }

  var TOKEN = /^([RLUDFBrludfbxyz])(w?)(2?)('?)(2?)$/;

  /* Rozparsuje tah na {axis, q (čtvrtotáčky, + = pravotočivě kolem osy), test(coord)} */
  function parseMove(tok, N) {
    var m = TOKEN.exec(tok);
    if (!m) throw new Error('Neznámý tah: ' + tok);
    var letter = m[1], wide = m[2] === 'w', turns = (m[3] || m[5]) ? 2 : 1, prime = m[4] === "'";
    var whole = false;
    if (ROTATIONS[letter]) { whole = true; letter = ROTATIONS[letter]; }
    else if (letter === letter.toLowerCase()) { wide = true; letter = letter.toUpperCase(); }
    var f = FACES[letter], mx = N - 1;
    var q = -f.side * turns * (prime ? -1 : 1);
    var depth = whole ? N : (wide ? Math.min(2, N) : 1);
    return {
      tok: tok, face: letter, axis: f.axis, side: f.side, q: q, depth: depth, whole: whole, turns: turns, prime: prime,
      test: function (c) { return c * f.side >= mx - 2 * (depth - 1); }
    };
  }

  function applyMove(cube, tok) {
    var mv = parseMove(tok, cube.N);
    cube.st.forEach(function (s) {
      if (mv.test(s.p[mv.axis])) { s.p = rotQ(s.p, mv.axis, mv.q); s.n = rotQ(s.n, mv.axis, mv.q); }
    });
    return cube;
  }

  function tokens(alg) {
    if (Array.isArray(alg)) return alg;
    return String(alg).replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  }
  function apply(cube, alg) { tokens(alg).forEach(function (t) { applyMove(cube, t); }); return cube; }

  function invertTok(t) {
    if (/2'?$/.test(t)) return t.replace("'", '');
    return t.slice(-1) === "'" ? t.slice(0, -1) : t + "'";
  }
  function invert(alg) { return tokens(alg).slice().reverse().map(invertTok); }

  /* barva nálepky na pozici p s normálou n */
  function stickerAt(cube, p, n) {
    for (var i = 0; i < cube.st.length; i++) {
      var s = cube.st[i];
      if (s.n[0] === n[0] && s.n[1] === n[1] && s.n[2] === n[2] && s.p[0] === p[0] && s.p[1] === p[1] && s.p[2] === p[2]) return s;
    }
    return null;
  }

  /* barvy stěny jako 2D pole [řádek][sloupec] při pohledu přímo na stěnu
   * (U: zadní řada nahoře, D: přední řada nahoře – standardní rozložená síť) */
  function faceGrid(cube, face) {
    var N = cube.N, m = N - 1, g = [];
    for (var r = 0; r < N; r++) {
      g.push([]);
      for (var c = 0; c < N; c++) {
        var u = -m + 2 * c, v = m - 2 * r, p, n;
        switch (face) {
          case 'F': p = [u, v, m]; n = [0, 0, 1]; break;
          case 'B': p = [-u, v, -m]; n = [0, 0, -1]; break;
          case 'R': p = [m, v, -u]; n = [1, 0, 0]; break;
          case 'L': p = [-m, v, u]; n = [-1, 0, 0]; break;
          case 'U': p = [u, m, -v]; n = [0, 1, 0]; break;
          case 'D': p = [u, -m, v]; n = [0, -1, 0]; break;
        }
        g[r].push(stickerAt(cube, p, n));
      }
    }
    return g;
  }

  function isSolved(cube) {
    var byFace = {};
    return cube.st.every(function (s) {
      var f = faceOfNormal(s.n);
      if (!byFace[f]) byFace[f] = s.c;
      return byFace[f] === s.c;
    });
  }

  /* stav hotový až na natočení horní vrstvy (AUF) – vrátí potřebný tah nebo null */
  function solvedUpToAUF(cube) {
    var opts = ['', 'U', 'U2', "U'"];
    for (var i = 0; i < opts.length; i++) {
      var c = clone(cube); if (opts[i]) applyMove(c, opts[i]);
      if (isSolved(c)) return opts[i] || 'hotovo';
    }
    return null;
  }

  /* nálepky kostičky na pozici p */
  function piece(cube, p) {
    return cube.st.filter(function (s) { return s.p[0] === p[0] && s.p[1] === p[1] && s.p[2] === p[2]; });
  }

  function randomScramble(N, len) {
    var faces = N === 2 ? ['R', 'U', 'F'] : ['R', 'L', 'U', 'D', 'F', 'B'];
    var axisOf = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
    var out = [], lastAxis = -1, lastFace = '';
    while (out.length < len) {
      var f = faces[Math.floor(Math.random() * faces.length)];
      if (f === lastFace) continue;
      if (axisOf[f] === lastAxis && N > 2 && out.length > 1 && axisOf[out[out.length - 2][0]] === lastAxis) continue;
      if (N >= 4 && Math.random() < 0.3) f = f + 'w';
      var suf = ['', "'", '2'][Math.floor(Math.random() * 3)];
      out.push(f + suf); lastFace = f[0]; lastAxis = axisOf[f[0]];
    }
    return out;
  }

  var api = {
    FACE_COLORS: FACE_COLORS, solved: solved, clone: clone, parseMove: parseMove, applyMove: applyMove,
    apply: apply, tokens: tokens, invert: invert, invertTok: invertTok, stickerAt: stickerAt, faceGrid: faceGrid,
    isSolved: isSolved, solvedUpToAUF: solvedUpToAUF, piece: piece, faceOfNormal: faceOfNormal,
    randomScramble: randomScramble, rotQ: rotQ
  };
  root.Cube = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
