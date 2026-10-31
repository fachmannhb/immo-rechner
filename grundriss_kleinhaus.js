/* Oberfläche „Kleinhaus“ (K1): Kern kleinhaus_kern.js, Daten daten/kleinhaus.js. 3D nur bei Änderung gezeichnet, keine Animation (auch nicht bei prefers-reduced-motion). */
(function () {
  'use strict';
  var KK = window.KLEINHAUS_KERN, G = window.GRUNDRISS, D = window.DATEN || {}, WZ = window.GRUNDRISS_ANBAU && window.GRUNDRISS_ANBAU.werkzeug, KD = D.kleinhaus;
  function byId(i) { return document.getElementById(i); }
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function melde(t) { var e = byId('g-kleinhaus-fehler'); if (e) { e.textContent = t || ''; e.hidden = !t; } }
  if (!KK || !G || !WZ || !KD) { melde(tr('khFehler', { grund: (!KK ? 'kleinhaus_kern.js' : !WZ ? 'Karte Anbau' : !G ? 'Zeichnung' : 'Daten') + ' fehlt.' })); return; }
  var esc = WZ.esc, sym = WZ.symbol, nz = WZ.nz, n0 = WZ.n0, schild = WZ.annahmeSchild;
  function T(k, v) { return esc(tr(k, v)); }
  function nf(x, d) { return new Intl.NumberFormat(WZ.lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(x); }
  function eur(x) { return nf(x, 0); }
  var ctx = null, timer = null, nurErg = false, hilfe = {}, hinweis = true;
  try { hinweis = localStorage.getItem('immo-kh-hinweis') !== '1'; } catch (e0) { hinweis = true; }
  var ICON = { cont20: 'i-kh-box', falt: 'i-kh-falt', ausklapp: 'i-kh-aus', tiny: 'i-kh-tiny', modul: 'i-kh-modul' }, GRP = { kauf: 'w', fracht: 't', zoll: 'a', eust: 'a', kran: 'u', fundament: 'u', strom: 'u', wasser: 'u', abwasser: 'u', daemmung: 'u' };
  var BAL = { w: 'khBal_ware', t: 'khBal_transport', a: 'khBal_abgaben', u: 'khBal_aufstellung' };

  function beleg(c) {
    return (typeof c.q === 'string' ? c.q.split(',').map(function (s) { return s.trim(); }) : c.q || []).map(function (k, i) { var q = KD.quellen[k] || {}; return WZ.quelleHtml({ id: i ? '' : c.ids, quelle: q.titel || k, url: /^https?:/.test(q.url || '') ? q.url : '', abruf: c.abruf, status: c.status }); }).join(' ') || (c.ids ? '<span class="klein">' + esc(c.ids) + ' · ' + esc(c.status) + '</span>' : '');
  }
  function kopfZeile(s, k, t) {
    var id = 'kh-h-' + t;
    return '<h4 class="es-h5 sa-h">' + sym(s) + '<span>' + T(k) + '</span> <button type="button" class="hilfe-knopf" data-kh="hilfe" data-wert="' + id + '" aria-expanded="' + !!hilfe[id] + '" aria-controls="' + id + '" aria-label="' + T('hilfeKnopf') + '">?</button></h4><p class="klein" id="' + id + '"' + (hilfe[id] ? '' : ' hidden') + '>' + T('khHilfe_' + t) + '</p>';
  }
  function h5(s, k, v) { return '<h5 class="es-h5 sa-h5">' + (s ? sym(s) : '') + T(k, v) + '</h5>'; }
  function knoepfe(feld, werte, aktiv, label, nameKey, icon, extra) {
    return '<div class="ab-stufen sa-knoepfe ' + (extra || '') + '" role="group" aria-label="' + T(label) + '">' + werte.map(function (w) {
      return '<button type="button" class="es-var sa-opt' + (hinweis && feld === 'typ' ? ' gs-puls' : '') + '" data-kh="' + feld + '" data-wert="' + w + '" data-fk="' + feld + '-' + w + '" aria-pressed="' + (w === aktiv) + '"><span class="es-var-kopf">' + sym(icon(w)) + '<b>' + T(nameKey + w) + '</b></span></button>';
    }).join('') + '</div>';
  }
  function td(k, inh, z) { return '<td' + (z ? ' class="z"' : '') + ' data-titel="' + T(k) + '">' + inh + '</td>'; }
  function tab(sp, zeilen, attr) { return '<div class="tabelle-kasten karten-kasten"><table class="karten sa-tab"' + (attr || '') + '><thead><tr>' + sp.map(function (k) { return '<th scope="col">' + T(k) + '</th>'; }).join('') + '</tr></thead><tbody>' + zeilen + '</tbody></table></div>'; }
  function spanne(v, b) { return v === b ? eur(v) + ' €' : eur(v) + ' bis ' + eur(b) + ' €'; }
  function typName(id) { return tr('khTyp_' + id); }

  /* ---------- Teil 1 ---------- */
  function t1Html(c) {
    var t = c.typ, h = kopfZeile('i-kh-modul', 'khT1', 't1') + knoepfe('typ', ['cont20', 'falt', 'ausklapp', 'tiny', 'modul'], c.ps.typ, 'khT1', 'khTyp_', function (w) { return ICON[w]; });
    if (t.regler) h += '<div class="es-feld"><label class="es-label" for="kh-r">' + T('khRegler') + ' <b id="kh-r-wert" class="es-zahl">' + T('khReglerWert', { p: n0(c.ps.regler * 100) }) + '</b></label><input type="range" id="kh-r" min="0" max="1" step="0.05" value="' + c.ps.regler + '" data-kh="regler" data-fk="regler"></div>';
    return h + (c.ps.explizit.typ ? '' : '<p class="klein" data-kh-annahme="start">' + schild() + ' ' + T('khAnnahmeStart') + '</p>');
  }
  function t1eHtml(c) {
    var t = c.typ, m = c.mass, z = t.zu, o = t.offen, w = c.wohn, h = '';
    var f3 = function (x) { return new Intl.NumberFormat(WZ.lang(), { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(x); };
    var fm = function (a) { return f3(a[0]) + ' × ' + f3(a[1]) + ' × ' + f3(a[2]); };
    h += '<p class="sa-gross" data-kh-mass="' + m.l + 'x' + m.b + 'x' + m.h + '"><b>' + T('khMasse', { l: f3(m.l), b: f3(m.b), h: f3(m.h) }) + '</b></p>';
    h += '<p class="klein" data-kh-zo="1">' + T('khMasseZO', { z: fm(z), o: fm(o) }) + '</p>';
    h += w.m2 != null ? '<p data-kh-wohn="' + w.m2 + '"><b>' + T('khWohn', { m2: nf(w.m2, 2) }) + '</b> <span class="klein">(' + T('khWohnArt_' + w.art) + ')</span></p>' : '<p data-kh-wohn="grenze"><b>' + T('khWohnKein') + '</b> <span class="klein">(' + T('khWohnArt_grenze', { von: nf(w.von, 1), bis: nf(w.bis, 1) }) + ')</span></p>';
    if (t.gewicht) h += '<p class="klein">' + T('khGew', { art: tr('khGew_' + t.gewichtArt), kg: nf(t.gewicht, 0) }) + '</p>';
    if (t.mass.annahme) h += '<p class="klein" data-kh-annahme="mass">' + schild() + ' ' + T('khAnnahmeMass') + '</p>';
    return h + '<p class="klein">' + esc(t.mass.hinweis) + ' ' + beleg(t.mass) + '</p>';
  }

  /* ---------- Skizzen: 1 m = 75,6 px bei 96 dpi = 20 mm = 1:50; 37,8 px = 1:100 ---------- */
  var ML = 40, MT = 30;
  function dim(x1, y1, x2, y2, text, waag) {
    return '<g class="sa-dim"><path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + (waag ? 'M' + x1 + ' ' + (y1 - 4) + 'v8M' + x2 + ' ' + (y2 - 4) + 'v8' : 'M' + (x1 - 4) + ' ' + y1 + 'h8M' + (x2 - 4) + ' ' + y2 + 'h8') + '"/><text x="' + ((x1 + x2) / 2 + (waag ? 0 : 6)) + '" y="' + ((y1 + y2) / 2 + (waag ? 15 : 0)) + '"' + (waag ? ' text-anchor="middle"' : '') + '>' + esc(text) + '</text></g>';
  }
  function R(kl, x, y, b, h) { return '<rect class="' + kl + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + b.toFixed(1) + '" height="' + h.toFixed(1) + '"/>'; }
  function fig(k, w, h, s, lab, ms, extra) { return '<figure class="sa-fig"><figcaption><b>' + T(k) + '</b></figcaption><svg class="sa-svg" role="img" aria-label="' + T(k) + ' ' + esc(lab) + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" data-massstab="' + ms + '"' + (extra || '') + '>' + s + '</svg></figure>'; }
  function holzKl(t) { return t.id === 'tiny' || t.id === 'modul' ? 'kh-holz' : 'kh-stahl'; }
  function skizzenHtml(c) {
    var P = 75.6, t = c.typ, m = c.mass, o = t.offen, kl = holzKl(t), s, q, zc = o[1] / 2;
    s = R(kl, ML, MT + (zc - m.b / 2) * P, m.l * P, m.b * P);
    if (t.id === 'ausklapp' && m.b > t.zu[1] + 0.01) s += R('kh-zu', ML, MT + (zc - t.zu[1] / 2) * P, t.zu[0] * P, t.zu[1] * P);
    if (t.id === 'tiny') s += '<path class="kh-zu" d="M' + ML + ' ' + (MT + zc * P) + 'h' + (1.5 * P) + '"/><text class="sa-t" x="' + ML + '" y="' + (MT + zc * P - 6) + '">' + T('khDeichsel') + '</text>';
    s += '<path class="sa-tuer" d="M' + (ML + 0.5 * P) + ' ' + (MT + (zc + m.b / 2) * P) + 'h' + (0.9 * P) + '"/>' + dim(ML, MT + (zc + m.b / 2) * P + 20, ML + m.l * P, MT + (zc + m.b / 2) * P + 20, nf(m.l, 2) + ' m', 1) + dim(ML + m.l * P + 22, MT + (zc - m.b / 2) * P, ML + m.l * P + 22, MT + (zc + m.b / 2) * P, nf(m.b, 2) + ' m', 0);
    var gy = MT + (o[2] - m.h) * P;
    q = R(kl, ML, gy, m.l * P, m.h * P);
    if (t.regler && m.h < o[2] - 0.01) q += R('kh-zu', ML, MT + (o[2] - t.zu[2]) * P, t.zu[0] * P, t.zu[2] * P);
    if (m.h > 2.2) q += R('kh-glas', ML + 0.5 * P, MT + (o[2] - 2) * P, 0.9 * P, 2 * P) + R('kh-glas', ML + Math.min(m.l - 1.6, m.l * 0.45) * P, MT + (o[2] - 1.9) * P, 1.1 * P, 0.9 * P);
    if (t.id === 'tiny') q += '<circle class="kh-stahl" cx="' + (ML + m.l * 0.62 * P) + '" cy="' + (MT + (o[2] - 0.35) * P) + '" r="' + (0.35 * P) + '"/>';
    if (t.id === 'modul') q += '<path class="kh-holz" d="M' + (ML - 6) + ' ' + (MT + 0.5 * P) + 'L' + (ML + m.l * P / 2) + ' ' + MT + 'L' + (ML + m.l * P + 6) + ' ' + (MT + 0.5 * P) + 'z"/>';
    q += dim(ML, MT + o[2] * P + 20, ML + m.l * P, MT + o[2] * P + 20, nf(m.l, 2) + ' m', 1) + dim(ML + m.l * P + 22, gy, ML + m.l * P + 22, MT + o[2] * P, nf(m.h, 2) + ' m', 0);
    var w1 = Math.round(ML + m.l * P + 84), w2 = Math.round(MT + o[1] * P + 52), w3 = Math.round(MT + o[2] * P + 44);
    return kopfZeile('i-mass', 'khT2', 't2') + '<div class="sa-skizzen-box">' + fig('khDrauf', w1, Math.max(w2, 120), s, nf(m.l, 2) + ' × ' + nf(m.b, 2) + ' m', '1:50', ' data-typ="' + t.id + '"') + fig('khSeite', w1, w3, q, nf(m.l, 2) + ' × ' + nf(m.h, 2) + ' m', '1:50', ' data-typ="' + t.id + '"') + '</div><p class="klein">' + T('khM50') + '</p>' + alleHtml(c);
  }
  function alleHtml(c) {
    var P = 37.8, y = 24, s = '';
    KD.typen.forEach(function (t) {
      var o = t.offen, kl = holzKl(t), hh = o[2] * P, sel = t.id === c.ps.typ;
      s += '<g class="' + (sel ? 'kh-wahlt' : '') + '" data-kh-reihe="' + t.id + '"><text class="sa-t" x="10" y="' + (y - 6) + '">' + esc(typName(t.id)) + ', ' + nf(o[0], 2) + ' × ' + nf(o[2], 2) + ' m</text>' + R(kl, 10, y, o[0] * P, hh);
      if (t.regler) s += R('kh-zu', 10, y + (o[2] - t.zu[2]) * P, t.zu[0] * P, t.zu[2] * P);
      if (t.id === 'tiny') s += '<circle class="kh-stahl" cx="' + (10 + o[0] * 0.62 * P) + '" cy="' + (y + hh - 0.35 * P) + '" r="' + (0.35 * P) + '"/>';
      s += '</g>'; y += hh + 34;
    });
    return '<figure class="sa-fig" data-kh-alle="1"><figcaption><b>' + T('khAlle') + '</b></figcaption><svg class="sa-svg" role="img" aria-label="' + T('khAlle') + '" width="' + Math.round(10 + 9.37 * P + 30) + '" height="' + Math.round(y) + '" viewBox="0 0 ' + Math.round(10 + 9.37 * P + 30) + ' ' + Math.round(y) + '" data-massstab="1:100">' + s + '</svg></figure><p class="klein">' + T('khM100') + '</p>';
  }

  /* ---------- Teil 3: Preis bis zur Aufstellung ---------- */
  function rechenweg(z) {
    var l = [];
    if (z.usd) l.push(tr('khUsd', { k: nf(KD.kurs.usd, 4) }));
    if (z.nettoZuBrutto) l.push(tr('khNetto'));
    if (z.teiler) l.push(tr('khTeiler', { n: z.teiler }) + (z.teilerBeleg ? '' : ' (' + tr('khTeilerAnn', { n: z.teiler }) + ')'));
    if (z.rechnung === 'zollwert') l.push(tr('khZollRechnung'));
    if (z.rechnung === 'eust') l.push(tr('khEustRechnung'));
    return l.map(function (x) { return esc(x); }).join('; ');
  }
  function balkenHtml(k) {
    var mit = k.zeilen.filter(function (z) { return !z.luecke && !z.entf && z.bis > 0; }), tot = 0, h = '';
    mit.forEach(function (z) { tot += (z.von + z.bis) / 2; });
    k.zeilen.forEach(function (z) {
      if (z.luecke) h += '<span class="kh-seg kh-luecke" style="flex:0 0 28px" data-kh-seg="' + z.id + '" title="' + esc(tr('khK_' + z.id) + ': ' + tr('hdKeineAngabe')) + '">?</span>';
      else if (!z.entf && z.bis > 0) h += '<span class="kh-seg kh-' + GRP[z.id] + '" style="flex:' + ((z.von + z.bis) / 2 / tot * 100).toFixed(2) + ' 1 0" data-kh-seg="' + z.id + '" title="' + esc(tr('khK_' + z.id) + ': ' + spanne(z.von, z.bis)) + '"></span>';
    });
    return '<div class="kh-balken" role="img" aria-label="' + T('khBal') + '" data-kh-balken="1">' + h + '</div><div class="kh-leg">' + Object.keys(BAL).map(function (g) { return '<span><i class="sw kh-' + g + '"></i>' + T(BAL[g]) + '</span>'; }).join('') + '<span><i class="sw kh-luecke"></i>' + T('khBal_luecke') + '</span></div><p class="klein">' + T('khBal') + '</p>';
  }
  function kostenZeile(z) {
    var p = z.luecke ? '<span class="ab-luecke" data-luecke="1">' + T('hdKeineAngabe') + '</span>' : z.entf ? '<span class="klein">' + T('khEntf') + '</span>' : '<span data-von="' + z.von + '" data-bis="' + z.bis + '">' + esc(spanne(z.von, z.bis)) + '</span>';
    var note = z.luecke || z.entf ? esc(z.grund) : esc(z.hinweis), rw = rechenweg(z);
    var ann = z.nettoZuBrutto || (z.teiler && !z.teilerBeleg) || z.rechnung;
    return '<tr data-kh-pos="' + z.id + '"' + (z.luecke ? ' data-luecke="1"' : '') + '>' + td('khThPos', esc(tr('khK_' + z.id)) + (z.brutto ? ' <span class="klein">(brutto)</span>' : ''), 0) + td('abSpPreis', p, 1) + td('khThHinweis', (rw ? '<span class="klein">' + (ann ? schild() + ' ' : '') + rw + '</span><br>' : '') + '<span class="klein">' + note + '</span>') + td('regQuelle', beleg(z)) + '</tr>';
  }
  function gruppe(k, ids) {
    var v = 0, b = 0, lu = 0, n = 0;
    ids.forEach(function (id) { var z = k.zeilen.filter(function (x) { return x.id === id; })[0]; n++; if (z.luecke) lu++; else { v += z.von; b += z.bis; } });
    return lu === n ? '<span class="ab-luecke" data-luecke="1">' + T('hdKeineAngabe') + '</span>' : esc(spanne(v, b)) + (lu ? ' <span class="klein">+ ' + T('hdKeineAngabe') + '</span>' : '');
  }
  function vergleichHtml(c) {
    var zl = c.alle.map(function (k, i) {
      var h = KK.HERKUENFTE[i];
      if (!k.ok) return '';
      if (!k.erlaubt) return '<tr data-kh-herk="' + h + '" data-kh-verboten="1"><th scope="row">' + T('khH_' + h) + '</th><td colspan="5"><b>' + T('khNichtErlaubt') + '</b>: ' + esc(k.verbot.gesetz) + ' <span class="klein">(' + esc(k.verbot.stand) + ')</span></td></tr>';
      var s = k.summe;
      return '<tr data-kh-herk="' + h + '"' + (h === c.ps.herkunft ? ' class="sa-treffer"' : '') + '><th scope="row">' + T('khH_' + h) + '</th>' + td('khK_kauf', gruppe(k, ['kauf'])) + td('khK_fracht', gruppe(k, ['fracht'])) + td('khThAbg', gruppe(k, ['zoll', 'eust'])) + td('khThAuf', gruppe(k, ['kran', 'fundament', 'strom', 'wasser', 'abwasser'])) +
        td('khSumme', (s.ohneKauf ? '<span class="ab-luecke" data-luecke="1">' + T('khOhneKauf') + '</span> ' : '') + '<b data-von="' + s.von + '" data-bis="' + s.bis + '" data-mindestens="' + s.mindestens + '">' + (s.mindestens ? T('khMindestens') : '') + esc(spanne(s.von, s.bis)) + '</b>') + '</tr>';
    }).join('');
    return h5('i-kh-welt', 'khImport') + '<div class="tabelle-kasten karten-kasten"><table class="karten sa-tab" data-kh-vergleich="1"><thead><tr><th scope="col">' + T('khThHerk') + '</th><th scope="col">' + T('khK_kauf') + '</th><th scope="col">' + T('khK_fracht') + '</th><th scope="col">' + T('khThAbg') + '</th><th scope="col">' + T('khThAuf') + '</th><th scope="col">' + T('khSumme') + '</th></tr></thead><tbody>' + zl + '</tbody></table></div>';
  }
  function t3Html(c) {
    var k = c.kosten, h = kopfZeile('i-rechner', 'khT3', 't3') + h5('i-kh-welt', 'khHerkunft') + knoepfe('herkunft', KK.HERKUENFTE, c.ps.herkunft, 'khHerkunft', 'khH_', function () { return 'i-kh-welt'; }, 'kh-wahl');
    if (!k.ok) return h + '<p class="ab-meldung fehler" role="alert">' + T('khFehler', { grund: k.grund }) + '</p>';
    if (!k.erlaubt) {
      var v = k.verbot;
      h += '<div class="kh-verbot" role="alert" data-kh-verboten="' + k.herk + '"><p><b>' + T('khNichtErlaubt') + '</b> · ' + esc(v.stufe) + '</p><p>' + T('khRecht', { g: v.gesetz, w: v.ware, s: v.stand, f: v.fund, a: v.abruf }) + '</p><p>' + T('khKeinPreis') + '</p><p>' + beleg(v) + '</p></div>';
    } else {
      h += balkenHtml(k) + tab(['khThPos', 'abSpPreis', 'khThHinweis', 'regQuelle'], k.zeilen.map(kostenZeile).join('') +
        '<tr class="summe" data-kh-summe="1" data-von="' + k.summe.von + '" data-bis="' + k.summe.bis + '" data-mindestens="' + k.summe.mindestens + '" data-luecken="' + k.summe.luecken + '">' + td('khThPos', '<b>' + T('khSumme') + '</b>') + td('abSpPreis', '<b>' + (k.summe.ohneKauf ? T('khOhneKauf') : '') + (k.summe.mindestens ? T('khMindestens') : '') + esc(spanne(k.summe.von, k.summe.bis)) + '</b>', 1) + td('khThHinweis', k.summe.mindestens ? '<span class="klein">' + T('khSummeOhne', { n: k.summe.luecken }) + '</span>' : '') + td('regQuelle', '') + '</tr>');
      h += '<p class="klein">' + esc(KD.bemessung.hinweis) + ' ' + beleg(KD.bemessung) + '</p>';
    }
    return h + vergleichHtml(c);
  }

  /* ---------- Teil 4: Eignung ---------- */
  function t4Html(c) {
    var t = c.typ, e = KD.eignung, h = kopfZeile('i-paragraf', 'khT4', 't4') + h5('i-paragraf', 'khGModG') + '<ul class="gs-ul sa-ul">' + e.gmodg.map(function (g) { return '<li data-kh-gmodg="' + g.id + '">' + esc(g.text) + ' ' + beleg(g) + '</li>'; }).join('') + '</ul>';
    var m2 = c.wohn.m2 != null ? c.wohn.m2 : c.wohn.bis, kl = c.klein.klein;
    h += '<p class="' + (kl ? 'sa-ja' : 'ab-meldung') + '" role="status" data-kh-klein="' + (kl ? 'ja' : 'nein') + '">' + T(c.wohn.m2 != null ? (kl ? 'khKlein_ja' : 'khKlein_nein') : 'khKlein_grenze', { m2: nf(m2, 2) }) + '</p>';
    if (t.gross) h += '<p class="ab-meldung" role="note" data-kh-klein="gross">' + T('khKlein_nein', { m2: nf(t.gross.m2, 1) }) + ' (' + esc(t.gross.ids) + ')</p>';
    var au = e.aufbau[t.id];
    h += h5('i-mass', 'khUTitel') + tab(['khThPos', 'khThSoll', 'khThIst'], e.u.filter(function (u) { return u.id === 'wand' || u.id === 'dach' || !au; }).map(function (u) {
      var a = au && (u.id === 'wand' || u.id === 'dach') ? { txt: au[u.id], u: au[u.id === 'wand' ? 'uWand' : 'uDach'] } : null;
      return '<tr data-kh-u="' + u.id + '"' + (a ? ' data-kh-ueber="' + (a.u[0] > u.soll ? 1 : 0) + '"' : '') + '>' + td('khThPos', esc(u.name)) + td('khThSoll', nf(u.soll, 2) + ' ' + beleg(u), 1) + td('khThIst', a ? T('khUWert', { a: a.txt, u: nf(a.u[0], 2) + ' bis ' + nf(a.u[1], 2) }) + ' <b>' + T('khUDrueber') + '</b>' : '<span class="ab-luecke" data-luecke="1">' + T('khULuecke') + '</span>') + '</tr>';
    }).join(''));
    if (au) h += '<p class="klein">' + schild() + ' ' + esc(au.text) + ' ' + beleg({ ids: au.ids, q: ['BER'], status: 'eigene Einordnung', abruf: KD.stand }) + '</p>';
    var zk = e.zonenBeleg, ls = e.last[t.id], sk = e.schnee.filter(function (z) { return z.z === c.ps.schnee; })[0], wi = e.wind.filter(function (z) { return z.z === c.ps.wind; })[0];
    h += h5('i-gs-kleinwind', 'khZonen') + '<p class="klein" id="kh-zonenuns" data-kh-zonen="unsicher">' + schild() + ' ' + T('khZonenUns') + ' ' + beleg(zk) + '</p>';
    var zb = function (f, l) { return '<p class="es-label">' + T(f === 'schnee' ? 'khSchnee' : 'khWind') + '</p><div class="ab-stufen sa-knoepfe kh-zone-wahl" role="group" aria-label="' + T(f === 'schnee' ? 'khSchnee' : 'khWind') + '">' + l.map(function (z) { return '<button type="button" class="es-var sa-opt" data-kh="' + f + '" data-wert="' + z.z + '" data-fk="' + f + '-' + z.z + '" aria-pressed="' + (z.z === c.ps[f]) + '"><span class="es-var-kopf"><b>' + z.z + '</b></span></button>'; }).join('') + '</div>'; };
    h += zb('schnee', e.schnee) + '<p data-kh-sk="' + sk.sk + '">' + T('khZoneSk', { z: sk.z, v: nf(sk.sk, 2) }) + '</p>' + zb('wind', e.wind) + '<p data-kh-wind="' + wi.q + '">' + T('khZoneWind', { z: wi.z, v: nf(wi.v, 1), q: nf(wi.q, 2) }) + '</p>';
    h += '<p class="klein" data-kh-last="1">' + (ls ? esc(ls.text + '; ' + ls.wind) + ' ' + beleg({ ids: ls.ids, q: ['HIG'], status: 'prüfen vor Nutzung', abruf: KD.stand }) : T('khLastLuecke')) + '</p><p class="ab-meldung" role="note" data-kh-vergleich-luecke="1">' + T('khKeinVergleich') + '</p>';
    h += h5('i-paragraf', 'khFaelle') + '<ul class="gs-ul sa-ul">' + KD.faelle.map(function (f) { return '<li data-kh-fall="' + f.id + '"><b>' + esc(f.titel) + '</b>: ' + esc(f.text) + ' ' + beleg({ ids: f.id, q: [f.q], status: f.status, abruf: f.abruf }) + '</li>'; }).join('') + '</ul><p class="klein">' + esc(KD.faelle_hinweis) + '</p>';
    return h;
  }

  /* ---------- Teil 5: Regeln ---------- */
  function ampelBlock(titel, v, text) {
    var s = v && v.ok ? v.summe : null;
    if (!s) return '<p class="ab-meldung fehler" role="alert">' + T('anKeineDaten', { grund: v ? v.grund : '' }) + '</p>';
    return '<h5 class="es-h5 sa-h5">' + T(titel) + '</h5><div class="an-satz an-f ' + s.ampel + '" role="status" data-an-ampel="' + s.ampel + '" data-kh-ampel="' + titel + '">' + WZ.ampelChip(s.ampel, false) + '<span class="an-satz-text">' + esc(WZ.satzFuer(s)) + '</span></div>' + (text ? '<p class="klein">' + T(text) + '</p>' : '');
  }
  function t5Html(c) {
    var a = c.ampel, h = kopfZeile('i-paragraf', 'khT5', 't5') + '<p class="klein" data-kh-regeln="1">' + schild() + ' ' + T('khRegelnHinweis') + '</p><h5 class="es-h5 sa-h5">' + sym('i-paragraf') + T('khAmpelTitel', { land: c.landName }) + '</h5><p class="klein" data-kh-land="' + esc(c.land) + '">' + T('khAmpelFl', { fl: nf(a.flaeche, 1), h: nf(a.hoehe, 2) }) + '</p>' + ampelBlock('khAmpelLager', a.lager, null) + ampelBlock('khAmpelWohnen', a.wohnen, 'khAmpelWohnenText');
    h += KD.regeln.map(function (r) {
      return '<article class="kh-regel" data-kh-regel="' + r.id + '"><b>' + T('khRg_' + r.id) + '</b><div class="kh-regel-spalten"><p><b>' + T('khMobil') + ':</b> ' + esc(r.mobil) + '</p><p><b>' + T('khFest') + ':</b> ' + esc(r.fest) + '</p></div><p class="klein">' + esc(r.ids) + ' ' + beleg({ ids: '', q: r.q.split(',').map(function (s) { return s.trim(); }), status: r.status, abruf: KD.stand }) + '</p></article>';
    }).join('');
    return h + '<details class="an-bed" data-kh-wid="1"><summary>' + T('khWid') + ' (' + KD.widersprueche.length + ')</summary><ul class="gs-ul sa-ul">' + KD.widersprueche.map(function (w) { return '<li data-kh-w="' + w.id + '">' + esc(w.text) + '<br><b>' + esc(w.entscheidung) + '</b> <span class="klein">(' + esc(w.ids) + ')</span></li>'; }).join('') + '</ul></details>';
  }

  /* ---------- 3D (three.js) ---------- */
  var gl = { ok: null, yaw: 0.65, pitch: 0.4, dist: 8, zoom: 1 };
  function css(n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; }
  function ersatz(grund) {
    var cv = byId('kh-3d'), e = byId('kh-3d-ersatz'), m = byId('kh-modell');
    gl.ok = false; if (cv) cv.hidden = true; if (e) { e.hidden = false; e.textContent = tr('khModellKein') + ' (' + grund + ')'; } if (m) m.setAttribute('data-render', 'ersatz');
  }
  function init3d() {
    if (gl.ok !== null) return gl.ok;
    var cv = byId('kh-3d'), z = null;
    if (!cv || typeof THREE === 'undefined') return ersatz('three.js');
    try { gl.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return ersatz('WebGL'); }
    gl.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    gl.s = new THREE.Scene(); gl.ka = new THREE.PerspectiveCamera(35, 1, 0.05, 300); gl.ziel = new THREE.Vector3();
    var sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 6, 4); gl.s.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.9), sun);
    gl.w = new THREE.Group(); gl.s.add(gl.w);
    cv.addEventListener('pointerdown', function (ev) { z = { x: ev.clientX, y: ev.clientY, a: gl.yaw, p: gl.pitch }; try { cv.setPointerCapture(ev.pointerId); } catch (e) { z = z; } });
    cv.addEventListener('pointermove', function (ev) { if (z) { gl.yaw = z.a - (ev.clientX - z.x) * 0.008; gl.pitch = Math.max(0.02, Math.min(1.45, z.p + (ev.clientY - z.y) * 0.006)); zeichnen(); } });
    cv.addEventListener('pointerup', function () { z = null; }); cv.addEventListener('pointercancel', function () { z = null; });
    cv.addEventListener('keydown', function (ev) {
      var k = ev.key, ok = true;
      if (k === 'ArrowLeft') gl.yaw += 0.12; else if (k === 'ArrowRight') gl.yaw -= 0.12; else if (k === 'ArrowUp') gl.pitch = Math.min(1.45, gl.pitch + 0.06); else if (k === 'ArrowDown') gl.pitch = Math.max(0.02, gl.pitch - 0.06);
      else if (k === '+' || k === '=') gl.zoom = Math.min(2.5, gl.zoom * 1.15); else if (k === '-' || k === '_') gl.zoom = Math.max(0.5, gl.zoom / 1.15); else ok = false;
      if (ok) { ev.preventDefault(); zeichnen(); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(cv);
    return (gl.ok = true);
  }
  function groesse() { var cv = byId('kh-3d'); if (!gl.ok || !cv || !cv.clientWidth || !cv.clientHeight) return; gl.r.setSize(cv.clientWidth, cv.clientHeight, false); gl.ka.aspect = cv.clientWidth / cv.clientHeight; gl.ka.updateProjectionMatrix(); zeichnen(); }
  function zeichnen() {
    if (!gl.ok || !gl.w) return;
    var d = gl.dist / gl.zoom, p = gl.pitch;
    gl.ka.position.set(gl.ziel.x + d * Math.cos(p) * Math.sin(gl.yaw), gl.ziel.y + d * Math.sin(p), gl.ziel.z + d * Math.cos(p) * Math.cos(gl.yaw));
    gl.ka.lookAt(gl.ziel); gl.r.render(gl.s, gl.ka);
    var mo = byId('kh-modell'); if (mo) mo.setAttribute('data-yaw', gl.yaw.toFixed(2));
  }
  function bau3d(c) {
    var m = byId('kh-modell'), t = c.typ, ms = c.mass, L = ms.l, B = ms.b, H = ms.h, o = t.offen, zc = o[1] / 2, z0 = zc - B / 2, z1 = zc + B / 2;
    if (!m) return;
    [['typ', t.id], ['l', L], ['b', B], ['h', H], ['regler', c.ps.regler], ['flaeche', c.flaeche]].forEach(function (a) { m.setAttribute('data-' + a[0], a[1]); });
    if (!init3d()) return;
    byId('kh-3d').hidden = false;
    gl.w.children.slice().forEach(function (k) { gl.w.remove(k); k.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); });
    var holz = t.id === 'tiny' || t.id === 'modul', cc = function (v, fb) { return new THREE.Color(css(v, fb)); }, ln = cc('--text', '#241d2e');
    var mt = function (col, op) { return new THREE.MeshLambertMaterial({ color: col, transparent: op < 1, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 1 }); };
    var haut = mt(holz ? cc('--holz', '#946a3c') : cc('--leise', '#5c5666'), holz ? 0.9 : 0.75), glas = mt(cc('--c2', '#1f9bd1'), 0.5), dunkel = mt(cc('--text', '#241d2e'), 1);
    var bx = function (x0, y0, zz0, x1, y1, zz1, mat, kante) {
      var me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, zz1 - zz0), mat); me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (zz0 + zz1) / 2); gl.w.add(me);
      if (kante) { var l = new THREE.LineSegments(new THREE.EdgesGeometry(me.geometry), new THREE.LineBasicMaterial({ color: ln, transparent: true, opacity: 0.45 })); l.position.copy(me.position); gl.w.add(l); }
    };
    var gr = new THREE.Mesh(new THREE.PlaneGeometry(o[0] + 4, o[1] + 4), mt(cc('--linie', '#e8dfd1'), 1)); gr.rotation.x = -Math.PI / 2; gr.position.set(o[0] / 2, -0.01, zc); gl.w.add(gr);
    var y0 = t.id === 'tiny' ? 0.5 : 0, x0 = t.id === 'tiny' ? 1.5 : 0, hw = t.id === 'modul' ? 2.5 : H;
    if (t.id === 'ausklapp') {
      var kb = Math.min(B, t.zu[1]) / 2; bx(0, 0, zc - kb, L, H, zc + kb, haut, 1);
      if (B > t.zu[1] + 0.01) { bx(0, 0, z0, L, H * 0.96, zc - kb, mt(cc('--leise', '#5c5666'), 0.45), 1); bx(0, 0, zc + kb, L, H * 0.96, z1, mt(cc('--leise', '#5c5666'), 0.45), 1); }
    } else {
      if (t.id === 'tiny') { bx(0, 0.3, z0, L, 0.5, z1, dunkel, 1); bx(0, 0.35, zc - 0.06, 1.5, 0.45, zc + 0.06, dunkel, 0); [0.55, 0.75].forEach(function (f) { [z0 - 0.1, z1 + 0.1].forEach(function (zz) { var w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 24), dunkel); w.rotation.x = Math.PI / 2; w.position.set(L * f + 0.4, 0.35, zz); gl.w.add(w); }); }); }
      bx(x0, y0, z0, L, hw, z1, haut, 1);
    }
    if (t.id === 'modul') {
      var rise = H - 2.5, half = B / 2, s = Math.sqrt(half * half + rise * rise), al = Math.atan2(rise, half);
      [-1, 1].forEach(function (sg) { var sl = new THREE.Mesh(new THREE.BoxGeometry(L + 0.3, 0.08, s), mt(cc('--leise', '#5c5666'), 0.9)); sl.rotation.x = sg * al; sl.position.set(L / 2, 2.5 + rise / 2, zc + sg * half / 2); gl.w.add(sl); });
    }
    if (t.id === 'tiny') bx(x0 - 0.1, H - 0.08, z0 - 0.1, L + 0.1, H, z1 + 0.1, mt(cc('--leise', '#5c5666'), 0.9), 1);
    if (H > 2.2) {
      var zf = z1 + (t.id === 'ausklapp' ? -(B / 2 - Math.min(B, t.zu[1]) / 2) : 0);
      bx(x0 + 0.5, y0, zf - 0.01, x0 + 1.4, y0 + Math.min(2, hw - y0 - 0.1), zf + 0.04, dunkel, 0);
      [[0.45, 0.4], [0.65, 0.3]].forEach(function (f, i) { if (L > 5 || i === 0) bx(x0 + (L - x0) * f[0], y0 + 0.9, zf - 0.01, x0 + (L - x0) * f[0] + 1.1, y0 + 1.8, zf + 0.04, glas, 1); });
    }
    gl.ziel.set(o[0] / 2, o[2] / 2, zc); gl.dist = Math.max(o[0], o[1], o[2]) * 3.1; gl.zoom = 1;
    m.setAttribute('data-render', 'ok'); m.setAttribute('data-teile', gl.w.children.length);
    groesse(); zeichnen();
  }

  /* ---------- Zusammenspiel ---------- */
  function summeKurz(k) {
    if (!k.ok) return '–';
    if (!k.erlaubt) return tr('khNichtErlaubtKurz');
    return (k.summe.ohneKauf ? tr('khOhneKauf') : '') + tr('khKopfSumme', { m: k.summe.mindestens ? tr('khMindestens') : '', von: eur(k.summe.von), bis: eur(k.summe.bis) });
  }
  function kopf(c) {
    var e = byId('g-kleinhaus-kopfzeile'); if (!e) return;
    e.textContent = tr('khKopf', { typ: typName(c.ps.typ), herk: tr('khH_' + c.ps.herkunft), sum: summeKurz(c.kosten) });
  }
  function teil(id, fn, c) { var w = byId(id); if (w) { var neu = fn(c); WZ.mitFokus(w, function () { w.innerHTML = neu; }); } }
  function jetzt(nurErgebnis) {
    clearTimeout(timer);
    var c;
    try { c = ctx = KK.rechne(G.plan()); } catch (e) { melde(tr('khFehler', { grund: e && e.message ? e.message : e })); return; }
    if (!c.ok) { melde(tr('khFehler', { grund: c.grund })); return; }
    melde(''); kopf(c);
    var d = byId('g-kleinhaus-details');
    if (!d || !d.open) return;
    try {
      var mm = c.ps.meldungen.map(function (x) { return '<p class="ab-meldung" role="status" data-kh-meldung="' + x.feld + '">' + T('khMeld', { w: x.wert, feld: x.feld }) + '</p>'; }).join('');
      if (!nurErgebnis) teil('kh-t1', function (cc) { return mm + t1Html(cc); }, c);
      teil('kh-t1e', t1eHtml, c); teil('kh-skizzen', skizzenHtml, c); teil('kh-t3', t3Html, c); teil('kh-t4', t4Html, c); teil('kh-t5', t5Html, c);
      byId('kh-legende').textContent = tr('khLegende');
      bau3d(c);
    } catch (e2) { melde(tr('khFehler', { grund: e2 && e2.message ? e2.message : e2 })); }
    nurErg = false;
  }
  function aktualisieren() { clearTimeout(timer); var n = nurErg; timer = setTimeout(function () { jetzt(n); }, 150); }
  function geaendert(nur) { nurErg = !!nur; G.geaendert(); }
  function bei(ev) {
    var t = ev.target;
    if (ev.type !== 'input' || t.type !== 'range' || t.getAttribute('data-kh') !== 'regler') return;
    erstesMal();
    var x = Math.round(+t.value * 100) / 100, lab = byId('kh-r-wert');
    if (lab) lab.textContent = tr('khReglerWert', { p: n0(x * 100) });
    if (KK.wahlSetzen(G.plan(), 'regler', x)) geaendert(true);
  }
  function erstesMal() { if (hinweis) { hinweis = false; try { localStorage.setItem('immo-kh-hinweis', '1'); } catch (e1) { hinweis = false; } } }
  function klick(ev) {
    var t = ev.target.closest('[data-kh]'), plan = G.plan();
    if (!t || t.tagName === 'INPUT') return;
    erstesMal();
    var a = t.getAttribute('data-kh'), w = t.getAttribute('data-wert');
    if (a === 'hilfe') { var p = byId(w), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf); hilfe[w] = auf; if (p) p.hidden = !auf; }
    else if (KK.wahlSetzen(plan, a, w)) geaendert(false);
  }
  function planen(id) {
    var r = KK.verknuepfen(G.plan(), id);
    if (!r.ok) return false;
    var d = byId('g-kleinhaus-details'); if (d) d.open = true;
    G.geaendert(); jetzt(false);
    byId('g-kleinhaus-karte').scrollIntoView({ block: 'start', behavior: 'auto' });
    var f = document.querySelector('#kh-t1 [data-fk="typ-' + (ctx && ctx.ps.typ) + '"]'); if (f) f.focus({ preventScroll: true });
    return true;
  }
  var wurzel = byId('g-kleinhaus-inhalt'), det = byId('g-kleinhaus-details');
  if (wurzel) { wurzel.addEventListener('click', klick); wurzel.addEventListener('input', bei); }
  if (det) det.addEventListener('toggle', function () { if (det.open) jetzt(false); });
  window.addEventListener('sprachegewechselt', function () { jetzt(false); });
  window.addEventListener('themagewechselt', function () { if (ctx && ctx.ok && gl.ok) bau3d(ctx); });
  window.GRUNDRISS_KLEINHAUS = { aktualisieren: aktualisieren, jetzt: jetzt, planen: planen, ergebnis: function () { return ctx; } };
  setTimeout(function () { jetzt(false); }, 0);
})();
