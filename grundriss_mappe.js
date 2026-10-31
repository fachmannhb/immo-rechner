/* Mappe für den Hausbauer (M1): Knopf, Vorschau im Overlay, Druck des Overlays (@media print). Zahlen aus mappe_kern.js; Bilder entstehen beim Öffnen, nichts wird gespeichert. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, knopf = $('g-mappe-auf');
  if (!knopf) return;
  var tr = function (k, v) { return window.TXT ? window.TXT.t(k, v) : k; };
  var lang = function () { return window.TXT ? window.TXT.lang() : 'de'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var T = function (k, v) { return esc(tr(k, v)); };
  var nf = function (a, b, x) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: a, maximumFractionDigits: b }).format(x); };
  var n0 = function (x) { return nf(0, 0, x); }, n1 = function (x) { return nf(1, 1, x); }, nz = function (x) { return nf(0, 2, x); };
  var datumDe = function (iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); };
  var spanne = function (a, b, e) { return (Math.round(a) === Math.round(b) ? n0(a) : n0(a) + ' ' + tr('wortBis') + ' ' + n0(b)) + ' ' + (e == null ? '€' : e); };
  var fehlerBox = $('g-mappe-fehler'), status = $('g-mappe-status');
  var fehler = function (text) { fehlerBox.textContent = text || ''; fehlerBox.hidden = !text; };
  var M = window.MAPPE_KERN, G = window.GRUNDRISS, RK = window.REGELN;
  if (!M || !G || !RK) { fehler('Die Mappe konnte nicht geladen werden: ' + (!M ? 'mappe_kern.js' : 'Grundriss oder Regeln') + ' fehlt.'); knopf.disabled = true; return; }

  var hat = function (k) { return !!(window.TEXTE && window.TEXTE[k]); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var artName = function (a) { return hat('anArt_' + a) ? tr('anArt_' + a) : (hat('gsArt_' + a) ? tr('gsArt_' + a) : a); };
  var ART_KEY = { voll: 'artVoll', balkon: 'artBalkon', wintergarten: 'artWinter', zubehoer: 'artZubehoer' };
  var STATUS_KEY = { 'geprüft': 'statusGeprueft', 'geprüft (Landesportal)': 'statusPortal', 'prüfen vor Nutzung': 'statusPruefen' };
  /* Namen für Lücken, Annahmen und Fragen aus den Parametern des Kerns (Ids und Zahlen), nur mit vorhandenen Texten */
  var gsName = function (art, n) { return /^Preis\s/i.test(n) ? n.replace(/^Preis\s+(für\s+)?/i, '') : artName(art) + ': ' + n; };
  function lueckeName(p) {
    return p.bauteil ? tr('maBt_' + p.bauteil) + ' (' + p.material + ')' : p.standard ? tr('mpStandard') + ' ' + tr('hdStd_' + p.standard) : p.name ? (p.art ? gsName(p.art, p.name) : p.name) : tr('mpAnbau') + ': ' + artName(p.art);
  }
  function annahmeText(a) {
    var p = a.par, id = a.id.split(':')[0];
    return id === 'material' ? p.items.map(function (x) { return tr('maBt_' + x.bauteil) + ': ' + x.name; }).join('; ') :
      id === 'standard' ? tr('mpStandard') + ': ' + tr('hdStd_' + p.standard) : id === 'lueftung' ? tr('mpLueftung') + ': ' + tr('hlArt_keine') :
      id === 'personen' ? tr('hwPersonenText', { n: p.n }) : id === 'raumhoehe' ? tr('druckHoehe') + ' ' + nz(p.h) + ' m' :
      id === 'anbau' ? tr('mpAnbau') + ': ' + nz(p.fl) + ' m², ' + nz(p.h) + ' m' : id === 'grundstueck' ? tr('mpGrundstueck') + ': ' + nz(p.b) + ' × ' + nz(p.t) + ' m' : tr(id === 'ofen' ? 'gsOfenAnnahme' : 'gsGebietAnnahme');
  }
  var sach = function (l) { return l.key === 'mLuecke' ? tr('mLuecke', { was: lueckeName(l.par) }) : tr(l.key, { art: artName(l.par.art) }); };
  function frageText(f) {
    var p = f.par;
    if (f.typ === 'fest') return tr(f.key);
    if (f.typ === 'luecke') return tr(f.key, { was: sach(p.l) });
    if (f.typ === 'annahme') return tr(f.key, { an: annahmeText({ id: f.id, par: p.ap }) });
    if (f.typ === 'ueberlappung') return tr(f.key, { leistung: tr('mpUe_' + p.leistung) });
    return tr(f.key, { name: p.name || (p.quelle === 'regel' ? tr('mpRegelHaus') : artName(p.art)), farbe: p.quelle === 'regel' ? tr('ampel' + cap(p.ampel)) : tr('anA_' + p.ampel) });
  }
  var chip = function (a, wort) { return '<span class="fm-ampel ' + (a === 'grau' ? 'offen' : a) + '" data-ampel="' + a + '"><i aria-hidden="true">' + { gruen: '✓', gelb: '!', rot: '✕', grau: '?' }[a] + '</i>' + esc(wort) + '</span>'; };
  var schild = function () { return '<span class="annahme">' + T('annahme') + '</span>'; };
  function belege(liste) {
    return (liste || []).map(function (b) {
      var t = esc(b.titel.length > 90 ? b.titel.slice(0, 88) + '…' : b.titel);
      return '<span class="klein">' + (b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + t + '</a>' : t) + (b.abruf ? ' · ' + T('regAbruf', { datum: datumDe(b.abruf) }) : '') + (b.status ? ' · ' + (STATUS_KEY[b.status] ? T(STATUS_KEY[b.status]) : esc(b.status)) : '') + '</span>';
    }).join('');
  }
  var tab = function (kopf, rumpf, attr) { return '<div class="mh-kasten"><table class="mh-tab"' + (attr || '') + '>' + (kopf ? '<thead><tr>' + kopf + '</tr></thead>' : '') + '<tbody>' + rumpf + '</tbody></table></div>'; };
  var sect = function (name, neu, titel, inner) { return '<section class="mp-teil' + (neu ? ' mh-neu' : '') + '" data-abschnitt="' + name + '"><h3>' + T(titel) + '</h3>' + inner + '</section>'; };

  /* ---------- Abschnitte ---------- */
  function deckblatt(m, drei) {
    var k = m.kopf, bild = (drei.bilder || [])[2], d = function (l, v, a) { return '<span>' + T(l) + ': <b data-d="' + a + '">' + v + '</b></span>'; };
    return '<header class="mp-teil" data-abschnitt="deckblatt"><h2 id="mh-h" tabindex="-1">' + T('mpTitel') + '</h2><p class="mh-meta">' + d('druckDatum', esc(datumDe(k.datum)), 'datum') + d('mpLand', esc(k.landName), 'land') +
      d('druckWohn', n1(k.wohn) + ' m²', 'wohn') + d('mpEtagen', k.etagen, 'etagen') + '</p>' + (bild ? '<img class="mh-bild" alt="' + T('mpRi_sued') + '" src="' + bild.url + '">' : '') + '<p class="mh-hinweis">' + T('mpKein') + '</p>' +
      m.fehler.map(function (f) { return '<p class="mp-fehler" data-fehler="' + esc(f.teil) + '">' + T('mpTeilFehler', { teil: f.teil, grund: f.grund }) + '</p>'; }).join('') + '</header>';
  }
  function grundrisse(bilder) {
    if (!bilder.length) return '';
    return sect('grundriss', true, 'mpGrundrisse', bilder.map(function (b, i) {
      return '<div class="mh-etage' + (i ? ' mh-neu' : '') + '" data-etage="' + b.index + '" data-massstab="' + b.massstab + '"><h4>' + T('druckTitel', { etage: b.name }) + '</h4><p class="mh-meta"><span>' + T('druckMassstab') + ' <b>1:' + b.massstab +
        '</b></span><span>' + T('druckHoehe') + ' <b>' + nz(b.hoehe) + ' m</b></span><span>' + T('nordWert', { grad: G.plan().nord || 0 }) + '</span></p>' + b.svg + '</div>';
    }).join(''));
  }
  function dreiD(drei) {
    if (!drei.bilder) return sect('3d', true, 'mp3d', '<p class="mp-fehler" data-fehler="3d">' + T('mp3dFehlt', { grund: hat('mp3dGrund_' + drei.fehler) ? tr('mp3dGrund_' + drei.fehler) : drei.fehler }) + '</p>');
    return sect('3d', true, 'mp3d', '<div class="mh-3d">' + drei.bilder.map(function (b) { return '<figure data-richtung="' + b.richtung + '"><img src="' + b.url + '" alt="' + T('mpRi_' + b.richtung) + '"><figcaption>' + T('mpRi_' + b.richtung) + '</figcaption></figure>'; }).join('') + '</div>');
  }
  function raumliste(m) {
    var r = m.raeume, f = function (x) { return '<td class="z">' + n1(x) + ' m²</td>'; };
    var mehr = r.etagen.filter(function (e) { return e.raeume > 0; }).length > 1;   /* Teilsummen nur, wenn mehr als eine Etage Räume hat */
    var etSumme = function (i) {
      var e = r.etagen[i];
      return mehr && e && e.raeume > 0 ? '<tr class="etage-summe" data-etage-summe="' + i + '" data-grund="' + e.grund + '" data-wohn="' + e.wohn + '"><th colspan="3">' + T('mpEtageSumme', { etage: e.name }) + '</th>' + f(e.grund) + f(e.wohn) + '</tr>' : '';
    };
    var h = r.zeilen.map(function (z, i) {
      var nxt = r.zeilen[i + 1], zu = !nxt || nxt.etageIndex !== z.etageIndex;
      return '<tr data-raum="' + esc(z.id) + '" data-wohn="' + z.wohn + '"><td>' + esc(z.etage) + '</td><td>' + esc(z.name) + '</td><td>' + (z.nutzung && hat('nutz' + cap(z.nutzung)) ? T('nutz' + cap(z.nutzung)) : '–') +
        (z.art !== 'voll' ? ' (' + T(ART_KEY[z.art] || 'artVoll') + ')' : '') + '</td>' + f(z.flaeche) + f(z.wohn) + '</tr>' + (zu ? etSumme(z.etageIndex) : '');
    }).join('') + '<tr class="summe" data-summe="raeume" data-grund="' + r.grund + '" data-wohn="' + r.wohn + '"><th colspan="3">' + T('druckSumme') + '</th>' + f(r.grund) + f(r.wohn) + '</tr>';
    return sect('raumliste', true, 'mpRaumliste', tab('<th>' + T('mpEtage') + '</th><th>' + T('druckRaum') + '</th><th>' + T('mpNutzung') + '</th><th class="z">' + T('druckGrund') + '</th><th class="z">' + T('druckWohn') + '</th>', h));
  }
  function ausbau(m) {
    var a = m.ausbau, g = a.grundstueck, h = '';
    var zeile = function (k, w) { h += '<dt>' + T(k) + '</dt><dd>' + w + '</dd>'; };
    zeile('mpStufe', T('abStufe_' + a.stufe) + (a.altbelag ? ', ' + T('abOptAlt') : '') + (a.putz ? ', ' + T('abOptPutz') : ''));
    zeile('abEntMaterial', '<ul class="mp-annahmen">' + a.material.map(function (x) {
      return '<li data-material="' + x.bauteil + '"><b>' + T('maBt_' + x.bauteil) + ':</b> ' + (x.id ? esc(x.name) : '–') +(x.bauteil === 'daemmung' && x.id ? ' (' + nz(a.daemmdickeCm) + ' cm)' : '') + (!x.explizit && x.id ? ' ' + schild() : '') + '</li>';
    }).join('') + '</ul>');
    zeile('mpStandard', T('hdStd_' + a.standard) + (a.standardExplizit ? '' : ' ' + schild()));
    zeile('mpLueftung', T('hlArt_' + a.lueftung) + (a.lueftungExplizit ? '' : ' ' + schild()));
    zeile('mpWasser', T('hwPersonenText', { n: a.wasser.personen }) + ', ' + T('hwRegen') + ': ' + T(a.wasser.regenwasser ? 'hwRegenJa' : 'hwRegenNein'));
    if (a.anbau) zeile('mpAnbau', T('anKopf', { art: artName(a.anbau.art), fl: nz(a.anbau.flaeche), ampel: tr('anA_' + m.anbauAmpel.ampel) }));
    if (g) zeile('mpGrundstueck', esc(nz(g.breite) + ' × ' + nz(g.tiefe) + ' m: ') + T('gsKopf', { g: n0(g.flaechen.grund), p: n0(Math.round(g.flaechen.prozent)), n: g.items.length, grau: g.zaehlung.grau, rot: g.zaehlung.rot }) + (g.items.length ? '<ul class="mp-annahmen">' +
      g.items.map(function (it) { return '<li data-baustein="' + esc(it.id) + '">' + esc(artName(it.art) + ': ' + nz(it.b) + ' × ' + nz(it.t) + ' m') + '</li>'; }).join('') + '</ul>' : ''));
    return sect('ausbau', false, 'mpAusbau', '<dl class="mh-dl">' + h + '</dl>');
  }
  function kosten(m) {
    var k = m.kosten, h = '', gruppe = '', fertig = false, ohne = m.luecken.filter(function (l) { return /^k:/.test(l.id); }).length;
    var summe = function () { fertig = true; return '<tr class="summe" data-summe="kosten" data-von="' + k.summe.von + '" data-bis="' + k.summe.bis + '"><th>' + T('mpSumme') + '</th><td class="z">' + esc(spanne(k.summe.von, k.summe.bis)) + '</td><td></td></tr>'; };
    k.zeilen.forEach(function (z) {
      if (z.ohneSumme && !fertig) h += summe();
      if (z.gruppe !== gruppe) { gruppe = z.gruppe; h += '<tr class="gruppe"><th colspan="3">' + T(gruppe === 'anbau' ? 'mpAnbau' : 'mpG_' + gruppe) + '</th></tr>'; }
      var name = z.gruppe === 'innenausbau' ? tr('abGew_' + z.id) : z.gruppe === 'material' ? tr('maBt_' + z.id) + (z.material ? ': ' + z.material : '') : z.gruppe === 'daemmung' ? tr('hdStd_' + z.id) : z.gruppe === 'lueftung' ? tr('hlArt_' + z.id) : z.gruppe === 'grundstueck' ? gsName(z.art, z.name) : artName(z.id);
      var leer = z.luecke && !(z.von > 0 || z.bis > 0), no = '<span class="mh-luecke">' + T('mpKeineAngabe') + '</span>';
      var aus = z.inSumme === false, vermerk = aus ? '<span class="mh-enth" data-enthalten-in="' + esc(z.enthaltenIn) + '">' + T('mpEnthalten', { wo: tr('mpZ_' + z.enthaltenIn.replace('/', '_')) }) + (z.sicher ? '' : ' · ' + T('mpEnthaltenUnsicher')) + '</span>' : '';
      h += '<tr data-k="' + z.gruppe + '/' + esc(z.id) + '"' + (aus ? ' class="mh-aus" data-nicht-summe="1"' : '') + (leer ? ' data-luecke="1"' : ' data-von="' + z.von + '" data-bis="' + z.bis + '"') + '><td>' + esc(name) + vermerk + '</td><td class="z">' +
        (leer ? no : (aus ? '<span class="mh-wert">' : '') + esc(spanne(z.von, z.bis, z.einheit)) + (aus ? '</span>' : '') + (z.luecke ? '<span class="klein">+ ' + no + '</span>' : '')) + '</td><td>' + (leer ? '' : belege(z.belege)) + '</td></tr>';
    });
    if (!fertig) h += summe();
    return sect('kosten', true, 'mpKosten', tab('<th>' + T('mpPosition') + '</th><th class="z">' + T('maSpanne') + '</th><th>' + T('regQuelle') + '</th>', h, ' data-kosten="1"') +
      (ohne ? '<p class="klein" data-ohne-preis="' + ohne + '">' + T('mpOhnePreis', { n: ohne }) + '</p>' : '') + heizwaerme(k.heiz) + foerderung(k.foerderung) + '<p class="mh-hinweis" data-ohne-doppelung="1">' + schild() + ' ' + T('mpUeberschneid') + '</p>');
  }
  var r100 = function (x) { return Math.round(x / 100) * 100; };
  function heizwaerme(hz) {
    if (!hz) return '';
    return '<p class="mh-foerd" data-heiz="1" data-kwh-m2="' + hz.kwhM2 + '" data-lo="' + hz.lo + '" data-hi="' + hz.hi + '"><b>' + T('mpHeizKopf') + ':</b> ' + T('mpHeizText', { kwh: n0(hz.kwhM2), lo: n0(hz.lo), hi: n0(hz.hi), t: n0(hz.trans), v: n0(hz.lueft), std: tr('hdStd_' + hz.standard) }) + ' ' + schild() + belege(hz.belege) + '</p>';
  }
  function foerderung(liste) {
    if (!liste || !liste.length) return '';
    return '<div class="mh-foerd" data-foerderung="' + liste.length + '"><h4>' + T('mpFoerdKopf') + '</h4><ul class="mp-annahmen">' + liste.map(function (f) {
      var beg = f.art === 'beg', zahl = beg || f.art === 'kfw261', rund = beg ? r100 : function (x) { return x; };
      var text = zahl ? '<b data-foerd-von="' + f.von + '" data-foerd-bis="' + f.bis + '">' + esc(spanne(rund(f.von), rund(f.bis))) + '</b> ' + (f.art === 'kfw261' ? T('hdFoerdKfw', { stufe: 'EH ' + String(f.stufe).slice(2) }) : T(f.quelle === 'lueftung' ? 'hlFoerdBeg' : 'hdFoerdBeg')) :
        f.art === 'beg_offen' ? T('mpFoerdOffen') : f.art === 'neubauKeine' ? T('hdFoerdNeubau') : T('mpFoerdKredit');
      return '<li data-foerd="' + f.quelle + '" data-art="' + f.art + '"><b>' + T('mpFoerdQ_' + f.quelle) + ':</b> ' + text + belege(f.belege) + '<span class="klein">' + T('mpFoerdPruefen') + '</span></li>';
    }).join('') + '</ul></div>';
  }
  function regeln(m) {
    var r = m.regeln, RG = window.GRUNDRISS_REGELN, s = r.summe, bau = [];
    if (m.anbauAmpel) bau.push({ id: 'anbau', ampel: m.anbauAmpel.ampel, name: artName(m.anbauAmpel.art) + ' (' + nz(m.anbauAmpel.flaeche) + ' m²)' });
    if (m.ausbau.grundstueck) m.ausbau.grundstueck.items.forEach(function (it) { if (!it.garten) bau.push({ id: it.id, ampel: it.ampel, name: artName(it.art) }); });
    return sect('regeln', true, 'mpRegeln', '<p class="klein">' + T('regStichtag', { datum: datumDe(r.datum), land: m.kopf.landName, stand: datumDe(r.stand) }) + '</p><p data-regel-summe="1"><b>' + T('mpRegelSumme', { g: s.gruen, y: s.gelb, r: s.rot }) + '</b></p>' +
      (r.zeilen.length ? '<ul class="mp-annahmen" data-regeln="1">' + r.zeilen.map(function (z) {
        return '<li data-regel="' + esc(z.id) + '" data-ampel="' + z.ampel + '">' + chip(z.ampel, tr('ampel' + cap(z.ampel))) + ' <b>' + esc(z.name ? z.etage + ' · ' + z.name : tr('mpRegelHaus')) + ':</b> ' + esc(z.grund ? (RG && RG.pruefText ? RG.pruefText(z.grund, r.land) : z.grund.code) : '') + '</li>';
      }).join('') + '</ul>' : '') +
      (bau.length ? '<h4>' + T('mpBauantrag') + '</h4><ul class="mp-annahmen" data-bauantrag="1">' + bau.map(function (b) { return '<li data-baustein="' + esc(b.id) + '" data-ampel="' + b.ampel + '">' + chip(b.ampel, tr('anA_' + b.ampel)) + ' ' + esc(b.name) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="mh-hinweis">' + schild() + ' ' + T('mpVerbindlich') + '</p>');
  }
  function fragen(m) {
    var liste = function (items, f) { return items.length ? '<ul class="mp-annahmen">' + items.map(f).join('') + '</ul>' : '<p class="klein">–</p>'; };
    return sect('fragen', true, 'mpFragen', '<ol class="mp-annahmen" data-fragen="' + m.fragen.length + '">' +
      m.fragen.map(function (f) { return '<li data-frage="' + esc(f.typ + ':' + f.id) + '">' + esc(frageText(f)) + '</li>'; }).join('') + '</ol>') +
      sect('annahmen', false, 'mpAnnahmen', liste(m.annahmen, function (a) { return '<li data-annahme="' + esc(a.id) + '">' + schild() + ' ' + esc(annahmeText(a)) + '</li>'; }) +
        '<h4>' + T('mpKeineAngabe') + '</h4>' + liste(m.luecken, function (l) { return '<li data-luecke="' + esc(l.id) + '">' + esc(sach(l)) + '</li>'; }));
  }

  /* ---------- Öffnen und Drucken (Overlay, Escape, „Zurück“ und Fokus über app.js) ---------- */
  var ov = $('g-mappe-ov'), inhalt = $('g-mappe-inhalt'), letzte = null;
  function optionen() {
    var o = { datum: RK.heute() }, a = window.GRUNDRISS_AUSBAU && window.GRUNDRISS_AUSBAU.zustand ? window.GRUNDRISS_AUSBAU.zustand() : null;
    if (a) { o.stufe = a.stufe; o.altbelag = !!a.altbelag; o.putz = !!a.putz; }
    return o;
  }
  function zeigen() {
    var m = letzte.m;
    $('g-mappe-blatt').setAttribute('lang', lang());
    inhalt.innerHTML = deckblatt(m, letzte.drei) + grundrisse(letzte.bilder) + dreiD(letzte.drei) + raumliste(m) + ausbau(m) + kosten(m) + regeln(m) + fragen(m);
  }
  var msg = function (e) { return e && e.message ? e.message : '?'; };
  function oeffnen() {
    fehler(''); status.textContent = tr('mpBauen');
    setTimeout(function () {
      var m, bilder = [], drei;
      status.textContent = '';
      try { m = M.sammle(G.plan(), optionen()); } catch (e) { fehler(tr('mpTeilFehler', { teil: 'Mappe', grund: msg(e) })); return; }
      if (!m.ok) { fehler(tr('mpFehlt_raeume')); return; }
      if (!window.OVERLAY_OEFFNEN) { fehler(tr('mpTeilFehler', { teil: 'Ansicht', grund: 'app.js' })); return; }
      try { bilder = G.etagenBilder(); } catch (e) { m.fehler.push({ teil: 'grundriss', grund: msg(e) }); }
      try { drei = G.dreiBilder(['nord', 'ost', 'sued', 'west', 'oben'], 800, 600); } catch (e2) { drei = { fehler: msg(e2) }; }
      letzte = { m: m, bilder: bilder, drei: drei };
      zeigen();
      window.OVERLAY_OEFFNEN('g-mappe-ov', '#g-mappe-auf', 'mh-h');
    }, 30);
  }
  /* Erstnutzer-Hinweis: kurzes Pulsieren des Knopfes und ein Satz, bis die Mappe einmal geöffnet wurde (Merker im Browser; geht der Speicher nicht, kommt der Hinweis wieder) */
  var hinweis = $('g-mappe-hinweis'), MERKER = 'mappe_hinweis_gesehen';
  try { if (hinweis && localStorage.getItem(MERKER) !== '1') { hinweis.hidden = false; knopf.classList.add('mh-puls'); knopf.setAttribute('aria-describedby', 'g-mappe-hinweis'); } } catch (eh) { if (hinweis) { hinweis.hidden = false; knopf.classList.add('mh-puls'); } }
  knopf.addEventListener('click', function () {
    if (hinweis && !hinweis.hidden) { hinweis.hidden = true; knopf.classList.remove('mh-puls'); try { localStorage.setItem(MERKER, '1'); } catch (es) { /* kein Speicher: Hinweis kommt beim nächsten Laden wieder */ } }
    oeffnen();
  });
  $('g-mappe-plandatei').addEventListener('click', function () {
    var ok = false;
    try { ok = G.dateiSichern(); } catch (e) { ok = false; }
    status.textContent = tr(ok ? 'mpPlandateiOk' : 'mpPlandateiFehler');
  });
  $('g-mappe-drucken').addEventListener('click', function () {
    var f = $('g-mappe-ov-fehler');
    try { f.hidden = true; window.print(); } catch (e) { f.textContent = tr('mpTeilFehler', { teil: 'print', grund: msg(e) }); f.hidden = false; }
  });
  window.addEventListener('sprachegewechselt', function () { if (!ov.hidden && letzte) zeigen(); });
  window.GRUNDRISS_MAPPE = { oeffnen: oeffnen, letzte: function () { return letzte; } };
})();
