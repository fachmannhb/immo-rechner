/* Oberfläche „Sauna“ (S1, 31.10.2026): Karte #g-sauna-karte nach dem Grundstück. Rechnung: sauna_kern.js (Größe, Ofenwahl, Ampel kommen vom Baustein der Karte Grundstück), Daten: daten/sauna.js, Texte: daten/texte_sauna.js.
   Plan: plan.sauna { ref, art, holz_wand, holz_bank, stunden } (optional). 3D-Modell: three.js wie grundriss3d.js, ein Renderer, gezeichnet nur bei Änderung (keine Schleife, keine Animation).
   Bei der Auslieferung werden Kommentare und Einrückung entfernt (bau.py, SCHLANK). */
(function () {
  'use strict';
  var SK = window.SAUNA_KERN, GK = window.GRUNDSTUECK_KERN, G = window.GRUNDRISS, D = window.DATEN || {}, WZ = window.GRUNDRISS_ANBAU && window.GRUNDRISS_ANBAU.werkzeug, SD = D.sauna;
  function byId(i) { return document.getElementById(i); }
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function melde(t) { var e = byId('g-sauna-fehler'); if (e) { e.textContent = t || ''; e.hidden = !t; } }
  if (!SK || !GK || !G || !WZ || !SD || !D.verfahrensfrei || !D.saunaholz) { melde(tr('saFehler', { grund: (!SK ? 'sauna_kern.js' : !WZ ? 'Karte Anbau' : !G ? 'Zeichnung' : 'Daten') + ' fehlt.' })); return; }
  var esc = WZ.esc, sym = WZ.symbol, nz = WZ.nz, n0 = WZ.n0, schild = WZ.annahmeSchild;
  function T(k, v) { return esc(tr(k, v)); }
  function nf(x, d) { return new Intl.NumberFormat(WZ.lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(x); }
  function m2(x) { return new Intl.NumberFormat(WZ.lang(), { maximumFractionDigits: 2 }).format(x); }
  var eur = function (x) { return nf(x, 2); }, ctx = null, timer = null, nurErg = false, hilfe = {}, hinweis = true;
  try { hinweis = localStorage.getItem('immo-sa-hinweis') !== '1'; } catch (e0) { hinweis = true; }   /* kurzer Puls an den Art-Knöpfen nur beim ersten Öffnen (prefers-reduced-motion: CSS schaltet Animationen ab) */
  var ICON = { innen: 'i-haus', garten: 'i-an-gartenhaus', fass: 'i-sa-fass', elektro: 'i-blitz', holz: 'i-flamme' };

  function beleg(r, id) {
    var q = SD.quellen[r.quelle] || {};
    if (r.status === 'Lücke') return '';
    return WZ.quelleHtml({ id: id || r.i || r.id, quelle: r.h || q.titel || '', url: /^https?:/.test(q.url || '') ? q.url : '', abruf: r.abruf || SD.stand, status: r.status });
  }
  function kopfZeile(s, k, t) {
    var id = 'sa-h-' + t;
    return '<h4 class="es-h5 sa-h">' + sym(s) + '<span>' + T(k) + '</span> <button type="button" class="hilfe-knopf" data-sa="hilfe" data-wert="' + id + '" aria-expanded="' + !!hilfe[id] + '" aria-controls="' + id + '" aria-label="' + T('hilfeKnopf') + '">?</button></h4><p class="klein" id="' + id + '"' + (hilfe[id] ? '' : ' hidden') + '>' + T('saHilfe_' + t) + '</p>';
  }
  function h5(s, k) { return '<h5 class="es-h5 sa-h5">' + (s ? sym(s) : '') + T(k) + '</h5>'; }
  function regler(id, k, wert, min, max, step, key) {
    return '<div class="es-feld"><label class="es-label" for="' + id + '">' + T(k) + ' <b id="' + id + '-wert" class="es-zahl">' + m2(wert) + ' ' + (key === 'st' ? 'h' : 'm') + '</b></label><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + Math.min(max, Math.max(min, wert)) + '" data-sa="' + key + '" data-fk="' + key + '"></div>';
  }
  function knoepfe(feld, werte, aktiv, label) {
    return '<div class="ab-stufen sa-knoepfe" role="group" aria-label="' + T(label) + '">' + werte.map(function (w) {
      return '<button type="button" class="es-var sa-opt' + (hinweis && feld === 'art' ? ' gs-puls' : '') + '" data-sa="' + feld + '" data-wert="' + w + '" data-fk="' + feld + '-' + w + '" aria-pressed="' + (w === aktiv) + '"><span class="es-var-kopf">' + sym(ICON[w]) + '<b>' + T(feld === 'art' ? 'saArt_' + w : 'saOfen_' + w) + '</b></span></button>';
    }).join('') + '</div>';
  }
  function td(k, inh, z) { return '<td' + (z ? ' class="z"' : '') + ' data-titel="' + T(k) + '">' + inh + '</td>'; }
  function tab(sp, zeilen, attr) { return '<div class="tabelle-kasten karten-kasten"><table class="karten sa-tab"' + (attr || '') + '><thead><tr>' + sp.map(function (k) { return '<th scope="col">' + T(k) + '</th>'; }).join('') + '</tr></thead><tbody>' + zeilen + '</tbody></table></div>'; }
  function spanne(v, b) { return v === b ? eur(v) + ' €' : eur(v) + ' bis ' + eur(b) + ' €'; }

  /* ---------- Teil 1: Art und Größe ---------- */
  function t1Html(c) {
    var f = c.art === 'fass';
    return kopfZeile('i-mass', 'saT1', 't1') + knoepfe('art', ['innen', 'garten', 'fass'], c.art, 'saT1') + (f ? '' : regler('sa-b', 'gsBreite', c.b, 1, SK.B_MAX, 0.1, 'b')) +
      regler('sa-t', f ? 'saL' : 'gsTiefe', c.t, 1, SK.T_MAX, 0.1, 't') + regler('sa-h', f ? 'saD' : 'anHoehe', c.h, SK.H_MIN, SK.H_MAX, 0.05, 'h') + h5('i-flamme', 'saOfenTitel') + knoepfe('ofen', ['elektro', 'holz'], c.ofen, 'saOfenTitel') +
      (c.ofenEigen ? '' : '<p class="klein" data-sa-annahme="ofen">' + schild() + ' ' + T('gsOfenAnnahme') + '</p>');
  }
  function t1eHtml(c) {
    var k = c.klasse, q = k.klasse, ex = SK.ARTEN[c.art], g = c.geo.ofen;
    var h = '<p class="sa-gross" data-sa-volumen="' + c.volumen + '"><b>' + T('saVolumen', { v: nz(c.volumen) }) + '</b></p><p class="klein">' + schild() + ' ' + T('saMassGilt') + '</p>';
    if (c.ofen === 'holz') h += '<p data-sa-ofen="holz">' + T('saOfenHolz') + '</p>';
    else if (k.status === 'zugross') h += '<p class="ab-meldung" role="status" data-sa-ofen="zugross">' + T('saOfenGross') + '</p>';
    else {
      h += '<p data-sa-ofen="' + k.kw + '"><b>' + T('saOfenKw', { kw: nz(k.kw) }) + '</b> ' + T('saOfenBis') + ' ' + beleg(q, q.i) + '</p>';
      if (k.grenz) h += '<p class="ab-meldung" role="note" data-sa-ofen="grenz">' + T('saOfenGrenz') + '</p>';
      h += '<p class="klein">' + esc(SD.ofen.glas) + '</p>';
    }
    if (g && g.zuNiedrig) h += '<p class="ab-meldung fehler" role="alert" data-sa-warn="decke">' + T('saZuNiedrig', { f: m2(g.freiOben), d: m2(g.decke) }) + '</p>';
    if (c.art === 'fass') h += '<p class="klein" data-sa-hinweis="fass">' + T('saFass') + '</p>';
    if (c.b === ex.b && c.t === ex.t && c.h === ex.h) h += '<p class="klein" data-sa-annahme="mass">' + schild() + ' ' + T('saMassAnnahme') + '</p>';
    return h;
  }
  function legendeHtml(c) {
    var g = c.geo.ofen;
    return '<b data-sa-legende="1">' + T('saLegende', { w: SK.holzInfo(c.ps.wand).name, b: SK.holzInfo(c.ps.bank).name }) + '</b><br><span class="klein">' + T('saModellOfen', g ? { s: nz(g.seite * 100), d: nz(g.decke * 100), m: g.modell } : { s: '–', d: '–', m: '–' }) + '</span>';
  }

  /* ---------- Skizzen 1:50 (1 m = 20 mm = 75,6 px bei 96 dpi) ---------- */
  var P = 75.6, ML = 44, MT = 30;
  function dim(x1, y1, x2, y2, text, waag) {
    return '<g class="sa-dim"><path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + (waag ? 'M' + x1 + ' ' + (y1 - 4) + 'v8M' + x2 + ' ' + (y2 - 4) + 'v8' : 'M' + (x1 - 4) + ' ' + y1 + 'h8M' + (x2 - 4) + ' ' + y2 + 'h8') + '"/><text x="' + ((x1 + x2) / 2 + (waag ? 0 : 6)) + '" y="' + ((y1 + y2) / 2 + (waag ? 15 : 0)) + '"' + (waag ? ' text-anchor="middle"' : '') + '>' + esc(text) + '</text></g>';
  }
  function rc(kl, x, y, b, t) { return '<rect class="' + kl + '" x="' + (ML + x * P).toFixed(1) + '" y="' + (MT + y * P).toFixed(1) + '" width="' + (b * P).toFixed(1) + '" height="' + (t * P).toFixed(1) + '"/>'; }
  function fig(k, w, h, s, lab) { return '<figure class="sa-fig"><figcaption><b>' + T(k) + '</b></figcaption><svg class="sa-svg" role="img" aria-label="' + T(k) + ' ' + esc(lab) + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" data-massstab="1:50">' + s + '</svg></figure>'; }
  function skizzenHtml(c) {
    var g = c.geo, o = g.ofen, fass = g.art === 'fass', z = null, s, q, x0 = fass ? 0 : g.w, bb = fass ? g.B : g.Bi;
    if (o) { z = { x: Math.max(g.w, o.x - o.seite), z: Math.max(g.w, o.z - o.seite) }; z.b = Math.min(g.B - g.w, o.x + o.b + o.seite) - z.x; z.t = Math.min(g.T - g.w, o.z + o.t + o.seite) - z.z; }
    s = rc('sa-aussen', 0, 0, g.B, g.T) + (fass ? rc('sa-innen', 0, g.w, g.B, g.T - 2 * g.w) : rc('sa-innen', g.w, g.w, g.Bi, g.Ti)) + rc('sa-bank', x0, g.w, bb, g.bank.oben.tiefe) + rc('sa-bank', x0, g.w + g.bank.oben.tiefe, bb, g.bank.unten.tiefe);
    if (z) s += rc('sa-zone', z.x, z.z, z.b, z.t) + rc('sa-ofen', o.x, o.z, o.b, o.t);
    s += '<path class="sa-tuer" d="M' + (ML + g.tuer.x * P).toFixed(1) + ' ' + (MT + g.T * P) + 'h' + (g.tuer.b * P).toFixed(1) + '"/><text class="sa-t" x="' + (ML + g.tuer.x * P).toFixed(1) + '" y="' + (MT + g.T * P - 6) + '">' + T('wortTuer') + '</text><text class="sa-t" x="' + ML + '" y="' + (MT - 10) + '">' + T('saWandCm', { w: nz(g.w * 100) }) + '</text>' +
      dim(ML, MT + g.T * P + 22, ML + g.B * P, MT + g.T * P + 22, nf(g.B, 2) + ' m', 1) + dim(ML + g.B * P + 22, MT, ML + g.B * P + 22, MT + g.T * P, nf(g.T, 2) + ' m', 0);
    var fy = function (y) { return (MT + (g.H - y) * P).toFixed(1); }, sx = function (v) { return (ML + v * P).toFixed(1); }, r2 = function (kl, x, y, b, t) { return '<rect class="' + kl + '" x="' + sx(x) + '" y="' + fy(y) + '" width="' + (b * P).toFixed(1) + '" height="' + (t * P).toFixed(1) + '"/>'; };
    q = r2('sa-aussen', 0, g.H, g.T, g.H) + r2('sa-innen', g.w, g.Hi, g.Ti, g.Hi) + r2('sa-bank', g.w, 0.9, g.bank.oben.tiefe, 0.9) + r2('sa-bank', g.w + g.bank.oben.tiefe, 0.45, g.bank.unten.tiefe, 0.45);
    if (o) { var zt = Math.min(g.Hi, o.h + o.decke); q += r2('sa-zone', z.z, zt, z.t, zt) + r2('sa-ofen', o.z, o.h, o.t, o.h) + '<text class="sa-t" x="' + sx(o.z + o.t / 2) + '" y="' + (+fy(zt) + 14) + '" text-anchor="middle">' + nz(o.decke * 100) + ' cm</text>'; }
    q += dim(ML, MT + g.H * P + 20, ML + g.T * P, MT + g.H * P + 20, nf(g.T, 2) + ' m', 1) + dim(ML + g.T * P + 22, MT, ML + g.T * P + 22, MT + g.H * P, nf(g.H, 2) + ' m', 0);
    return '<div class="sa-skizzen-box">' + fig('saDrauf', Math.round(ML + g.B * P + 84), Math.round(MT + g.T * P + 52), s, nf(g.B, 2) + ' × ' + nf(g.T, 2) + ' m') + fig('saSeite', Math.round(ML + g.T * P + 84), Math.round(MT + g.H * P + 44), q, nf(g.T, 2) + ' × ' + nf(g.H, 2) + ' m') + '</div><p class="klein">' + T('saMassstab') + '</p>';
  }

  /* ---------- Teil 2: Holz ---------- */
  function preisBlock(x, ein) {
    var p = SK.holzPreis(x.id, ein), s = p.luecke ? '<span class="ab-luecke" data-luecke="1">' + T('saKeinPreis') + '</span>' :
      '<b data-von="' + p.von + '" data-bis="' + p.bis + '">' + T(ein === 'lfm' ? 'saPreisLfm' : 'saPreisM2', { p: p.von === p.bis ? eur(p.von) : eur(p.von) + ' – ' + eur(p.bis) }) + '</b>' + (p.einQuelle ? ' <span class="klein">(' + T('saEineQuelle') + ')</span>' : '');
    var l = p.zeilen.map(function (r) { return '<li>' + eur(r.v) + ' €' + (r.ab ? ' (' + T('saAb') + ')' : '') + (r.hinweis ? ' – ' + esc(r.hinweis) : '') + (r.ausser ? ' <b class="klein" data-sa-ausser="1">(' + T('saAusser') + ')</b>' : '') + ' ' + beleg(r) + '</li>'; }).join('');
    return '<div class="sa-preis" data-sa-preis="' + ein + '"><p>' + s + '</p>' + (l ? '<ul class="gs-ul sa-ul">' + l + '</ul>' : '') + '</div>';
  }
  /* S2: Rangliste je Zweck. Gewicht und Reiter sind Bedienzustand (nicht im Plan); gewählt wird nur per Knopf, nie von selbst. Daten: daten/saunaholz.js, Rechnung: sauna_kern.js (rangliste). */
  var SH = D.saunaholz, zweck = 'wand', gewicht = SK.GEWICHT_START;
  function qdef(k) { return (SH.quellen[k] || SH.zusatz[k] || {}); }
  function kz(qs) {
    return qs && qs.length ? '<span class="sa-kz">(' + qs.map(function (k) { var q = qdef(k); return '<abbr title="' + esc((q.titel || k) + (q.art ? ', ' + q.art : '')) + '">' + esc(k) + '</abbr>'; }).join(', ') + ')</span>' : '';
  }
  function hk(id) { return '<button type="button" class="hilfe-knopf" data-sa="hilfe" data-wert="' + id + '" aria-expanded="' + !!hilfe[id] + '" aria-controls="' + id + '" aria-label="' + T('hilfeKnopf') + '">?</button>'; }
  function hp(id, k) { return '<p class="klein" id="' + id + '"' + (hilfe[id] ? '' : ' hidden') + '>' + T(k) + '</p>'; }
  function balZeile(key, art, s, bruch, text, qs, abg, name, nz) {
    var f = art === 'stufe' || art === 'preis', inner = f ? '<span class="sa-bal' + (art === 'preis' ? ' sa-bal-preis' : '') + (nz ? ' sa-bal-nz' : '') + '" aria-hidden="true"><i style="width:' + Math.round(bruch * 100) + '%"></i></span>' : '<span class="sa-bal sa-bal-leer" aria-hidden="true"></span>';
    return '<li class="sa-kr' + (nz ? ' sa-kr-nz' : '') + '" data-sa-krit="' + key + '" data-stufe="' + (art === 'stufe' ? s : art) + '"' + (nz ? ' data-sa-zaehlt="0"' : '') + '><span class="sa-kn">' + T(name) + (nz ? ' <span class="sa-nz klein" data-sa-nz="1">' + T('saGeruchKein') + '</span>' : '') + '</span>' + inner + '<span class="sa-bt">' + text + (abg ? ' <span class="klein">(' + T('saBalAbg') + ')</span>' : '') + ' ' + kz(qs) + '</span></li>';
  }
  function kritZeilen(x, bal, ein) {
    var h = x.krit.map(function (k) {
      if (k.art === 'stufe') return balZeile(k.key, 'stufe', k.s, k.s / 3, '<b>' + T('saStufe', { s: k.s }) + '</b>: ' + esc(k.t), k.q, k.abg, 'saKrit_' + k.key, !k.zaehlt);
      if (k.art === 'widerspruch') return balZeile(k.key, 'widerspruch', 0, 0, '<span class="ab-luecke" data-luecke="1">' + T('saBalWiderspruch') + '</span>: ' + esc(k.t), k.q, false, 'saKrit_' + k.key, !k.zaehlt);
      return balZeile(k.key, 'luecke', 0, 0, '<span class="ab-luecke" data-luecke="1">' + T('saBalLuecke') + '</span>', [], false, 'saKrit_' + k.key, !k.zaehlt);
    }).join(''), b = bal.filter(function (y) { return y.id === x.id; })[0], p = SK.holzPreis(x.id, ein);
    return h + (b && b.anteil !== null ? balZeile('preis', 'preis', 0, b.anteil, '<b>' + T(ein === 'lfm' ? 'saPreisLfm' : 'saPreisM2', { p: p.von === p.bis ? eur(p.von) : eur(p.von) + ' – ' + eur(p.bis) }) + '</b>', [], false, 'saKrit_preis_' + ein) :
      balZeile('preis', 'luecke', 0, 0, '<span class="ab-luecke" data-luecke="1">' + T('saBalLuecke') + '</span>', [], false, 'saKrit_preis_' + ein));
  }
  function extraPreise(sd, ein) {
    var l = (sd.preise || []).filter(function (p) { return p.e === ein || (ein === 'lfm' && p.e === 'stk'); });
    if (!l.length) return '';
    return '<p class="klein sa-weitere"><b>' + T('saWeitere') + '</b></p><ul class="gs-ul sa-ul" data-sa-extra="' + l.length + '">' + l.map(function (p) {
      var q = qdef(p.q), un = p.s === 'unsicher', eu = p.s === 'eu', et = p.e === 'stk' ? ' €/Stück' : (p.e === 'lfm' ? ' €/lfm' : ' €/m²');
      return '<li data-sa-extra-status="' + p.s + '">' + (p.v === null ? '<b>' + T('saNichtRechenbar') + '</b>' : '<b>' + eur(p.v) + et + '</b>') + ' ' + esc(p.h) + ': ' + esc(p.hinweis || '') + ' ' + (un ? '<b class="sa-unsicher" data-sa-unsicher="1">' + T('saPreisUnsicher') + '</b> ' : '') + (eu ? '<b class="klein">' + T('saPreisEu') + '</b> ' : '') + (p.ausser ? '<b class="klein" data-sa-ausser="1">' + T('saAusser') + '</b> ' : '') +
        WZ.quelleHtml({ id: 'S2-58', quelle: q.titel || p.q, url: /^https?:/.test(q.url || '') ? q.url : '', abruf: SH.stand, status: 'prüfen vor Nutzung' }) + '</li>';
    }).join('') + '</ul>';
  }
  function verbotHtml(k) {
    var v = SH.verbot[k], dt = v.abruf.split('-');
    return '<div class="kh-verbot sa-verbot" role="note" data-sa-verbot="' + k + '"><p><b>' + T('saLand_' + k) + ': ' + T('khNichtErlaubt') + '</b> · ' + esc(v.stufe) + '</p><p>' + T('khRecht', { g: v.gesetz, w: v.ware, s: v.stand, f: v.fund, a: dt[2] + '.' + dt[1] + '.' + dt[0] }) + '</p><p>' + T('khKeinPreis') + ' ' +
      WZ.quelleHtml({ id: 'S2-58-' + k, quelle: 'EUR-Lex', url: v.fund, abruf: v.abruf, status: v.status }) + '</p></div>';
  }
  function importHtml(sd) {
    var im = SH['import'], h = '<details class="an-bed sa-imp" data-sa-import="' + sd.id + '"><summary>' + sym('i-karte') + ' ' + T('saImportTitel') + '</summary>';
    [['pl', sd.pl, im.pl_hinweis, im.pl_q], ['ua', sd.ua, im.ua_hinweis, im.ua_q]].forEach(function (a) {
      var q = qdef(a[3]);
      h += '<div class="sa-land" data-sa-land-zeile="' + a[0] + '"><p><b>' + T('saLand_' + a[0]) + '</b></p>' + (a[1] ? '<ul class="gs-ul sa-ul">' + a[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul><p class="klein"><b class="sa-unsicher">' + T('saPreisUnsicher') + ':</b> ' + esc(a[2]) + ' ' + WZ.quelleHtml({ id: 'S2-58-' + a[0], quelle: q.titel || a[3], url: /^https?:/.test(q.url || '') ? q.url : '', abruf: SH.stand, status: 'prüfen vor Nutzung' }) + '</p>' :
        '<p><span class="ab-luecke" data-luecke="1">' + T('hdKeineAngabe') + '</span></p>') + '</div>';
    });
    if (sd.id === 'kelo' || sd.id === 'fichte') h += '<p class="klein">' + esc(im.kelo) + '</p>';
    return h + verbotHtml('ru') + verbotHtml('by') + '</details>';
  }
  function holzKarte(x, c, bal, ein) {
    var sd = SK.holzDaten(x.id), hi = SK.holzInfo(x.id), sel = c.ps[zweck] === x.id, un = x.u.length, rho = hi.rho && hi.rho.wert !== undefined ? '<li data-sa-eig="rho"><b>' + T('saEig_rho') + ':</b> ' + hi.rho.wert + ' kg/m³ ' + beleg(hi.rho, hi.rho.ids) + '</li>' : '';
    var pm = function (l, kl, tk) {
      return '<div class="sa-pm-' + kl + '"><p class="klein"><b>' + T(tk) + '</b></p>' + (l.length ? '<ul class="gs-ul sa-ul">' + l.map(function (e) { return '<li data-sa-' + kl + '="1">' + esc(e[0]) + ' ' + (e[2] ? '<b class="sa-unsicher" data-sa-unsicher="1">' + T('saUnsicher') + '</b> ' : '') + kz(e[1]) + '</li>'; }).join('') + '</ul>' : '<p class="klein">' + T('hdKeineAngabe') + '</p>') + '</div>';
    };
    var punkte = '';
    SH.gezaehlt.forEach(function (k) { var an = x.q.indexOf(k) >= 0, u = x.u.indexOf(k) >= 0; punkte += '<i class="sa-pkt' + (an ? ' an' : '') + (u ? ' un' : '') + '" title="' + esc((qdef(k).titel || k) + (an ? '' : ': -')) + '"></i>'; });
    var wahl = '<div class="ab-stufen sa-wahl sa-wahl-kopf"><button type="button" class="es-var sa-opt" data-sa="holz" data-feld="holz_' + zweck + '" data-wert="' + x.id + '" data-fk="holz-' + zweck + '-' + x.id + '" aria-pressed="' + sel + '"><span class="es-var-kopf">' + sym(zweck === 'wand' ? 'i-wand' : 'i-bett') + '<b>' + T('saWaehlen_' + zweck, { name: hi.name }) + '</b></span></button></div>';
    return '<li class="sa-holz' + (sel ? ' sa-gewaehlt' : '') + '" data-sa-holz="' + x.id + '" data-platz="' + x.platz + '" data-punkte="' + x.punkte + '" data-quellen="' + x.n + '"><div class="sa-holz-kopf"><span class="sa-platz" data-sa-platz="' + x.platz + '">' + T(x.geteilt ? 'saPlatzGeteilt' : 'saPlatz', { n: x.platz }) + '</span>' + sym('i-sa-holz') + '<b class="sa-name">' + esc(hi.name) + '</b>' +
      (x.meist ? ' <span class="sa-abz" data-sa-meist="1">' + T('saMeist') + '</span>' : '') + (sel ? ' <span class="sa-abz sa-abz-gew" data-sa-gewaehlt="1">' + sym('i-wand') + ' ' + T('saGewaehlt') + '</span>' : '') + wahl + '</div><div class="sa-sp"><div>' +
      '<p class="sa-pz"><b data-sa-pz="' + x.punkte + '">' + T('saPunkte', { p: m2(x.punkte) }) + '</b><span class="sa-bal sa-bal-gross" aria-hidden="true"><i style="width:' + Math.min(100, x.punkte) + '%"></i></span></p>' +
      '<p class="sa-quellen" data-sa-quellen="' + x.n + '"><span class="sa-pkte" role="img" aria-label="' + T('saQuellenZahl', { n: x.n, m: x.gesamt }) + '">' + punkte + '</span> <b>' + T('saQuellenZahl', { n: x.n, m: x.gesamt }) + '</b>' + (un ? ' <span class="klein" data-sa-quellen-unsicher="' + un + '">' + T('saQuellenUn', { u: un }) + '</span>' : '') + ' ' + kz(x.q) + '</p>' +
      '<p class="klein" data-sa-belegt="' + x.belegt + '">' + T('saBelegt', { b: x.belegt, m: x.belegtVon }) + '</p><ul class="sa-krits">' + kritZeilen(x, bal, ein) + '</ul><ul class="gs-ul sa-ul">' + rho + '</ul></div><div>' +
      '<div class="sa-pm">' + pm(sd.plus, 'plus', 'saPlusTitel') + pm(sd.minus, 'minus', 'saMinusTitel') + '</div>' +
      (sd.widerspruch ? '<p class="ab-meldung" role="note" data-sa-widerspruch="1">' + T('saBalWiderspruch') + '. ' + esc(sd.widerspruch) + '</p>' : '') + (sd.hinweis ? '<p class="klein" data-sa-vorbehalt="1"><b>' + T('saVorbehalt') + ':</b> ' + esc(sd.hinweis) + '</p>' : '') +
      '<p class="klein">' + (ein === 'lfm' ? '€/lfm' : '€/m²') + '</p>' + preisBlock(hi, ein) + extraPreise(sd, ein) + importHtml(sd) +
      '</div></div></li>';
  }
  function listeHtml(c) {
    var r = SK.rangliste(zweck, gewicht), ein = zweck === 'wand' ? 'm2' : 'lfm', bal = SK.preisBalken(ein);
    return r.eintraege.map(function (x) { return holzKarte(x, c, bal, ein); }).join('');
  }
  function gewText() { var e = Math.round(gewicht * 100); return T('saGewWert', { e: e, p: 100 - e }); }
  /* S3: der Satz unter dem Regler folgt dem Regler: in der Mitte "Start: je zur Hälfte" (Annahme, mit Schild), sonst die gewählte Gewichtung in Alltagsworten; keine eigene Ansage (der Regler trägt aria-valuetext) */
  function gewAnn() { var e = Math.round(gewicht * 100); return e === 50 ? schild() + ' ' + T('saGewAnn') : T('saGewAnnW', { e: e, p: 100 - e }); }
  function t2Html(c) {
    var h = kopfZeile('i-sa-holz', 'saT2', 't2') + '<div class="sa-reiter" role="tablist" aria-label="' + T('saZweckAria') + '">';
    ['wand', 'bank'].forEach(function (z) {
      h += '<button type="button" role="tab" class="es-var sa-opt sa-reiter-knopf" id="sa-reiter-' + z + '" data-sa="zweck" data-wert="' + z + '" data-fk="zweck-' + z + '" aria-selected="' + (zweck === z) + '" tabindex="' + (zweck === z ? 0 : -1) + '" aria-controls="sa-rang"><span class="es-var-kopf">' + sym(z === 'wand' ? 'i-wand' : 'i-bett') + '<b>' + T('saZweck_' + z) + '</b></span></button>';
    });
    h += '</div><p class="ab-meldung sa-satz" role="note" data-sa-rangsatz="1">' + T('saRangSatz') + '</p><div class="sa-gew"><label class="es-label" for="sa-gew">' + T('saGewTitel') + ' <b id="sa-gew-wert" class="es-zahl">' + gewText() + '</b> ' + hk('sa-h-rang') + '</label>' + hp('sa-h-rang', 'saHilfe_rang') +
      '<input type="range" id="sa-gew" min="0" max="100" step="10" value="' + Math.round(gewicht * 100) + '" data-sa="gew" data-fk="gew" aria-valuetext="' + esc(tr('saGewWert', { e: Math.round(gewicht * 100), p: 100 - Math.round(gewicht * 100) })) + '"><span class="sa-gew-enden klein"><span>' + T('saGewP') + '</span><span>' + T('saGewE') + '</span></span><p class="klein" id="sa-gew-ann" data-sa-annahme="gewicht">' + gewAnn() + '</p></div>' +
      '<p class="klein sa-hk"><b>' + T('saBalkenTitel') + '</b> ' + hk('sa-h-krit') + ' <b>' + T('saGeruchTitel') + '</b> ' + hk('sa-h-geruch') + ' <b>' + T('saImportTitel') + '</b> ' + hk('sa-h-imp') + '</p>' + hp('sa-h-krit', 'saHilfe_krit') + hp('sa-h-geruch', 'saHilfe_geruch') + hp('sa-h-imp', 'saHilfe_imp') +
      '<ol class="sa-rang" id="sa-rang" role="tabpanel" aria-labelledby="sa-reiter-' + zweck + '" data-sa-zweck="' + zweck + '">' + listeHtml(c) + '</ol>';
    ['wand', 'bank'].forEach(function (f) { var z = SK.zaehlung(c.ps[f], f); if (z.n === 0) h += '<p class="ab-meldung" role="note" data-sa-warn="eignung-' + f + '">' + T('saEignungWarn', { name: SK.holzInfo(c.ps[f]).name, was: tr(f === 'wand' ? 'saWand' : 'saBank'), m: z.gesamt }) + '</p>'; });
    var ed = SH.eudr, q ='<ul class="gs-ul sa-ul">' + SH.gezaehlt.concat(['WE']).map(function (k) { var d = qdef(k); return '<li data-sa-quelle="' + k + '"><b>' + k + '</b>: ' + (/^https?:/.test(d.url || '') ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.titel) + '</a>' : esc(d.titel)) + ' <span class="klein">(' + esc(d.art) + ')</span></li>'; }).join('') + '</ul>';
    h += '<details class="an-bed sa-quellenliste"><summary>' + T('saEudrTitel') + '</summary><p>' + esc(ed.text) + '</p><p class="klein">' + esc(ed.gesetz) + ', ' + esc(ed.stand) + '. ' + WZ.quelleHtml({ id: 'S2-58-eudr', quelle: 'EUR-Lex', url: ed.fund, abruf: ed.abruf, status: ed.status }) + '</p></details>' +
      '<details class="an-bed sa-quellenliste"><summary>' + T('saQuellenListe') + '</summary>' + q + '</details>';
    return h + (c.ps.explizit.wand && c.ps.explizit.bank ? '' : '<p class="klein" data-sa-annahme="holz">' + schild() + ' ' + T('saStartHolz', { w: SK.holzInfo(c.ps.wand).name, b: SK.holzInfo(c.ps.bank).name }) + '</p>');
  }
  function neuListe() { var l = byId('sa-rang'); if (l && ctx && ctx.ok) { l.innerHTML = listeHtml(ctx); } var w = byId('sa-gew-wert'); if (w) w.textContent = tr('saGewWert', { e: Math.round(gewicht * 100), p: 100 - Math.round(gewicht * 100) }); var a = byId('sa-gew-ann'); if (a) a.innerHTML = gewAnn(); }

  /* ---------- Teil 3: Materialliste ---------- */
  function posHtml(p, mg) {
    var name = tr(p.id === 'daemmung' ? 'maBt_daemmung' : 'saMat_' + p.id) + (p.holz ? ': ' + SK.holzInfo(p.holz).name : ''), pr, b = '', an = '';
    pr = p.luecke ? '<span class="ab-luecke" data-luecke="1">' + T('hdKeineAngabe') + '</span>' : p.imOfen ? '<span class="klein">' + T('saImOfen') + '</span>' : '<span data-von="' + p.von + '" data-bis="' + p.bis + '">' + esc(spanne(p.von, p.bis)) + '</span>';
    if (!p.luecke) b = p.beleg && p.beleg.quelle ? beleg({ quelle: p.beleg.quelle, status: p.beleg.status, i: p.beleg.i }) : (p.preis && p.preis.zeilen ? p.preis.zeilen.map(function (r) { return beleg(r); }).join(' ') : '');
    if (p.id === 'profil') an = tr('saAn_profil', { v: n0(mg.verschnitt * 100) });
    else if (p.id === 'bank') an = tr('saAn_bank', { n: mg.bankBretter, u: mg.nUnten, o: mg.nOben, l: nz(mg.bankLaenge), v: n0(mg.verschnitt * 100) });
    else if (p.id === 'daemmung') an = tr('saAn_daemmung');
    return '<tr data-sa-pos="' + p.id + '"' + (p.luecke ? ' data-luecke="1"' : '') + '>' + td('abSpPos', esc(name) + (an ? '<br><span class="klein">' + schild() + ' ' + esc(an) + '</span>' : '') + (p.luecke && p.beleg && p.beleg.hinweis ? '<br><span class="klein">' + esc(p.beleg.hinweis) + '</span>' : '')) +
      td('abSpMenge', p.menge != null ? nf(p.menge, 2) + ' ' + p.einheit : '–', 1) + td('abSpPreis', pr, 1) + td('regQuelle', b) + '</tr>';
  }
  function t3Html(c) {
    var m = c.material;
    return kopfZeile('i-material', 'saT3', 't3') + tab(['abSpPos', 'abSpMenge', 'abSpPreis', 'regQuelle'], m.pos.map(function (p) { return posHtml(p, m.mengen); }).join('') +
      '<tr class="summe" data-sa-summe="selbstbau" data-von="' + m.summe.von + '" data-bis="' + m.summe.bis + '" data-luecken="' + m.luecken + '">' + td('abSpPos', '<b>' + T('saSummeSelbst') + '</b>') + td('abSpMenge', '', 1) + td('abSpPreis', '<b>' + esc(spanne(m.summe.von, m.summe.bis)) + '</b>', 1) + td('regQuelle', '') + '</tr>') +
      (m.luecken ? '<p class="klein" data-sa-ohne="' + m.luecken + '">' + T('saSummeOhne', { n: m.luecken }) + '</p>' : '');
  }

  /* ---------- Teil 4: Preisvergleich und Strom ---------- */
  function fertigTabelle(zeilen) {
    return tab(['saTh_modell', 'druckArt', 'saTh_mass', 'saTh_ofen', 'abSpPreis', 'saTh_anbieter'], zeilen.map(function (x) {
      var r = x.r;
      return '<tr data-sa-fertig="' + r.id + '" data-quelle-id="' + r.quelle + '" data-preis="' + r.preis + '">' + td('saTh_modell', esc(r.name)) + td('druckArt', T('saV_' + r.art)) + td('saTh_mass', nf(r.b, 2) + ' × ' + nf(r.t, 2) + (r.h ? ' × ' + nf(r.h, 2) : ''), 1) + td('saTh_ofen', esc(r.ofen)) +
        td('abSpPreis', '<b>' + (r.ab ? T('saAb') + ' ' : '') + eur(r.preis) + ' €</b>', 1) + td('saTh_anbieter', beleg({ quelle: r.quelle, h: /^HB/.test(r.quelle) ? 'Hornbach.de' : 'Check24', status: r.status || SD.status_fertig, i: r.id })) + '</tr>';
    }).join(''));
  }
  function t4kHtml(c) {
    return kopfZeile('i-rechner', 'saT4', 't4') + h5('i-blitz', 'saBetriebTitel') + regler('sa-st', 'saStunden', c.ps.stunden, SK.S_MIN, SK.S_MAX, 0.25, 'st') + (c.ps.explizit.stunden ? '' : '<p class="klein" data-sa-annahme="stunden">' + schild() + ' ' + T('saStundenAnnahme') + '</p>');
  }
  function t4Html(c) {
    var b = c.betrieb, v = c.vergleich, s = c.material.summe;
    return (b.ok ? '<p class="sa-gross" data-sa-betrieb="' + b.eur + '"><b>' + T('saBetrieb', { kw: nz(b.kw), h: m2(b.stunden), ct: nf(b.ct, 2), eur: eur(b.eur) }) + '</b></p><p class="klein">' + WZ.quelleHtml({ id: 'S-90', quelle: 'Destatis, Strompreis 1. Halbjahr 2026', url: D.energiepreise.quellen[c.strom.quelle].url, abruf: c.strom.abruf, status: c.strom.status }) + '</p>' :
      '<p class="ab-luecke" data-luecke="1" data-sa-betrieb="keine">' + T('saBetriebKein') + '</p>') + '<p class="klein">' + schild() + ' ' + T('saKlasse', { f: m2(v.flaeche) }) + '</p>' +
      tab(['druckArt', 'abSpPreis', 'regQuelle'], '<tr data-sa-selbst="1" data-von="' + s.von + '" data-bis="' + s.bis + '">' + td('druckArt', '<b>' + T('saV_selbst') + '</b>') + td('abSpPreis', '<b>' + esc(spanne(s.von, s.bis)) + '</b>', 1) + td('regQuelle', '<span class="klein">' + T('saSummeOhne', { n: c.material.luecken }) + '</span>') + '</tr>') +
      h5('', 'saGleich') + (v.gleich.length ? fertigTabelle(v.gleich) : '<p class="klein">' + T('saKeineGleich') + '</p>') + '<details class="an-bed" data-sa-andere="' + v.andere.length + '"><summary>' + T('saAndere') + ' (' + v.andere.length + ')</summary>' + fertigTabelle(v.andere) + '</details>';
  }

  /* ---------- Teil 5: Regeln und Bauablauf ---------- */
  function ampelHtml(c) {
    var v = c.vf, a = c.ampel, s = v && v.ok ? v.summe : null, h = h5('i-paragraf', 'gsAntragTitel');
    if (c.art === 'innen') return h + '<p class="klein" data-sa-ampel="innen">' + T('saAmpelInnen') + '</p>';
    if (!s) return h + '<p class="ab-meldung fehler" role="alert">' + T('anKeineDaten', { grund: v ? v.grund : '' }) + '</p>';
    return h + '<p class="klein" data-sa-land="' + esc(c.ctx.land) + '">' + T('saAmpelFuer', { land: c.ctx.landName, ofen: tr('saOfen_' + c.ofen) }) + '</p><div class="an-satz an-f ' + a + '" role="status" data-an-ampel="' + a + '">' + WZ.ampelChip(a, false) + '<span class="an-satz-text" data-an-satz="antrag">' + esc(WZ.satzFuer(s)) + '</span></div>' +
      (s.zeile && s.zeile.auslegung ? WZ.auslegungHtml(s.zeile) : '') + (v.holzHinweis ? '<p class="ab-meldung" role="note">' + T('gsHolzHinweis') + '</p>' : '') + (v.zeilen.length ? '<details class="an-bed gs-einzel"><summary>' + T('gsEinzel') + '</summary>' + v.zeilen.map(WZ.zeileHtml).join('') + '</details>' : '');
  }
  function abstandHtml(c) {
    if (c.ofen === 'holz') return '<p class="klein">' + T('saAbstandHinweis') + '</p>';
    return h5('i-mass', 'saAbstandTitel') + tab(['saTh_ofen', 'saTh_decke', 'saTh_seite', 'saTh_gitter', 'regQuelle'], SD.ofen.abstand.map(function (a) {
      return '<tr data-sa-abstand-kw="' + a.kw + '"' + (a.kw === c.kw ? ' class="sa-treffer"' : '') + '>' + td('saTh_ofen', esc(a.modell)) + td('saTh_decke', a.decke + ' cm', 1) + td('saTh_seite', a.seite + ' cm', 1) + td('saTh_gitter', a.gitter + ' cm', 1) + td('regQuelle', beleg(a, a.i)) + '</tr>';
    }).join(''), ' data-sa-abstand="1"') + '<p class="klein">' + T('saAbstandHinweis') + '</p>';
  }
  function t5Html(c) {
    var h = kopfZeile('i-paragraf', 'saT5', 't5') + ampelHtml(c), bk = { innen: 'i', garten: 'g', fass: 'f' }[c.art], W = {}, n = 0;
    SD.widersprueche.forEach(function (w) { W[w.id] = w; });
    ['strom', 'brand', 'holz', 'luft', 'fund', 'dach', 'heiz'].forEach(function (th) {
      var l = SD.regeln.filter(function (r) { return r.thema === th && r.art.indexOf(bk) >= 0; });
      if (!l.length || (th === 'holz' && c.ofen !== 'holz')) return;
      h += '<h5 class="es-h5 sa-h5" data-sa-thema="' + th + '">' + T('saThema_' + th) + '</h5><ul class="gs-ul sa-ul">' + l.map(function (r) {
        return '<li data-sa-regel="' + r.id + '">' + esc(r.text) + (th === 'strom' && !/Elektrofachkraft/.test(r.text) ? ' <b>' + T('saElektro') + '</b>' : '') + ' <span class="klein">(' + esc(r.ids.join(', ')) + ')</span> ' + beleg(r, r.id) + (r.w ? '<br><span class="klein" data-sa-widerspruch="' + r.w + '">' + T('saEntscheidung', { text: W[r.w].entscheidung }) + '</span>' : '') + '</li>';
      }).join('') + '</ul>' + (th === 'brand' ? abstandHtml(c) : '');
    });
    h += h5('i-hammer', 'saTAblauf') + '<ol class="sa-ablauf">';
    SD.bauablauf.filter(function (s) { return s.art.indexOf(bk) >= 0; }).forEach(function (s) {
      var l = s.status === 'Lücke';
      h += '<li class="sa-schritt' + (l ? ' sa-luecke' : '') + '" data-sa-schritt="' + s.nr + '" data-status="' + esc(s.status) + '"><span class="sa-nr">' + sym(s.symbol) + '<b>' + T('saSchritt', { n: ++n }) + '</b></span> <b>' + esc(s.titel) + '</b><br>' + (l ? '<span class="ab-luecke" data-luecke="1">' + T('saLuecke') + '</span> ' : '') + esc(s.text.replace(/^Lücke: keine belegte Anleitung\.? ?/, '')) +' <span class="klein">(' + esc(s.ids.join(', ')) + ')</span> ' + beleg(s, 'schritt-' + s.nr) + '</li>';
    });
    return h + '</ol>';
  }

  /* ---------- 3D-Modell (three.js) ---------- */
  var gl = { ok: null, yaw: 0.65, pitch: 0.4, dist: 6, zoom: 1 };
  function css(n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; }
  function ersatz(grund) {
    var cv = byId('sa-3d'), e = byId('sa-3d-ersatz'), m = byId('sa-modell');
    gl.ok = false; if (cv) cv.hidden = true; if (e) { e.hidden = false; e.textContent = tr('saModellKein') + ' (' + grund + ')'; } if (m) m.setAttribute('data-render', 'ersatz');
  }
  function init3d() {
    if (gl.ok !== null) return gl.ok;
    var cv = byId('sa-3d'), z = null;
    if (!cv || typeof THREE === 'undefined') return ersatz('three.js');
    try { gl.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return ersatz('WebGL'); }
    gl.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    gl.s = new THREE.Scene(); gl.ka = new THREE.PerspectiveCamera(35, 1, 0.05, 200); gl.ziel = new THREE.Vector3();
    var sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 6, 4); gl.s.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.9), sun);
    gl.w = new THREE.Group(); gl.s.add(gl.w);
    cv.addEventListener('pointerdown', function (ev) { z = { x: ev.clientX, y: ev.clientY, a: gl.yaw, p: gl.pitch }; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ohne Capture */ } });
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
  function groesse() { var cv = byId('sa-3d'); if (!gl.ok || !cv || !cv.clientWidth || !cv.clientHeight) return; gl.r.setSize(cv.clientWidth, cv.clientHeight, false); gl.ka.aspect = cv.clientWidth / cv.clientHeight; gl.ka.updateProjectionMatrix(); zeichnen(); }
  function zeichnen() {
    if (!gl.ok || !gl.w) return;
    var d = gl.dist / gl.zoom, p = gl.pitch;
    gl.ka.position.set(gl.ziel.x + d * Math.cos(p) * Math.sin(gl.yaw), gl.ziel.y + d * Math.sin(p), gl.ziel.z + d * Math.cos(p) * Math.cos(gl.yaw));
    gl.ka.lookAt(gl.ziel); gl.r.render(gl.s, gl.ka);
    var mo = byId('sa-modell'); if (mo) mo.setAttribute('data-yaw', gl.yaw.toFixed(2));
  }
  function bau3d(c) {
    var m = byId('sa-modell'), g = c.geo, o = g.ofen;
    if (!m) return;
    [['art', c.art], ['breite', g.B], ['tiefe', g.T], ['hoehe', g.H], ['wand-m', g.w], ['holz-wand', c.ps.wand], ['holz-bank', c.ps.bank], ['ofen', c.ofen], ['kw', o ? o.kw : ''], ['zone-seite', o ? o.seite : ''], ['zone-decke', o ? o.decke : ''], ['bank-oben', g.bank.oben.tiefe], ['bank-unten', g.bank.unten.tiefe], ['dach', c.art === 'garten' ? 1 : 0]].forEach(function (a) { m.setAttribute('data-' + a[0], a[1]); });
    if (!init3d()) return;
    byId('sa-3d').hidden = false;
    gl.w.children.slice().forEach(function (k) { gl.w.remove(k); k.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); });
    var wf = new THREE.Color(css('--holz', '#946a3c')), bf = new THREE.Color(css('--holz', '#946a3c')), ln = new THREE.Color(css('--text', '#241d2e')), cc = function (v, fb) { return new THREE.Color(css(v, fb)); };
    var mt = function (col, op) { return new THREE.MeshLambertMaterial({ color: col, transparent: op < 1, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 1 }); };
    var bx = function (x0, y0, z0, x1, y1, z1, mat, kante) {
      var me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); gl.w.add(me);
      if (kante) { var l = new THREE.LineSegments(new THREE.EdgesGeometry(me.geometry), new THREE.LineBasicMaterial({ color: ln, transparent: true, opacity: 0.45 })); l.position.copy(me.position); gl.w.add(l); }
    };
    var wm = mt(wf, 0.5), B = g.B, T_ = g.T, H = g.H, w = g.w, tb = g.tuer.b, tx = g.tuer.x, th = Math.min(g.tuer.h, H - w - 0.05), glas = mt(cc('--c2', '#1f9bd1'), 0.45), dachM = mt(cc('--leise', '#5c5666'), 0.7);
    var gr = new THREE.Mesh(new THREE.PlaneGeometry(B + 3, T_ + 3), mt(cc('--linie', '#e8dfd1'), 1)); gr.rotation.x = -Math.PI / 2; gr.position.set(B / 2, -0.01, T_ / 2); gl.w.add(gr);
    if (c.art === 'fass') {
      var r = g.d / 2, zy = new THREE.Mesh(new THREE.CylinderGeometry(r, r, T_ - 2 * w, 36, 1, true), wm); zy.rotation.x = Math.PI / 2; zy.position.set(r, r, T_ / 2); gl.w.add(zy);
      [0, T_ - w].forEach(function (z0) { var k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36), wm); k.rotation.x = Math.PI / 2; k.position.set(r, r, z0 + w / 2); gl.w.add(k); });
      bx(tx, 0, T_ - 0.01, tx + tb, th, T_ + 0.01, glas, 1);
    } else {
      var dach = c.art === 'garten', ue = dach ? 0.15 : 0;
      bx(0, 0, 0, w, H - w, T_, wm, 1); bx(B - w, 0, 0, B, H - w, T_, wm, 1); bx(w, 0, 0, B - w, H - w, w, wm, 1); bx(w, 0, T_ - w, tx, H - w, T_, wm, 1); bx(tx + tb, 0, T_ - w, B - w, H - w, T_, wm, 1); bx(tx, th, T_ - w, tx + tb, H - w, T_, wm, 1); bx(tx, 0, T_ - w, tx + tb, th, T_, glas, 1);
      bx(-ue, H - w, -ue, B + ue, H, T_ + ue, dachM, 1);
      if (dach) bx(-ue, H - 0.06, T_ + ue, B + ue, H, T_ + 0.75, dachM, 1);
    }
    var bm = mt(bf, 1), x0 = c.art === 'fass' ? 0.12 : w, x1 = c.art === 'fass' ? g.d - 0.12 : B - w, bo = g.bank.oben.tiefe;
    bx(x0, 0.86, w, x1, 0.9, w + bo, bm, 1); bx(x0, 0.41, w + bo, x1, 0.45, w + bo + g.bank.unten.tiefe, bm, 1);
    if (o) {
      bx(Math.max(w, o.x - o.seite), 0, Math.max(w, o.z - o.seite), Math.min(B - w, o.x + o.b + o.seite), Math.min(g.Hi, o.h + o.decke), Math.min(T_ - w, o.z + o.t + o.seite), mt(cc('--c3', '#d0567f'), 0.18), 1);
      bx(o.x, 0, o.z, o.x + o.b, o.h, o.z + o.t, mt(cc('--c3', '#d0567f'), 1), 1);
    }
    gl.ziel.set(B / 2, H / 2, T_ / 2); gl.dist = Math.max(B, T_, H) * 3.1; gl.zoom = 1;
    m.setAttribute('data-render', 'ok'); m.setAttribute('data-teile', gl.w.children.length);
    groesse(); zeichnen();
  }

  /* ---------- Zusammenspiel ---------- */
  function ofenText(c) { return c.ofen === 'holz' ? tr('saOfenKurz_holz') : c.kw ? tr('saOfenKurz', { kw: nz(c.kw) }) : tr('saOfenKurz_0'); }
  function kopf(c) {
    var e = byId('g-sauna-kopfzeile'); if (!e) return;
    e.textContent = c.ok ? tr('saKopf', { art: tr('saArt_' + c.art), v: nz(c.volumen), ofen: ofenText(c), von: n0(c.material.summe.von), bis: n0(c.material.summe.bis) }) : tr('saKopf0');
    if (c.ok) e.removeAttribute('data-leer'); else e.setAttribute('data-leer', '1');
  }
  function teil(id, fn, c) { var w = byId(id); if (w) { var neu = fn(c); WZ.mitFokus(w, function () { w.innerHTML = neu; }); } }
  function meldungen(c) {
    if (!c.ok) return '<p class="ab-meldung" role="status" data-sa-leer="' + c.grund + '">' + T(c.grund === 'refFehlt' ? 'saRefFehlt' : 'saKeine') + '</p><button type="button" class="knopf mittel" data-sa="anlegen" data-fk="anlegen">' + sym('i-gs-sauna') + ' ' + T('saSetzen') + '</button>';
    return c.ps.meldungen.map(function (m) { return '<p class="ab-meldung" role="status" data-sa-meldung="' + m.typ + '">' + T('saMeld', { w: m.wert, feld: m.typ === 'art' ? 'art' : m.feld }) + '</p>'; }).join('');
  }
  function jetzt(nurErgebnis) {
    clearTimeout(timer);
    var c;
    try { c = ctx = SK.rechne(G.plan()); } catch (e) { melde(tr('saFehler', { grund: e && e.message ? e.message : e })); return; }
    melde(''); kopf(c);
    var d = byId('g-sauna-details'), box = byId('sa-box');
    if (!d || !d.open) return;
    try {
      teil('sa-meldung', meldungen, c);
      if (box) box.hidden = !c.ok;
      if (!c.ok) return;
      if (!nurErgebnis) { teil('sa-t1', t1Html, c); teil('sa-t4k', t4kHtml, c); }
      teil('sa-t1e', t1eHtml, c); teil('sa-skizzen', skizzenHtml, c); teil('sa-t2', t2Html, c); teil('sa-t3', t3Html, c); teil('sa-t4', t4Html, c); teil('sa-t5', t5Html, c);
      byId('sa-legende').innerHTML = legendeHtml(c);
      bau3d(c);
    } catch (e2) { melde(tr('saFehler', { grund: e2 && e2.message ? e2.message : e2 })); }
    nurErg = false;
  }
  function aktualisieren() { clearTimeout(timer); var n = nurErg; timer = setTimeout(function () { jetzt(n); }, 150); }
  function geaendert(nur) { nurErg = !!nur; G.geaendert(); }
  var FELD = { b: 'breite_m', t: 'tiefe_m', h: 'hoehe_m' };
  function bei(ev) {
    var t = ev.target, a = t.getAttribute && t.getAttribute('data-sa');
    if (!a || ev.type !== 'input' || t.type !== 'range') return;
    erstesMal();
    if (a === 'gew') { gewicht = SK.gewichtOk(+t.value / 100); t.setAttribute('aria-valuetext', tr('saGewWert', { e: Math.round(gewicht * 100), p: 100 - Math.round(gewicht * 100) })); neuListe(); return; }   /* nur die Liste wird neu gezeichnet, der Regler bleibt stehen */
    var x = Math.round(+t.value * 100) / 100, lab = byId(t.id + '-wert');
    if (a === 'st') {
      if (lab) lab.textContent = m2(x) + ' h';
      if (SK.wahlSetzen(G.plan(), 'stunden', x)) { var an = document.querySelector('[data-sa-annahme=stunden]'); if (an) an.remove(); geaendert(true); }
    } else {
      if (lab) lab.textContent = m2(x) + ' m';
      if (SK.groesseSetzen(G.plan(), FELD[a], x)) geaendert(true);
    }
  }
  function erstesMal() { if (hinweis) { hinweis = false; try { localStorage.setItem('immo-sa-hinweis', '1'); } catch (e1) { /* nur der Hinweis fällt weg */ } } }
  function klick(ev) {
    var t = ev.target.closest('[data-sa]'), plan = G.plan();
    if (!t || t.tagName === 'INPUT') return;
    erstesMal();
    var a = t.getAttribute('data-sa'), w = t.getAttribute('data-wert');
    if (a === 'hilfe') { var p = byId(w), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf); hilfe[w] = auf; if (p) p.hidden = !auf; }
    else if (a === 'zweck') { if ((w === 'wand' || w === 'bank') && ctx && ctx.ok) { zweck = w; teil('sa-t2', t2Html, ctx); } }
    else if (a === 'anlegen') { if (SK.saunaAnlegen(plan).ok) geaendert(false); }
    else if (a === 'art') { if (SK.wahlSetzen(plan, 'art', w)) geaendert(false); }
    else if (a === 'holz') { if (SK.wahlSetzen(plan, t.getAttribute('data-feld'), w)) geaendert(false); }
    else if (a === 'ofen' && ctx && ctx.ok) { GK.festschreiben(plan); if (GK.bausteinOption(plan, ctx.item.id, 'ofen', w)) geaendert(false); }
  }
  function planen(id) {
    if (!SK.verknuepfen(G.plan(), id).ok) return false;
    var d = byId('g-sauna-details'); if (d) d.open = true;
    G.geaendert(); jetzt(false);
    byId('g-sauna-karte').scrollIntoView({ block: 'start', behavior: 'auto' });
    var f = document.querySelector('#sa-t1 [data-fk="art-' + (ctx && ctx.art) + '"]'); if (f) f.focus({ preventScroll: true });
    return true;
  }
  var wurzel = byId('g-sauna-inhalt'), det = byId('g-sauna-details');
  function reiterTaste(ev) {   /* Reiter: Pfeil links/rechts, Pos1/Ende wechseln und setzen den Fokus (rollender Tabindex) */
    var t = ev.target;
    if (!t.closest || !t.closest('[data-sa=zweck]') || !ctx || !ctx.ok) return;
    var k = ev.key, neu = k === 'ArrowLeft' || k === 'Home' ? 'wand' : k === 'ArrowRight' || k === 'End' ? 'bank' : null;
    if (!neu) return;
    ev.preventDefault(); zweck = neu; teil('sa-t2', t2Html, ctx);
    var f = byId('sa-reiter-' + neu); if (f) f.focus({ preventScroll: true });
  }
  if (wurzel) { wurzel.addEventListener('click', klick); wurzel.addEventListener('input', bei); wurzel.addEventListener('keydown', reiterTaste); }
  if (det) det.addEventListener('toggle', function () { if (det.open) jetzt(false); });
  window.addEventListener('sprachegewechselt', function () { jetzt(false); });
  window.addEventListener('themagewechselt', function () { if (ctx && ctx.ok && gl.ok) bau3d(ctx); });
  window.GRUNDRISS_SAUNA = { aktualisieren: aktualisieren, jetzt: jetzt, planen: planen, ergebnis: function () { return ctx; } };
  setTimeout(function () { jetzt(false); }, 0);
})();
