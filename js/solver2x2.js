/* Rubikovka – logika kroků pro 2×2 (rozpoznání situace a doporučený další postup).
 * Kostka se drží žlutou nahoru, bílou dolů, zelenou k sobě. */
(function (root) {
  'use strict';
  var C = root.Cube || (typeof require !== 'undefined' ? require('./cube.js') : null);

  var AUFS = ['', 'U', 'U2', "U'"];
  var POS = { UFL: [-1, 1, 1], UFR: [1, 1, 1], UBR: [1, 1, -1], UBL: [-1, 1, -1] };
  var ORDER = ['UFL', 'UFR', 'UBR', 'UBL'];

  function withMoves(cube, alg) { return alg ? C.apply(C.clone(cube), alg) : C.clone(cube); }
  function pieceOk(cube, p) {
    return C.piece(cube, p).every(function (s) { return s.c === C.FACE_COLORS[C.faceOfNormal(s.n)]; });
  }
  function facing(cube, p, color) {
    var s = C.piece(cube, p).filter(function (x) { return x.c === color; })[0];
    return s ? C.faceOfNormal(s.n) : '-';
  }

  /* ---------- Krok 1: bílá vrstva ---------- */
  var DCORNERS = [[1, -1, 1], [1, -1, -1], [-1, -1, 1], [-1, -1, -1]];
  // spodní vrstva je hotová, pokud jsou rohy dole bílou dolů a sousední boční barvy sedí
  function whiteLayerDone(cube) {
    var g = {}, ok = true;
    DCORNERS.forEach(function (p) {
      C.piece(cube, p).forEach(function (s) {
        var f = C.faceOfNormal(s.n);
        if (f === 'D') { if (s.c !== 'W') ok = false; }
        else { if (g[f] && g[f] !== s.c) ok = false; g[f] = s.c; }
      });
    });
    return ok;
  }
  function whiteCornersDown(cube) {
    return DCORNERS.filter(function (p) { return facing(cube, p, 'W') === 'D'; }).length;
  }

  /* ---------- Krok 2: žlutá nahoře ---------- */
  function ollSig(cube) { return ORDER.map(function (k) { return facing(cube, POS[k], 'Y'); }).join(''); }
  function yellowUp(cube) { return ORDER.filter(function (k) { return facing(cube, POS[k], 'Y') === 'U'; }).length; }
  function ollDone(cube) { return yellowUp(cube) === 4; }

  var OLL_CASES = [
    { id: 'sune', name: 'Sune', alg: "R U R' U R U2 R'" },
    { id: 'antisune', name: 'Antisune', alg: "R U2 R' U' R U' R'" },
    { id: 'h', name: 'H', alg: "R2 U2 R U2 R2" },
    { id: 'pi', name: 'Pi', alg: "F R U R' U' R U R' U' F'" },
    { id: 'u', name: 'U (světla)', alg: "F R U R' U' F'" },
    { id: 't', name: 'T', alg: "R U R' U' R' F R F'" },
    { id: 'l', name: 'L (úhlopříčka)', alg: "F R' F' R U R U' R'" }
  ];
  OLL_CASES.forEach(function (c) { c.sig = ollSig(C.apply(C.solved(2), C.invert(c.alg))); });

  /* najde, který ze 7 případů to je a jak natočit U */
  function matchOll(cube) {
    for (var i = 0; i < OLL_CASES.length; i++) for (var a = 0; a < 4; a++) {
      if (ollSig(withMoves(cube, AUFS[a])) === OLL_CASES[i].sig) return { kase: OLL_CASES[i], auf: AUFS[a] };
    }
    return null;
  }

  /* varianta B – jen Sune: pravidlo, jak natočit horní vrstvu */
  function suneRule(cube) {
    var n = yellowUp(cube);
    var want = n === 1 ? 'U' : n === 0 ? 'L' : 'F';
    for (var a = 0; a < 4; a++) {
      var c = withMoves(cube, AUFS[a]);
      if (facing(c, POS.UFL, 'Y') === want) return { count: n, auf: AUFS[a] };
    }
    return null;
  }

  /* varianta A – vrtání rohu R' D' R D */
  var DRILL = "R' D' R D";
  function drillPlan(cube) {
    var c = C.clone(cube), segs = [], guard = 0;
    while (!ollDone(c) && guard++ < 8) {
      for (var a = 0; a < 4; a++) {
        var t = withMoves(c, AUFS[a]);
        if (facing(t, POS.UFR, 'Y') !== 'U') {
          if (AUFS[a]) segs.push({ alg: AUFS[a], times: 1, note: 'otoč jen horní vrstvu' });
          c = t; break;
        }
      }
      var f = facing(c, POS.UFR, 'Y'), times = f === 'R' ? 2 : 4;
      segs.push({ alg: DRILL, times: times, note: 'žlutá míří ' + (f === 'R' ? 'doprava' : 'k tobě') });
      for (var i = 0; i < times; i++) C.apply(c, DRILL);
    }
    return segs;
  }

  /* ---------- Krok 3: dorovnání rohů ---------- */
  var TPERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
  var YPERM = "F R U' R' U' R U R' F' R U R' U' R' F R F'";
  // varianta „světla dolů“: kostka otočená bílou k sobě (x), pak 9 tahů jen R, U, D
  var LIGHTSDOWN = "R' U R' D2 R U' R' D2 R2";
  function lights(cube) {
    return ['F', 'R', 'B', 'L'].filter(function (f) {
      var g = C.faceGrid(cube, f); return g[0][0].c === g[0][1].c;
    });
  }
  // side = kam natočit světla (T-perm: vlevo, varianta „světla dolů“: dozadu)
  function pblInfo(cube, side) {
    var l = lights(cube);
    if (l.length === 4) return { id: 'solved', auf: C.solvedUpToAUF(cube) };
    if (l.length === 0) return { id: 'diag' };
    for (var a = 0; a < 4; a++) {
      if (lights(withMoves(cube, AUFS[a])).indexOf(side || 'L') >= 0) return { id: 'adj', auf: AUFS[a] };
    }
    return { id: 'adj', auf: '' };
  }

  /* ---------- Univerzální „co dál?“ ---------- */
  function segsToMoves(segs) {
    var out = [];
    segs.forEach(function (s, gi) {
      for (var i = 0; i < (s.times || 1); i++) C.tokens(s.alg).forEach(function (t) { out.push({ tok: t, group: gi, rep: i }); });
    });
    return out;
  }

  function nextFor(step, variant, cube) {
    if (step === 'bila') {
      if (whiteLayerDone(cube)) return { done: true };
      return { done: false, text: 'Bílá vrstva ještě není hotová – najdi další bílý roh a vyber jeho situaci.' };
    }
    if (step === 'zluta') {
      if (!whiteLayerDone(cube) && !ollDone(cube)) {
        // u vrtání je spodek během práce rozházený – to je v pořádku
        if (variant !== 'A') return { done: false, text: 'Spodní vrstva není složená – vrať se ke kroku 01.' };
      }
      if (ollDone(cube)) return { done: true };
      if (variant === 'A') return { done: false, label: 'Pokračuj vrtáním', segs: drillPlan(cube) };
      if (variant === 'B') {
        var r = suneRule(cube); if (!r) return null;
        var segs = []; if (r.auf) segs.push({ alg: r.auf, times: 1, note: 'natoč horní vrstvu' });
        segs.push({ alg: OLL_CASES[0].alg, times: 1, note: 'Sune' });
        return { done: false, label: r.count + ' žlut' + (r.count === 1 ? 'á' : r.count === 0 ? 'ých' : 'é') + ' nahoře → Sune', segs: segs, count: r.count };
      }
      var m = matchOll(cube); if (!m) return null;
      var s2 = []; if (m.auf) s2.push({ alg: m.auf, times: 1, note: 'natoč horní vrstvu' });
      s2.push({ alg: m.kase.alg, times: 1, note: m.kase.name });
      return { done: false, label: m.kase.name, caseId: m.kase.id, segs: s2 };
    }
    if (step === 'rohy') {
      if (!ollDone(cube)) return { done: false, text: 'Nahoře ještě není všechno žluté – vrať se ke kroku 02.' };
      if (C.isSolved(cube)) return { done: true, solved: true };
      var p = pblInfo(cube, variant === 'C' ? 'B' : 'L'), sg = [];
      if (p.id === 'solved') return { done: false, label: 'Jen dorovnej horní vrstvu', caseId: 'solved', segs: [{ alg: p.auf, times: 1, note: 'poslední otočení' }] };
      if (variant === 'C') {
        if (p.id === 'adj' && p.auf) sg.push({ alg: p.auf, times: 1, note: 'světla dozadu' });
        sg.push({ alg: 'x', times: 1, note: 'bílou k sobě, světla dolů' });
        sg.push({ alg: LIGHTSDOWN, times: 1, note: 'prohození rohů' });
        sg.push({ alg: "x'", times: 1, note: 'zpět žlutou nahoru' });
        return { done: false, caseId: p.id, segs: sg,
          label: p.id === 'adj' ? 'Světla dozadu → světla dolů' : 'Žádná světla → algoritmus odkudkoliv (vytvoří světla)' };
      }
      if (p.id === 'adj') {
        if (p.auf) sg.push({ alg: p.auf, times: 1, note: 'světla doleva' });
        sg.push({ alg: TPERM, times: 1, note: 'T-perm' });
        return { done: false, label: 'Světla na jedné straně → T-perm', caseId: 'adj', segs: sg };
      }
      if (variant === 'B') return { done: false, label: 'Žádná světla → Y-perm', caseId: 'diag', segs: [{ alg: YPERM, times: 1, note: 'Y-perm' }] };
      return { done: false, label: 'Žádná světla → T-perm odkudkoliv', caseId: 'diag', segs: [{ alg: TPERM, times: 1, note: 'T-perm (vytvoří světla)' }] };
    }
    return null;
  }

  var api = {
    AUFS: AUFS, OLL_CASES: OLL_CASES, TPERM: TPERM, YPERM: YPERM, LIGHTSDOWN: LIGHTSDOWN, DRILL: DRILL,
    whiteLayerDone: whiteLayerDone, whiteCornersDown: whiteCornersDown, ollSig: ollSig, yellowUp: yellowUp, ollDone: ollDone,
    matchOll: matchOll, suneRule: suneRule, drillPlan: drillPlan, lights: lights, pblInfo: pblInfo,
    nextFor: nextFor, segsToMoves: segsToMoves, pieceOk: pieceOk, facing: facing
  };
  root.Solver2 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
