/* Oberfläche „Grundstück“ (Welle E, Teil 1): Karte #g-grund-karte unter „Anbau und Nebengebäude“. Rechnung in grundstueck_kern.js (Ampel aus anbau_kern.js), Texte in daten/texte_grundstueck.js (de/en/ru).
   Plan-Felder (optional, alte Pläne laden unverändert): plan.grundstueck { breite_m, tiefe_m, haus_x_m, haus_y_m } und plan.aussen [ { id, art, x_m, y_m, breite_m, tiefe_m, hoehe_m } ].
   Bedienung: Bild antippen = Baustein setzen; Ziehen mit Maus oder Finger; Pfeiltasten (0,5 m, mit Umschalt 0,1 m); Regler mit Zahlenfeld als genaue Alternative. Die Bausteine ändern Wohnfläche, Heizwärme, Strom und Wasser nicht. */
(function () {
  'use strict';
  var GK = window.GRUNDSTUECK_KERN, AK = window.ANBAU_KERN, G = window.GRUNDRISS, D = window.DATEN || {};
  var W = window.GRUNDRISS_ANBAU && window.GRUNDRISS_ANBAU.werkzeug;
  function byId(id) { return document.getElementById(id); }
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  var esc = W ? W.esc : function (s) { return String(s); };
  function meldeFehler(id, text) { var e = byId(id); if (!e) return; e.textContent = text || ''; e.hidden = !text; }
  if (!GK || !AK || !G || !W || !D.grundstueck || !D.verfahrensfrei) {
    meldeFehler('g-grund-fehler', tr('gsFehlerDaten', { grund: !GK ? 'grundstueck_kern.js fehlt.' : (!W ? 'die Karte Anbau fehlt.' : (!G ? 'die Zeichnung fehlt.' : 'die Datendateien fehlen.')) }));
    return;
  }
  var symbol = W.symbol, n0 = W.n0, nz = W.nz, quelleHtml = W.quelleHtml, ampelChip = W.ampelChip, badge = W.badge, luecke = W.luecke, annahmeSchild = W.annahmeSchild, mitFokus = W.mitFokus;
  function n1(x) { return new Intl.NumberFormat(W.lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x); }
  function m(x) { return nz(Math.round(x * 10) / 10); }   /* Meter mit höchstens einer Stelle */
  function m2(x) { return new Intl.NumberFormat(W.lang(), { maximumFractionDigits: 2 }).format(x); }

  var ICON = { gartenhaus: 'i-an-gartenhaus', garage_carport: 'i-an-garage', terrassendach: 'i-an-terrasse', sauna: 'i-gs-sauna', pool: 'i-gs-pool', gewaechshaus: 'i-gs-gewaechshaus', brunnen: 'i-gs-brunnen', regentank: 'i-gs-regentank',
    kleinwind: 'i-gs-kleinwind', waermepumpe: 'i-gs-waermepumpe', wallbox: 'i-gs-wallbox', huehnerstall: 'i-gs-huhn', bienenstock: 'i-gs-biene', fischteich: 'i-gs-fisch' };
  var ctx = null, auswahl = null, loeschFrage = null, timer = null, teilweise = false, drag = null, hinweisZeigen = true, statusText = '';
  try { hinweisZeigen = localStorage.getItem('immo-gs-hinweis') !== '1'; } catch (e0) { hinweisZeigen = true; }
  function rechne() { ctx = GK.rechne(G.plan()); return ctx; }
  function artName(id) { return tr('gsArt_' + id); }
  function itemById(id) { var r = null; (ctx ? ctx.items : []).forEach(function (it) { if (it.id === id) r = it; }); return r; }

  /* ---------- Steuerung: Größe und Bildleiste ---------- */
  function reglerHtml(idBase, name, wert, min, max, step, textKey, nameKey) {
    var k = idBase.slice(3);
    return '<div class="es-feld"><label class="es-label" for="' + idBase + '">' + esc(name) + ' <b id="' + idBase + '-wert" class="es-zahl">' + m2(wert) + ' m</b></label>' +
      '<input type="range" id="' + idBase + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + Math.min(max, Math.max(min, wert)) + '" data-gs="' + k + '" data-fk="' + k + '" aria-valuetext="' + esc(tr(textKey, { n: m2(wert) })) + '"></div>' +
      '<div class="es-feld"><label class="es-label" for="' + idBase + '-zahl">' + esc(tr(nameKey)) + '</label>' +
      '<input type="text" inputmode="decimal" id="' + idBase + '-zahl" data-gs="' + k + '-zahl" data-fk="' + k + '-zahl" autocomplete="off" value="' + esc(m2(wert)) + '">' +
      '<span class="fehler" id="' + idBase + '-zahl-fehler" role="alert" hidden></span></div>';
  }
  function steuerHtml(c) {
    var g = c.g, h = '';
    h += '<h4 class="es-h5">' + symbol('i-gs-grundstueck') + esc(tr('gsGroesse')) + '</h4>';
    h += '<div class="gs-zwei"><div class="an-reihe gs-reihe">' + reglerHtml('gs-gb', tr('gsBreite'), g.breite, GK.GRUND_MIN, 100, 0.5, 'gsBreiteText', 'gsBreiteZahl') + '</div>';
    h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-gt', tr('gsTiefe'), g.tiefe, GK.GRUND_MIN, 100, 0.5, 'gsTiefeText', 'gsTiefeZahl') + '</div></div>';
    if (!g.explizit.groesse) h += '<p class="klein" data-gs-annahme="start">' + annahmeSchild() + ' ' + esc(tr('gsStartAnnahme')) + '</p>';
    h += c.haus ? '<p class="klein" data-gs-haus="1" data-wand="' + c.haus.wand + '">' + esc(tr('gsHausInfo', { b: m2(c.haus.b), t: m2(c.haus.t), f: m2(c.haus.flaeche), w: m2(Math.round(c.haus.wand * 1000) / 10) })) + '</p>' +
        (c.haus.wandAnnahme ? '<p class="klein" data-gs-annahme="wand">' + annahmeSchild() + ' ' + esc(tr('gsWandAnnahme', { w: m2(Math.round(c.haus.wand * 1000) / 10) })) + '</p>' : '')
      : '<p class="ab-meldung" role="status" data-gs-haus="keins">' + esc(tr('gsKeinHaus')) + '</p>';
    h += '<h4 class="es-h5">' + symbol('i-gs-hand') + esc(tr('gsWahl')) + '</h4>';
    if (!c.items.length) h += '<p class="klein" data-gs-erst="1">' + esc(tr('gsHinweisErst')) + '</p>';
    h += '<div class="ab-stufen gs-arten" role="group" aria-label="' + esc(tr('gsWahl')) + '">' + GK.ARTEN.map(function (a, i) {
      var erst = hinweisZeigen && i === 0 ? ' gs-puls' : '';
      return '<button type="button" class="es-var gs-art' + erst + '" data-gs="neu" data-wert="' + a.id + '" data-fk="neu-' + a.id + '" aria-label="' + esc(tr('gsSetzen', { name: artName(a.id) })) + '">' +
        '<span class="es-var-kopf">' + symbol(ICON[a.id]) + '<b>' + esc(artName(a.id)) + '</b></span></button>';
    }).join('') + '</div>';
    return h;
  }

  /* ---------- Plan (SVG) ---------- */
  var PAD = 0.9;
  var OBEN_PX = 80;   /* Rand über dem Grundstück für die Kompassrose, in Bildpunkten: so bleibt sie außerhalb der Grundstücksfläche und über keinem Baustein */
  var MIN_PX = 30;   /* kleine Bausteine (Wallbox, Bienenstock, Brunnen) werden mindestens so groß gezeichnet; Maße und Rechnung bleiben die echten */
  function ppmBerechnen(c) {
    var box = byId('gs-plan'), wpx = Math.max(240, (box && box.clientWidth) || 600), vbw = c.g.breite + 2 * PAD, vbh = c.g.tiefe + PAD;
    return Math.max(2, Math.min(wpx / vbw, (Math.max(360, window.innerHeight * 0.8) - OBEN_PX) / vbh));
  }
  function rasterPfad(g) {
    var d = '';
    for (var x = 5; x < g.breite; x += 5) d += 'M' + x + ' 0V' + g.tiefe;
    for (var y = 5; y < g.tiefe; y += 5) d += 'M0 ' + y + 'H' + g.breite;
    return d;
  }
  function objHtml(o, ppm, sel) {
    /* o: { id, ampel, name, icon, x, y, b, t, aria, haus } */
    /* Anzeigekasten: mindestens MIN_PX groß und um die echte Lage zentriert; Treffer, Symbol und Fokus richten sich danach, die echte Fläche (gs-form) bleibt wie gemessen */
    var mind = MIN_PX / ppm, bx = Math.min(o.b, 9999), tx = o.t;
    var tw = Math.max(o.b, mind), tt = Math.max(o.t, mind), tx0 = o.x - (tw - o.b) / 2, ty0 = o.y - (tt - o.t) / 2, klein = tw > o.b + 1e-6 || tt > o.t + 1e-6;
    var ik = Math.max(Math.min(Math.min(tw, tt) * (klein ? 0.86 : 0.72), 3), Math.min(0.9, Math.min(tw, tt)));
    var gewaehlt = sel === o.id;
    var s = '<g class="gs-obj ' + (o.haus ? 'gs-haus' : 'gs-a-' + o.ampel) + (gewaehlt ? ' gs-gewaehlt' : '') + '" data-sel="' + o.id + '" data-fk="o-' + o.id + '" tabindex="0" role="button" aria-pressed="' + gewaehlt + '" aria-label="' + esc(o.aria) + '">';
    s += '<rect class="gs-treffer" x="' + tx0 + '" y="' + ty0 + '" width="' + tw + '" height="' + tt + '"/>';
    if (klein) s += '<rect class="gs-marke" x="' + tx0 + '" y="' + ty0 + '" width="' + tw + '" height="' + tt + '" rx="' + (4 / ppm) + '"/>';
    s += '<rect class="gs-form" x="' + o.x + '" y="' + o.y + '" width="' + bx + '" height="' + tx + '"/>';
    s += '<svg class="gs-sym" x="' + (tx0 + (tw - ik) / 2) + '" y="' + (ty0 + (tt - ik) / 2) + '" width="' + ik + '" height="' + ik + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + o.icon + '"/></svg>';
    s += '<rect class="gs-fokus" x="' + (tx0 - 0.15) + '" y="' + (ty0 - 0.15) + '" width="' + (tw + 0.3) + '" height="' + (tt + 0.3) + '"/>';
    return s + '</g>';
  }
  function abstTxt(x, y, wert, fs, anchor) {
    return '<text class="gs-abst" x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + (anchor || 'middle') + '" data-abstand="' + wert + '">' + esc(m(wert)) + ' m</text>';
  }
  /* Anzeigekasten eines Bausteins im Bild (mindestens MIN_PX groß, um die echte Lage zentriert), wie in objHtml */
  function bausteinBox(o, ppm) {
    var mind = MIN_PX / ppm, tw = Math.max(o.b, mind), tt = Math.max(o.t, mind);
    return { x: o.x - (tw - o.b) / 2, y: o.y - (tt - o.t) / 2, b: tw, t: tt };
  }
  /* Maßzahl eines Abstands: Kandidaten entlang der Linie (Mitte, dann zu den Enden) und auf beiden Seiten; die erste, die auf keinem Baustein liegt, gewinnt (sonst die Mitte).
     richtung h: Linie waagerecht von von bis bis bei y = pos; v: senkrecht bei x = pos. Textbreite geschätzt (0,62 × Schrift je Zeichen). */
  function zahlWaehlen(wert, fs, boxen, richtung, von, bis, pos) {
    var w = (m(wert).length + 2) * fs * 0.62, hor = richtung === 'h', k = [];
    [0.5, 0.25, 0.75, 0.12, 0.88].forEach(function (f) {
      var t = von + (bis - von) * f;
      [0, 1].forEach(function (s) {
        var x = hor ? t : pos + (s ? -0.3 : 0.3) * fs, y = hor ? pos + (s ? 1.1 : -0.3) * fs : t + fs * 0.35, a = hor ? 'middle' : (s ? 'end' : 'start');
        k.push({ x: x, y: y, a: a, b: { x: a === 'middle' ? x - w / 2 : (a === 'end' ? x - w : x), y: y - fs * 0.85, b: w, t: fs } });
      });
    });
    var c = k.filter(function (z) { return !boxen.some(function (b) { return GK.ueberlappt(z.b, b); }); })[0] || k[0];
    return abstTxt(c.x, c.y, wert, fs, c.a);
  }
  function svgHtml(c) {
    var g = c.g, ppm = ppmBerechnen(c), fs = 15 / ppm, oben = OBEN_PX / ppm, vbw = g.breite + 2 * PAD, vbh = g.tiefe + PAD + oben, px = Math.floor(vbw * ppm);
    var h = '<svg id="gs-svg" class="gs-svg" viewBox="' + (-PAD) + ' ' + (-oben) + ' ' + vbw + ' ' + vbh + '" style="width:' + px + 'px;max-width:100%" role="group" aria-label="' +
      esc(tr('gsPlanAria', { b: m2(g.breite), t: m2(g.tiefe), n: c.items.length })) + '" data-ppm="' + ppm.toFixed(3) + '" data-pad="' + PAD + '" data-pad-oben="' + oben.toFixed(3) + '">';
    h += '<rect class="gs-grund" x="0" y="0" width="' + g.breite + '" height="' + g.tiefe + '"/><path class="gs-raster" d="' + rasterPfad(g) + '"/>' + kompassHtml(g, ppm);
    var ab = c.abstaende, zahlen = '';
    if (c.haus && ab) {
      var cx = g.hausX + c.haus.b / 2, cy = g.hausY + c.haus.t / 2;
      h += '<g class="gs-fuehr" aria-hidden="true"><path d="M0 ' + cy + 'H' + g.hausX + 'M' + (g.hausX + c.haus.b) + ' ' + cy + 'H' + g.breite + 'M' + cx + ' 0V' + g.hausY + 'M' + cx + ' ' + (g.hausY + c.haus.t) + 'V' + g.tiefe + '"/>';
      h += '</g>';
      /* Maßzahl weicht aus, wenn sie auf einem Baustein läge */
      var boxen = c.items.map(function (it) { return bausteinBox(it, ppm); });
      zahlen = '<g class="gs-fuehr-z" aria-hidden="true">' +
        zahlWaehlen(ab.links, fs, boxen, 'h', 0, g.hausX, cy) + zahlWaehlen(ab.rechts, fs, boxen, 'h', g.hausX + c.haus.b, g.breite, cy) +
        zahlWaehlen(ab.oben, fs, boxen, 'v', 0, g.hausY, cx) + zahlWaehlen(ab.unten, fs, boxen, 'v', g.hausY + c.haus.t, g.tiefe, cx) + '</g>';
      h += objHtml({ id: 'haus', haus: true, icon: 'i-haus', x: g.hausX, y: g.hausY, b: c.haus.b, t: c.haus.t,
        aria: tr('gsHausAria', { b: m2(c.haus.b), t: m2(c.haus.t), l: m(ab.links), r: m(ab.rechts), o: m(ab.oben), u: m(ab.unten) }) }, ppm, auswahl);
    }
    c.items.forEach(function (it) {
      h += objHtml({ id: it.id, ampel: it.ampel, icon: ICON[it.art], x: it.x, y: it.y, b: it.b, t: it.t,
        aria: tr('gsObjAria', { name: artName(it.art), b: m2(it.b), t: m2(it.t), l: m(it.x), o: m(it.y), ampel: tr('anA_' + it.ampel) }) }, ppm, auswahl);
    });
    h += zahlen;   /* die Abstandszahlen zuletzt, damit kein Baustein sie verdeckt */
    var sel = auswahl && auswahl !== 'haus' ? itemById(auswahl) : null;
    /* der Griff zum Größe-Ziehen erscheint nur an Bausteinen, die im Bild mindestens 36 px messen; kleinere (Wallbox, Bienenstock) bleiben ganz ziehbar, ihre Größe stellen die Regler ein */
    if (sel && sel.b * ppm >= 36 && sel.t * ppm >= 36) h += '<circle class="gs-griff" data-griff="' + sel.id + '" cx="' + (sel.x + sel.b) + '" cy="' + (sel.y + sel.t) + '" r="' + (11 / ppm) + '" aria-hidden="true"/>';
    return h + '</svg>';
  }
  function kompassHtml(g, ppm) {
    /* Kompassrose: Norden zeigt in die Richtung von plan.nord (Grad, im Uhrzeigersinn, 0 = nach oben); sie liegt unter den Bausteinen und fängt keine Eingabe ab */
    var nord = (G.plan().nord || 0), kr = 18 / ppm;
    /* Mitte im oberen Rand des Bildes (OBEN_PX hoch), rechts: außerhalb der Grundstücksfläche */
    return '<g class="gs-kompass" transform="translate(' + (g.breite - 40 / ppm) + ' ' + (-40 / ppm) + ')" role="img" aria-label="' + esc(tr('gsKompass')) + ' ' + nord + '°"><circle r="' + kr + '"/><g transform="rotate(' + nord + ')"><path d="M0 ' + (-kr * 0.85) + 'L' + (kr * 0.35) + ' ' + (kr * 0.2) + 'H' + (-kr * 0.35) + 'z"/></g><text x="' + ((kr + 9 / ppm) * Math.sin(nord * Math.PI / 180)).toFixed(3) + '" y="' + (-(kr + 9 / ppm) * Math.cos(nord * Math.PI / 180) + 5 / ppm).toFixed(3) + '" font-size="' + (14 / ppm) + '" text-anchor="middle">N</text></g>';
  }
  function abstaendeHtml(c) {
    var ab = c.abstaende;
    if (!ab) return '<p class="klein">' + esc(tr('gsKeinHaus')) + '</p>';
    var by = AK.abstand(c.land).by;
    return '<p class="gs-abst-zeile es-zahl" data-gs-abstaende="' + ab.links + '|' + ab.rechts + '|' + ab.oben + '|' + ab.unten + '" aria-live="polite"><b>' + esc(tr('gsAbstaende')) + ':</b> ' +
      esc(tr('gsAbstandZeile', { l: m(ab.links), r: m(ab.rechts), o: m(ab.oben), u: m(ab.unten) })) + '</p>' +
      '<p class="klein" data-gs-hinweis="abstand">' + esc(tr('gsAbstandHinweis')) + (by ? ' ' + esc(tr('anAbstandBY')) + ' ' + quelleHtml(by.beleg) : '') + '</p>';
  }
  function meldungenHtml(c) {
    var h = '';
    c.meldungen.forEach(function (mm) {
      if (mm.typ === 'unbekannteArt') h += '<p class="ab-meldung fehler" role="alert" data-gs-meldung="unbekannteArt">' + esc(tr('gsM_unbekannt', { art: mm.art })) + '</p>';
      else if (mm.typ === 'verschoben') h += '<p class="ab-meldung" role="status" data-gs-meldung="verschoben">' + esc(tr('gsM_verschoben', { name: artName(mm.art) })) + '</p>';
      else if (mm.typ === 'hausVerschoben') h += '<p class="ab-meldung" role="status" data-gs-meldung="hausVerschoben">' + esc(tr('gsM_hausVerschoben')) + '</p>';
      else if (mm.typ === 'hausZuGross') h += '<p class="ab-meldung fehler" role="alert" data-gs-meldung="hausZuGross">' + esc(tr('gsM_hausZuGross', { hb: m2(mm.hausB), ht: m2(mm.hausT) })) + '</p>';
      else if (mm.typ === 'zuViele') h += '<p class="ab-meldung" role="status" data-gs-meldung="zuViele">' + esc(tr('gsM_zuViele', { max: mm.max })) + '</p>';
    });
    return h;
  }
  function planHtml(c) {
    var h = '<div class="g-kopfzeile"><h4 class="es-h5">' + symbol('i-gs-grundstueck') + esc(tr('gsPlanTitel')) + '</h4>' + hilfeKnopf('gs-plan-hilfe') + '</div>';
    h += '<p class="klein" id="gs-plan-hilfe"' + (hilfeOffen['gs-plan-hilfe'] ? '' : ' hidden') + '>' + esc(tr('gsPlanHilfe')) + '</p>';
    h += meldungenHtml(c);
    h += '<div class="gs-plan-box">' + svgHtml(c) + '</div>';
    h += '<p class="ab-meldung" role="status" id="gs-status" data-gs-status="1"' + (statusText ? '' : ' hidden') + '>' + esc(statusText) + '</p>';
    h += '<div id="gs-abstaende">' + abstaendeHtml(c) + '</div>';
    h += '<p class="klein">' + annahmeSchild() + ' ' + esc(tr('gsStartGroesse')) + '</p>';
    h += '<p class="ab-meldung" role="note" data-gs-hinweis="verknuepfung">' + esc(tr('gsVerknuepfung')) + '</p>';
    return h;
  }
  var hilfeOffen = {};
  function hilfeKnopf(id) {
    return '<button type="button" class="hilfe-knopf" data-gs="hilfe" aria-expanded="' + (!!hilfeOffen[id]) + '" aria-controls="' + id + '" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button>';
  }

  /* ---------- Ofen der Sauna, Baugebiet der Kleinwindanlage ---------- */
  var OPT_ICON = { elektro: 'i-blitz', holz: 'i-flamme', wr: 'i-gs-wr', wa: 'i-gs-wa', gw: 'i-gs-gewerbe' };
  function optionKnoepfe(feld, werte, aktiv, titelKey) {
    return '<h5 class="es-h5 gs-h5">' + esc(tr(titelKey)) + '</h5><div class="ab-stufen gs-optionen" role="group" aria-label="' + esc(tr(titelKey)) + '">' + werte.map(function (w) {
      var an = w === aktiv;
      return '<button type="button" class="es-var gs-opt' + (an ? ' gs-opt-an' : '') + '" data-gs="' + feld + '" data-wert="' + w + '" data-fk="' + feld + '-' + w + '" aria-pressed="' + an + '"><span class="es-var-kopf">' + symbol(OPT_ICON[w]) + '<b>' + esc(tr('gs_' + feld + '_' + w)) + '</b></span></button>';
    }).join('') + '</div>';
  }
  function optionHtml(it) {
    var h = '';
    if (it.art === 'sauna') {
      h += optionKnoepfe('ofen', ['elektro', 'holz'], it.ofen, 'gsOfenTitel');
      if (!it.ofenEigen) h += '<p class="klein" data-gs-annahme="ofen">' + annahmeSchild() + ' ' + esc(tr('gsOfenAnnahme')) + '</p>';
    } else if (it.art === 'kleinwind') {
      h += optionKnoepfe('gebiet', ['wr', 'wa', 'gw'], it.gebiet, 'gsGebietTitel');
      if (!it.gebietEigen) h += '<p class="klein" data-gs-annahme="gebiet">' + annahmeSchild() + ' ' + esc(tr('gsGebietAnnahme')) + '</p>';
      h += '<p class="klein" data-gs-hinweis="gebiet">' + esc(tr('gsGebietWo')) + '</p>';
    }
    return h;
  }

  /* ---------- Auswahl: Größe genau einstellen ---------- */
  function auswahlHtml(c) {
    if (!auswahl) return '<p class="klein" data-gs-auswahl="keine">' + esc(tr('gsAuswahlKeine')) + '</p>';
    var h = '';
    if (auswahl === 'haus') {
      if (!c.haus) return '';
      h += '<h4 class="es-h5" data-gs-auswahl="haus">' + symbol('i-haus') + esc(tr('gsAuswahl', { name: tr('gsHaus') })) + '</h4>';
      h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-hx', tr('gsHausLinks'), c.g.hausX, 0, Math.max(0, Math.min(100, c.g.breite - c.haus.b)), 0.1, 'gsBreiteText', 'gsHausLinks') + '</div>';
      h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-hy', tr('gsHausOben'), c.g.hausY, 0, Math.max(0, Math.min(100, c.g.tiefe - c.haus.t)), 0.1, 'gsTiefeText', 'gsHausOben') + '</div>';
      return h;
    }
    var it = itemById(auswahl);
    if (!it) return '<p class="klein" data-gs-auswahl="keine">' + esc(tr('gsAuswahlKeine')) + '</p>';
    var a = GK.artInfo(it.art);
    h += '<h4 class="es-h5" data-gs-auswahl="' + it.id + '">' + symbol(ICON[it.art]) + esc(tr('gsAuswahl', { name: artName(it.art) })) + '</h4>';
    h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-ub', tr('gsBauBreite'), it.b, GK.MASS_MIN, Math.min(a.max, c.g.breite), 0.1, 'gsBauBreiteText', 'gsBauBreiteZahl') + '</div>';
    h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-ut', tr('gsBauTiefe'), it.t, GK.MASS_MIN, Math.min(a.max, c.g.tiefe), 0.1, 'gsBauTiefeText', 'gsBauTiefeZahl') + '</div>';
    if (it.vf && it.vf.ok && it.vf.brauchtHoehe) {
      h += '<div class="an-reihe gs-reihe">' + reglerHtml('gs-uh', (it.art === 'pool' || it.art === 'fischteich' ? tr('gsBauWassertiefe') : tr('gsBauHoehe')), it.h, 0.5, 20, 0.1, 'gsBauHoeheText', 'gsBauHoeheZahl') + '</div>';
      if (!it.hoeheEigen) h += '<p class="klein" data-gs-annahme="hoehe">' + annahmeSchild() + ' ' + esc(tr('gsHoeheWarum', { h: m2(a.h) })) + '</p>';
    }
    h += optionHtml(it);
    if (loeschFrage === it.id) {
      h += '<div class="ab-meldung" role="alertdialog" aria-label="' + esc(tr('gsEntfernenFrage', { name: artName(it.art) })) + '" data-gs-frage="1"><p>' + esc(tr('gsEntfernenFrage', { name: artName(it.art) })) +
        '</p><div class="knopfreihe"><button type="button" class="knopf mittel" data-gs="entfernen-ja" data-fk="ja">' + esc(tr('gsEntfernenJa')) + '</button> <button type="button" class="knopf mittel zweit" data-gs="entfernen-nein" data-fk="nein">' + esc(tr('gsEntfernenNein')) + '</button></div></div>';
    } else {
      h += '<p><button type="button" class="knopf mittel zweit gs-weg" data-gs="entfernen" data-fk="weg">' + symbol('i-weg-teil') + ' ' + esc(tr('gsEntfernen')) + '</button></p>';
    }
    return h;
  }

  /* ---------- Balken ---------- */
  function balkenHtml(c) {
    var f = c.flaechen, ph = f.grund ? Math.min(100, f.haus / f.grund * 100) : 0, pb = f.grund ? Math.min(100 - ph, f.bausteine / f.grund * 100) : 0;
    var h = '<h4 class="es-h5">' + symbol('i-rechner') + esc(tr('gsBalkenTitel')) + '</h4>';
    h += '<p class="es-satz klein-satz" data-gs-balken="satz" data-grund="' + f.grund + '" data-bebaut="' + f.bebaut + '" data-prozent="' + f.prozent + '">' +
      esc(tr('gsBalkenSatz', { g: n0(f.grund), s: m2(f.bebaut), p: n1(f.prozent), f: m2(Math.max(0, f.frei)) })) + '</p>';
    h += '<div class="gs-balken" role="img" aria-label="' + esc(tr('gsBalkenAria', { g: n0(f.grund), h: m2(f.haus), b: m2(f.bausteine), s: m2(f.bebaut), p: n1(f.prozent) })) + '"><span class="gs-b-haus" style="width:' + ph.toFixed(2) + '%"></span><span class="gs-b-bau" style="width:' + pb.toFixed(2) + '%"></span></div>';
    h += '<p class="klein gs-leg"><span class="gs-pkt gs-b-haus"></span>' + esc(tr('gsLegHaus', { n: m2(f.haus) })) + ' <span class="gs-pkt gs-b-bau"></span>' + esc(tr('gsLegBau', { n: m2(f.bausteine) })) + ' <span class="gs-pkt gs-b-frei"></span>' + esc(tr('gsLegFrei', { n: m2(Math.max(0, f.frei)) })) + '</p>';
    h += '<p class="klein">' + annahmeSchild() + ' ' + esc(tr('gsBalkenAnnahme')) + '</p>';
    return h;
  }

  /* ---------- Liste je Baustein ---------- */
  function preisText(k) {
    var einheit = k.einheit || '';
    if (k.von != null && k.bis != null && k.von !== k.bis) return tr('gsSpanne', { von: nz(k.von), bis: nz(k.bis), einheit: einheit });
    return tr('gsEinWert', { wert: nz(k.von != null ? k.von : k.bis), einheit: einheit });
  }
  function zeileDaten(z, art) {
    var b = { id: z.id, quelle: z.quelle, url: z.url, abruf: z.abruf, status: z.status };
    if (z.luecke) return '<li data-gs-' + art + '="' + esc(z.id) + '" data-luecke="1">' + luecke() + ' <b>' + esc(z.name) + '</b> <span class="klein">' + esc(z.grund) + '</span> ' + quelleHtml(b) + '</li>';
    var zahl = z.von != null ? '<span class="es-zahl" data-von="' + z.von + '" data-bis="' + z.bis + '">' + esc(preisText(z)) + '</span> ' : '';
    return '<li data-gs-' + art + '="' + esc(z.id) + '">' + zahl + (art === 'pflichten' ? '<b>' : '') + esc(z.name) + (art === 'pflichten' ? '</b>' : '') +
      (z.hinweis ? ' <span class="klein">' + esc(z.hinweis) + '</span>' : '') + ' <span class="klein">' + quelleHtml(b) + '</span></li>';
  }
  function listeHtml(c) {
    var h = '<h4 class="es-h5">' + symbol('i-paragraf') + esc(tr('gsListeTitel')) + '</h4>';
    if (!c.items.length) return h + '<p class="klein" data-gs-liste="leer">' + esc(tr('gsListeLeer')) + '</p>';
    h += '<p class="klein" data-an-land="' + esc(c.land) + '">' + esc(tr('gsFuer', { land: c.landName })) + '</p>';
    c.items.forEach(function (it) {
      var v = it.vf, a = it.ampel, summe = v && v.ok ? v.summe : null, d = it.daten;
      h += '<article class="gs-baustein gs-k-' + a + '" data-gs-item="' + it.id + '" data-art="' + it.art + '" data-ampel="' + a + '">';
      h += '<div class="gs-k-kopf">' + symbol(ICON[it.art]) + '<b>' + esc(artName(it.art)) + '</b> <span class="klein es-zahl" data-gs-groesse="' + it.flaeche + '">' + esc(tr('gsGroesseZeile', { b: m2(it.b), t: m2(it.t), f: m2(it.flaeche) })) + '</span>' +
        ' <button type="button" class="knopf mittel zweit gs-zeigen" data-gs="zeigen" data-wert="' + it.id + '" data-fk="z-' + it.id + '">' + esc(tr('gsZeigen')) + '</button></div>';
      h += '<h5 class="es-h5 gs-h5">' + symbol('i-paragraf') + esc(tr('gsAntragTitel')) + '</h5>';
      if (!summe) h += '<p class="ab-meldung fehler" role="alert">' + esc(tr('anKeineDaten', { grund: v ? v.grund : '' })) + '</p>';
      else {
        var satz = summe.ursache === 'keinBaustein' ? tr('gsKeinBaustein') : W.satzFuer(summe);
        h += '<div class="an-satz an-f ' + a + '" role="status" data-an-ampel="' + a + '">' + ampelChip(a, false) + '<span class="an-satz-text" data-an-satz="antrag">' + esc(satz) + '</span></div>';
        if (summe.zeile && summe.zeile.auslegung) h += W.auslegungHtml(summe.zeile);
        if (summe.alternativen) h += '<p class="klein" data-gs-alternativen="1">' + esc(tr('anAlternativen')) + '</p>';
        if (v.holzHinweis) h += '<p class="ab-meldung" role="note" data-gs-holz="hinweis">' + esc(tr('gsHolzHinweis')) + '</p>';
        if (summe.mehrere) h += '<p class="klein">' + esc(tr('anMehrere')) + '</p>';
        if (v.zeilen.some(function (z) { return z.tiefeMax != null; })) h += '<p class="klein" data-gs-tiefe-annahme="1">' + annahmeSchild() + ' ' + esc(tr('gsTiefeAnnahme')) + '</p>';
        if (v.zeilen.length) h += '<details class="an-bed gs-einzel"><summary>' + esc(tr('gsEinzel')) + '</summary>' + v.zeilen.map(W.zeileHtml).join('') + '</details>';
      }
      h += '<h5 class="es-h5 gs-h5">' + symbol('i-rechner') + esc(tr('gsKostenTitel')) + '</h5><ul class="gs-ul">' + d.kosten.map(function (z) { return zeileDaten(z, 'kosten'); }).join('') + '</ul>';
      h += '<h5 class="es-h5 gs-h5">' + symbol('i-hammer') + esc(tr('gsPflichtTitel')) + '</h5>' + (d.pflichten.length ? '<ul class="gs-ul">' + d.pflichten.map(function (z) { return zeileDaten(z, 'pflichten'); }).join('') + '</ul>' : '<p class="klein">' + esc(tr('gsKeinePflicht')) + '</p>');
      if (d.werte.length) h += '<h5 class="es-h5 gs-h5">' + symbol('i-mass') + esc(tr('gsWerteTitel')) + '</h5><ul class="gs-ul">' + d.werte.map(function (z) { return zeileDaten(z, 'werte'); }).join('') + '</ul>';
      h += '</article>';
    });
    return h;
  }

  function kopf(c) {
    var el = byId('g-grund-kopfzeile');
    if (!el) return;
    el.textContent = tr('gsKopf', { g: n0(c.flaechen.grund), p: n0(Math.round(c.flaechen.prozent)), n: c.items.length, grau: c.zaehlung.grau, rot: c.zaehlung.rot });
    /* nur Startannahmen (Grundstück nicht angefasst, kein Baustein): kein Ergebnis zum Weiterleiten, wie „Noch nichts gewählt“ in der Karte Anbau */
    if (!c.g.explizit.groesse && !c.g.explizit.lage && !c.items.length) el.setAttribute('data-leer', '1'); else el.removeAttribute('data-leer');
  }

  /* ---------- Zusammenspiel ---------- */
  function zeichneTeil(id, fn, c) { var w = byId(id); if (!w) return; var neu = fn(c); mitFokus(w, function () { w.innerHTML = neu; }); }
  function jetzt(nurErgebnis) {
    clearTimeout(timer);
    var c;
    try { c = rechne(); } catch (e) { meldeFehler('g-grund-fehler', tr('gsFehlerRechnen', { grund: e && e.message ? e.message : e })); return; }
    meldeFehler('g-grund-fehler', '');
    try {
      if (auswahl && auswahl !== 'haus' && !itemById(auswahl)) auswahl = null;
      var d = byId('g-grund-details');
      if (d && d.open) {
        if (!nurErgebnis) { zeichneTeil('gs-steuer', steuerHtml, c); zeichneTeil('gs-auswahl', auswahlHtml, c); }
        zeichneTeil('gs-plan', planHtml, c); zeichneTeil('gs-balken', balkenHtml, c); zeichneTeil('gs-liste', listeHtml, c);
      }
      kopf(c);
    } catch (e2) { meldeFehler('g-grund-fehler', tr('gsFehlerRechnen', { grund: e2 && e2.message ? e2.message : e2 })); }
    teilweise = false;
  }
  function aktualisieren() { clearTimeout(timer); var nur = teilweise; timer = setTimeout(function () { jetzt(nur); }, 150); }
  /* beim Ziehen nur Plan, Abstände, Balken und Kopfzeile neu zeichnen (die Liste folgt nach dem Loslassen) */
  var rafAn = false;
  function schnell() {
    if (rafAn) return;
    rafAn = true;
    window.requestAnimationFrame(function () {
      rafAn = false;
      try { var c = rechne(); zeichneTeil('gs-plan', planHtml, c); zeichneTeil('gs-balken', balkenHtml, c); kopf(c); } catch (e) { meldeFehler('g-grund-fehler', tr('gsFehlerRechnen', { grund: e && e.message ? e.message : e })); }
    });
  }
  function geaendert(nurErgebnis) { teilweise = !!nurErgebnis; G.geaendert(); }
  function sage(text) { statusText = text; var s = byId('gs-status'); if (s) { s.textContent = text; s.hidden = !text; } }

  /* ---------- Eingaben ---------- */
  function feldFehler(id, text) { meldeFehler(id, text); var f = byId(id.replace(/-fehler$/, '')); if (f) { if (text) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); } }
  function wertSetzen(k, x) {
    var plan = G.plan();
    if (k === 'gb') return GK.grundstueckSetzen(plan, 'breite_m', x);
    if (k === 'gt') return GK.grundstueckSetzen(plan, 'tiefe_m', x);
    if (k === 'hx') return GK.grundstueckSetzen(plan, 'haus_x_m', x);
    if (k === 'hy') return GK.grundstueckSetzen(plan, 'haus_y_m', x);
    var feld = { ub: 'breite_m', ut: 'tiefe_m', uh: 'hoehe_m' }[k];
    if (!feld || !auswahl) return false;
    GK.festschreiben(plan);
    return GK.bausteinSetzen(plan, auswahl, feld, x);
  }
  var GRENZEN = { gb: [GK.GRUND_MIN, GK.GRUND_MAX, 'gsBreiteZahl'], gt: [GK.GRUND_MIN, GK.GRUND_MAX, 'gsTiefeZahl'], hx: [0, GK.GRUND_MAX, 'gsHausLinks'], hy: [0, GK.GRUND_MAX, 'gsHausOben'],
    ub: [GK.MASS_MIN, 60, 'gsBauBreiteZahl'], ut: [GK.MASS_MIN, 60, 'gsBauTiefeZahl'], uh: [GK.MASS_MIN, GK.HOEHE_MAX, 'gsBauHoeheZahl'] };
  var TEXTKEY = { gb: 'gsBreiteText', gt: 'gsTiefeText', hx: 'gsBreiteText', hy: 'gsTiefeText', ub: 'gsBauBreiteText', ut: 'gsBauTiefeText', uh: 'gsBauHoeheText' };
  function bei(ev) {
    var t = ev.target;
    if (!t.getAttribute) return;
    var a = t.getAttribute('data-gs');
    if (!a) return;
    if (ev.type === 'input' && t.type === 'range') {
      var x = Math.round(+t.value * 100) / 100, lab = byId(t.id + '-wert'), zahl = byId(t.id + '-zahl');
      if (lab) lab.textContent = m2(x) + ' m';
      if (zahl) { zahl.value = m2(x); feldFehler(zahl.id + '-fehler', ''); }
      t.setAttribute('aria-valuetext', tr(TEXTKEY[a], { n: m2(x) }));
      if (wertSetzen(a, x)) {
        var an = document.querySelector('[data-gs-annahme=start]');   /* eigene Maße: das Annahme-Schild entfällt sofort */
        if (an && (a === 'gb' || a === 'gt')) an.remove();
        geaendert(true);
      }
      return;
    }
    if (ev.type === 'change' && /-zahl$/.test(a)) {
      var k = a.replace(/-zahl$/, ''), gr = GRENZEN[k], v = t.value.trim();
      if (!gr) return;
      var fid = t.id + '-fehler';
      if (v === '') { feldFehler(fid, ''); return; }
      var z = W.zahlLesen(v);
      if (!isFinite(z) || z < gr[0] || z > gr[1]) { feldFehler(fid, tr('gsFehlerZahl', { name: tr(gr[2]), min: nz(gr[0]), max: nz(gr[1]) })); return; }
      feldFehler(fid, '');
      if (wertSetzen(k, z)) geaendert(false);
    }
  }
  function klick(ev) {
    var t = ev.target.closest('[data-gs]');
    if (!t || t.tagName === 'INPUT') return;
    var a = t.getAttribute('data-gs'), w = t.getAttribute('data-wert');
    if (a === 'hilfe') { var id = t.getAttribute('aria-controls'), p = byId(id), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf ? 'true' : 'false'); hilfeOffen[id] = auf; if (p) p.hidden = !auf; return; }
    if (a === 'neu') {
      try { localStorage.setItem('immo-gs-hinweis', '1'); } catch (e) { /* nur der Hinweis fällt weg */ }
      hinweisZeigen = false;
      var r = GK.bausteinHinzu(G.plan(), w);
      if (!r.ok) { sage(r.grund === 'zuViele' ? tr('gsStatusZuViele', { max: GK.MAX_BAUSTEINE }) : ''); return; }
      auswahl = r.id; loeschFrage = null;
      geaendert(false);
      var c = rechne(), it = itemById(r.id);
      sage((r.frei ? '' : tr('gsStatusVoll') + '. ') + tr('gsStatusGesetzt', { name: artName(w), ampel: it ? tr('anA_' + it.ampel) : '' }));
      /* liegt der Plan außerhalb des Bildes, zeigt die Seite ihn (ohne Animation); der Fokus bleibt auf dem Bildknopf */
      var sv = byId('gs-plan') ? byId('gs-plan').getBoundingClientRect() : null;
      if (sv && (sv.top > window.innerHeight - 140 || sv.bottom < 120)) byId('gs-plan').scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    }
    if ((a === 'ofen' || a === 'gebiet') && auswahl) {
      GK.festschreiben(G.plan());
      if (GK.bausteinOption(G.plan(), auswahl, a, w)) geaendert(false);
      return;
    }
    if (a === 'zeigen') { auswahl = w; loeschFrage = null; jetzt(false); var o = document.querySelector('#gs-svg [data-sel="' + w + '"]'); if (o) { try { o.focus(); } catch (e3) { /* ohne Fokus */ } } return; }
    if (a === 'entfernen') { loeschFrage = auswahl; zeichneTeil('gs-auswahl', auswahlHtml, rechne()); var ja = document.querySelector('#gs-auswahl [data-fk="nein"]'); if (ja) ja.focus(); return; }
    if (a === 'entfernen-nein') { loeschFrage = null; zeichneTeil('gs-auswahl', auswahlHtml, rechne()); var wb = document.querySelector('#gs-auswahl [data-fk="weg"]'); if (wb) wb.focus(); return; }
    if (a === 'entfernen-ja') {
      var it2 = itemById(auswahl), nm = it2 ? artName(it2.art) : '';
      GK.festschreiben(G.plan());
      GK.bausteinEntfernen(G.plan(), auswahl);
      auswahl = null; loeschFrage = null;
      geaendert(false);
      sage(tr('gsStatusEntfernt', { name: nm }));
    }
  }

  /* ---------- Ziehen und Tasten ---------- */
  function punkt(ev) {
    var svg = byId('gs-svg'); if (!svg || !svg.getScreenCTM) return null;
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  function lageSetzen(id, x, y) {
    var plan = G.plan();
    if (id === 'haus') { GK.grundstueckSetzen(plan, 'haus_x_m', x); GK.grundstueckSetzen(plan, 'haus_y_m', y); }
    else { GK.festschreiben(plan); GK.bausteinSetzen(plan, id, 'x_m', x); GK.bausteinSetzen(plan, id, 'y_m', y); }
  }
  function istHaus(id) { return id === 'haus'; }
  function lageVon(id) { var c = ctx || rechne(); if (istHaus(id)) return { x: c.g.hausX, y: c.g.hausY }; var it = itemById(id); return it ? { x: it.x, y: it.y } : null; }
  function aufDown(ev) {
    if (ev.button != null && ev.button > 0) return;
    var gr = ev.target.closest('[data-griff]'), o = ev.target.closest('[data-sel]'), p = punkt(ev);
    if (!p) return;
    if (gr) {
      var itg = itemById(gr.getAttribute('data-griff'));
      if (!itg) return;
      drag = { modus: 'groesse', id: itg.id, p0: p, b0: itg.b, t0: itg.t, bewegt: false };
      ev.preventDefault();
      return;
    }
    if (!o) return;
    var id = o.getAttribute('data-sel'), l = lageVon(id);
    if (!l) return;
    drag = { modus: 'lage', id: id, p0: p, l0: l, bewegt: false };
    if (auswahl !== id) { auswahl = id; loeschFrage = null; }
    ev.preventDefault();
  }
  function aufMove(ev) {
    if (!drag) return;
    var p = punkt(ev); if (!p) return;
    var dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.bewegt && Math.abs(dx) + Math.abs(dy) < 0.15) return;
    drag.bewegt = true;
    var plan = G.plan();
    if (drag.modus === 'lage') lageSetzen(drag.id, Math.round((drag.l0.x + dx) * 10) / 10, Math.round((drag.l0.y + dy) * 10) / 10);
    else { GK.festschreiben(plan); GK.bausteinSetzen(plan, drag.id, 'breite_m', Math.max(GK.MASS_MIN, Math.round((drag.b0 + dx) * 10) / 10)); GK.bausteinSetzen(plan, drag.id, 'tiefe_m', Math.max(GK.MASS_MIN, Math.round((drag.t0 + dy) * 10) / 10)); }
    schnell();
  }
  function aufUp() {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.bewegt) { GK.festschreiben(G.plan()); geaendert(false); sage(''); }
    else jetzt(false);
  }
  function aufTaste(ev) {
    var o = ev.target.closest && ev.target.closest('[data-sel]');
    if (!o) return;
    var id = o.getAttribute('data-sel');
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); auswahl = id; loeschFrage = null; jetzt(false); var n = document.querySelector('#gs-svg [data-sel="' + id + '"]'); if (n) n.focus({ preventScroll: true }); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { if (istHaus(id)) return; ev.preventDefault(); auswahl = id; loeschFrage = id; jetzt(false); var ja = document.querySelector('#gs-auswahl [data-fk="nein"]'); if (ja) ja.focus(); return; }
    var dx = { ArrowLeft: -1, ArrowRight: 1 }[ev.key] || 0, dy = { ArrowUp: -1, ArrowDown: 1 }[ev.key] || 0;
    if (!dx && !dy) return;
    ev.preventDefault();
    var st = ev.shiftKey ? 0.1 : 0.5, l = lageVon(id);
    if (!l) return;
    if (auswahl !== id) { auswahl = id; loeschFrage = null; }
    lageSetzen(id, Math.round((l.x + dx * st) * 100) / 100, Math.round((l.y + dy * st) * 100) / 100);
    GK.festschreiben(G.plan());
    geaendert(false);
  }

  /* ---------- Einhängen ---------- */
  var wurzel = byId('g-grund-inhalt');
  if (wurzel) {
    wurzel.addEventListener('click', klick); wurzel.addEventListener('input', bei); wurzel.addEventListener('change', bei);
    wurzel.addEventListener('pointerdown', aufDown); wurzel.addEventListener('keydown', aufTaste);
    /* Finger auf Haus, Baustein oder Größe-Griff: ziehen statt scrollen (Browser, die touch-action an SVG-Teilen nicht beachten, bekommen dasselbe über touchstart); sonst scrollt die Seite */
    wurzel.addEventListener('touchstart', function (ev) { var o = ev.target.closest && ev.target.closest('[data-sel],[data-griff]'); if (o && ev.cancelable) ev.preventDefault(); }, { passive: false });
    window.addEventListener('pointermove', aufMove); window.addEventListener('pointerup', aufUp); window.addEventListener('pointercancel', aufUp);
  }
  var det = byId('g-grund-details');
  if (det) det.addEventListener('toggle', function () { if (det.open) jetzt(); });
  window.addEventListener('sprachegewechselt', function () { jetzt(); });
  var resizeT = null, letzteBreite = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { var b = byId('gs-plan') ? byId('gs-plan').clientWidth : 0; if (b !== letzteBreite) { letzteBreite = b; jetzt(true); } }, 200);
  });

  window.GRUNDRISS_GRUNDSTUECK = { aktualisieren: aktualisieren, jetzt: jetzt, ergebnis: function () { return ctx; }, auswaehlen: function (id) { auswahl = id; loeschFrage = null; jetzt(false); } };
  setTimeout(function () { jetzt(); }, 0);
})();
