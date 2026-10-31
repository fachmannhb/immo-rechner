/* Oberfläche „Wie gut gedämmt?“, „Frische Luft“, „Wasser“ und Energiepreise (Welle D, Teil 2b). Alle Zahlen rechnet huelle_kern.js (rein, läuft auch in Node); hier steht nur Darstellung und Bedienung.
   Vier Karten im Grundriss unter „Material für Ihr Haus“:
   1. #g-daemmung-karte: vier Bildknöpfe (Altbau, Gesetz, KfW, Passivhaus), Heizwärme-Balken, Energiepreise (Gas, Öl), U-Werte, Mehrkosten, Förderung, „rechnet sich in … Jahren“.
   2. #g-lueftung-karte: vier Lüftungsarten, Kosten, Strom, Förderung, Wirkung im selben Balken.
   3. #g-wasser-karte: Regenwasser aus Dachfläche und Niederschlag des Bundeslands, Autarkie-Balken, Enthärtung.
   Der Heizwärme-Balken ist EIN Baustein (balkenHtml): die Material-Karte (grundriss_ausbau.js) ruft ihn ebenfalls, darum zeigen beide dieselbe Zahl.
   Gespeichert wird im Plan: plan.daemmstandard (+ kfwstufe, mehrkosten_eigen), plan.lueftung { art, neubau }, plan.wasser { personen, regenwasser, gruendach, haerte, enthaertung, preis },
   plan.energiepreise { traeger, gas_ct, oel_eur100l }. Fehlt ein Feld, gilt der Standard und das Feld bleibt weg (alte Pläne laden unverändert).
   Texte: daten/texte_huelle.js (de/en/ru). Jede Zahl trägt Quelle, Abruf und Status (R073); Annahmen sind als Annahme gekennzeichnet (R005). Keine Bau-, Förder- oder Rechtsberatung (R006, R078). */
(function () {
  'use strict';
  var HK = window.HUELLE_KERN, AK = window.AUSBAU_KERN, G = window.GRUNDRISS, D = window.DATEN || {};
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return window.TXT ? window.TXT.lang() : 'de'; }
  function nf(d) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function n0(x) { return nf(0).format(x); }
  function n1(x) { return nf(1).format(x); }
  function n2(x) { return nf(2).format(x); }
  function eur(x) { return n0(x) + ' €'; }
  function r100(x) { return Math.round(x / 100) * 100; }
  function bis(a, b, f) { f = f || n0; return Math.abs(a - b) < 1e-9 ? f(a) : f(a) + ' ' + tr('wortBis') + ' ' + f(b); }
  function spanneEur(a, b) { return Math.abs(a - b) < 0.5 ? eur(a) : n0(a) + ' ' + tr('wortBis') + ' ' + eur(b); }
  function datumDe(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  function symbol(id) { return '<svg class="sym" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function byId(id) { return document.getElementById(id); }
  function zahlLesen(txt) {
    var s = String(txt == null ? '' : txt).replace(/\s/g, '');
    if (s === '') return NaN;
    s = s.indexOf(',') >= 0 ? s.replace(/\./g, '').replace(',', '.') : s;
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function meldeFehler(id, text) { var e = byId(id); if (!e) return; e.textContent = text || ''; e.hidden = !text; }
  var FEHLER_IDS = ['g-daemmung-fehler', 'g-lueftung-fehler', 'g-wasser-fehler'];
  if (!HK || !AK || !G || !D.daemmung_seite || !D.wasser || !D.energiepreise) {
    var grund = 'Die Rechnung für Dämmung, Lüftung und Wasser konnte nicht geladen werden: ' + (!HK ? 'huelle_kern.js fehlt.' : (!AK ? 'ausbau_kern.js fehlt.' : (!G ? 'die Zeichnung fehlt.' : 'die Datendateien fehlen.')));
    FEHLER_IDS.forEach(function (id) { meldeFehler(id, grund); });
    return;
  }

  /* ---------- Bausteine ---------- */
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'], 'abgelaufen': ['statusLuecke', 'st-luecke'],
    'eigene Einordnung': ['esStatusEigen', 'st-eigen'], 'Annahme': ['annahme', 'st-annahme'] };
  function badge(status) {
    var s = STATUS_KEY[status] || STATUS_KEY['prüfen vor Nutzung'];
    return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>';
  }
  function kurz(t) { var s = String(t || ''); var m = /^(.*?)(?:,| \(|:|; )/.exec(s); s = m ? m[1] : s; return s.length > 60 ? s.slice(0, 58) + '…' : s; }
  function quelleHtml(b) {
    if (!b) return '';
    if (b.status === 'Lücke') return '<span class="ab-quelle" data-quelle="' + esc(b.id || '') + '" data-status="Lücke">' + badge('Lücke') + '</span>';   /* Lücke = nichts gefunden: keine Quelle zum Verlinken */
    var name = esc(kurz(b.quelle || ''));
    var link = b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + name + '</a>' : name;
    return '<span class="ab-quelle" data-quelle="' + esc(b.id || '') + '" data-abruf="' + esc(b.abruf || '') + '" data-status="' + esc(b.status || '') + '">' + link +
      (b.abruf ? ' · ' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) : '') + ' ' + badge(b.status || 'prüfen vor Nutzung') + '</span>';
  }
  function annahmeSchild() { return '<span class="annahme es-an">' + esc(tr('annahme')) + '</span>'; }
  function annahmeZeile(textKey, par) { return annahmeSchild() + ' ' + esc(tr(textKey, par)); }
  function luecke(textKey) { return '<span class="ab-luecke" data-luecke="1">' + esc(tr(textKey || 'abLuecke')) + '</span>'; }
  function belegListe(liste) {
    var seen = {}, h = '';
    (liste || []).forEach(function (b) { if (!b || seen[b.id]) return; seen[b.id] = 1; h += '<li><b>' + esc(kurz(b.name || b.id)) + '</b><br>' + quelleHtml(b) + (b.hinweis ? '<br><span class="klein">' + esc(b.hinweis) + '</span>' : '') + '</li>'; });
    return h ? '<ul class="ab-liste hu-belege">' + h + '</ul>' : '';
  }
  function begriffKurz(name) {
    var l = D.begriffe || [];
    for (var i = 0; i < l.length; i++) if (l[i].t === name || l[i].t.indexOf(name) === 0) return '<small class="kurz">' + esc(l[i].kurz) + '</small>';
    return '';
  }
  function hatRaeume(plan) { return !!(plan && plan.etagen && plan.etagen.some(function (e) { return (e.raeume || []).length; })); }
  function mitFokus(wurzel, fn) {
    var af = document.activeElement, fk = af && wurzel.contains(af) ? af.getAttribute('data-fk') : null, offen = {};
    wurzel.querySelectorAll('details[data-g][open]').forEach(function (d) { offen[d.getAttribute('data-g')] = 1; });
    fn();
    wurzel.querySelectorAll('details[data-g]').forEach(function (d) { if (offen[d.getAttribute('data-g')]) d.open = true; });
    if (fk) { var n = wurzel.querySelector('[data-fk="' + fk + '"]'); if (n) n.focus({ preventScroll: true }); }
  }

  /* ---------- Rechenstand ---------- */
  var ctx = null;
  function strompreis() {
    var st = window.GRUNDRISS_ENERGIE && window.GRUNDRISS_ENERGIE.zustand ? window.GRUNDRISS_ENERGIE.zustand() : null, sp = HK.strompreisCt();
    if (st && st.strompreis > 0) return { ct: st.strompreis, beleg: null, eigen: true };
    return { ct: sp.ct, beleg: sp.beleg, eigen: false };
  }
  function rechne() {
    var plan = G.plan(), c = { plan: plan, leer: !hatRaeume(plan) };
    if (c.leer) { ctx = c; return c; }
    c.ps = HK.planStandard(plan); c.pl = HK.planLueftung(plan); c.pw = HK.planWasser(plan); c.ep = HK.energiepreise(plan);
    c.bilanz = AK.hausBilanz(plan);
    if (!c.bilanz.ok) { c.fehler = c.bilanz.fehler; ctx = c; return c; }
    c.hw = HK.heizwaermeMitStandard(plan, { bilanz: c.bilanz, standard: c.ps.id, lueftungsart: c.pl.art });
    ctx = c;
    return c;
  }
  function leerHtml() {
    return '<div class="ab-meldung" role="status">' + esc(tr('abLeer')) + '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="grundriss" data-anker="g-start">' + esc(tr('abVorlage')) + '</button></div></div>';
  }
  function fehlerHtml(code) { return '<p class="ab-meldung fehler" role="alert" data-fehler="' + esc(code) + '">' + esc(code === 'keineRaeume' ? tr('abKeineWohn') : tr('abFehler', { grund: code })) + '</p>'; }
  /* Grund einer nicht berechenbaren Rechnung: eigener Text der Karte, sonst der gemeinsame (hdG_) */
  function gtr(prefix, grund) { return window.TEXTE && window.TEXTE[prefix + grund] ? tr(prefix + grund) : tr('hdG_' + grund); }
  function grundText(code) { return tr('maG_' + String(code).replace(/^(wand|fenster)_/, '')); }

  /* ====================================================================== Heizwärme-Balken (ein Baustein für alle Karten) */
  /* pfx: 'ma' (Material-Karte), 'hu' (Dämm-Karte), 'lu' (Lüftungs-Karte). Die Ids tragen den Präfix, damit sie nicht doppelt vorkommen. */
  function balkenHtml(cc, pfx) {
    var plan = cc.plan, bil = cc.bilanz;
    if (!plan || !bil || !bil.ok) return null;
    var ps = HK.planStandard(plan), pl = HK.planLueftung(plan);
    var hw = HK.heizwaermeMitStandard(plan, { bilanz: bil, standard: ps.id, lueftungsart: pl.art });
    if (!hw.ok || !hw.gesamt) return null;
    var g = hw.gesamt, t = hw.transmission, v = hw.lueftung;
    var max = Math.max(200, g.kwhM2Hi * 1.1);
    var pt = 100 * t.kwhM2 / max, pv = 100 * v.kwhM2 / max;
    var span = '<span class="ma-spanne" style="left:' + (100 * g.kwhM2Lo / max).toFixed(2) + '%;width:' + Math.max(0.6, 100 * (g.kwhM2Hi - g.kwhM2Lo) / max).toFixed(2) + '%"></span>';
    var h = '<div class="ma-reihe hu-ihr" data-heiz="ihr"><span class="ma-name">' + esc(tr('maIhrHaus')) + '</span><span class="ma-spur" aria-hidden="true"><span class="ma-fuell" style="width:' + pt.toFixed(2) + '%"></span>' +
      '<span class="ma-fuell hu-v" style="left:' + pt.toFixed(2) + '%;width:' + Math.max(0.5, pv).toFixed(2) + '%"></span>' + span + '</span>' +
      '<span class="ma-wert es-zahl" id="' + pfx + '-heiz-gesamt" data-gesamt-m2="' + g.kwhM2 + '" data-lo="' + g.kwhM2Lo + '" data-hi="' + g.kwhM2Hi + '">' + n0(g.kwhM2) + '</span></div>';
    h += '<p class="es-legende hu-legende"><span><i class="sw c1"></i>' + esc(tr('hbTrans')) + ' <b class="es-zahl" id="' + pfx + '-heiz-wert" data-kwh-m2="' + t.kwhM2 + '" data-lo="' + t.kwhM2Lo + '" data-hi="' + t.kwhM2Hi + '">' + n0(t.kwhM2) + '</b></span>' +
      '<span><i class="sw c2"></i>' + esc(tr('hbLueft')) + ' <b class="es-zahl" id="' + pfx + '-lueft-wert" data-kwh-m2="' + v.kwhM2 + '">' + n0(v.kwhM2) + '</b></span></p>';
    h += '<p class="klein" data-heiz-satz="1">' + esc(tr('hbSatz', { kwh: n0(g.kwhM2), lo: n0(g.kwhM2Lo), hi: n0(g.kwhM2Hi), t: n0(t.kwhM2), v: n0(v.kwhM2), q: n0(g.kwh), wfl: n1(hw.wohnflaeche), std: tr('hdStd_' + ps.id) })) + '</p>';
    var gt = hw.gradtage;
    h += '<p class="klein hu-grad">' + esc(tr('hbGrad', { wert: n0(gt.wert), station: gt.station })) + ' ' + (gt.annahme ? annahmeSchild() : esc(tr('regAbruf', { datum: datumDe(gt.abruf) })) + ' ' + badge(gt.status)) + begriffKurz('Gradtagzahl') + '</p>';
    return { html: h, max: max, hw: hw };
  }

  /* ====================================================================== 1. Karte „Wie gut gedämmt?“ */
  var STD_ICON = { bestand: 'i-huelle1', gmodg: 'i-huelle2', kfw: 'i-huelle3', passivhaus: 'i-huelle4' };
  var STD_FACH = { bestand: 'hdFach_bestand', gmodg: 'hdFach_gmodg', kfw: 'hdFach_kfw', passivhaus: 'hdFach_passivhaus' };
  function schaltHtml(chips, name, wert) {
    return '<div class="es-chips" role="group" aria-label="' + esc(name) + '">' + chips.map(function (x) {
      return '<button type="button" class="chip mit-symbol" data-hu="' + x[0] + '" data-wert="' + x[1] + '" data-fk="' + x[0] + '-' + x[1] + '" aria-pressed="' + (String(wert) === String(x[1])) + '">' + (x[3] ? symbol(x[3]) : '') + esc(x[2]) + '</button>';
    }).join('') + '</div>';
  }
  function neubauSchalter(c) {
    var pl = c.pl;
    return '<div class="hu-neubau"><b>' + esc(tr('hdNeubauFrage')) + '</b>' + schaltHtml([['neubau', 'ja', tr('hdNeubau'), 'i-haus'], ['neubau', 'nein', tr('hdBestandHaus'), 'i-schicht']], tr('hdNeubauFrage'), pl.neubau ? 'ja' : 'nein') +
      (pl.neubauExplizit ? '' : '<p class="klein">' + annahmeZeile(pl.neubau ? 'hdNeubauAnnahmeVorlage' : 'hdNeubauAnnahmeEigen') + '</p>') + '</div>';
  }
  function daemmSteuerHtml(c) {
    if (c.leer) return leerHtml();
    if (c.fehler) return fehlerHtml(c.fehler);
    var ps = c.ps, S = HK.daemmstandards(), h = '';
    h += '<div class="g-kopfzeile"><h4 class="es-h5">' + symbol('i-schicht') + esc(tr('hdWahl')) + '</h4><button type="button" class="hilfe-knopf" data-hu="hilfe" data-ziel-id="g-daemmung-hilfe" aria-expanded="false" aria-controls="g-daemmung-hilfe" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>';
    h += '<p class="klein" id="g-daemmung-hilfe" hidden>' + esc(tr('hdHilfe')) + '</p>';
    h += neubauSchalter(c);
    h += '<div class="ab-stufen hu-stds" role="group" aria-label="' + esc(tr('hdWahl')) + '">' + HK.STANDARDS.map(function (id) {
      return '<button type="button" class="es-var hu-std" data-hu="std" data-wert="' + id + '" data-fk="std-' + id + '" aria-pressed="' + (ps.id === id) + '"><span class="es-var-kopf">' + symbol(STD_ICON[id]) + '<b>' + esc(tr('hdStd_' + id)) + '</b></span>' +
        '<span class="klein">' + esc(tr(STD_FACH[id])) + '</span></button>';
    }).join('') + '</div>';
    if (ps.id === 'kfw') {
      h += '<div class="hu-kfw"><b>' + esc(tr('hdKfwStufe')) + '</b>' + schaltHtml(HK.KFW_STUFEN.map(function (s) { return ['kfwstufe', s, 'EH ' + s.slice(2)]; }), tr('hdKfwStufe'), ps.kfwStufe) + '</div>';
    }
    if (ps.meldung) h += '<p class="ab-meldung fehler" role="alert" data-meldung="standard">' + esc(tr('hdUnbekannt', { id: ps.meldung.id })) + '</p>';
    return h;
  }
  function eigenWertText(plan) { var m = HK.planStandard(plan).mehrkostenEigen; return m == null ? '' : n0(m); }
  function preisSteuerHtml(c) {
    if (c.leer || c.fehler) return '';
    var ep = c.ep, gasE = D.energiepreise.eintraege, h = '';
    function eintrag(id) { for (var i = 0; i < gasE.length; i++) if (gasE[i].id === id) return gasE[i]; return null; }
    var eg = eintrag('gas_destatis_alle'), eo = eintrag('oel_tecson');
    h += '<h4 class="es-h5">' + symbol('i-rechner') + esc(tr('hpTitel')) + '</h4>';
    h += '<p class="klein">' + esc(tr('hpKurz')) + '</p>';
    h += '<div class="es-chips" role="group" aria-label="' + esc(tr('hpTraeger')) + '">' + [['gas', tr('hpGas'), 'i-flamme'], ['oel', tr('hpOel'), 'i-tropfen']].map(function (x) {
      return '<button type="button" class="chip mit-symbol" data-hu="traeger" data-wert="' + x[0] + '" data-fk="traeger-' + x[0] + '" aria-pressed="' + (ep.traeger === x[0]) + '">' + symbol(x[2]) + esc(x[1]) + '</button>';
    }).join('') + '</div>';
    h += '<div class="hu-preise">' +
      '<div class="es-feld"><label class="es-label" for="hu-gaspreis">' + esc(tr('hpGasLabel')) + '</label><input type="text" inputmode="decimal" id="hu-gaspreis" data-hu="gas" data-fk="gaspreis" autocomplete="off" value="' + esc(n2(ep.gasCt)) + '">' +
      '<span class="klein hu-stand" data-stand="gas">' + esc(ep.gasEigen ? tr('hpEigen') : tr('hpStand', { datum: datumDe(eg.abruf) })) + ' ' + quelleHtml(ep.belegGas) + '</span><span class="fehler" id="hu-gaspreis-fehler" role="alert" hidden></span></div>' +
      '<div class="es-feld"><label class="es-label" for="hu-oelpreis">' + esc(tr('hpOelLabel')) + '</label><input type="text" inputmode="decimal" id="hu-oelpreis" data-hu="oel" data-fk="oelpreis" autocomplete="off" value="' + esc(n0(ep.oelEur100)) + '">' +
      '<span class="klein hu-stand" data-stand="oel">' + esc(ep.oelEigen ? tr('hpEigen') : tr('hpStand', { datum: datumDe(eo.abruf) })) + ' ' + quelleHtml(ep.belegOel) + '</span><span class="fehler" id="hu-oelpreis-fehler" role="alert" hidden></span></div></div>';
    h += '<p class="klein">' + esc(tr('hpSchwankt')) + '</p>';
    h += '<div class="es-feld hu-eigen"><label class="es-label" for="hu-mehrkosten">' + esc(tr('hdMehrkostenEigen')) + '</label><input type="text" inputmode="decimal" id="hu-mehrkosten" data-hu="mehrkosten" data-fk="mehrkosten" autocomplete="off" placeholder="' + esc(tr('hdMehrkostenPlatz')) + '" value="' + esc(eigenWertText(c.plan)) + '">' +
      '<span class="klein">' + esc(tr('hdMehrkostenHinweis')) + '</span><span class="fehler" id="hu-mehrkosten-fehler" role="alert" hidden></span></div>';
    return h;
  }
  function uZeileHtml(bt, ist, z, istAnnahme) {
    var ok = z ? ist <= z.wert + 1e-9 : null;
    var zielZelle = !z ? '<span class="klein">' + esc(tr('hdNichts')) + '</span>' : '<b class="es-zahl" data-ziel-u="' + z.wert + '">' + n2(z.wert) + '</b> ' + (z.annahme ? annahmeSchild() : quelleHtml(z.beleg));
    var mark = ok === null ? '' : (ok ? '<span class="fm-ampel gruen" data-ampel="gruen"><i aria-hidden="true">✓</i>' + esc(tr('hdErreicht')) + '</span>' : '<span class="fm-ampel gelb" data-ampel="gelb"><i aria-hidden="true">!</i>' + esc(tr('hdDarueber')) + '</span>');
    return '<div class="hu-zeile" data-bt="' + bt + '"><div><b>' + esc(tr('hdBt_' + bt)) + '</b></div><div><span class="hu-l">' + esc(tr('hdIst')) + '</span><span class="es-zahl" data-ist-u="' + ist + '">' + n2(ist) + '</span>' + (istAnnahme ? ' ' + annahmeSchild() : '') + '</div>' +
      '<div><span class="hu-l">' + esc(tr('hdZiel')) + '</span>' + zielZelle + '</div><div>' + (mark ? '<span class="hu-l">' + esc(tr('hdKopfErgebnis')) + '</span>' : '') + mark + '</div></div>';
  }
  function mehrkostenHtml(mf, c) {
    var mk = mf.mehrkosten;
    if (mk.art === 'keine') return '<span class="ab-leer">' + esc(tr('hdNichts')) + '</span>';
    if (mk.art === 'erreicht') return '<b class="es-zahl" data-mehrkosten="0">' + eur(0) + '</b><br><span class="klein">' + esc(tr('hdSchonErreicht')) + '</span>';
    if (mk.art === 'luecke') {
      var gr = mf.standard === 'kfw' ? tr('hdMkLueckeKfw') : tr('hdMkLueckeTeile', { teile: mk.luecken.map(function (x) { return tr('hdBt_' + x); }).join(', ') });
      return luecke('hdKeineAngabe') + '<br><span class="klein">' + esc(gr) + '</span>' + (mk.beleg ? '<br>' + quelleHtml(mk.beleg) : '');
    }
    var h = '<b class="es-zahl" data-mehrkosten-von="' + mk.von + '" data-mehrkosten-bis="' + mk.bis + '">' + spanneEur(r100(mk.von), r100(mk.bis)) + '</b>';
    if (mk.art === 'eigen') return h + '<br><span class="klein">' + esc(tr('hdMkEigen')) + '</span>';
    mk.teile.forEach(function (t) {
      h += '<br><span class="klein">' + esc(tr('hdMkTeil_' + t.bauteil, { menge: n1(t.menge), von: n0(t.preis.von), bis: n0(t.preis.bis) })) + '</span> ' + quelleHtml(t.beleg);
    });
    if (mk.luecken.length) h += '<br><span class="klein">' + annahmeSchild() + ' ' + esc(tr('hdMkOhne', { teile: mk.luecken.map(function (x) { return tr('hdBt_' + x); }).join(', ') })) + '</span>';
    return h;
  }
  function foerderungHtml(mf) {
    var fo = mf.foerderung;
    var pruef = '<br><span class="klein">' + esc(tr('hdFoerdPruefen')) + '</span>';
    switch (fo.art) {
      case 'beg': return '<b class="es-zahl" data-foerd-von="' + fo.von + '" data-foerd-bis="' + fo.bis + '">' + spanneEur(r100(fo.von), r100(fo.bis)) + '</b><br><span class="klein">' + esc(tr('hdFoerdBeg')) + '</span>' + pruef;
      case 'beg_offen': return '<span class="klein">' + esc(tr('hdFoerdBegOffen')) + '</span>' + pruef;
      case 'kfw261': return '<b class="es-zahl" data-foerd-von="' + fo.von + '" data-foerd-bis="' + fo.bis + '">' + spanneEur(fo.von, fo.bis) + '</b><br><span class="klein">' + esc(tr('hdFoerdKfw', { stufe: 'EH ' + String(fo.stufe).slice(2) })) + '</span>' + pruef;
      case 'kfw297': {
        var k = fo.belege[0], kd = D.daemmung_seite.kfw.filter(function (z) { return z.id === 'kfw297'; })[0];
        return luecke('hdFoerdKeinZuschuss') + '<br><span class="klein">' + esc(tr('hdFoerdKfw297', { a: n0(kd.eh55_eh40), b: n0(kd.eh40_qng) })) + '</span>' + pruef;
      }
      case 'neubauKeine': return '<span class="ab-leer">' + esc(tr('hdFoerdNeubau')) + '</span>';
    }
    return '<span class="ab-leer">' + esc(tr('hdNichts')) + '</span>';
  }
  function amortHtml(da) {
    if (da.ok) {
      var a = da.amort;
      if (a.von === 0 && a.bis === 0) return '<b class="es-zahl" data-amort-von="0" data-amort-bis="0">' + esc(tr('hdAmortSofort')) + '</b>';
      return '<b class="es-zahl" data-amort-von="' + a.von + '" data-amort-bis="' + a.bis + '">' + esc(tr('hdAmortJahre', { von: n0(a.von), bis: n0(a.bis) })) + '</b><br><span class="klein">' + annahmeZeile('hdAmortAnnahmen', { eta: n2(da.ep.wirkungsgrad), preis: n1(da.ep.ct) }) + '</span>';
    }
    var h = '<span class="ab-luecke" data-amort-nicht="' + esc(da.grund) + '">' + esc(tr('hdNichtBerechenbar')) + '</span><br><span class="klein">' + esc(tr('hdG_' + da.grund)) + '</span>';
    if (da.grund === 'ersparnisUnsicher' && da.amort && da.amort.von != null) h += '<br><span class="klein es-zahl" data-amort-ab="' + da.amort.von + '">' + esc(tr('hdAmortAb', { von: n0(da.amort.von) })) + '</span>';
    return h;
  }
  function daemmErgebnisHtml(c) {
    if (c.leer || c.fehler) return '';
    var ps = c.ps, hw = c.hw, h = '';
    var b = balkenHtml(c, 'hu');
    h += '<div id="hu-balken">';
    h += '<h4 class="es-h5">' + symbol('i-thermo') + esc(tr('maHeizTitel')) + '</h4>';
    if (b) {
      h += b.html;
      var S = HK.daemmstandards(), refs = '';
      var ist = S.bestand.heizRef, ph = S.passivhaus.heizRef;
      h += '<div class="es-legende"><span><b>' + esc(tr('maRefTitel')) + '</b></span></div>';
      if (ist) h += heizRef(tr('hdRef_bestand'), ist.wert, b.max, ist.beleg);
      if (ph) h += heizRef(tr('hdRef_passivhaus'), ph.wert, b.max, ph.beleg);
      if (ps.id === 'gmodg') h += '<p class="klein">' + esc(tr('hdRefGmodgKeine')) + '</p>';
      h += '<p class="klein">' + annahmeZeile('maRefHinweis') + '</p>';
    } else {
      var code = hw && hw.grund ? hw.grund : 'x';
      h += '<div class="ab-meldung" role="status" data-heiz="keine"><b>' + esc(tr('maKeineAngabe')) + '.</b> ' + esc(grundText(code)) + '</div>';
    }
    h += '</div>';
    return h;
  }
  function heizRef(name, wert, max, beleg) {
    return '<div class="ma-reihe"><span class="ma-name">' + esc(name) + '</span><span class="ma-spur" aria-hidden="true"><span class="ma-fuell ref" style="width:' + Math.max(0.5, Math.min(100, 100 * wert / max)).toFixed(2) + '%"></span></span><span class="ma-wert">' + n0(wert) + '</span></div>' +
      '<p class="klein hu-refq">' + quelleHtml(beleg) + '</p>';
  }
  function daemmRestHtml(c) {
    if (c.leer || c.fehler) return '';
    var ps = c.ps, hw = c.hw, ep = c.ep, h = '', S = HK.daemmstandards(), sd = S[ps.id];
    /* Heizkosten */
    if (hw.gesamt) {
      var kosten = HK.heizkosten(hw.gesamt.kwh, ep), lo = HK.heizkosten(hw.gesamt.kwhLo, ep), hi = HK.heizkosten(hw.gesamt.kwhHi, ep);
      h += '<div class="es-satz klein-satz hu-heizkosten" data-heizkosten="1" aria-live="polite"><span class="es-zahl" data-kosten="' + kosten.toFixed(2) + '">' + esc(tr('hpSatz', { traeger: tr(ep.traeger === 'oel' ? 'hpOel' : 'hpGas'), von: n0(Math.round(lo / 10) * 10), bis: n0(Math.round(hi / 10) * 10), eur: n0(Math.round(kosten / 10) * 10) })) + '</span></div>';
      h += '<p class="klein">' + annahmeZeile('hpAnnahmen', { eta: n2(ep.wirkungsgrad), ct: n1(ep.ct) }) + '</p>';
      if (ep.traeger === 'oel') {
        h += '<p class="klein hu-oelrechnung" data-oel-ct="' + ep.oelCt.toFixed(4) + '">' + annahmeZeile('hpOelRechnung', { eur: n0(ep.oelEur100), kwh: n2(ep.oelKwhProL), ct: n2(ep.oelCt), bw: n2(ep.oelCtBrennwert) }) + ' ' + quelleHtml(ep.belegOelKwh) + '</p>';
      }
    }
    if (!hw.transmission) return h;
    /* U-Werte */
    h += '<h4 class="es-h5">' + symbol('i-wand') + esc(tr('hdUTitel')) + '</h4>' + begriffKurz('U-Wert');
    if (ps.id === 'kfw') h += '<p class="ab-meldung" role="status" data-kfw-ohne-u="1">' + esc(tr('hdKfwOhneU')) + '</p>';
    else {
      var z = sd.u, ist = hw.uIst;
      h += '<div class="hu-utab"><div class="hu-kopf" aria-hidden="false"><div>' + esc(tr('hdKopfBauteil')) + '</div><div>' + esc(tr('hdIst')) + '</div><div>' + esc(tr('hdZiel')) + '</div><div>' + esc(tr('hdKopfErgebnis')) + '</div></div>' + uZeileHtml('wand', ist.wand, z && z.wand, false) + uZeileHtml('dach', ist.dach, z && z.dach, true) + uZeileHtml('fenster', ist.fenster, z && z.glas, false) + uZeileHtml('boden', ist.boden, z && z.boden, true) + '</div>';
      if (ps.id === 'gmodg') h += '<p class="klein">' + esc(tr('hdGmodgHinweis')) + '</p>';
      if (ps.id === 'passivhaus') h += '<p class="klein">' + annahmeZeile('hdPhAnnahme') + '</p>';
      if (ps.id === 'bestand') h += '<p class="klein">' + esc(tr('hdBestandHinweis')) + '</p>';
      if (hw.ueberZiel && hw.ueberZiel.length) {
        h += '<p class="hu-ueber" data-ueber="' + hw.ueberZiel.map(function (u) { return u.bauteil; }).join(',') + '"><b>' + esc(tr('hdUeberTitel')) + '</b> ' + hw.ueberZiel.map(function (u) { return esc(tr('hdBt_' + u.bauteil)) + ' (' + n2(u.ist) + ' &gt; ' + n2(u.ziel) + ')'; }).join(', ') +
          ' <button type="button" class="knopf zweit mittel" data-ziel="grundriss" data-anker="g-material-karte">' + esc(tr('hdZurMaterial')) + '</button></p>';
      }
    }
    /* Mehrkosten, Förderung, Amortisation */
    var mf = HK.mehrkostenUndFoerderung(c.plan, ps.id, { heizwaerme: hw }), da = HK.daemmAmortisation(c.plan, ps.id, { heizwaerme: hw, mehrkosten: mf, energiepreise: ep });
    c.mf = mf; c.da = da;
    h += '<div class="hu-drei" role="group" aria-label="' + esc(tr('hdDreiTitel')) + '">' +
      '<div class="hu-d" data-zeile="mehrkosten"><span class="hu-dl">' + symbol('i-rechner') + esc(tr('hdMehrkosten')) + '</span><div>' + mehrkostenHtml(mf, c) + '</div></div>' +
      '<div class="hu-d" data-zeile="foerderung"><span class="hu-dl">' + symbol('i-stern') + esc(tr('hdFoerderung')) + '</span><div>' + foerderungHtml(mf) + '</div></div>' +
      '<div class="hu-d" data-zeile="amortisation"><span class="hu-dl">' + symbol('i-uhr') + esc(tr('hdAmort')) + '</span><div>' + amortHtml(da) + '</div></div></div>';
    if (da.ersparnisKwh && ps.id !== 'bestand' && ps.id !== 'kfw') h += '<p class="klein">' + esc(tr('hdErsparnisSatz', { von: n0(da.ersparnisKwh.von), bis: n0(da.ersparnisKwh.bis) })) + '</p>';
    /* Belege und Annahmen */
    var bel = [];
    if (sd && sd.u) ['wand', 'dach', 'glas', 'boden'].forEach(function (k) { if (sd.u[k] && sd.u[k].beleg) bel.push(sd.u[k].beleg); });
    if (sd && sd.heizRef) bel.push(sd.heizRef.beleg);
    if (ps.id === 'kfw') { bel.push(S.kfw.stufen[ps.kfwStufe].beleg, S.kfw.boni, S.kfw.stand, S.kfw.kredit297, S.kfw.mehrkosten); }
    mf.foerderung.belege.forEach(function (b) { bel.push(b); });
    if (mf.mehrkosten.teile) mf.mehrkosten.teile.forEach(function (t) { bel.push(t.beleg); });
    h += '<details class="ab-alt" data-g="hu-belege"><summary>' + esc(tr('hdBelegTitel')) + '</summary>' + belegListe(bel) +
      '<ul class="ab-liste"><li>' + annahmeZeile('hdAnn1') + '</li><li>' + annahmeZeile('hdAnn3', { n: n2(HK.ANNAHMEN.luftwechsel), cp: n2(HK.ANNAHMEN.luftwaerme) }) + '</li></ul></details>';
    return h;
  }
  function kopfDaemmung(cc) {
    var el = byId('g-daemmung-kopfzeile');
    if (!el) return;
    if (cc.leer || !cc.hw || !cc.hw.gesamt) { el.textContent = cc.leer ? tr('abKopfLeer') : tr('maKopfKeine'); return; }
    el.textContent = tr('hdKopf', { std: tr('hdStd_' + cc.ps.id), kwh: n0(cc.hw.gesamt.kwhM2) });
  }

  /* ====================================================================== 2. Karte „Frische Luft“ */
  var LU_ICON = { keine: 'i-fenster-offen', dez_abluft: 'i-luefter', dez_wrg: 'i-luefter-wrg', zentral: 'i-zentral' };
  function lueftungSteuerHtml(c) {
    if (c.leer) return leerHtml();
    if (c.fehler) return fehlerHtml(c.fehler);
    var pl = c.pl, h = '';
    h += '<div class="g-kopfzeile"><h4 class="es-h5">' + symbol('i-luft') + esc(tr('hlWahl')) + '</h4><button type="button" class="hilfe-knopf" data-hu="hilfe" aria-expanded="false" aria-controls="g-lueftung-hilfe" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>';
    h += '<p class="klein" id="g-lueftung-hilfe" hidden>' + esc(tr('hlHilfe')) + '</p>';
    h += '<div class="ab-stufen hu-stds" role="group" aria-label="' + esc(tr('hlWahl')) + '">' + HK.LUEFTUNG_ARTEN.map(function (a) {
      return '<button type="button" class="es-var hu-std" data-hu="art" data-wert="' + a + '" data-fk="art-' + a + '" aria-pressed="' + (pl.art === a) + '"><span class="es-var-kopf">' + symbol(LU_ICON[a]) + '<b>' + esc(tr('hlArt_' + a)) + '</b></span><span class="klein">' + esc(tr('hlFach_' + a)) + '</span></button>';
    }).join('') + '</div>';
    h += '<p class="klein hu-neubau-info" data-neubau="' + (pl.neubau ? 'ja' : 'nein') + '">' + esc(tr('hlGilt', { art: tr(pl.neubau ? 'hdNeubau' : 'hdBestandHaus') })) + ' <button type="button" class="knopf zweit mittel" data-ziel="grundriss" data-anker="g-daemmung-karte">' + esc(tr('hlAendern')) + '</button></p>';
    if (pl.meldung) h += '<p class="ab-meldung fehler" role="alert" data-meldung="lueftung">' + esc(tr('hlUnbekannt', { id: pl.meldung.id })) + '</p>';
    return h;
  }
  function lueftungErgebnisHtml(c) {
    if (c.leer || c.fehler) return '';
    var pl = c.pl, art = pl.art, sp = strompreis(), h = '';
    var k = HK.lueftungKosten(c.plan, art, { neubau: pl.neubau, strompreis: sp, mengen: c.bilanz.mengen });
    var la = HK.lueftungAmortisation(c.plan, art, { neubau: pl.neubau, kosten: k, heizwaerme: c.hw, energiepreise: c.ep, strompreis: sp });
    c.lk = k; c.la = la;
    var b = balkenHtml(c, 'lu');
    h += '<p class="es-satz klein-satz" data-lueftung-satz="' + art + '">' + esc(tr('hlSatz_' + art)) + '</p>';
    h += '<h4 class="es-h5">' + symbol('i-thermo') + esc(tr('hlWirkung')) + '</h4>';
    if (b) {
      var v = b.hw.lueftung;
      h += b.html;
      h += '<p class="klein" data-lueft-verlust="1">' + esc(tr('hlVerlust', { v: n0(v.kwhM2), ohne: n0(v.kwhM2Ohne), vol: n0(v.volumen), n: n2(v.n) })) + ' ' + annahmeSchild() + '</p>';
      if (v.wrg) h += '<p class="klein">' + esc(tr('hlWrg', { von: n0(v.wrg.von * 100), bis: n0(v.wrg.bis * 100) })) + ' ' + quelleHtml(v.wrg.beleg) + '</p>';
    } else h += '<div class="ab-meldung" role="status" data-heiz="keine">' + esc(tr('maKeineAngabe')) + '</div>';
    if (art !== 'keine') {
      h += '<div class="hu-drei" role="group" aria-label="' + esc(tr('hlDreiTitel')) + '">';
      /* Kosten einmalig */
      var teile = k.stueck.map(function (s) {
        if (s.art === 'zentral') return esc(tr('hlStueckZentral', { von: n0(s.von), bis: n0(s.bis), wfl: n0(k.wohnflaeche), bezug: n0(HK.ANNAHMEN.bezugFlaecheZentral) }));
        return esc(tr('hlStueck_' + s.art, { n: s.anzahl, preis: n0(s.preis), summe: n0(s.summe) }));
      }).join('<br>');
      h += '<div class="hu-d" data-zeile="einmalig"><span class="hu-dl">' + symbol('i-rechner') + esc(tr('hlEinmalig')) + '</span><div><b class="es-zahl" data-lu-von="' + k.einmalig.von + '" data-lu-bis="' + k.einmalig.bis + '">' + spanneEur(r100(k.einmalig.von), r100(k.einmalig.bis)) + '</b><br><span class="klein">' + teile + '</span><br>' +
        k.belege.map(quelleHtml).join(' ') + (art === 'zentral' ? '<br><span class="klein">' + annahmeZeile('hlZentralAnnahme') + '</span>' : '') + (k.hinweise.indexOf('zentralAltbau') >= 0 ? '<br><span class="klein">' + esc(tr('hlZentralAltbau')) + '</span>' : '') +
        '<br><span class="klein">' + esc(tr(pl.neubau ? 'hlPreisNeubau' : 'hlPreisAltbau')) + '</span></div></div>';
      /* Strom */
      if (k.strom) {
        h += '<div class="hu-d" data-zeile="strom"><span class="hu-dl">' + symbol('i-blitz') + esc(tr('hlStrom')) + '</span><div><b class="es-zahl" data-strom-kwh-von="' + k.strom.kwhVon + '" data-strom-kwh-bis="' + k.strom.kwhBis + '">' + esc(tr('hlStromKwh', { von: n0(k.strom.kwhVon), bis: n0(k.strom.kwhBis) })) + '</b><br>' +
          '<span class="es-zahl" data-strom-eur-von="' + k.strom.eurVon + '" data-strom-eur-bis="' + k.strom.eurBis + '">' + esc(tr('hlStromEur', { von: n0(k.strom.eurVon), bis: n0(k.strom.eurBis), ct: n1(k.strom.ct) })) + '</span><br>' + k.strom.belege.map(quelleHtml).join(' ') +
          '<br><span class="klein">' + esc(sp.eigen ? tr('hlStrompreisEigen') : tr('hlStrompreisStart')) + '</span>' + (k.strom.strompreisBeleg && !sp.eigen ? ' ' + quelleHtml(k.strom.strompreisBeleg) : '') + '<br><span class="klein">' + annahmeZeile('hlStromAnnahme') + '</span></div></div>';
      } else {
        h += '<div class="hu-d" data-zeile="strom"><span class="hu-dl">' + symbol('i-blitz') + esc(tr('hlStrom')) + '</span><div>' + luecke('hdKeineAngabe') + '<br><span class="klein">' + esc(tr('hlStromLuecke')) + '</span></div></div>';
      }
      /* Förderung */
      var fo = k.foerderung, foText;
      if (fo.art === 'beg') foText = '<b class="es-zahl" data-lu-foerd-von="' + fo.von + '" data-lu-foerd-bis="' + fo.bis + '">' + spanneEur(r100(fo.von), r100(fo.bis)) + '</b><br><span class="klein">' + esc(tr('hlFoerdBeg')) + '</span><br><span class="klein">' + esc(tr('hdFoerdPruefen')) + '</span>';
      else foText = '<span class="ab-leer" data-lu-foerd="keine">' + esc(tr('hdFoerdNeubau')) + '</span>';
      h += '<div class="hu-d" data-zeile="foerderung"><span class="hu-dl">' + symbol('i-stern') + esc(tr('hdFoerderung')) + '</span><div>' + foText + '</div></div>';
      /* Amortisation */
      var am;
      if (la.ok) am = '<b class="es-zahl" data-lu-amort-von="' + la.amort.von + '" data-lu-amort-bis="' + la.amort.bis + '">' + esc(tr('hdAmortJahre', { von: n0(la.amort.von), bis: n0(la.amort.bis) })) + '</b><br><span class="klein">' + annahmeZeile('hlAmortAnnahmen', { eta: n2(c.ep.wirkungsgrad), preis: n1(c.ep.ct) }) + '</span>';
      else am = '<span class="ab-luecke" data-lu-amort-nicht="' + esc(la.grund) + '">' + esc(tr('hdNichtBerechenbar')) + '</span><br><span class="klein">' + esc(gtr('hlG_', la.grund)) + '</span>';
      h += '<div class="hu-d" data-zeile="amortisation"><span class="hu-dl">' + symbol('i-uhr') + esc(tr('hdAmort')) + '</span><div>' + am + '</div></div></div>';
      /* Filter, Lücken */
      h += '<p class="klein" data-filter="1"><b>' + esc(tr('hlFilter')) + '</b> ' + esc(tr('hlFilterText', { von: k.filter.monate.von, bis: k.filter.monate.bis, preis: n2(k.filter.beispiel.von) })) + ' ' + quelleHtml(k.filter.beleg) + '<br>' + luecke('hdKeineAngabe') + ' ' + esc(tr('hlFilterLuecke')) + '</p>';
      h += '<details class="ab-alt" data-g="lu-belege"><summary>' + esc(tr('hdBelegTitel')) + '</summary>' + belegListe(k.belege.concat(k.strom ? k.strom.belege : [], fo.belege, [k.filter.beleg, k.filter.beispiel, k.filter.luecke])) + '</details>';
    }
    return h;
  }
  function kopfLueftung(cc) {
    var el = byId('g-lueftung-kopfzeile');
    if (!el) return;
    el.textContent = cc.leer ? tr('abKopfLeer') : tr('hlArt_' + cc.pl.art);
  }

  /* ====================================================================== 3. Karte „Wasser“ */
  function wasserSteuerHtml(c) {
    if (c.leer) return leerHtml();
    if (c.fehler) return fehlerHtml(c.fehler);
    var pw = c.pw, h = '';
    h += '<div class="g-kopfzeile"><h4 class="es-h5">' + symbol('i-tropfen') + esc(tr('hwWahl')) + '</h4><button type="button" class="hilfe-knopf" data-hu="hilfe" aria-expanded="false" aria-controls="g-wasser-hilfe" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>';
    h += '<p class="klein" id="g-wasser-hilfe" hidden>' + esc(tr('hwHilfe')) + '</p>';
    h += '<div class="hu-wasser-reihe"><div class="es-feld"><label class="es-label" for="hw-personen">' + esc(tr('hwPersonen')) + ' <b id="hw-personen-wert">' + pw.personen + '</b></label>' +
      '<input type="range" id="hw-personen" min="1" max="12" step="1" value="' + pw.personen + '" data-hu="personen" data-fk="personen" aria-valuetext="' + esc(tr('hwPersonenText', { n: pw.personen })) + '"></div>';
    h += '<div class="es-feld"><span class="es-label">' + esc(tr('hwRegen')) + '</span>' + schaltHtml([['regen', 'ja', tr('hwRegenJa'), 'i-zisterne'], ['regen', 'nein', tr('hwRegenNein'), 'i-tropfen']], tr('hwRegen'), pw.regenwasser ? 'ja' : 'nein') + '</div></div>';
    h += '<label class="es-haken hu-haken"><input type="checkbox" data-hu="gruendach" data-fk="gruendach"' + (pw.gruendach ? ' checked' : '') + '> ' + esc(tr('hwGruendach')) + '</label>';
    var land = c.plan.land || 'HB', hatPreis = !!HK.wasserpreis(land);
    if (pw.regenwasser && !hatPreis) {
      h += '<div class="es-feld hu-eigen"><label class="es-label" for="hw-preis">' + esc(tr('hwPreisLabel')) + '</label><input type="text" inputmode="decimal" id="hw-preis" data-hu="wasserpreis" data-fk="wasserpreis" autocomplete="off" placeholder="' + esc(tr('hwPreisPlatz')) + '" value="' + (pw.preis ? esc(n2(pw.preis)) : '') + '">' +
        '<span class="klein">' + esc(tr('hwPreisLuecke')) + '</span><span class="fehler" id="hw-preis-fehler" role="alert" hidden></span></div>';
    }
    if (pw.meldung) h += '<p class="ab-meldung fehler" role="alert" data-meldung="wasser">' + esc(tr('hwUnbekannt', { id: pw.meldung.id })) + '</p>';
    return h;
  }
  function enthaertungHtml(c) {
    var pw = c.pw, en = HK.enthaertung(pw.haerte), h = '';
    if (!en.ok) return '';
    h += '<details class="ab-alt" data-g="hw-enth"><summary>' + symbol('i-kalk') + ' ' + esc(tr('hwEnthTitel')) + '</summary>';
    h += '<p class="klein">' + esc(tr('hwEnthFrage')) + '</p>';
    h += schaltHtml(HK.HAERTEN.map(function (x) { return ['haerte', x, tr('hwHaerte_' + x)]; }), tr('hwEnthFrage'), pw.haerte);
    h += '<p class="klein" data-haerte="' + en.bereich + '">' + esc(tr('hwHaerteWerte', { mmol: en.mmol.bis == null ? '> ' + n1(en.mmol.von) : n1(en.mmol.von) + ' ' + tr('wortBis') + ' ' + n1(en.mmol.bis), dh: en.dh.bis == null ? '> ' + n1(en.dh.von) : n1(en.dh.von) + ' ' + tr('wortBis') + ' ' + n1(en.dh.bis) })) + ' ' + quelleHtml(en.beleg) + ' ' + annahmeSchild() + ' <span class="klein">' + esc(tr('hwDhAnnahme')) + '</span></p>';
    h += '<p class="ab-meldung" role="status" data-enth-sinnvoll="' + (en.sinnvoll ? 'ja' : 'nein') + '">' + esc(tr(en.sinnvoll ? 'hwEnthHart' : 'hwEnthWeich')) + ' ' + quelleHtml(en.warentest) + ' ' + quelleHtml(en.verbraucherzentrale) + '</p>';
    h += '<ul class="ab-liste">' +
      '<li>' + esc(tr('hwEnthAnschaffung', { von: n0(en.kosten.anschaffung.von), bis: n0(en.kosten.anschaffung.bis) })) + ' ' + quelleHtml(en.kosten.anschaffung) + '</li>' +
      '<li>' + esc(tr('hwEnthEinbau', { von: n0(en.kosten.einbau.von), bis: n0(en.kosten.einbau.bis) })) + ' ' + quelleHtml(en.kosten.einbau) + '</li>' +
      '<li>' + esc(tr('hwEnthBetrieb')) + ' ' + quelleHtml(en.kosten.betrieb) + '</li>' +
      '<li>' + esc(tr('hwEnthWartung', { von: n0(en.kosten.wartung.von), bis: n0(en.kosten.wartung.bis) })) + ' ' + quelleHtml(en.kosten.wartung) + '</li>' +
      '<li>' + esc(tr('hwEnthSalz')) + ' ' + quelleHtml(en.kosten.salz) + '</li>' +
      '<li>' + luecke('hdKeineAngabe') + ' ' + esc(tr('hwEnthKalkwandler')) + ' ' + quelleHtml(en.kalkwandler) + '</li></ul></details>';
    return h;
  }
  function wasserErgebnisHtml(c) {
    if (c.leer || c.fehler) return '';
    var pw = c.pw, plan = c.plan, land = plan.land || 'HB', h = '';
    var wb = HK.wasserBilanz(plan, pw), dr = wb.dr;   /* Welle E, Teil 2: ein Rechenweg für diese Karte und den Autarkie-Block */
    if (wb.status === 'aus') {
      h += '<p class="es-satz klein-satz" data-wasser-satz="aus">' + esc(tr('hwAus')) + '</p>' + enthaertungHtml(c);
      c.rw = null;
      return h;
    }
    if (wb.status === 'keinDach') { h += '<p class="ab-meldung fehler" role="alert" data-fehler="dach">' + esc(tr('hwKeinDach')) + '</p>'; c.rw = null; return h + enthaertungHtml(c); }
    var rw = wb.rw;
    c.rw = rw; c.dr = dr;
    if (wb.status === 'fehler') { h += '<p class="ab-meldung fehler" role="alert" data-fehler="regen">' + esc(tr('hwFehler', { grund: rw.grund })) + '</p>'; return h + enthaertungHtml(c); }
    var nd = rw.niederschlag;
    if (rw.gruendach) {
      h += '<p class="es-satz klein-satz" data-wasser-satz="gruen">' + esc(tr('hwGruenSatz')) + '</p><p class="klein">' + luecke('hdKeineAngabe') + ' ' + esc(tr('hwGruenLuecke')) + ' ' + quelleHtml(rw.belegGruen) + '</p>';
      return h + enthaertungHtml(c);
    }
    h += '<p class="es-satz" data-wasser-satz="regen" aria-live="polite"><span class="es-zahl" id="hw-ertrag" data-ertrag-von="' + rw.ertrag.von + '" data-ertrag-bis="' + rw.ertrag.bis + '">' + esc(tr('hwSatz', { von: n0(r100(rw.ertrag.von / 10) * 10), bis: n0(r100(rw.ertrag.bis / 10) * 10), pq: bis(Math.round(rw.deckung.von * 100), Math.round(rw.deckung.bis * 100)) })) + '</span></p>';
    h += '<p class="klein" data-nd="' + nd.mm + '">' + esc(tr('hwHerkunft', { fl: n0(rw.dachflaeche), mm: n0(nd.mm), land: nd.land })) + ' ' + quelleHtml(nd.beleg) + (nd.naeherung ? ' <span class="annahme es-an">' + esc(tr('hwNaeherung', { region: nd.region })) + '</span>' : '') + (nd.fallback ? ' ' + annahmeSchild() + ' ' + esc(tr('hwNdFallback')) : '') + '</p>';
    h += '<p class="klein hu-dwd" data-dwd="1">' + esc(nd.attribution) + ' · ' + esc(nd.lizenz) + '</p>';
    h += '<p class="klein">' + esc(tr('hwProjektion', { proj: n0(dr.projektion), geneigt: dr.geneigt == null ? tr('hdKeineAngabe') : n0(dr.geneigt) })) + '</p>';
    if (rw.ueberschuss) h += '<p class="ab-meldung" role="status" data-deckel="1">' + esc(tr('hwDeckel')) + '</p>';
    /* Autarkie-Balken */
    h += '<div class="ma-reihe hu-autark" data-autark="1"><span class="ma-name">' + esc(tr('hwAutark')) + '</span><span class="ma-spur" role="img" aria-label="' + esc(tr('hwAutarkAria', { p: n0(rw.autarkie.mitte * 100) })) + '"><span class="ma-fuell" style="width:' + (100 * rw.autarkie.mitte).toFixed(2) + '%"></span></span><span class="ma-wert es-zahl" id="hw-autark" data-autark-mitte="' + rw.autarkie.mitte + '" data-autark-von="' + rw.autarkie.von + '" data-autark-bis="' + rw.autarkie.bis + '">' + n0(rw.autarkie.mitte * 100) + ' %</span></div>';
    h += '<p class="klein">' + esc(tr('hwAutarkText', { ntw: n0(rw.bedarfNtw), ges: n0(rw.gesamtbedarf), ges1: n0(rw.gesamtbedarf / rw.personen / 365) })) + ' ' + quelleHtml(rw.belegVerbrauch) + ' ' + annahmeSchild() + ' ' + quelleHtml(rw.satzung) + '</p>';
    h += '<div class="hu-drei" role="group" aria-label="' + esc(tr('hwDreiTitel')) + '">';
    h += '<div class="hu-d" data-zeile="speicher"><span class="hu-dl">' + symbol('i-zisterne') + esc(tr('hwSpeicher')) + '</span><div><b class="es-zahl" data-speicher-von="' + rw.speicher.jeNutzer.von + '" data-speicher-bis="' + rw.speicher.jeNutzer.bis + '">' + esc(tr('hwSpeicherL', { von: n0(rw.speicher.jeNutzer.von), bis: n0(rw.speicher.jeNutzer.bis) })) + '</b><br><span class="klein">' + esc(tr('hwSpeicherM2', { von: n0(rw.speicher.jeM2.von), bis: n0(rw.speicher.jeM2.bis) })) + '</span><br>' + quelleHtml(rw.speicher.beleg) + '</div></div>';
    h += '<div class="hu-d" data-zeile="kosten"><span class="hu-dl">' + symbol('i-rechner') + esc(tr('hwKosten')) + '</span><div><b class="es-zahl" data-kosten-von="' + rw.kosten.von + '" data-kosten-bis="' + rw.kosten.bis + '">' + spanneEur(rw.kosten.von, rw.kosten.bis) + '</b><br>' + quelleHtml(rw.kosten.beleg) + '<br><span class="klein">' + luecke('hdKeineAngabe') + ' ' + esc(tr('hwPumpeLuecke')) + '</span></div></div>';
    if (rw.ersparnis) {
      h += '<div class="hu-d" data-zeile="ersparnis"><span class="hu-dl">' + symbol('i-spar') + esc(tr('hwErsparnis')) + '</span><div><b class="es-zahl" data-ersparnis-von="' + rw.ersparnis.von + '" data-ersparnis-bis="' + rw.ersparnis.bis + '">' + esc(tr('hwErsparnisEur', { von: n0(rw.ersparnis.von), bis: n0(rw.ersparnis.bis) })) + '</b><br><span class="klein">' + esc(tr('hwErsparnisRechnung', { m3: n0(rw.ersparnis.m3Von), pv: n2(rw.preis.von), pb: n2(rw.preis.bis) })) + '</span><br>' +
        (rw.preis.quelle === 'daten' ? quelleHtml(rw.preis.beleg) : '<span class="klein">' + annahmeZeile('hwPreisEigen') + '</span>') + '</div></div>';
    } else {
      h += '<div class="hu-d" data-zeile="ersparnis"><span class="hu-dl">' + symbol('i-spar') + esc(tr('hwErsparnis')) + '</span><div>' + luecke('hdKeineAngabe') + '<br><span class="klein">' + esc(tr('hwPreisFehlt')) + '</span> ' + quelleHtml(rw.preisLuecke) + '</div></div>';
    }
    var g = rw.gebuehr, gtxt;
    if (g.art === 'bremen') gtxt = '<b class="es-zahl" data-gebuehr-von="' + g.von + '" data-gebuehr-bis="' + g.bis + '">' + spanneEur(g.von, g.bis) + '</b><br><span class="klein">' + esc(tr('hwGebBremen', { satz: n2(g.satz), a: n0(g.abzugVon), b: n0(g.abzugBis) })) + '</span><br>' + quelleHtml(g.beleg) + '<br>' + quelleHtml(g.belegZisterne);
    else if (g.art === 'berlin') gtxt = (g.speicherOk ? '<b class="es-zahl" data-gebuehr-von="' + g.von + '" data-gebuehr-bis="' + g.bis + '">' + eur(g.von) + '</b><br>' : '') + '<span class="klein">' + esc(tr(g.speicherOk ? 'hwGebBerlin' : 'hwGebBerlinKlein', { p: n0(g.prozent) })) + '</span><br>' + quelleHtml(g.beleg);
    else gtxt = luecke('hdKeineAngabe') + '<br><span class="klein">' + esc(tr('hwGebSatzung')) + '</span> ' + quelleHtml(g.beleg);
    h += '<div class="hu-d" data-zeile="gebuehr"><span class="hu-dl">' + symbol('i-haus') + esc(tr('hwGebuehr')) + '</span><div>' + gtxt + '</div></div>';
    var am = rw.amort, amt;
    if (am.ok) amt = '<b class="es-zahl" data-w-amort-von="' + am.von + '" data-w-amort-bis="' + am.bis + '">' + esc(tr('hdAmortJahre', { von: n0(am.von), bis: n0(am.bis) })) + '</b><br><span class="klein">' + annahmeZeile('hwAmortAnnahmen') + '</span>';
    else amt = '<span class="ab-luecke" data-w-amort-nicht="' + esc(am.grund) + '">' + esc(tr('hdNichtBerechenbar')) + '</span><br><span class="klein">' + esc(gtr('hwG_', am.grund)) + '</span>' + (am.von != null ? '<br><span class="klein es-zahl" data-w-amort-ab="' + am.von + '">' + esc(tr('hdAmortAb', { von: n0(am.von) })) + '</span>' : '');
    h += '<div class="hu-d" data-zeile="amortisation"><span class="hu-dl">' + symbol('i-uhr') + esc(tr('hdAmort')) + '</span><div>' + amt + '</div></div></div>';
    h += '<p class="klein" data-tw-anzeige="1">' + esc(tr('hwAnzeige')) + ' ' + quelleHtml(HK.enthaertung('mittel').anzeige) + '</p>';
    h += '<p class="klein">' + annahmeZeile('hwGarten') + '</p>';
    h += '<details class="ab-alt" data-g="hw-belege"><summary>' + esc(tr('hdBelegTitel')) + '</summary>' + belegListe([nd.beleg, rw.formel, rw.beiwert.beleg, rw.beiwert.satzung, rw.filter.beleg, rw.filter.luecke, rw.belegVerbrauch, rw.satzung, rw.speicher.beleg, rw.kosten.beleg, rw.kosten.pumpe, rw.preis ? rw.preis.beleg : null, g.beleg, g.belegZisterne]) +
      '<ul class="ab-liste"><li>' + annahmeZeile('hwAnn1', { von: n2(HK.ANNAHMEN.beiwertVon), bis: n2(HK.ANNAHMEN.beiwertBis), f: n2(HK.ANNAHMEN.filter) }) + '</li><li>' + annahmeZeile('hwAnn2') + '</li><li>' + annahmeZeile('hwAnn3') + '</li></ul></details>';
    return h + enthaertungHtml(c);
  }
  function kopfWasser(cc) {
    var el = byId('g-wasser-kopfzeile');
    if (!el) return;
    if (cc.leer) { el.textContent = tr('abKopfLeer'); return; }
    if (!cc.rw || !cc.rw.ok || !cc.rw.deckung) { el.textContent = tr('hwKopfOhne'); return; }
    el.textContent = tr('hwKopf', { p: n0(Math.round(cc.rw.deckung.bis * 100)) });
  }

  /* ====================================================================== Zusammenspiel */
  var timer = null, teilweise = false;
  function jetzt(nurErgebnis) {
    clearTimeout(timer);
    var c;
    try { c = rechne(); } catch (e) {
      var g = 'Dämmung, Lüftung und Wasser konnten nicht gerechnet werden: ' + (e && e.message ? e.message : e);
      FEHLER_IDS.forEach(function (id) { meldeFehler(id, g); }); return;
    }
    FEHLER_IDS.forEach(function (id) { meldeFehler(id, ''); });
    try {
      var d1 = byId('g-daemmung-details'), d2 = byId('g-lueftung-details'), d3 = byId('g-wasser-details');
      var ersatz = function (id, fn) { var w = byId(id); if (!w) return; if (nurErgebnis && id === 'hu-w-steuer') return; var neu = fn(c); mitFokus(w, function () { w.innerHTML = neu; }); };
      /* Beim Ziehen des Personen-Reglers bleibt sein Steuerteil stehen (sonst bricht das Ziehen ab), nur die Ergebnisse werden neu gebaut */
      if (d1 && d1.open) { ersatz('hu-d-steuer', daemmSteuerHtml); ersatz('hu-d-balken', daemmErgebnisHtml); ersatz('hu-d-preise', preisSteuerHtml); ersatz('hu-d-rest', daemmRestHtml); }
      if (d2 && d2.open) { ersatz('hu-l-steuer', lueftungSteuerHtml); ersatz('hu-l-ergebnis', lueftungErgebnisHtml); }
      if (d3 && d3.open) { ersatz('hu-w-steuer', wasserSteuerHtml); ersatz('hu-w-ergebnis', wasserErgebnisHtml); }
      else if (c && !c.leer && !c.fehler) { try { var dr = HK.dachflaecheRegen(c.plan); c.rw = dr.ok && c.pw.regenwasser && !c.pw.gruendach ? HK.regenwasser(dr.projektion, c.plan.land || 'HB', c.pw.personen, { preisEurM3: c.pw.preis }) : null; } catch (e3) { c.rw = null; } }
      kopfDaemmung(c); kopfLueftung(c); kopfWasser(c);
    } catch (e2) {
      var t = 'Die Anzeige von Dämmung, Lüftung und Wasser ist ausgefallen: ' + (e2 && e2.message ? e2.message : e2);
      FEHLER_IDS.forEach(function (id) { meldeFehler(id, t); });
    }
    teilweise = false;
    if (window.GRUNDRISS_GRUNDSTUECK && window.GRUNDRISS_GRUNDSTUECK.autarkieNeu) window.GRUNDRISS_GRUNDSTUECK.autarkieNeu();   /* Autarkie-Block liest Wasser und Wärme von dieser Karte */
  }
  function aktualisieren() { clearTimeout(timer); var nur = teilweise; timer = setTimeout(function () { jetzt(nur); }, 150); }

  /* Plan schreiben: nur was der Nutzer ändert, landet im Plan (alte Pläne bleiben ohne die neuen Felder) */
  function planFeld(feld, schluessel, wert, loeschen) {
    var plan = G.plan();
    if (schluessel == null) { if (loeschen) delete plan[feld]; else plan[feld] = wert; }
    else {
      if (!plan[feld] || typeof plan[feld] !== 'object') plan[feld] = {};
      if (loeschen) { delete plan[feld][schluessel]; if (!Object.keys(plan[feld]).length) delete plan[feld]; } else plan[feld][schluessel] = wert;
    }
    G.geaendert();
  }
  function feldFehler(id, text) { meldeFehler(id, text); var f = byId(id.replace(/-fehler$/, '')); if (f) { if (text) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); } }
  /* Zahlenfeld lesen: leer = zurück zum Startwert; ungültig = sichtbare Meldung am Feld, nichts wird gespeichert */
  function zahlFeld(t, min, max, fehlerId, nameKey) {
    var v = t.value.trim();
    if (v === '') { feldFehler(fehlerId, ''); return { leer: true }; }
    var x = zahlLesen(v);
    if (!isFinite(x) || x < min || x > max) { feldFehler(fehlerId, tr('hpFehlerZahl', { name: tr(nameKey), min: n2(min), max: n0(max) })); return { fehler: true }; }
    feldFehler(fehlerId, '');
    return { wert: x };
  }
  function bei(ev) {
    var t = ev.target;
    if (!t.getAttribute) return;
    var a = t.getAttribute('data-hu');
    if (a === 'personen') {
      var p = Math.round(+t.value), lab = byId('hw-personen-wert'); if (lab) lab.textContent = p; t.setAttribute('aria-valuetext', tr('hwPersonenText', { n: p }));
      /* Welle E, Teil 2: Personen im Haus liegen an einer gemeinsamen Stelle (plan.personen); plan.wasser.personen bleibt für ältere Stände mit gleichem Wert */
      teilweise = true; G.plan().personen = p; planFeld('wasser', 'personen', p); return;
    }
    if (ev.type !== 'change') return;
    if (a === 'gruendach') { planFeld('wasser', 'gruendach', !!t.checked); return; }
    if (a === 'gas') {
      var r = zahlFeld(t, 1, 199, 'hu-gaspreis-fehler', 'hpGasLabel');
      if (r.fehler) return;
      if (r.leer) planFeld('energiepreise', 'gas_ct', null, true); else planFeld('energiepreise', 'gas_ct', r.wert);
      t.value = n2(HK.energiepreise(G.plan()).gasCt); return;
    }
    if (a === 'oel') {
      var r2 = zahlFeld(t, 1, 999, 'hu-oelpreis-fehler', 'hpOelLabel');
      if (r2.fehler) return;
      if (r2.leer) planFeld('energiepreise', 'oel_eur100l', null, true); else planFeld('energiepreise', 'oel_eur100l', r2.wert);
      t.value = n0(HK.energiepreise(G.plan()).oelEur100); return;
    }
    if (a === 'mehrkosten') {
      var r3 = zahlFeld(t, 0, 9999999, 'hu-mehrkosten-fehler', 'hdMehrkostenEigen');
      if (r3.fehler) return;
      if (r3.leer || r3.wert === 0) planFeld('mehrkosten_eigen', null, null, true); else planFeld('mehrkosten_eigen', null, r3.wert);
      t.value = eigenWertText(G.plan()); return;
    }
    if (a === 'wasserpreis') {
      var r4 = zahlFeld(t, 0.01, 49, 'hw-preis-fehler', 'hwPreisLabel');
      if (r4.fehler) return;
      if (r4.leer) planFeld('wasser', 'preis', null, true); else planFeld('wasser', 'preis', r4.wert);
      var pr = HK.planWasser(G.plan()).preis; t.value = pr ? n2(pr) : ''; return;
    }
  }
  function klick(ev) {
    var t = ev.target.closest('[data-hu]');
    if (!t || t.tagName === 'INPUT') return;
    var a = t.getAttribute('data-hu'), w = t.getAttribute('data-wert');
    switch (a) {
      case 'hilfe': { var p = byId(t.getAttribute('aria-controls')), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf ? 'true' : 'false'); if (p) p.hidden = !auf; break; }
      case 'std': planFeld('daemmstandard', null, w); break;
      case 'kfwstufe': planFeld('kfwstufe', null, w); break;
      case 'neubau': planFeld('lueftung', 'neubau', w === 'ja'); break;
      case 'art': planFeld('lueftung', 'art', w); break;
      case 'traeger': planFeld('energiepreise', 'traeger', w); break;
      case 'regen': planFeld('wasser', 'regenwasser', w === 'ja'); break;
      case 'haerte': planFeld('wasser', 'haerte', w); break;
    }
  }

  /* ---------- Einhängen ---------- */
  ['g-daemmung-inhalt', 'g-lueftung-inhalt', 'g-wasser-inhalt'].forEach(function (id) {
    var w = byId(id); if (!w) return;
    w.addEventListener('click', klick);
    w.addEventListener('input', bei);
    w.addEventListener('change', bei);
  });
  ['g-daemmung-details', 'g-lueftung-details', 'g-wasser-details'].forEach(function (id) { var d = byId(id); if (d) d.addEventListener('toggle', function () { if (d.open) jetzt(); }); });
  window.addEventListener('sprachegewechselt', function () { jetzt(); });

  window.GRUNDRISS_HUELLE = {
    aktualisieren: aktualisieren, jetzt: jetzt, balkenHtml: balkenHtml,
    /* Heizwärme je m² Wohnfläche und Jahr mit gewähltem Standard und gewählter Lüftung (null, wenn nicht rechenbar); die Kopfzeile der Material-Karte zeigt diesen Wert */
    gesamtM2: function (cc) {
      if (!cc || !cc.plan || !cc.bilanz || !cc.bilanz.ok) return null;
      var hw = HK.heizwaermeMitStandard(cc.plan, { bilanz: cc.bilanz });
      return hw.ok && hw.gesamt ? hw.gesamt.kwhM2 : null;
    },
    ergebnis: function () { return ctx; },
    /* Welle E, Teil 2: Lese-Funktionen für den Autarkie-Block der Karte Grundstück (rechnen nichts anderes als diese Karte: HK.wasserBilanz, HK.waermeBedarf, HK.planWasser) */
    wasserAutarkie: function () { var plan = G.plan(); return hatRaeume(plan) ? HK.wasserBilanz(plan) : { status: 'keinPlan', pw: HK.planWasser(plan) }; },
    waermeBedarf: function () { var plan = G.plan(); return hatRaeume(plan) ? HK.waermeBedarf(plan) : { ok: false, grund: 'keineRaeume' }; }
  };
  setTimeout(function () { jetzt(); }, 0);
})();
