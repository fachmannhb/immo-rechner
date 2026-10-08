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
    var b = ev.target.closest('[data-ziel]');
    if (b && !b.classList.contains('bereich-knopf')) { ev.preventDefault(); zeigeBereich(b.getAttribute('data-ziel'), true); }
    if (!ev.target.closest('#menue')) $('menue').open = false;
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('menue').open) { $('menue').open = false; $('menue').querySelector('summary').focus(); }
  });
  $('zur-start').addEventListener('click', function () { zeigeBereich('uebersicht', true); });
  function vonAdresse() {
    var t = $('tab-' + location.hash.slice(1));
    zeigeReiter(t && t.classList.contains('bereich-knopf') ? t : $('tab-uebersicht'), false, true);
  }
  window.addEventListener('popstate', vonAdresse);
  window.addEventListener('hashchange', vonAdresse);
  /* erster Aufruf von vonAdresse() erst unten beim Start, wenn alle Daten bereitstehen */

  /* Rechner in vier Schritten; alle Felder bleiben im Formular, nur die Anzeige wechselt */
  function zeigeSchritt(n, fokus) {
    document.querySelectorAll('#r-form .schritt').forEach(function (s) { s.hidden = s.getAttribute('data-schritt') !== String(n); });
    document.querySelectorAll('#r-schritte button').forEach(function (b) {
      if (b.getAttribute('data-schritt') === String(n)) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (fokus) {
      $('r-schritte').scrollIntoView({ block: 'start', behavior: ruhig ? 'auto' : 'smooth' });
      var h = document.querySelector('#r-form .schritt[data-schritt="' + n + '"] h3');
      h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    }
    zeichneGrafiken();
  }
  document.querySelectorAll('#r-schritte button').forEach(function (b) {
    b.addEventListener('click', function () { zeigeSchritt(b.getAttribute('data-schritt'), false); });
  });
  document.querySelectorAll('#r-form [data-geh]').forEach(function (b) {
    b.addEventListener('click', function () { zeigeSchritt(b.getAttribute('data-geh'), true); });
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
  var merkFelder = Array.prototype.slice.call(document.querySelectorAll('#r-form input, #r-form select, #mz-form input[type="text"], #mz-form input[type="range"], #w-form input, #w-form select'));
  merkFelder.forEach(function (el) {
    if (el.id !== 'r-objekt' && Object.prototype.hasOwnProperty.call(gemerkt, el.id)) el.value = gemerkt[el.id];
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
  function ergebnisSatz(fin, A, v) {
    var art = 'leer', zeichen = '?', titel, text, klein;
    if (!fin) {
      titel = 'Trag einen Kaufpreis ein.';
      klein = 'Dann steht hier in einem Satz, ob die Miete die Rate trägt.';
    } else if (!A || !v) {
      titel = 'Trag Kredit und Miete ein, dann kommt hier das Ergebnis.';
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
        titel = 'Du legst etwa ' + euro(-cf) + ' im Monat drauf.';
        klein = 'Die Miete deckt aber die Zinsen. Was du drauflegst, fließt in die Tilgung, also in dein eigenes Vermögen.';
      } else {
        art = 'schlecht'; zeichen = '✕';
        titel = 'Die Miete reicht nicht einmal für die Zinsen. Dir fehlen ' + euro(-cf) + ' im Monat.';
        klein = 'Mehr eigenes Geld, ein niedrigerer Preis oder mehr Miete würden helfen.';
      }
      klein += ' Eigene Einordnung, keine Kaufempfehlung.';
    }
    var name = { gut: 'Ampel grün: ', warn: 'Ampel gelb: ', schlecht: 'Ampel rot: ', leer: '' }[art];
    $('ue-kacheln').hidden = !fin;
    [['r-satz', ''], ['ue-satz', fin && A && v ? 'Dein Rechenbeispiel: ' : '']].forEach(function (p) {
      var box = $(p[0]);
      if (!box) return;
      box.className = 'satz ' + art;
      box.querySelector('.lampe').textContent = zeichen;
      text = $(p[0] + '-text');
      text.innerHTML = '<span class="sprung">' + esc(name) + '</span>' + esc(p[1] + titel);
      $(p[0] + '-klein').textContent = klein;
    });
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

    /* Schritt 5: langfristig und Steuer (R.langfrist), Angebot A mit gleicher Rate bis zur Tilgung */
    var ms = wert('r-ms'), ks = wert('r-ks'), ws = wert('r-ws'), nJahre = wert('r-jahre');
    var baujahr = $('r-baujahr').value.trim() === '' ? null : wert('r-baujahr');
    var gebAnteil = wert('r-gebanteil'), steuersatz = wert('r-steuersatz');
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
      '. Einkünfte = Miete − Mietausfall − nicht umlagefähige Kosten − Zinsen − AfA. Die Rücklage zählt erst, wenn das Geld für Reparaturen ausgegeben wird. Steuer = Einkünfte × dein Steuersatz; sind die Einkünfte negativ, sinkt deine Steuer auf anderes Einkommen. Nach Steuern = vor Steuern − Steuer.';
    $('r-langfrist-tabelle').querySelector('tbody').innerHTML = lf ? lf.jahre.map(function (j) {
      return '<tr><td data-titel="Jahr">' + j.jahr + '</td><td class="z" data-titel="Miete">' + euro(j.miete) + '</td><td class="z ' + vorzeichenKlasse(j.vorSteuer) + '" data-titel="Bleibt vor Steuern">' + euro(j.vorSteuer) + '</td>' +
        '<td class="z" data-titel="Steuer">' + euro(j.steuer) + '</td><td class="z ' + vorzeichenKlasse(j.nachSteuer) + '" data-titel="Bleibt nach Steuern">' + euro(j.nachSteuer) + '</td>' +
        '<td class="z" data-titel="Restschuld">' + euro(j.rest) + '</td><td class="z" data-titel="Hauswert">' + euro(j.wert) + '</td><td class="z" data-titel="Vermögen im Haus">' + euro(j.vermoegen) + '</td></tr>';
    }).join('') : '<tr><td colspan="8">Schritte 1 bis 3 und Angebot A vollständig ausfüllen.</td></tr>';
    $('ch-vermoegen-text').textContent = lfEnde
      ? 'Nach ' + lfEnde.jahr + ' Jahren: Hauswert ' + euro(lfEnde.wert) + ', Restschuld ' + euro(lfEnde.rest) + ', Vermögen im Haus ' + euro(lfEnde.vermoegen) +
        '. Zusammengezählt blieben in dieser Zeit ' + euro(lfEnde.kumNachSteuer) + ' nach Steuern übrig' + (lfEnde.kumNachSteuer < 0 ? ' (das heißt: so viel musst du insgesamt zuschießen)' : '') + '. Annahmen, keine Vorhersage; Zinsänderung nach der Zinsbindung siehe Schritt 4.'
      : '';

    stand = { preis: preis, notar: notar, ek: ek, A: A, nul: nul, rueck: rueck, ausfall: ausfall };

    /* Kennzahlen im Rechner und auf der Startseite; Euro-Beträge zählen beim Ändern sichtbar mit */
    kachel(['k-darlehen', 'ue-darlehen'], fin ? euro(fin.darlehen) : '-', '', fin ? prozent(fin.quote) + ' vom Kaufpreis' : '');
    kachel(['k-rate', 'ue-rate'], A ? euro(A.rate) : '-');
    kachel(['k-cashflow', 'ue-cashflow'], v && A ? euro(v.cashflowMonat) : '-', v && A ? vorzeichenKlasse(v.cashflowMonat) : '');
    kachel(['k-rendite', 'ue-rendite'], v ? prozent(v.bruttorendite) : '-');
    ergebnisSatz(fin, A, v);

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
    rechneMonteur();
    rechneWert();
    rechneUmbau();
    zeigeMerkliste();
  }

  /* ---------- Umbau ---------- */
  var SAN = D.sanierung || { bauteile: [], foerderung: [], ablauf: [], zuschlaege: {} };
  (function () {
    $('u-tabelle').querySelector('tbody').innerHTML = SAN.bauteile.map(function (b) {
      return '<tr><th scope="row">' + esc(b.name) + '<div class="klein">je ' + esc(b.einheit) + '</div></th>' +
        '<td data-titel="Menge"><input type="text" id="u-m-' + b.id + '" inputmode="decimal" value="" placeholder="0" aria-label="Menge ' + esc(b.name) + ' in ' + esc(b.einheit) + '"><div class="fehler" id="u-m-' + b.id + '-f"></div></td>' +
        '<td data-titel="€ je Einheit"><input type="text" id="u-p-' + b.id + '" inputmode="decimal" value="' + fmt0.format(b.start) + '" aria-label="Preis je ' + esc(b.einheit) + ' für ' + esc(b.name) + '"><div class="fehler" id="u-p-' + b.id + '-f"></div></td>' +
        '<td class="z" data-titel="Summe" id="u-s-' + b.id + '">-</td>' +
        '<td data-titel="Spanne" class="klein">' + fmt0.format(b.von) + ' bis ' + fmt0.format(b.bis) + NB + '€; ' + esc(b.quelle) + '</td></tr>';
    }).join('');
    $('u-foerder-tabelle').querySelector('tbody').innerHTML = SAN.foerderung.map(function (f) {
      return '<tr><td data-titel="Programm"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a></td><td data-titel="Höhe">' + esc(f.hoehe) +
        '</td><td data-titel="Für Vermieter">' + esc(f.vermieter) + '</td><td data-titel="Antrag">' + esc(f.vorher) + '</td><td data-titel="Status" class="klein">' + esc(f.status) + '</td></tr>';
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
  function rechneUmbau() {
    var summe = 0, ok = true;
    SAN.bauteile.forEach(function (b) {
      var m = wert('u-m-' + b.id), p = wert('u-p-' + b.id);
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
    var f = {};
    ['w-grund', 'w-brw', 'w-baujahr', 'w-stichjahr', 'w-gnd', 'w-wfl', 'w-we', 'w-miete', 'w-verw', 'w-inst', 'w-ausfall', 'w-betrieb', 'w-lz',
      'w-bgf', 'w-bpi', 'w-rf', 'w-aussen', 'w-swf', 'w-besonders', 'w-vgl'].forEach(function (id) { f[id] = wert(id); });
    var rndEigen = wert('w-rnd');
    var allesOk = Object.keys(f).every(function (k) { return f[k] !== null; }) && rndEigen !== null;
    stand.wert = allesOk ? { stichjahr: f['w-stichjahr'], gnd: f['w-gnd'], verw: f['w-verw'], inst: f['w-inst'], ausfall: f['w-ausfall'], lz: f['w-lz'] } : null;
    var kauf = stand.preis > 0 ? stand.preis : null;
    $('wk-kauf').textContent = kauf ? euro(kauf) : '-';
    if (!allesOk) { ['wk-boden', 'wk-ertrag', 'wk-sach', 'wk-vergleich'].forEach(function (id) { $(id).textContent = '-'; }); wertGrafik = null; return; }

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
    rh.textContent = 'Die berechnete Restnutzungsdauer ist kurz (' + (rnd === null ? 0 : fmt0.format(rnd)) + ' Jahre). Wurde das Gebäude modernisiert (Dach, Fenster, Leitungen, Heizung, Bäder, Dämmung), verlängert sie sich nach Anlage 2 ImmoWertV. Trag dann die Restnutzungsdauer selbst ein, am besten nach Rücksprache mit einem Sachverständigen.';

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
    if (ew) {
      $('w-satz-text').textContent = 'Nach dieser Schätzung ist das Haus etwa ' + euro(ew.allgemein) + ' wert.';
      $('w-satz-klein').textContent = kauf
        ? 'Der Kaufpreis liegt ' + fmt1.format(Math.abs((kauf / ew.allgemein - 1) * 100)) + NB + '% ' + (kauf >= ew.allgemein ? 'darüber' : 'darunter') + '. Ertragswert mit den Annahmen unten; schon ein halber Prozentpunkt beim Liegenschaftszins verschiebt den Wert deutlich.'
        : 'Ertragswert mit den Annahmen unten. Trag im Rechner einen Kaufpreis ein, dann steht hier der Vergleich.';
    } else {
      $('w-satz-text').textContent = 'Trag Grundstück, Bodenrichtwert, Baujahr, Wohnungen und Miete ein.';
      $('w-satz-klein').textContent = 'Dann steht hier eine Schätzung, was das Haus wert ist. Der Knopf „Werte aus dem Rechner übernehmen“ füllt schon einiges aus.';
    }
    zeichneWertGrafik();
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

  /* ---------- Diagramme ---------- */
  var grafikDaten = null;
  function zeichneGrafiken() {
    var G = window.GRAFIK;
    zeichneMonteurGrafik();
    zeichneWertGrafik();
    zeichneUmbauGrafik();
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

  ['r-form', 'mz-form', 'w-form', 'u-form'].forEach(function (id) {
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
      ? 'Setzt Kaufpreis, Bundesland, Makler, Wohnfläche und Kaltmiete des Objekts ein. Danach kannst du jeden Wert ändern.'
      : 'Noch keine Objekte in der Merkliste. Trag den Kaufpreis unten selbst ein oder lege zuerst ein Objekt in der Merkliste an.';
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
      '<div class="klein">Eigene Einordnung nach deinen Kartenregeln (Ebene ' + esc(g.ebene) + '), keine Kaufempfehlung.</div></div>';
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
      var cfArt = null, satz = 'Trag eine Miete ein, dann siehst du, ob es sich trägt.';
      if (w.cf !== null) {
        /* ohne Tilgung ist der Plan leer: dann Zinsen wie im Rechner aus Darlehen und Sollzins */
        var zinsen = z.k.plan.length ? z.k.plan[0].zinsen / 12 : z.fin.darlehen * stand.A.zins / 1200;
        if (w.cf >= 0) { cfArt = 'gut'; satz = 'Die Miete trägt die Rate. Es bleiben ' + euro(w.cf) + ' im Monat.'; }
        else if (z.v.reinertragMonat >= zinsen) { cfArt = 'warn'; satz = 'Du legst etwa ' + euro(-w.cf) + ' im Monat drauf. Die Miete deckt aber die Zinsen.'; }
        else { cfArt = 'schlecht'; satz = 'Die Miete reicht nicht einmal für die Zinsen. Es fehlen ' + euro(-w.cf) + ' im Monat.'; }
      }
      var schwelle = art === 'gruen' ? 'ab ' + fmt1.format(gruenAb) + NB + '%' : art === 'gelb' ? 'ab ' + fmt1.format(gelbAb) + NB + '%' : 'unter ' + fmt1.format(gelbAb) + NB + '%';
      var titel = ob.link ? '<a href="' + esc(ob.link) + '" target="_blank" rel="noopener">' + esc(ob.titel) + '</a>' : esc(ob.titel);
      var ort = ob.ort && ob.land && ob.ort.toLowerCase() === ob.land.toLowerCase() ? [ob.ort] : [ob.ort, ob.land];
      return '<article class="merk-karte"' + (cfArt ? ' style="--ampelfarbe:' + bandFarbe[cfArt] + '"' : '') + '>' +
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
        '<div class="knopfreihe">' +
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
    $('m-band-regel').hidden = liste.length === 0;
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
    if (!liste.length) { $('m-datei-meldung').textContent = 'Die Merkliste ist leer, es gibt nichts zu sichern.'; return; }
    var name = dateiSichern(liste);
    $('m-datei-meldung').textContent = 'Datei „' + name + '“ wird heruntergeladen (' + objekte(liste.length) + '). Sie liegt im Download-Ordner des Browsers.';
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
    var sicherung = liste.length ? dateiSichern(liste, '_vor_import') : null;
    liste = importBereit.slice();
    listeSpeichern(); zeigeMerkliste();
    $('m-import-wahl').hidden = true;
    $('m-datei-meldung').textContent = 'Liste ersetzt (' + objekte(liste.length) + ').' + (sicherung ? ' Die alte Liste wurde vorher als „' + sicherung + '“ heruntergeladen.' : '');
    importBereit = null;
  });
  $('m-import-abbruch').addEventListener('click', function () {
    importBereit = null; $('m-import-wahl').hidden = true; $('m-datei-meldung').textContent = 'Import abgebrochen, nichts geändert.';
  });

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
      $('re-anzahl').textContent = (bund.length + laender.length + regional.length) + ' Einträge angezeigt. Stand der Titel und Links: ' + datumDe(RE.abruf) + '.';
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

  /* ---------- Start ---------- */
  vonAdresse();
  rechne();
  sucheZeigen();
})();
