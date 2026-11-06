/* Rubikovka – obsah průvodce pro kostku 2×2 (začátečnická metoda po vrstvách). */
(function (root) {
  'use strict';
  var C = root.Cube, S = root.Solver2;
  var SEXY = "R U R' U'";
  function rep(alg, n) { return Array(n + 1).join(alg + ' ').trim(); }
  function inv(alg) { return C.invert(alg).join(' '); }

  // stav pro variantu B (jen Sune): případ natočený přesně podle pravidla
  function suneState(caseAlg) {
    var c = C.apply(C.solved(2), C.invert(caseAlg));
    var r = S.suneRule(c); if (r && r.auf) C.applyMove(c, r.auf);
    return c;
  }

  var steps = [
    /* ------------------------------------------------------------ 00 */
    {
      id: 'notace', num: '00', title: 'Notace', long: 'Jak číst tahy', mask: 'full', sandbox: true,
      intro: '<p>Než začneš, potřebuješ umět přečíst „recept“ – <b>algoritmus</b>. Je to řada písmen, kde každé písmeno znamená otočení jedné vrstvy. Kliknutím na tlačítko níže uvidíš tah na 3D kostce i se šipkou.</p>',
      body:
        '<h3>Písmena = stěny</h3>' +
        '<p>Kostku drž před sebou. <b>R</b> = pravá, <b>L</b> = levá, <b>U</b> = horní, <b>D</b> = spodní, <b>F</b> = přední (k tobě), <b>B</b> = zadní. ' +
        'Samotné písmeno znamená otočení o čtvrt otáčky <b>po směru hodinových ručiček</b> – jako by ses na tu stěnu díval přímo zepředu.</p>' +
        '<ul class="how"><li><code>R</code> → po směru hodin</li><li><code>R\'</code> (s čárkou, čti „R čárka“) → proti směru hodin</li><li><code>R2</code> → dvakrát (o 180°), směr je jedno</li></ul>' +
        '<div class="note warn"><span class="t">Nejčastější chyba</span>Během algoritmu <b>neotáčej celou kostkou v ruce</b>. Pořád se díváš na stejnou přední stranu, jinak se tahy „posunou“ a nebude to fungovat.</div>' +
        '<h3>Barvy na kostce</h3>' +
        '<div class="panel compass"><div>{{compass}}</div><div style="flex:1;min-width:220px"><p style="margin:0 0 6px">Protilehlé barvy jsou vždy stejné:</p>' +
        '<ul class="how" style="margin:0"><li><span class="sw" style="background:#fff"></span>bílá ↔ <span class="sw" style="background:#ffd500"></span>žlutá</li><li><span class="sw" style="background:#06a35a"></span>zelená ↔ <span class="sw" style="background:#1f5fd1"></span>modrá</li><li><span class="sw" style="background:#d62839"></span>červená ↔ <span class="sw" style="background:#ff7a1a"></span>oranžová</li></ul>' +
        '<p style="margin:8px 0 0;font-size:14px;color:var(--mut)">V celém návodu držíme kostku <b>žlutou nahoru, bílou dolů</b>. Když je zelená vpředu, je oranžová vpravo a červená vlevo.</p></div></div>' +
        '<h3>Vyzkoušej si tahy</h3><p>Klikni na tah a sleduj kostku. Šipka vždy ukazuje, kam se vrstva pohne.</p>' +
        '{{sandbox}}' +
        '<div class="note why"><span class="t">Proč je R U R\' U\' tak důležitý?</span>Tahle čtveřice (anglicky „sexy move“) je základ skoro všeho. Když ji zopakuješ <b>6×</b>, kostka se vrátí do původního stavu – zkus to tlačítkem výše. Mezitím ale na chvíli „vytáhne“ a „vrátí“ roh vpravo vpředu, a přesně toho využijeme v kroku 01.</div>'
    },
    /* ------------------------------------------------------------ 01 */
    {
      id: 'bila', num: '01', title: 'Bílá vrstva', long: 'První vrstva', mask: 'white',
      goal: { thumb: function () { return { cube: C.solved(2), kind: 'iso', mask: 'white' }; },
        html: '<b>Cíl:</b> celá spodní stěna bílá a boční barvy spodní vrstvy na sebe navazují – na každé straně jsou dole dvě stejné barvy.' },
      intro: '<p>2×2 nemá středy, takže si „střed“ vytvoříš sám prvním bílým rohem. Všechny další rohy pak skládáš k němu.</p>',
      how:
        '<ol class="how">' +
        '<li>Drž kostku <b>bílou dolů</b>. Pokud ještě dole žádný bílý roh nemáš, vezmi libovolný bílý roh a dej ho dolů bílou nálepkou dolů. To je tvůj základ.</li>' +
        '<li>Natoč <b>celou kostku</b> tak, aby <b>volné místo</b> ve spodní vrstvě bylo <b>vpravo vpředu dole</b>.</li>' +
        '<li>Najdi bílý roh, který tam patří: jeho boční barva musí sedět k sousednímu bílému rohu dole (na straně, kde se dotýkají).</li>' +
        '<li>Otáčej <b>jen horní vrstvou</b> (<code>U</code>), dokud ten roh není <b>vpravo vpředu nahoře</b> – přímo nad volným místem.</li>' +
        '<li>Vlož roh dolů – jak přesně, záleží na zvolené úrovni níže a na tom, kam míří bílá nálepka.</li>' +
        '<li>Opakuj, dokud nemáš všechny 4 rohy. Kostku můžeš <b>mezi rohy</b> natáčet, jak potřebuješ.</li></ol>',
      whereTitle: 'Kde právě jsi?', whereText: 'Vyber, jak vypadá roh vpravo vpředu. Šedé kostičky teď nehrají roli.',
      variants: [
        { id: 'A', label: 'Opakování R U R\' U\'', lvl: 'l1', lvlText: 'začátečník',
          intro: '<p>Jeden postup na všechno: opakuj <code>R U R\' U\'</code>, dokud roh nezapadne bílou dolů. Kolikrát, záleží na tom, kam míří bílá.</p>',
          cards: [
        { id: 'start', title: 'Začínám od nuly', sub: 'žádný roh dole', info: true, thumb: 'iso', setup: "R U2 F' R2 U F U' R'",
          hint: 'Vezmi <b>libovolný bílý roh</b> a otoč ho dolů bílou dolů. Nemusí být nikde konkrétně – stane se tvým základem. Pak natoč kostku a pokračuj dalším rohem.' },
        { id: 'w-right', title: 'Bílá míří doprava', sub: 'roh nahoře', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
          setup: inv(SEXY), segs: [{ alg: SEXY, times: 1, note: 'R U R\' U\'' }], alg: SEXY, rep: '1×', hint: 'Zkratka: <code>R U R\'</code>' },
        { id: 'w-up', title: 'Bílá míří nahoru', sub: 'roh nahoře', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
          setup: inv(rep(SEXY, 3)), segs: [{ alg: SEXY, times: 3, note: 'R U R\' U\'' }], alg: SEXY, rep: '3×', hint: 'Zkratka: <code>R U2 R\' U\' R U R\'</code>' },
        { id: 'w-front', title: 'Bílá míří k tobě', sub: 'roh nahoře', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
          setup: inv(rep(SEXY, 5)), segs: [{ alg: SEXY, times: 5, note: 'R U R\' U\'' }], alg: SEXY, rep: '5×', hint: 'Zkratka: <code>F\' U\' F</code>' },
        { id: 'd-right', title: 'Roh je dole, ale otočený', sub: 'bílá míří doprava', thumb: 'iso', hl: [[1, -1, 1]],
          setup: inv(rep(SEXY, 2)), segs: [{ alg: SEXY, times: 2, note: 'R U R\' U\'' }], alg: SEXY, rep: '2×' },
        { id: 'd-front', title: 'Roh je dole, ale otočený', sub: 'bílá míří k tobě', thumb: 'iso', hl: [[1, -1, 1]],
          setup: inv(rep(SEXY, 4)), segs: [{ alg: SEXY, times: 4, note: 'R U R\' U\'' }], alg: SEXY, rep: '4×' },
        { id: 'd-wrong', title: 'Roh je dole na špatném místě', sub: 'barvy nesedí', thumb: 'iso', hl: [[1, -1, 1]],
          setup: "R U R U' R2", segs: [{ alg: SEXY, times: 1, note: 'vytažení rohu' }], alg: SEXY, rep: '1×',
          hint: 'Dej ho vpravo vpředu dole a jednou ho vytáhni nahoru. Pak pokračuj podle toho, kam míří bílá.' }
          ],
          after: '<div class="note why"><span class="t">Proč to funguje</span><code>R U R\' U\'</code> vytáhne roh z místa vpravo vpředu dole nahoru a vrátí jiný dolů. Ostatní spodní rohy (vlevo a vzadu) se nehnou – proto můžeš klidně opakovat, nic nerozbiješ. Každé opakování roh „pootočí“, takže dřív nebo později zapadne bílou dolů.</div>' },
        { id: 'B', label: 'Zkratky', lvl: 'l2', lvlText: 'pokročilý',
          intro: '<p>Místo opakování použiješ na každou situaci nejkratší vložení. Klíčové jsou dvě trojice tahů – zbytek jsou jen jejich kombinace:</p>' +
            '<ul class="how"><li>bílá míří <b>doprava</b> → <code>R U R\'</code> (pravou nahoru, horní doleva, pravou dolů)</li>' +
            '<li>bílá míří <b>k tobě</b> → <code>F\' U\' F</code> (zrcadlově přes přední stěnu)</li></ul>' +
            '<p>Pravidlo pro zapamatování: roh nad volným místem, <b>bílá míří ven do strany</b> → stačí 3 tahy. Bílá nahoru nebo roh zaseknutý dole → nejdřív ho „předělej“ na jednu z těchto dvou situací.</p>',
          cards: [
            { id: 'z-right', title: 'Bílá míří doprava', sub: 'roh nahoře · 3 tahy', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
              setup: "R U R'", inverse: true, segs: [{ alg: "R U R'", times: 1, note: 'vložení' }], alg: "R U R'",
              hint: 'Pravá vrstva „otevře“ místo, horní vrstva tam roh přisune, pravá ho zavře.' },
            { id: 'z-front', title: 'Bílá míří k tobě', sub: 'roh nahoře · 3 tahy', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
              setup: "F' U' F", inverse: true, segs: [{ alg: "F' U' F", times: 1, note: 'vložení' }], alg: "F' U' F",
              hint: 'Totéž zrcadlově – místo otevře přední stěna.' },
            { id: 'z-up', title: 'Bílá míří nahoru', sub: 'roh nahoře · 7 tahů', thumb: 'iso', hl: [[1, 1, 1]], slot: [1, -1, 1],
              setup: rep(SEXY, 3), inverse: true, segs: [{ alg: "R U2 R' U'", times: 1, note: 'otoč roh (bílá doprava)' }, { alg: "R U R'", times: 1, note: 'vložení' }], alg: "R U2 R' U' · R U R'",
              hint: 'První část roh „přetočí“, aby bílá mířila doprava, pak klasické <code>R U R\'</code>. Expertní 5tahová varianta: <code>R2 U R2 U\' R2</code>.' },
            { id: 'z-dright', title: 'Roh dole, bílá doprava', sub: 'zaseknutý v místě · 6 tahů', thumb: 'iso', hl: [[1, -1, 1]],
              setup: rep(SEXY, 2), inverse: true, segs: [{ alg: "F' U F", times: 1, note: 'vytáhni (bílá doprava)' }, { alg: "R U R'", times: 1, note: 'vložení' }], alg: "F' U F · R U R'",
              hint: 'Vytáhni ho přední stěnou tak, aby bílá mířila doprava, a vlož.' },
            { id: 'z-dfront', title: 'Roh dole, bílá k tobě', sub: 'zaseknutý v místě · 6 tahů', thumb: 'iso', hl: [[1, -1, 1]],
              setup: rep(SEXY, 4), inverse: true, segs: [{ alg: "R U' R'", times: 1, note: 'vytáhni (bílá k tobě)' }, { alg: "F' U' F", times: 1, note: 'vložení' }], alg: "R U' R' · F' U' F",
              hint: 'Vytáhni ho pravou vrstvou tak, aby bílá mířila k tobě, a vlož.' },
            { id: 'z-lleft', title: 'Místo vlevo: bílá doleva', sub: 'bez otáčení kostky', thumb: 'iso', hl: [[-1, 1, 1], [-1, -1, 1]],
              setup: "L' U' L", inverse: true, segs: [{ alg: "L' U' L", times: 1, note: 'vložení vlevo' }], alg: "L' U' L",
              hint: 'Volné místo je <b>vlevo vpředu dole</b> a bílá míří doleva (na obrázku není vidět). Zrcadlo k <code>R U R\'</code> – kostku nemusíš otáčet.' },
            { id: 'z-lfront', title: 'Místo vlevo: bílá k tobě', sub: 'bez otáčení kostky', thumb: 'iso', hl: [[-1, 1, 1], [-1, -1, 1]],
              setup: "F U F'", inverse: true, segs: [{ alg: "F U F'", times: 1, note: 'vložení vlevo' }], alg: "F U F'",
              hint: 'Zrcadlo k <code>F\' U\' F</code> pro levou stranu.' }
          ],
          after: '<div class="note why"><span class="t">Jak zrychlit dál</span><ul class="how" style="margin:4px 0 0">' +
            '<li><b>Neotáčej celou kostkou:</b> pro místo vlevo vpředu používej zrcadlové tahy (<code>L\' U\' L</code>, <code>F U F\'</code>).</li>' +
            '<li><b>Natoč horní vrstvu chytře:</b> než roh vložíš, otoč <code>U</code> tak, aby bílá mířila do strany – vložení je pak vždy jen 3 tahy.</li>' +
            '<li><b>Dívej se dopředu:</b> během vkládání jednoho rohu už hledej, kde je další.</li>' +
            '<li><b>Plánuj v inspekci:</b> v soutěži máš 15 s na prohlédnutí kostky – zkus si první dva rohy naplánovat ještě předtím, než začneš.</li></ul></div>' }
      ],
      tips:
        '<div class="note warn"><span class="t">Pozor</span>Roh zapadl bílou dolů, ale boční barvy nesedí se sousedem? Patří jinam. Jednou ho <code>R U R\' U\'</code> vytáhni a zkus jiný roh.</div>',
      check: ['Spodní stěna je celá bílá.', 'Na všech 4 stranách jsou dole dvě stejné barvy vedle sebe.', 'Horní vrstva je zatím jakkoliv – to vyřeší další kroky.']
    },
    /* ------------------------------------------------------------ 02 */
    {
      id: 'zluta', num: '02', title: 'Žlutá nahoře', long: 'Orientace horní vrstvy', mask: 'oll',
      goal: { thumb: function () { return { cube: C.solved(2), kind: 'top', mask: 'yellow', sides: 'yellow' }; },
        html: '<b>Cíl:</b> všechny 4 nálepky nahoře žluté. Boční barvy horní vrstvy zatím nemusí sedět.' },
      intro: '<p>Otoč kostku <b>bílou dolů, žlutou nahoru</b> a už s ní během kroku neotáčej – točíš jen vrstvami. Vyber si úroveň: čím vyšší, tím méně tahů, ale víc se toho musíš naučit.</p>',
      variants: [
        { id: 'A', label: 'Vrtání rohu', lvl: 'l1', lvlText: 'nejjednodušší',
          intro: '<p>Jen jeden krátký tah <code>R\' D\' R D</code>, který „vrtá“ roh vpravo vpředu nahoře, dokud není žlutou nahoru.</p>' +
            '<ol class="how"><li>Otoč <b>horní vrstvu</b> (<code>U</code>), aby roh, který nemá žlutou nahoře, byl <b>vpravo vpředu nahoře</b>.</li>' +
            '<li>Opakuj <code>R\' D\' R D</code> – <b>2×</b>, když žlutá míří doprava, <b>4×</b>, když míří k tobě.</li>' +
            '<li>Znovu otoč jen <code>U</code> k dalšímu špatnému rohu a opakuj. Kostkou samotnou neotáčej!</li></ol>' +
            '<div class="note warn"><span class="t">Nepanikař</span>Bílá vrstva se mezitím rozhází. To je v pořádku – jakmile jsou všechny rohy žlutou nahoru, spodek se sám vrátí.</div>',
          cards: [
            { id: 'a-right', title: 'Žlutá míří doprava', sub: 'roh vpravo vpředu', thumb: 'top', sides: 'yellow', mark: 'UFR',
              setup: "R U2 R' U' R U' R'", inverse: true, auto: true, alg: "R' D' R D", rep: '2×' },
            { id: 'a-front', title: 'Žlutá míří k tobě', sub: 'roh vpravo vpředu', thumb: 'top', sides: 'yellow', mark: 'UFR',
              setup: "R U R' U R U2 R'", inverse: true, auto: true, alg: "R' D' R D", rep: '4×' }
          ] },
        { id: 'B', label: 'Jen Sune', lvl: 'l2', lvlText: 'začátečník', quiz: true,
          intro: '<p>Jeden algoritmus <code>R U R\' U R U2 R\'</code> (jmenuje se <b>Sune</b>), který opakuješ – nejvýš 3×. Před každým provedením natoč <b>horní vrstvu</b> podle toho, kolik žlutých je nahoře:</p>',
          cards: [
            { id: 'b1', count: 1, title: '1 žlutá nahoře', sub: 'tzv. rybka', thumb: 'top', sides: 'yellow', state: function () { return suneState("R U R' U R U2 R'"); }, auto: true,
              alg: "R U R' U R U2 R'", hint: 'Tu jedinou žlutou dej <b>vlevo dopředu</b>.' },
            { id: 'b0', count: 0, title: '0 žlutých nahoře', sub: 'žádná', thumb: 'top', sides: 'yellow', state: function () { return suneState("F R U R' U' R U R' U' F'"); }, auto: true,
              alg: "R U R' U R U2 R'", hint: 'Vlevo vpředu musí žlutá mířit <b>doleva</b>.' },
            { id: 'b2', count: 2, title: '2 žluté nahoře', sub: 'vedle sebe i přes roh', thumb: 'top', sides: 'yellow', state: function () { return suneState("R U R' U' R' F R F'"); }, auto: true,
              alg: "R U R' U R U2 R'", hint: 'Vlevo vpředu musí žlutá mířit <b>k tobě</b>.' }
          ],
          after: '<p style="font-size:14.5px;color:var(--mut)">Po každém Sune situaci znovu vyhodnoť (kolik žlutých je teď nahoře?) a pokračuj. 3D kostka ti po přehrání ukáže, co následuje.</p>' },
        { id: 'C', label: 'Všech 7 případů', lvl: 'l3', lvlText: 'pokročilý', quiz: true,
          intro: '<p>Na každou situaci jeden algoritmus = vždy jen jedno provedení. Natoč <code>U</code> tak, aby horní vrstva vypadala přesně jako na obrázku, a proveď algoritmus. Tip: začni Sune + Antisune, pak přidej U a T, nakonec H, Pi a L.</p>',
          cards: S.OLL_CASES.map(function (k) {
            var subs = { sune: '1 žlutá nahoře', antisune: '1 žlutá nahoře', h: '0 žlutých', pi: '0 žlutých', u: '2 sousední', t: '2 sousední', l: '2 přes úhlopříčku' };
            return { id: 'c-' + k.id, caseId: k.id, title: k.name, sub: subs[k.id], thumb: 'top', sides: 'yellow', setup: k.alg, inverse: true, auto: true, alg: k.alg };
          }) }
      ],
      tips: '<div class="note why"><span class="t">Co se děje</span>Algoritmy v tomhle kroku jen <b>natáčí</b> rohy horní vrstvy na místě. Rohy se možná i prohodí, ale to nevadí – pořadí rohů vyřeší krok 03.</div>',
      check: ['Celá horní stěna je žlutá.', 'Spodní vrstva je pořád složená.', 'Boky horní vrstvy můžou být promíchané – to je správně.']
    },
    /* ------------------------------------------------------------ 03 */
    {
      id: 'rohy', num: '03', title: 'Dorovnání rohů', long: 'Permutace horní vrstvy', mask: 'full',
      goal: { thumb: function () { return { cube: C.solved(2), kind: 'iso', mask: 'full' }; },
        html: '<b>Cíl:</b> složená kostka. Nahoře je vše žluté, teď jen přesuneš rohy na správná místa.' },
      intro: '<p>Podívej se na boky horní vrstvy a hledej <b>„světla“</b> – stranu, kde mají oba horní rohy <b>stejnou barvu</b> (jako dvě rozsvícená světla vedle sebe).</p>',
      variants: [
        { id: 'C', label: 'Světla dolů', lvl: 'l1', lvlText: 'nejkratší', quiz: true,
          intro: '<p>Jen 9 tahů a točíš pouze vrstvami <code>R</code>, <code>U</code> a <code>D</code>: <code>R\' U R\' D2 R U\' R\' D2 R2</code></p>' +
            '<ol class="how"><li>Otoč horní vrstvu (<code>U</code>), aby světla byla <b>vzadu</b>.</li>' +
            '<li>Překlop celou kostku k sobě (<code>x</code>) – <b>bílá je teď vpředu</b>, žlutá vzadu a světla míří <b>dolů</b>.</li>' +
            '<li>Proveď <code>R\' U R\' D2 R U\' R\' D2 R2</code>.</li>' +
            '<li>Překlop kostku zpět žlutou nahoru (<code>x\'</code>) a případně dorovnej horní vrstvu.</li></ol>' +
            '<div class="note warn"><span class="t">Pozor na držení</span>Celou kostkou otáčíš jen před a po algoritmu. Během těch 9 tahů už ji držíš bílou k sobě.</div>',
          cards: [
            { id: 'r-solved', caseId: 'solved', title: 'Světla všude', sub: 'skoro hotovo', thumb: 'top', sides: 'all', setup: "U", auto: true,
              hint: 'Rohy jsou na místě, jen otoč horní vrstvou, aby barvy navázaly na spodek.' },
            { id: 'r-adj', caseId: 'adj', title: 'Světla na jedné straně', sub: 'sousední výměna', thumb: 'top', sides: 'all', setup: S.TPERM, inverse: true, auto: true,
              alg: S.LIGHTSDOWN, hint: 'Světla <b>dozadu</b>, překlop bílou k sobě (světla dolů) a proveď algoritmus.' },
            { id: 'r-diag', caseId: 'diag', title: 'Žádná světla', sub: 'výměna přes úhlopříčku', thumb: 'top', sides: 'all', setup: S.YPERM, inverse: true, auto: true,
              alg: S.LIGHTSDOWN, hint: 'Překlop bílou k sobě a proveď algoritmus odkudkoliv – vzniknou světla. Pak ještě jednou jako u „světla na jedné straně“.' }
          ] },
        { id: 'A', label: 'Jeden algoritmus', lvl: 'l2', lvlText: 'začátečník', quiz: true,
          intro: '<p>Stačí jeden algoritmus (<b>T-perm</b>), který prohodí dva pravé rohy: <code>R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'</code></p>',
          cards: [
            { id: 'p-solved', caseId: 'solved', title: 'Světla všude', sub: 'skoro hotovo', thumb: 'top', sides: 'all', setup: "U", auto: true,
              hint: 'Rohy jsou na místě, jen otoč horní vrstvou (<code>U</code>, <code>U\'</code> nebo <code>U2</code>), aby barvy navázaly na spodek.' },
            { id: 'p-adj', caseId: 'adj', title: 'Světla na jedné straně', sub: 'sousední výměna', thumb: 'top', sides: 'all', setup: S.TPERM, inverse: true, auto: true,
              alg: 'T-perm', hint: 'Natoč horní vrstvu, aby světla byla <b>vlevo</b>, a proveď T-perm.' },
            { id: 'p-diag', caseId: 'diag', title: 'Žádná světla', sub: 'výměna přes úhlopříčku', thumb: 'top', sides: 'all', setup: S.YPERM, inverse: true, auto: true,
              alg: 'T-perm', hint: 'Proveď T-perm odkudkoliv – vzniknou světla. Pak pokračuj jako u „světla na jedné straně“.' }
          ] },
        { id: 'B', label: '+ Y-perm', lvl: 'l3', lvlText: 'pokročilý', quiz: true,
          intro: '<p>Pro případ bez světel se naučíš druhý algoritmus (<b>Y-perm</b>), který rovnou prohodí rohy přes úhlopříčku: <code>F R U\' R\' U\' R U R\' F\' R U R\' U\' R\' F R F\'</code></p>',
          cards: [
            { id: 'q-solved', caseId: 'solved', title: 'Světla všude', sub: 'skoro hotovo', thumb: 'top', sides: 'all', setup: "U", auto: true,
              hint: 'Jen otoč horní vrstvou, aby barvy navázaly na spodek.' },
            { id: 'q-adj', caseId: 'adj', title: 'Světla na jedné straně', sub: 'T-perm', thumb: 'top', sides: 'all', setup: S.TPERM, inverse: true, auto: true,
              alg: 'T-perm', hint: 'Světla <b>vlevo</b>, pak T-perm.' },
            { id: 'q-diag', caseId: 'diag', title: 'Žádná světla', sub: 'Y-perm', thumb: 'top', sides: 'all', setup: S.YPERM, inverse: true, auto: true,
              alg: 'Y-perm', hint: 'Odkudkoliv rovnou Y-perm.' }
          ] }
      ],
      tips: '<div class="note"><span class="t">Na konci</span>Často ještě zbývá jedno otočení <code>U</code>, aby horní rohy barvami navázaly na spodní vrstvu. Pak je kostka složená.</div>' +
        '<div class="note why"><span class="t">Proč u T-perm světla vlevo?</span>T-perm prohodí dva <b>pravé</b> horní rohy a levé nechá na místě. Světla vlevo znamenají, že levá dvojice už k sobě patří – stačí opravit pravou stranu.</div>',
      check: ['Všech 6 stran má jednu barvu. Hotovo! 🎉']
    },
    /* ------------------------------------------------------------ hotovo */
    { id: 'hotovo', num: '✓', title: 'Trénink', long: 'Stopky a další kroky', mask: 'full', timer: true }
  ];

  root.Guide2 = { id: '2x2', N: 2, name: '2×2', method: 'vrstvy', steps: steps };
})(window);
