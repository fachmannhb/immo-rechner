/* Gradtagzahl G20/15 je Bundesland (Kd/a), gerechnet für die Station der Landeshauptstadt (bzw. nahe Station), Zeitraum 1991 bis 2020.
   Quelle: recherche/40_gas_oel_heizgradtage.md, Abschnitt 4 (Abruf 27.10.2026): eigene Rechnung aus DWD-Monatsmitteln (Q8), Basis G20/15 nach VDI 3807 (20 °C Raumtemperatur, 15 °C Heizgrenze).
   Alle Werte: Status „prüfen vor Nutzung“, weil Monatsmittelnäherung statt Tagesrechnung des DWD; Grenzmonate (Mittel nahe 15 °C) können die Werte um einige hundert Kd verschieben.
   Kontrolle im Bericht: Berlin-Dahlem 3.546,7 gegen 3.542,2 beim DWD-nahen Vergleichswert (Q9), Abweichung rund 4 Kd.
   Schlüssel = Bundesland-Kürzel wie plan.land. Von Hand gepflegt (kein Erzeuger); weitere Stationen später hier nachtragen. */
window.DATEN = window.DATEN || {};
window.DATEN.gradtage = {
  meta: { titel: 'Gradtagzahl G20/15 je Bundesland', einheit: 'Kd/a', basis: 'G20/15 nach VDI 3807 (20 °C Raumtemperatur, 15 °C Heizgrenze)', abruf: '2026-10-27',
    quelle: 'Bericht 40, Abschnitt 4: eigene Rechnung aus DWD-Monatsmitteln 1991 bis 2020', status: 'prüfen vor Nutzung' },
  laender: {
    BW: { wert: 3148, station: 'Stuttgart-Schnarrenberg (4928)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    BY: { wert: 3501, station: 'München-Stadt (3379)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    BE: { wert: 3547, station: 'Berlin-Dahlem FU (403)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    BB: { wert: 3583, station: 'Potsdam (3987)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    HB: { wert: 3462, station: 'Bremen (691)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    HH: { wert: 3523, station: 'Hamburg-Fuhlsbüttel (1975)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    HE: { wert: 3549, station: 'Wiesbaden-Auringen (5541)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    MV: { wert: 3614, station: 'Schwerin (4625)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    NI: { wert: 3434, station: 'Hannover (2014)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    NW: { wert: 2981, station: 'Düsseldorf (1078), Grenzmonat', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    RP: { wert: 3135, station: 'Mainz-Lerchenberg (3137), Grenzmonat', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    SL: { wert: 3504, station: 'Saarbrücken-Ensheim (4336), Flughafen auf 319 m', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    SN: { wert: 3601, station: 'Dresden-Klotzsche (1048)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    ST: { wert: 3446, station: 'Magdeburg (3126)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    SH: { wert: 3602, station: 'Kiel-Kronshagen (2565)', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' },
    TH: { wert: 3756, station: 'Erfurt-Weimar (1270), Flughafen auf 316 m', quelle: 'Bericht 40, eigene Rechnung aus DWD-Monatsmitteln', abruf: '2026-10-27', status: 'prüfen vor Nutzung' }
  }
};
