/* Rubikovka – aplikace: přehrávač algoritmů, kroky průvodce, procvičování a stopky. */
(function () {
  'use strict';
  var C = window.Cube, S = window.Solver2, D = window.Diagrams;
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var PUZZLES = {
    '2x2': { N: 2, guide: window.Guide2, label: '2×2', note: 'průvodce', name: 'Pocket cube', lvl: 'pro úplné začátečníky',
      desc: 'Nejmenší kostka – jen 8 rohů. Ideální start: naučíš se notaci a pár algoritmů, které pak využiješ i na větších kostkách.',
      meta: ['3 kroky', '4–7 algoritmů', 'trénink se stopkami'] },
    '3x3': { N: 3, label: '3×3', note: 'připravuji', name: 'Klasika', lvl: 'zatím pískoviště',
      desc: 'Klasická Rubikova kostka. Průvodce po vrstvách a cesta k F2L a 4-look poslední vrstvě se připravuje.',
      meta: ['metoda po vrstvách', 'F2L · OLL · PLL'] },
    '4x4': { N: 4, label: '4×4', note: 'připravuji', name: 'Revenge', lvl: 'zatím pískoviště',
      desc: 'Středy, párování hran, pak dál jako 3×3 – a k tomu dvě parity, které na 3×3 nepotkáš. Průvodce se připravuje.',
      meta: ['redukce na 3×3', 'parity'] }
  };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('rubikovka.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('rubikovka.' + k, JSON.stringify(v)); } catch (e) { /* bez úložiště */ } }
  };

  var app = {
    view: 'home', puzzle: '2x2', step: 'notace',
    variants: store.get('variants', { zluta: 'B', rohy: 'A' }),
    done: store.get('done', {}),
    quiz: null
  };

  /* ---------------------------------------------------------------- texty tahů */
  var MOVE_TXT = {
    R: ['pravou vrstvu', 'nahoru (od sebe)', 'dolů (k sobě)'],
    L: ['levou vrstvu', 'dolů (k sobě)', 'nahoru (od sebe)'],
    U: ['horní vrstvu', 'doleva', 'doprava'],
    D: ['spodní vrstvu', 'doprava', 'doleva'],
    F: ['přední stěnu', 'po směru hodinových ručiček', 'proti směru hodinových ručiček'],
    B: ['zadní stěnu', 'tak, aby horní řada šla doleva', 'tak, aby horní řada šla doprava'],
    x: ['celou kostku', 'dopředu nahoru (přední stěna jde nahoru)', 'dolů (přední stěna jde dolů)'],
    y: ['celou kostku', 'doleva (jako U)', 'doprava (jako U\')'],
    z: ['celou kostku', 'doprava (jako F)', 'doleva (jako F\')']
  };
  var WIDE = { R: 'dvě pravé vrstvy', L: 'dvě levé vrstvy', U: 'dvě horní vrstvy', D: 'dvě spodní vrstvy', F: 'dvě přední vrstvy', B: 'dvě zadní vrstvy' };
  function moveText(tok) {
    var m = /^([RLUDFBrludfbxyz])(w?)(2?)('?)/.exec(tok); if (!m) return '';
    var L = m[1], rot = 'xyz'.indexOf(L) >= 0, wide = m[2] === 'w' || (!rot && L !== L.toUpperCase());
    var key = rot ? L : L.toUpperCase(), t = MOVE_TXT[key], name = wide ? WIDE[key] : t[0];
    if (m[3] === '2') return 'Otoč ' + name + ' dvakrát (o 180°)';
    return 'Otoč ' + name + ' ' + (m[4] ? t[2] : t[1]);
  }

  /* ---------------------------------------------------------------- masky barev */
  function hasColor(cube, p, c) { return C.piece(cube, p).some(function (s) { return s.c === c; }); }
  var MASKS = {
    full: null,
    white: function (s, cube) { return hasColor(cube, s.p, 'W') ? s.c : 'X'; },
    oll: function (s, cube) { return s.c === 'Y' ? 'Y' : (hasColor(cube, s.p, 'W') ? s.c : 'X'); },
    yellow: function (s) { return s.c === 'Y' ? 'Y' : 'X'; }
  };

  var ICONS = {
    play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>',
    next: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5v11l7-5.5z"/><rect x="11" y="2.5" width="2.2" height="11" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13 2.5v11l-7-5.5z"/><rect x="2.8" y="2.5" width="2.2" height="11" rx="1"/></svg>',
    reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.5v3h3"/></svg>'
  };

  /* ================================================================ PŘEHRÁVAČ */
  function Player(el) {
    this.el = el; this.N = 0; this.speed = store.get('speed', 1); this.allColors = false;
    this.moves = []; this.segs = []; this.idx = 0; this.busy = false; this.playing = false;
    el.innerHTML =
      '<div class="panel player">' +
      '<div class="pl-head"><div><div class="pl-sub" data-r="sub"></div><div class="pl-title" data-r="title"></div></div>' +
      '<div style="display:flex;gap:6px"><button class="icon-btn" data-r="colors" title="Zobrazit všechny barvy">barvy</button><button class="icon-btn" data-r="view" title="Vrátit pohled">pohled</button></div></div>' +
      '<div class="cv-wrap"><div data-r="cube" style="width:100%;height:100%"></div><div class="cv-hint">táhni = otočit pohled</div></div>' +
      '<div class="caption"><div class="big" data-r="big"></div><div class="txt" data-r="txt"></div></div>' +
      '<div class="segs" data-r="segs"></div>' +
      '<div class="controls">' +
      '<button class="ctrl" data-r="reset" title="Na začátek">' + ICONS.reset + '</button>' +
      '<button class="ctrl" data-r="prev" title="Tah zpět (←)">' + ICONS.prev + '</button>' +
      '<button class="ctrl primary" data-r="play" title="Přehrát (mezerník)">' + ICONS.play + '<span>Přehrát</span></button>' +
      '<button class="ctrl" data-r="next" title="Další tah (→)">' + ICONS.next + '</button>' +
      '<span class="ctrl-sp"></span><button class="ctrl speed" data-r="speed" title="Rychlost"></button></div>' +
      '<div class="after" data-r="after"></div></div>';
    var r = {}; $$('[data-r]', el).forEach(function (n) { r[n.getAttribute('data-r')] = n; }); this.r = r;
    var self = this;
    r.play.onclick = function () { self.togglePlay(); };
    r.next.onclick = function () { self.stop(); self.step(1); };
    r.prev.onclick = function () { self.stop(); self.step(-1); };
    r.reset.onclick = function () { self.stop(); self.jump(0); };
    r.view.onclick = function () { self.view.resetView(); };
    r.colors.onclick = function () { self.allColors = !self.allColors; r.colors.classList.toggle('on', self.allColors); r.colors.style.color = self.allColors ? 'var(--cy)' : ''; self.paint(); };
    r.speed.onclick = function () { self.speed = self.speed === 1 ? 2 : self.speed === 2 ? 0.5 : 1; store.set('speed', self.speed); self.renderSpeed(); };
    r.segs.onclick = function (e) { var b = e.target.closest('.chip'); if (b) { self.stop(); self.jump(+b.getAttribute('data-i') + 1); } };
    this.renderSpeed();
  }
  Player.prototype.renderSpeed = function () { this.r.speed.textContent = (this.speed === 0.5 ? '½' : this.speed) + '×'; };
  Player.prototype.ensureView = function (N) {
    if (this.N === N && this.view) return;
    this.N = N;
    var small = window.innerWidth < 480, size = small ? 150 : 180;
    this.el.querySelector('.cv-wrap').style.setProperty('--stage-h', Math.round(size * 1.75) + 'px');
    this.view = new window.CubeView(this.r.cube, N, { size: size });
  };
  Player.prototype.mask = function () { return this.allColors ? null : MASKS[this.maskName] || null; };
  Player.prototype.paint = function () { this.view.setState(this.cube, this.mask()); };

  /* opts: {title, sub, cube, segs, mask, step, variant, text, free} */
  Player.prototype.load = function (opts) {
    this.stop();
    this.opts = opts;
    this.ensureView(opts.cube.N);
    this.maskName = opts.mask || 'full';
    this.start = C.clone(opts.cube);
    this.cube = C.clone(opts.cube);
    this.segs = opts.segs || [];
    this.moves = S.segsToMoves(this.segs);
    this.idx = 0;
    this.r.title.innerHTML = opts.title || '';
    this.r.sub.textContent = opts.sub || '';
    this.renderSegs();
    this.paint();
    this.update();
  };
  Player.prototype.renderSegs = function () {
    var html = '', mv = this.moves, i = 0;
    if (!mv.length) { this.r.segs.innerHTML = ''; return; }
    this.segs.forEach(function (sg, gi) {
      for (var rr = 0; rr < (sg.times || 1); rr++) {
        var label = (sg.note || '') + ((sg.times || 1) > 1 ? ' · ' + (rr + 1) + '/' + sg.times : '');
        html += '<div class="seg"><div class="seg-l">' + label + '</div><div class="chips">';
        while (i < mv.length && mv[i].group === gi && mv[i].rep === rr) { html += '<button class="chip" data-i="' + i + '">' + mv[i].tok + '</button>'; i++; }
        html += '</div></div>';
      }
    });
    this.r.segs.innerHTML = html;
  };
  Player.prototype.update = function () {
    var r = this.r, n = this.moves.length, idx = this.idx;
    $$('.chip', r.segs).forEach(function (b, i) { b.classList.toggle('past', i < idx); b.classList.toggle('cur', i === idx); });
    r.prev.disabled = idx === 0; r.next.disabled = idx >= n; r.reset.disabled = idx === 0;
    r.play.disabled = n === 0;
    r.play.innerHTML = (this.playing ? ICONS.pause + '<span>Pauza</span>' : ICONS.play + '<span>' + (idx >= n && n ? 'Znovu' : 'Přehrát') + '</span>');
    if (n && idx < n) {
      var t = this.moves[idx].tok;
      r.big.textContent = t;
      r.txt.innerHTML = '<small>Tah ' + (idx + 1) + ' z ' + n + '</small>' + moveText(t);
      if (!this.busy) this.view.showArrow(t);
    } else {
      this.view.showArrow(null);
      if (n && this.opts && this.opts.free) { var lt = this.moves[n - 1].tok; r.big.textContent = lt; r.txt.innerHTML = '<small>Poslední tah</small>' + moveText(lt); }
      else if (n) { r.big.textContent = '✓'; r.txt.innerHTML = '<small>Hotovo</small>Algoritmus je dokončený.'; }
      else { r.big.textContent = this.opts && this.opts.big || '·'; r.txt.innerHTML = (this.opts && this.opts.text) || 'Vyber situaci a kostka ti ji ukáže.'; }
    }
    this.renderAfter();
  };
  Player.prototype.step = function (dir) {
    var self = this;
    if (this.busy) return Promise.resolve(false);
    var tok;
    if (dir > 0) { if (this.idx >= this.moves.length) return Promise.resolve(false); tok = this.moves[this.idx].tok; }
    else { if (this.idx <= 0) return Promise.resolve(false); tok = C.invertTok(this.moves[this.idx - 1].tok); }
    this.busy = true; this.view.showArrow(null);
    var mv = C.parseMove(tok, this.N), ms = Math.round((mv.turns === 2 ? 560 : 380) / this.speed);
    return this.view.animateMove(tok, ms).then(function () {
      C.applyMove(self.cube, tok); self.idx += dir; self.busy = false; self.paint(); self.update(); return true;
    });
  };
  Player.prototype.jump = function (k) {
    if (this.busy) return;
    this.cube = C.clone(this.start);
    for (var i = 0; i < k; i++) C.applyMove(this.cube, this.moves[i].tok);
    this.idx = k; this.paint(); this.update();
  };
  Player.prototype.togglePlay = function () {
    if (this.playing) { this.stop(); return; }
    if (!this.moves.length) return;
    if (this.idx >= this.moves.length) this.jump(0);
    this.playing = true; this.update();
    var self = this;
    (function loop() {
      if (!self.playing) return;
      if (self.idx >= self.moves.length) { self.playing = false; self.update(); return; }
      self.step(1).then(function () { setTimeout(loop, 110 / self.speed); });
    })();
  };
  Player.prototype.stop = function () { if (this.playing) { this.playing = false; this.update(); } };
  /* volné tahy (sandbox v notaci) */
  Player.prototype.free = function (tok) {
    if (this.busy) return;
    if (!this.opts || !this.opts.free) {
      this.load({ title: 'Tvoje tahy', sub: 'Pískoviště', cube: this.cube || C.solved(this.N), segs: [], free: true, text: 'Klikej na tahy a sleduj, co dělají.' });
    }
    if (this.idx < this.moves.length) { this.moves = this.moves.slice(0, this.idx); }
    this.segs = [{ alg: '', note: 'tvoje tahy' }];
    this.moves.push({ tok: tok, group: 0, rep: 0 });
    if (this.moves.length > 40) { // ať se seznam nenafukuje donekonečna
      var drop = this.moves.length - 40;
      for (var i = 0; i < drop; i++) C.applyMove(this.start, this.moves[i].tok);
      this.moves = this.moves.slice(drop); this.idx -= drop;
    }
    this.renderSegs(); this.update(); this.step(1);
  };
  Player.prototype.renderAfter = function () {
    var a = this.r.after, o = this.opts || {};
    a.className = 'after'; a.innerHTML = '';
    if (this.busy || this.playing || o.free || o.noAfter || !o.step || this.idx < this.moves.length) return;
    if (o.step !== 'bila' && o.step !== 'zluta' && o.step !== 'rohy') return;
    if (!this.moves.length && o.step === 'bila') return;
    var res = S.nextFor(o.step, o.variant, this.cube); if (!res) return;
    var self = this, guide = PUZZLES[app.puzzle].guide, si = stepIndex(o.step);
    if (res.done) {
      a.className = 'after show ok';
      if (res.solved) {
        a.innerHTML = '<b>🎉 Kostka je složená!</b><br>Zkus si to teď celé na vlastní kostce, nebo si v tréninku změř čas.' +
          '<div><button class="btn" data-a="go">Na trénink →</button></div>';
        $('[data-a=go]', a).onclick = function () { markDone(o.step); go('hotovo'); };
      } else {
        var nx = guide.steps[si + 1];
        a.innerHTML = '<b>✓ Krok ' + guide.steps[si].num + ' je splněný.</b> ' + (nx ? 'Pokračuj krokem ' + nx.num + ' – ' + nx.title + '.' : '') +
          (nx ? '<div><button class="btn" data-a="go">Další krok →</button></div>' : '');
        if (nx) $('[data-a=go]', a).onclick = function () { markDone(o.step); go(nx.id); };
      }
    } else if (res.segs) {
      a.className = 'after show next';
      a.innerHTML = '<b>Co dál?</b> Teď máš: <b>' + res.label + '</b>' +
        '<div><button class="btn" data-a="cont">Pokračovat ' + ICONS.play.replace('<svg', '<svg width="12" height="12"') + '</button></div>';
      $('[data-a=cont]', a).onclick = function () {
        self.load({ title: res.label, sub: 'Pokračování', cube: self.cube, segs: res.segs, mask: o.mask, step: o.step, variant: o.variant });
        highlightCase(res);
        self.togglePlay();
      };
    } else if (res.text) {
      a.className = 'after show next'; a.innerHTML = res.text;
    }
  };

  /* ================================================================ RENDER */
  var player;
  function guide() { return PUZZLES[app.puzzle].guide; }
  function stepIndex(id) { var g = guide(); for (var i = 0; i < g.steps.length; i++) if (g.steps[i].id === id) return i; return 0; }
  function curStep() { return guide().steps[stepIndex(app.step)]; }
  function markDone(id) { app.done[id] = true; store.set('done', app.done); renderStepper(); }

  function go(stepId, noScroll) {
    app.step = stepId; app.quiz = null;
    history.replaceState(null, '', '#/' + app.puzzle + '/' + stepId);
    store.set('last', { puzzle: app.puzzle, step: stepId });
    render();
    if (!noScroll) { var t = $('#stepper'); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 12, behavior: 'smooth' }); }
  }

  function renderPuzzles() {
    $('#puzzles').innerHTML = Object.keys(PUZZLES).map(function (k) {
      var p = PUZZLES[k], n = p.N, g = '';
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) g += '<rect x="' + (1 + j * 20 / n) + '" y="' + (1 + i * 20 / n) + '" width="' + (20 / n - 1.4) + '" height="' + (20 / n - 1.4) + '" rx="1" fill="' + (k === app.puzzle ? 'var(--cy)' : 'var(--dim)') + '" opacity="' + (k === app.puzzle ? 1 : .5) + '"/>';
      return '<button class="pz' + (k === app.puzzle ? ' on' : '') + '" data-pz="' + k + '"><svg class="ic" viewBox="0 0 22 22">' + g + '</svg>' + p.label + ' <small>' + p.note + '</small></button>';
    }).join('');
    $$('#puzzles [data-pz]').forEach(function (b) {
      b.onclick = function () {
        app.puzzle = b.getAttribute('data-pz');
        app.step = PUZZLES[app.puzzle].guide ? 'notace' : 'soon';
        history.replaceState(null, '', '#/' + app.puzzle + (PUZZLES[app.puzzle].guide ? '/' + app.step : ''));
        render();
      };
    });
  }

  function renderStepper() {
    var g = guide(), el = $('#stepper');
    if (!g) { el.innerHTML = ''; return; }
    el.innerHTML = g.steps.map(function (s) {
      return '<button data-step="' + s.id + '" class="' + (s.id === app.step ? 'on ' : '') + (app.done[s.id] ? 'done' : '') + '"><span>' + s.num + '</span>' + s.title + '</button>';
    }).join('');
    $$('#stepper [data-step]').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-step'), true); }; });
    var st = curStep();
    $('#bar-step').textContent = st.num === '✓' ? 'trénink' : (st.num + ' / 03');
  }

  function render() {
    var home = app.view === 'home';
    $('#home').hidden = !home; $('#guide-view').hidden = home;
    if (home) { renderHome(); return; }
    document.title = 'Rubikovka – kostka ' + PUZZLES[app.puzzle].label + ' krok za krokem';
    if (PUZZLES[app.puzzle].guide) store.set('last', { puzzle: app.puzzle, step: app.step });
    renderPuzzles();
    var p = PUZZLES[app.puzzle];
    $('#bar-model').textContent = p.label;
    if (!p.guide) { $('#stepper').innerHTML = ''; $('#bar-step').textContent = '—'; renderSoon(p); return; }
    renderStepper();
    var st = curStep(), html = '';
    html += '<div class="lbl">// ' + (st.num === '✓' ? 'Hotovo' : 'Krok ' + st.num) + ' · ' + st.long + '</div><h2>' + st.title + '</h2>';
    if (st.timer) { renderTraining(); return; }
    if (st.intro) html += st.intro;
    if (st.goal) {
      var gt = st.goal.thumb();
      html += '<div class="panel goal">' + thumbSvg(gt.cube, gt.kind, gt.mask, { sides: gt.sides, size: 96 }) + '<p>' + st.goal.html + '</p></div>';
    }
    if (st.body) html += st.body.replace('{{compass}}', D.topView(C.solved(2), null, { size: 120 })).replace('{{sandbox}}', sandboxHtml(2));
    if (st.how) html += '<h3>Jak postupovat</h3>' + st.how;
    var variant = null, cards = st.cards;
    if (st.variants) {
      var vid = app.variants[st.id] || st.variants[0].id;
      variant = st.variants.filter(function (v) { return v.id === vid; })[0] || st.variants[0];
      cards = variant.cards;
      html += '<h3>Vyber si úroveň</h3><div class="tabs" role="tablist">' + st.variants.map(function (v) {
        return '<button role="tab" data-var="' + v.id + '" class="' + (v.id === variant.id ? 'on' : '') + '">' + v.label + ' <span class="lvl ' + v.lvl + '">' + v.lvlText + '</span></button>';
      }).join('') + '</div>' + variant.intro;
    }
    if (cards) {
      html += '<div class="where"><div><h3>' + (st.whereTitle || 'Kde právě jsi?') + '</h3><p>' + (st.whereText || 'Klikni na situaci, která odpovídá tvé kostce – na 3D kostce uvidíš, co dělat.') + '</p></div>' +
        (variant && variant.quiz ? '<button class="btn ghost" data-a="quiz">🎯 Procvič rozpoznání</button>' : '') + '</div>' +
        '<div class="quizbar" id="quizbar"></div>' +
        '<div class="cards" id="cards">' + cards.map(function (c, i) { return cardHtml(st, c, i); }).join('') + '</div>';
      if (variant && variant.after) html += variant.after;
    }
    if (st.tips) html += st.tips;
    if (st.check) html += '<h3>Hotovo, když…</h3><ul class="check">' + st.check.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>';
    html += navBottom();
    var content = $('#content'); content.innerHTML = html;

    // akce
    $$('[data-var]', content).forEach(function (b) {
      b.onclick = function () { app.variants[st.id] = b.getAttribute('data-var'); store.set('variants', app.variants); app.quiz = null; render(); };
    });
    $$('.card', content).forEach(function (el) {
      el.onclick = function () { onCard(st, variant, cards[+el.getAttribute('data-i')], el); };
    });
    var qb = $('[data-a=quiz]', content); if (qb) qb.onclick = function () { startQuiz(st, variant); };
    bindNav(content);
    bindSandbox(content);

    // výchozí stav kostky pro krok
    if (st.sandbox) player.load({ title: 'Složená kostka', sub: 'Pískoviště', cube: C.solved(2), segs: [], free: true, text: 'Klikni na tah a sleduj, co udělá.' });
    else if (cards) {
      var first = cards.filter(function (c) { return !c.info; })[0];
      loadCard(st, variant, first, true);
      markCard(first);
    }
  }

  function navBottom() {
    var g = guide(), i = stepIndex(app.step), pv = g.steps[i - 1], nx = g.steps[i + 1];
    return '<div class="nav-bottom">' + (pv ? '<button class="btn ghost" data-nav="' + pv.id + '">← ' + pv.num + ' ' + pv.title + '</button>' : '<span></span>') +
      (nx ? '<button class="btn" data-nav="' + nx.id + '" data-done="1">' + (nx.num === '✓' ? '' : nx.num + ' ') + nx.title + ' →</button>' : '') + '</div>';
  }
  function bindNav(el) {
    $$('[data-nav]', el).forEach(function (b) {
      b.onclick = function () { if (b.getAttribute('data-done')) markDone(app.step); go(b.getAttribute('data-nav')); };
    });
  }

  function thumbSvg(cube, kind, mask, o) {
    o = o || {};
    var m = MASKS[mask] || null;
    if (kind === 'top') return D.topView(cube, m, { sides: o.sides, size: o.size || 112, arrows: o.arrows });
    return D.iso(cube, m, { size: o.size || 120, highlight: o.hl, slot: o.slot });
  }

  function cardState(c, N) {
    if (c.state) return c.state();
    var cube = C.solved(N || 2);
    if (c.setup) C.apply(cube, c.inverse ? C.invert(c.setup) : c.setup);
    return cube;
  }
  function cardHtml(st, c, i) {
    var cube = cardState(c), mask = c.thumb === 'top' ? (c.sides === 'yellow' ? 'yellow' : 'full') : st.mask;
    var arrows = c.mark === 'UFR' ? '<rect x="61" y="61" width="36" height="36" fill="none" stroke="var(--cy)" stroke-width="3" stroke-dasharray="5 3"/>' : '';
    return '<button class="card' + (c.info ? ' info-card' : '') + '" data-i="' + i + '" data-id="' + c.id + '">' +
      (c.info ? '' : '<span class="play">' + ICONS.play + '</span>') +
      '<span class="th">' + thumbSvg(cube, c.thumb, mask, { sides: c.sides, hl: c.hl, slot: c.slot, arrows: arrows }) + '</span>' +
      '<span class="sub">' + c.sub + '</span><h4>' + c.title + (c.rep ? ' <span class="rep">· ' + c.rep + '</span>' : '') + '</h4>' +
      (c.hint ? '<span class="hint">' + c.hint + '</span>' : '') +
      (c.alg ? '<span class="alg">' + c.alg + '</span>' : '') + '</button>';
  }
  function markCard(c) {
    $$('#cards .card').forEach(function (el) { el.classList.toggle('on', !!c && el.getAttribute('data-id') === c.id); el.classList.remove('quiz-ok', 'quiz-bad'); });
  }
  function highlightCase(res) {
    if (!res || !res.caseId) return;
    var st = curStep(), v = st.variants && st.variants.filter(function (x) { return x.id === app.variants[st.id]; })[0];
    var cards = v ? v.cards : st.cards || [];
    markCard(cards.filter(function (c) { return c.caseId === res.caseId; })[0]);
  }

  function loadCard(st, variant, c, silent) {
    if (!c) return;
    var cube = cardState(c), segs = c.segs;
    if (c.auto) { var r = S.nextFor(st.id, variant && variant.id, cube); segs = r && r.segs ? r.segs : []; }
    player.load({
      title: c.title + (c.sub ? ' <span style="color:var(--dim);font-weight:500">· ' + c.sub + '</span>' : ''),
      sub: (st.num === '00' ? '' : 'Krok ' + st.num + ' · ') + st.title,
      cube: cube, segs: c.info ? [] : segs, mask: st.mask, step: st.id, variant: variant && variant.id,
      text: c.info ? c.hint : null, big: c.info ? '?' : null
    });
    if (!silent && window.innerWidth < 920) {
      var top = $('#stage').getBoundingClientRect().top;
      if (top < -40 || top > window.innerHeight * 0.4) window.scrollTo({ top: top + window.scrollY - 8, behavior: 'smooth' });
    }
  }

  function onCard(st, variant, c, el) {
    if (app.quiz) { checkQuiz(st, variant, c, el); return; }
    markCard(c);
    loadCard(st, variant, c);
  }

  /* ---------------------------------------------------------------- procvičování */
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function randomState(stepId) {
    for (var guard = 0; guard < 50; guard++) {
      var c = C.solved(2);
      C.apply(c, rnd(S.AUFS) || []);
      var pb = rnd(['', S.TPERM, S.YPERM]); if (pb) C.apply(c, C.invert(pb));
      C.apply(c, rnd(S.AUFS) || []);
      if (stepId === 'zluta') { C.apply(c, C.invert(rnd(S.OLL_CASES).alg)); C.apply(c, rnd(S.AUFS) || []); if (!S.ollDone(c)) return c; }
      else if (!C.isSolved(c)) return c;
    }
    return C.solved(2);
  }
  function startQuiz(st, variant) {
    var cube = randomState(st.id);
    app.quiz = { step: st.id, variant: variant.id, cube: cube, tries: 0 };
    markCard(null);
    player.load({ title: 'Která situace to je?', sub: 'Procvičování', cube: cube, segs: [], mask: st.mask, step: st.id, variant: variant.id, noAfter: true,
      big: '?', text: 'Prohlédni si kostku (můžeš ji natočit tažením) a klikni na kartu, která jí odpovídá.' });
    var qb = $('#quizbar'); qb.className = 'quizbar show';
    qb.innerHTML = '🎯 <b>Procvičování:</b> kostka ukazuje náhodnou situaci. Klikni na kartu, která jí odpovídá. Pozor – horní vrstva může být pootočená.';
    if (window.innerWidth < 920) window.scrollTo({ top: $('#stage').getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
  }
  function checkQuiz(st, variant, c, el) {
    var q = app.quiz, cube = q.cube, ok = false;
    if (st.id === 'zluta' && variant.id === 'C') { var m = S.matchOll(cube); ok = m && 'c-' + m.kase.id === c.id; }
    else if (st.id === 'zluta') ok = S.yellowUp(cube) === c.count;
    else if (st.id === 'rohy') ok = S.pblInfo(cube).id === c.caseId;
    q.tries++;
    var qb = $('#quizbar');
    $$('#cards .card').forEach(function (x) { x.classList.remove('quiz-ok', 'quiz-bad'); });
    void el.offsetWidth;
    el.classList.add(ok ? 'quiz-ok' : 'quiz-bad');
    if (ok) {
      var r = S.nextFor(st.id, variant.id, cube);
      qb.innerHTML = '✅ <b>Správně!</b> ' + (q.tries > 1 ? '(na ' + q.tries + '. pokus) ' : '') + 'Na kostce si můžeš přehrát řešení. ' +
        '<button class="btn ghost" data-a="again" style="margin-left:6px;padding:4px 10px">Další situace</button>';
      player.load({ title: r && r.label || c.title, sub: 'Procvičování · řešení', cube: cube, segs: r && r.segs || [], mask: st.mask, step: st.id, variant: variant.id });
      app.quiz = null;
      $('[data-a=again]', qb).onclick = function () { startQuiz(st, variant); };
    } else {
      qb.innerHTML = '❌ <b>To není ono.</b> Zkus jinou kartu. Tip: ' + (st.id === 'rohy' ? 'spočítej strany, kde mají oba horní rohy stejnou barvu.' : 'spočítej žluté nálepky nahoře a podívej se, kam míří ostatní.');
    }
  }

  /* ---------------------------------------------------------------- pískoviště */
  function sandboxHtml(N) {
    var mv = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'R2', 'U2'];
    if (N >= 4) mv = mv.concat(['Rw', "Rw'", 'Uw', "Uw'"]);
    mv = mv.concat(['x', 'y', 'z']);
    return '<div class="mvgrid">' + mv.map(function (t) { return '<button class="mvb" data-mv="' + t + '"><b>' + t + '</b><span>' + moveText(t).replace('Otoč ', '') + '</span></button>'; }).join('') + '</div>' +
      '<div class="row-btns"><button class="btn" data-a="sexy">▶ R U R\' U\' 6×</button><button class="btn ghost" data-a="scramble">Zamíchat</button><button class="btn ghost" data-a="solved">Složená kostka</button></div>';
  }
  function bindSandbox(el) {
    var N = PUZZLES[app.puzzle].N;
    $$('[data-mv]', el).forEach(function (b) { b.onclick = function () { player.free(b.getAttribute('data-mv')); scrollStageIfNeeded(); }; });
    var a = $('[data-a=sexy]', el); if (a) a.onclick = function () {
      player.load({ title: 'R U R\' U\' šestkrát', sub: 'Ukázka', cube: C.solved(N), segs: [{ alg: "R U R' U'", times: 6, note: 'R U R\' U\'' }], text: '' });
      scrollStageIfNeeded(); player.togglePlay();
    };
    var b = $('[data-a=scramble]', el); if (b) b.onclick = function () {
      var scr = C.randomScramble(N, N === 2 ? 10 : N === 3 ? 20 : 36);
      player.load({ title: 'Zamíchání', sub: 'Pískoviště', cube: C.solved(N), segs: [{ alg: scr.join(' '), note: 'zamíchání' }] });
      scrollStageIfNeeded(); player.togglePlay();
    };
    var c = $('[data-a=solved]', el); if (c) c.onclick = function () {
      player.load({ title: 'Složená kostka', sub: 'Pískoviště', cube: C.solved(N), segs: [], free: true, text: 'Klikni na tah a sleduj, co udělá.' });
    };
  }
  function scrollStageIfNeeded() {
    if (window.innerWidth >= 920) return;
    var top = $('#stage').getBoundingClientRect().top;
    if (top < -60) window.scrollTo({ top: top + window.scrollY - 8, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------------- rozcestník */
  function renderHome() {
    $('#bar-model').textContent = '—'; $('#bar-step').textContent = '—';
    document.title = 'Rubikovka – vyber si kostku';
    var last = store.get('last', null), lp = last && PUZZLES[last.puzzle];
    var lst = lp && lp.guide && lp.guide.steps.filter(function (s) { return s.id === last.step; })[0];
    $('#resume').innerHTML = lst
      ? '<a class="resume panel" href="#/' + last.puzzle + '/' + last.step + '"><span class="lbl">Pokračovat</span><span><b>' + lp.label + '</b> · ' +
        (lst.num === '✓' ? 'trénink' : 'krok ' + lst.num + ' – ' + lst.title) + '</span><span class="go">→</span></a>'
      : '';
    $('#pick').innerHTML = Object.keys(PUZZLES).map(function (k) {
      var p = PUZZLES[k], ready = !!p.guide;
      var steps = ready ? p.guide.steps.filter(function (s) { return s.num !== '✓' && s.id !== 'notace'; }) : [];
      var done = steps.filter(function (s) { return app.done[s.id]; }).length;
      return '<a class="pick-card panel' + (ready ? ' ready' : '') + '" href="#/' + k + '" aria-label="Kostka ' + p.label + '">' +
        '<div class="pick-cube" data-cube="' + k + '"></div>' +
        '<div class="pick-body">' +
          '<div class="pick-top"><span class="pick-n">' + p.label + '</span><span class="tag ' + (ready ? 'ok' : 'wip') + '">' + (ready ? 'průvodce hotový' : 'připravuji') + '</span></div>' +
          '<div class="pick-name">' + p.name + ' · <span>' + p.lvl + '</span></div>' +
          '<p>' + p.desc + '</p>' +
          '<div class="pick-meta">' + p.meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>' +
          (ready && done ? '<div class="pick-prog" title="Splněno ' + done + ' z ' + steps.length + ' kroků"><i style="width:' + Math.round(done / steps.length * 100) + '%"></i></div>' : '') +
          '<span class="btn' + (ready ? '' : ' ghost') + '">' + (ready ? (done ? 'Pokračovat' : 'Začít skládat') : 'Vyzkoušet tahy') + ' →</span>' +
        '</div></a>';
    }).join('');
    $$('#pick [data-cube]').forEach(function (el, i) {
      var p = PUZZLES[el.getAttribute('data-cube')];
      var v = new window.CubeView(el, p.N, { size: 120 });
      v.rx = -26; v.ry = -36; v.applyView();
      v.setState(C.solved(p.N));   // statický náhled, bez animace
    });
  }

  /* ---------------------------------------------------------------- 3×3 / 4×4 – připravuji */
  function renderSoon(p) {
    var plan = p.N === 4
      ? '<li><b>Středy</b> – složit 2×2 bloky středů na všech stranách (už umíš 👍)</li><li><b>Párování hran</b> – spojit dvojice hranových kostiček (3-2-3 metoda)</li><li><b>Fáze 3×3</b> – dál se skládá jako 3×3</li><li><b>Parity</b> – dvě speciální situace, které na 3×3 nejsou (OLL a PLL parita)</li>'
      : '<li><b>Kříž</b> a <b>rohy první vrstvy</b></li><li><b>Druhá vrstva</b></li><li><b>Žlutý kříž</b>, <b>žlutá stěna</b>, <b>dorovnání</b></li><li>Pro pokročilé: <b>F2L</b>, <b>4-look last layer</b>, plné <b>OLL/PLL</b></li>';
    $('#content').innerHTML = '<div class="lbl">// Kostka ' + p.label + '</div><h2>Průvodce připravuji</h2>' +
      '<div class="panel soon"><p style="margin-top:0">Návod pro ' + p.label + ' bude stejně jako u 2×2 rozdělený do kroků s volbou situace a přehrávačem. Plánované kroky:</p><ol class="how">' + plan + '</ol>' +
      '<p style="margin-bottom:0">Mezitím si můžeš vlevo vyzkoušet tahy na kostce ' + p.label + '.</p></div>' +
      '<h3>Pískoviště ' + p.label + '</h3>' + sandboxHtml(p.N);
    bindSandbox($('#content'));
    player.load({ title: 'Kostka ' + p.label, sub: 'Pískoviště', cube: C.solved(p.N), segs: [], free: true, text: 'Klikni na tah a sleduj, co udělá.' });
  }

  /* ---------------------------------------------------------------- trénink + stopky */
  var timer = { state: 'idle', t0: 0, raf: 0, scramble: [] };
  function fmt(ms) { if (ms == null) return '–'; var s = ms / 1000; return s < 60 ? s.toFixed(2) : Math.floor(s / 60) + ':' + ('0' + (s % 60).toFixed(2)).slice(-5); }
  function times() { return store.get('times.' + app.puzzle, []); }
  function ao5(t) { if (t.length < 5) return null; var l = t.slice(-5).map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; }); return (l[1] + l[2] + l[3]) / 3; }
  function renderTraining() {
    var g = guide();
    timer.scramble = C.randomScramble(2, 10);
    $('#content').innerHTML =
      '<div class="lbl">// Hotovo · Trénink</div><h2>Umíš to? Změř si čas!</h2>' +
      '<p>Zamíchej kostku podle zadání, pak <b>podrž mezerník</b> (na mobilu prst na stopkách), až zezelenají, pusť a skládej. Dalším stiskem stopky zastavíš.</p>' +
      '<div class="panel timer" id="timer"><small>Zamíchání</small><div class="scr" id="scr">' + timer.scramble.join(' ') + '</div><div class="time" id="time">0.00</div><small id="tstate">podrž mezerník / prst</small></div>' +
      '<div class="row-btns"><button class="btn ghost" data-a="newscr">Nové zamíchání</button><button class="btn ghost" data-a="showscr">Ukázat zamíchání na kostce</button><button class="btn ghost" data-a="clear">Smazat časy</button></div>' +
      '<div class="stats" id="stats"></div><div class="times" id="times"></div>' +
      '<h3>Jak se zlepšovat na 2×2</h3><ol class="how">' +
      '<li><b>Plynulost:</b> skládej bez zastavování. Snaž se během algoritmu už hledat, co bude dál.</li>' +
      '<li><b>Krok 02 naplno:</b> nauč se všech 7 algoritmů (varianta „pokročilý“) – vždy jen jedno provedení místo až tří Sune.</li>' +
      '<li><b>Y-perm</b> pro případ bez světel – ušetří jeden celý T-perm.</li>' +
      '<li><b>První vrstva na pár tahů:</b> naplánuj si ji předem a místo opakování <code>R U R\' U\'</code> používej zkratky.</li>' +
      '<li><b>Další úroveň:</b> metody <b>Ortega</b> a <b>CLL</b> – poslední vrstva v jednom kroku.</li></ol>' +
      '<div class="nav-bottom"><button class="btn ghost" data-nav="rohy">← 03 Dorovnání rohů</button><button class="btn" data-nav="notace">Začít znovu od notace</button></div>';
    bindNav($('#content'));
    $('[data-a=newscr]').onclick = function () { timer.scramble = C.randomScramble(2, 10); $('#scr').textContent = timer.scramble.join(' '); };
    $('[data-a=showscr]').onclick = function () {
      player.load({ title: 'Zamíchání', sub: 'Trénink', cube: C.solved(2), segs: [{ alg: timer.scramble.join(' '), note: 'zamíchání' }] });
      scrollStageIfNeeded(); player.togglePlay();
    };
    $('[data-a=clear]').onclick = function () { if (confirm('Opravdu smazat všechny časy?')) { store.set('times.' + app.puzzle, []); renderTimes(); } };
    var tEl = $('#timer');
    tEl.addEventListener('pointerdown', function (e) { e.preventDefault(); timerDown(); });
    tEl.addEventListener('pointerup', function () { timerUp(); });
    renderTimes();
    player.load({ title: 'Složená kostka', sub: 'Trénink', cube: C.solved(2), segs: [], free: true, text: 'Zamíchání si můžeš zobrazit tlačítkem „Ukázat zamíchání na kostce“.' });
    void g;
  }
  function renderTimes() {
    var t = times(), best = t.length ? Math.min.apply(null, t.map(function (x) { return x.ms; })) : null;
    $('#stats').innerHTML = '<div class="panel stat"><b>' + fmt(best) + '</b><span>nejlepší</span></div><div class="panel stat"><b>' + fmt(ao5(t)) + '</b><span>průměr 5</span></div><div class="panel stat"><b>' + t.length + '</b><span>složení</span></div>';
    $('#times').innerHTML = t.slice(-15).reverse().map(function (x) { return '<span>' + fmt(x.ms) + '</span>'; }).join('');
  }
  function setTimerState(s) {
    timer.state = s; var el = $('#timer'); if (!el) return;
    el.classList.toggle('armed', s === 'armed'); el.classList.toggle('running', s === 'running');
    $('#tstate').textContent = s === 'armed' ? 'pusť = start' : s === 'running' ? 'stiskni = stop' : 'podrž mezerník / prst';
  }
  function timerDown() {
    if (timer.state === 'running') {
      cancelAnimationFrame(timer.raf);
      var ms = performance.now() - timer.t0, t = times(); t.push({ ms: Math.round(ms), d: Date.now() }); store.set('times.' + app.puzzle, t.slice(-200));
      $('#time').textContent = fmt(ms); setTimerState('stopped'); renderTimes();
      timer.scramble = C.randomScramble(2, 10); $('#scr').textContent = timer.scramble.join(' ');
      return;
    }
    if (timer.state === 'idle' || timer.state === 'stopped') { setTimerState('armed'); $('#time').textContent = '0.00'; }
  }
  function timerUp() {
    if (timer.state === 'armed') {
      timer.t0 = performance.now(); setTimerState('running');
      (function tick() { if (timer.state !== 'running') return; $('#time').textContent = fmt(performance.now() - timer.t0); timer.raf = requestAnimationFrame(tick); })();
    } else if (timer.state === 'stopped') setTimerState('idle');
  }

  /* ---------------------------------------------------------------- klávesy */
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (app.view === 'home') return;
    var training = PUZZLES[app.puzzle].guide && curStep().timer;
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      if (training) timerDown(); else player.togglePlay();
    } else if (e.key === 'ArrowRight') { player.stop(); player.step(1); }
    else if (e.key === 'ArrowLeft') { player.stop(); player.step(-1); }
  });
  document.addEventListener('keyup', function (e) {
    var training = app.view !== 'home' && PUZZLES[app.puzzle].guide && curStep().timer;
    if (e.code === 'Space' && training) { e.preventDefault(); timerUp(); }
  });

  /* ---------------------------------------------------------------- motiv */
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    $('#theme').textContent = t === 'light' ? '☀ světlý' : t === 'dark' ? '☾ tmavý' : '◐ auto';
  }

  /* ---------------------------------------------------------------- start */
  function parseHash() {
    var m = /^#\/(\w+)(?:\/(\w+))?/.exec(location.hash || '');
    if (m && PUZZLES[m[1]]) {
      app.view = 'guide'; app.puzzle = m[1];
      var g = PUZZLES[m[1]].guide;
      app.step = g ? (m[2] && g.steps.some(function (s) { return s.id === m[2]; }) ? m[2] : 'notace') : 'soon';
      return true;
    }
    app.view = 'home';
    return false;
  }
  function init() {
    player = new Player($('#stage'));
    parseHash();
    var theme = store.get('theme', 'auto'); applyTheme(theme);
    $('#theme').onclick = function () { theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'; store.set('theme', theme); applyTheme(theme); };
    window.addEventListener('hashchange', function () { var was = app.view; parseHash(); render(); if (was !== app.view) window.scrollTo(0, 0); });
    render();
  }
  window.addEventListener('DOMContentLoaded', init);
})();
