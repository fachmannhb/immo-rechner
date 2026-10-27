/* Oberfläche der Bauregel-Prüfung im Bereich „Grundriss und Einrichtung“ (Welle C):
   Bundesland wählen (Karte und Knöpfe), Haus-Angaben und Gebäudeklasse, Raumnutzung im Seitenfeld, Karte „Regeln prüfen“ (Ampel je Raum),
   Freiflächen vor Möbeln und „Darf ich das ohne Genehmigung?“. Die Rechnung steht in regeln_kern.js, die Texte in daten/texte.js.
   Keine Baugenehmigung, keine Statik: Die Seite sagt das dauerhaft an der Karte (R078, R016). Alle Zahlen tragen Quelle, Abrufdatum und Status. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var RK = window.REGELN, G = window.GRUNDRISS;
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fehlerZeigen(text) { var f = $('g-land-fehler'); if (f) { f.textContent = text; f.hidden = !text; } }
  if (!RK || !G) {
    fehlerZeigen(!RK ? tr('regFehlerKern') : tr('regFehlerPlan'));
    return;
  }
  var AGS = { '01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW', '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH' };
  var NUTZ_KEY = { wohnen: 'nutzWohnen', schlafen: 'nutzSchlafen', kind: 'nutzKind', arbeiten: 'nutzArbeiten', kueche: 'nutzKueche', essen: 'nutzEssen', bad: 'nutzBad', wc: 'nutzWc', flur: 'nutzFlur', abstell: 'nutzAbstell', technik: 'nutzTechnik', treppe: 'nutzTreppe', sonstiges: 'nutzSonstiges' };
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'geprüft (Landesportal)': ['statusPortal', 'st-portal'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'] };
  var FREI_KEY = 'immo-frei';
  var freiAn = false;
  try { freiAn = localStorage.getItem(FREI_KEY) === '1'; } catch (e) { freiAn = false; }
  var offen = {};        /* geöffnete Raumzeilen und Erklärungen (bleiben beim Neuzeichnen offen) */
  var letzte = null;     /* letztes Prüfergebnis (für Prüfskripte) */
  var signatur = { regeln: '', frei: '', land: '' };

  function plan() { return G.plan(); }
  function datumDe(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  function statusInfo(s) { return STATUS_KEY[s] || ['statusPruefen', 'st-pruef']; }
  function symbol(id) { return '<svg class="sym" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }

  /* ---------- Bundesland ---------- */
  function karteSvg() {
    var K = window.DATEN && window.DATEN.karte;
    if (!K || !K.laender) return '';
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    K.laender.forEach(function (l) {
      var n = String(l.pfad).match(/-?\d+(?:\.\d+)?/g) || [];
      for (var i = 0; i + 1 < n.length; i += 2) { var x = +n[i], y = +n[i + 1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    });
    if (!isFinite(x0)) return '';
    var pfade = K.laender.map(function (l) {
      var k = AGS[l.ags]; if (!k) return '';
      return '<path class="g-land-flaeche" data-land="' + k + '" tabindex="0" role="button" aria-pressed="false" aria-label="' + esc(l.name) + '" d="' + esc(l.pfad) + '"><title>' + esc(l.name) + '</title></path>';
    }).join('');
    return '<svg class="g-land-svg" viewBox="' + (x0 - 4) + ' ' + (y0 - 4) + ' ' + (x1 - x0 + 8) + ' ' + (y1 - y0 + 8) + '" role="group" aria-label="' + esc(tr('landKarteAria')) + '">' + pfade + '</svg>';
  }
  function gkBild(n) {
    var a = '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">';
    if (n === 1) a += '<path d="M12 41V23l12-10 12 10v18z"/><path d="M21 41v-8h6v8"/>';
    else if (n === 2) a += '<path d="M4 41V25l9-8 9 8v16zM22 41V25l9-8 9 8v16z"/><path d="M10 41v-6h6v6M28 41v-6h6v6"/>';
    else {
      var h = { 3: 22, 4: 32, 5: 38 }[n], top = 43 - h, i;
      a += '<path d="M14 43V' + top + 'h20v' + h + 'z"/>';
      for (i = 1; i < Math.round(h / 8); i++) a += '<path d="M14 ' + (top + i * 8) + 'h20"/>';
      a += '<path d="M20 43v-5h8v5"/>';
      if (n === 5) a += '<path d="M24 ' + top + 'V4"/>';
    }
    return a + '</svg>';
  }
  var LAND_GEBAUT = false, LAND_HOOKS = false;
  var GK_WORT = ['gkWortEins', 'gkWortZwei', 'gkWortDrei', 'gkWortVier', 'gkWortFuenf'], GK_LANG = ['gkLangEins', 'gkLangZwei', 'gkLangDrei', 'gkLangVier', 'gkLangFuenf'];
  function landBauen() {
    var box = $('g-land-inhalt'); if (!box) return;
    var hausOffen = !!($('g-haus-details') && $('g-haus-details').open);
    var chips = RK.LAENDER.map(function (l) {
      return '<button type="button" class="chip g-land-chip" data-land="' + l.k + '" aria-pressed="false">' + esc(l.name) + '</button>';
    }).join('');
    var gk = [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" class="g-gk-knopf" data-gk="' + n + '" aria-pressed="false">' + gkBild(n) + '<span class="g-gk-zahl">' + esc(tr('gkKlasse', { n: n })) + '</span><span class="g-gk-wort klein"></span><span class="g-gk-vorschlag" hidden>' + esc(tr('gkVorschlagKurz')) + '</span></button>';
    }).join('');
    box.innerHTML =
      '<div class="g-land-raster"><div class="g-land-karte-wrap">' + karteSvg() + '</div>' +
      '<div><p class="g-land-gewaehlt" id="g-land-gewaehlt"></p><div class="g-land-chips" role="group" aria-label="' + esc(tr('landChipsAria')) + '">' + chips + '</div>' +
      '<p class="klein" id="g-land-lbo"></p></div></div>' +
      '<details class="g-haus-details" id="g-haus-details"' + (hausOffen ? ' open' : '') + '><summary class="g-haus-titel"><span>' + esc(tr('hausTitel')) + '</span><span class="klein" id="g-haus-kurz"></span></summary>' +
      '<div class="g-haus-raster">' +
      '<div><p class="g-haus-frage" id="g-haus-frei-f">' + esc(tr('hausFrei')) + '</p><div class="g-gruppe" role="group" aria-labelledby="g-haus-frei-f">' +
      '<button type="button" class="chip mit-symbol" data-frei="1" aria-pressed="true">' + symbol('i-haus') + esc(tr('hausFreiJa')) + '</button>' +
      '<button type="button" class="chip mit-symbol" data-frei="0" aria-pressed="false">' + symbol('c-mauer') + esc(tr('hausFreiNein')) + '</button></div></div>' +
      '<div><p class="g-haus-frage" id="g-haus-wo-f">' + esc(tr('hausWohnungen')) + '</p><div class="g-schritter" role="group" aria-labelledby="g-haus-wo-f">' +
      '<button type="button" class="chip klein" data-wohn="-1" aria-label="' + esc(tr('hausWeniger')) + '">−</button><output class="g-schritter-zahl" id="g-wohn-zahl" aria-live="polite">1</output>' +
      '<button type="button" class="chip klein" data-wohn="1" aria-label="' + esc(tr('hausMehr')) + '">+</button></div></div></div>' +
      '<div class="g-gk"><div class="g-kopfzeile"><p class="g-haus-frage" id="g-gk-f">' + esc(tr('gkTitel')) + '</p>' +
      '<button type="button" class="hilfe-knopf" id="g-gk-hilfe" aria-expanded="false" aria-controls="g-gk-hilfe-text" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>' +
      '<div id="g-gk-hilfe-text" hidden><p class="klein">' + esc(tr('gkHilfe')) + '</p><div class="rg-beleg-box" id="g-gk-beleg"></div></div>' +
      '<div class="g-gk-reihe" role="group" aria-labelledby="g-gk-f">' + gk + '</div>' +
      '<p class="klein" id="g-gk-satz"></p><div class="knopfreihe" style="margin-top:6px"><button type="button" class="chip mit-symbol" id="g-gk-nehmen" hidden>' + symbol('c-pflicht') + esc(tr('gkNehmen')) + '</button></div></div></details>';
    LAND_GEBAUT = true;
    if (LAND_HOOKS) return;     /* die Zuhörer hängen am festen Behälter und werden nur einmal angelegt */
    LAND_HOOKS = true;
    box.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-land],[data-frei],[data-wohn],[data-gk],#g-gk-nehmen,#g-gk-hilfe') : null; if (!t) return;
      if (t.hasAttribute('data-land')) landSetzen(t.getAttribute('data-land'));
      else if (t.hasAttribute('data-frei')) { plan().freistehend = t.getAttribute('data-frei') === '1'; aenderung(); }
      else if (t.hasAttribute('data-wohn')) { var p = plan(); p.wohnungen = Math.max(1, Math.min(50, (p.wohnungen || 1) + Number(t.getAttribute('data-wohn')))); aenderung(); }
      else if (t.hasAttribute('data-gk')) { plan().gebaeudeklasse = Number(t.getAttribute('data-gk')); aenderung(); }
      else if (t.id === 'g-gk-nehmen') { plan().gebaeudeklasse = 0; aenderung(); }
      else if (t.id === 'g-gk-hilfe') { var x = $('g-gk-hilfe-text'), auf = x.hidden; x.hidden = !auf; t.setAttribute('aria-expanded', auf ? 'true' : 'false'); }
    });
    box.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if ((ev.key === 'Enter' || ev.key === ' ') && t.classList && t.classList.contains('g-land-flaeche')) { ev.preventDefault(); landSetzen(t.getAttribute('data-land')); }
    });
  }
  function landSetzen(k) {
    if (!RK.landOk(k)) return;
    var p = plan();
    p.land = k;
    var ok = G.landMerken(k);
    $('g-land-meldung').textContent = ok ? '' : tr('landNichtGemerkt');
    aenderung();      /* speichert, setzt Sonne und Dachertrag auf die Hauptstadt und prüft neu */
  }
  /* Änderung am Plan melden und die Land-/Haus-Karte sofort neu zeigen (die Prüfkarte folgt entprellt) */
  function aenderung() { G.geaendert(); landZeigen(); }
  function landZeigen() {
    if (!LAND_GEBAUT) landBauen();
    var p = plan(), li = RK.landInfo(p.land), gk = RK.gebaeudeklasse(p), d = RK.daten();
    var sig = [p.land, p.freistehend, p.wohnungen, p.gebaeudeklasse, gk.vorschlag, gk.hoehe, gk.bgf].join('|');
    document.querySelectorAll('#g-land-inhalt [data-land]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-land') === p.land ? 'true' : 'false'); });
    $('g-land-gewaehlt').innerHTML = esc(tr('landGewaehlt', { land: li.name, stadt: li.stadt })).replace(esc(li.name), '<strong>' + esc(li.name) + '</strong>');
    var lbo = d && d.laender[p.land] ? d.laender[p.land].lbo : null;
    $('g-land-lbo').textContent = lbo ? tr('landLbo', { lbo: lbo.titel, fassung: lbo.fassung }) : '';
    document.querySelectorAll('#g-land-inhalt [data-frei]').forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-frei') === '1') === (p.freistehend !== false) ? 'true' : 'false'); });
    $('g-wohn-zahl').textContent = String(p.wohnungen || 1);
    document.querySelectorAll('#g-land-inhalt [data-gk]').forEach(function (b) {
      var n = Number(b.getAttribute('data-gk'));
      b.setAttribute('aria-pressed', n === gk.wirksam ? 'true' : 'false');
      b.querySelector('.g-gk-vorschlag').hidden = n !== gk.vorschlag;
      b.querySelector('.g-gk-wort').textContent = tr(GK_WORT[n - 1]);
      b.setAttribute('aria-label', tr('gkKlasse', { n: n }) + ': ' + tr(GK_LANG[n - 1]) + (n === gk.vorschlag ? ', ' + tr('gkVorschlagKurz') : ''));
      b.title = tr(GK_LANG[n - 1]);
    });
    $('g-land-aktuell').textContent = li.name;
    /* Beleg der Klassengrenzen (7 m, 2 Nutzungseinheiten, 400 m²) aus dem Gesetz des gewählten Landes; Klassen 3 bis 5 (13 m) sind eine Annahme */
    var ge = RK.regel(p.land, 'gebaeudeklasse2', RK.heute()), gb = $('g-gk-beleg');
    if (gb) gb.innerHTML = ge && ge.status !== 'Lücke' ? belegHtml(RK.beleg(p.land, 'gebaeudeklasse2', ge)) :
      '<div class="rg-beleg"><p>' + badge('Lücke') + '</p><p class="klein">' + esc(tr('rgLuecke', { land: li.name })) + '</p></div>';
    $('g-haus-kurz').textContent = tr('hausKurz', { gk: gk.wirksam, wohn: gk.wohnungen, frei: tr(p.freistehend !== false ? 'hausKurzFrei' : 'hausKurzAn') });
    $('g-gk-satz').textContent = !gk.bgf ? tr('gkSatzLeer') : tr(gk.gewaehlt ? 'gkSatzGewaehlt' : 'gkSatzAuto', { gk: gk.wirksam, v: gk.vorschlag, hoehe: String(gk.hoehe).replace('.', ','), bgf: gk.bgf, wohn: gk.wohnungen }) + (p.land === 'SL' || p.land === 'RP' ? ' ' + tr('gkLandHinweis') : '') + (gk.wirksam >= 3 || gk.vorschlag >= 3 ? ' ' + tr('gkAnnahme', { land: li.name }) : '');
    $('g-gk-nehmen').hidden = !(gk.gewaehlt && gk.gewaehlt !== gk.vorschlag);
    signatur.land = sig;
  }

  /* ---------- Raumnutzung im Seitenfeld ---------- */
  function raumPanel(box, r, geaendert, nurText) {
    var eff = RK.nutzungVon(r), auto = !r.nutzung && !!eff;
    var offenNutz = !!(box.querySelector('details') && box.querySelector('details').open);
    var h = '<div class="g-nutz"><p class="g-haus-frage" id="g-nutz-f">' + esc(tr('nutzTitel')) + '</p>' +
      '<details class="g-nutz-details"' + (offenNutz && nurText ? ' open' : '') + '><summary id="g-nutz-sum">' + symbol('n-' + (eff || 'sonstiges')) + '<b>' + esc(eff ? tr(NUTZ_KEY[eff]) : tr('nutzWaehlen')) + '</b>' +
      (auto ? ' <span class="klein">' + esc(tr('nutzAuto')) + '</span>' : '') + '</summary>' +
      '<div class="g-nutz-raster" role="group" aria-labelledby="g-nutz-f">' + RK.NUTZUNGEN.map(function (k) {
        return '<button type="button" class="chip mit-symbol" data-nutz="' + k + '" aria-pressed="' + (k === eff ? 'true' : 'false') + '">' + symbol('n-' + k) + esc(tr(NUTZ_KEY[k])) + '</button>';
      }).join('') + '</div></details>' +
      '<p class="klein" style="margin:6px 0 0">' + esc(tr('nutzHilfe')) + '</p></div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-nutz]').forEach(function (b) {
      b.addEventListener('click', function () {
        r.nutzung = b.getAttribute('data-nutz');
        raumPanel(box, r, geaendert);
        var s = $('g-nutz-sum'); if (s) s.focus({ preventScroll: true });
        geaendert();
      });
    });
  }

  /* ---------- Prüfkarte ---------- */
  var CODE_KEY = {
    nutzung: 'rgNutzung', hoeheOk: 'rgHoeheOk', hoeheDachOk: 'rgHoeheDachOk', hoeheDach: 'rgHoeheDach', hoeheAusnahme: 'rgHoeheAusnahme', hoeheErmessen: 'rgHoeheErmessen',
    hoeheErsatz: 'rgHoeheErsatz', hoeheZuNiedrig: 'rgHoeheZuNiedrig', fensterOk: 'rgFensterOk', fensterZuKlein: 'rgFensterZuKlein', fensterFehlt: 'rgFensterFehlt',
    rettungOk: 'rgRettungOk', rettungPruefen: 'rgRettungPruefen', bruestungOk: 'rgBruestungOk', bruestungNiedrig: 'rgBruestungNiedrig', bruestungKeinWert: 'rgBruestungKeinWert', rauch: 'rgRauch',
    tuerSchmal: 'rgTuerSchmal', tuerSchmalPflicht: 'rgTuerSchmalPflicht', bewegungEng: 'rgBewegungEng', bewegungEngPflicht: 'rgBewegungEngPflicht',
    faustKlein: 'rgFaustKlein', faustFlur: 'rgFaustFlur', freiEng: 'rgFreiEng', kuecheOk: 'rgKuecheOk', kuecheFehlt: 'rgKuecheFehlt', kuecheTechnisch: 'rgKuecheTechnisch',
    kuecheKeine: 'rgKuecheKeine', badOk: 'rgBadOk', badFehlt: 'rgBadFehlt', wcOk: 'rgWcOk', wcFehlt: 'rgWcFehlt', abstellOk: 'rgAbstellOk', abstellFehlt: 'rgAbstellFehlt',
    abstellFehltMass: 'rgAbstellFehltMass', abstellKlein: 'rgAbstellKlein'
  };
  var CODE_ICON = { nutzung: 'n-sonstiges', hoehe: 'c-hoehe', fenster: 'i-fenster', rettung: 'c-rettung', bruestung: 'c-bruestung', rauch: 'c-melder', tuer: 'i-tuer', bewegung: 'c-bewegung', faust: 'c-faust', frei: 'c-frei', kueche: 'n-kueche', bad: 'n-bad', wc: 'n-bad', abstell: 'n-abstell' };
  function iconFuer(code) {
    var k = Object.keys(CODE_ICON).filter(function (x) { return code.indexOf(x) === 0; })[0];
    return CODE_ICON[k] || 'c-pflicht';
  }
  var ZEICHEN = { gruen: '✓', gelb: '!', rot: '✕', info: 'i' };
  var AMPEL_WORT = { gruen: 'ampelGruen', gelb: 'ampelGelb', rot: 'ampelRot', neutral: 'ampelNeutral' };
  function itemText(it, land) {
    if (/Luecke$/.test(it.code)) return tr('rgLuecke', { land: RK.landInfo(land).name });
    var key = CODE_KEY[it.code === 'abstellFehlt' && it.par.mind ? 'abstellFehltMass' : it.code];
    var par = Object.assign({}, it.par);
    if (it.code === 'freiEng') {
      var KA = katalog(), nm = function (id) { return KA[id] ? (KA[id].kurz || KA[id].name) : ''; };
      par.moebel = nm(it.par.art);
      par.mit = it.par.mit === 'wand' ? tr('freiMitWand') : tr('freiMitMoebel', { name: nm(it.par.mit) });
    }
    if (it.code === 'rettungOk' || it.code === 'rettungPruefen') par.ukSatz = it.par.uk ? tr('rgUkSatz', { uk: it.par.uk }) : '';
    return key ? tr(key, par) : it.code;
  }
  function badge(status) {
    var s = statusInfo(status);
    return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>';
  }
  function belegHtml(b) {
    var h = '<div class="rg-beleg' + (b.eigen ? ' eigen' : '') + '"><p class="rg-beleg-kopf"><b>' + esc(b.titel) + '</b>' + (b.lbo ? ' · ' + esc(b.lbo) : '') + (b.paragraf ? ' · ' + esc(b.paragraf) : '') + '</p>' +
      '<p class="rg-beleg-meta">' + badge(b.status) + ' <span class="rg-abruf" data-abruf="' + esc(b.abruf) + '">' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) + '</span>' +
      (b.gilt_ab ? ' <span class="rg-gilt">' + esc(tr('regGiltAb', { datum: datumDe(b.gilt_ab) })) + '</span>' : '') +
      (b.gilt_bis ? ' <span class="rg-gilt">' + esc(tr('regGiltBis', { datum: datumDe(b.gilt_bis) })) + '</span>' : '') +
      (b.rueckfall ? ' <span class="rg-gilt">' + esc(tr('regRueckfall')) + '</span>' : '') + '</p>';
    if (b.eigen) h += '<p class="klein rg-eigen">' + esc(tr('regEigen')) + '</p>';
    if (b.wortlaut) h += '<blockquote class="rg-wortlaut" lang="de">' + esc(b.wortlaut) + '</blockquote>' + (b.gekuerzt ? '<p class="klein">' + esc(tr('regGekuerzt')) + '</p>' : '');
    else if (b.text) h += '<p class="klein rg-text">' + esc(b.text) + '</p>';
    if (b.quellen && b.quellen.length) {
      h += '<p class="klein rg-quellen">' + b.quellen.map(function (q) {
        return q.url ? '<a class="rg-quelle" href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(tr('regQuelle')) + ': ' + esc(q.titel) + '</a>' : '<span class="rg-ohne-link">' + esc(tr('regQuelle')) + ': ' + esc(q.titel) + ' (' + esc(tr('regKeinLink')) + ')</span>';
      }).join('<br>') + '</p>';
    } else h += '<p class="klein rg-quellen"><span class="rg-ohne-link">' + esc(tr('regKeineQuelle')) + '</span></p>';
    return h + '</div>';
  }
  function schlechtesterStatus(belege) {
    var rang = { 'Lücke': 3, 'prüfen vor Nutzung': 2, 'geprüft (Landesportal)': 1, 'geprüft': 0 }, best = null;
    (belege || []).forEach(function (b) { if (best == null || (rang[b.status] || 0) > (rang[best] || 0)) best = b.status; });
    return best;
  }
  function itemHtml(it, land, schluessel) {
    var id = 'rgb-' + schluessel, auf = !!offen[id], hat = it.belege && it.belege.length;
    var st = hat ? schlechtesterStatus(it.belege) : null;
    return '<li class="rg-item rg-' + it.stufe + '" data-code="' + esc(it.code) + '" data-stufe="' + it.stufe + '"' + (hat ? ' data-mit-beleg="1"' : '') + '>' +
      '<span class="rg-pkt" aria-hidden="true">' + symbol(iconFuer(it.code)) + '</span>' +
      '<div class="rg-item-text"><span class="rg-zeichen ' + it.stufe + '" aria-hidden="true">' + ZEICHEN[it.stufe] + '</span> <span class="rg-satz">' + esc(itemText(it, land)) + '</span>' +
      (it.eigen ? ' <span class="annahme">' + esc(tr('regEigenKurz')) + '</span>' : '') + (st ? ' ' + badge(st) : '') +
      (hat ? '<div class="rg-beleg-box" id="' + id + '"' + (auf ? '' : ' hidden') + '>' + it.belege.map(belegHtml).join('') + '</div>' : '') + '</div>' +
      (hat ? '<button type="button" class="hilfe-knopf rg-hilfe" data-beleg="' + id + '" aria-expanded="' + (auf ? 'true' : 'false') + '" aria-controls="' + id + '" aria-label="' + esc(tr('regBelegKnopf')) + '">?</button>' : '<span></span>') + '</li>';
  }
  function grundEiner(z, land) {
    var rang = { rot: 2, gelb: 1, gruen: 0, info: -1 };
    var w = z.pruefungen.filter(function (p) { return p.stufe !== 'info'; }).sort(function (a, b) { return rang[b.stufe] - rang[a.stufe]; })[0];
    if (!w) return z.pruefungen.length ? tr('regAllesGut') : tr('regNichtsZuPruefen');
    return itemText(w, land);
  }
  function zeileHtml(z, key, land, nutzIcon, name) {
    var auf = !!offen[key], dId = 'rgd-' + key;
    var grund = grundEiner(z, land);
    var items = z.pruefungen.map(function (it, i) { return itemHtml(it, land, key + '-' + i); }).join('');
    return '<li class="rg-raum rg-' + z.ampel + '" data-raum="' + esc(z.raum || 'haus') + '" data-ampel="' + z.ampel + '">' +
      '<button type="button" class="rg-kopf" data-zeile="' + key + '" aria-expanded="' + (auf ? 'true' : 'false') + '" aria-controls="' + dId + '">' +
      '<span class="rg-lampe ' + z.ampel + '" aria-hidden="true">' + ZEICHEN[z.ampel] + '</span><span class="rg-nutzbild" aria-hidden="true">' + symbol(nutzIcon) + '</span>' +
      '<span class="rg-text"><b>' + esc(name) + '</b><span class="rg-grund">' + esc(grund) + '</span></span><span class="rg-ampelwort ' + z.ampel + '">' + esc(tr(AMPEL_WORT[z.ampel])) + '</span></button>' +
      '<div class="rg-detail" id="' + dId + '"' + (auf ? '' : ' hidden') + '><ul class="rg-items">' + (items || '<li class="rg-item"><span></span><div class="rg-item-text"><span class="klein">' + esc(tr('regNichtsZuPruefen')) + '</span></div><span></span></li>') + '</ul></div></li>';
  }
  function pruefungHtml(res, p) {
    var s = res.summe, gesamt = s.gruen + s.gelb + s.rot, land = res.land, d = RK.daten();
    var h = '<div class="rg-summe" role="group" aria-label="' + esc(tr('regSummeAria')) + '">';
    if (gesamt) {
      h += '<div class="rg-balken" aria-hidden="true">' + ['gruen', 'gelb', 'rot'].map(function (k) { return s[k] ? '<span class="rg-b ' + k + '" style="flex:' + s[k] + '"></span>' : ''; }).join('') + '</div>';
      h += '<ul class="rg-zahlen">' + ['gruen', 'gelb', 'rot'].map(function (k) {
        return '<li class="' + k + '"><span class="rg-lampe ' + k + '" aria-hidden="true">' + ZEICHEN[k] + '</span><b class="rg-zahl" data-ampel="' + k + '">' + s[k] + '</b> <span>' + esc(tr(AMPEL_WORT[k])) + '</span></li>';
      }).join('') + '</ul>';
    }
    h += '</div><p class="klein rg-stichtag">' + esc(tr('regStichtag', { datum: datumDe(res.datum), land: RK.landInfo(land).name, stand: d ? datumDe(d.stand) : '' })) + ' ' + esc(tr('regRohbau')) +
      ' <button type="button" class="chip mit-symbol" data-landauf="1">' + symbol('i-karte') + esc(tr('regLandAendern')) + '</button></p>';
    var gruppen = [], i;
    for (i = 0; i < p.etagen.length; i++) gruppen.push(res.raeume.filter(function (z) { return z.etageIndex === i && z.art === 'voll'; }));
    h += '<ul class="rg-liste">';
    if (res.haus) h += zeileHtml(res.haus, 'haus', land, 'c-pflicht', tr('regHaus'));
    p.etagen.forEach(function (e, ei) {
      if (!gruppen[ei].length) return;
      h += '<li class="rg-etage" aria-hidden="false"><h4>' + esc(e.name) + '</h4></li>';
      gruppen[ei].forEach(function (z) { h += zeileHtml(z, z.raum, land, 'n-' + (z.nutzung || 'sonstiges'), z.name); });
    });
    return h + '</ul>';
  }
  function pruefungZeigen() {
    var box = $('g-regeln-inhalt'); if (!box) return;
    var p = plan(), res = RK.pruefe(p, { datum: RK.heute() });
    letzte = res;
    var mini = $('g-zur-regeln-zahl'), kn = $('g-zur-regeln');
    if (mini) {
      var gz = res.summe.gruen + res.summe.gelb + res.summe.rot;
      mini.innerHTML = gz ? ['gruen', 'gelb', 'rot'].map(function (k) { return '<span class="' + k + '">' + ZEICHEN[k] + res.summe[k] + '</span>'; }).join('') : '';
      if (kn) kn.setAttribute('aria-label', tr('regKnopf') + (gz ? ': ' + tr('regKnopfZahl', { g: res.summe.gruen, y: res.summe.gelb, r: res.summe.rot }) : ''));
    }
    if (!res.daten || res.fehler) { box.innerHTML = '<p class="fehler" role="alert">' + esc(tr('regFehlerDaten')) + '</p>'; return; }
    if (!p.etagen.some(function (e) { return e.raeume.some(function (r) { return r.art === 'voll'; }); })) {
      box.innerHTML = '<div class="rg-leer">' + symbol('i-grundriss') + '<p>' + esc(tr('regLeer')) + '</p></div>';
      signatur.regeln = 'leer'; return;
    }
    var html = pruefungHtml(res, p);
    var sig = html + '|' + Object.keys(offen).filter(function (k) { return offen[k]; }).join(',');
    if (sig === signatur.regeln) return;
    var fokus = document.activeElement && box.contains(document.activeElement) ? (document.activeElement.getAttribute('data-zeile') || document.activeElement.getAttribute('data-beleg')) : null;
    box.innerHTML = html;
    signatur.regeln = sig;
    if (fokus) { var f = box.querySelector('[data-zeile="' + fokus + '"],[data-beleg="' + fokus + '"]'); if (f) f.focus({ preventScroll: true }); }
  }
  if ($('g-regeln-inhalt')) $('g-regeln-inhalt').addEventListener('click', function (ev) {
    var z = ev.target.closest('[data-zeile]'), b = ev.target.closest('[data-beleg]'), la = ev.target.closest('[data-landauf]');
    if (la) { var dt = $('g-land-details'); if (dt) { dt.open = true; $('g-land-karte').scrollIntoView({ block: 'start' }); var sm = dt.querySelector('summary'); if (sm) sm.focus({ preventScroll: true }); } return; }
    if (z) { var k = z.getAttribute('data-zeile'); offen[k] = !offen[k]; z.setAttribute('aria-expanded', offen[k] ? 'true' : 'false'); $('rgd-' + k).hidden = !offen[k]; }
    else if (b) { var id = b.getAttribute('data-beleg'); offen[id] = !offen[id]; b.setAttribute('aria-expanded', offen[id] ? 'true' : 'false'); $(id).hidden = !offen[id]; }
  });

  /* ---------- Darf ich das ohne Genehmigung? ---------- */
  var GEN_KEY = { verfahrensfrei_innen: ['genInnen', 'i-wand'], verfahrensfrei_tragend: ['genTragend', 'c-mauer'], dachausbau: ['genDach', 'i-dach'], solar_verfahrensfrei: ['genSolar', 'i-sonne'] };
  function genehmigungHtml() {
    var p = plan(), liste = RK.genehmigung(p.land, RK.heute()), d = RK.daten(), lbo = d && d.laender[p.land] ? d.laender[p.land].lbo : null;
    var h = '<p class="klein">' + esc(tr('genLand', { land: RK.landInfo(p.land).name, lbo: lbo ? lbo.titel : '' })) + '</p><ul class="fg-liste">';
    liste.forEach(function (x) {
      var k = GEN_KEY[x.thema], b = x.beleg, id = 'fgb-' + x.thema, auf = !!offen[id];
      h += '<li class="fg-zeile" data-thema="' + x.thema + '"><span class="fg-icon" aria-hidden="true">' + symbol(k[1]) + '</span>' +
        '<div class="fg-text"><b>' + esc(tr(k[0])) + '</b> ' + badge(b.status) +
        '<p class="fg-antwort"><span class="klein">' + esc(tr('genAntwort')) + '</span> ' + esc(b.text || tr('regKeineQuelle')) + '</p>' +
        '<div class="rg-beleg-box" id="' + id + '"' + (auf ? '' : ' hidden') + '>' + belegHtml(b) + '</div></div>' +
        '<button type="button" class="hilfe-knopf rg-hilfe" data-beleg="' + id + '" aria-expanded="' + (auf ? 'true' : 'false') + '" aria-controls="' + id + '" aria-label="' + esc(tr('regBelegKnopf')) + '">?</button></li>';
    });
    return h + '</ul><p class="klein">' + esc(tr('genEntscheidet')) + '</p>';
  }
  function genehmigungZeigen() {
    var box = $('g-frei-inhalt'); if (!box) return;
    var html = genehmigungHtml() + '|' + Object.keys(offen).filter(function (k) { return offen[k]; }).join(',');
    if (html === signatur.frei) return;
    signatur.frei = html;
    var fokus = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-beleg') : null;
    box.innerHTML = genehmigungHtml();
    if (fokus) { var f = box.querySelector('[data-beleg="' + fokus + '"]'); if (f) f.focus({ preventScroll: true }); }
  }
  if ($('g-zur-regeln')) $('g-zur-regeln').addEventListener('click', function () { $('g-regeln-karte').scrollIntoView({ block: 'start', behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  if ($('g-frei-inhalt')) $('g-frei-inhalt').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-beleg]'); if (!b) return;
    var id = b.getAttribute('data-beleg'); offen[id] = !offen[id]; b.setAttribute('aria-expanded', offen[id] ? 'true' : 'false'); $(id).hidden = !offen[id];
    signatur.frei = '';
  });

  /* ---------- Freiflächen zeichnen ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function katalog() { var m = {}; ((window.DATEN && window.DATEN.moebel && window.DATEN.moebel.artikel) || []).forEach(function (a) { m[a.id] = a; }); return m; }
  function zeichneFrei(e, svg) {
    if (!freiAn) return;
    var zonen = RK.freiflaechen(e, katalog());
    if (!zonen.length) return;
    function el(n, a, par) { var x = document.createElementNS(NS, n); Object.keys(a || {}).forEach(function (k) { x.setAttribute(k, a[k]); }); par.appendChild(x); return x; }
    var g = el('g', { class: 'frei-zonen', 'aria-hidden': 'true' }, svg), defs = el('defs', {}, g);
    [['ok', 'frei-schr-ok'], ['eng', 'frei-schr-eng']].forEach(function (p) {
      var pat = el('pattern', { id: 'g-' + p[1], patternUnits: 'userSpaceOnUse', width: 0.14, height: 0.14, patternTransform: 'rotate(45)' }, defs);
      el('line', { x1: 0, y1: 0, x2: 0, y2: 0.14, class: p[1], 'stroke-width': 0.035 }, pat);
    });
    zonen.forEach(function (z) {
      el('polygon', { points: z.zone.map(function (q) { return q[0] + ',' + q[1]; }).join(' '), class: 'frei-zone ' + (z.konflikt ? 'eng' : 'ok'), fill: 'url(#g-frei-schr-' + (z.konflikt ? 'eng' : 'ok') + ')' }, g);
    });
  }
  if ($('g-frei-knopf')) {
    $('g-frei-knopf').setAttribute('aria-pressed', freiAn ? 'true' : 'false');
    if ($('g-frei-legende')) $('g-frei-legende').hidden = !freiAn;
    $('g-frei-knopf').addEventListener('click', function () {
      freiAn = !freiAn;
      $('g-frei-knopf').setAttribute('aria-pressed', freiAn ? 'true' : 'false');
      if ($('g-frei-legende')) $('g-frei-legende').hidden = !freiAn;
      try { localStorage.setItem(FREI_KEY, freiAn ? '1' : '0'); } catch (e) { /* ohne Speicher gilt die Wahl nur bis zum Schließen */ }
      G.zeichnen();
    });
  }

  /* ---------- Zusammenspiel ---------- */
  var timer = null;
  function jetzt() { clearTimeout(timer); landZeigen(); pruefungZeigen(); genehmigungZeigen(); }
  function aktualisieren() { clearTimeout(timer); timer = setTimeout(jetzt, 120); }
  [['g-land-hilfe', 'g-land-hilfe-text'], ['g-regeln-hilfe', 'g-regeln-hilfe-text'], ['g-frei-hilfe', 'g-frei-hilfe-text']].forEach(function (p) {
    if ($(p[0])) $(p[0]).addEventListener('click', function () { var x = $(p[1]), auf = x.hidden; x.hidden = !auf; this.setAttribute('aria-expanded', auf ? 'true' : 'false'); });
  });
  window.addEventListener('sprachegewechselt', function () { LAND_GEBAUT = false; signatur = { regeln: '', frei: '', land: '' }; jetzt(); });
  window.addEventListener('themagewechselt', function () { signatur.regeln = ''; });

  window.GRUNDRISS_REGELN = {
    raumPanel: raumPanel, zeichneFrei: zeichneFrei, aktualisieren: aktualisieren, jetzt: jetzt, landSetzen: landSetzen,
    ergebnis: function () { return letzte; }, freiAn: function () { return freiAn; },
    zuklappen: function () { offen = {}; signatur.regeln = ''; signatur.frei = ''; jetzt(); },
    /* für Prüfskripte: Stichtag setzen (z. B. '2027-01-01'; leer = heute) und neu zeigen */
    setzeDatum: function (d) { RK.setzeDatum(d); signatur = { regeln: '', frei: '', land: '' }; jetzt(); }
  };
  jetzt();
})();
