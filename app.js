/* Bedienlogik der Werkzeugseite. Rechnet nur über window.RECHNER (rechner.js). */
(function () {
  'use strict';
  var R = window.RECHNER;
  var D = window.DATEN || {};
  var NB = ' ';

  /* ---------- Hilfen ---------- */
  function $(id) { return document.getElementById(id); }
  function speicherLesen(schluessel) {
    try { var s = localStorage.getItem(schluessel); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function speicherSchreiben(schluessel, wert) {
    try { localStorage.setItem(schluessel, JSON.stringify(wert)); return true; } catch (e) { return false; }
  }
  var fmt0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmt2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function euro(n, dez) {
    if (n === null || !isFinite(n)) return '-';
    return (dez ? fmt2 : fmt0).format(n) + NB + '€';
  }
  function prozent(n) { return (n === null || !isFinite(n)) ? '-' : fmt1.format(n) + NB + '%'; }
  function faktor(n) { return (n === null || !isFinite(n) || n === 0) ? '-' : fmt1.format(n); }
  function monateText(m) {
    if (!isFinite(m)) return 'nie (Rate deckt nur Zinsen)';
    var j = Math.floor(m / 12), r = m % 12;
    return j + NB + 'Jahre' + (r ? ' ' + r + NB + 'Monate' : '');
  }
  function datumDe(iso) { var t = iso.split('-'); return t[2] + '.' + t[1] + '.' + t[0]; }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function objekte(n) { return n + ' ' + (n === 1 ? 'Objekt' : 'Objekte'); }
  function vorzeichenKlasse(n) { return !isFinite(n) ? '' : (n < 0 ? 'neg' : 'pos'); }

  /* Zahlenfeld lesen. Liefert die Zahl oder null (dann ist das Feld als fehlerhaft markiert).
     Die Meldung erscheint beim Verlassen des Feldes, die Rechnung reagiert sofort. */
  var regeln = {};
  function zahlFeld(id, min, max, einheit) { regeln[id] = { min: min, max: max, einheit: einheit || '' }; }
  function pruefeFeld(id, zeigen) {
    var el = $(id), r = regeln[id] || { min: 0, max: Infinity };
    var n = R.leseZahl(el.value);
    var text = '';
    if (n === null) text = 'Bitte eine Zahl eingeben, z. B. 300.000 oder 5,5.';
    else if (n < r.min) text = 'Der Wert muss mindestens ' + fmt0.format(r.min) + ' sein.';
    else if (n > r.max) text = 'Der Wert darf höchstens ' + fmt0.format(r.max) + (r.einheit ? NB + r.einheit : '') + ' sein.';
    var f = $(id + '-f');
    if (text) {
      el.setAttribute('aria-invalid', 'true');
      if (f && zeigen) f.textContent = text;
      return null;
    }
    el.removeAttribute('aria-invalid');
    if (f) f.textContent = '';
    return n;
  }
  function wert(id) { return pruefeFeld(id, false); }
  function wertDl(ziel, eintraege) {
    /* Ergebnisse erst nach Eingabe: mehrere Kacheln nur mit „-“ bleiben verborgen */
    $(ziel).hidden = eintraege.length > 1 && eintraege.every(function (e) { return e.w === '-'; });
    $(ziel).innerHTML = eintraege.map(function (e) {
      return '<div class="wert' + (e.haupt ? ' haupt' : '') + '"><dt>' + esc(e.t) + '</dt><dd class="' + (e.k || '') + '">' + esc(e.w) + '</dd></div>';
    }).join('');
  }

  /* ---------- Design hell/dunkel ---------- */
  /* data-theme: "light"/"dark" oder nicht gesetzt (dann folgt die Seite dem System).
     Der Knopf zeigt das aktuelle Design: Sonne im hellen, Halbmond im dunklen (Nutzerwunsch 08.10.2026). */
  function istHell() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'light';
    return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function themaKnopfZeigen() {
    var hell = istHell();
    /* SVG kennt die Eigenschaft .hidden nicht, darum das Attribut setzen */
    $('thema-sonne').toggleAttribute('hidden', !hell);
    $('thema-mond').toggleAttribute('hidden', hell);
    $('thema-knopf').setAttribute('aria-label', hell ? 'Dunkles Design einschalten' : 'Helles Design einschalten');
    $('thema-knopf').title = hell ? 'Helles Design (zum Wechseln klicken)' : 'Dunkles Design (zum Wechseln klicken)';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', hell ? '#fbf6ee' : '#1a1622');
  }
  function themaGeaendert() {
    themaKnopfZeigen();
    window.dispatchEvent(new Event('themagewechselt'));
  }
  $('thema-knopf').addEventListener('click', function () {
    var neu = istHell() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', neu);
    try { localStorage.setItem('immo-thema', neu); } catch (e) {}
    themaGeaendert();
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', themaGeaendert);
  }
  themaKnopfZeigen();
  window.addEventListener('themagewechselt', function () { themaKnopfZeigen(); zeichneGrafiken(); });

  /* ---------- Bilder, Seitenköpfe und Einstieg (daten/bilder.js, daten/einstieg.js; Welle 1) ---------- */
  var E = D.einstieg || { weg: [], bereiche: {}, kurzOhne: {} };
  (function () {
    if (D.bilder) {
      var vorrat = document.createElement('div');
      vorrat.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + D.bilder.symbole() + '</defs></svg>';
      document.body.insertBefore(vorrat.firstChild, document.body.firstChild);
      document.querySelectorAll('svg[data-bild]').forEach(function (s) {
        var n = s.getAttribute('data-bild');
        if (D.bilder.namen.indexOf(n) < 0) { s.remove(); return; }
        s.setAttribute('viewBox', '0 0 520 380');
        s.innerHTML = '<use href="#il-' + n + '"/>';
      });
    }
    var nr = {};
    E.weg.forEach(function (w, i) { w.ziele.forEach(function (z) { nr[z] = i + 1; }); });
    Object.keys(E.bereiche).forEach(function (id) {
      var b = E.bereiche[id], sec = $(id);
      if (!sec) return;
      var lead = sec.querySelector('[data-kurz]');
      if (lead) lead.textContent = b.kurz;
      var sn = sec.querySelector('.schritt-nr');
      if (sn) sn.textContent = nr[id] ? 'Schritt ' + nr[id] + ' von ' + E.weg.length : 'Nebenbereich, nicht Teil der sieben Schritte';
      var platz = sec.querySelector('[data-einstieg]');
      if (!platz) return;
      var knopf = b.anfang.aktion
        ? '<button type="button" class="knopf mittel" data-aktion="' + esc(b.anfang.aktion) + '">' + esc(b.anfang.text) + '</button>'
        : '<button type="button" class="knopf mittel" data-anfang="' + esc(id) + '">' + esc(b.anfang.text) + '</button>';
      if (b.beispiel) knopf += '<button type="button" class="knopf zweit mittel" data-aktion="' + (id === 'rechner' ? 'beispiel' : 'beispiel-' + id) + '"' + (id === 'rechner' ? ' id="rechner-beispiel"' : '') + '>Beispiel ansehen</button>';
      platz.outerHTML = '<dl class="einstieg" id="einstieg-' + id + '">' +
        '<div><dt>Wofür?</dt><dd>' + esc(b.wofuer) + '</dd></div>' +
        '<div><dt>Was brauche ich?</dt><dd>' + esc(b.brauche) + '</dd></div>' +
        '<div><dt>Hier anfangen</dt><dd><div class="knopfreihe">' + knopf + '</div></dd></div></dl>';
    });
    Object.keys(E.kurzOhne || {}).forEach(function (id) {
      var sec = $(id), lead = sec && sec.querySelector('[data-kurz]');
      if (lead) lead.textContent = E.kurzOhne[id];
    });
  })();
  /* Knopf „Hier anfangen“: springt zum ersten Feld des Bereichs */
  function fokusAuf(id, auswahl) {
    var el = auswahl ? document.querySelector(auswahl) : $(id);
    if (!el) return;
    var st = el.closest('.schritt'), fo = st && st.closest('form');
    if (fo) zeigeSchritt(fo.id, fo.id.charAt(0) + '-schritte', st.getAttribute('data-schritt'), false);
    var d = el.closest('details');
    if (d) d.open = true;
    el.focus();
  }

  /* Leiste „Schritt für Schritt zum Kauf“: nur in den sieben Schritt-Bereichen; „erledigt“ = die Schritte davor */
  function leisteZeigen(ziel) {
    var nav = $('weg'), idx = -1, n = E.weg.length;
    E.weg.forEach(function (w, i) { if (w.ziele.indexOf(ziel) >= 0) idx = i; });
    nav.hidden = idx < 0;
    if (idx < 0) return;
    $('weg-liste').innerHTML = E.weg.map(function (w, i) {
      var klasse = i < idx ? 'fertig' : i === idx ? 'jetzt' : '';
      return '<li class="' + klasse + '"><a href="#' + w.ziele[0] + '" data-ziel="' + w.ziele[0] + '"' + (i === idx ? ' aria-current="step"' : '') + '>' +
        '<span class="pkt" aria-hidden="true">' + (i < idx ? '✓' : (i + 1)) + '</span><span class="nm">' + (i < idx ? '<span class="sprung">Erledigt: </span>' : '') + esc(w.name) + '</span></a></li>';
    }).join('');
    var weiter = E.weg[idx + 1], a = $('weg-weiter'), c = $('weg-kompakt');
    var zielNaechst = weiter ? weiter.ziele[0] : 'uebersicht';
    a.hidden = !weiter;
    a.setAttribute('data-ziel', zielNaechst); a.setAttribute('href', '#' + zielNaechst);
    c.setAttribute('data-ziel', zielNaechst); c.setAttribute('href', '#' + zielNaechst);
    c.firstElementChild.textContent = 'Schritt ' + (idx + 1) + ' von ' + n + (weiter ? ' · Weiter →' : ' · Zur Startseite →');
  }

  /* ---------- Bereiche: Startseite mit Kacheln, Menü „Alle Bereiche“, Zurück-Knopf ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.bereich-knopf'));
  function zeigeReiter(tab, fokus, ohneVerlauf) {
    var ziel = tab.getAttribute('data-ziel');
    tabs.forEach(function (t) {
      var aktiv = t === tab;
      if (aktiv) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
      $(t.getAttribute('data-ziel')).hidden = !aktiv;
    });
    $('kopf-ort').textContent = ziel === 'uebersicht' ? '' : tab.textContent.trim();
    leisteZeigen(ziel);
    $('menue').open = false;
    document.querySelectorAll('.unternav [data-ziel]').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-ziel') === ziel ? 'true' : 'false');
    });
    if (!ohneVerlauf && location.hash !== '#' + ziel) {
      try { history.pushState(null, '', '#' + ziel); } catch (e) {}
    }
    if (fokus) {
      window.scrollTo(0, 0);
      var kopf = $(ziel).querySelector('h1, h2');
      if (kopf) { kopf.setAttribute('tabindex', '-1'); kopf.focus({ preventScroll: true }); }
    }
    if (window.GRAFIK) window.GRAFIK.versteckeTip();
    if (window.GRUNDRISS) window.GRUNDRISS.zeigt(ziel === 'grundriss');
    if (window.KARTE) window.KARTE.zeigt(ziel === 'karte');
    zeichneGrafiken(); /* Breite ist erst messbar, wenn der Bereich sichtbar ist */
  }
  function zeigeBereich(ziel, fokus) {
    var t = $('tab-' + ziel);
    if (t) zeigeReiter(t, fokus);
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { zeigeReiter(t, true); });
  });
  document.addEventListener('click', function (ev) {
    var akt = ev.target.closest('[data-aktion]');
    if (akt) { ev.preventDefault(); aktion(akt.getAttribute('data-aktion')); return; }
    var an = ev.target.closest('[data-anfang]');
    if (an) {
      ev.preventDefault();
      var eb = E.bereiche[an.getAttribute('data-anfang')];
      if (eb) fokusAuf(eb.anfang.fokus, eb.anfang.fokusSel);
      return;
    }
    var b = ev.target.closest('[data-ziel]');
    if (b && !b.classList.contains('bereich-knopf')) {
      ev.preventDefault();
      zeigeBereich(b.getAttribute('data-ziel'), true);
      if (b.getAttribute('data-fokus')) fokusAuf(b.getAttribute('data-fokus'));
      if (b.getAttribute('data-anker') && $(b.getAttribute('data-anker'))) $(b.getAttribute('data-anker')).scrollIntoView({ block: 'start' });
    }
    if (!ev.target.closest('#menue')) $('menue').open = false;
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('menue').open) { $('menue').open = false; $('menue').querySelector('summary').focus(); }
  });
  $('zur-start').addEventListener('click', function () { zeigeBereich('uebersicht', true); });
  function vonAdresse() {
    /* geteilter Link: #teilen=… wird vor allem anderen ausgewertet und aus der Adresse entfernt */
    if (location.hash.slice(1).indexOf('teilen=') === 0) { teilenEmpfangen(location.hash.slice(1)); return; }
    var t = $('tab-' + (location.hash.slice(1) === 'datenschutz' ? 'impressum' : location.hash.slice(1)));
    zeigeReiter(t && t.classList.contains('bereich-knopf') ? t : $('tab-uebersicht'), false, true);
  }
  window.addEventListener('popstate', vonAdresse);
  window.addEventListener('hashchange', vonAdresse);
  /* erster Aufruf von vonAdresse() erst unten beim Start, wenn alle Daten bereitstehen */

  /* Schritt-Ansichten (Rechner, Wert, Umbau); alle Felder bleiben im Formular, nur die Anzeige wechselt.
     formId: Formular mit den Karten „.schritt“ (r-form, w-form, u-form); leisteId: die Schrittleiste dazu. */
  var SCHRITT_ANSICHTEN = [['r-form', 'r-schritte'], ['w-form', 'w-schritte'], ['u-form', 'u-schritte']];
  function zeigeSchritt(formId, leisteId, n, fokus) {
    document.querySelectorAll('#' + formId + ' .schritt').forEach(function (s) { s.hidden = s.getAttribute('data-schritt') !== String(n); });
    document.querySelectorAll('#' + leisteId + ' button').forEach(function (b) {
      if (b.getAttribute('data-schritt') === String(n)) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (fokus) {
      $(leisteId).scrollIntoView({ block: 'start', behavior: ruhig ? 'auto' : 'smooth' });
      var h = document.querySelector('#' + formId + ' .schritt[data-schritt="' + n + '"] h3');
      h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    }
    zeichneGrafiken();
  }
  SCHRITT_ANSICHTEN.forEach(function (p) {
    document.querySelectorAll('#' + p[1] + ' button').forEach(function (b) {
      b.addEventListener('click', function () { zeigeSchritt(p[0], p[1], b.getAttribute('data-schritt'), false); });
    });
    document.querySelectorAll('#' + p[0] + ' [data-geh]').forEach(function (b) {
      b.addEventListener('click', function () { zeigeSchritt(p[0], p[1], b.getAttribute('data-geh'), true); });
    });
  });
  $('r-mehr-angebote').addEventListener('click', function () {
    var an = $('r-kredit-tabelle').classList.toggle('nur-a') === false;
    this.setAttribute('aria-pressed', String(an));
    this.textContent = an ? 'Nur Angebot A zeigen' : 'Weitere Angebote vergleichen (B und C)';
  });

  /* Begriffe: (?) an Feldbeschriftungen und Kennzahlen, Erklärung in einfacher Sprache (daten/begriffe.js) */
  (function () {
    var liste = D.begriffe || [];
    if (!liste.length) return;
    function muster(w, nurAnfang) { return new RegExp((nurAnfang ? '^\\s*' : '(^|[^\\p{L}])') + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}])', 'iu'); }
    var regeln = liste.map(function (b) { return { b: b, m: b.w.map(function (w) { return muster(w, b.nurAnfang); }) }; });
    var box = document.createElement('div');
    box.id = 'erklaerung'; box.setAttribute('role', 'note'); box.hidden = true;
    document.body.appendChild(box);
    var offen = null;
    function schliessen() { if (offen) { offen.setAttribute('aria-expanded', 'false'); offen = null; } box.hidden = true; }
    function oeffnen(knopf, b) {
      if (offen === knopf) { schliessen(); return; }
      schliessen();
      box.innerHTML = '<strong>' + esc(b.t) + '</strong><p>' + esc(b.e) + '</p>';
      box.hidden = false;
      var r = knopf.getBoundingClientRect();
      var links = Math.max(16, Math.min(r.left + window.scrollX - 12, window.scrollX + document.documentElement.clientWidth - box.offsetWidth - 16));
      box.style.left = links + 'px';
      box.style.top = (r.bottom + window.scrollY + 8) + 'px';
      knopf.setAttribute('aria-expanded', 'true');
      offen = knopf;
    }
    var ziele = document.querySelectorAll('main label[for], main tbody th[scope="row"], main .kz dt');
    ziele.forEach(function (el) {
      if (el.querySelector('.frag')) return;
      var feld = el.htmlFor ? document.getElementById(el.htmlFor) : null;
      if (feld && feld.type === 'checkbox') return;
      var text = el.textContent;
      var treffer = regeln.filter(function (r) { return r.m.some(function (m) { return m.test(text); }); })[0];
      if (!treffer) return;
      var k = document.createElement('button');
      k.type = 'button'; k.className = 'frag'; k.textContent = '?';
      k.setAttribute('aria-label', 'Was heißt ' + treffer.b.t + '?');
      k.setAttribute('aria-expanded', 'false'); k.setAttribute('aria-controls', 'erklaerung');
      k.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); oeffnen(k, treffer.b); });
      el.appendChild(k);
      /* Halbsatz in Alltagssprache, immer sichtbar: unter der Beschriftung, bei Kacheln und Tabellenköpfen darin */
      if (treffer.b.kurz) {
        var kurz = document.createElement('small');
        kurz.className = 'kurz'; kurz.textContent = treffer.b.kurz;
        if (el.tagName === 'LABEL') el.insertAdjacentElement('afterend', kurz); else el.appendChild(kurz);
      }
    });
    document.addEventListener('click', function (ev) { if (offen && !box.contains(ev.target)) schliessen(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && offen) { var k = offen; schliessen(); k.focus(); } });
    window.addEventListener('resize', schliessen);
  })();

  /* Rechenwege zum Aufklappen statt grauer Formelzeilen */
  document.querySelectorAll('p.formel').forEach(function (p) {
    var d = document.createElement('details');
    d.className = 'rechenweg';
    d.innerHTML = '<summary>So wird gerechnet</summary>';
    p.parentNode.insertBefore(d, p);
    d.appendChild(p);
  });

  /* ---------- Bundesländer ---------- */
  var laender = (D.grest && D.grest.laender) || [];
  function satzVon(land) {
    for (var i = 0; i < laender.length; i++) if (laender[i].land === land) return laender[i];
    return null;
  }
  ['s-land', 'm-land', 'r-land'].forEach(function (id) {
    $(id).innerHTML = laender.map(function (l) {
      return '<option value="' + esc(l.land) + '"' + (l.land === 'Bremen' ? ' selected' : '') + '>' + esc(l.land) + ' (' + fmt1.format(l.satz) + NB + '%)</option>';
    }).join('');
  });

  /* ---------- Datenstand ---------- */
  (function () {
    var heute = new Date();
    var alt = [];
    document.querySelectorAll('#datenstand [data-datum]').forEach(function (td) {
      var tage = (heute - new Date(td.getAttribute('data-datum'))) / 86400000;
      if (tage > 90) { td.classList.add('neg'); alt.push(td.parentNode.cells[0].textContent); }
    });
    $('datenstand-alt').textContent = alt.length
      ? 'Älter als 90 Tage, bitte neu prüfen: ' + alt.join(', ') + '.'
      : 'Alle Daten sind jünger als 90 Tage.';
  })();

  /* ---------- Eingaben merken ---------- */
  /* neuer Schlüssel seit 07.10.2026: der alte enthielt den früheren Beispiel-Kaufpreis 300.000 */
  var EINGABEN = 'immo-eingaben-2';
  var gemerkt = speicherLesen(EINGABEN) || {};
  var merkFelder = Array.prototype.slice.call(document.querySelectorAll('#r-form input, #r-form select, #mz-form input[type="text"], #mz-form input[type="range"], #w-form input, #w-form select, #st-form input, #st-form select'));
  merkFelder.forEach(function (el) {
    if (el.id !== 'r-objekt' && Object.prototype.hasOwnProperty.call(gemerkt, el.id)) {
      if (el.type === 'checkbox') el.checked = gemerkt[el.id] === 'true'; else el.value = gemerkt[el.id];
    }
  });
  function eingabenMerken() {
    var o = {};
    merkFelder.forEach(function (el) { o[el.id] = el.type === 'checkbox' ? String(el.checked) : el.value; });
    speicherSchreiben(EINGABEN, o);
  }

  /* ---------- Regeln für Zahlenfelder ---------- */
  zahlFeld('r-preis', 0, 100000000); zahlFeld('r-notar', 0, 10, '%'); zahlFeld('r-makler', 0, 15, '%');
  zahlFeld('r-zusatz', 0, 100000000); zahlFeld('r-ek', 0, 100000000);
  ['a', 'b', 'c'].forEach(function (x) {
    zahlFeld('r-zins-' + x, 0, 20, '%'); zahlFeld('r-tilg-' + x, 0, 20, '%'); zahlFeld('r-bind-' + x, 0, 40, 'Jahre');
  });
  zahlFeld('r-flaeche', 0, 100000); zahlFeld('r-miete', 0, 10000000); zahlFeld('r-nul', 0, 10000000);
  zahlFeld('r-rueck', 0, 1000); zahlFeld('r-ausfall', 0, 100, '%');
  zahlFeld('r-an-eigen', 0, 20, '%');
  zahlFeld('r-ms', -10, 20, '%'); zahlFeld('r-ks', -10, 20, '%'); zahlFeld('r-ws', -10, 20, '%'); zahlFeld('r-jahre', 1, 50, 'Jahre');
  zahlFeld('r-baujahr', 1500, 2100); zahlFeld('r-gebanteil', 0, 100, '%'); zahlFeld('r-steuersatz', 0, 60, '%');
  zahlFeld('mz-betten', 0, 1000); zahlFeld('mz-preis', 0, 1000); zahlFeld('mz-beleg', 0, 100, '%');
  zahlFeld('mz-fix', 0, 10000000); zahlFeld('mz-var', 0, 1000); zahlFeld('mz-abgabe', 0, 100, '%');
  zahlFeld('am-miete', 0, 10000000); zahlFeld('am-sonst', 0, 10000000); zahlFeld('am-kaution', 0, 10000000);
  zahlFeld('am-einr', 0, 10000000); zahlFeld('am-betten', 0, 1000);
  zahlFeld('s-preis', 0, 100000000);
  zahlFeld('m-preis', 1, 100000000); zahlFeld('m-flaeche', 0, 100000); zahlFeld('m-zimmer', 0, 1000);
  zahlFeld('m-miete', 0, 10000000); zahlFeld('m-makler', 0, 15, '%'); zahlFeld('m-betten', 0, 1000);
  zahlFeld('m-gruen', 0, 100, '%'); zahlFeld('m-gelb', 0, 100, '%');
  zahlFeld('m-we', 0, 1000); zahlFeld('m-baujahr', 0, 2100); zahlFeld('m-grund', 0, 10000000); zahlFeld('m-brw', 0, 100000);
  zahlFeld('w-grund', 0, 10000000); zahlFeld('w-brw', 0, 100000); zahlFeld('w-baujahr', 0, 2100); zahlFeld('w-stichjahr', 1900, 2100);
  zahlFeld('w-gnd', 0, 200, 'Jahre'); zahlFeld('w-rnd', 0, 200, 'Jahre'); zahlFeld('w-wfl', 0, 100000); zahlFeld('w-we', 0, 1000);
  zahlFeld('w-miete', 0, 10000000); zahlFeld('w-verw', 0, 100000); zahlFeld('w-inst', 0, 1000); zahlFeld('w-ausfall', 0, 100, '%');
  zahlFeld('w-betrieb', 0, 10000000); zahlFeld('w-lz', 0, 20, '%'); zahlFeld('w-bgf', 0, 1000000); zahlFeld('w-bpi', 0, 1000);
  zahlFeld('w-rf', 0, 5); zahlFeld('w-aussen', 0, 100, '%'); zahlFeld('w-swf', 0, 5); zahlFeld('w-vgl', 0, 100000);
  regeln['w-besonders'] = { min: -100000000, max: 100000000, einheit: '' };
  /* Steuern sparen (Block 4) */
  zahlFeld('st-satz', 0, 60, '%'); zahlFeld('st-baujahr', 1500, 2100);
  ['st-a-ak', 'st-a-j1', 'st-a-j2', 'st-a-j3', 'st-b-kosten', 'st-c-kp', 'st-c-geb'].forEach(function (id) { zahlFeld(id, 0, 1000000000); });
  zahlFeld('st-c-grund', 0, 10000000); zahlFeld('st-c-brw', 0, 100000); zahlFeld('st-c-bgf', 0, 1000000);
  zahlFeld('st-d-ws', -10, 20, '%'); zahlFeld('st-d-vk', 0, 30, '%');
  Object.keys(regeln).forEach(function (id) {
    $(id).addEventListener('blur', function () { pruefeFeld(id, true); });
  });

  /* ---------- Rechner ---------- */
  var stand = {}; /* letzte Ergebnisse für Merkliste und Monteurzimmer */

  function kreditAngebot(x, darlehen) {
    var z = wert('r-zins-' + x), t = wert('r-tilg-' + x), b = wert('r-bind-' + x);
    var leer = $('r-zins-' + x).value.trim() === '' && $('r-tilg-' + x).value.trim() === '';
    if (leer || z === null || t === null || b === null || darlehen === null) return null;
    var k = R.kredit(darlehen, z, t, b);
    k.zins = z; k.tilgung = t; k.bindung = b;
    return k;
  }

  /* Zahlen zählen beim Ändern kurz mit (nur Euro-Beträge, aus bei „weniger Bewegung“) */
  var ruhig = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function zahlAus(text) {
    if (!/€\s*$/.test(text)) return null;
    var n = parseFloat(text.replace(/−/g, '-').replace(/[^\d,\-]/g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function zaehle(el, text) {
    var neu = zahlAus(text), alt = el._wert;
    el._wert = neu;
    if (el._anim) cancelAnimationFrame(el._anim);
    if (ruhig || neu === null || alt === null || alt === undefined || alt === neu) { el.textContent = text; return; }
    var t0 = performance.now();
    (function schritt(t) {
      var p = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? euro(Math.round(alt + (neu - alt) * e)) : text;
      if (p < 1) el._anim = requestAnimationFrame(schritt);
    })(t0);
  }
  function kachel(ids, text, klasse, zusatz) {
    ids.forEach(function (id) {
      var el = $(id), w = el.querySelector('.zw');
      if (!w) { el.textContent = ''; w = document.createElement('span'); w.className = 'zw'; el.appendChild(w); }
      el.className = klasse || '';
      zaehle(w, text);
      var s = el.querySelector('small');
      if (zusatz) { if (!s) { s = document.createElement('small'); el.appendChild(s); } s.textContent = zusatz; }
      else if (s) s.remove();
    });
  }

  /* Ergebnis als Satz mit Ampel. Eigene Einordnung nach offenen Schwellen, keine Empfehlung (R078):
     grün = Cashflow ab 0; gelb = Cashflow negativ, aber der Reinertrag deckt die Zinsen (der Rest ist Tilgung);
     rot = der Reinertrag deckt nicht einmal die Zinsen. Zinsen = Monatsdurchschnitt im ersten Jahr, Angebot A. */
  function ergebnisSatz(fin, A, v, mieteDa) {
    var art = 'leer', zeichen = '?', titel, text, klein;
    var wartetAufMiete = !!fin && !mieteDa;
    if (!fin) {
      titel = 'Tragen Sie einen Kaufpreis ein.';
      klein = 'Dann steht hier in einem Satz, ob die Miete die Rate trägt.';
    } else if (wartetAufMiete) {
      /* Nutzerentscheidung 09.10.2026: ohne eingetragene Miete kein Ergebnis, keine Ampelfarbe */
      titel = 'Tragen Sie noch die erwartete Kaltmiete ein (Schritt 3), dann sehen Sie, ob sich das Haus trägt.';
      klein = 'Die Kredit-Zahlen unten gelten schon jetzt.';
    } else if (!A || !v) {
      titel = 'Tragen Sie Kredit und Miete ein, dann kommt hier das Ergebnis.';
      klein = 'Es fehlen Angaben zu Angebot A oder zur Miete.';
    } else {
      var cf = v.cashflowMonat;
      var zinsen = A.plan.length ? A.plan[0].zinsen / 12 : fin.darlehen * A.zins / 1200;
      if (cf >= 0) {
        art = 'gut'; zeichen = '✓';
        titel = 'Die Miete trägt die Rate. Es bleiben ' + euro(cf) + ' im Monat übrig.';
        klein = 'Nach Zinsen, Tilgung, Rücklage und Mietausfall, vor Steuern.';
      } else if (v.reinertragMonat >= zinsen) {
        art = 'warn'; zeichen = '!';
        titel = 'Sie legen etwa ' + euro(-cf) + ' im Monat drauf.';
        klein = 'Die Miete deckt aber die Zinsen. Was Sie drauflegen, fließt in die Tilgung, also in Ihr eigenes Vermögen.';
      } else {
        art = 'schlecht'; zeichen = '✕';
        titel = 'Die Miete reicht nicht einmal für die Zinsen. Ihnen fehlen ' + euro(-cf) + ' im Monat.';
        klein = 'Mehr eigenes Geld, ein niedrigerer Preis oder mehr Miete würden helfen.';
      }
      klein +=' Eigene Einordnung, keine Kaufempfehlung.';
    }
    var name = { gut: 'Ampel grün: ', warn: 'Ampel gelb: ', schlecht: 'Ampel rot: ', leer: '' }[art];
    var hat = !!(fin && A && v);
    $('ue-kacheln').hidden = !fin;
    /* ohne Miete nur Kredit und Rate zeigen, keine Zahlen zum Ergebnis */
    ['k-cashflow', 'k-rendite', 'ue-cashflow', 'ue-rendite'].forEach(function (id) { $(id).parentNode.hidden = !v; });
    ['r-zur-miete', 'ue-zur-miete'].forEach(function (id) { $(id).hidden = !wartetAufMiete; });
    /* Startseite: Ergebniszeile zeigen, sobald es Kredit-Zahlen oder ein Ergebnis gibt. Im Beispiel heißt es Rechenbeispiel ohne „Ihr“. */
    $('ue-ergebnis').hidden = !fin;
    $('r-satz-etikett').textContent = { gut: 'Trägt sich', warn: 'Trägt sich noch nicht', schlecht: 'Trägt sich nicht', leer: 'Noch offen' }[art];
    ['r-zeilen', 'r-annahmen-titel', 'r-annahmen'].forEach(function (id) { $(id).hidden = !hat; });
    $('r-kennzahlen-box').hidden = !fin;
    [['r-satz', ''], ['ue-satz', hat ? (beispielAktiv() ? 'Rechenbeispiel: ' : 'Ihr Rechenbeispiel: ') : '']].forEach(function (p) {
      var box = $(p[0]);
      if (!box) return;
      box.className = 'satz ' + art;
      box.querySelector('.lampe').textContent = zeichen;
      text = $(p[0] + '-text');
      text.innerHTML = '<span class="sprung">' + esc(name) + '</span>' + esc(p[1] + titel);
      $(p[0] + '-klein').textContent = klein;
    });
  }

  /* Ergebniskarte im Rechner: Zeilen von der Miete bis „Übrig im Monat“ und eine Liste der Annahmen (je Zeile eine) */
  function ergebnisListen(fin, A, v, w) {
    var zl = $('r-zeilen'), al = $('r-annahmen');
    if (!(fin && A && v)) { zl.innerHTML = ''; al.innerHTML = ''; return; }
    function zeile(t, wert, klasse) { return '<div class="' + (klasse || '') + '"><dt>' + esc(t) + '</dt><dd>' + esc(wert) + '</dd></div>'; }
    function minus(n) { return '− ' + euro(n); }
    zl.innerHTML =
      zeile('Miete im Monat', euro(w.miete)) +
      zeile('Mietausfall und Leerstand (' + prozent(w.ausfall) + ')', minus(w.miete * w.ausfall / 100)) +
      zeile('Nicht umlagefähige Kosten', minus(w.nul)) +
      zeile('Rücklage für Reparaturen', minus(w.rueck * w.flaeche / 12)) +
      zeile('Rate an die Bank (Kredit ' + euro(fin.darlehen) + ')', minus(A.rate)) +
      zeile('Übrig im Monat', euro(v.cashflowMonat), 'summe');
    var punkte = [
      ['Zinssatz Angebot A: ' + prozent(A.zins) + ' pro Jahr', 'Annahme'],
      ['Tilgung: ' + prozent(A.tilgung) + ' pro Jahr', 'Annahme'],
      ['Notar und Grundbuch: ' + prozent(w.notar), 'Annahme'],
      ['Mietausfall und Leerstand: ' + prozent(w.ausfall), 'Annahme'],
      ['Nicht umlagefähig: ' + euro(w.nul) + ' im Monat', 'Annahme'],
      ['Rücklage: ' + euro(w.rueck) + ' je m² im Jahr', 'Annahme']
    ];
    /* unveränderten Startwert der Wohnfläche ehrlich als Startwert kennzeichnen (R005); die Miete hat keinen Startwert mehr */
    if ($('r-flaeche').value === $('r-flaeche').defaultValue) punkte.unshift(['Wohnfläche: ' + fmt0.format(w.flaeche) + NB + 'm² (bitte durch Ihre Fläche ersetzen)', 'Startwert']);
    al.innerHTML = punkte.map(function (x) { return '<li><span>' + esc(x[0]) + '</span><span class="annahme">' + x[1] + '</span></li>'; }).join('');
  }

  /* Anschlussfinanzierung (Block 5): Schritt 4 des Rechners. Rechenregeln in RECHNER.anschluss.
     Zinsen 4, 5, 6 % und ein eigener Wert; der Satz nennt 6 % oder den eigenen Wert. Die Miete bleibt unverändert (Annahme).
     Ampel wie im Ergebnissatz: Überschuss ab 0 grün; negativ, aber der Reinertrag deckt die Zinsen: gelb; sonst rot. */
  function anschlussZeigen(A, v) {
    var satz = $('r-an-satz'), tb = $('r-an-tabelle').querySelector('tbody');
    var eigenText = $('r-an-eigen').value.trim(), eigen = eigenText === '' ? null : wert('r-an-eigen');
    var modus = $('r-an-modus').value === 'rest' ? 'rest' : 'tilgung';
    function setze(art, zeichen, titel, klein) {
      satz.className = 'satz' + (art ? ' ' + art : '');
      satz.querySelector('.lampe').textContent = zeichen;
      var name = { gut: 'Ampel grün: ', warn: 'Ampel gelb: ', schlecht: 'Ampel rot: ' }[art] || '';
      $('r-an-satz-text').innerHTML = (name ? '<span class="sprung">' + name + '</span>' : '') + esc(titel);
      $('r-an-satz-klein').textContent = klein;
    }
    $('r-an-kasten').hidden = !A;
    if (!A) {
      wertDl('r-an-ergebnis', [{ t: 'Restschuld nach der Zinsbindung', w: '-' }, { t: 'x', w: '-' }]);
      tb.innerHTML = '';
      setze('leer', '?', 'Tragen Sie Kaufpreis und Kredit ein (Schritt 1 und 2), dann sehen Sie hier, was nach der Zinsbindung passiert.', 'Dazu zählt auch das Angebot A mit Zins, Tilgung und Zinsbindung.');
      return;
    }
    var bindMonate = Math.round(A.bindung * 12), bindText = String(A.bindung).replace('.', ',');
    var restMonate = isFinite(A.laufzeitMonate) ? A.laufzeitMonate - bindMonate : 0;
    var zinsen = [4, 5, 6];
    if (eigen !== null && zinsen.indexOf(eigen) < 0) zinsen.push(eigen);
    var satzZins = eigen !== null ? eigen : 6;
    if (zinsen.indexOf(satzZins) < 0) zinsen.push(satzZins);
    zinsen.sort(function (a, b) { return a - b; });
    var zeilen = zinsen.map(function (z) {
      var r = R.anschluss({ restschuld: A.restschuld, zinsProzent: z, tilgungProzent: A.tilgung, modus: modus, restMonate: restMonate });
      r.zins = z;
      r.bleibt = v && !r.fehler ? v.reinertragMonat - r.rate : null;
      return r;
    });
    function pct(z) { return String(z).replace('.', ',') + NB + '%'; }
    wertDl('r-an-ergebnis', [
      { t: 'Zinsbindung endet nach', w: bindText + NB + 'Jahren' },
      { t: 'Restschuld dann', w: euro(A.restschuld), haupt: true },
      { t: 'Rate heute (Angebot A)', w: euro(A.rate) }
    ]);
    tb.innerHTML = zeilen.map(function (r) {
      if (r.fehler) return '<tr><td data-titel="Anschlusszins">' + pct(r.zins) + '</td><td colspan="4">' + esc(r.fehler) + '</td></tr>';
      var diff = r.rate - A.rate;
      return '<tr><td data-titel="Anschlusszins">' + pct(r.zins) + (eigen !== null && r.zins === eigen && [4, 5, 6].indexOf(eigen) < 0 ? ' (Ihr Wert)' : '') + '</td>' +
        '<td class="z" data-titel="Neue Rate im Monat">' + euro(r.rate) + '</td>' +
        '<td class="z ' + (diff > 0.5 ? 'neg' : '') + '" data-titel="Unterschied zur Rate heute">' + (r.abbezahlt ? '-' : (diff >= 0 ? '+ ' : '− ') + euro(Math.abs(diff))) + '</td>' +
        '<td class="z ' + (r.bleibt === null ? '' : vorzeichenKlasse(r.bleibt)) + '" data-titel="Bleibt im Monat">' + (r.bleibt === null ? 'Miete fehlt' : euro(r.bleibt)) + '</td>' +
        '<td class="z" data-titel="Schuldenfrei nach">' + (r.abbezahlt ? 'schon abbezahlt' : monateText(bindMonate + r.laufzeitMonate)) + '</td></tr>';
    }).join('');
    var z = zeilen.filter(function (r) { return r.zins === satzZins; })[0];
    if (z.fehler) { setze('leer', '?', 'Nach ' + bindText + NB + 'Jahren sind noch ' + euro(A.restschuld) + ' offen.', z.fehler); return; }
    if (z.abbezahlt) {
      setze('gut', '✓', 'Nach ' + bindText + NB + 'Jahren ist der Kredit schon abbezahlt. Danach fällt keine Rate mehr an.', 'Die Zinsbindung ist so lang wie der ganze Kredit. Ein Anschlusszins spielt dann keine Rolle.');
      return;
    }
    var diffS = z.rate - A.rate;
    var rateText = diffS > 0.5 ? 'steigt die Rate auf ' : diffS < -0.5 ? 'sinkt die Rate auf ' : 'bleibt die Rate bei ';
    var titel = 'Nach ' + bindText + NB + 'Jahren sind noch ' + euro(A.restschuld) + ' offen. Bei ' + pct(satzZins) + ' Zins ' + rateText + euro(z.rate);
    var wie = modus === 'rest' ? 'Gerechnet mit gleicher Restlaufzeit' : 'Gerechnet mit gleicher Tilgung (' + pct(A.tilgung) + ' der Restschuld)';
    if (z.bleibt === null) {
      setze('leer', '?', titel + '.', wie + '. Für „Bleibt im Monat“ fehlt noch die Kaltmiete (Schritt 3).');
      return;
    }
    var art = z.bleibt >= 0 ? 'gut' : (v.reinertragMonat >= A.restschuld * satzZins / 1200 ? 'warn' : 'schlecht');
    setze(art, { gut: '✓', warn: '!', schlecht: '✕' }[art], titel + ', ' + (z.bleibt >= 0 ? 'es bleiben ' + euro(z.bleibt) + ' im Monat.' : 'es fehlen ' + euro(-z.bleibt) + ' im Monat.'),
      wie + ', Miete unverändert, vor Steuern. Eigene Einordnung, keine Kaufempfehlung.');
  }

  var GEB_ANNAHME = 75; /* Gebäudeanteil in %, solange keine Kaufpreisaufteilung gerechnet ist (Annahme) */
  var aufteilungAnteil = null; /* Gebäudeanteil in % aus Steuern sparen, Teil c; null = nicht gerechnet */
  var gebNochmal = false;
  function gebHinweis(quelle, anteil) {
    /* Herkunft des Gebäudeanteils in Schritt 5 (Rechner) und im Verkaufsrechner (Steuern sparen, Teil d) sichtbar machen */
    var a = anteil === null ? '' : fmt0.format(Math.round(anteil * 10) / 10);
    var link = '<a href="#steuern" data-ziel="steuern" data-anker="st-c">Kaufpreisaufteilung rechnen</a>';
    var t;
    if (anteil === null) t = '';
    else if (quelle === 'eigen') t = 'Gebäudeanteil ' + a + NB + '%: Ihre eigene Eingabe (sie hat Vorrang).';
    else if (quelle === 'aufteilung') t = 'Gebäudeanteil ' + a + NB + '%: aus Ihrer Kaufpreisaufteilung (Steuern sparen, Teil c). Ein eigener Wert im Feld „Gebäudeanteil“ hat Vorrang.';
    else t = '<span class="annahme">Annahme</span> Gebäudeanteil ' + a + NB + '%, genauer: ' + link + '.';
    $('r-gebanteil-quelle').innerHTML = t;
    $('st-d-geb-quelle').innerHTML = t ? 'Der Verkaufsrechner nimmt den Gebäudeanteil aus dem Rechner, Schritt 5. ' + t : '';
  }
  function rechne() {
    var preis = wert('r-preis'), notar = wert('r-notar'), makler = wert('r-makler');
    var zusatz = wert('r-zusatz'), ek = wert('r-ek');
    var land = satzVon($('r-land').value);
    var ok1 = preis !== null && preis > 0 && notar !== null && makler !== null && zusatz !== null && ek !== null && land;
    var nk = ok1 ? R.kaufnebenkosten(preis, land.satz, notar, makler) : null;
    var fin = ok1 ? R.finanzierung(preis, nk.summe, zusatz, ek) : null;
    wertDl('r-nk-ergebnis', [
      { t: 'Grunderwerbsteuer', w: nk ? euro(nk.grest) : '-' },
      { t: 'Notar und Grundbuch', w: nk ? euro(nk.notar) : '-' },
      { t: 'Makler', w: nk ? euro(nk.makler) : '-' },
      { t: 'Kaufnebenkosten gesamt', w: nk ? euro(nk.summe) : '-' },
      { t: 'Gesamtkosten', w: fin ? euro(fin.gesamt) : '-' },
      { t: 'Darlehen (Finanzierungsbedarf)', w: fin ? euro(fin.darlehen) : '-', haupt: true },
      { t: 'Finanzierungsquote zum Kaufpreis', w: fin ? prozent(fin.quote) : '-', haupt: true }
    ]);
    $('r-nk-formel').textContent = land
      ? 'Grunderwerbsteuer = Kaufpreis × ' + fmt1.format(land.satz) + ' % (' + land.land + '). Gesamtkosten = Kaufpreis + Nebenkosten + Renovierung. Darlehen = Gesamtkosten − Eigenkapital. Quote = Darlehen ÷ Kaufpreis; über 100 % heißt, die Bank finanziert auch Nebenkosten mit.'
      : '';
    if (land) {
      var q = land.amtlich ? D.grest.quelleAmtlich : D.grest.quelleSonst;
      $('r-nk-quelle').innerHTML = 'Steuersatz ' + esc(land.land) + ': ' + fmt1.format(land.satz) + NB + '%, gültig seit ' + esc(land.seit) +
        '. Quelle: <a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(q.name) + '</a>, geprüft am ' + datumDe(D.grest.geprueft) +
        (land.amtlich ? ' (amtlich).' : ' (nicht amtlich gegengeprüft, vor dem Kauf beim Finanzamt bestätigen).') +
        ' ' + esc(D.grest.notar.text);
    }

    var darlehen = fin ? fin.darlehen : null;
    var angebote = {};
    ['a', 'b', 'c'].forEach(function (x) {
      var k = kreditAngebot(x, darlehen);
      angebote[x] = k;
      $('r-rate-' + x).textContent = k ? euro(k.rate) : '-';
      $('r-rest-' + x).textContent = k ? euro(k.restschuld) : '-';
      $('r-zsum-' + x).textContent = k ? euro(k.zinsenBindung) : '-';
      $('r-lauf-' + x).textContent = k ? monateText(k.laufzeitMonate) : '-';
    });
    var A = angebote.a;
    var planBody = $('r-plan').querySelector('tbody');
    if (A && A.plan.length) {
      planBody.innerHTML = A.plan.map(function (j) {
        return '<tr><td data-titel="Jahr">' + j.jahr + '</td><td class="z" data-titel="Zinsen">' + euro(j.zinsen) + '</td><td class="z" data-titel="Tilgung">' + euro(j.tilgung) + '</td><td class="z" data-titel="Restschuld">' + euro(j.rest) + '</td></tr>';
      }).join('');
    } else {
      planBody.innerHTML = '<tr><td colspan="4">' + (A ? 'Keine Tilgung: Die Rate deckt nur die Zinsen, die Schuld bleibt stehen.' : 'Angebot A vollständig ausfüllen.') + '</td></tr>';
    }

    var flaeche = wert('r-flaeche'), miete = wert('r-miete'), nul = wert('r-nul'), rueck = wert('r-rueck'), ausfall = wert('r-ausfall');
    /* leeres Mietfeld heißt „noch nicht eingetragen“ (leseZahl liefert dafür 0): kein Ergebnis, kein Startwert */
    if ($('r-miete').value.trim() === '') miete = null;
    var ok3 = fin && miete !== null && nul !== null && rueck !== null && ausfall !== null && flaeche !== null;
    var v = ok3 ? R.vermietung({
      kaufpreis: preis, gesamtkosten: fin.gesamt, kaltmieteMonat: miete, mietausfallProzent: ausfall,
      nichtUmlagefaehigMonat: nul, ruecklageMonat: rueck * flaeche / 12, kreditrateMonat: A ? A.rate : 0
    }) : null;
    wertDl('r-verm-ergebnis', [
      { t: 'Bruttomietrendite', w: v ? prozent(v.bruttorendite) : '-' },
      { t: 'Kaufpreisfaktor', w: v ? faktor(v.kaufpreisfaktor) : '-' },
      { t: 'Nettomietrendite', w: v ? prozent(v.nettorendite) : '-' },
      { t: 'Kaltmiete pro m²', w: (ok3 && flaeche > 0) ? euro(miete / flaeche, true) : '-' },
      { t: 'Reinertrag pro Monat', w: v ? euro(v.reinertragMonat) : '-' },
      { t: 'Rate Angebot A', w: A ? euro(A.rate) : '-' },
      { t: 'Cashflow pro Monat vor Steuern', w: v ? euro(v.cashflowMonat) : '-', k: v ? vorzeichenKlasse(v.cashflowMonat) : '', haupt: true }
    ]);

    /* Stresstest */
    var stZins = Number($('r-st-zins').value), stMiete = Number($('r-st-miete').value), stAusfall = Number($('r-st-ausfall').value);
    $('r-st-zins-w').textContent = fmt2.format(stZins).replace(/,00$/, '').replace(/0$/, '');
    $('r-st-miete-w').textContent = stMiete;
    $('r-st-ausfall-w').textContent = stAusfall;
    var anschluss = A ? A.restschuld * (A.zins + stZins + A.tilgung) / 100 / 12 : null;
    var vs = ok3 ? R.vermietung({
      kaufpreis: preis, gesamtkosten: fin.gesamt, kaltmieteMonat: miete * (1 - stMiete / 100),
      mietausfallProzent: Math.min(100, ausfall + stAusfall), nichtUmlagefaehigMonat: nul,
      ruecklageMonat: rueck * flaeche / 12, kreditrateMonat: anschluss || 0
    }) : null;
    wertDl('r-stress-ergebnis', [
      { t: 'Cashflow heute', w: v ? euro(v.cashflowMonat) : '-', k: v ? vorzeichenKlasse(v.cashflowMonat) : '' },
      { t: 'Anschlussrate nach Zinsbindung', w: anschluss !== null ? euro(anschluss) : '-' },
      { t: 'Reinertrag im Stress', w: vs ? euro(vs.reinertragMonat) : '-' },
      { t: 'Cashflow im Stress', w: vs ? euro(vs.cashflowMonat) : '-', k: vs ? vorzeichenKlasse(vs.cashflowMonat) : '', haupt: true }
    ]);

    anschlussZeigen(A, v);

    /* Schritt 5: langfristig und Steuer (R.langfrist), Angebot A mit gleicher Rate bis zur Tilgung */
    var ms = wert('r-ms'), ks = wert('r-ks'), ws = wert('r-ws'), nJahre = wert('r-jahre');
    var baujahr = $('r-baujahr').value.trim() === '' ? null : wert('r-baujahr');
    /* Gebäudeanteil: eigene Eingabe geht vor, sonst das Ergebnis der Kaufpreisaufteilung (Steuern sparen, Teil c), sonst die Annahme 75 % */
    var gebEigen = $('r-gebanteil').value.trim() !== '';
    var gebQuelle = gebEigen ? 'eigen' : (aufteilungAnteil !== null ? 'aufteilung' : 'annahme');
    var gebAnteil = gebEigen ? wert('r-gebanteil') : (aufteilungAnteil !== null ? aufteilungAnteil : GEB_ANNAHME);
    var steuersatz = wert('r-steuersatz');
    gebHinweis(gebQuelle, gebAnteil);
    var ok5 = v && A && ms !== null && ks !== null && ws !== null && nJahre !== null && gebAnteil !== null && steuersatz !== null &&
      !($('r-baujahr').value.trim() !== '' && baujahr === null);
    var afa = R.afaSatz(baujahr);
    var lf = ok5 ? R.langfrist({
      kaufpreis: preis, nebenkosten: nk.summe, ek: ek, darlehen: darlehen, zinsProzent: A.zins, plan: A.plan,
      kaltmieteMonat: miete, ausfallProzent: ausfall, kostenMonat: nul, ruecklageMonat: rueck * flaeche / 12,
      mietsteigerung: ms, kostensteigerung: ks, wertsteigerung: ws, jahre: nJahre,
      gebaeudeanteil: gebAnteil, afaSatz: afa, steuersatz: steuersatz
    }) : null;
    var lfEnde = lf ? lf.jahre[lf.jahre.length - 1] : null;
    wertDl('r-kennzahlen', [
      { t: 'Preis je m² Wohnfläche', w: (fin && flaeche > 0) ? euro(preis / flaeche) : '-' },
      { t: 'Kaufpreisfaktor (Preis ÷ Jahresmiete)', w: v ? faktor(v.kaufpreisfaktor) : '-' },
      { t: 'Eigenkapitalrendite im 1. Jahr', w: lf ? (lf.ekRendite === null ? 'ohne eigenes Geld nicht berechenbar' : prozent(lf.ekRendite)) : '-' },
      { t: 'Schuldendienstdeckung', w: lf && lf.dscr !== null ? fmt2.format(lf.dscr) : '-' },
      { t: 'Schuldenfrei nach (Angebot A)', w: A ? monateText(A.laufzeitMonate) : '-' },
      { t: 'Vermögen im Haus nach ' + (lf ? lf.jahre.length : '…') + ' Jahren', w: lfEnde ? euro(lfEnde.vermoegen) : '-', haupt: true }
    ]);
    var j1 = lf ? lf.jahre[0] : null;
    wertDl('r-steuer-ergebnis', [
      { t: 'Abschreibung (AfA) pro Jahr', w: lf ? euro(lf.afaJahr) + ' (' + fmt1.format(afa) + NB + '%)' : '-' },
      { t: 'Einkünfte aus Vermietung, 1. Jahr', w: j1 ? euro(j1.einkuenfte) : '-', k: j1 ? vorzeichenKlasse(j1.einkuenfte) : '' },
      { t: j1 && j1.steuer < 0 ? 'Steuerersparnis, 1. Jahr' : 'Steuer darauf, 1. Jahr', w: j1 ? euro(Math.abs(j1.steuer)) : '-' },
      { t: 'Bleibt im Monat vor Steuern', w: j1 ? euro(j1.vorSteuer / 12) : '-', k: j1 ? vorzeichenKlasse(j1.vorSteuer) : '' },
      { t: 'Bleibt im Monat nach Steuern', w: j1 ? euro(j1.nachSteuer / 12) : '-', k: j1 ? vorzeichenKlasse(j1.nachSteuer) : '', haupt: true }
    ]);
    $('r-steuer-formel').textContent = 'AfA = (Kaufpreis + Kaufnebenkosten) × Gebäudeanteil × AfA-Satz' + (baujahr === null ? ' (ohne Baujahr mit 2 % gerechnet)' : '') +
      '. Einkünfte = Miete − Mietausfall − nicht umlagefähige Kosten − Zinsen − AfA. Die Rücklage zählt erst, wenn das Geld für Reparaturen ausgegeben wird. Steuer = Einkünfte × Ihr Steuersatz; sind die Einkünfte negativ, sinkt Ihre Steuer auf anderes Einkommen. Nach Steuern = vor Steuern − Steuer.';
    $('r-langfrist-tabelle').querySelector('tbody').innerHTML = lf ? lf.jahre.map(function (j) {
      return '<tr><td data-titel="Jahr">' + j.jahr + '</td><td class="z" data-titel="Miete">' + euro(j.miete) + '</td><td class="z ' + vorzeichenKlasse(j.vorSteuer) + '" data-titel="Bleibt vor Steuern">' + euro(j.vorSteuer) + '</td>' +
        '<td class="z" data-titel="Steuer">' + euro(j.steuer) + '</td><td class="z ' + vorzeichenKlasse(j.nachSteuer) + '" data-titel="Bleibt nach Steuern">' + euro(j.nachSteuer) + '</td>' +
        '<td class="z" data-titel="Restschuld">' + euro(j.rest) + '</td><td class="z" data-titel="Hauswert">' + euro(j.wert) + '</td><td class="z" data-titel="Vermögen im Haus">' + euro(j.vermoegen) + '</td></tr>';
    }).join('') : '<tr><td colspan="8">Schritte 1 bis 3 und Angebot A vollständig ausfüllen.</td></tr>';
    $('ch-vermoegen-text').textContent = lfEnde
      ? 'Nach ' + lfEnde.jahr + ' Jahren: Hauswert ' + euro(lfEnde.wert) + ', Restschuld ' + euro(lfEnde.rest) + ', Vermögen im Haus ' + euro(lfEnde.vermoegen) +
        '. Zusammengezählt blieben in dieser Zeit ' + euro(lfEnde.kumNachSteuer) + ' nach Steuern übrig' + (lfEnde.kumNachSteuer < 0 ? ' (das heißt: so viel müssen Sie insgesamt zuschießen)' : '') + '. Annahmen, keine Vorhersage; Zinsänderung nach der Zinsbindung siehe Schritt 4.'
      : '';

    stand = { preis: preis, notar: notar, ek: ek, A: A, nul: nul, rueck: rueck, ausfall: ausfall };
    /* Grundlage für „Steuern sparen“ (Verkaufsrechner, Kaufpreisaufteilung): Eingaben von langfrist() ohne Steuersatz, Jahre und Wertsteigerung */
    stand.nebenkosten = nk ? nk.summe : null;
    stand.gebAnteil = gebAnteil;
    stand.gebQuelle = gebQuelle;
    stand.ekEingesetzt = fin ? Math.min(ek, fin.gesamt) : 0;
    stand.lfBasis = ok5 ? {
      kaufpreis: preis, nebenkosten: nk.summe, ek: ek, darlehen: darlehen, zinsProzent: A.zins, plan: A.plan,
      kaltmieteMonat: miete, ausfallProzent: ausfall, kostenMonat: nul, ruecklageMonat: rueck * flaeche / 12,
      mietsteigerung: ms, kostensteigerung: ks, gebaeudeanteil: gebAnteil
    } : null;

    /* Kennzahlen im Rechner und auf der Startseite; Euro-Beträge zählen beim Ändern sichtbar mit */
    kachel(['k-darlehen', 'ue-darlehen'], fin ? euro(fin.darlehen) : '-', '', fin ? prozent(fin.quote) + ' vom Kaufpreis' : '');
    kachel(['k-rate', 'ue-rate'], A ? euro(A.rate) : '-');
    kachel(['k-cashflow', 'ue-cashflow'], v && A ? euro(v.cashflowMonat) : '-', v && A ? vorzeichenKlasse(v.cashflowMonat) : '');
    kachel(['k-rendite', 'ue-rendite'], v ? prozent(v.bruttorendite) : '-');
    ergebnisSatz(fin, A, v, miete !== null);
    ergebnisListen(fin, A, v, { miete: miete, ausfall: ausfall, nul: nul, rueck: rueck, flaeche: flaeche, notar: notar });

    /* Daten für die Diagramme merken, gezeichnet wird in zeichneGrafiken() */
    grafikDaten = {
      mittel: fin ? { kaufpreis: preis, nebenkosten: nk.summe, zusatz: zusatz, ek: Math.min(ek, fin.gesamt), darlehen: fin.darlehen, gesamt: fin.gesamt } : null,
      angebote: angebote,
      darlehen: darlehen,
      wasserfall: v ? [
        { name: 'Kaltmiete', wert: miete, summe: true },
        { name: 'Mietausfall', wert: -miete * ausfall / 100 },
        { name: 'Nicht umlagefähig', wert: -nul },
        { name: 'Rücklage', wert: -rueck * flaeche / 12 },
        { name: 'Kreditrate A', wert: -(A ? A.rate : 0) },
        { name: 'Cashflow', wert: v.cashflowMonat, summe: true }
      ] : null,
      langfrist: lf
    };
    zeichneGrafiken();

    stand.flaecheRechner = flaeche;
    stand.mieteRechner = miete;
    /* Grundlage der Bank-Mappe aus dem Rechner (Block 5) */
    stand.rechner = { preis: preis, nk: nk, fin: fin, zusatz: zusatz, ek: ek, A: A, v: v, miete: miete, flaeche: flaeche, land: land ? land.land : '',
      notar: notar, makler: makler, ausfall: ausfall, nul: nul, rueck: rueck, baujahr: $('r-baujahr').value.trim() };
    rechneMonteur();
    rechneWert();
    rechneUmbau();
    rechneSteuer();
    /* Hat die Kaufpreisaufteilung (Teil c) einen anderen Gebäudeanteil geliefert als Schritt 5 benutzt hat, einmal neu rechnen */
    var neuAnteil = stand.steuerC ? stand.steuerC.gebaeudeanteil : null;
    if (neuAnteil !== aufteilungAnteil) {
      aufteilungAnteil = neuAnteil;
      if (!gebNochmal) {
        gebNochmal = true;
        try { rechne(); } finally { gebNochmal = false; }
        return;
      }
    }
    zeigeMerkliste();
  }

  /* ---------- Umbau ---------- */
  var SAN = D.sanierung || { bauteile: [], foerderung: [], ablauf: [], zuschlaege: {} };
  (function () {
    /* Bauteile als Karten: Menge sichtbar, Preis hinter „Preis ändern“; vier häufige Bauteile zuerst, die übrigen unter „Mehr Einstellungen“ */
    function bauteilZeile(b) {
      return '<tr><th scope="row">' + esc(b.name) + '<div class="klein">je ' + esc(b.einheit) + '</div>' + (b.kurz ? '<small class="kurz">' + esc(b.kurz) + '</small>' : '') + '</th>' +
        '<td data-titel="Menge"><input type="text" id="u-m-' + b.id + '" inputmode="decimal" value="" placeholder="0" aria-label="Menge ' + esc(b.name) + ' in ' + esc(b.einheit) + '"><div class="fehler" id="u-m-' + b.id + '-f"></div></td>' +
        '<td data-titel="Preis je Einheit"><details class="preis"><summary>Preis ändern <span id="u-ps-' + b.id + '">(' + fmt0.format(b.start) + NB + '€)</span></summary>' +
        '<input type="text" id="u-p-' + b.id + '" inputmode="decimal" value="' + fmt0.format(b.start) + '" aria-label="Preis je ' + esc(b.einheit) + ' für ' + esc(b.name) + '"><div class="fehler" id="u-p-' + b.id + '-f"></div></details></td>' +
        '<td class="z" data-titel="Summe" id="u-s-' + b.id + '">-</td>' +
        '<td data-titel="Spanne" class="klein">' + fmt0.format(b.von) + ' bis ' + fmt0.format(b.bis) + NB + '€; ' + esc(b.quelle) + '</td></tr>';
    }
    $('u-tabelle').querySelector('tbody').innerHTML = SAN.bauteile.filter(function (b) { return b.haupt; }).map(bauteilZeile).join('');
    $('u-tabelle-mehr').querySelector('tbody').innerHTML = SAN.bauteile.filter(function (b) { return !b.haupt; }).map(bauteilZeile).join('');
    $('u-foerder-tabelle').querySelector('tbody').innerHTML = SAN.foerderung.map(function (f) {
      var pruefen = /vor Nutzung|unsicher/.test(f.status);
      return '<tr><th scope="row"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a>' + (f.kurz ? '<small class="kurz">' + esc(f.kurz) + '</small>' : '') + '</th>' +
        '<td data-titel="Höhe">' + esc(f.hoehe) + '</td><td data-titel="Für Vermieter">' + esc(f.vermieter) + '</td><td data-titel="Antrag">' + esc(f.vorher) + '</td>' +
        (f.bindung ? '<td data-titel="Bindungen">' + esc(f.bindung) + '</td>' : '') +
        '<td data-titel="Quelle und Stand" class="klein">' + (pruefen ? '<span class="annahme">Vor Nutzung prüfen</span> ' : '') + esc(f.status) + '</td></tr>';
    }).join('');
    $('u-ablauf').innerHTML = SAN.ablauf.map(function (a, i) {
      return '<li data-n="' + (i + 1) + '"><strong>' + esc(a.schritt) + '</strong><span class="klein">' + esc(a.inhalt) + ' Wer: ' + esc(a.wer) + '.' + (a.quelle ? ' Quelle: ' + esc(a.quelle) + '.' : '') + '</span></li>';
    }).join('');
    var z = SAN.zuschlaege;
    $('u-zuschlag-quelle').textContent = [z.planung, z.baustelle, z.puffer].filter(Boolean).map(function (x) { return x.text; }).join('. ') + '. Startwerte sind Annahmen.';
    SAN.bauteile.forEach(function (b) { zahlFeld('u-m-' + b.id, 0, 1000000); zahlFeld('u-p-' + b.id, 0, 10000000); });
    /* erst jetzt existieren alle Felder des Umbau-Formulars: merken und wiederherstellen */
    Array.prototype.forEach.call(document.querySelectorAll('#u-form input'), function (el) {
      if (Object.prototype.hasOwnProperty.call(gemerkt, el.id)) {
        if (el.type === 'checkbox') el.checked = gemerkt[el.id] === 'true'; else el.value = gemerkt[el.id];
      }
      merkFelder.push(el);
    });
  })();
  zahlFeld('u-planung', 0, 100, '%'); zahlFeld('u-baustelle', 0, 100, '%'); zahlFeld('u-puffer', 0, 100, '%'); zahlFeld('u-foerder', 0, 100000000);
  zahlFeld('u-anteil', 0, 100, '%'); zahlFeld('u-wfl', 0, 100000); zahlFeld('u-miete-alt', 0, 10000000); zahlFeld('u-rnd-neu', 0, 200, 'Jahre');
  ['u-planung', 'u-baustelle', 'u-puffer', 'u-foerder', 'u-anteil', 'u-wfl', 'u-miete-alt', 'u-rnd-neu'].concat(
    SAN.bauteile.reduce(function (a, b) { return a.concat(['u-m-' + b.id, 'u-p-' + b.id]); }, [])
  ).forEach(function (id) { $(id).addEventListener('blur', function () { pruefeFeld(id, true); }); });

  var umbauGrafik = null;
  /* Ergebnissatz des Umbaus: erst mit Menge (Kosten), dann mit Wohnfläche und Miete (Mehrmiete), dann mit dem Wert (Wertzuwachs).
     Neutral ohne Ampel (keine Kaufempfehlung, R078); im Wartezustand „satz leer“ mit dem, was fehlt. */
  function umbauSatz(d) {
    var art = 'leer', zeichen = '?', titel, klein, mu = d.mu;
    if (!d.ok) {
      titel = 'Mindestens ein Feld enthält noch keine gültige Zahl.';
      klein = 'Prüfen Sie die Eingaben; dann steht hier, was der Umbau kostet und bringt.';
    } else if (!(d.gesamt > 0)) {
      titel = 'Tragen Sie bei mindestens einem Bauteil die Menge ein.';
      klein = 'Dann steht hier, was der Umbau kostet, wie viel Mehrmiete er bringen darf und wie viel er das Haus wertvoller macht.';
    } else {
      var kosten = 'Der Umbau kostet etwa ' + euro(d.gesamt) + (d.netto < d.gesamt ? ' (nach Förderung ' + euro(d.netto) + ')' : '');
      if (!mu) {
        var fehlt = [];
        if (!(d.wfl > 0)) fehlt.push('die Wohnfläche');
        if (!(d.mieteAlt > 0)) fehlt.push('die heutige Kaltmiete');
        titel = kosten + '.';
        klein = 'Für die mögliche Mehrmiete fehlt noch ' + (fehlt.length ? fehlt.join(' und ') : 'eine Angabe') + ' (Schritt 3 oder im Rechner).';
      } else {
        art = ''; zeichen = '≈';
        if (d.zuwachs === null) {
          titel = kosten + ' und darf bis zu ' + euro(mu.monat) + ' Mehrmiete im Monat bringen.';
          klein = 'Der Wertzuwachs fehlt noch: Füllen Sie zuerst „Was ist das Haus wert?“ aus. Mehrmiete nach der Modernisierungsumlage (§ 559 BGB)' + (mu.gekappt ? ', hier gekappt' : '') + '.';
        } else {
          titel = kosten + ', darf bis zu ' + euro(mu.monat) + ' Mehrmiete im Monat bringen und ' + (d.zuwachs >= 0 ? 'steigert den Wert um etwa ' : 'senkt den Wert um etwa ') + euro(Math.abs(d.zuwachs)) + '.';
          klein = 'Mehrmiete nach der Modernisierungsumlage (§ 559 BGB)' + (mu.gekappt ? ', hier gekappt' : '') + '; Wertzuwachs = Ertragswert nachher minus vorher. Eigene Schätzung, keine Kaufempfehlung.';
        }
      }
    }
    $('u-satz').className = 'satz' + (art ? ' ' + art : '');
    $('u-satz').querySelector('.lampe').textContent = zeichen;
    $('u-satz-text').textContent = titel;
    $('u-satz-klein').textContent = klein;
  }
  function rechneUmbau() {
    var summe = 0, ok = true;
    SAN.bauteile.forEach(function (b) {
      var m = wert('u-m-' + b.id), p = wert('u-p-' + b.id);
      if (p !== null) $('u-ps-' + b.id).textContent = '(' + euro(p) + ')';
      if (m === null || p === null) { ok = false; $('u-s-' + b.id).textContent = '-'; return; }
      $('u-s-' + b.id).textContent = m > 0 ? euro(m * p) : '-';
      summe += m * p;
    });
    var pl = wert('u-planung'), bs = wert('u-baustelle'), pu = wert('u-puffer'), fo = wert('u-foerder');
    ok = ok && pl !== null && bs !== null && pu !== null && fo !== null;
    var gesamt = ok ? summe * (1 + (pl + bs + pu) / 100) : null;
    var netto = ok ? Math.max(0, gesamt - fo) : null;
    wertDl('u-kosten-ergebnis', [
      { t: 'Summe Bauteile', w: ok ? euro(summe) : '-' },
      { t: 'Planung', w: ok ? euro(summe * pl / 100) : '-' },
      { t: 'Baustelle und Entsorgung', w: ok ? euro(summe * bs / 100) : '-' },
      { t: 'Puffer', w: ok ? euro(summe * pu / 100) : '-' },
      { t: 'Gesamtkosten', w: ok ? euro(gesamt) : '-', haupt: true },
      { t: 'Nach Förderung', w: ok ? euro(netto) : '-', haupt: true }
    ]);
    $('uk-gesamt').textContent = ok && gesamt > 0 ? euro(gesamt) : '-';
    $('uk-netto').textContent = ok && gesamt > 0 ? euro(netto) : '-';

    var anteil = wert('u-anteil'), rndNeu = wert('u-rnd-neu');
    var wfl = $('u-wfl').value.trim() ? wert('u-wfl') : stand.flaecheRechner;
    var mieteAlt = $('u-miete-alt').value.trim() ? wert('u-miete-alt') : stand.mieteRechner;
    var mu = ok && anteil !== null && wfl > 0 && mieteAlt > 0 && gesamt > 0 ? R.modernisierungsumlage({
      kosten: gesamt, anteilModernisierungProzent: anteil, wohnflaeche: wfl, mieteAltJeM2: mieteAlt / wfl, nurHeizung: $('u-heizung').checked
    }) : null;
    /* Ertragswert vorher/nachher mit den Daten der Wertermittlung */
    var w = stand.wertBasis, ewVor = null, ewNach = null;
    if (mu && w) {
      var basis = { wohnungen: w.we, wohnflaeche: wfl, verwaltungJeWE: w.verw, instandJeM2: w.inst, ausfallProzent: w.ausfall,
        betriebskostenJahr: w.betrieb, bodenwert: w.bodenwert, lzProzent: w.lz };
      ewVor = R.ertragswert(Object.assign({}, basis, { mieteMonat: mieteAlt, rnd: w.rnd }));
      ewNach = R.ertragswert(Object.assign({}, basis, { mieteMonat: mieteAlt + mu.monat, rnd: rndNeu > 0 ? rndNeu : w.rnd }));
    }
    var zuwachs = ewVor && ewNach ? ewNach.allgemein - ewVor.allgemein : null;
    wertDl('u-wert-ergebnis', [
      { t: 'Umlagefähige Kosten', w: mu ? euro(mu.umlagefaehig) : '-' },
      { t: '8 % pro Jahr ÷ 12', w: mu ? euro(mu.monatOhneKappung) : '-' },
      { t: 'Kappung (' + (mu ? fmt2.format(mu.kappungSatz) : '-') + ' € je m²)', w: mu ? euro(mu.kappungMonat) : '-' },
      { t: 'Mehrmiete pro Monat', w: mu ? euro(mu.monat) + (mu.gekappt ? ' (gekappt)' : '') : '-', haupt: true },
      { t: 'Rendite des Umbaus', w: mu && netto > 0 ? prozent(mu.monat * 12 / netto * 100) : '-' },
      { t: ewVor ? 'Ertragswert vorher' : 'Ertragswert vorher (erst „Was ist das Haus wert?“ ausfüllen)', w: ewVor ? euro(ewVor.allgemein) : '-' },
      { t: 'Ertragswert nachher', w: ewNach ? euro(ewNach.allgemein) : '-' },
      { t: 'Wertzuwachs', w: zuwachs !== null ? euro(zuwachs) : '-', haupt: true, k: zuwachs !== null ? vorzeichenKlasse(zuwachs - (netto || 0)) : '' }
    ]);
    $('uk-miete').textContent = mu ? euro(mu.monat) : '-';
    $('uk-wert').textContent = zuwachs !== null ? euro(zuwachs) : '-';
    umbauSatz({ ok: ok && anteil !== null, gesamt: gesamt, netto: netto, mu: mu, zuwachs: zuwachs, wfl: wfl, mieteAlt: mieteAlt });
    /* Steuer-Tipp: die 15-%-Grenze gilt nur in den ersten drei Jahren nach dem Kauf */
    stand.umbauGesamt = ok && gesamt > 0 ? gesamt : 0;
    $('u-steuer-text').textContent = stand.umbauGesamt > 0
      ? 'Ihre Umbaukosten von etwa ' + euro(stand.umbauGesamt) + ' zählen zur 15-Prozent-Grenze, wenn Sie innerhalb von drei Jahren nach dem Kauf umbauen: Übersteigen die Kosten (ohne Umsatzsteuer) 15 % der Anschaffungskosten des Gebäudes, sind sie nur über die Abschreibung absetzbar. Liegt der Kauf länger als drei Jahre zurück, gilt die Grenze nicht.'
      : 'Renovieren Sie in den ersten drei Jahren nach dem Kauf, zählt die 15-Prozent-Grenze: Teure Modernisierungen sind dann nur über die Abschreibung absetzbar. Tragen Sie die Mengen ein, dann steht hier Ihre Summe.';
    umbauGrafik = ok && gesamt > 0 && zuwachs !== null ? { zeilen: [
      { name: 'Kosten nach Förderung', gesamt: netto },
      { name: 'Wertzuwachs', gesamt: Math.max(0, zuwachs) }
    ], kaufpreis: 0 } : null;
    zeichneUmbauGrafik();
  }
  function zeichneUmbauGrafik() {
    if (!window.GRAFIK || $('umbau').hidden) return;
    if (umbauGrafik) {
      window.GRAFIK.werte($('ch-umbau'), $('ch-umbau-legende'), umbauGrafik);
      $('ch-umbau-legende').innerHTML = '<span>Kosten nach Förderung gegen Wertzuwachs laut Ertragswert. Liegt der Zuwachs über den Kosten, trägt sich der Umbau rechnerisch über den Wert.</span>';
    } else { $('ch-umbau').innerHTML = ''; $('ch-umbau-legende').innerHTML = ''; }
  }

  /* ---------- Wertermittlung ---------- */
  var NHK = { '4.1': [825, 985, 1190], '4.2': [765, 915, 1105], '4.3': [755, 900, 1090], '5.1': [860, 1085, 1375] }; /* Anlage 4 ImmoWertV, Stufe 3/4/5 */
  var wertGrafik = null;
  function rechneWert() {
    stand.wertBasis = null;
    stand.sachParam = null;
    stand.wertBoden = null;
    var f = {};
    ['w-grund', 'w-brw', 'w-baujahr', 'w-stichjahr', 'w-gnd', 'w-wfl', 'w-we', 'w-miete', 'w-verw', 'w-inst', 'w-ausfall', 'w-betrieb', 'w-lz',
      'w-bgf', 'w-bpi', 'w-rf', 'w-aussen', 'w-swf', 'w-besonders', 'w-vgl'].forEach(function (id) { f[id] = wert(id); });
    var rndEigen = wert('w-rnd');
    var allesOk = Object.keys(f).every(function (k) { return f[k] !== null; }) && rndEigen !== null;
    stand.wert = allesOk ? { stichjahr: f['w-stichjahr'], gnd: f['w-gnd'], verw: f['w-verw'], inst: f['w-inst'], ausfall: f['w-ausfall'], lz: f['w-lz'] } : null;
    var kauf = stand.preis > 0 ? stand.preis : null;
    $('wk-kauf').textContent = kauf ? euro(kauf) : '-';
    if (!allesOk) {
      ['wk-boden', 'wk-ertrag', 'wk-sach', 'wk-vergleich'].forEach(function (id) { $(id).textContent = '-'; }); wertGrafik = null;
      wertSatz('leer', '?', 'Mindestens ein Feld enthält noch keine gültige Zahl.', 'Prüfen Sie die Eingaben; dann steht hier eine Schätzung, was das Haus wert ist.');
      return;
    }
    $('w-lz-wert').textContent = fmt1.format(f['w-lz']).replace(/,0$/, '');

    var bodenwert = f['w-grund'] * f['w-brw'];
    var hatBau = f['w-baujahr'] > 0;
    var rnd = hatBau || rndEigen > 0 ? R.restnutzungsdauer(f['w-baujahr'], f['w-stichjahr'], f['w-gnd'], rndEigen > 0 ? rndEigen : '') : null;
    wertDl('w-grund-ergebnis', [
      { t: 'Bodenwert', w: bodenwert > 0 ? euro(bodenwert) : '-', haupt: true },
      { t: 'Alter am Stichtag', w: hatBau ? fmt0.format(f['w-stichjahr'] - f['w-baujahr']) + NB + 'Jahre' : '-' },
      { t: 'Restnutzungsdauer', w: rnd !== null ? fmt0.format(rnd) + NB + 'Jahre' + (rndEigen > 0 ? ' (eigene)' : '') : '-' }
    ]);
    var rh = $('w-rnd-hinweis');
    rh.hidden = !(rnd !== null && rnd < 20 && !(rndEigen > 0));
    rh.textContent = 'Die berechnete Restnutzungsdauer ist kurz (' + (rnd === null ? 0 : fmt0.format(rnd)) + ' Jahre). Wurde das Gebäude modernisiert (Dach, Fenster, Leitungen, Heizung, Bäder, Dämmung), verlängert sie sich. Tragen Sie dann unter „Mehr Einstellungen“ die Restnutzungsdauer selbst ein, am besten nach Rücksprache mit einem Sachverständigen.';

    stand.wertBasis = rnd !== null ? { we: f['w-we'], verw: f['w-verw'], inst: f['w-inst'], ausfall: f['w-ausfall'], betrieb: f['w-betrieb'],
      bodenwert: bodenwert, lz: f['w-lz'], rnd: rnd } : null;
    var ew = (rnd !== null && f['w-miete'] > 0) ? R.ertragswert({
      mieteMonat: f['w-miete'], wohnungen: f['w-we'], wohnflaeche: f['w-wfl'], verwaltungJeWE: f['w-verw'], instandJeM2: f['w-inst'],
      ausfallProzent: f['w-ausfall'], betriebskostenJahr: f['w-betrieb'], bodenwert: bodenwert, lzProzent: f['w-lz'], rnd: rnd
    }) : null;
    wertDl('w-ertrag-ergebnis', ew ? [
      { t: 'Jahresrohertrag', w: euro(ew.rohertrag) },
      { t: 'Bewirtschaftungskosten', w: euro(ew.bewirtschaftung) },
      { t: 'Reinertrag', w: euro(ew.reinertrag) },
      { t: 'Bodenwertverzinsung', w: euro(ew.bodenwertverzinsung) },
      { t: 'Kapitalisierungsfaktor', w: fmt2.format(ew.kf) },
      { t: 'Gebäudeertragswert', w: euro(ew.gebaeudeAllgemein) },
      { t: 'Ertragswert (allgemein)', w: euro(ew.allgemein), haupt: true },
      { t: 'Ertragswert (vereinfacht)', w: euro(ew.vereinfacht) }
    ] : [{ t: 'Ertragswert (Miete oder Baujahr fehlt)', w: '-' }]);

    var nhkWert = NHK[$('w-art').value][Number($('w-stufe').value) - 3];
    /* für „Steuern sparen“, Kaufpreisaufteilung: Parameter der Sachwert-Rechnung ohne Brutto-Grundfläche */
    stand.wertBoden = { grund: f['w-grund'], brw: f['w-brw'], bgf: f['w-bgf'] };
    stand.sachParam = rnd !== null ? {
      nhk: nhkWert, korrWohnung: Number($('w-korr-wg').value), korrGrundriss: Number($('w-korr-gr').value), baupreisindex: f['w-bpi'],
      regionalfaktor: f['w-rf'], gnd: f['w-gnd'], rnd: rnd, aussenProzent: f['w-aussen']
    } : null;
    var sw = (rnd !== null && f['w-bgf'] > 0) ? R.sachwert({
      nhk: nhkWert, korrWohnung: Number($('w-korr-wg').value), korrGrundriss: Number($('w-korr-gr').value), baupreisindex: f['w-bpi'],
      bgf: f['w-bgf'], regionalfaktor: f['w-rf'], gnd: f['w-gnd'], rnd: rnd, aussenProzent: f['w-aussen'], bodenwert: bodenwert,
      sachwertfaktor: f['w-swf'], besondere: f['w-besonders']
    }) : null;
    wertDl('w-sach-ergebnis', sw ? [
      { t: 'NHK 2010 korrigiert', w: euro(sw.nhkKorrigiert) + ' je m²' },
      { t: 'Herstellungskosten heute', w: euro(sw.herstellungskosten) },
      { t: 'Alterswertminderungsfaktor', w: fmt2.format(sw.alterswertminderungsfaktor) },
      { t: 'Gebäudesachwert', w: euro(sw.gebaeude) },
      { t: 'Vorläufiger Sachwert', w: euro(sw.vorlaeufig) },
      { t: 'Sachwert', w: euro(sw.sachwert), haupt: true }
    ] : [{ t: 'Sachwert (Brutto-Grundfläche oder Baujahr fehlt)', w: '-' }]);

    var vgl = f['w-vgl'] > 0 && f['w-wfl'] > 0 ? f['w-vgl'] * f['w-wfl'] : null;
    wertDl('w-vgl-ergebnis', [{ t: vgl ? 'Vergleichswert' : 'Vergleichswert (Preis je m² und Wohnfläche fehlen)', w: vgl ? euro(vgl) : '-', haupt: !!vgl }]);

    $('wk-boden').textContent = bodenwert > 0 ? euro(bodenwert) : '-';
    $('wk-ertrag').textContent = ew ? euro(ew.allgemein) : '-';
    $('wk-sach').textContent = sw ? euro(sw.sachwert) : '-';
    $('wk-vergleich').textContent = vgl ? euro(vgl) : '-';

    var zeilen = [];
    if (ew) zeilen.push({ name: 'Ertragswert', boden: bodenwert, gebaeude: ew.allgemein - bodenwert });
    if (sw) zeilen.push({ name: 'Sachwert', boden: bodenwert, gebaeude: sw.sachwert - bodenwert });
    if (vgl) zeilen.push({ name: 'Vergleichswert', gesamt: vgl });
    wertGrafik = zeilen.length ? { zeilen: zeilen, kaufpreis: kauf || 0 } : null;
    var fazit = '';
    if (ew && kauf) {
      var abw = (kauf / ew.allgemein - 1) * 100;
      fazit = 'Der Kaufpreis liegt ' + fmt1.format(Math.abs(abw)) + NB + '% ' + (abw >= 0 ? 'über' : 'unter') + ' dem errechneten Ertragswert. ' +
        'Eigene Einordnung mit den Annahmen oben, keine Kaufempfehlung; schon 0,5 Prozentpunkte beim Liegenschaftszins verschieben den Wert deutlich.';
    }
    $('w-fazit').textContent = fazit;
    /* großer Satz oben, neutral ohne Ampel (keine Kaufempfehlung, R078) */
    /* genug Angaben = alles, was der Ertragswert braucht; sonst Wartesatz mit den fehlenden Angaben */
    var fehlt = [];
    if (!(f['w-grund'] > 0)) fehlt.push('Grundstücksfläche');
    if (!(f['w-brw'] > 0)) fehlt.push('Bodenrichtwert');
    if (!hatBau && !(rndEigen > 0)) fehlt.push('Baujahr');
    if (!(f['w-wfl'] > 0)) fehlt.push('Wohnfläche');
    if (!(f['w-we'] > 0)) fehlt.push('Zahl der Wohnungen');
    if (!(f['w-miete'] > 0)) fehlt.push('Kaltmiete');
    if (ew && !fehlt.length) {
      wertSatz('', '≈', 'Nach dieser Schätzung ist das Haus etwa ' + euro(ew.allgemein) + ' wert.',
        (kauf
          ? 'Der Kaufpreis liegt ' + fmt1.format(Math.abs((kauf / ew.allgemein - 1) * 100)) + NB + '% ' + (kauf >= ew.allgemein ? 'darüber' : 'darunter') + '. '
          : 'Tragen Sie im Rechner einen Kaufpreis ein, dann steht hier der Vergleich. ') +
        'Ertragswert mit Liegenschaftszins ' + fmt1.format(f['w-lz']).replace(/,0$/, '') + NB + '% (Annahme, Schritt 3); schon ein halber Prozentpunkt verschiebt den Wert deutlich. Eigene Schätzung, kein Gutachten.');
    } else {
      wertSatz('leer', '?', 'Tragen Sie noch ein: ' + (fehlt.length ? fehlt.join(', ') : 'Miete und Baujahr') + '.',
        'Dann steht hier eine Schätzung, was das Haus wert ist. Der Knopf „Werte aus dem Rechner übernehmen“ (Schritt 1) füllt schon einiges aus.');
    }
    zeichneWertGrafik();
  }
  function wertSatz(art, zeichen, titel, klein) {
    $('w-satz').className = 'satz' + (art ? ' ' + art : '');
    $('w-satz').querySelector('.lampe').textContent = zeichen;
    $('w-satz-text').textContent = titel;
    $('w-satz-klein').textContent = klein;
  }
  function zeichneWertGrafik() {
    if (!window.GRAFIK || $('wert').hidden) return;
    if (wertGrafik) window.GRAFIK.werte($('ch-wert'), $('ch-wert-legende'), wertGrafik);
    else { $('ch-wert').innerHTML = '<p class="klein">Grundstück, Bodenrichtwert, Baujahr und Miete oder Brutto-Grundfläche eintragen.</p>'; $('ch-wert-legende').innerHTML = ''; }
  }
  $('w-aus-rechner').addEventListener('click', function () {
    var paare = [['r-flaeche', 'w-wfl'], ['r-miete', 'w-miete']];
    paare.forEach(function (p) { if ($(p[0]).value.trim()) $(p[1]).value = $(p[0]).value; });
    var ob = liste.filter(function (x) { return x.id === $('r-objekt').value; })[0];
    if (ob) wertAusObjekt(ob);
    rechne(); eingabenMerken();
  });
  function wertAusObjekt(ob) {
    [['grund', 'w-grund'], ['brw', 'w-brw'], ['baujahr', 'w-baujahr'], ['we', 'w-we'], ['flaeche', 'w-wfl']].forEach(function (p) {
      if (ob[p[0]]) $(p[1]).value = p[0] === 'baujahr' ? String(ob[p[0]]) : fmt0.format(ob[p[0]]);
    });
    if (ob.miete) $('w-miete').value = fmt0.format(ob.miete);
  }
  $('w-vgl-merk').addEventListener('click', function () {
    var mit = liste.filter(function (o) { return o.flaeche > 0 && o.preis > 0; });
    if (!mit.length) { $('w-vgl-hinweis').textContent = 'In der Merkliste fehlt bei allen Objekten die Wohnfläche; ohne sie gibt es keinen Preis je m².'; return; }
    var schnitt = mit.reduce(function (s, o) { return s + o.preis / o.flaeche; }, 0) / mit.length;
    $('w-vgl').value = fmt0.format(schnitt);
    $('w-vgl-hinweis').textContent = 'Durchschnitt aus ' + objekte(mit.length) + ' der Merkliste: ' + euro(schnitt) + ' je m². Das sind Angebotspreise, keine Kaufpreise.';
    rechne(); eingabenMerken();
  });

  /* ---------- Steuern sparen (Block 4, 09.10.2026) ----------
     Tipps und Fallen aus daten/steuern.js, vier Rechner mit den Rechenfunktionen aus rechner.js. Eigene Näherungen,
     keine Steuerberatung, keine Empfehlung (R078). Quellen mit Abrufdatum stehen an den Zahlen (R073). */
  var ST = D.steuern || { gruppen: [], karten: [], konstanten: {} };
  (function () {
    function karteHtml(k) {
      var nein = /^nein/i.test(k.verm);
      return '<article class="st-karte" id="tipp-' + esc(k.id) + '"><h4>' + esc(k.titel) + '</h4><p>' + esc(k.satz) + '</p>' +
        '<p class="klein"><b>Bedingung:</b> ' + esc(k.bed) + '</p>' +
        '<p><span class="st-verm' + (nein ? ' nein' : '') + '">Gilt für Vermieter: ' + esc(k.verm) + '</span>' +
        (k.selbstnutzer ? '<span class="st-verm nein">Nur für Selbstnutzer</span>' : '') +
        (k.pruefen ? '<span class="annahme">Vor Nutzung prüfen</span>' : '') + '</p>' +
        (k.pruefen ? '<p class="st-pruefen"><b>Vor Nutzung prüfen:</b> ' + esc(k.pruefen) + '</p>' : '') +
        '<p class="st-hinweis-zeile"><b>Mit Steuerberater prüfen.</b> Das ist keine Empfehlung.</p>' +
        '<p class="st-quellen">Paragraph und Quelle: ' + k.para.map(function (p) {
          return '<a href="' + esc(p.u) + '" target="_blank" rel="noopener">' + esc(p.t) + '</a>';
        }).join('; ') + '. ' + esc(k.quelle) + '.</p>' +
        (k.rechner ? '<p><a href="#steuern" data-ziel="steuern" data-anker="' + esc(k.rechner) + '">→ Dazu der Rechner</a></p>' : '') + '</article>';
    }
    $('st-tipps').innerHTML = ST.gruppen.map(function (gr) {
      var ks = ST.karten.filter(function (k) { return k.gruppe === gr.id; });
      return '<details class="st-gruppe" id="st-g-' + esc(gr.id) + '"><summary>' + esc(gr.titel) + ' <small>' + ks.length + ' Karten · ' + esc(gr.text) + '</small></summary>' +
        '<div class="st-karten">' + ks.map(karteHtml).join('') + '</div></details>';
    }).join('');
  })();

  var verkaufGrafik = null;
  function stSatz(p, art, zeichen, titel, klein) {
    var box = $(p + '-satz');
    box.className = 'satz' + (art ? ' ' + art : '');
    box.querySelector('.lampe').textContent = zeichen;
    $(p + '-satz-text').textContent = titel;
    $(p + '-satz-klein').textContent = klein;
  }
  /* Feld lesen: eigener Wert (auch ungültig melden) oder, wenn leer, der Ersatzwert aus Rechner oder Wert (nur wenn über 0) */
  function stFeld(id, ersatz) {
    var leer = $(id).value.trim() === '';
    var n = wert(id);
    if (!leer) return { v: n, eigen: true, bad: n === null };
    return { v: ersatz > 0 ? ersatz : null, eigen: false, bad: false };
  }
  var FEHLT_ZAHL = ['Mindestens ein Feld enthält noch keine gültige Zahl.', 'Prüfen Sie die rot markierten Felder, auch den Steuersatz oben; dann steht hier das Ergebnis.'];

  function rechneSteuer() {
    var satz = wert('st-satz');
    var sOk = satz !== null;
    var bjLeer = $('st-baujahr').value.trim() === '';
    var bj = bjLeer ? ($('r-baujahr').value.trim() === '' ? null : wert('r-baujahr')) : wert('st-baujahr');
    var afa = R.afaSatz(bj);
    var bjText = bj ? 'Baujahr ' + bj + (bjLeer ? ', aus dem Rechner' : '') : 'ohne Baujahr mit 2 % gerechnet';
    $('st-baujahr-hinweis').textContent = 'Abschreibungssatz: ' + fmt1.format(afa) + NB + '% (' + bjText + '; § 7 Abs. 4 Satz 1 Nr. 2 EStG, gesetze-im-internet.de, Abruf 09.10.2026).';
    $('st-a-afa-text').textContent = 'Abschreibungssatz: ' + fmt1.format(afa) + NB + '% (' + bjText + '). Quelle: § 7 Abs. 4 Satz 1 Nr. 2 EStG, Abruf 09.10.2026';
    stand.steuerC = null;

    /* ---- c) Kaufpreisaufteilung (zuerst, Teil a nutzt das Ergebnis) ---- */
    var wb = stand.wertBoden;
    var cKp = stFeld('st-c-kp', stand.preis > 0 && stand.nebenkosten !== null ? stand.preis + stand.nebenkosten : 0);
    var cGr = stFeld('st-c-grund', wb ? wb.grund : 0), cBrw = stFeld('st-c-brw', wb ? wb.brw : 0);
    var cBgf = stFeld('st-c-bgf', wb ? wb.bgf : 0), cGeb = stFeld('st-c-geb', 0);
    var cSchlecht = !sOk || [cKp, cGr, cBrw, cBgf, cGeb].some(function (x) { return x.bad; });
    var cRes = null;
    $('st-c-quelle').textContent = '';
    if (cSchlecht) {
      stSatz('st-c', 'leer', '?', FEHLT_ZAHL[0], FEHLT_ZAHL[1]);
      wertDl('st-c-ergebnis', [{ t: 'Gebäudeanteil', w: '-' }, { t: 'Abschreibung pro Jahr', w: '-' }]);
    } else {
      var boden = (cGr.v || 0) * (cBrw.v || 0), geb = null, gebQ = '';
      if (cGeb.v > 0) { geb = cGeb.v; gebQ = 'selbst eingetragen'; }
      else if (cBgf.v > 0 && stand.sachParam) {
        geb = R.gebaeudewertSachwert(Object.assign({}, stand.sachParam, { bgf: cBgf.v }));
        gebQ = 'Sachwert-Rechnung aus „Was ist das Haus wert?“ ohne Boden, Brutto-Grundfläche ' + fmt0.format(cBgf.v) + NB + 'm²' + (cBgf.eigen ? '' : ' (aus „Was ist das Haus wert?“)');
      }
      var fehlt = [];
      if (!(cKp.v > 0)) fehlt.push('Kaufpreis plus Nebenkosten (oder im Rechner den Kaufpreis)');
      if (!(boden > 0)) fehlt.push('Grundstücksfläche und Bodenrichtwert');
      if (!(geb > 0)) fehlt.push(cBgf.v > 0 && !stand.sachParam ? 'unter „Was ist das Haus wert?“ das Baujahr (für die Sachwert-Rechnung) oder hier unter „Mehr Einstellungen“ den Gebäudewert' : 'die Brutto-Grundfläche oder den Gebäudewert');
      if (fehlt.length) {
        stSatz('st-c', 'leer', '?', 'Tragen Sie noch ein: ' + fehlt.join(', ') + '.', 'Leere Felder holen sich die Zahlen aus „Kann ich mir das leisten?“ und „Was ist das Haus wert?“.');
        wertDl('st-c-ergebnis', [{ t: 'Gebäudeanteil', w: '-' }, { t: 'Abschreibung pro Jahr', w: '-' }]);
      } else {
        cRes = R.kaufpreisAufteilung({ kaufpreis: cKp.v, nebenkosten: 0, bodenwert: boden, gebaeudewert: geb, afaSatz: afa, steuersatz: satz });
        cRes.bodenwert = boden; cRes.gebaeudewert = geb;
        stand.steuerC = cRes;
        $('st-c-quelle').textContent = 'Verwendet: Kaufpreis plus Nebenkosten ' + euro(cKp.v) + (cKp.eigen ? ' (eigener Wert)' : ' (aus dem Rechner)') +
          '; Bodenwert ' + euro(boden) + ' (' + fmt0.format(cGr.v || 0) + NB + 'm² × ' + euro(cBrw.v || 0) + ' je m²' + (cGr.eigen || cBrw.eigen ? '' : ', aus „Was ist das Haus wert?“') + ')' +
          '; Gebäudewert ' + euro(geb) + ' (' + gebQ + ').';
        stSatz('st-c', '', '≈', 'Etwa ' + fmt0.format(Math.round(cRes.gebaeudeanteil)) + NB + '% des Preises liegen auf dem Gebäude: ' + euro(cRes.afaJahr) + ' Abschreibung im Jahr, etwa ' + euro(cRes.steuerJahr) + ' weniger Steuer.',
          'Näherung nach dem Prinzip der BMF-Arbeitshilfe, nicht die Arbeitshilfe selbst.' + (stand.gebAnteil !== null && stand.gebAnteil !== undefined
            ? (stand.gebQuelle === 'eigen' ? ' Im Rechner (Schritt 5) steht Ihr eigener Gebäudeanteil von ' + fmt0.format(stand.gebAnteil) + NB + '%; er hat Vorrang vor diesem Ergebnis.'
              : ' Rechner (Schritt 5) und Verkaufsrechner übernehmen diesen Gebäudeanteil statt der Annahme von ' + GEB_ANNAHME + NB + '%.')
            : '') + ' Eigene Rechnung, mit Steuerberater prüfen.');
        wertDl('st-c-ergebnis', [
          { t: 'Bodenwert', w: euro(boden) }, { t: 'Gebäudewert', w: euro(geb) },
          { t: 'Gebäudeanteil', w: prozent(cRes.gebaeudeanteil), haupt: true },
          { t: 'Anschaffungskosten Gebäude', w: euro(cRes.gebaeudeAK) },
          { t: 'Abschreibung pro Jahr (' + fmt1.format(afa) + NB + '%)', w: euro(cRes.afaJahr) },
          { t: 'Weniger Steuer pro Jahr (bei ' + fmt1.format(satz) + NB + '%)', w: euro(cRes.steuerJahr), haupt: true }
        ]);
      }
    }

    /* ---- a) 15-%-Prüfer ---- */
    var aAk = stFeld('st-a-ak', 0), j1 = wert('st-a-j1'), j2 = wert('st-a-j2'), j3 = wert('st-a-j3');
    var aSchlecht = !sOk || aAk.bad || j1 === null || j2 === null || j3 === null;
    var ak = null, akQ = '';
    if (aAk.v > 0) { ak = aAk.v; akQ = 'eigener Wert'; }
    else if (cRes) { ak = cRes.gebaeudeAK; akQ = 'aus Teil c, Kaufpreisaufteilung'; }
    else if (stand.preis > 0 && stand.nebenkosten !== null && stand.gebAnteil !== null && stand.gebAnteil !== undefined) {
      ak = (stand.preis + stand.nebenkosten) * stand.gebAnteil / 100;
      akQ = 'Annahme: Gebäudeanteil ' + fmt0.format(stand.gebAnteil) + NB + '% aus dem Rechner, Schritt 5, von Kaufpreis plus Nebenkosten';
    }
    $('st-a-quelle').textContent = !aSchlecht && ak > 0 ? 'Verwendet: Anschaffungskosten des Gebäudes ' + euro(ak) + ' (' + akQ + ').' : '';
    $('st-a-umbau').hidden = !(stand.umbauGesamt > 0);
    var aErg = [{ t: 'Grenze (15 %)', w: '-' }, { t: 'Summe Renovierung', w: '-' }];
    if (aSchlecht) {
      stSatz('st-a', 'leer', '?', FEHLT_ZAHL[0], FEHLT_ZAHL[1]);
    } else if (!(ak > 0)) {
      stSatz('st-a', 'leer', '?', 'Tragen Sie die Anschaffungskosten des Gebäudes ein.', 'Oder füllen Sie Teil c oder den Rechner (Kaufpreis) aus; dann holt sich dieser Prüfer den Wert selbst.');
    } else if (j1 + j2 + j3 <= 0) {
      stSatz('st-a', 'leer', '?', 'Tragen Sie die geplanten Renovierungskosten ein (netto, Jahr 1 bis 3 nach dem Kauf).', 'Die Grenze liegt bei ' + euro(ak * 0.15) + ' (15 % von ' + euro(ak) + ').');
    } else {
      var a = R.anschaffungsnaheKosten({ gebaeudeAK: ak, j1: j1, j2: j2, j3: j3, steuersatz: satz, afaSatz: afa });
      var abstandText = a.ueber ? euro(-a.abstand) + ' darüber' : (a.abstand === 0 ? 'genau auf der Grenze' : 'noch ' + euro(a.abstand) + ' Luft');
      if (!a.ueber) {
        stSatz('st-a', '', '≈', 'Die Renovierungen liegen mit ' + euro(a.summe) + (a.abstand === 0 ? ' genau auf der Grenze von ' : ' unter der 15-%-Grenze von ') + euro(a.grenze) + (a.abstand > 0 ? ' (noch ' + euro(a.abstand) + ' Luft).' : '.'),
          'Das Gesetz lässt sie dann in der Regel sofort als Werbungskosten zu, wenn es wirklich Erhaltung ist. Im ersten Jahr spart das etwa ' + euro(a.erstesJahrSofort) + ' Steuer, bei bloßer Abschreibung wären es ' + euro(a.erstesJahrAfa) + '. Eigene Rechnung, mit Steuerberater prüfen.');
      } else {
        stSatz('st-a', 'warn', '!', 'Die Renovierungen liegen mit ' + euro(a.summe) + ' über der 15-%-Grenze von ' + euro(a.grenze) + ' (um ' + euro(-a.abstand) + ').',
          'Dann zählen nach dem Gesetz alle ' + euro(a.summe) + ' (nicht nur der Überschuss) als anschaffungsnahe Herstellungskosten und nur über die Abschreibung (' + fmt1.format(afa) + NB + '% im Jahr). Im ersten Jahr: statt ' + euro(a.erstesJahrSofort) + ' Ersparnis nur ' + euro(a.erstesJahrAfa) + '. Eigene Einordnung nach dem Gesetzestext, mit Steuerberater prüfen.');
      }
      aErg = [
        { t: 'Grenze (15 % von ' + euro(ak) + ')', w: euro(a.grenze) }, { t: 'Summe Renovierung (netto)', w: euro(a.summe) },
        { t: 'Abstand zur Grenze', w: abstandText, haupt: true, k: a.ueber ? 'neg' : '' },
        { t: 'Steuer gespart im 1. Jahr, wenn sofort absetzbar', w: euro(a.erstesJahrSofort) },
        { t: 'Steuer gespart im 1. Jahr, wenn nur Abschreibung', w: euro(a.erstesJahrAfa) },
        { t: 'Unterschied im 1. Jahr', w: euro(a.erstesJahrUnterschied), haupt: true }
      ];
    }
    wertDl('st-a-ergebnis', aErg);

    /* ---- b) § 7h / § 7i ---- */
    var bk = wert('st-b-kosten');
    var typ = $('st-b-typ').value === '7i' ? '§ 7i (Baudenkmal)' : '§ 7h (Sanierungsgebiet)';
    var tb = $('st-b-tabelle').querySelector('tbody');
    if (!sOk || bk === null) {
      stSatz('st-b', 'leer', '?', FEHLT_ZAHL[0], FEHLT_ZAHL[1]);
      wertDl('st-b-ergebnis', [{ t: 'Steuer gespart in 12 Jahren', w: '-' }]);
      tb.innerHTML = '<tr><td colspan="6">Begünstigte Kosten eintragen.</td></tr>';
    } else if (!(bk > 0)) {
      stSatz('st-b', 'leer', '?', 'Tragen Sie die begünstigten Kosten ein (laut Bescheinigung).', 'Dann sehen Sie, wie viel Steuer die erhöhte Absetzung nach ' + typ + ' gegenüber der normalen Abschreibung bringt.');
      wertDl('st-b-ergebnis', [{ t: 'Steuer gespart in 12 Jahren', w: '-' }]);
      tb.innerHTML = '<tr><td colspan="6">Begünstigte Kosten eintragen.</td></tr>';
    } else {
      var e = R.erhoehteAfa({ kosten: bk, steuersatz: satz, normalSatz: afa });
      stSatz('st-b', '', '≈', 'Nach ' + typ + ' lassen sich bis zu ' + euro(e.ersparnis) + ' Steuer in 12 Jahren sparen, bei normaler Abschreibung wären es ' + euro(e.ersparnisNormal) + '.',
        'Unterschied ' + euro(e.differenz) + '. Der Rest (' + euro(e.restNachZwoelf) + ') würde bei normaler Abschreibung erst später abgesetzt; der Vorteil liegt also vor allem im Zeitpunkt. Nur mit Bescheinigung beziehungsweise Abstimmung vor Baubeginn. Eigene Rechnung, mit Steuerberater prüfen.');
      wertDl('st-b-ergebnis', [
        { t: 'Absetzung Jahr 1 bis 8 (bis zu 9 % je Jahr)', w: euro(bk * 0.09) }, { t: 'Absetzung Jahr 9 bis 12 (bis zu 7 % je Jahr)', w: euro(bk * 0.07) },
        { t: 'Steuer gespart in 12 Jahren', w: euro(e.ersparnis), haupt: true },
        { t: 'Normale Abschreibung (' + fmt1.format(afa) + NB + '%) in 12 Jahren', w: euro(e.ersparnisNormal) },
        { t: 'Unterschied', w: euro(e.differenz), haupt: true }
      ]);
      tb.innerHTML = e.jahre.map(function (j) {
        return '<tr><td data-titel="Jahr">' + j.jahr + '</td><td class="z" data-titel="Satz bis zu">' + j.satz + NB + '%</td><td class="z" data-titel="Erhöhte Absetzung">' + euro(j.afa) +
          '</td><td class="z" data-titel="Normale Abschreibung">' + euro(j.normal) + '</td><td class="z" data-titel="Steuer gespart (erhöht)">' + euro(j.steuer) +
          '</td><td class="z" data-titel="Steuer gespart (normal)">' + euro(j.steuerNormal) + '</td></tr>';
      }).join('');
    }

    /* ---- d) Verkauf nach N Jahren ---- */
    var ws = wert('st-d-ws'), vkp = wert('st-d-vk');
    var dTab = $('st-d-tabelle').querySelector('tbody');
    verkaufGrafik = null;
    if (!sOk || ws === null || vkp === null) {
      stSatz('st-d', 'leer', '?', FEHLT_ZAHL[0], FEHLT_ZAHL[1]);
      wertDl('st-d-ergebnis', [{ t: 'Gesamtergebnis nach 10 Jahren', w: '-' }]);
      dTab.innerHTML = '<tr><td colspan="7">Felder prüfen.</td></tr>';
    } else if (!stand.lfBasis) {
      stSatz('st-d', 'leer', '?', 'Tragen Sie im Rechner Kaufpreis, Kredit (Angebot A) und Miete ein (Schritte 1 bis 3).',
        'Dann steht hier, ab welchem Jahr ein Verkauf rechnerisch im Plus liegt. Die Zahlen kommen aus dem Rechner, auch aus Schritt 5 (Gebäudeanteil, Steigerungen).');
      wertDl('st-d-ergebnis', [{ t: 'Gesamtergebnis nach 10 Jahren', w: '-' }]);
      dTab.innerHTML = '<tr><td colspan="7">Im Rechner Schritte 1 bis 3 und Angebot A vollständig ausfüllen.</td></tr>';
    } else {
      var lf = R.langfrist(Object.assign({}, stand.lfBasis, { afaSatz: afa, steuersatz: satz, jahre: 30, wertsteigerung: 0 }));
      var vk = R.verkauf({ jahre: lf.jahre, kaufpreis: stand.preis, nebenkosten: stand.nebenkosten, ek: stand.ekEingesetzt, wertsteigerung: ws,
        verkaufskostenProzent: vkp, steuersatz: satz, soli: $('st-d-soli').checked, frist: ST.konstanten.fristJahre || 10 });
      verkaufGrafik = vk;
      var z = vk.zeilen, z9 = z[8], z10 = z[9];
      var titel = vk.plusAb === null ? 'In den betrachteten 30 Jahren liegt ein Verkauf nach dieser Rechnung nicht im Plus.'
        : (vk.plusAb === 1 ? 'Rechnerisch im Plus: ab Jahr 1.' : 'Rechnerisch im Plus ab Jahr ' + vk.plusAb + '.');
      stSatz('st-d', '', '≈', titel,
        'Verkauf nach 9 Jahren: ' + euro(z9.gesamt) + ' (Steuer ' + euro(z9.steuer) + '); nach 10 Jahren: ' + euro(z10.gesamt) + ' (steuerfrei, Frist abgelaufen). Gesamtergebnis = Erlös nach Schuld und Steuer plus Überschüsse nach Steuern minus eingesetztes Eigenkapital. Eigene Rechnung mit Annahmen, keine Empfehlung.');
      wertDl('st-d-ergebnis', [5, 9, 10, 15, 30].map(function (n) {
        return { t: 'Gesamtergebnis bei Verkauf nach ' + n + ' Jahren', w: euro(z[n - 1].gesamt), k: vorzeichenKlasse(z[n - 1].gesamt), haupt: n === 9 || n === 10 };
      }).concat([{ t: 'Steuer bei Verkauf nach 9 Jahren', w: euro(z9.steuer) }]));
      dTab.innerHTML = z.map(function (r) {
        var steuerText = !r.inFrist ? 'frei (Frist abgelaufen)' : (r.freigrenze ? 'frei (unter 1.000 €)' : euro(r.steuer));
        return '<tr><td data-titel="Jahr">' + r.jahr + '</td><td class="z" data-titel="Verkaufspreis">' + euro(r.preis) + '</td><td class="z" data-titel="Gewinn nach § 23">' + euro(r.gewinn) +
          '</td><td class="z" data-titel="Steuer">' + steuerText + '</td><td class="z" data-titel="Restschuld">' + euro(r.rest) + '</td><td class="z" data-titel="Erlös nach Schuld und Steuer">' + euro(r.netto) +
          '</td><td class="z ' + vorzeichenKlasse(r.gesamt) + '" data-titel="Gesamtergebnis">' + euro(r.gesamt) + '</td></tr>';
      }).join('');
    }
    zeichneSteuerGrafik();
  }
  function zeichneSteuerGrafik() {
    if (!window.GRAFIK || $('steuern').hidden) return;
    if (verkaufGrafik) window.GRAFIK.verkauf($('ch-verkauf'), $('ch-verkauf-legende'), verkaufGrafik);
    else { $('ch-verkauf').innerHTML = '<p class="klein">Sobald der Rechner Zahlen hat, erscheint hier das Gesamtergebnis für Verkauf nach 1 bis 30 Jahren.</p>'; $('ch-verkauf-legende').innerHTML = ''; }
  }
  $('st-a-umbau').addEventListener('click', function () {
    $('st-a-j1').value = fmt0.format(Math.round(stand.umbauGesamt));
    rechne(); eingabenMerken();
    $('st-a-j1').focus();
  });

  /* ---------- Ergebnis weiterleiten (Block 4) ----------
     Text mit Eingaben und Ergebnissen plus Link zur öffentlichen Seite; im Link stehen hinter „#“ nur Zahlen und Auswahlwerte
     (Whitelist je Bereich), nie Namen, Adressen oder Notizen aus der Merkliste. Geteilter Link: Werte einsetzen, vorher eigene sichern (R020). */
  var TEILEN_BASIS = 'https://fachmannhb.github.io/immo-rechner/';
  var TEILEN_SICH = 'immo-teilen-sicherung';
  var TEILEN_HINWEIS = 'Eigene Berechnung mit Annahmen, keine Anlage- oder Steuerberatung.';
  var STFORM = '#st-form input, #st-form select, #r-form input, #r-form select, #w-form input, #w-form select'; /* die Steuer-Rechner bauen auf Rechner und Wert auf */
  var TEILEN = {
    rechner: { bereich: 'rechner', titel: 'Rechner: Trägt sich das Haus?', formSel: '#r-form input, #r-form select', ohne: ['r-objekt'], satz: 'r-satz',
      eingaben: ['r-preis', 'r-land', 'r-ek', 'r-zins-a', 'r-tilg-a', 'r-flaeche', 'r-miete'],
      ergebnis: [['Kredit', 'k-darlehen'], ['Rate im Monat', 'k-rate'], ['Bleibt im Monat', 'k-cashflow'], ['Bruttorendite', 'k-rendite']] },
    wert: { bereich: 'wert', titel: 'Wert: Was ist das Haus wert?', formSel: '#w-form input, #w-form select', satz: 'w-satz',
      eingaben: ['w-grund', 'w-brw', 'w-baujahr', 'w-wfl', 'w-we', 'w-miete', 'w-lz'],
      ergebnis: [['Bodenwert', 'wk-boden'], ['Ertragswert', 'wk-ertrag'], ['Sachwert', 'wk-sach'], ['Vergleichswert', 'wk-vergleich'], ['Kaufpreis', 'wk-kauf']] },
    umbau: { bereich: 'umbau', titel: 'Umbau: Was kostet der Umbau?', formSel: '#u-form input', satz: 'u-satz',
      eingaben: function () {
        return SAN.bauteile.filter(function (b) { return (R.leseZahl($('u-m-' + b.id).value) || 0) > 0; })
          .map(function (b) { return [b.name + ' (Menge in ' + b.einheit + ')', $('u-m-' + b.id).value.trim()]; });
      },
      ergebnis: [['Gesamtkosten', 'uk-gesamt'], ['Nach Förderung', 'uk-netto'], ['Mehrmiete im Monat', 'uk-miete'], ['Wertzuwachs', 'uk-wert']] },
    mappe: { bereich: 'rechner', titel: 'Bank-Mappe: Zahlen zur Finanzierung', formSel: null, dl: 'mp-teilen', eingaben: [],
      zusatz: 'Nur die Zahlen der Mappe, ohne Notizen und ohne Besichtigung.', linkText: 'Zum Selbstrechnen (öffnet den leeren Rechner):' },
    grundriss: { bereich: 'grundriss', titel: 'Grundriss und Einrichtung', formSel: null, satz: 'g-satz', eingaben: [],
      ergebnis: [['Wohnfläche', 'g-wfl'], ['Nutzfläche', 'g-nfl'], ['Einrichtung', 'g-einr'], ['Umbau', 'g-umb']],
      zusatz: 'Der gezeichnete Grundriss selbst steckt nicht im Link.' },
    monteur: { bereich: 'monteur', titel: 'Monteurzimmer: Rechnet es sich?', formSel: '#monteur input[type="text"], #monteur input[type="range"]', dl: 'mz-ergebnis',
      eingaben: ['mz-betten', 'mz-preis', 'mz-beleg', 'mz-fix', 'mz-var', 'mz-abgabe'] },
    'st-a': { bereich: 'steuern', ohne: ['r-objekt'], fokus: 'st-a', titel: 'Steuern sparen: 15-Prozent-Prüfer', formSel: STFORM, satz: 'st-a-satz', dl: 'st-a-ergebnis', hinweisId: 'st-a-quelle',
      eingaben: ['st-satz', 'st-a-ak', 'st-a-j1', 'st-a-j2', 'st-a-j3'] },
    'st-b': { bereich: 'steuern', ohne: ['r-objekt'], fokus: 'st-b', titel: 'Steuern sparen: Sanierungsgebiet oder Baudenkmal', formSel: STFORM, satz: 'st-b-satz', dl: 'st-b-ergebnis',
      eingaben: ['st-satz', 'st-b-typ', 'st-b-kosten'], zusatz: 'Bescheinigung beziehungsweise Abstimmung muss vor Baubeginn vorliegen.' },
    'st-c': { bereich: 'steuern', ohne: ['r-objekt'], fokus: 'st-c', titel: 'Steuern sparen: Kaufpreisaufteilung Boden und Gebäude', formSel: STFORM, satz: 'st-c-satz', dl: 'st-c-ergebnis', hinweisId: 'st-c-quelle',
      eingaben: ['r-preis', 'st-satz', 'st-c-kp', 'st-c-grund', 'st-c-brw', 'st-c-bgf', 'st-c-geb'], zusatz: 'Näherung nach dem Prinzip der BMF-Arbeitshilfe, nicht die Arbeitshilfe selbst.' },
    'st-d': { bereich: 'steuern', ohne: ['r-objekt'], fokus: 'st-d', titel: 'Steuern sparen: Verkauf nach 1 bis 30 Jahren', formSel: STFORM, satz: 'st-d-satz', dl: 'st-d-ergebnis',
      eingaben: ['r-preis', 'r-ek', 'r-miete', 'st-satz', 'st-d-ws', 'st-d-vk'], zusatz: 'Jede Zeile heißt: Verkauf kurz nach dem N. Jahrestag des Kaufvertrags (taggenau nach den Notarverträgen).' }
  };
  /* Felder ohne eigenes label-Element (die Kreditangebote stehen in einer Tabelle) */
  var TEILEN_LABEL = { 'r-zins-a': 'Zinssatz Angebot A in %', 'r-tilg-a': 'Anfängliche Tilgung Angebot A in %' };
  function labelVon(id) {
    var l = document.querySelector('label[for="' + id + '"]');
    if (!l) return id;
    var c = l.cloneNode(true);
    c.querySelectorAll('.frag, .kurz, .sprung').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function teilenFelder(cfg) {
    if (!cfg || !cfg.formSel) return [];
    return Array.prototype.slice.call(document.querySelectorAll(cfg.formSel)).filter(function (el) { return el.id && (cfg.ohne || []).indexOf(el.id) < 0; });
  }
  function teilenWert(el) {
    if (el.type === 'checkbox') return el.checked ? 'true' : 'false';
    if (el.tagName === 'SELECT') return /^[0-9A-Za-zÄÖÜäöüß .,()-]{1,40}$/.test(el.value) ? el.value : null;
    if (el.value.trim() === '') {
      /* leerer Gebäudeanteil: den wirksamen Wert (Annahme oder Kaufpreisaufteilung) mitgeben, damit der Empfänger dieselben Zahlen sieht */
      if (el.id === 'r-gebanteil' && typeof stand.gebAnteil === 'number' && isFinite(stand.gebAnteil)) return String(Number(stand.gebAnteil.toFixed(6)));
      return null;
    }
    var n = R.leseZahl(el.value);
    return n === null || !isFinite(n) ? null : String(Number(n.toFixed(6)));
  }
  function ergebnisText(id) { var el = $(id), z = el.querySelector('.zw'); return (z || el).textContent.replace(/\s+/g, ' ').trim(); }
  function dlPaare(id) {
    return Array.prototype.map.call($(id).querySelectorAll('.wert'), function (w) {
      return [w.querySelector('dt').textContent.trim(), w.querySelector('dd').textContent.trim()];
    }).filter(function (p) { return p[1] !== '-' && p[1] !== ''; });
  }
  function teilenHatErgebnis(cfg) {
    if (cfg.satz) return !$(cfg.satz).classList.contains('leer');
    return dlPaare(cfg.dl).length > 0;
  }
  function teilenBauen(cfg) {
    var heute = datumDe(new Date().toISOString().slice(0, 10));
    var zeilen = ['Immobilien-Werkzeuge: ' + cfg.titel, 'Stand: ' + heute, ''];
    if (cfg.satz) {
      zeilen.push($(cfg.satz + '-text').textContent.trim());
      var kl = $(cfg.satz + '-klein').textContent.trim();
      if (kl) zeilen.push(kl);
      zeilen.push('');
    }
    var ein = typeof cfg.eingaben === 'function' ? cfg.eingaben() : cfg.eingaben.map(function (id) {
      var el = $(id), v;
      if (TEILEN_LABEL[id] === undefined && !document.querySelector('label[for="' + id + '"]')) return null;
      if (!el) return null;
      if (el.tagName === 'SELECT') v = el.selectedOptions[0] ? el.selectedOptions[0].textContent : '';
      else if (el.type === 'checkbox') return null;
      else v = el.value.trim();
      return v === '' ? null : [TEILEN_LABEL[id] || labelVon(id), v];
    }).filter(Boolean);
    if (ein.length) { zeilen.push('Eingaben:'); ein.forEach(function (p) { zeilen.push('- ' + p[0] + ': ' + p[1]); }); zeilen.push(''); }
    var erg = cfg.dl ? dlPaare(cfg.dl) : cfg.ergebnis.map(function (p) { return [p[0], ergebnisText(p[1])]; }).filter(function (p) { return p[1] !== '-' && p[1] !== ''; });
    if (erg.length) { zeilen.push('Ergebnisse:'); erg.forEach(function (p) { zeilen.push('- ' + p[0] + ': ' + p[1]); }); zeilen.push(''); }
    if (cfg.hinweisId && $(cfg.hinweisId).textContent.trim()) zeilen.push($(cfg.hinweisId).textContent.trim());
    if (cfg.zusatz) zeilen.push(cfg.zusatz);
    zeilen.push(TEILEN_HINWEIS);
    /* Link: nur Zahlen und Auswahlwerte der Whitelist, nie Merklistendaten */
    var url = TEILEN_BASIS + '#' + cfg.bereich;
    var paare = teilenFelder(cfg).map(function (el) { var v = teilenWert(el); return v === null ? null : el.id + '=' + encodeURIComponent(v); }).filter(Boolean);
    if (cfg.formSel) url = TEILEN_BASIS + '#teilen=' + cfg.bereich + (cfg.fokus ? '&fokus=' + cfg.fokus : '') + (paare.length ? '&' + paare.join('&') : '');
    var text = zeilen.join('\n');
    return { titel: 'Immobilien-Werkzeuge: ' + cfg.titel, text: text, url: url, voll: text + '\n' + (cfg.linkText || 'Zum Nachrechnen mit denselben Zahlen:') + ' ' + url };
  }
  function teilenMeldung(knopf, text, fehler, rohText) {
    var zeile = knopf.closest('.teilen-zeile'), m = zeile.nextElementSibling;
    if (!m || !m.classList.contains('teilen-meldung')) {
      m = document.createElement('div');
      zeile.parentNode.insertBefore(m, zeile.nextSibling);
    }
    m.className = 'teilen-meldung' + (fehler ? ' fehler-meldung' : '');
    m.setAttribute('role', fehler ? 'alert' : 'status');
    m.textContent = text;
    if (rohText) {
      var ta = document.createElement('textarea');
      ta.readOnly = true; ta.value = rohText; ta.setAttribute('aria-label', 'Text zum Kopieren');
      m.appendChild(ta);
    }
  }
  function teilenKopieren(knopf, t, vorspann) {
    function ok() { teilenMeldung(knopf, vorspann + 'Kopiert – jetzt in E-Mail oder Messenger einfügen.', false); }
    function notfall(grund) {
      var ta = document.createElement('textarea'), gut = false;
      ta.value = t.voll; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { gut = document.execCommand('copy'); } catch (e) { grund = grund || e.message; }
      ta.remove();
      if (gut) ok();
      else teilenMeldung(knopf, vorspann + 'Das Kopieren hat nicht geklappt (' + (grund || 'der Browser verweigert den Zugriff auf die Zwischenablage') + '). Markieren Sie den Text unten und kopieren Sie ihn selbst.', true, t.voll);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var p;
      try { p = navigator.clipboard.writeText(t.voll); } catch (e) { notfall(e.message); return; }
      Promise.resolve(p).then(ok, function (e) { notfall(e && e.message); });
    } else notfall('');
  }
  function teilen(key, knopf) {
    var cfg = TEILEN[key];
    if (!cfg) { teilenMeldung(knopf, 'Das Weiterleiten ist für diesen Bereich nicht eingerichtet.', true); return; }
    if (!teilenHatErgebnis(cfg)) {
      teilenMeldung(knopf, 'Es gibt noch kein Ergebnis zum Weiterleiten. ' + (cfg.satz ? $(cfg.satz + '-text').textContent.trim() : 'Tragen Sie zuerst Zahlen ein.'), true);
      return;
    }
    var t = teilenBauen(cfg);
    if (navigator.share) {
      var p;
      try { p = navigator.share({ title: t.titel, text: t.text, url: t.url }); } catch (e) { p = Promise.reject(e); }
      Promise.resolve(p).then(function () { teilenMeldung(knopf, 'Weitergegeben.', false); }, function (e) {
        if (e && e.name === 'AbortError') { teilenMeldung(knopf, 'Abgebrochen. Es wurde nichts weitergegeben.', false); return; }
        teilenKopieren(knopf, t, 'Das Teilen-Fenster Ihres Geräts ließ sich nicht öffnen (' + (e && e.message ? e.message : 'unbekannter Grund') + '). ');
      });
    } else teilenKopieren(knopf, t, '');
  }
  document.addEventListener('click', function (ev) {
    var k = ev.target.closest('.teilen-knopf');
    if (k) { ev.preventDefault(); teilen(k.getAttribute('data-teilen'), k); }
  });

  /* Geteilten Link öffnen: #teilen=BEREICH&fokus=st-d&id=wert&… Nur bekannte Felder mit gültigen Werten; eigene Eingaben werden gesichert. */
  function teilenFehler(text) {
    $('teilen-fehler').textContent = text;
    $('teilen-fehler').hidden = false;
    teilenBandZeigen();
  }
  function teilenBandZeigen() {
    var an = speicherLesen(TEILEN_SICH) !== null;
    $('teilen-band').hidden = !an && $('teilen-fehler').hidden;
    $('teilen-text').hidden = !an;
    $('teilen-zurueck').hidden = !an;
  }
  function teilenEmpfangen(hash) {
    var teile = hash.replace(/^teilen=/, '').split('&');
    var bereich = teile.shift();
    try { history.replaceState(null, '', '#' + (['rechner', 'wert', 'umbau', 'monteur', 'steuern', 'grundriss'].indexOf(bereich) >= 0 ? bereich : '')); } catch (e) {}
    var cfg = null;
    Object.keys(TEILEN).forEach(function (k) { if (!cfg && TEILEN[k].bereich === bereich && TEILEN[k].formSel) cfg = TEILEN[k]; });
    if (bereich === 'grundriss') { zeigeBereich('grundriss', true); return; }
    if (!cfg) { teilenFehler('Der geteilte Link konnte nicht geöffnet werden: Der Bereich „' + bereich.slice(0, 30) + '“ ist unbekannt. Es wurde nichts verändert.'); zeigeBereich('uebersicht', false); return; }
    var felder = teilenFelder(cfg), nach = {}, abgelehnt = 0, fokus = null;
    felder.forEach(function (el) { nach[el.id] = el; });
    var neu = {};
    teile.forEach(function (p) {
      var i = p.indexOf('=');
      if (i < 1) { abgelehnt++; return; }
      var id = p.slice(0, i), v;
      try { v = decodeURIComponent(p.slice(i + 1)); } catch (e) { abgelehnt++; return; }
      if (id === 'fokus') { if (/^st-[a-d]$/.test(v)) fokus = v; return; }
      var el = nach[id];
      if (!el) { abgelehnt++; return; }
      var gut;
      if (el.type === 'checkbox') gut = v === 'true' || v === 'false';
      else if (el.tagName === 'SELECT') gut = Array.prototype.some.call(el.options, function (o) { return o.value === v; });
      else {
        gut = /^-?\d{1,12}(\.\d{1,6})?$/.test(v);
        var rg = regeln[id];
        if (gut && rg && (Number(v) < rg.min || Number(v) > rg.max)) gut = false;
      }
      if (gut) neu[id] = v; else abgelehnt++;
    });
    if (!Object.keys(neu).length) {
      teilenFehler('Der geteilte Link konnte nicht geöffnet werden: Er enthält keine gültigen Zahlen' + (abgelehnt ? ' (' + abgelehnt + ' Angaben abgelehnt)' : '') + '. Es wurde nichts verändert.');
      zeigeBereich(bereich, false);
      return;
    }
    /* ein laufendes Beispiel zuerst beenden, damit wirklich die eigenen Zahlen gesichert werden */
    if (beispielAktiv()) beispielLeeren();
    if (!speicherLesen(TEILEN_SICH)) {
      var eigene = {};
      felder.forEach(function (el) { eigene[el.id] = eingabeWert(el); });
      if (!speicherSchreiben(TEILEN_SICH, { felder: eigene, bereich: bereich, zeit: new Date().toISOString() })) {
        teilenFehler('Der geteilte Link wurde nicht geöffnet: Der Browser lässt kein Speichern zu (zum Beispiel im privaten Fenster), Ihre eigenen Eingaben wären nicht gesichert.');
        zeigeBereich(bereich, false);
        return;
      }
    }
    $('teilen-fehler').hidden = true;
    felder.forEach(function (el) {
      if (Object.prototype.hasOwnProperty.call(neu, el.id)) eingabeSetzen(el, el.type === 'text' ? neu[el.id].replace('.', ',') : neu[el.id]);
      else if (el.type === 'checkbox') el.checked = false;
      else if (el.type === 'text') el.value = '';
    });
    $('teilen-text').innerHTML = '<b>Geteilte Zahlen – nicht Ihre eigenen.</b> Jemand hat Ihnen diese Rechnung geschickt' + (abgelehnt ? ' (' + abgelehnt + ' ungültige Angaben wurden ignoriert)' : '') + '. Ihre eigenen Eingaben sind gesichert.';
    rechne(); eingabenMerken(); beispielBandZeigen(); teilenBandZeigen();
    zeigeBereich(bereich, true);
    if (fokus && $(fokus)) $(fokus).scrollIntoView({ block: 'start' });
  }
  function teilenZurueck() {
    var s = speicherLesen(TEILEN_SICH);
    if (!s) { teilenBandZeigen(); return; }
    Object.keys(s.felder || {}).forEach(function (id) { eingabeSetzen($(id), s.felder[id]); });
    try { localStorage.removeItem(TEILEN_SICH); } catch (e) { teilenFehler('Die gesicherten Zahlen sind zurück, die Sicherung ließ sich aber nicht löschen: ' + e.message); }
    $('teilen-text').innerHTML = '<b>Geteilte Zahlen – nicht Ihre eigenen.</b> Jemand hat Ihnen diese Rechnung geschickt. Ihre eigenen Eingaben sind gesichert.';
    rechne(); eingabenMerken(); teilenBandZeigen();
  }

  /* ---------- Diagramme ---------- */
  var grafikDaten = null;
  function zeichneGrafiken() {
    var G = window.GRAFIK;
    zeichneMonteurGrafik();
    zeichneWertGrafik();
    zeichneUmbauGrafik();
    zeichneSteuerGrafik();
    if (!G || !grafikDaten || $('rechner').hidden) return;
    var d = grafikDaten;
    if (d.mittel) {
      G.mittel($('ch-mittel'), d.mittel);
      $('ch-mittel-text').textContent = 'Wofür: Kaufpreis ' + euro(d.mittel.kaufpreis) + ', Nebenkosten ' + euro(d.mittel.nebenkosten) +
        (d.mittel.zusatz ? ', Renovierung ' + euro(d.mittel.zusatz) : '') + '. Woher: Eigenkapital ' + euro(d.mittel.ek) + ', Darlehen ' + euro(d.mittel.darlehen) +
        '. Ragt der Darlehensbalken über die Kaufpreis-Linie, finanziert die Bank auch Nebenkosten mit.';
    } else { $('ch-mittel').innerHTML = ''; $('ch-mittel-text').textContent = ''; }
    var farben = { a: 'var(--c1)', b: 'var(--c2)', c: 'var(--c3)' };
    var css = getComputedStyle(document.documentElement);
    var serien = ['a', 'b', 'c'].map(function (x) {
      var k = d.angebote[x];
      if (!k || !k.plan.length) return null;
      var punkte = [{ j: 0, y: d.darlehen }].concat(k.plan.map(function (p) { return { j: p.jahr, y: p.rest }; }));
      return { name: 'Angebot ' + x.toUpperCase(), farbe: css.getPropertyValue(farben[x].slice(4, -1)).trim(), punkte: punkte, bindung: k.bindung };
    });
    G.restschuld($('ch-rest'), $('ch-rest-legende'), serien);
    var A = d.angebote.a;
    G.tilgung($('ch-tilgung'), $('ch-tilgung-legende'), A ? A.plan : null, A ? A.bindung : 0);
    if (d.wasserfall) G.wasserfall($('ch-wasserfall'), d.wasserfall); else $('ch-wasserfall').innerHTML = '';
    if (G.vermoegen && !$('ch-vermoegen').closest('.schritt').hidden) G.vermoegen($('ch-vermoegen'), $('ch-vermoegen-legende'), d.langfrist ? d.langfrist.jahre : null);
  }
  var groesseTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(groesseTimer);
    groesseTimer = setTimeout(zeichneGrafiken, 150);
  });
  ['r-zur-miete', 'ue-zur-miete'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      if ($('rechner').hidden) zeigeReiter($('tab-rechner'), true);
      zeigeSchritt('r-form', 'r-schritte', 3, false);
      $('r-miete').scrollIntoView({ block: 'center', behavior: ruhig ? 'auto' : 'smooth' });
      $('r-miete').focus({ preventScroll: true });
    });
  });
  $('ue-zum-rechner').addEventListener('click', function (ev) {
    ev.preventDefault();
    zeigeReiter($('tab-rechner'), true);
    window.scrollTo(0, 0);
  });

  function rechneMonteur() {
    var rate = stand.A ? stand.A.rate : 0;
    $('mz-rate-anzeige').textContent = stand.A ? euro(rate) + ' pro Monat' : 'Angebot A im Rechner ausfüllen';
    var b = wert('mz-betten'), p = wert('mz-preis'), bel = wert('mz-beleg'), fix = wert('mz-fix'), vr = wert('mz-var'), ab = wert('mz-abgabe');
    var ok = b !== null && p !== null && bel !== null && fix !== null && vr !== null && ab !== null;
    var basis = { betten: b, preis: p, belegungProzent: bel, fixkosten: fix, variabel: vr, abgabeProzent: ab, kreditrateMonat: rate };
    var m = ok ? R.monteur(basis) : null;
    wertDl('mz-ergebnis', [
      { t: 'Belegte Bett-Nächte pro Monat', w: m ? fmt0.format(m.bettNaechte) : '-' },
      { t: 'Umsatz pro Monat', w: m ? euro(m.umsatz) : '-' },
      { t: 'Operatives Ergebnis', w: m ? euro(m.operativ) : '-', k: m ? vorzeichenKlasse(m.operativ) : '' },
      { t: 'Break-even-Belegung ohne Kredit', w: m ? prozent(m.breakEven) : '-' },
      { t: 'Ergebnis nach Kreditrate', w: m ? euro(m.nachKredit) : '-', k: m ? vorzeichenKlasse(m.nachKredit) : '', haupt: true },
      { t: 'Break-even-Belegung mit Kredit', w: m ? prozent(m.breakEvenMitKredit) : '-', haupt: true }
    ]);
    var sz = [['Vorsichtig', 20, 15, 55], ['Basis', 25, 16, 75], ['Stark', 30, 17, 90]];
    $('mz-szenarien').querySelector('tbody').innerHTML = sz.map(function (s) {
      var r = ok ? R.monteur({ betten: s[1], preis: s[2], belegungProzent: s[3], fixkosten: fix, variabel: vr, abgabeProzent: ab, kreditrateMonat: rate }) : null;
      return '<tr><td data-titel="Szenario">' + s[0] + '</td><td class="z" data-titel="Betten">' + s[1] + '</td><td class="z" data-titel="Preis">' + euro(s[2]) +
        '</td><td class="z" data-titel="Belegung">' + s[3] + NB + '%</td><td class="z" data-titel="Umsatz/Monat">' + (r ? euro(r.umsatz) : '-') +
        '</td><td class="z ' + (r ? vorzeichenKlasse(r.operativ) : '') + '" data-titel="Operativ">' + (r ? euro(r.operativ) : '-') +
        '</td><td class="z ' + (r ? vorzeichenKlasse(r.nachKredit) : '') + '" data-titel="Nach Kredit">' + (r ? euro(r.nachKredit) : '-') + '</td></tr>';
    }).join('');

    var sb = Number($('mz-st-beleg').value), sp = Number($('mz-st-preis').value);
    $('mz-st-beleg-w').textContent = sb;
    $('mz-st-preis-w').textContent = fmt2.format(sp).replace(/,00$/, '').replace(/0$/, '');
    var ms = ok ? R.monteur({ betten: b, preis: Math.max(0, p - sp), belegungProzent: Math.max(0, bel - sb), fixkosten: fix, variabel: vr, abgabeProzent: ab, kreditrateMonat: rate }) : null;
    wertDl('mz-stress', [
      { t: 'Belegung im Stress', w: ok ? prozent(Math.max(0, bel - sb)) : '-' },
      { t: 'Preis im Stress', w: ok ? euro(Math.max(0, p - sp), true) : '-' },
      { t: 'Operatives Ergebnis im Stress', w: ms ? euro(ms.operativ) : '-', k: ms ? vorzeichenKlasse(ms.operativ) : '' },
      { t: 'Nach Kreditrate im Stress', w: ms ? euro(ms.nachKredit) : '-', k: ms ? vorzeichenKlasse(ms.nachKredit) : '', haupt: true }
    ]);

    var am = { miete: wert('am-miete'), sonst: wert('am-sonst'), kaution: wert('am-kaution'), einr: wert('am-einr'), betten: wert('am-betten') };
    var okA = ok && am.miete !== null && am.sonst !== null && am.kaution !== null && am.einr !== null && am.betten !== null;
    var a = okA ? R.anmieten({ betten: am.betten, preis: p, belegungProzent: bel, variabel: vr, abgabeProzent: ab,
      mieteMonat: am.miete, sonstigeFixkosten: am.sonst, kaution: am.kaution, einrichtung: am.einr }) : null;
    wertDl('am-ergebnis', [
      { t: 'Umsatz pro Monat', w: a ? euro(a.umsatz) : '-' },
      { t: 'Ergebnis pro Monat', w: a ? euro(a.ergebnisMonat) : '-', k: a ? vorzeichenKlasse(a.ergebnisMonat) : '', haupt: true },
      { t: 'Break-even-Belegung', w: a ? prozent(a.breakEven) : '-' },
      { t: 'Startkapital', w: a ? euro(a.startkapital) : '-' },
      { t: 'Einrichtung bezahlt nach', w: a ? (isFinite(a.amortisationMonate) ? fmt1.format(a.amortisationMonate) + NB + 'Monaten' : 'nie (Ergebnis nicht positiv)') : '-' }
    ]);
    stand.monteur = ok ? { preis: p, belegung: bel, fix: fix, variabel: vr, abgabe: ab } : null;
    monteurGrafik = ok ? {
      rechne: function (belegung) {
        return R.monteur({ betten: b, preis: p, belegungProzent: belegung, fixkosten: fix, variabel: vr, abgabeProzent: ab, kreditrateMonat: rate });
      },
      aktuell: bel, beOhne: m.breakEven, beMit: m.breakEvenMitKredit
    } : null;
    zeichneMonteurGrafik();
  }
  var monteurGrafik = null;
  function zeichneMonteurGrafik() {
    if (!window.GRAFIK || $('monteur').hidden) return;
    if (monteurGrafik) window.GRAFIK.belegung($('ch-belegung'), $('ch-belegung-legende'), monteurGrafik);
    else { $('ch-belegung').innerHTML = ''; $('ch-belegung-legende').innerHTML = ''; }
  }

  ['r-form', 'mz-form', 'w-form', 'u-form', 'st-form'].forEach(function (id) {
    $(id).addEventListener('input', function () { rechne(); eingabenMerken(); });
    $(id).addEventListener('change', function () { rechne(); eingabenMerken(); });
    $(id).addEventListener('submit', function (ev) { ev.preventDefault(); });
  });

  /* ---------- Objektsuche ---------- */
  function slug(s) {
    return String(s).trim().toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function sucheZeigen() {
    var ort = $('s-ort').value.trim();
    var land = $('s-land').value;
    var art = $('s-art').value;
    var max = pruefeFeld('s-preis', false);
    var o = slug(ort);
    $('s-ort-f').textContent = ort ? '' : 'Bitte einen Ort eingeben.';
    if (!ort) $('s-ort').setAttribute('aria-invalid', 'true'); else $('s-ort').removeAttribute('aria-invalid');
    var istBremen = o === 'bremen';
    var preisTeil = max ? Math.round(max) : 0;
    var zeilen = [];
    var info = {};
    (D.portale.liste || []).forEach(function (p) { info[p.id] = p; });

    /* Kleinanzeigen */
    var kat = art === 'wohnung' ? { pfad: 's-wohnung-kaufen', c: 'c196' } : { pfad: 's-haus-kaufen', c: 'c208' };
    var filter = art === 'mfh' ? '+haus_kaufen.haustyp_s:mehrfamilienhaus' : '';
    var ka = istBremen
      ? 'https://www.kleinanzeigen.de/' + kat.pfad + '/bremen/' + (preisTeil ? 'preis::' + preisTeil + '/' : '') + kat.c + 'l1' + filter
      : 'https://www.kleinanzeigen.de/' + kat.pfad + '/' + (preisTeil ? 'preis::' + preisTeil + '/' : '') + o + '/k0' + kat.c + filter;
    zeilen.push({ p: info.kleinanzeigen, url: ka, was: 'Ort, Objektart, Höchstpreis' + (istBremen ? ' (Bremen mit fester Orts-Kennung)' : ' (Ort als Suchwort)') });

    /* ImmoScout24 */
    var landSlug = slug(land);
    var isArt = art === 'wohnung' ? 'wohnung-kaufen' : 'haus-kaufen';
    var is = 'https://www.immobilienscout24.de/Suche/de/' + landSlug + '/' + o + '/' + isArt + (preisTeil ? '?price=-' + preisTeil + '.0' : '');
    zeilen.push({ p: info.immoscout, url: is, was: 'Ort, Objektart' + (preisTeil ? ', Höchstpreis' : '') + (art === 'mfh' ? '; Mehrfamilienhaus im Portal als Haustyp wählen' : '') });

    /* Immowelt */
    var iw, iwWas;
    if (istBremen) {
      var b = D.portale.bremen.immowelt;
      iw = art === 'wohnung' ? b.wohnung : art === 'mfh' ? b.mfh : (preisTeil === 300000 ? b.haus300 : b.haus);
      iwWas = 'Bremen, Objektart' + (art === 'haus' && preisTeil === 300000 ? ', Höchstpreis' : '; Preis im Portal einstellen');
    } else {
      iw = 'https://www.immowelt.de/';
      iwWas = 'nur Startseite; Ort, Art und Preis dort eingeben';
    }
    zeilen.push({ p: info.immowelt, url: iw, was: iwWas });

    /* Sparkasse */
    var sp, spWas;
    if (istBremen) {
      sp = 'https://immobilien.sparkasse.de/immobilien/treffer?estateTypeGroupingId=' + (art === 'wohnung' ? 403 : 396) +
        '&marketingType=buy' + (preisTeil ? '&maxPrice=' + preisTeil : '') + '&perimeter=10&sortBy=default_asc&usageType=residential&zipCityEstateId=' + D.portale.bremen.sparkasseOrt;
      spWas = 'Bremen + 10 km, ' + (art === 'wohnung' ? 'Wohnung' : 'Haus (Mehrfamilienhaus hat keine eigene Kennung)') + (preisTeil ? ', Höchstpreis' : '');
    } else {
      sp = 'https://immobilien.sparkasse.de/immobilien/' + o + '.html';
      spWas = 'Ortsseite des Portals; gibt es sie nicht, erscheint eine Fehlerseite';
    }
    zeilen.push({ p: info.sparkasse, url: sp, was: spWas });

    /* ZVG */
    zeilen.push({ p: info.zvg, url: null, was: 'Bundesland ' + land + ', Ort ' + ort });

    $('portal-tabelle').querySelector('tbody').innerHTML = zeilen.map(function (z, i) {
      var knopf = z.url
        ? '<a class="knopf" href="' + esc(z.url) + '" target="_blank" rel="noopener">Suche öffnen<span class="sprung"> bei ' + esc(z.p.name) + ' (neues Fenster)</span></a>'
        : '<button type="button" class="knopf" id="zvg-knopf"' + (ort ? '' : ' disabled') + '>Suche öffnen<span class="sprung"> im ZVG-Portal (neues Fenster)</span></button>';
      return '<tr><td data-titel="Portal"><strong>' + esc(z.p.name) + '</strong></td><td data-titel="Öffnen">' + knopf +
        '</td><td data-titel="Übernommen"><div>' + esc(z.was) + '<div class="klein">' + esc(z.p.hinweis) + '</div></div></td><td data-titel="Prüfstand" class="klein">' + esc(z.p.stand) + '</td></tr>';
    }).join('');
    var zk = $('zvg-knopf');
    if (zk) zk.addEventListener('click', function () {
      var f = $('zvg-form');
      var l = satzVon(land);
      f.elements.land_abk.value = l ? l.zvg : '';
      f.elements.ort.value = ort;
      f.submit();
    });
    $('volksbank-hinweis').textContent = 'Volksbanken: ' + D.portale.volksbank + ' Prüfstand der Portale: ' + datumDe(D.portale.geprueft) + '.';
  }
  $('suche-form').addEventListener('input', sucheZeigen);
  $('suche-form').addEventListener('change', sucheZeigen);
  $('suche-form').addEventListener('submit', function (ev) { ev.preventDefault(); });
  /* Ort Bremen setzt das Bundesland mit */
  $('s-ort').addEventListener('change', function () {
    var l = satzVon($('s-ort').value.trim());
    if (l) { $('s-land').value = l.land; sucheZeigen(); }
  });

  /* ---------- Merkliste ---------- */
  var MERK = 'immo-merkliste';
  var VERSION = 1;
  var liste = (speicherLesen(MERK) || {}).objekte || [];
  var bearbeiteId = null;
  var geloescht = null;

  function listeSpeichern() {
    var ok = speicherSchreiben(MERK, { app: 'immo-werkzeuge', version: VERSION, objekte: liste });
    if (!ok) $('m-meldung').textContent = 'Achtung: Der Browser lässt kein Speichern zu (z. B. privates Fenster). Die Liste geht beim Schließen verloren; bitte „Als Datei sichern“ nutzen.';
    return ok;
  }

  function kennzahlen(ob) {
    var land = satzVon(ob.land) || satzVon('Bremen');
    var notar = stand.notar !== null && stand.notar !== undefined ? stand.notar : 2;
    var nk = R.kaufnebenkosten(ob.preis, land.satz, notar, ob.makler || 0);
    var fin = R.finanzierung(ob.preis, nk.summe, 0, stand.ek || 0);
    var A = stand.A;
    var k = A ? R.kredit(fin.darlehen, A.zins, A.tilgung, A.bindung) : null;
    var v = R.vermietung({
      kaufpreis: ob.preis, gesamtkosten: fin.gesamt, kaltmieteMonat: ob.miete || 0,
      mietausfallProzent: stand.ausfall || 0, nichtUmlagefaehigMonat: stand.nul || 0,
      ruecklageMonat: (stand.rueck || 0) * (ob.flaeche || 0) / 12, kreditrateMonat: k ? k.rate : 0
    });
    var mz = null;
    if (ob.betten > 0 && stand.monteur) {
      var s = stand.monteur;
      mz = R.monteur({ betten: ob.betten, preis: s.preis, belegungProzent: s.belegung, fixkosten: s.fix, variabel: s.variabel, abgabeProzent: s.abgabe, kreditrateMonat: k ? k.rate : 0 });
    }
    var ew = null, wa = stand.wert;
    if (wa && ob.miete > 0 && ob.we > 0 && ob.baujahr > 0 && ob.grund > 0 && ob.brw > 0) {
      var rnd = R.restnutzungsdauer(ob.baujahr, wa.stichjahr, wa.gnd, '');
      ew = R.ertragswert({ mieteMonat: ob.miete, wohnungen: ob.we, wohnflaeche: ob.flaeche || 0, verwaltungJeWE: wa.verw, instandJeM2: wa.inst,
        ausfallProzent: wa.ausfall, betriebskostenJahr: 0, bodenwert: ob.grund * ob.brw, lzProzent: wa.lz, rnd: rnd });
      ew.rnd = rnd;
    }
    return { nk: nk, fin: fin, k: k, v: v, mz: mz, ew: ew };
  }

  function ampel(brutto) {
    var g = wert('m-gruen'), y = wert('m-gelb');
    if (g === null || y === null || !isFinite(brutto) || brutto === 0) return '<span class="klein">-</span>';
    if (brutto >= g) return '<span class="ampel gruen">grün</span>';
    if (brutto >= y) return '<span class="ampel gelb">gelb</span>';
    return '<span class="ampel rot">rot</span>';
  }

  /* Rechner: Objekt aus der Merkliste übernehmen */
  function objektAuswahlFuellen() {
    var sel = $('r-objekt'), alt = sel.value;
    sel.innerHTML = '<option value="">Eigene Eingabe</option>' + liste.map(function (ob) {
      return '<option value="' + esc(ob.id) + '">' + esc(ob.titel) + ' (' + euro(ob.preis) + ')</option>';
    }).join('');
    sel.value = liste.some(function (ob) { return ob.id === alt; }) ? alt : '';
    $('r-objekt-hinweis').textContent = liste.length
      ? 'Setzt Kaufpreis, Bundesland, Makler, Wohnfläche und Kaltmiete des Objekts ein. Danach können Sie jeden Wert ändern.'
      : 'Noch keine Objekte in der Merkliste. Tragen Sie den Kaufpreis unten selbst ein oder legen Sie zuerst ein Objekt in der Merkliste an.';
    sel.disabled = !liste.length;
  }
  $('r-objekt').addEventListener('change', function (ev) {
    ev.stopPropagation();
    var ob = liste.filter(function (x) { return x.id === ev.target.value; })[0];
    if (!ob) return;
    function setze(id, n) { $(id).value = n ? String(n).replace('.', ',') : ''; }
    $('r-preis').value = fmt0.format(ob.preis);
    if (ob.land) $('r-land').value = ob.land;
    setze('r-makler', ob.makler);
    if (ob.flaeche) setze('r-flaeche', ob.flaeche);
    if (ob.miete) $('r-miete').value = fmt0.format(ob.miete);
    wertAusObjekt(ob);
    rechne();
    eingabenMerken();
  });

  /* Merkliste als Karten: je Haus ein Satz, die wichtigsten Zahlen, bester Wert je Zeile mit Stern (ab zwei Häusern) */
  function ampelArt(brutto) {
    var g = wert('m-gruen'), y = wert('m-gelb');
    if (g === null || y === null || !isFinite(brutto) || brutto === 0) return null;
    return brutto >= g ? 'gruen' : brutto >= y ? 'gelb' : 'rot';
  }
  /* Gebiet aus der Deutschlandkarte (karte.js): Ampel und Sterne des Landkreises; „top“ = Gebiet grün und Rendite-Ampel grün */
  var STERN_KURZ = { werk: function (s) { return s.text.split(',')[0]; }, hochschule: function () { return 'Hochschulort'; }, pendler: function () { return 'Pendlerzentrum'; } };
  function gebietHtml(g, top) {
    if (!g) return '<div class="klein merk-gebiet">Gebiet: Ort nicht erkannt. Im Formular („Ändern“) den Landkreis wählen.</div>';
    var name = { gut: 'gefragt', warn: 'mittel', schlecht: 'schwächer' }[g.ampel] || 'keine Daten';
    return '<div class="merk-gebiet">' + (top ? '<span class="merk-top">★ Gefragtes Gebiet und gute Rendite</span><br>' : '') +
      '<span class="ampel-punkt ' + (g.ampel || 'leer') + '" aria-hidden="true"></span>Gebiet ' + esc(name) + ': ' + esc(g.name) + (g.sicher ? '' : ' (vermutlich, bitte prüfen)') +
      g.sterne.map(function (s) { return ' <span class="k-st ' + s.art + '" aria-hidden="true">★</span>' + esc(STERN_KURZ[s.art](s)); }).join('') +
      ' <button type="button" class="k-zeige" data-karte="' + esc(g.ags) + '">auf der Karte</button>' +
      '<div class="klein">Eigene Einordnung nach Ihren Kartenregeln (Ebene ' + esc(g.ebene) + '), keine Kaufempfehlung.</div></div>';
  }
  function zeigeMerkKarten() {
    var daten = liste.map(function (ob) { return { ob: ob, z: kennzahlen(ob) }; });
    daten.forEach(function (d) {
      d.g = window.KARTE ? window.KARTE.gebietFuer(d.ob) : null;
      d.top = !!(d.g && d.g.ampel === 'gut' && d.ob.miete && d.z.v && ampelArt(d.z.v.bruttorendite) === 'gruen');
    });
    if ($('m-top-zuerst').checked) daten.sort(function (a, b) { return (b.top ? 1 : 0) - (a.top ? 1 : 0); });
    function werte(d) {
      var ob = d.ob, z = d.z, mitCf = ob.miete && z.k;
      return {
        preis: ob.preis,
        qm: ob.flaeche > 0 ? ob.preis / ob.flaeche : null,
        brutto: ob.miete ? z.v.bruttorendite : null,
        cf: mitCf ? z.v.cashflowMonat : null
      };
    }
    var alle = daten.map(werte), best = {};
    if (daten.length >= 2) {
      [['preis', -1], ['qm', -1], ['brutto', 1], ['cf', 1]].forEach(function (p) {
        var vs = alle.map(function (w) { return w[p[0]]; }).filter(function (x) { return x !== null; });
        if (vs.length >= 2) best[p[0]] = p[1] > 0 ? Math.max.apply(null, vs) : Math.min.apply(null, vs);
      });
    }
    function zeile(name, text, schluessel, w, klasse) {
      var b = schluessel && best[schluessel] !== undefined && w[schluessel] === best[schluessel];
      return '<dt>' + esc(name) + '</dt><dd class="' + (klasse || '') + (b ? ' best' : '') + '"' + (b ? ' title="bester Wert in der Liste"' : '') + '>' + esc(text) + '</dd>';
    }
    /* Farbband und Satz nach derselben Regel wie die Ampel im Rechner (Cashflow, Zinsen); die Rendite-Ampel steht getrennt darunter */
    var bandFarbe = { gut: 'var(--gut)', warn: 'var(--warn)', schlecht: 'var(--schlecht)' };
    var gruenAb = wert('m-gruen'), gelbAb = wert('m-gelb');
    $('m-karten').innerHTML = daten.map(function (d, i) {
      var ob = d.ob, z = d.z, w = alle[i];
      var art = w.brutto !== null ? ampelArt(w.brutto) : null;
      var cfArt = null, satz = 'Tragen Sie eine Miete ein, dann sehen Sie, ob es sich trägt.';
      if (w.cf !== null) {
        /* ohne Tilgung ist der Plan leer: dann Zinsen wie im Rechner aus Darlehen und Sollzins */
        var zinsen = z.k.plan.length ? z.k.plan[0].zinsen / 12 : z.fin.darlehen * stand.A.zins / 1200;
        if (w.cf >= 0) { cfArt = 'gut'; satz = 'Die Miete trägt die Rate. Es bleiben ' + euro(w.cf) + ' im Monat.'; }
        else if (z.v.reinertragMonat >= zinsen) { cfArt = 'warn'; satz = 'Sie legen etwa ' + euro(-w.cf) + ' im Monat drauf. Die Miete deckt aber die Zinsen.'; }
        else { cfArt = 'schlecht'; satz = 'Die Miete reicht nicht einmal für die Zinsen. Es fehlen ' + euro(-w.cf) + ' im Monat.'; }
      }
      var schwelle = art === 'gruen' ? 'ab ' + fmt1.format(gruenAb) + NB + '%' : art === 'gelb' ? 'ab ' + fmt1.format(gelbAb) + NB + '%' : 'unter ' + fmt1.format(gelbAb) + NB + '%';
      var titel = ob.link ? '<a href="' + esc(ob.link) + '" target="_blank" rel="noopener">' + esc(ob.titel) + '</a>' : esc(ob.titel);
      var ort = ob.ort && ob.land && ob.ort.toLowerCase() === ob.land.toLowerCase() ? [ob.ort] : [ob.ort, ob.land];
      return '<article class="merk-karte"' + (cfArt ? ' style="--ampelfarbe:' + bandFarbe[cfArt] + '"' : '') + '>' +
        (istBeispiel(ob) ? '<div><span class="annahme">Beispiel, erfunden</span></div>' : '') +
        '<h3>' + titel + '</h3>' +
        '<div class="ort">' + esc(ort.filter(Boolean).join(', ') || 'Ort fehlt') +
          (ob.flaeche ? ', ' + fmt0.format(ob.flaeche) + NB + 'm²' : '') + '</div>' +
        '<div class="satzchen">' + (cfArt ? '<span class="sprung">' + { gut: 'Ampel grün: ', warn: 'Ampel gelb: ', schlecht: 'Ampel rot: ' }[cfArt] + '</span>' : '') + esc(satz) + '</div>' +
        (art ? '<div class="klein"><span class="ampel ' + art + '">Rendite-Ampel ' + art.replace('ue', 'ü') + '</span> (Bruttorendite ' + schwelle + ')</div>' : '') +
        gebietHtml(d.g, d.top) +
        '<dl>' +
          zeile('Kaufpreis', euro(ob.preis), 'preis', w) +
          (w.qm !== null ? zeile('Preis pro m²', euro(w.qm), 'qm', w) : '') +
          (w.brutto !== null ? zeile('Bruttorendite', prozent(w.brutto), 'brutto', w) : '') +
          (w.cf !== null ? zeile('Bleibt im Monat', euro(w.cf), 'cf', w, vorzeichenKlasse(w.cf)) : '') +
          zeile('Gesamtkosten mit Nebenkosten', euro(z.fin.gesamt)) +
          (z.ew ? zeile('Ertragswert (Schätzung)', euro(z.ew.allgemein) + ' · Preis ' + fmt0.format(ob.preis / z.ew.allgemein * 100) + NB + '%') : '') +
          (z.mz ? zeile('Als Monteurzimmer', euro(z.mz.nachKredit) + ' im Monat', null, w, vorzeichenKlasse(z.mz.nachKredit)) : '') +
        '</dl>' +
        (ob.notiz ? '<div class="klein">' + esc(ob.notiz) + '</div>' : '') +
        besichtigungStandHtml(ob) +
        '<div class="knopfreihe">' +
          '<button type="button" class="knopf zweit" data-besichtigung="' + esc(ob.id) + '">Besichtigung<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
          '<button type="button" class="knopf zweit" data-mappe="' + esc(ob.id) + '">Bank-Mappe<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
          '<button type="button" class="knopf zweit" data-bearbeiten="' + esc(ob.id) + '">Ändern<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
          '<button type="button" class="knopf zweit" data-loeschen="' + esc(ob.id) + '">Löschen<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
        '</div></article>';
    }).join('');
  }

  /* Häuser für die Karte (Punkte, Steckbrief) und neu zeichnen, wenn sich Kartenregeln ändern */
  window.KARTE_HAEUSER = function () {
    return liste.map(function (ob) {
      var g = window.KARTE && window.KARTE.gebietFuer(ob);
      if (!g) return null;
      var z = kennzahlen(ob), b = ob.miete && z.v ? z.v.bruttorendite : null, a = b != null ? ampelArt(b) : null;
      return { ags: g.ags, titel: ob.titel, brutto: b, art: { gruen: 'gut', gelb: 'warn', rot: 'schlecht' }[a] || null };
    }).filter(Boolean);
  };
  window.KARTE_GEAENDERT = function () { if (liste.length) zeigeMerkKarten(); };
  $('m-top-zuerst').addEventListener('change', zeigeMerkKarten);
  $('m-karten').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-karte]');
    if (!b || !window.KARTE) return;
    zeigeBereich('karte', true);
    window.KARTE.waehle(b.getAttribute('data-karte'));
  });
  /* Landkreis-Auswahl im Formular und Hinweis, was aus dem Ort erkannt wurde */
  if (window.KARTE) {
    $('m-kreis').innerHTML = '<option value="">automatisch aus dem Ort</option>' + window.KARTE.kreisListe().map(function (k) {
      return '<option value="' + esc(k.ags) + '">' + esc(k.name + ' (' + k.land + ')') + '</option>';
    }).join('');
  }
  function kreisHinweis() {
    var h = $('m-kreis-hinweis');
    if (!window.KARTE || $('m-kreis').value) { h.textContent = ''; return; }
    var g = window.KARTE.gebietFuer({ ort: $('m-ort').value, land: $('m-land').value });
    h.textContent = !$('m-ort').value.trim() ? '' : g ? 'Erkannt: ' + g.name + (g.sicher ? '' : ' (mehrere Orte heißen so, bitte prüfen)') : 'Ort nicht erkannt, bitte Landkreis wählen.';
  }
  ['m-ort', 'm-land', 'm-kreis'].forEach(function (id) { $(id).addEventListener('input', kreisHinweis); $(id).addEventListener('change', kreisHinweis); });

  function zeigeMerkliste() {
    var tb = $('m-tabelle').querySelector('tbody');
    $('m-leer').hidden = liste.length > 0;
    $('m-tabelle-box').hidden = liste.length === 0;
    $('m-band-regel-box').hidden = liste.length === 0;
    objektAuswahlFuellen();
    zeigeMerkKarten();
    tb.innerHTML = liste.map(function (ob) {
      var z = kennzahlen(ob);
      var qm = ob.flaeche > 0 ? euro(ob.preis / ob.flaeche) : '-';
      var titel = ob.link ? '<a href="' + esc(ob.link) + '" target="_blank" rel="noopener">' + esc(ob.titel) + '</a>' : esc(ob.titel);
      return '<tr>' +
        '<td data-titel="Objekt"><div>' + titel + '<div class="klein">' + esc([ob.ort, ob.land].filter(Boolean).join(', ')) +
          (ob.zimmer ? ', ' + fmt0.format(ob.zimmer) + ' Zi.' : '') + (ob.flaeche ? ', ' + fmt0.format(ob.flaeche) + NB + 'm²' : '') + '</div>' +
          (ob.notiz ? '<div class="klein">' + esc(ob.notiz) + '</div>' : '') + '</div></td>' +
        '<td class="z" data-titel="Kaufpreis">' + euro(ob.preis) + '</td>' +
        '<td class="z" data-titel="€/m²">' + qm + '</td>' +
        '<td class="z" data-titel="Bruttorendite">' + (ob.miete ? prozent(z.v.bruttorendite) : '-') + '</td>' +
        '<td class="z" data-titel="Faktor">' + (ob.miete ? faktor(z.v.kaufpreisfaktor) : '-') + '</td>' +
        '<td class="z" data-titel="Gesamtkosten">' + euro(z.fin.gesamt) + '</td>' +
        '<td class="z ' + (ob.miete && z.k ? vorzeichenKlasse(z.v.cashflowMonat) : '') + '" data-titel="Cashflow/Monat">' + (ob.miete && z.k ? euro(z.v.cashflowMonat) : '-') + '</td>' +
        '<td class="z" data-titel="Ertragswert">' + (z.ew ? '<div>' + euro(z.ew.allgemein) + '<div class="klein">Preis ' + fmt0.format(ob.preis / z.ew.allgemein * 100) + NB + '%</div></div>' : '-') + '</td>' +
        '<td class="z ' + (z.mz ? vorzeichenKlasse(z.mz.nachKredit) : '') + '" data-titel="Monteur-Ergebnis">' + (z.mz ? euro(z.mz.nachKredit) : '-') + '</td>' +
        '<td data-titel="Ampel">' + (ob.miete ? ampel(z.v.bruttorendite) : '-') + '</td>' +
        '<td data-titel="Aktion"><div class="knopfreihe" style="margin:0">' +
          '<button type="button" class="knopf zweit" data-bearbeiten="' + esc(ob.id) + '">Ändern<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
          '<button type="button" class="knopf zweit" data-loeschen="' + esc(ob.id) + '">Löschen<span class="sprung"> ' + esc(ob.titel) + '</span></button>' +
        '</div></td></tr>';
    }).join('');
  }

  var mFelder = ['m-titel', 'm-ort', 'm-land', 'm-kreis', 'm-preis', 'm-flaeche', 'm-zimmer', 'm-miete', 'm-makler', 'm-betten', 'm-we', 'm-baujahr', 'm-grund', 'm-brw', 'm-link', 'm-notiz'];
  var mZahlen = [['m-preis', 'preis'], ['m-flaeche', 'flaeche'], ['m-zimmer', 'zimmer'], ['m-miete', 'miete'], ['m-makler', 'makler'], ['m-betten', 'betten'],
    ['m-we', 'we'], ['m-baujahr', 'baujahr'], ['m-grund', 'grund'], ['m-brw', 'brw']];
  function formularLeeren() {
    mFelder.forEach(function (id) {
      if (id === 'm-land') $(id).value = 'Bremen';
      else if (id === 'm-makler') $(id).value = '3,57';
      else $(id).value = '';
      $(id).removeAttribute('aria-invalid');
      if ($(id + '-f')) $(id + '-f').textContent = '';
    });
    bearbeiteId = null;
    $('m-form-titel').textContent = '+ Haus hinzufügen (auch per Anzeige einfügen)';
    $('m-speichern').textContent = 'Auf die Merkliste setzen';
    $('m-abbrechen').hidden = true;
  }

  /* Anzeige einfügen: kopierten Anzeigentext lesen (RECHNER.anzeigeLesen) und ins Formular setzen.
     Gespeichert wird erst mit „Auf die Merkliste setzen“, damit der Nutzer vorher prüft. */
  $('m-anzeige-lesen').addEventListener('click', function () {
    var text = $('m-anzeige-text').value, link = $('m-anzeige-link').value.trim(), meld = $('m-anzeige-meldung');
    if (!text.trim() && !link) { meld.textContent = 'Bitte zuerst den Text der Anzeige einfügen (Strg+A, Strg+C auf der Anzeige, dann hier Strg+V).'; $('m-anzeige-text').focus(); return; }
    var w = window.RECHNER.anzeigeLesen(text);
    if (link && !/^https?:\/\//i.test(link)) { meld.textContent = 'Der Link muss mit http:// oder https:// beginnen. Bitte aus der Adresszeile des Browsers kopieren.'; $('m-anzeige-link').focus(); return; }
    var gefunden = [], fehlt = [];
    function setze(id, wert, name, text) {
      if (wert == null) { fehlt.push(name); return; }
      $(id).value = text; $(id).removeAttribute('aria-invalid'); if ($(id + '-f')) $(id + '-f').textContent = '';
      gefunden.push(name + ' ' + text.replace(/\s/g, ' '));
    }
    setze('m-preis', w.preis, 'Kaufpreis', w.preis != null ? fmt0.format(w.preis) + ' €' : '');
    setze('m-flaeche', w.flaeche, 'Wohnfläche', w.flaeche != null ? String(w.flaeche).replace('.', ',') + ' m²' : '');
    setze('m-miete', w.miete, 'Kaltmiete', w.miete != null ? fmt0.format(w.miete) + ' €' + (w.mieteJahr ? ' (Jahresmiete ÷ 12)' : '') : '');
    setze('m-zimmer', w.zimmer, 'Zimmer', w.zimmer != null ? String(w.zimmer).replace('.', ',') : '');
    setze('m-grund', w.grund, 'Grundstück', w.grund != null ? fmt0.format(w.grund) + ' m²' : '');
    setze('m-baujahr', w.baujahr, 'Baujahr', w.baujahr != null ? String(w.baujahr) : '');
    setze('m-makler', w.makler, 'Provision', w.makler != null ? String(w.makler).replace('.', ',') + ' %' : '');
    if (w.we != null) setze('m-we', w.we, 'Wohnungen', String(w.we));
    /* Einheiten nur in der Meldung; in die Felder kommt die reine Zahl */
    ['m-preis', 'm-flaeche', 'm-miete', 'm-grund', 'm-makler'].forEach(function (id) { $(id).value = $(id).value.replace(/\s*(€|m²|%).*$/, ''); });
    if (w.ort) {
      $('m-ort').value = (w.plz ? w.plz + ' ' : '') + w.ort; gefunden.push('Ort ' + $('m-ort').value);
      /* Stadtstaaten: Ort = Bundesland (Bremen, Hamburg, Berlin); sonst bleibt die Auswahl */
      var stadtstaat = satzVon(w.ort);
      if (stadtstaat) $('m-land').value = stadtstaat.land;
    } else fehlt.push('Ort');
    var url = link || w.link || '';
    if (url) $('m-link').value = url;
    if (!$('m-titel').value.trim()) {
      $('m-titel').value = (w.zimmer ? String(w.zimmer).replace('.', ',') + '-Zimmer-Haus' : 'Haus') + (w.ort ? ' ' + w.ort : '') + (w.flaeche ? ', ' + String(w.flaeche).replace('.', ',') + ' m²' : '');
    }
    if (!$('m-notiz').value.trim()) $('m-notiz').value = 'Aus Anzeige übernommen am ' + new Date().toLocaleDateString('de-DE') + '.';
    if (w.zimmer != null || w.grund != null || w.baujahr != null || w.we != null || url) document.querySelector('#m-form details.mehr').open = true;
    $('m-anzeige-text').value = '';
    meld.textContent = gefunden.length
      ? 'Gefunden: ' + gefunden.join(', ') + '.' + (fehlt.length ? ' Nicht gefunden: ' + fehlt.join(', ') + '.' : '') + ' Bundesland bitte prüfen. Alles kontrollieren, dann unten „Auf die Merkliste setzen“.'
      : 'Im Text wurden keine Angaben erkannt. Bitte prüfen, ob der ganze Text der Anzeige kopiert wurde (Strg+A auf der Anzeige), oder die Werte unten selbst eintragen.';
    $('m-titel').focus();
  });

  $('m-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var fehler = [];
    var titel = $('m-titel').value.trim();
    if (!titel) { $('m-titel-f').textContent = 'Bitte eine Bezeichnung eingeben.'; $('m-titel').setAttribute('aria-invalid', 'true'); fehler.push('m-titel'); }
    else { $('m-titel-f').textContent = ''; $('m-titel').removeAttribute('aria-invalid'); }
    var nums = {};
    mZahlen.map(function (p) { return p[0]; }).forEach(function (id) {
      var n = pruefeFeld(id, true);
      if (n === null) fehler.push(id);
      nums[id] = n;
    });
    if (nums['m-preis'] === 0 || $('m-preis').value.trim() === '') {
      $('m-preis-f').textContent = 'Bitte den Kaufpreis eingeben.'; $('m-preis').setAttribute('aria-invalid', 'true'); fehler.push('m-preis');
    }
    var link = $('m-link').value.trim();
    if (link && !/^https?:\/\/\S+$/i.test(link)) {
      $('m-link-f').textContent = 'Der Link muss mit http:// oder https:// beginnen.'; $('m-link').setAttribute('aria-invalid', 'true'); fehler.push('m-link');
    } else { $('m-link-f').textContent = ''; $('m-link').removeAttribute('aria-invalid'); }
    if (fehler.length) {
      $('m-meldung').textContent = 'Nicht gespeichert: Bitte die markierten Felder prüfen.';
      $(fehler[0]).focus();
      return;
    }
    var ob = {
      id: bearbeiteId || ('o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      titel: titel, ort: $('m-ort').value.trim(), land: $('m-land').value,
      preis: nums['m-preis'], flaeche: nums['m-flaeche'], zimmer: nums['m-zimmer'], miete: nums['m-miete'],
      makler: nums['m-makler'], betten: nums['m-betten'], we: nums['m-we'], baujahr: nums['m-baujahr'], grund: nums['m-grund'], brw: nums['m-brw'],
      link: link, notiz: $('m-notiz').value.trim(),
      geaendert: new Date().toISOString().slice(0, 10)
    };
    if ($('m-kreis').value) ob.kreis = $('m-kreis').value; /* von Hand gewählter Landkreis, sonst aus dem Ort */
    /* Felder, die das Formular nicht kennt, beim Ändern behalten (Besichtigung, Beispiel-Kennzeichen) */
    var vorher = bearbeiteId ? liste.filter(function (x) { return x.id === bearbeiteId; })[0] : null;
    if (vorher && vorher.besichtigung) ob.besichtigung = vorher.besichtigung;
    if (vorher && vorher.beispiel) ob.beispiel = true;
    var war = bearbeiteId;
    if (war) liste = liste.map(function (x) { return x.id === war ? ob : x; });
    else liste.push(ob);
    var gespeichert = listeSpeichern();
    $('m-neu').open = false;
    formularLeeren();
    zeigeMerkliste();
    if (gespeichert) $('m-meldung').textContent = (war ? 'Geändert: ' : 'Gespeichert: ') + ob.titel + '.';
  });
  $('m-abbrechen').addEventListener('click', function () { formularLeeren(); $('m-meldung').textContent = 'Bearbeiten abgebrochen.'; });

  function merkKlick(ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    var id = b.getAttribute('data-bearbeiten') || b.getAttribute('data-loeschen');
    var ob = liste.filter(function (x) { return x.id === id; })[0];
    if (!ob) return;
    if (b.hasAttribute('data-bearbeiten')) {
      bearbeiteId = ob.id;
      $('m-titel').value = ob.titel; $('m-ort').value = ob.ort || ''; $('m-land').value = ob.land || 'Bremen';
      mZahlen.forEach(function (p) {
        $(p[0]).value = ob[p[1]] ? (p[1] === 'baujahr' ? String(ob[p[1]]) : String(ob[p[1]]).replace('.', ',')) : '';
      });
      $('m-link').value = ob.link || ''; $('m-notiz').value = ob.notiz || '';
      $('m-kreis').value = ob.kreis || ''; kreisHinweis();
      $('m-form-titel').textContent = 'Haus ändern: ' + ob.titel;
      $('m-speichern').textContent = 'Änderung speichern';
      $('m-neu').open = true;
      $('m-abbrechen').hidden = false;
      $('m-meldung').textContent = '';
      $('m-neu').scrollIntoView({ block: 'start' });
      $('m-titel').focus();
    } else {
      geloescht = { ob: ob, pos: liste.indexOf(ob) };
      liste = liste.filter(function (x) { return x.id !== id; });
      listeSpeichern();
      zeigeMerkliste();
      $('m-meldung').innerHTML = 'Gelöscht: ' + esc(ob.titel) + '. <button type="button" class="knopf zweit" id="m-rueckgaengig">Rückgängig</button>';
      $('m-rueckgaengig').addEventListener('click', function () {
        if (!geloescht) return;
        liste.splice(geloescht.pos, 0, geloescht.ob);
        listeSpeichern();
        zeigeMerkliste();
        $('m-meldung').textContent = 'Wiederhergestellt: ' + geloescht.ob.titel + '.';
        geloescht = null;
      });
    }
  }
  $('m-tabelle').addEventListener('click', merkKlick);
  $('m-karten').addEventListener('click', merkKlick);
  ['m-gruen', 'm-gelb'].forEach(function (id) { $(id).addEventListener('input', zeigeMerkliste); });

  /* Export und Import */
  function dateiSichern(objekte, namenszusatz) {
    var daten = JSON.stringify({ app: 'immo-werkzeuge', version: VERSION, exportiert: new Date().toISOString(), objekte: objekte }, null, 2);
    var blob = new Blob([daten], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    var tag = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = 'merkliste_' + tag + (namenszusatz || '') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return a.download;
  }
  $('m-export').addEventListener('click', function () {
    var echte = liste.filter(function (o) { return !istBeispiel(o); });
    if (!echte.length) { $('m-datei-meldung').textContent = 'Die Merkliste ist leer (das Beispiel zählt nicht), es gibt nichts zu sichern.'; return; }
    var name = dateiSichern(echte);
    $('m-datei-meldung').textContent = 'Datei „' + name + '“ wird heruntergeladen (' + objekte(echte.length) + '). Sie liegt im Download-Ordner des Browsers.';
  });

  var importBereit = null;
  function pruefeImport(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { return 'Die Datei ist kein gültiges JSON. Bitte eine Datei wählen, die mit „Als Datei sichern“ erstellt wurde.'; }
    if (!d || d.app !== 'immo-werkzeuge' || !Array.isArray(d.objekte)) return 'Die Datei stammt nicht aus der Merkliste dieser Seite (Kennung fehlt).';
    if (d.version !== VERSION) return 'Die Datei hat Version ' + esc(d.version) + ', diese Seite kennt Version ' + VERSION + '. Import abgebrochen, damit nichts falsch gelesen wird.';
    for (var i = 0; i < d.objekte.length; i++) {
      var o = d.objekte[i];
      if (!o || typeof o.titel !== 'string' || typeof o.preis !== 'number' || !o.id) return 'Eintrag ' + (i + 1) + ' ist unvollständig (Bezeichnung, Kaufpreis oder Kennung fehlt).';
    }
    return d;
  }
  /* Das Label "Datei laden" ist per Tab erreichbar; Enter und Leertaste öffnen die Dateiauswahl (wie im Grundriss) */
  $('m-import-knopf').addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('m-import').click(); } });
  $('m-import').addEventListener('change', function () {
    var datei = this.files && this.files[0];
    this.value = '';
    if (!datei) return;
    var leser = new FileReader();
    leser.onerror = function () { $('m-datei-meldung').textContent = 'Die Datei konnte nicht gelesen werden.'; };
    leser.onload = function () {
      var d = pruefeImport(String(leser.result));
      if (typeof d === 'string') { $('m-datei-meldung').textContent = 'Nicht geladen: ' + d; $('m-import-wahl').hidden = true; return; }
      importBereit = d.objekte;
      $('m-datei-meldung').textContent = '';
      $('m-import-text').textContent = 'Die Datei „' + datei.name + '“ enthält ' + objekte(d.objekte.length) + '. Die Merkliste hat ' + objekte(liste.length) + '. Was soll passieren?';
      $('m-import-wahl').hidden = false;
      $('m-import-dazu').focus();
    };
    leser.readAsText(datei);
  });
  $('m-import-dazu').addEventListener('click', function () {
    if (!importBereit) return;
    var vorhanden = {};
    liste.forEach(function (x) { vorhanden[x.id] = true; });
    var neu = importBereit.filter(function (x) { return !vorhanden[x.id]; });
    liste = liste.concat(neu);
    listeSpeichern(); zeigeMerkliste();
    $('m-import-wahl').hidden = true;
    $('m-datei-meldung').textContent = objekte(neu.length) + ' hinzugefügt' + (importBereit.length - neu.length ? ', ' + (importBereit.length - neu.length) + ' waren schon vorhanden' : '') + '.';
    importBereit = null;
  });
  $('m-import-ersetzen').addEventListener('click', function () {
    if (!importBereit) return;
    var sicherung = liste.filter(function (o) { return !istBeispiel(o); }).length ? dateiSichern(liste.filter(function (o) { return !istBeispiel(o); }), '_vor_import') : null;
    liste = importBereit.slice();
    listeSpeichern(); zeigeMerkliste();
    $('m-import-wahl').hidden = true;
    $('m-datei-meldung').textContent = 'Liste ersetzt (' + objekte(liste.length) + ').' + (sicherung ? ' Die alte Liste wurde vorher als „' + sicherung + '“ heruntergeladen.' : '');
    importBereit = null;
  });
  $('m-import-abbruch').addEventListener('click', function () {
    importBereit = null; $('m-import-wahl').hidden = true; $('m-datei-meldung').textContent = 'Import abgebrochen, nichts geändert.';
  });

  /* ---------- Ganzseiten-Ansichten: Bank-Mappe und Besichtigung (Block 5) ----------
     Beide liegen außerhalb von <main> (kein Bereich der Reiterlogik). Beim Öffnen wird die Seite dahinter „inert“ (kein Tab, kein Vorlesen),
     Escape und „Zurück“ schließen, der Fokus geht zum auslösenden Knopf zurück. */
  var overlayAuf = null, overlaySel = null;
  var SEITE_TEILE = 'body > header, body > nav, body > main, body > footer, body > a.sprung';
  function overlayOeffnen(id, ausloeserSel, fokusId) {
    overlayAuf = $(id); overlaySel = ausloeserSel;
    document.querySelectorAll(SEITE_TEILE).forEach(function (e) { e.inert = true; });
    overlayAuf.hidden = false; overlayAuf.scrollTop = 0;
    document.documentElement.classList.add('overlay-offen');
    if (id === 'mappe-ov') document.body.classList.add('mappe-offen');
    $(fokusId).focus({ preventScroll: true });
  }
  function overlaySchliessen() {
    if (!overlayAuf) return;
    var war = overlayAuf.id, sel = overlaySel;
    overlayAuf.hidden = true; overlayAuf = null; overlaySel = null;
    document.querySelectorAll(SEITE_TEILE).forEach(function (e) { e.inert = false; });
    document.documentElement.classList.remove('overlay-offen');
    document.body.classList.remove('mappe-offen');
    if (war === 'bes-ov') zeigeMerkKarten();
    var a = sel ? document.querySelector(sel) : null;
    if (a) a.focus();
  }
  document.addEventListener('click', function (ev) { if (ev.target.closest('[data-overlay-zu]')) overlaySchliessen(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && overlayAuf) { ev.preventDefault(); overlaySchliessen(); } });

  /* ---- Besichtigung ---- */
  var BES = D.besichtigung || { gruppen: [], hinweis: '' };
  var BES_WERTE = ['ok', 'beob', 'mangel'];
  var besIds = {}, besGruppenIds = {}, besAnzahl = 0;
  BES.gruppen.forEach(function (g) { besGruppenIds[g.id] = true; g.punkte.forEach(function (p) { besIds[p.id] = true; besAnzahl++; }); });
  /* Gespeicherte Besichtigung lesen und säubern: nur bekannte Punkte und Werte, Notizen als begrenzter Text (auch aus importierten Dateien) */
  function besichtigungLesen(ob) {
    var b = ob && ob.besichtigung, r = { zeit: '', punkte: {}, notizen: {} };
    if (!b || typeof b !== 'object') return r;
    if (typeof b.zeit === 'string') r.zeit = b.zeit.slice(0, 10);
    Object.keys(b.punkte || {}).forEach(function (k) { if (besIds[k] && BES_WERTE.indexOf(b.punkte[k]) >= 0) r.punkte[k] = b.punkte[k]; });
    Object.keys(b.notizen || {}).forEach(function (k) { if (besGruppenIds[k] && typeof b.notizen[k] === 'string' && b.notizen[k].trim()) r.notizen[k] = b.notizen[k].slice(0, 3000); });
    return r;
  }
  function besichtigungZahlen(b) {
    var z = { ok: 0, beob: 0, mangel: 0 };
    Object.keys(b.punkte).forEach(function (k) { z[b.punkte[k]]++; });
    z.bewertet = z.ok + z.beob + z.mangel;
    return z;
  }
  function maengelText(n) { return n + ' ' + (n === 1 ? 'Mangel' : 'Mängel'); }
  function besichtigungStandHtml(ob) {
    var z = besichtigungZahlen(besichtigungLesen(ob));
    if (!z.bewertet) return '';
    return '<div class="bes-stand' + (z.mangel ? ' mangel' : '') + '"><b>' + maengelText(z.mangel) + '</b> bei der Besichtigung · ' + z.beob + ' zu beobachten · ' + z.bewertet + ' von ' + besAnzahl + ' Punkten bewertet</div>';
  }
  var besObjekt = null;
  function besichtigungSatz() {
    var z = besichtigungZahlen(besichtigungLesen(besObjekt)), art = 'leer', zeichen = '?', titel, klein;
    if (!z.bewertet) {
      titel = 'Noch nichts bewertet.';
      klein = 'Gehen Sie das Haus Punkt für Punkt durch. Hier steht dann, wie viele Mängel Sie gefunden haben.';
    } else {
      art = z.mangel ? 'warn' : 'gut'; zeichen = z.mangel ? '!' : '✓';
      titel = maengelText(z.mangel) + ', ' + z.beob + ' zu beobachten, ' + z.bewertet + ' von ' + besAnzahl + ' Punkten bewertet.';
      klein = 'Eigene Zählung, kein Gutachten. Bei Mängeln kann ein Sachverständiger die Kosten für die Reparatur schätzen.';
    }
    $('bes-satz').className = 'satz' + (art === 'leer' ? ' leer' : ' ' + art);
    $('bes-satz').querySelector('.lampe').textContent = zeichen;
    $('bes-satz-text').textContent = titel;
    $('bes-satz-klein').textContent = klein;
  }
  function besichtigungSpeichern() {
    if (!listeSpeichern()) $('bes-meldung').textContent = 'Nicht gespeichert: Der Browser lässt kein Speichern zu (zum Beispiel im privaten Fenster). Ihre Bewertungen gehen beim Schließen der Seite verloren.';
    else $('bes-meldung').textContent = '';
    besichtigungSatz();
  }
  function besichtigungOeffnen(id) {
    var ob = liste.filter(function (x) { return x.id === id; })[0];
    if (!ob) return;
    besObjekt = ob;
    var b = besichtigungLesen(ob);
    $('bes-haus').textContent = ob.titel + (ob.ort ? ', ' + ob.ort : '');
    $('bes-meldung').textContent = '';
    $('bes-hinweis').textContent = BES.hinweis;
    $('bes-gruppen').innerHTML = BES.gruppen.map(function (g) {
      return '<fieldset class="bes-gruppe"><legend>' + esc(g.titel) + '</legend>' + g.punkte.map(function (p) {
        var w = b.punkte[p.id] || '';
        function knopf(k, glyph, text) { return '<button type="button" data-w="' + k + '" aria-pressed="' + (w === k ? 'true' : 'false') + '"><span aria-hidden="true">' + glyph + '</span> ' + text + '</button>'; }
        return '<div class="bes-punkt" data-p="' + esc(p.id) + '"><p class="bes-frage" id="bq-' + esc(p.id) + '">' + esc(p.t) + (p.kurz ? '<small class="kurz">' + esc(p.kurz) + '</small>' : '') + '</p>' +
          '<div class="bes-wahl" role="group" aria-labelledby="bq-' + esc(p.id) + '">' + knopf('ok', '✓', 'ok') + knopf('beob', '!', 'beobachten') + knopf('mangel', '✕', 'Mangel') + '</div></div>';
      }).join('') +
        '<div class="bes-notiz"><label for="bn-' + esc(g.id) + '">Notizen: ' + esc(g.titel) + '</label><textarea id="bn-' + esc(g.id) + '" data-g="' + esc(g.id) + '" maxlength="3000" placeholder="z. B. was Ihnen aufgefallen ist, was der Verkäufer gesagt hat">' + esc(b.notizen[g.id] || '') + '</textarea></div></fieldset>';
    }).join('');
    besichtigungSatz();
    overlayOeffnen('bes-ov', '[data-besichtigung="' + id + '"]', 'bes-titel');
  }
  function besichtigungSchreiben(aenderung) {
    var b = besichtigungLesen(besObjekt);
    aenderung(b);
    b.zeit = new Date().toISOString().slice(0, 10);
    besObjekt.besichtigung = b;
    besichtigungSpeichern();
  }
  $('bes-gruppen').addEventListener('click', function (ev) {
    var k = ev.target.closest('button[data-w]');
    if (!k || !besObjekt) return;
    var p = k.closest('.bes-punkt'), id = p.getAttribute('data-p'), w = k.getAttribute('data-w');
    besichtigungSchreiben(function (b) { if (b.punkte[id] === w) delete b.punkte[id]; else b.punkte[id] = w; });
    var jetzt = besObjekt.besichtigung.punkte[id] || '';
    p.querySelectorAll('button[data-w]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-w') === jetzt ? 'true' : 'false'); });
  });
  $('bes-gruppen').addEventListener('input', function (ev) {
    var t = ev.target.closest('textarea[data-g]');
    if (!t || !besObjekt) return;
    besichtigungSchreiben(function (b) { if (t.value.trim()) b.notizen[t.getAttribute('data-g')] = t.value; else delete b.notizen[t.getAttribute('data-g')]; });
  });

  /* ---- Bank-Mappe ---- */
  /* Ampel wie im Ergebnissatz des Rechners (eigene Einordnung, keine Kaufempfehlung) */
  function mappeAmpel(m) {
    if (!(m.fin && m.A && m.v)) return null;
    var cf = m.v.cashflowMonat, zinsen = m.A.plan && m.A.plan.length ? m.A.plan[0].zinsen / 12 : m.fin.darlehen * m.A.zins / 1200;
    if (cf >= 0) return { art: 'gut', name: 'Grün', satz: 'Die Miete trägt die Rate. Es bleiben ' + euro(cf) + ' im Monat übrig.' };
    if (m.v.reinertragMonat >= zinsen) return { art: 'warn', name: 'Gelb', satz: 'Es fehlen etwa ' + euro(-cf) + ' im Monat. Die Miete deckt aber die Zinsen; was fehlt, fließt in die Tilgung.' };
    return { art: 'schlecht', name: 'Rot', satz: 'Die Miete reicht nicht einmal für die Zinsen. Es fehlen ' + euro(-cf) + ' im Monat.' };
  }
  /* Zahlen der Mappe aus einem Haus der Merkliste (kennzahlen) oder aus dem Rechner */
  function mappeDaten(id) {
    var m = { objekt: {}, annahmen: [] };
    if (id === 'rechner') {
      var s = stand.rechner;
      if (!s || !s.fin) return { fehler: 'Tragen Sie im Rechner zuerst einen Kaufpreis ein (Schritt 1), dann lässt sich die Mappe erstellen.' };
      var ob = liste.filter(function (x) { return x.id === $('r-objekt').value; })[0] || null;
      m.objekt = { ort: ob ? (ob.ort && ob.land && ob.ort.toLowerCase() === ob.land.toLowerCase() ? [ob.ort] : [ob.ort, ob.land]).filter(Boolean).join(', ') : s.land, nurLand: !ob, art: ob ? ob.titel : '', flaeche: ob ? ob.flaeche : (s.miete !== null && $('r-flaeche').value !== $('r-flaeche').defaultValue ? s.flaeche : null), baujahr: ob && ob.baujahr ? ob.baujahr : (s.baujahr || ''), we: ob ? ob.we : null, beispiel: ob ? istBeispiel(ob) : beispielAktiv() };
      m.preis = s.preis; m.nk = s.nk; m.zusatz = s.zusatz; m.fin = s.fin; m.ek = Math.min(s.ek, s.fin.gesamt); m.A = s.A; m.miete = s.miete; m.v = s.miete !== null ? s.v : null;
      m.ausfall = s.ausfall; m.nul = s.nul; m.rueck = s.rueck; m.flaeche = s.flaeche; m.notar = s.notar; m.makler = s.makler;
      m.quelle = 'Alle Zahlen stammen aus dem Rechner dieser Seite.';
    } else {
      var h = liste.filter(function (x) { return x.id === id; })[0];
      if (!h) return { fehler: 'Das Haus wurde nicht gefunden. Vielleicht wurde es gelöscht.' };
      if (!stand.A) return { fehler: 'Für die Mappe fehlen Zins, Tilgung und Zinsbindung. Tragen Sie im Rechner (Schritt 2) das Angebot A ein.' };
      var z = kennzahlen(h);
      m.objekt = { ort: (h.ort && h.land && h.ort.toLowerCase() === h.land.toLowerCase() ? [h.ort] : [h.ort, h.land]).filter(Boolean).join(', '), art: h.titel, flaeche: h.flaeche, baujahr: h.baujahr || '', we: h.we, zimmer: h.zimmer, beispiel: istBeispiel(h) };
      m.preis = h.preis; m.nk = z.nk; m.zusatz = 0; m.fin = z.fin; m.ek = Math.min(stand.ek || 0, z.fin.gesamt); m.A = z.k && { zins: stand.A.zins, tilgung: stand.A.tilgung, bindung: stand.A.bindung, rate: z.k.rate, restschuld: z.k.restschuld, plan: z.k.plan };
      m.miete = h.miete || null; m.v = h.miete ? z.v : null;
      m.ausfall = stand.ausfall || 0; m.nul = stand.nul || 0; m.rueck = stand.rueck || 0; m.flaeche = h.flaeche || 0; m.notar = stand.notar; m.makler = h.makler || 0;
      m.quelle = 'Preis, Fläche, Miete und Ort stammen aus der Merkliste. Eigenkapital, Zins, Tilgung, Zinsbindung, Kosten und Rücklage stammen aus Ihrem Rechner (Angebot A).';
    }
    m.brutto = m.v ? m.v.bruttorendite : null;
    return m;
  }
  function mappeZeigen(id) {
    var m = mappeDaten(id), heute = datumDe(new Date().toISOString().slice(0, 10));
    var html = '', teilen = [];
    $('mp-meldung').textContent = '';
    function pct(n) { return String(n).replace('.', ',') + NB + '%'; }
    function zeile(t, w, leise) { return '<tr><th scope="row">' + esc(t) + '</th><td>' + (w === null || w === undefined || w === '' ? '<span class="leise">nicht erfasst</span>' : esc(w) + (leise ? ' <span class="leise">' + esc(leise) + '</span>' : '')) + '</td></tr>'; }
    if (m.fehler) {
      html = '<div class="mp-fehler" role="alert"><b>Die Mappe lässt sich noch nicht erstellen.</b><br>' + esc(m.fehler) + '</div>';
      $('mp-inhalt').innerHTML = html; $('mp-teilen').innerHTML = '';
      overlayOeffnen('mappe-ov', id === 'rechner' ? '[data-mappe="rechner"]' : '[data-mappe="' + id + '"]', 'mp-titel');
      return;
    }
    var o = m.objekt, A = m.A, amp = mappeAmpel(m);
    html += '<p class="mp-kopfzeile">Erstellt am ' + esc(heute) + ' · Eigene Berechnung, keine Beratung</p>';
    if (o.beispiel) html += '<p class="mp-beispiel">BEISPIEL mit erfundenen Zahlen. Nicht für eine Bank gedacht.</p>';
    html += '<section class="mp-teil"><h3>Objekt</h3><table class="mp-tab"><tbody>' +
      zeile(o.nurLand ? 'Bundesland' : 'Ort', o.ort) + zeile('Bezeichnung und Art', o.art || null, o.art ? '(laut Merkliste)' : '') +
      zeile('Wohnfläche', o.flaeche ? fmt0.format(o.flaeche) + NB + 'm²' : null) + zeile('Baujahr', o.baujahr ? String(o.baujahr) : null) +
      (o.we ? zeile('Wohneinheiten', String(o.we)) : '') + '</tbody></table></section>';
    html += '<section class="mp-teil"><h3>Kauf und Finanzierung</h3><table class="mp-tab"><tbody>' +
      zeile('Kaufpreis', euro(m.preis)) +
      zeile('Kaufnebenkosten', euro(m.nk.summe), '(Grunderwerbsteuer ' + euro(m.nk.grest) + ', Notar und Grundbuch ' + euro(m.nk.notar) + ', Makler ' + euro(m.nk.makler) + ')') +
      (m.zusatz ? zeile('Renovierung und Sonstiges', euro(m.zusatz)) : '') +
      zeile('Gesamtkosten', euro(m.fin.gesamt)) +
      zeile('Eigenkapital', euro(m.ek)) +
      zeile('Darlehen', euro(m.fin.darlehen), '(' + pct(fmt1.format(m.fin.quote)) + ' vom Kaufpreis)') +
      (A ? zeile('Sollzins', pct(fmt2.format(A.zins))) + zeile('Anfängliche Tilgung', pct(fmt2.format(A.tilgung))) + zeile('Zinsbindung', String(A.bindung).replace('.', ',') + NB + 'Jahre') +
        zeile('Monatsrate', euro(A.rate)) + zeile('Restschuld nach der Zinsbindung', euro(A.restschuld)) : zeile('Kreditdaten', null)) +
      '</tbody></table></section>';
    html += '<section class="mp-teil"><h3>Miete und Ergebnis</h3><table class="mp-tab"><tbody>' +
      zeile('Kaltmiete pro Monat', m.miete ? euro(m.miete) : null) +
      zeile('Bruttorendite', m.brutto !== null ? pct(fmt1.format(m.brutto)) : null, m.brutto !== null ? '(Jahreskaltmiete ÷ Kaufpreis)' : '') +
      zeile('Reinertrag pro Monat', m.v ? euro(m.v.reinertragMonat) : null, m.v ? '(nach Mietausfall, Kosten und Rücklage, vor der Rate)' : '') +
      zeile('Überschuss pro Monat nach der Rate', m.v && A ? euro(m.v.cashflowMonat) : null, 'vor Steuern') + '</tbody></table>';
    html += amp ? '<div class="mp-ampel ' + amp.art + '"><b>Ampel ' + esc(amp.name) + '</b><span>' + esc(amp.satz) + ' Eigene Einordnung, keine Kaufempfehlung.</span></div>'
      : '<div class="mp-ampel"><b>Ampel offen</b><span>Für die Einordnung fehlen Kaltmiete oder Kreditdaten.</span></div>';
    html += '</section>';
    var an = [];
    if (A) an.push('Zinssatz ' + pct(fmt2.format(A.zins)) + ' und Tilgung ' + pct(fmt2.format(A.tilgung)) + ' (Angebot A) sind Annahmen, kein Angebot einer Bank; der Zins bleibt nur in der Zinsbindung gleich.');
    an.push('Notar und Grundbuch ' + (m.notar !== null && m.notar !== undefined ? pct(String(m.notar).replace('.', ',')) : 'laut Rechner') + ' vom Kaufpreis' + (m.makler ? ', Makler ' + pct(String(m.makler).replace('.', ',')) : ' (kein Makler)') + '; Grunderwerbsteuer nach Satz des Bundeslandes.');
    if (m.v) an.push('Mietausfall und Leerstand ' + pct(String(m.ausfall).replace('.', ',')) + ', nicht umlagefähige Kosten ' + euro(m.nul) + ' im Monat, Rücklage ' + euro(m.rueck) + ' je m² und Jahr: Schätzwerte.');
    an.push('Die Miete bleibt gleich. Steuern, Sondertilgungen und Wertänderungen sind nicht berücksichtigt.');
    an.push(m.quelle);
    html += '<section class="mp-teil"><h3>Annahmen</h3><ul class="mp-annahmen">' + an.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>';
    html += '<p class="mp-fuss">Stand ' + esc(heute) + '. Eigene Berechnung, keine Beratung: Sie ersetzt weder ein Angebot der Bank noch eine Anlage-, Steuer- oder Rechtsberatung. Alle Angaben sind ungeprüft.</p>';
    $('mp-inhalt').innerHTML = html;
    /* Zahlen für „Ergebnis weiterleiten“: nur Zahlen und der Ort, nie Notizen oder Besichtigung */
    function t(name, w) { if (w !== null && w !== undefined && w !== '' && w !== '-') teilen.push('<div class="wert"><dt>' + esc(name) + '</dt><dd>' + esc(w) + '</dd></div>'); }
    t('Ort', o.ort); t('Kaufpreis', euro(m.preis)); t('Kaufnebenkosten', euro(m.nk.summe)); t('Gesamtkosten', euro(m.fin.gesamt)); t('Eigenkapital', euro(m.ek)); t('Darlehen', euro(m.fin.darlehen));
    if (A) { t('Sollzins', pct(fmt2.format(A.zins))); t('Anfängliche Tilgung', pct(fmt2.format(A.tilgung))); t('Zinsbindung', String(A.bindung).replace('.', ',') + NB + 'Jahre'); t('Monatsrate', euro(A.rate)); t('Restschuld nach der Zinsbindung', euro(A.restschuld)); }
    if (m.miete) t('Kaltmiete pro Monat', euro(m.miete));
    if (m.brutto !== null) t('Bruttorendite', pct(fmt1.format(m.brutto)));
    if (m.v && A) t('Überschuss pro Monat nach der Rate', euro(m.v.cashflowMonat));
    if (amp) t('Ampel (eigene Einordnung)', amp.name);
    $('mp-teilen').innerHTML = teilen.join('');
    overlayOeffnen('mappe-ov', '[data-mappe="' + id + '"]', 'mp-titel');
  }
  $('mp-drucken').addEventListener('click', function () {
    try { window.print(); } catch (e) { $('mp-meldung').textContent = 'Das Drucken ließ sich nicht starten (' + e.message + '). Drücken Sie Strg+P (am Handy: Teilen oder Menü, dann Drucken).'; }
  });
  function mappeKlick(ev) {
    var b = ev.target.closest('[data-mappe]');
    if (b) { ev.preventDefault(); mappeZeigen(b.getAttribute('data-mappe')); return; }
    b = ev.target.closest('[data-besichtigung]');
    if (b) { ev.preventDefault(); besichtigungOeffnen(b.getAttribute('data-besichtigung')); }
  }
  document.addEventListener('click', mappeKlick);

  /* ---------- Prüflisten ---------- */
  var PRUEF = 'immo-pruefliste';
  var haken = speicherLesen(PRUEF) || {};
  var kaesten = Array.prototype.slice.call(document.querySelectorAll('.pruef input[type="checkbox"]'));
  kaesten.forEach(function (k) {
    k.checked = !!haken[k.id];
    k.addEventListener('change', function () { haken[k.id] = k.checked; speicherSchreiben(PRUEF, haken); });
  });
  $('p-zuruecksetzen').addEventListener('click', function () {
    document.querySelectorAll('#pruefliste .pruef input').forEach(function (k) { k.checked = false; haken[k.id] = false; });
    speicherSchreiben(PRUEF, haken);
  });

  /* Fortschritt im Ablauf */
  function fortschritt() {
    var alle = document.querySelectorAll('#pruefliste .pruef input'), an = 0;
    alle.forEach(function (k) { if (k.checked) an++; });
    $('p-fortschritt').textContent = an + ' von ' + alle.length + ' Schritten erledigt';
  }
  document.querySelectorAll('#pruefliste .pruef input').forEach(function (k) { k.addEventListener('change', fortschritt); });
  $('p-zuruecksetzen').addEventListener('click', fortschritt);
  fortschritt();

  /* ---------- Recht ---------- */
  if (D.recht) {
    var RE = D.recht;
    var textVon = function (o) { return Object.keys(o).map(function (k) { return String(o[k]); }).join(' ').toLowerCase(); };
    var zeigeRecht = function () {
      var q = $('re-suche').value.trim().toLowerCase(), bereich = $('re-bereich').value;
      var passt = function (o, b) { return (!q || textVon(o).indexOf(q) !== -1) && (!bereich || !b || b.indexOf(bereich) !== -1); };
      var bund = RE.bund.filter(function (g) { return passt(g, g.b); });
      $('re-bund').querySelector('tbody').innerHTML = bund.map(function (g) {
        return '<tr><td data-titel="Kürzel"><a href="' + esc(g.u) + '" target="_blank" rel="noopener"><strong>' + esc(g.k) + '</strong></a></td><td data-titel="Titel">' + esc(g.t) +
          '</td><td data-titel="Bereich" class="klein">' + esc(g.b) + '</td><td data-titel="Wann wichtig">' + esc(g.w) + '</td></tr>';
      }).join('') || '<tr><td colspan="4">Kein Treffer.</td></tr>';
      var bauBereich = !bereich || bereich === 'Umbau' || bereich === 'Kauf';
      var laender = RE.laender.filter(function (g) { return bauBereich && (!q || textVon(g).indexOf(q) !== -1 || 'bauordnung'.indexOf(q) !== -1); });
      $('re-laender').querySelector('tbody').innerHTML = laender.map(function (g) {
        return '<tr><td data-titel="Land">' + esc(g.l) + '</td><td data-titel="Bauordnung"><a href="' + esc(g.u) + '" target="_blank" rel="noopener">' + esc(g.t) + '</a>' +
          (g.g ? '' : ' <span class="klein">(im Browser gegenlesen)</span>') + '</td></tr>';
      }).join('') || '<tr><td colspan="2">Kein Treffer.</td></tr>';
      var regional = RE.regional.filter(function (g) { return !q || textVon(g).indexOf(q) !== -1; });
      $('re-regional').querySelector('tbody').innerHTML = regional.map(function (g) {
        return '<tr><td data-titel="Land">' + esc(g.l) + '</td><td data-titel="Vorschrift"><div><a href="' + esc(g.u) + '" target="_blank" rel="noopener">' + esc(g.t) + '</a><div class="klein">' + esc(g.w) + '</div></div></td></tr>';
      }).join('') || '<tr><td colspan="2">Kein Treffer.</td></tr>';
      $('re-stellen').querySelector('tbody').innerHTML = RE.stellen.map(function (g) {
        return '<tr><td data-titel="Stelle"><a href="' + esc(g.u) + '" target="_blank" rel="noopener">' + esc(g.t) + '</a></td><td data-titel="Wofür">' + esc(g.w) + '</td></tr>';
      }).join('');
      $('re-anzahl').textContent = (bund.length + laender.length + regional.length) + ' Einträge angezeigt. Stand der Titel und Links: ' + datumDe(RE.abruf) + ', zehn Landesbauordnungen ' + datumDe(RE.abrufLbo) + '.';
    };
    $('re-suche').addEventListener('input', zeigeRecht);
    $('re-bereich').addEventListener('change', zeigeRecht);
    zeigeRecht();
  }

  /* ---------- Monteurzimmer-Tabellen ---------- */
  if (D.monteurBremen) {
    var mb = D.monteurBremen;
    $('mz-preise').querySelector('tbody').innerHTML = mb.preise.map(function (p) {
      return '<tr><td data-titel="Gebiet">' + esc(p.gebiet) + '</td><td data-titel="Beobachtung">' + esc(p.angaben) + '</td></tr>';
    }).join('');
    $('mz-standorte').querySelector('tbody').innerHTML = mb.standorte.map(function (s) {
      return '<tr><td data-titel="Gebiet">' + esc(s.gebiet) + '</td><td data-titel="Stadtteile">' + esc(s.orte) + '</td><td data-titel="Merkmal">' + esc(s.merkmal) + '</td></tr>';
    }).join('');
    $('mz-preise-quelle').textContent = 'Quelle: ' + mb.quelle + ', Abruf ' + datumDe(mb.abruf) + '. Angebotspreise, keine erzielbaren Preise.';
  }

  /* ---------- Heizungs- und Energie-Check (Block 5, Bereich Umbau) ----------
     Regeln: RECHNER.heizungsCheck, Texte: daten/pflichten.js. Eigener Speicherplatz, nicht Teil des Umbau-Formulars (und damit nicht in Teilen-Links). */
  (function () {
    var P = D.pflichten, HZ = 'immo-heizcheck';
    var ids = ['hz-baujahr', 'hz-art', 'hz-einbau', 'hz-decke', 'hz-rohre'];
    var rang = { gilt: 0, moeglich: 1, pruefen: 2, info: 3, frei: 4 };
    var zeichen = { gilt: '!', moeglich: '!', pruefen: '?', info: 'i', frei: '✓' };
    if (!P) { $('hz-satz-text').textContent = 'Die Texte für diesen Check fehlen in dieser Fassung der Seite.'; return; }
    var gespeichert = speicherLesen(HZ) || {};
    ids.forEach(function (id) { if (typeof gespeichert[id] === 'string') $(id).value = gespeichert[id]; });
    zahlFeld('hz-baujahr', 1500, 2100); zahlFeld('hz-einbau', 1900, 2100);
    $('hz-baujahr').addEventListener('blur', function () { if ($('hz-baujahr').value.trim() !== '') pruefeFeld('hz-baujahr', true); });
    $('hz-einbau').addEventListener('blur', function () { if ($('hz-einbau').value.trim() !== '') pruefeFeld('hz-einbau', true); });
    function jahr(id) { return $(id).value.trim() === '' ? '' : wert(id); }
    function rechneHeizung() {
      var bj = jahr('hz-baujahr');
      if (bj === '' && $('r-baujahr').value.trim() !== '') bj = wert('r-baujahr') === null ? '' : wert('r-baujahr');
      var ein = jahr('hz-einbau');
      var liste = R.heizungsCheck({ baujahr: bj === null ? '' : bj, art: $('hz-art').value, einbau: ein === null ? '' : ein, decke: $('hz-decke').value, rohre: $('hz-rohre').value });
      liste.sort(function (a, b) { return rang[a.status] - rang[b.status]; });
      var anzGilt = liste.filter(function (p) { return p.status === 'gilt' || p.status === 'moeglich'; }).length;
      var anzPruef = liste.filter(function (p) { return p.status === 'pruefen'; }).length;
      var art = anzGilt ? 'warn' : anzPruef ? '' : 'gut';
      $('hz-satz').className = 'satz' + (art ? ' ' + art : '');
      $('hz-satz').querySelector('.lampe').textContent = anzGilt ? '!' : anzPruef ? '?' : '✓';
      $('hz-satz-text').textContent = anzGilt
        ? (anzGilt === 1 ? 'Ein Punkt kann auf Sie zukommen' : anzGilt + ' Punkte können auf Sie zukommen') + (anzPruef ? ', ' + anzPruef + ' brauchen noch Ihre Angaben oder eine Prüfung.' : '.')
        : anzPruef ? anzPruef + ' Punkte brauchen noch Ihre Angaben oder eine Prüfung.' : 'Nach Ihren Angaben kommt hier nichts Besonderes auf Sie zu.';
      $('hz-satz-klein').textContent = 'Stand der Gesetzestexte: ' + datumDe(P.abruf.split('.').reverse().join('-')) + '. Eigene Einordnung nach Ihren Angaben, keine Rechtsberatung.';
      $('hz-liste').innerHTML = liste.map(function (p) {
        var d = P.punkte[p.id], schluessel = p.status + (p.grund ? ':' + p.grund : '');
        var text = d.v[schluessel] || d.v[p.status] || '';
        var stufen = p.stufen ? '<ul class="pf-stufen">' + p.stufen.map(function (s) { return '<li><b>ab ' + esc(s.ab) + '</b>: mindestens ' + s.prozent + NB + '% der Wärme aus Biomethan, Bioöl, biogenem Flüssiggas oder Wasserstoff</li>'; }).join('') + '</ul>' : '';
        var kosten = d.kosten && (p.status === 'moeglich' || p.status === 'pruefen')
          ? '<p class="pf-kosten"><span class="annahme">Ratgeberwert</span> ' + esc(d.kosten) + ' Quelle: <a href="' + esc(d.kostenUrl) + '" target="_blank" rel="noopener">' + esc(d.kostenQuelle) + '</a>, Abruf ' + esc(d.kostenAbruf) + '.</p>' : '';
        var extra = '';
        if (p.id === 'heizung' && p.status === 'gilt') extra += '<p>' + esc(d.folgen) + ' <a href="' + esc(d.folgenUrl) + '" target="_blank" rel="noopener">§ 5a CO2KostAufG</a></p>';
        if (p.id === 'ausweis' && p.bedarfsausweisMoeglich) extra += '<p><span class="annahme">Vor Nutzung prüfen</span> ' + esc(d.bedarf) + '</p>';
        if (p.id === 'waermeplan') extra += '<p><a href="' + esc(d.karteUrl) + '" target="_blank" rel="noopener">Karte im Geoportal Bremen</a> <span class="klein">(' + esc(d.karteHinweis) + ')</span></p>';
        return '<li class="pf-punkt pf-' + p.status + '"><div class="pf-kopf"><span class="pf-chip"><span aria-hidden="true">' + zeichen[p.status] + '</span> ' + esc(P.status[p.status]) + '</span>' +
          '<h4>' + esc(d.titel) + '</h4></div>' +
          '<p>' + esc(text) + '</p>' + stufen + extra + kosten +
          '<p class="klein">Grundlage: <a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.para) + '</a> auf gesetze-im-internet.de, Abruf ' + esc(P.abruf) + '.</p></li>';
      }).join('');
      $('hz-fuss').textContent = P.fuss;
    }
    function aenderung() {
      var o = {};
      ids.forEach(function (id) { o[id] = $(id).value; });
      speicherSchreiben(HZ, o);
      rechneHeizung();
    }
    $('hz-box').addEventListener('input', aenderung);
    $('hz-box').addEventListener('change', aenderung);
    $('r-baujahr').addEventListener('input', rechneHeizung);
    rechneHeizung();
  })();

  /* ---------- Beispiel ansehen (daten/musterhaus.js) ----------
     Erfundenes Reihenhaus füllt Rechner und Merkliste. Vorher werden die eigenen Werte dieser Felder und die Merkliste
     in „immo-beispiel-sicherung“ gesichert (R020). Solange die Sicherung existiert, zeigt die Seite das blaue Band,
     auch nach dem Neuladen. „Beispiel leeren“ stellt die Felder wieder her und entfernt nur den Beispiel-Eintrag. */
  var BSP = 'immo-beispiel-sicherung';
  function istBeispiel(o) { return !!(o && (o.beispiel || o.id === 'beispiel-musterhaus')); }
  function beispielAktiv() { return speicherLesen(BSP) !== null; }
  function beispielBandZeigen() {
    var an = beispielAktiv();
    $('beispiel-band').hidden = !an && $('beispiel-fehler').hidden;
    $('beispiel-text').hidden = !an;
    $('beispiel-leeren').hidden = !an;
    document.querySelectorAll('[data-aktion="beispiel"], [data-aktion="beispiel-steuern"]').forEach(function (b) { b.hidden = an; });
  }
  function beispielFehler(text) {
    $('beispiel-fehler').textContent = text;
    $('beispiel-fehler').hidden = false;
    $('beispiel-band').hidden = false;
    $('beispiel-text').hidden = true;
    $('beispiel-leeren').hidden = true;
  }
  /* Alle Eingaben des Beispiels: Rechner, Wert und Umbau. Beim Umbau werden alle Mengen und Preise gesetzt (leer bzw. Startpreis),
     damit sich keine eigenen Mengen ins Beispiel mischen. */
  function beispielFelder(M) {
    var f = {};
    Object.keys(M.rechner).forEach(function (id) { f[id] = M.rechner[id]; });
    Object.keys(M.wert || {}).forEach(function (id) { f[id] = M.wert[id]; });
    Object.keys(M.steuer || {}).forEach(function (id) { f[id] = M.steuer[id]; });
    if (M.umbau) {
      SAN.bauteile.forEach(function (b) { f['u-m-' + b.id] = ''; f['u-p-' + b.id] = fmt0.format(b.start); });
      f['u-heizung'] = 'false';
      Object.keys(M.umbau).forEach(function (id) { f[id] = M.umbau[id]; });
    }
    return f;
  }
  function eingabeWert(el) { return el.type === 'checkbox' ? String(el.checked) : el.value; }
  function eingabeSetzen(el, v) {
    if (!el) return;
    if (el.type === 'checkbox') el.checked = v === 'true'; else el.value = v;
  }
  function beispielLaden() {
    var M = D.musterhaus;
    $('beispiel-fehler').hidden = true;
    if (!M) { beispielFehler('Das Beispiel fehlt in dieser Fassung der Seite.'); return false; }
    /* geteilte Zahlen zuerst zurückgeben, damit die Sicherung des Beispiels Ihre eigenen Zahlen enthält */
    if (speicherLesen(TEILEN_SICH)) teilenZurueck();
    var neuFelder = beispielFelder(M);
    var gesichert = speicherLesen(BSP);
    if (!gesichert) {
      var felder = {};
      Object.keys(neuFelder).forEach(function (id) { felder[id] = eingabeWert($(id)); });
      if (!speicherSchreiben(BSP, { felder: felder, merkliste: speicherLesen(MERK), zeit: new Date().toISOString() })) {
        beispielFehler('Das Beispiel wurde nicht geladen: Der Browser lässt kein Speichern zu (zum Beispiel im privaten Fenster), Ihre eigenen Eingaben wären nicht gesichert.');
        return false;
      }
    } else {
      /* Sicherung aus einer älteren Fassung (nur Rechner): Wert und Umbau nachtragen, solange das Beispiel sie noch nicht überschrieben hat */
      var fehlen = Object.keys(neuFelder).filter(function (id) { return !Object.prototype.hasOwnProperty.call(gesichert.felder || {}, id); });
      if (fehlen.length) {
        gesichert.felder = gesichert.felder || {};
        fehlen.forEach(function (id) { gesichert.felder[id] = eingabeWert($(id)); });
        speicherSchreiben(BSP, gesichert);
      }
    }
    Object.keys(neuFelder).forEach(function (id) { eingabeSetzen($(id), neuFelder[id]); });
    $('r-objekt').value = '';
    liste = liste.filter(function (o) { return !istBeispiel(o); });
    var ob = JSON.parse(JSON.stringify(M.objekt));
    ob.geaendert = new Date().toISOString().slice(0, 10);
    liste.push(ob);
    listeSpeichern();
    rechne(); eingabenMerken(); zeigeMerkliste(); beispielBandZeigen();
    return true;
  }
  function beispielLeeren() {
    var s = speicherLesen(BSP);
    if (!s) return;
    Object.keys(s.felder || {}).forEach(function (id) { eingabeSetzen($(id), s.felder[id]); });
    liste = liste.filter(function (o) { return !istBeispiel(o); });
    listeSpeichern();
    try { localStorage.removeItem(BSP); } catch (e) { beispielFehler('Das Beispiel konnte nicht ganz entfernt werden: ' + e.message); }
    rechne(); eingabenMerken(); zeigeMerkliste(); beispielBandZeigen();
  }
  function aktion(name) {
    if (name === 'beispiel') {
      if (beispielLaden()) { zeigeBereich('rechner', true); zeigeSchritt('r-form', 'r-schritte', 1, false); }
    } else if (name === 'beispiel-steuern') {
      if (beispielLaden()) zeigeBereich('steuern', true);
    } else if (name === 'teilen-zurueck') {
      teilenZurueck();
    } else if (name === 'beispiel-leeren') {
      beispielLeeren();
    } else if (name === 'erstes-haus') {
      if ($('merkliste').hidden) zeigeBereich('merkliste', true);
      $('m-neu').open = true;
      $('m-titel').focus();
    }
  }

  /* ---------- Start ---------- */
  vonAdresse();
  rechne();
  sucheZeigen();
  beispielBandZeigen();
  teilenBandZeigen();
})();
