/* Oberfläche „Anbau und Nebengebäude“ (Welle D, Teil 3): Karte #g-anbau-karte unter „Wasser“. Rechnung in anbau_kern.js, Texte in daten/texte_anbau.js (de/en/ru).
   Acht Bildknöpfe, Größe per Regler (Zahlenfeld als genaue Alternative), Höhe nur bei Grenzen in m³; Ergebnis: Kosten (nur Wintergarten) und Bauantrag-Ampel für plan.land.
   Plan-Feld: plan.anbau { art, flaeche_m2, hoehe_m } (optional, alte Pläne laden unverändert). Das Bauwerk wird nicht gezeichnet und ändert Wohnfläche und Heizwärme nicht. */
(function () {
  'use strict';
  var AK = window.ANBAU_KERN, G = window.GRUNDRISS, D = window.DATEN || {};
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return window.TXT ? window.TXT.lang() : 'de'; }
  function nf(d) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function n0(x) { return nf(0).format(x); }
  function n1(x) { return nf(1).format(x); }
  function nz(x) { return new Intl.NumberFormat(lang(), { maximumFractionDigits: 1 }).format(x); }   /* 12 oder 12,5 */
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
  if (!AK || !G || !D.verfahrensfrei || !D.daemmung_seite) {
    meldeFehler('g-anbau-fehler', tr('anFehlerDaten', { grund: !AK ? 'anbau_kern.js fehlt.' : (!G ? 'die Zeichnung fehlt.' : 'die Datendateien fehlen.') }));
    return;
  }

  /* ---------- Bausteine ---------- */
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'], 'eigene Einordnung': ['esStatusEigen', 'st-eigen'] };
  function badge(status) {
    var s = STATUS_KEY[status] || STATUS_KEY['prüfen vor Nutzung'];
    return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>';
  }
  function kurz(t) { var s = String(t || ''); var m = /^(.*?)(?:,| \(|:|; )/.exec(s); s = m ? m[1] : s; return s.length > 60 ? s.slice(0, 58) + '…' : s; }
  /* Quelle mit Link, Abruf und Status; b: { quelle, url, abruf, status, id } */
  function quelleHtml(b) {
    if (!b) return '';
    if (b.status === 'Lücke') return '<span class="ab-quelle" data-quelle="' + esc(b.id || '') + '" data-status="Lücke">' + badge('Lücke') + '</span>';
    var name = esc(kurz(b.quelle));
    var link = b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + name + '</a>' : name;
    return '<span class="ab-quelle" data-quelle="' + esc(b.id || '') + '" data-abruf="' + esc(b.abruf || '') + '" data-status="' + esc(b.status || '') + '">' + link +
      (b.abruf ? ' · ' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) : '') + ' ' + badge(b.status || 'prüfen vor Nutzung') + '</span>';
  }
  function annahmeSchild() { return '<span class="annahme es-an">' + esc(tr('annahme')) + '</span>'; }
  function annahmeZeile(textKey, par) { return annahmeSchild() + ' ' + esc(tr(textKey, par)); }
  function luecke(textKey) { return '<span class="ab-luecke" data-luecke="1">' + esc(tr(textKey || 'hdKeineAngabe')) + '</span>'; }
  function mitFokus(wurzel, fn) {
    var af = document.activeElement, fk = af && wurzel.contains(af) ? af.getAttribute('data-fk') : null;
    fn();
    if (fk) { var n = wurzel.querySelector('[data-fk="' + fk + '"]'); if (n) n.focus({ preventScroll: true }); }
  }
  var hilfeOffen = {};   /* welche „?“-Hilfen offen sind (bleibt beim Neuzeichnen erhalten) */
  function hilfeKnopf(id) {
    return '<button type="button" class="hilfe-knopf" data-an="hilfe" aria-expanded="' + (!!hilfeOffen[id]) + '" aria-controls="' + id + '" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button>';
  }
  var AMPEL_ICON = { gruen: 'i-an-ok', gelb: 'i-an-achtung', rot: 'i-an-stopp', grau: 'i-an-frage' };
  function ampelChip(a, klein) {
    return '<span class="an-ampel an-f ' + a + (klein ? ' mini' : '') + '" data-ampel-chip="' + a + '">' + symbol(AMPEL_ICON[a]) + '<span>' + esc(tr('anA_' + a)) + '</span></span>';
  }

  /* ---------- Rechenstand ---------- */
  var ctx = null;
  function rechne() { ctx = AK.rechne(G.plan()); return ctx; }

  /* Steuerung */
  var ICON = { wg_kalt: 'i-an-wgkalt', wg_warm: 'i-an-wgwarm', terrassendach: 'i-an-terrasse', carport: 'i-an-carport', garage: 'i-an-garage', gartenhaus: 'i-an-gartenhaus', anbau: 'i-an-anbau', aufstockung: 'i-an-aufstock' };
  function reglerHtml(idBase, name, wert, min, max, step, einheit, textKey, nameKey, ziffern) {
    var fmt = ziffern === 1 ? nz : n0, k = idBase.slice(3), a = ' data-an="' + k, f = '" data-fk="' + k;
    return '<div class="es-feld"><label class="es-label" for="' + idBase + '">' + esc(name) + ' <b id="' + idBase + '-wert" class="es-zahl">' + fmt(wert) + ' ' + einheit + '</b></label>' +
      '<input type="range" id="' + idBase + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + Math.min(max, Math.max(min, wert)) + '"' + a + f + '" aria-valuetext="' + esc(tr(textKey, { n: fmt(wert) })) + '"></div>' +
      '<div class="es-feld"><label class="es-label" for="' + idBase + '-zahl">' + esc(tr(nameKey)) + '</label>' +
      '<input type="text" inputmode="decimal" id="' + idBase + '-zahl"' + a + '-zahl' + f + '-zahl" autocomplete="off" value="' + esc(nz(wert)) + '">' +
      '<span class="fehler" id="' + idBase + '-zahl-fehler" role="alert" hidden></span></div>';
  }
  function steuerHtml(c) {
    var pa = c.pa, h = '';
    h += '<div class="g-kopfzeile"><h4 class="es-h5">' + symbol('i-hammer') + esc(tr('anWahl')) + '</h4>' + hilfeKnopf('g-anbau-hilfe') + '</div>';
    h += '<p class="klein" id="g-anbau-hilfe"' + (hilfeOffen['g-anbau-hilfe'] ? '' : ' hidden') + '>' + esc(tr('anHilfe')) + '</p>';
    h += '<div class="ab-stufen an-arten" role="group" aria-label="' + esc(tr('anWahl')) + '">' + AK.ARTEN.map(function (a) {
      return '<button type="button" class="es-var an-art" data-an="art" data-wert="' + a.id + '" data-fk="art-' + a.id + '" aria-pressed="' + (pa.art === a.id) + '"><span class="es-var-kopf">' + symbol(ICON[a.id]) + '<b>' + esc(tr('anArt_' + a.id)) + '</b></span>' +
        '<span class="klein">' + esc(window.TEXTE['anFach_' + a.id] ? tr('anFach_' + a.id) : '') + '</span></button>';
    }).join('') + '</div>';
    if (pa.meldung) h += '<p class="ab-meldung fehler" role="alert" data-meldung="anbau">' + esc(tr('anUnbekannt', { id: pa.meldung.id })) + '</p>';
    if (pa.art) {
      h += '<h4 class="es-h5">' + symbol('i-mass') + esc(tr('anGroesse')) + '</h4>';
      h += '<div class="an-reihe">' + reglerHtml('an-flaeche', tr('anFlaeche'), pa.flaeche, pa.info.min, pa.info.max, 1, 'm²', 'anFlaecheText', 'anFlaecheZahl', 0) + '</div>';
      if (c.vf && c.vf.ok && c.vf.brauchtHoehe) {
        h += '<div class="an-reihe an-hoehe">' + reglerHtml('an-hoehe', tr('anHoehe'), pa.hoehe, 1, 8, 0.1, 'm', 'anHoeheText', 'anHoeheZahl', 1) + '</div>';
        h += '<p class="klein"' + (pa.hoeheExplizit ? '' : ' data-an-annahme="hoehe"') + '>' + (pa.hoeheExplizit ? '' : annahmeSchild() + ' ') + esc(tr('anHoeheWarum', { h: nz(AK.ANNAHMEN.hoehe) })) + '</p>';
      }
    }
    return h;
  }

  /* Kosten */
  function kostenHtml(c) {
    var k = c.kosten, h = '<section class="an-block" data-an-block="kosten"><h4 class="es-h5">' + symbol('i-rechner') + esc(tr('anKostenTitel')) + '</h4>';
    if (k && k.ok) {
      h += '<p class="es-satz an-kosten" data-an-satz="kosten" aria-live="polite"><span class="es-zahl" id="an-kosten" data-kosten-von="' + k.von + '" data-kosten-bis="' + k.bis + '">' + esc(tr('anKostenSpanne', { von: n0(k.von), bis: n0(k.bis) })) + '</span></p>';
      h += '<p class="klein" data-an-rechnung="1">' + esc(tr('anKostenRechnung', { jv: n0(k.jeVon), jb: n0(k.jeBis), fl: nz(k.flaeche) })) + '</p>';
      h += '<p class="klein">' + quelleHtml(k.beleg) + '</p>';
      if (k.gesamt) {
        h += '<p class="klein" data-an-vergleich="1">' + esc(tr('anVergleich', { von: n0(k.gesamt.von), bis: n0(k.gesamt.bis) })) + ' ' + quelleHtml(k.gesamt.beleg) + '</p>';
      }
      h += '<p class="ab-meldung" role="status" data-an-info="wohnflaeche">' + esc(tr('anOhneWohnfl')) + '</p>';
      if (k.gmodgLuecke) h += '<p class="klein" data-an-info="gmodg">' + luecke() + ' ' + esc(tr('anWarmLuecke')) + ' ' + quelleHtml(k.gmodgLuecke) + '</p>';
    } else {
      h += '<p class="an-keine" data-an-keine="' + esc(k ? k.grund : '') + '">' + luecke() + '</p>';
      h += '<p class="klein">' + esc(tr(k && k.grund === 'wohnraum' ? 'anKeinPreisWohn' : 'anKeinPreis')) + '</p>';
      if (k && k.beleg) h += '<p class="klein">' + quelleHtml(k.beleg) + '</p>';
    }
    return h + '</section>';
  }

  /* Bauantrag-Ampel */
  function satzFuer(summe) {
    var z = summe.zeile, a = summe.ampel;
    if (a === 'gruen') return z && z.art === 'ohne_grenze' ? tr('anS_gruenOhne') : tr('anS_gruen', { wert: nz(z.wert), einheit: z.einheit });
    if (a === 'gelb') return tr('anS_gelb', { p: n0(Math.round(z.anteil * 100)), wert: nz(z.wert), einheit: z.einheit });
    if (a === 'rot') return z && z.art === 'nicht_frei' ? tr('anS_rotNicht') : tr('anS_rot', { wert: nz(z.wert), einheit: z.einheit });
    var u = summe.ursache, key = 'anS_grau_' + u;
    return window.TEXTE && window.TEXTE[key] ? tr(key) : tr('anS_grau_sonst');
  }
  function massText(z) {
    var r = z.rechnung, p = n0(Math.round(z.anteil * 100));
    return r.typ === 'volumen' ? tr('anMassVolumen', { fl: nz(r.flaeche), h: nz(r.hoehe), v: nz(Math.round(z.mass * 10) / 10), wert: nz(z.wert), p: p }) : tr('anMassFlaeche', { fl: nz(r.flaeche), wert: nz(z.wert), p: p });
  }
  function zeileHtml(z) {
    var h = '<div class="an-zeile an-z-' + z.ampel + (z.sonder ? ' an-sonder' : '') + '" data-an-zeile="' + z.ampel + '" data-wert="' + (z.wert == null ? '' : z.wert) + '" data-einheit="' + esc(z.einheit) + '">';
    h += '<div class="an-z-kopf">' + ampelChip(z.ampel, true) + '<b class="an-z-name">' + esc(z.bauwerk || '') + '</b></div>';
    if (z.art === 'grenze' && z.wert != null && z.mass != null) {
      h += '<p class="an-z-grenze es-zahl" data-an-grenze="' + z.wert + '">' + esc(tr('anZeileGrenze', { wert: nz(z.wert), einheit: z.einheit })) + '</p>';
      if (z.ampel !== 'grau') {
        var p = Math.round(z.anteil * 100);
        h += '<div class="an-balken" role="img" aria-label="' + esc(tr('anBalkenAria', { p: p })) + '"><span class="an-fuell ' + z.ampel + '" style="width:' + Math.min(100, p).toFixed(0) + '%"></span><span class="an-marke" style="left:' + (AK.ANNAHMEN.gelbAb * 100) + '%"></span></div>';
      }
      h += '<p class="klein es-zahl" data-an-mass="' + z.mass + '" data-an-anteil="' + z.anteil.toFixed(4) + '">' + esc(massText(z)) + '</p>';
    } else if (z.art === 'ohne_grenze') h += '<p class="an-z-grenze">' + esc(tr('anZeileOhne')) + '</p>';
    else if (z.art === 'nicht_frei') h += '<p class="an-z-grenze">' + esc(tr('anZeileNicht')) + '</p>';
    else {
      h += '<p class="an-z-grenze">' + esc(tr('anZeileGrau')) + '</p>';
      if (z.ursache === 'nurUnbeheizt') h += '<p class="klein">' + esc(tr('anS_grau_nurUnbeheizt')) + '</p>';
      else if (z.ursache === 'text') h += '<p class="klein" data-an-roh="1">„' + esc(z.wertRoh) + '“</p>';
      else if (z.ursache === 'luecke') h += '<p class="klein" data-an-luecke="1">' + luecke() + ' ' + esc(z.grund) + '</p>';
    }
    if (z.ursache === 'nurUnbeheizt' && z.mass != null) h += '<p class="klein es-zahl">' + esc(massText(z)) + '</p>';
    if (z.aussenbereich === 'nicht_im_aussenbereich') h += '<p class="klein" data-an-aussen="nicht">' + esc(tr('anAussenNicht')) + '</p>';
    if (z.aussenbereich === 'nur_innenbereich') h += '<p class="klein" data-an-aussen="nur">' + esc(tr('anAussenNur')) + '</p>';
    if (z.aussenWert != null) h += '<p class="klein es-zahl" data-an-aussen-wert="' + z.aussenWert + '">' + esc(tr('anAussenWert', { wert: nz(z.aussenWert), einheit: z.einheit })) + '</p>';
    if (z.bedingung) h += '<p class="klein" data-an-bedingung="1">' + esc(tr('anBedingung', { text: z.bedingung })) + '</p>';
    h += '<p class="klein" data-an-fundstelle="1">' + (z.paragraf ? esc(tr('anFundstelle', { p: z.paragraf })) + ' · ' : '') + z.quellen.map(function (q) {
      return quelleHtml({ id: q.id, quelle: q.titel, url: q.url, abruf: z.abruf, status: z.status });
    }).join(' ') + '</p>';
    return h + '</div>';
  }
  function antragHtml(c) {
    var v = c.vf, h = '<section class="an-block" data-an-block="antrag"><h4 class="es-h5">' + symbol('i-paragraf') + esc(tr('anAntragTitel')) + '</h4>';
    if (!v || !v.ok) { return h + '<p class="ab-meldung fehler" role="alert" data-fehler="vf">' + esc(tr('anKeineDaten', { grund: v ? v.grund : '' })) + '</p></section>'; }
    h += '<p class="klein" data-an-land="' + esc(c.land) + '">' + esc(tr('anFuer', { land: c.landName })) + '</p>';
    var a = v.summe.ampel;
    h += '<div class="an-satz an-f ' + a + '" role="status" aria-live="polite" data-an-ampel="' + a + '">' + ampelChip(a, false) + '<span class="an-satz-text" data-an-satz="antrag">' + esc(satzFuer(v.summe)) + '</span></div>';
    if (v.summe.mehrere) h += '<p class="klein" data-an-mehrere="1">' + esc(tr('anMehrere')) + '</p>';
    v.zeilen.forEach(function (z) { h += zeileHtml(z); });
    if (!v.zeilen.length && v.gefunden && v.gefunden.length) h += '<p class="klein" data-an-gefunden="1">' + esc(tr('anNichtGefunden', { liste: v.gefunden.join('; ') })) + '</p>';
    if (c.sachsen) h += '<p class="klein" data-an-sachsen="' + (c.sachsen.gleich ? 'gleich' : 'abweichung') + '">' + esc(c.sachsen.gleich ? tr('anSachsenGleich', { wert: nz(c.sachsen.merkblatt), einheit: c.sachsen.einheit })
      : tr('anSachsenAbw', { wert: nz(c.sachsen.merkblatt), einheit: c.sachsen.einheit, gesetz: nz(c.sachsen.gesetz) })) + ' ' + quelleHtml(c.sachsen.beleg) + '</p>';
    h += '<p class="klein" data-an-schwelle="1">' + badge('eigene Einordnung') + ' ' + esc(tr('anSchwelle', { p: n0(AK.ANNAHMEN.gelbAb * 100) })) + '</p>';
    h += '<p class="ab-meldung" role="note" data-an-hinweis="vf">' + esc(tr('anHinweisVf')) + '</p>';
    var ab = c.abstand;
    h += '<div class="g-kopfzeile an-abstand"><h4 class="es-h5">' + symbol('i-mass') + esc(tr('anAbstandTitel')) + '</h4>' + hilfeKnopf('an-abstand-hilfe') + '</div>';
    h += '<div id="an-abstand-hilfe" data-an-abstand="' + (ab.by ? 'by' : 'allgemein') + '"' + (hilfeOffen['an-abstand-hilfe'] ? '' : ' hidden') + '>' + (ab.by ? '' : '<p class="klein">' + esc(tr('anAbstandAllg', { land: ab.landName })) + '</p>');
    if (ab.by) h += '<p class="klein es-zahl" data-an-abstand-by="1">' + esc(tr('anAbstandBY')) + ' ' + quelleHtml(ab.by.beleg) + '</p><p class="klein">' + esc(ab.by.name) + '</p>';
    h += '</div>';
    return h + '</section>';
  }
  function ergebnisHtml(c) {
    if (c.leer) return '<p class="es-satz klein-satz" data-an-satz="start">' + esc(tr('anStart')) + '</p>';
    return '<div class="an-zwei">' + kostenHtml(c) + antragHtml(c) + '</div>';
  }
  function kopf(c) {
    var el = byId('g-anbau-kopfzeile');
    if (!el) return;
    if (c.leer) { el.textContent = tr('anKopfLeer'); return; }
    el.textContent = tr('anKopf', { art: tr('anArt_' + c.pa.art), fl: nz(c.pa.flaeche), ampel: tr('anA_' + (c.vf && c.vf.ok ? c.vf.summe.ampel : 'grau')) });
  }

  /* Zusammenspiel */
  var timer = null, teilweise = false;
  function jetzt(nurErgebnis) {
    clearTimeout(timer);
    var c;
    try { c = rechne(); } catch (e) { meldeFehler('g-anbau-fehler', tr('anFehlerRechnen', { grund: e && e.message ? e.message : e })); return; }
    meldeFehler('g-anbau-fehler', '');
    try {
      var d = byId('g-anbau-details');
      if (d && d.open) {
        var ersatz = function (id, fn) { var w = byId(id); if (!w) return; if (nurErgebnis && id === 'an-steuer') return; var neu = fn(c); mitFokus(w, function () { w.innerHTML = neu; }); };
        ersatz('an-steuer', steuerHtml); ersatz('an-ergebnis', ergebnisHtml);
      }
      kopf(c);
    } catch (e2) { meldeFehler('g-anbau-fehler', tr('anFehlerRechnen', { grund: e2 && e2.message ? e2.message : e2 })); }
    teilweise = false;
  }
  function aktualisieren() { clearTimeout(timer); var nur = teilweise; timer = setTimeout(function () { jetzt(nur); }, 150); }

  /* Plan schreiben: nur was der Nutzer ändert, landet im Plan (alte Pläne bleiben ohne das Feld) */
  function planFeld(schluessel, wert) {
    var plan = G.plan();
    if (!plan.anbau || typeof plan.anbau !== 'object') plan.anbau = {};
    plan.anbau[schluessel] = wert;
    G.geaendert();
  }
  function feldFehler(id, text) { meldeFehler(id, text); var f = byId(id.replace(/-fehler$/, '')); if (f) { if (text) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); } }
  function zahlFeld(t, min, max, fehlerId, nameKey) {
    var v = t.value.trim();
    if (v === '') { feldFehler(fehlerId, ''); return { leer: true }; }
    var x = zahlLesen(v);
    if (!isFinite(x) || x < min || x > max) { feldFehler(fehlerId, tr('anFehlerZahl', { name: tr(nameKey), min: nz(min), max: nz(max) })); return { fehler: true }; }
    feldFehler(fehlerId, '');
    return { wert: x };
  }
  function reglerBei(t, schluessel, nameKey, textKey, einheit, ziffern) {
    var x = +t.value, fmt = ziffern === 1 ? nz : n0, lab = byId(t.id + '-wert'), zahl = byId(t.id + '-zahl');
    if (ziffern === 1) x = Math.round(x * 10) / 10;
    if (lab) lab.textContent = fmt(x) + ' ' + einheit;
    if (zahl) { zahl.value = nz(x); feldFehler(zahl.id + '-fehler', ''); }
    t.setAttribute('aria-valuetext', tr(textKey, { n: fmt(x) }));
    var an = schluessel === 'hoehe_m' ? document.querySelector('[data-an-annahme=hoehe]') : null;   /* eigene Höhe: das Annahme-Schild entfällt sofort */
    if (an) { an.removeAttribute('data-an-annahme'); var sp = an.querySelector('.annahme'); if (sp) sp.remove(); }
    teilweise = true; planFeld(schluessel, x);
  }
  function bei(ev) {
    var t = ev.target;
    if (!t.getAttribute) return;
    var a = t.getAttribute('data-an');
    if (ev.type === 'input') {
      if (a === 'flaeche') reglerBei(t, 'flaeche_m2', 'anFlaecheZahl', 'anFlaecheText', 'm²', 0);
      else if (a === 'hoehe') reglerBei(t, 'hoehe_m', 'anHoeheZahl', 'anHoeheText', 'm', 1);
      return;
    }
    if (ev.type !== 'change') return;
    if (a === 'flaeche-zahl') {
      var r = zahlFeld(t, AK.FLAECHE_MIN, AK.FLAECHE_MAX, 'an-flaeche-zahl-fehler', 'anFlaecheZahl');
      if (r.fehler) return;
      if (r.leer) { t.value = nz(ctx && ctx.pa.flaeche != null ? ctx.pa.flaeche : 0); return; }
      planFeld('flaeche_m2', r.wert); return;
    }
    if (a === 'hoehe-zahl') {
      var r2 = zahlFeld(t, AK.HOEHE_MIN, AK.HOEHE_MAX, 'an-hoehe-zahl-fehler', 'anHoeheZahl');
      if (r2.fehler) return;
      if (r2.leer) { t.value = nz(ctx ? ctx.pa.hoehe : AK.ANNAHMEN.hoehe); return; }
      planFeld('hoehe_m', r2.wert); return;
    }
  }
  function klick(ev) {
    var t = ev.target.closest('[data-an]');
    if (!t || t.tagName === 'INPUT') return;
    var a = t.getAttribute('data-an'), w = t.getAttribute('data-wert');
    if (a === 'hilfe') { var id = t.getAttribute('aria-controls'), p = byId(id), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf ? 'true' : 'false'); hilfeOffen[id] = auf; if (p) p.hidden = !auf; return; }
    if (a === 'art') planFeld('art', w);
  }

  /* ---------- Einhängen ---------- */
  var wurzel = byId('g-anbau-inhalt');
  if (wurzel) { wurzel.addEventListener('click', klick); wurzel.addEventListener('input', bei); wurzel.addEventListener('change', bei); }
  var det = byId('g-anbau-details');
  if (det) det.addEventListener('toggle', function () { if (det.open) jetzt(); });
  window.addEventListener('sprachegewechselt', function () { jetzt(); });

  window.GRUNDRISS_ANBAU = { aktualisieren: aktualisieren, jetzt: jetzt, ergebnis: function () { return ctx; } };
  setTimeout(function () { jetzt(); }, 0);
})();
