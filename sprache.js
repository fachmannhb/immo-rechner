/* Sprachwahl DE/EN/RU für die neuen Planungsfunktionen. Texte stehen in daten/texte.js ({schlüssel:{de,en,ru}}).
   t(schlüssel, {platzhalter}) liefert den Text der gewählten Sprache, fehlt er dort, den deutschen, fehlt der Schlüssel, den Schlüssel.
   Feste Elemente in vorlage.html tragen data-t (Text), data-t-aria (aria-label), data-t-title (title).
   Die Wahl steht in localStorage ('immo-sprache', in try/catch). Die übrige Seite bleibt Deutsch; in den anderen
   Sprachen zeigt ein Band das in der gewählten Sprache an. Meldet Wechsel mit dem Ereignis "sprachegewechselt". */
(function () {
  'use strict';
  var KEY = 'immo-sprache', ERLAUBT = ['de', 'en', 'ru'], lang = 'de', bereich = 'uebersicht', speicherFehler = false;
  try { var s = localStorage.getItem(KEY); if (ERLAUBT.indexOf(s) >= 0) lang = s; } catch (e) { /* ohne Speicher: Deutsch */ }

  function t(key, v) {
    var e = window.TEXTE && window.TEXTE[key];
    var text = e ? (e[lang] || e.de || key) : key;
    if (v) Object.keys(v).forEach(function (k) { text = text.split('{' + k + '}').join(String(v[k])); });
    return text;
  }
  function anwenden(wurzel) {
    var w = wurzel || document;
    w.querySelectorAll('[data-t]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-t')); el.setAttribute('lang', lang);
    });
    w.querySelectorAll('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-t-aria'))); });
    w.querySelectorAll('[data-t-title]').forEach(function (el) { el.setAttribute('title', t(el.getAttribute('data-t-title'))); });
  }
  function hinweis() {
    var b = document.getElementById('sprach-hinweis');
    if (!b) return;
    var text = '';
    if (lang !== 'de') text = t(bereich === 'grundriss' ? 'sprachGrundrissRest' : (bereich === 'strom' ? 'sprachStromRest' : (bereich === 'material' ? 'sprachMaterialRest' : 'sprachNurDeutsch')));
    if (speicherFehler) text += (text ? ' ' : '') + t('spracheNichtGemerkt');
    b.textContent = text; b.setAttribute('lang', lang); b.hidden = !text;
  }
  function setze(l, ohneSpeichern) {
    if (ERLAUBT.indexOf(l) < 0) return false;
    lang = l;
    document.documentElement.setAttribute('data-sprache', l);
    var sel = document.getElementById('sprache-wahl'); if (sel && sel.value !== l) sel.value = l;
    if (!ohneSpeichern) {
      try { localStorage.setItem(KEY, l); speicherFehler = false; } catch (e) { speicherFehler = true; }
    }
    anwenden(); hinweis();
    window.dispatchEvent(new Event('sprachegewechselt'));
    return true;
  }
  function start() {
    var sel = document.getElementById('sprache-wahl');
    if (sel) sel.addEventListener('change', function () { setze(sel.value); });
    setze(lang, true);
  }
  window.TXT = {
    t: t, lang: function () { return lang; }, setze: setze, anwenden: anwenden,
    /* von app.js beim Wechsel des Bereichs gerufen, damit das Band den richtigen Satz zeigt */
    bereich: function (id) { bereich = id; hinweis(); },
    erlaubt: ERLAUBT.slice()
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
