/* Rechenfunktionen der Werkzeugseite, ohne Bezug zur Oberfläche.
   Die Seite und tmp/rechner_test.js (Node) benutzen dieselben Funktionen.
   Prozentwerte werden als Prozentzahl übergeben (5.5 für 5,5 %). */
(function (global) {
  'use strict';

  function zahl(x) {
    var n = Number(x);
    return isFinite(n) ? n : 0;
  }

  /* Kaufnebenkosten: Grunderwerbsteuer, Notar und Grundbuch, Makler. */
  function kaufnebenkosten(kaufpreis, grestProzent, notarProzent, maklerProzent) {
    var p = zahl(kaufpreis);
    var grest = p * zahl(grestProzent) / 100;
    var notar = p * zahl(notarProzent) / 100;
    var makler = p * zahl(maklerProzent) / 100;
    return { grest: grest, notar: notar, makler: makler, summe: grest + notar + makler };
  }

  /* Finanzierungsbedarf: alles, was nicht aus Eigenkapital kommt, wird Darlehen.
     Quote = Darlehen geteilt durch Kaufpreis (so meinen Banken „110 %“). */
  function finanzierung(kaufpreis, nebenkosten, zusatzkosten, eigenkapital) {
    var gesamt = zahl(kaufpreis) + zahl(nebenkosten) + zahl(zusatzkosten);
    var darlehen = Math.max(0, gesamt - zahl(eigenkapital));
    var quote = zahl(kaufpreis) > 0 ? darlehen / zahl(kaufpreis) * 100 : 0;
    return { gesamt: gesamt, darlehen: darlehen, quote: quote };
  }

  /* Annuitätendarlehen mit Sollzins und anfänglicher Tilgung (übliche Angabe deutscher Banken).
     Monatsrate = Darlehen × (Zins + Tilgung) / 12, monatliche Verrechnung.
     Liefert Rate, Restschuld nach der Zinsbindung, Gesamtlaufzeit und einen Jahresplan. */
  function kredit(darlehen, zinsProzent, tilgungProzent, bindungJahre) {
    var k = zahl(darlehen);
    var i = zahl(zinsProzent) / 100 / 12;
    var rate = k * (zahl(zinsProzent) + zahl(tilgungProzent)) / 100 / 12;
    var bindung = Math.round(zahl(bindungJahre) * 12);
    var rest = k;
    var plan = [];
    var jahr = { jahr: 1, zinsen: 0, tilgung: 0, rest: k };
    var monat = 0;
    var restBindung = bindung === 0 ? k : null;
    var maxMonate = 100 * 12;
    if (k <= 0 || rate <= 0) {
      return { rate: 0, restschuld: 0, laufzeitMonate: 0, plan: [], zinsenBindung: 0 };
    }
    var zinsenBindung = 0;
    var nieGetilgt = false;
    while (rest > 0.005 && monat < maxMonate) {
      var z = rest * i;
      var t = Math.min(rate - z, rest);
      if (t <= 1e-9) {
        /* tilgungsfrei oder Rate deckt die Zinsen nicht: Schuld bleibt stehen */
        nieGetilgt = true;
        zinsenBindung += z * Math.max(0, bindung - monat);
        if (restBindung === null) restBindung = rest;
        break;
      }
      rest -= t;
      monat += 1;
      jahr.zinsen += z;
      jahr.tilgung += t;
      if (monat <= bindung) zinsenBindung += z;
      if (monat === bindung) restBindung = rest;
      if (monat % 12 === 0 || rest <= 0.005) {
        jahr.rest = Math.max(0, rest);
        plan.push(jahr);
        jahr = { jahr: plan.length + 1, zinsen: 0, tilgung: 0, rest: rest };
      }
    }
    if (restBindung === null) restBindung = 0; /* vor Ende der Bindung getilgt */
    return {
      rate: rate,
      restschuld: Math.max(0, restBindung),
      laufzeitMonate: (nieGetilgt || monat >= maxMonate) ? Infinity : monat,
      plan: plan,
      zinsenBindung: zinsenBindung
    };
  }

  /* Anschlussfinanzierung (Block 5): neue Rate, wenn die Zinsbindung endet.
     modus 'tilgung': gleiche anfängliche Tilgung wie bisher, bezogen auf die Restschuld:
       Rate = Restschuld × (Anschlusszins + Tilgung) ÷ 100 ÷ 12 (dieselbe Formel wie kredit()).
     modus 'rest': Schuld soll zum selben Zeitpunkt weg sein wie vorher geplant (restMonate):
       Rate = Restschuld × i ÷ (1 − (1 + i)^−n), i = Anschlusszins ÷ 100 ÷ 12, n = restMonate; bei Zins 0 % Restschuld ÷ n.
     Liefert { rate, laufzeitMonate, abbezahlt } oder { fehler: 'text' }, wenn sich nichts rechnen lässt.
     Der Überschuss danach ist Sache des Aufrufers: Reinertrag pro Monat − neue Rate. */
  function anschluss(o) {
    var rest = zahl(o.restschuld), z = zahl(o.zinsProzent), i = z / 100 / 12;
    if (!(rest > 0.005)) return { abbezahlt: true, rate: 0, laufzeitMonate: 0 };
    if (o.modus === 'rest') {
      var n = Math.round(zahl(o.restMonate));
      if (!(n > 0)) return { fehler: 'Die Restlaufzeit lässt sich nicht berechnen, weil der Kredit bei diesem Tilgungssatz nie ganz getilgt wird. Wählen Sie „Gleiche Tilgung wie bisher“.' };
      var rate = i === 0 ? rest / n : rest * i / (1 - Math.pow(1 + i, -n));
      return { abbezahlt: false, rate: rate, laufzeitMonate: n };
    }
    var k = kredit(rest, z, zahl(o.tilgungProzent), 0);
    if (!(z + zahl(o.tilgungProzent) > 0)) return { fehler: 'Bei Zins und Tilgung von 0 % gibt es keine Rate.' };
    return { abbezahlt: false, rate: rest * (z + zahl(o.tilgungProzent)) / 100 / 12, laufzeitMonate: k.laufzeitMonate };
  }

  /* Heizungs- und Energie-Check (Block 5). Reine Regeln nach recherche/15_vermieter_regeln.md Abschnitt A
     (Gebäudemodernisierungsgesetz GModG, früher GEG, Abruf 09.10.2026). Texte stehen in daten/pflichten.js.
     o: baujahr (Zahl oder leer), art ('gas' | 'oel' | 'waermepumpe' | 'fernwaerme' | 'sonstige' | ''),
        einbau (Einbau- oder geplantes Einbaujahr der Heizung, Zahl oder leer),
        decke ('ja' | 'nein' | 'weiss'), rohre ('ja' | 'nein' | 'weiss').
     Liefert eine Liste { id, status }. status: 'gilt' (die Regel trifft zu), 'moeglich' (kann zutreffen, Ausnahmen prüfen),
     'pruefen' (hängt von Angaben ab, die fehlen oder die der Bericht als unsicher führt), 'frei' (nach dieser Angabe nichts zu tun),
     'info' (immer wichtig). Bei 'heizung' mit status 'gilt' steht in stufen die Bio-Treppe. */
  var BIO_STUFEN = [
    { ab: '01.01.2029', prozent: 10 }, { ab: '01.01.2030', prozent: 15 },
    { ab: '01.01.2035', prozent: 30 }, { ab: '01.01.2040', prozent: 60 }
  ];
  function heizungsCheck(o) {
    var art = o.art || '', fossil = art === 'gas' || art === 'oel';
    var ein = o.einbau === '' || o.einbau === null || o.einbau === undefined ? null : Number(o.einbau);
    if (ein !== null && !isFinite(ein)) ein = null;
    var bj = o.baujahr === '' || o.baujahr === null || o.baujahr === undefined ? null : Number(o.baujahr);
    if (bj !== null && !isFinite(bj)) bj = null;
    var liste = [];
    var h = { id: 'heizung', status: 'info' };
    if (!art) h.status = 'pruefen', h.grund = 'art';
    else if (!fossil) h.status = 'frei', h.grund = 'andere-art';
    else if (ein === null) h.status = 'pruefen', h.grund = 'einbau-fehlt';
    else if (ein >= 2027) { h.status = 'gilt'; h.stufen = BIO_STUFEN; }
    else if (ein === 2026) h.status = 'pruefen', h.grund = 'einbau-2026';
    else h.status = 'frei', h.grund = 'vor-2026';
    liste.push(h);
    liste.push({ id: 'decke', status: o.decke === 'ja' ? 'frei' : o.decke === 'nein' ? 'moeglich' : 'pruefen' });
    liste.push({ id: 'rohre', status: o.rohre === 'ja' ? 'frei' : o.rohre === 'nein' ? 'moeglich' : 'pruefen' });
    /* Bauantrag vor 01.11.1977 lässt sich aus dem Baujahr nur vermuten (Baujahr bis 1977 als Anhalt) */
    liste.push({ id: 'ausweis', status: 'info', bedarfsausweisMoeglich: bj !== null && bj <= 1977 });
    liste.push({ id: 'waermeplan', status: 'info' });
    return liste;
  }

  /* Normale Vermietung: Renditen und monatlicher Cashflow vor Steuern. */
  function vermietung(o) {
    var kalt = zahl(o.kaltmieteMonat);
    var jahresmiete = kalt * 12;
    var ausfall = kalt * zahl(o.mietausfallProzent) / 100;
    var kosten = zahl(o.nichtUmlagefaehigMonat) + zahl(o.ruecklageMonat);
    var reinertragMonat = kalt - ausfall - kosten;
    var kp = zahl(o.kaufpreis);
    var gesamt = zahl(o.gesamtkosten);
    return {
      jahresmiete: jahresmiete,
      bruttorendite: kp > 0 ? jahresmiete / kp * 100 : 0,
      kaufpreisfaktor: jahresmiete > 0 ? kp / jahresmiete : 0,
      nettorendite: gesamt > 0 ? reinertragMonat * 12 / gesamt * 100 : 0,
      reinertragMonat: reinertragMonat,
      cashflowMonat: reinertragMonat - zahl(o.kreditrateMonat)
    };
  }

  /* AfA-Satz für Wohngebäude nach § 7 Abs. 4 Satz 1 Nr. 2 EStG (Wortlaut geprüft 08.10.2026):
     fertiggestellt nach dem 31.12.2022: 3 %, 1925 bis 2022: 2 %, vor 1925: 2,5 %.
     Sonderregeln (degressive AfA § 7 Abs. 5a, § 7b, Denkmal) sind nicht berücksichtigt. */
  function afaSatz(baujahr) {
    var b = zahl(baujahr);
    if (!b) return 2;
    if (b >= 2023) return 3;
    if (b < 1925) return 2.5;
    return 2;
  }

  /* Langfristige Entwicklung Jahr für Jahr, vor und nach Steuern (eigene Näherung).
     o: kaufpreis, nebenkosten, ek, darlehen, zinsProzent, plan (Jahre aus kredit()), kaltmieteMonat,
        ausfallProzent, kostenMonat (nicht umlagefähig), ruecklageMonat, mietsteigerung, kostensteigerung,
        wertsteigerung (je % pro Jahr), jahre, gebaeudeanteil (%), afaSatz (%), steuersatz (%).
     Steuer: Einkünfte = Miete − Ausfall − nicht umlagefähige Kosten − Zinsen − AfA; die Rücklage ist erst
     absetzbar, wenn das Geld für Reparaturen ausgegeben wird, darum hier nicht. Steuer = Einkünfte × Satz
     (negativ = Ersparnis durch Verrechnung mit anderem Einkommen). AfA-Basis = (Kaufpreis + Nebenkosten) ×
     Gebäudeanteil; Renovierung und Möbel bleiben außen vor. */
  function langfrist(o) {
    var n = Math.max(1, Math.min(50, Math.round(zahl(o.jahre) || 30)));
    var ms = zahl(o.mietsteigerung) / 100, ks = zahl(o.kostensteigerung) / 100, ws = zahl(o.wertsteigerung) / 100;
    var afaBasis = (zahl(o.kaufpreis) + zahl(o.nebenkosten)) * zahl(o.gebaeudeanteil) / 100;
    var afaJahr = afaBasis * zahl(o.afaSatz) / 100, afaRest = afaBasis;
    var plan = o.plan || [], darlehen = zahl(o.darlehen);
    var ohneTilgung = !plan.length && darlehen > 0; /* Rate deckt nur Zinsen: Schuld bleibt stehen */
    var jahre = [], kumNach = 0, schuldenfrei = null;
    for (var j = 1; j <= n; j++) {
      var miete = zahl(o.kaltmieteMonat) * 12 * Math.pow(1 + ms, j - 1);
      var ausfall = miete * zahl(o.ausfallProzent) / 100;
      var kosten = zahl(o.kostenMonat) * 12 * Math.pow(1 + ks, j - 1);
      var ruecklage = zahl(o.ruecklageMonat) * 12 * Math.pow(1 + ks, j - 1);
      var p = plan[j - 1];
      var zinsen = p ? p.zinsen : (ohneTilgung ? darlehen * zahl(o.zinsProzent) / 100 : 0);
      var tilgung = p ? p.tilgung : 0;
      var rest = p ? p.rest : (ohneTilgung ? darlehen : 0);
      if (schuldenfrei === null && darlehen > 0 && rest <= 0.5) schuldenfrei = j;
      var afa = Math.min(afaJahr, afaRest); afaRest -= afa;
      var vorSteuer = miete - ausfall - kosten - ruecklage - zinsen - tilgung;
      var einkuenfte = miete - ausfall - kosten - zinsen - afa;
      var steuer = einkuenfte * zahl(o.steuersatz) / 100;
      var nachSteuer = vorSteuer - steuer;
      kumNach += nachSteuer;
      var wert = zahl(o.kaufpreis) * Math.pow(1 + ws, j);
      jahre.push({ jahr: j, miete: miete - ausfall, kosten: kosten, ruecklage: ruecklage, zinsen: zinsen, tilgung: tilgung,
        afa: afa, einkuenfte: einkuenfte, steuer: steuer, vorSteuer: vorSteuer, nachSteuer: nachSteuer,
        kumNachSteuer: kumNach, rest: rest, wert: wert, vermoegen: wert - rest });
    }
    var j1 = jahre[0];
    var ek = zahl(o.ek);
    return {
      jahre: jahre,
      afaBasis: afaBasis,
      afaJahr: afaJahr,
      schuldenfreiJahr: darlehen > 0 ? schuldenfrei : 0,
      /* Eigenkapitalrendite Jahr 1: was nach Zinsen und Kosten bleibt, inkl. Tilgung (die ist Vermögen) */
      ekRendite: ek > 0 ? (j1.vorSteuer + j1.tilgung) / ek * 100 : null,
      ekRenditeNachSteuer: ek > 0 ? (j1.nachSteuer + j1.tilgung) / ek * 100 : null,
      /* Schuldendienstdeckung: Reinertrag ÷ (Zinsen + Tilgung); über 1 deckt die Miete die Rate */
      dscr: (j1.zinsen + j1.tilgung) > 0 ? (j1.miete - j1.kosten - j1.ruecklage) / (j1.zinsen + j1.tilgung) : null
    };
  }

  /* ---------- Steuern sparen (Block 4, 09.10.2026; Quellen: recherche/14_steuern_sparen.md, Abruf 09.10.2026) ----------
     Alles eigene Näherungen zum Verstehen, keine Steuerberatung. */

  /* § 6 Abs. 1 Nr. 1a EStG: Instandsetzung/Modernisierung innerhalb von drei Jahren nach der Anschaffung, netto über 15 % der
     Anschaffungskosten des Gebäudes = anschaffungsnahe Herstellungskosten (nur über die AfA absetzbar). Genau 15 % ist noch unschädlich.
     o: gebaeudeAK, j1, j2, j3 (netto), steuersatz (%), afaSatz (%).
     Erstes Jahr: Betrag des Jahres 1 sofort absetzbar (Steuerersparnis = Betrag × Steuersatz) oder nur als AfA (Betrag × AfA-Satz × Steuersatz). */
  function anschaffungsnaheKosten(o) {
    var ak = zahl(o.gebaeudeAK), j1 = zahl(o.j1), j2 = zahl(o.j2), j3 = zahl(o.j3);
    var summe = j1 + j2 + j3, satz = zahl(o.steuersatz) / 100, afa = zahl(o.afaSatz) / 100;
    var grenze = ak * 15 / 100;
    var ueber = summe * 100 - ak * 15 > 1e-6; /* Ganzzahlvergleich statt 0,15 × ak: wegen Gleitkomma */
    var sofort1 = j1 * satz, afa1 = j1 * afa * satz;
    return {
      grenze: grenze, summe: summe, ueber: ueber, abstand: grenze - summe,
      erstesJahrSofort: sofort1, erstesJahrAfa: afa1, erstesJahrUnterschied: sofort1 - afa1,
      /* Wirkung der ganzen Summe: sofort abziehbar oder nur als AfA (Jahresbetrag) */
      gesamtSofort: summe * satz, afaJahr: summe * afa, afaJahrSteuer: summe * afa * satz
    };
  }

  /* §§ 7h, 7i EStG: im Jahr der Herstellung und den folgenden sieben Jahren (zusammen 8 Jahre) bis zu 9 %, in den folgenden
     vier Jahren bis zu 7 % der begünstigten Kosten (8 × 9 + 4 × 7 = 100 %). Vergleich: normale AfA (normalSatz) auf dieselben Kosten.
     o: kosten, steuersatz (%), normalSatz (%). */
  function erhoehteAfa(o) {
    var k = zahl(o.kosten), s = zahl(o.steuersatz) / 100, ns = zahl(o.normalSatz) || 2;
    var jahre = [], kum = 0, kumN = 0, restN = k;
    for (var j = 1; j <= 12; j++) {
      var satz = j <= 8 ? 9 : 7;
      var afa = k * satz / 100;
      var normal = Math.min(k * ns / 100, restN); restN -= normal;
      kum += afa * s; kumN += normal * s;
      jahre.push({ jahr: j, satz: satz, afa: afa, normal: normal, steuer: afa * s, steuerNormal: normal * s, kum: kum, kumNormal: kumN });
    }
    var summe = jahre.reduce(function (a, x) { return a + x.afa; }, 0);
    var summeN = jahre.reduce(function (a, x) { return a + x.normal; }, 0);
    return { jahre: jahre, summeAfa: summe, summeNormal: summeN, ersparnis: kum, ersparnisNormal: kumN, differenz: kum - kumN, restNachZwoelf: k - summeN };
  }

  /* Gebäudewert nach dem Sachwertverfahren ohne Boden: Gebäude plus Außenanlagen (der Boden steckt in sachwert() schon drin).
     o wie bei sachwert(); bodenwert, Sachwertfaktor und besondere Merkmale bleiben außen vor. */
  function gebaeudewertSachwert(o) {
    var x = {}, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) x[k] = o[k];
    x.bodenwert = 0; x.sachwertfaktor = 1; x.besondere = 0;
    var s = sachwert(x);
    return s.gebaeude + s.aussenanlagen;
  }

  /* Kaufpreisaufteilung nach dem Prinzip der BMF-Arbeitshilfe (Verhältnis der Werte von Boden und Gebäude), vereinfachend:
     Bodenwert und Gebäudewert aus eigenen Schätzungen, Nebenkosten im gleichen Verhältnis. Nicht die Arbeitshilfe selbst.
     o: kaufpreis, nebenkosten, bodenwert, gebaeudewert, afaSatz (%), steuersatz (%). */
  function kaufpreisAufteilung(o) {
    var bw = zahl(o.bodenwert), gw = zahl(o.gebaeudewert), summe = bw + gw;
    var anteil = summe > 0 ? gw / summe : 0;
    var gesamt = zahl(o.kaufpreis) + zahl(o.nebenkosten);
    var gebaeudeAK = gesamt * anteil;
    var afaJahr = gebaeudeAK * zahl(o.afaSatz) / 100;
    return {
      gebaeudeanteil: anteil * 100, bodenanteil: (summe > 0 ? 100 - anteil * 100 : 0),
      gesamt: gesamt, gebaeudeAK: gebaeudeAK, bodenAK: gesamt - gebaeudeAK,
      afaJahr: afaJahr, steuerJahr: afaJahr * zahl(o.steuersatz) / 100
    };
  }

  /* Verkauf nach N Jahren (§ 23 EStG). Zeile N = Verkauf kurz nach dem N. Jahrestag des Kaufvertrags; maßgeblich sind die Daten der
     notariellen Verträge, taggenau. Innerhalb der Frist ("nicht mehr als zehn Jahre") steuerpflichtig, also N < 10; ab N = 10 steuerfrei.
     Gewinn = Verkaufspreis − Verkaufskosten − (Anschaffungskosten inkl. Nebenkosten − Summe der AfA) (§ 23 Abs. 3 Satz 1 und 4).
     Gewinne unter 1.000 € im Jahr bleiben steuerfrei (Freigrenze, § 23 Abs. 3 Satz 5): 999 € frei, 1.000 € voll steuerpflichtig.
     Ein Verlust löst keine Steuer aus (nur mit Gewinnen aus privaten Veräußerungsgeschäften verrechenbar, Satz 7).
     o: jahre (Ergebnis von langfrist().jahre mit afa, rest, nachSteuer), kaufpreis, nebenkosten, ek (eingesetztes Eigenkapital),
        wertsteigerung (% pro Jahr), verkaufskostenProzent, steuersatz (%), soli (true: + 5,5 % der Steuer), frist (Standard 10). */
  function verkauf(o) {
    var jahre = o.jahre || [], frist = o.frist === undefined ? 10 : zahl(o.frist);
    var anschaffung = zahl(o.kaufpreis) + zahl(o.nebenkosten), ws = zahl(o.wertsteigerung) / 100;
    var faktorSteuer = zahl(o.steuersatz) / 100 * (o.soli ? 1.055 : 1);
    var sumAfa = 0, kumCf = 0, zeilen = [];
    for (var i = 0; i < jahre.length; i++) {
      var j = jahre[i], n = i + 1;
      sumAfa += zahl(j.afa); kumCf += zahl(j.nachSteuer);
      var preis = zahl(o.kaufpreis) * Math.pow(1 + ws, n);
      var vk = preis * zahl(o.verkaufskostenProzent) / 100;
      var ak = anschaffung - sumAfa;
      var gewinn = preis - vk - ak;
      var inFrist = n < frist;
      var freigrenze = gewinn < 1000;
      var steuer = (inFrist && !freigrenze) ? gewinn * faktorSteuer : 0;
      var rest = zahl(j.rest);
      var netto = preis - vk - rest - steuer;
      zeilen.push({ jahr: n, preis: preis, verkaufskosten: vk, afaSumme: sumAfa, anschaffungsrest: ak, gewinn: gewinn, inFrist: inFrist,
        freigrenze: freigrenze, steuer: steuer, rest: rest, netto: netto, kumCashflow: kumCf, gesamt: netto + kumCf - zahl(o.ek) });
    }
    /* "im Plus ab Jahr X": erstes Jahr, ab dem das Gesamtergebnis in allen folgenden Jahren über 0 liegt */
    var plusAb = null;
    for (var k = zeilen.length - 1; k >= 0; k--) {
      if (zeilen[k].gesamt > 0) plusAb = zeilen[k].jahr; else break;
    }
    return { zeilen: zeilen, plusAb: plusAb, frist: frist };
  }

  /* Monteurzimmer: Umsatz = Betten × Preis × Belegung × Tage.
     „operativ“ ohne Kreditrate (wie Folie 7), „nachKredit“ mit Kreditrate. */
  function monteur(o) {
    var betten = zahl(o.betten);
    var tage = o.tage === undefined ? 30 : zahl(o.tage);
    var belegt = betten * zahl(o.belegungProzent) / 100 * tage; /* belegte Bett-Nächte */
    var umsatz = belegt * zahl(o.preis);
    var abgabe = umsatz * zahl(o.abgabeProzent) / 100;
    var variabel = belegt * zahl(o.variabel);
    var operativ = umsatz - abgabe - variabel - zahl(o.fixkosten);
    var deckung = betten * tage * (zahl(o.preis) * (1 - zahl(o.abgabeProzent) / 100) - zahl(o.variabel));
    return {
      bettNaechte: belegt,
      umsatz: umsatz,
      abgabe: abgabe,
      variabel: variabel,
      operativ: operativ,
      nachKredit: operativ - zahl(o.kreditrateMonat),
      breakEven: deckung > 0 ? zahl(o.fixkosten) / deckung * 100 : Infinity,
      breakEvenMitKredit: deckung > 0 ? (zahl(o.fixkosten) + zahl(o.kreditrateMonat)) / deckung * 100 : Infinity
    };
  }

  /* Anmieten statt kaufen: Miete wird zu Fixkosten, Einrichtung amortisiert sich aus dem Ergebnis. */
  function anmieten(o) {
    var m = monteur({
      betten: o.betten, preis: o.preis, belegungProzent: o.belegungProzent,
      fixkosten: zahl(o.mieteMonat) + zahl(o.sonstigeFixkosten),
      variabel: o.variabel, abgabeProzent: o.abgabeProzent, tage: o.tage
    });
    var start = zahl(o.kaution) + zahl(o.einrichtung);
    return {
      umsatz: m.umsatz,
      ergebnisMonat: m.operativ,
      breakEven: m.breakEven,
      startkapital: start,
      amortisationMonate: m.operativ > 0 ? zahl(o.einrichtung) / m.operativ : Infinity
    };
  }

  /* ---------- Wertermittlung nach ImmoWertV 2021 (Formeln geprüft 07.10.2026 auf gesetze-im-internet.de) ---------- */

  /* § 34: Kapitalisierungsfaktor KF = (q^n − 1) / (q^n × (q − 1)), Abzinsungsfaktor AF = 1 / q^n, q = 1 + LZ */
  function barwertfaktoren(lzProzent, jahre) {
    var n = Math.max(0, zahl(jahre)), lz = zahl(lzProzent) / 100, q = 1 + lz;
    if (n === 0) return { kf: 0, af: 1 };
    if (lz === 0) return { kf: n, af: 1 };
    var qn = Math.pow(q, n);
    return { kf: (qn - 1) / (qn * (q - 1)), af: 1 / qn };
  }

  /* § 4 Abs. 3: Restnutzungsdauer in der Regel = Gesamtnutzungsdauer − Alter; eigene Angabe (Modernisierung) geht vor */
  function restnutzungsdauer(baujahr, stichjahr, gnd, eigene) {
    if (eigene !== null && eigene !== undefined && eigene !== '' && zahl(eigene) > 0) return zahl(eigene);
    return Math.max(0, zahl(gnd) - (zahl(stichjahr) - zahl(baujahr)));
  }

  /* §§ 28, 29, 31, 32: Ertragswert allgemein und vereinfacht */
  function ertragswert(o) {
    var roh = zahl(o.mieteMonat) * 12;
    var verwaltung = zahl(o.verwaltungJeWE) * zahl(o.wohnungen);
    var instand = zahl(o.instandJeM2) * zahl(o.wohnflaeche);
    var ausfall = roh * zahl(o.ausfallProzent) / 100;
    var betrieb = zahl(o.betriebskostenJahr);
    var bwk = verwaltung + instand + ausfall + betrieb;
    var rein = roh - bwk;
    var bw = zahl(o.bodenwert);
    var f = barwertfaktoren(o.lzProzent, o.rnd);
    var bwv = bw * zahl(o.lzProzent) / 100;
    var reinGebaeude = rein - bwv;
    return {
      rohertrag: roh, verwaltung: verwaltung, instandhaltung: instand, mietausfall: ausfall, betriebskosten: betrieb,
      bewirtschaftung: bwk, reinertrag: rein, bodenwert: bw, bodenwertverzinsung: bwv, reinertragGebaeude: reinGebaeude,
      kf: f.kf, af: f.af,
      gebaeudeAllgemein: reinGebaeude * f.kf,
      allgemein: reinGebaeude * f.kf + bw,
      vereinfacht: rein * f.kf + bw * f.af
    };
  }

  /* §§ 35, 36, 38, 39: Sachwert */
  function sachwert(o) {
    var nhk = zahl(o.nhk) * (o.korrWohnung === undefined ? 1 : zahl(o.korrWohnung)) * (o.korrGrundriss === undefined ? 1 : zahl(o.korrGrundriss));
    var herstellung = nhk * zahl(o.baupreisindex) / 100 * zahl(o.bgf) * (o.regionalfaktor === undefined ? 1 : zahl(o.regionalfaktor));
    var awf = zahl(o.gnd) > 0 ? Math.min(1, zahl(o.rnd) / zahl(o.gnd)) : 0;
    var gebaeude = herstellung * awf;
    var aussen = gebaeude * zahl(o.aussenProzent) / 100;
    var bw = zahl(o.bodenwert);
    var vorlaeufig = gebaeude + aussen + bw;
    var swf = o.sachwertfaktor === undefined ? 1 : zahl(o.sachwertfaktor);
    var markt = vorlaeufig * swf;
    return {
      nhkKorrigiert: nhk, herstellungskosten: herstellung, alterswertminderungsfaktor: awf, gebaeude: gebaeude,
      aussenanlagen: aussen, bodenwert: bw, vorlaeufig: vorlaeufig, marktangepasst: markt,
      sachwert: markt + zahl(o.besondere)
    };
  }

  /* § 559 BGB (Wortlaut geprüft 07.10.2026): jährliche Miete + 8 % der Modernisierungskosten (ohne Erhaltungsanteil);
     Kappung Monatsmiete in 6 Jahren: 3 €/m², bei Ausgangsmiete unter 7 €/m² nur 2 €/m²; reiner Heizungstausch 0,50 €/m². */
  function modernisierungsumlage(o) {
    var kosten = zahl(o.kosten) * zahl(o.anteilModernisierungProzent) / 100;
    var monatOhneKappung = kosten * 0.08 / 12;
    var wfl = zahl(o.wohnflaeche);
    var satz = o.nurHeizung ? 0.5 : (zahl(o.mieteAltJeM2) < 7 ? 2 : 3);
    var kappung = satz * wfl;
    return {
      umlagefaehig: kosten,
      monatOhneKappung: monatOhneKappung,
      kappungMonat: kappung,
      kappungSatz: satz,
      monat: wfl > 0 ? Math.min(monatOhneKappung, kappung) : monatOhneKappung,
      gekappt: wfl > 0 && monatOhneKappung > kappung
    };
  }

  /* Deutsche Zahleneingabe lesen: „300.000“, „300000“, „5,5“, „1.234,56“, „ 16 € “.
     Liefert eine Zahl oder null, wenn der Text keine eindeutige Zahl ist. Leer gilt als 0. */
  function leseZahl(text) {
    var s = String(text === undefined || text === null ? '' : text)
      .replace(/[\s €%]/g, '').replace(/m²$/, '');
    if (s === '') return 0;
    if (!/^-?[\d.,]+$/.test(s)) return null;
    var komma = s.indexOf(',');
    if (komma !== -1) {
      if (s.indexOf(',', komma + 1) !== -1) return null;   /* zwei Kommas */
      var vorne = s.slice(0, komma);
      if (vorne.indexOf('.') !== -1 && !/^-?\d{1,3}(\.\d{3})+$/.test(vorne)) return null;
      s = vorne.replace(/\./g, '') + '.' + s.slice(komma + 1);
    } else if (s.indexOf('.') !== -1) {
      /* nur Punkte: Tausenderpunkte, wenn das Muster passt, sonst Dezimalpunkt (3.5) */
      if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
      else if (!/^-?\d+\.\d+$/.test(s)) return null;
    }
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  /* ---------- Grundriss ---------- */

  /* Fläche eines Vielecks aus Eckpunkten [[x,y], …] in Metern (Gaußsche Trapezformel). */
  function polygonFlaeche(punkte) {
    var s = 0, n = punkte ? punkte.length : 0;
    if (n < 3) return 0;
    for (var i = 0; i < n; i++) {
      var a = punkte[i], b = punkte[(i + 1) % n];
      s += zahl(a[0]) * zahl(b[1]) - zahl(b[0]) * zahl(a[1]);
    }
    return Math.abs(s) / 2;
  }

  /* Liegt der Punkt im Vieleck? (Strahlverfahren) */
  function punktImPolygon(x, y, punkte) {
    var drin = false, n = punkte ? punkte.length : 0;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = punkte[i][0], yi = punkte[i][1], xj = punkte[j][0], yj = punkte[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) drin = !drin;
    }
    return drin;
  }

  /* Angerechnete Wohnfläche eines Raums nach WoFlV §§ 2 und 4 (Wortlaut geprüft 08.10.2026).
     art: 'voll' (Wohnraum), 'wintergarten' (unbeheizt, zur Hälfte), 'balkon' (Balkon, Loggia,
     Terrasse: balkonProzent, in der Regel 25, höchstens 50), 'zubehoer' (Keller, Heizraum,
     Garage: zählt nicht). teil12 = Anteil der Fläche mit 1 bis unter 2 m lichter Höhe in %,
     teil0 = Anteil unter 1 m in % (zählt nicht). */
  function wohnflaecheRaum(r) {
    var f = zahl(r.flaeche);
    if (r.art === 'zubehoer') return 0;
    if (r.art === 'balkon') {
      var p = r.balkonProzent == null ? 25 : Math.min(50, Math.max(0, zahl(r.balkonProzent)));
      return f * p / 100;
    }
    var t12 = Math.min(100, Math.max(0, zahl(r.teil12)));
    var t0 = Math.min(100 - t12, Math.max(0, zahl(r.teil0)));
    var hoehe = f * (100 - t12 - t0) / 100 + f * t12 / 100 * 0.5;
    return r.art === 'wintergarten' ? hoehe * 0.5 : hoehe;
  }

  /* Nutzfläche außerhalb der Wohnfläche (Keller, Garage, Heizraum …), voll gezählt,
     damit sie getrennt geplant oder vermietet werden kann. */
  function nutzflaecheRaum(r) {
    return r.art === 'zubehoer' ? zahl(r.flaeche) : 0;
  }

  /* Summen der Kostenliste: posten [{menge, preis, gruppe:'umbau'|sonst}] */
  function einrichtungskosten(posten) {
    var e = 0, u = 0;
    (posten || []).forEach(function (p) {
      var s = zahl(p.menge) * zahl(p.preis);
      if (p.gruppe === 'umbau') u += s; else e += s;
    });
    return { einrichtung: e, umbau: u, summe: e + u };
  }

  /* ---------- Anzeige einfügen: Werte aus kopiertem Anzeigentext lesen ----------
     Der Text kommt aus Strg+A/Strg+C auf einer Portalseite; Beschriftung und Wert stehen dort
     oft in getrennten Zeilen („Kaufpreis\n349.000 €“). Gesucht wird die erste Zahl kurz nach der
     Beschriftung, bei Einheiten nur mit passender Einheit. Ergebnis wird immer zum Prüfen angezeigt. */
  var ZAHL = '(\\d{1,3}(?:[.\\s\\u00a0]\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?)';
  function zahlAusText(s) {
    return leseZahl(String(s).replace(/[\s\u00a0]/g, function () { return '.'; }));
  }
  function nachBeschriftung(text, beschriftungen, einheit, abstand) {
    for (var i = 0; i < beschriftungen.length; i++) {
      var re = new RegExp(beschriftungen[i] + '[^\\d\\n]{0,' + (abstand || 30) + '}\\n?[^\\d\\n]{0,20}' + ZAHL + '\\s*' + (einheit || ''), 'i');
      var m = re.exec(text);
      if (m) { var n = zahlAusText(m[1]); if (n != null) return { wert: n, treffer: m[0] }; }
    }
    return null;
  }
  function anzeigeLesen(text) {
    var t = String(text || '').replace(/\r/g, '').replace(/[ \t\u00a0]+/g, ' ');
    var w = {}, x;
    var EURO = '(?:€|EUR|Euro)', QM = '(?:m²|m2|qm)';
    x = nachBeschriftung(t, ['Kaufpreis', 'Preis(?![ \\t]*(?:/|pro|je)[ \\t]*m)'], EURO);
    if (x && x.wert >= 10000) w.preis = x.wert;
    else {
      /* Kleinanzeigen: Preis ohne Beschriftung unter der Überschrift („339.000 € VB“) */
      var re2 = new RegExp(ZAHL + '\\s*' + EURO, 'g'), m2;
      while ((m2 = re2.exec(t))) { var n2 = zahlAusText(m2[1]); if (n2 != null && n2 >= 10000) { w.preis = n2; break; } }
    }
    x = nachBeschriftung(t, ['Wohnfläche'], QM);
    if (x && x.wert > 5 && x.wert < 20000) w.flaeche = x.wert;
    x = nachBeschriftung(t, ['Grundstücksfläche', 'Grundstücksfl\\.?', 'Grundstück'], QM);
    if (x && x.wert > 5) w.grund = x.wert;
    x = nachBeschriftung(t, ['Zimmeranzahl', 'Anzahl Zimmer', 'Zimmer(?!-)'], '', 12);
    if (x && x.wert > 0 && x.wert < 100) w.zimmer = x.wert;
    else { var mz = /(\d+(?:,5)?)\s*-?\s*Zimmer/i.exec(t); if (mz) w.zimmer = zahlAusText(mz[1]); }
    x = nachBeschriftung(t, ['Baujahr'], '', 20);
    if (x && x.wert >= 1700 && x.wert <= 2100 && x.wert % 1 === 0) w.baujahr = x.wert;
    x = nachBeschriftung(t, ['Mieteinnahmen pro Jahr', 'Mieteinnahmen p\\.\\s?a\\.', 'Jahresnettokaltmiete', 'Jahresmiete', 'Jahreskaltmiete'], EURO);
    if (x) { w.miete = Math.round(x.wert / 12); w.mieteJahr = true; }
    else {
      x = nachBeschriftung(t, ['Mieteinnahmen pro Monat', 'Mieteinnahmen', 'Nettokaltmiete', 'Ist-Miete', 'Kaltmiete'], EURO);
      if (x) w.miete = x.wert;
    }
    x = nachBeschriftung(t, ['Anzahl Wohneinheiten', 'Wohneinheiten', 'Anzahl Wohnungen'], '', 15);
    if (x && x.wert > 0 && x.wert < 1000 && x.wert % 1 === 0) w.we = x.wert;
    if (/provisionsfrei|keine (?:Käufer)?provision/i.test(t)) w.makler = 0;
    else {
      x = nachBeschriftung(t, ['Käuferprovision', 'Provision für Käufer', 'Maklerprovision', 'Provision', 'Courtage'], '%', 40);
      if (x && x.wert <= 10) w.makler = x.wert;
    }
    var mo = /\b(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+(?:[\- ](?:[A-ZÄÖÜ][a-zäöüß]+|an der|am|im|ob der)){0,3})/.exec(t);
    if (mo) { w.plz = mo[1]; w.ort = mo[2].trim(); }
    var ml = /https?:\/\/[^\s"<>]+/.exec(t);
    if (ml) w.link = ml[0];
    return w;
  }

  /* ---------- Deutschlandkarte: Kennzahlen vergleichbar machen und zur Ampel mischen ----------
     rang(werte, hochIstGut): je Wert der Anteil der übrigen Werte, die schlechter sind, 0 bis 100
     (Gleichstand zählt halb). Fehlende Werte (null) bleiben null und zählen nicht mit. */
  function rang(werte, hochIstGut) {
    var da = werte.filter(function (w) { return w != null && isFinite(w); });
    var n = da.length;
    return werte.map(function (w) {
      if (w == null || !isFinite(w)) return null;
      if (n < 2) return 50;
      var schlechter = 0, gleich = 0;
      da.forEach(function (x) { if (x === w) gleich++; else if (hochIstGut ? x < w : x > w) schlechter++; });
      return (schlechter + (gleich - 1) / 2) / (n - 1) * 100;
    });
  }
  /* gesamtwert({ebene: rang}, {ebene: gewicht}): gewichteter Mittelwert der vorhandenen Ränge;
     null, wenn keine gewichtete Ebene einen Wert hat. */
  function gesamtwert(raenge, gewichte) {
    var s = 0, g = 0;
    Object.keys(gewichte).forEach(function (k) {
      var r = raenge[k], w = zahl(gewichte[k]);
      if (r != null && w > 0) { s += r * w; g += w; }
    });
    return g > 0 ? s / g : null;
  }
  /* ampelVon(wert, gruenAb, gelbAb): 'gut' | 'warn' | 'schlecht' | null */
  function ampelVon(wert, gruenAb, gelbAb) {
    if (wert == null) return null;
    return wert >= zahl(gruenAb) ? 'gut' : (wert >= zahl(gelbAb) ? 'warn' : 'schlecht');
  }

  var api = {
    rang: rang,
    gesamtwert: gesamtwert,
    ampelVon: ampelVon,
    anzeigeLesen: anzeigeLesen,
    afaSatz: afaSatz,
    langfrist: langfrist,
    anschaffungsnaheKosten: anschaffungsnaheKosten,
    erhoehteAfa: erhoehteAfa,
    gebaeudewertSachwert: gebaeudewertSachwert,
    kaufpreisAufteilung: kaufpreisAufteilung,
    verkauf: verkauf,
    polygonFlaeche: polygonFlaeche,
    punktImPolygon: punktImPolygon,
    wohnflaecheRaum: wohnflaecheRaum,
    nutzflaecheRaum: nutzflaecheRaum,
    einrichtungskosten: einrichtungskosten,
    leseZahl: leseZahl,
    barwertfaktoren: barwertfaktoren,
    restnutzungsdauer: restnutzungsdauer,
    ertragswert: ertragswert,
    sachwert: sachwert,
    modernisierungsumlage: modernisierungsumlage,
    kaufnebenkosten: kaufnebenkosten,
    finanzierung: finanzierung,
    kredit: kredit,
    anschluss: anschluss,
    heizungsCheck: heizungsCheck,
    vermietung: vermietung,
    monteur: monteur,
    anmieten: anmieten
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RECHNER = api;
})(typeof window !== 'undefined' ? window : globalThis);
