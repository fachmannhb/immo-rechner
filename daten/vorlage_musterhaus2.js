/* Vorlage „Musterhaus“ für „Grundriss und Einrichtung“: Grundriss nach einer Vorlage des Nutzers (lichte Maße, Ursprung links oben,
   x nach rechts, y nach unten), mit Maßen aus der Zeichnung des Nutzers. Auf Wanddicke 25 cm angeglichen: die Seite erkennt eine Trennwand nur,
   wenn die Lücke höchstens Innenwand + 2 cm misst (hier 27 cm). Geändert: Lücke Wohnzimmer|Küche 28 → 26 cm und Lücke Flur|Zimmer, Bad 31 → 26 cm;
   dafür Küche 2 cm breiter (3,82 statt 3,80 m), Zimmer und Bad 4 cm tiefer (3,74 statt 3,70 m), Bad 1 cm schmaler (1,69 statt 1,70 m).
   Alle anderen Maße sind die des Nutzers (Gesamtbreite 8,28 m, Schlafzimmer bis 10,25 m).
   ANNAHMEN: Obergeschoss wie das Erdgeschoss (vom Nutzer nicht vorgegeben), Raumnamen oben neutral; Treppe (1,00 × 3,40 m) im Wohnzimmer
   statt im nur 1,32 m tiefen Flur (dort bliebe neben ihr 32 cm Durchgang und sie versperrte die Türen); Nord 270 Grad; Dach Satteldach 35 Grad,
   First entlang der langen Seite. Möbel: nur, was der Katalog hat (kein Ecksofa, Sessel, Teppich, keine Badewanne, WC, kein Waschbecken).
   Erzeugt von tmp/vorlagen_erzeugen.js, nicht von Hand ändern. Alle Zahlen sind Planungswerte, keine Bauzeichnung. */
window.DATEN = window.DATEN || {};
window.DATEN.vorlagen = window.DATEN.vorlagen || {};
window.DATEN.vorlagen.musterhaus2 = {
  app: "immo-grundriss",
  version: 2,
  aktiv: 0,
  wandhoehe: 2.5,
  nord: 270,
  beispiel: true,
  vorlage: "musterhaus2",
  dach: {"form":"sattel","neigung":35,"first":"y","ueberstand":0.3},
  preise: {},
  mengen: {},
  etagen: [
    {
      name: "Erdgeschoss", bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.25, decke: 0.25,
      raeume: [
        {"id":"me_wohn","name":"Wohnzimmer","art":"voll","punkte":[[0,0],[4.2,0],[4.2,4.68],[0,4.68]]},
        {"id":"me_kueche","name":"Küche","art":"voll","punkte":[[4.46,0],[8.28,0],[8.28,4.68],[4.46,4.68]]},
        {"id":"me_flur","name":"Flur","art":"voll","punkte":[[3.3,4.93],[8.28,4.93],[8.28,6.25],[3.3,6.25]]},
        {"id":"me_schlaf","name":"Schlafzimmer","art":"voll","punkte":[[0,4.93],[3.1,4.93],[3.1,10.25],[0,10.25]]},
        {"id":"me_zimmer","name":"Zimmer","art":"voll","punkte":[[3.3,6.51],[6.4,6.51],[6.4,10.25],[3.3,10.25]]},
        {"id":"me_bad","name":"Bad","art":"voll","punkte":[[6.59,6.51],[8.28,6.51],[8.28,10.25],[6.59,10.25]]}
      ],
      teile: [
        {"id":"vmue1n1","art":"fenster","x":1.4,"y":-0.15,"w":1.4,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"me_wohn","kante":0,"t":0.3333},"bindungGrund":""},
        {"id":"vmue1n2","art":"fenster","x":5.2,"y":-0.15,"w":1,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"me_kueche","kante":0,"t":0.1937},"bindungGrund":""},
        {"id":"vmue1n3","art":"fenster","x":7.5,"y":-0.15,"w":0.9,"d":0.3,"dreh":0,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"me_kueche","kante":0,"t":0.7958},"bindungGrund":""},
        {"id":"vmue1n4","art":"tuer","x":8.43,"y":5.59,"w":1,"d":0.3,"dreh":90,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"me_flur","kante":1,"t":0.5},"bindungGrund":""},
        {"id":"vmue1n5","art":"fenster","x":1.55,"y":10.4,"w":1.1,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"me_schlaf","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue1n6","art":"fenster","x":4.85,"y":10.4,"w":1.4,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"me_zimmer","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue1n7","art":"fenster","x":7.435,"y":10.4,"w":0.6,"d":0.3,"dreh":180,"hoehe":0.6,"bruestung":1.2,"bindung":{"raum":"me_bad","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue1n8","art":"tuer","x":3.78,"y":4.805,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"me_flur","kante":0,"t":0.0964},"bindungGrund":""},
        {"id":"vmue1n9","art":"tuer","x":5.6,"y":4.805,"w":0.9,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"me_flur","kante":0,"t":0.4618},"bindungGrund":""},
        {"id":"vmue1n10","art":"tuer","x":3.2,"y":5.59,"w":0.9,"d":0.25,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"me_schlaf","kante":1,"t":0.1241},"bindungGrund":""},
        {"id":"vmue1n11","art":"tuer","x":3.9,"y":6.38,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"me_zimmer","kante":0,"t":0.1935},"bindungGrund":""},
        {"id":"vmue1n12","art":"tuer","x":7.1,"y":6.38,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"me_bad","kante":0,"t":0.3018},"bindungGrund":""},
        {"id":"vmue1n13","art":"treppe","x":0.55,"y":2.55,"w":1,"d":3.4,"dreh":0},
        {"id":"vmue1n14","art":"sofa","x":3.7,"y":2.7,"w":2.18,"d":0.88,"dreh":270},
        {"id":"vmue1n15","art":"couchtisch","x":2.55,"y":2.7,"w":0.9,"d":0.55,"dreh":90},
        {"id":"vmue1n16","art":"tvboard","x":1.6,"y":2.7,"w":1.2,"d":0.41,"dreh":90},
        {"id":"vmue1n17","art":"kueche","x":7.98,"y":2.45,"w":2.7,"d":0.6,"dreh":270},
        {"id":"vmue1n18","art":"kuehlschrank","x":7.995,"y":4.13,"w":0.55,"d":0.57,"dreh":270},
        {"id":"vmue1n19","art":"esstisch","x":6,"y":2.5,"w":1.25,"d":0.75,"dreh":0},
        {"id":"vmue1n20","art":"stuhl","x":5.65,"y":1.8,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vmue1n21","art":"stuhl","x":6.35,"y":1.8,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vmue1n22","art":"stuhl","x":5.65,"y":3.2,"w":0.45,"d":0.5,"dreh":180},
        {"id":"vmue1n23","art":"stuhl","x":6.35,"y":3.2,"w":0.45,"d":0.5,"dreh":180},
        {"id":"vmue1n24","art":"bett180","x":1.25,"y":5.98,"w":1.9,"d":2.1,"dreh":0},
        {"id":"vmue1n25","art":"schrank3","x":0.3,"y":8.6,"w":1.17,"d":0.55,"dreh":90},
        {"id":"vmue1n26","art":"sofa","x":5.94,"y":8.4,"w":2.18,"d":0.88,"dreh":270},
        {"id":"vmue1n27","art":"spiegelschrank","x":8.195,"y":8.2,"w":0.5,"d":0.17,"dreh":270},
        {"id":"vmue1n28","art":"waschmaschine","x":6.875,"y":9.1,"w":0.6,"d":0.57,"dreh":90}
      ]
    },
    {
      name: "Obergeschoss (Annahme: wie EG)", bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.25, decke: 0.25,
      raeume: [
        {"id":"mo_wohn","name":"Zimmer 1","art":"voll","punkte":[[0,0],[4.2,0],[4.2,4.68],[0,4.68]]},
        {"id":"mo_kueche","name":"Zimmer 2","art":"voll","punkte":[[4.46,0],[8.28,0],[8.28,4.68],[4.46,4.68]]},
        {"id":"mo_flur","name":"Flur","art":"voll","punkte":[[3.3,4.93],[8.28,4.93],[8.28,6.25],[3.3,6.25]]},
        {"id":"mo_schlaf","name":"Zimmer 3","art":"voll","punkte":[[0,4.93],[3.1,4.93],[3.1,10.25],[0,10.25]]},
        {"id":"mo_zimmer","name":"Zimmer 4","art":"voll","punkte":[[3.3,6.51],[6.4,6.51],[6.4,10.25],[3.3,10.25]]},
        {"id":"mo_bad","name":"Bad","art":"voll","punkte":[[6.59,6.51],[8.28,6.51],[8.28,10.25],[6.59,10.25]]}
      ],
      teile: [
        {"id":"vmue2n29","art":"fenster","x":1.4,"y":-0.15,"w":1.4,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_wohn","kante":0,"t":0.3333},"bindungGrund":""},
        {"id":"vmue2n30","art":"fenster","x":5.2,"y":-0.15,"w":1,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_kueche","kante":0,"t":0.1937},"bindungGrund":""},
        {"id":"vmue2n31","art":"fenster","x":7.5,"y":-0.15,"w":0.9,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_kueche","kante":0,"t":0.7958},"bindungGrund":""},
        {"id":"vmue2n32","art":"fenster","x":8.43,"y":5.59,"w":1,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_flur","kante":1,"t":0.5},"bindungGrund":""},
        {"id":"vmue2n33","art":"fenster","x":1.55,"y":10.4,"w":1.1,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_schlaf","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue2n34","art":"fenster","x":4.85,"y":10.4,"w":1.4,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"mo_zimmer","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue2n35","art":"fenster","x":7.435,"y":10.4,"w":0.6,"d":0.3,"dreh":180,"hoehe":0.6,"bruestung":1.2,"bindung":{"raum":"mo_bad","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vmue2n36","art":"tuer","x":3.78,"y":4.805,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"mo_flur","kante":0,"t":0.0964},"bindungGrund":""},
        {"id":"vmue2n37","art":"tuer","x":5.6,"y":4.805,"w":0.9,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"mo_flur","kante":0,"t":0.4618},"bindungGrund":""},
        {"id":"vmue2n38","art":"tuer","x":3.2,"y":5.59,"w":0.9,"d":0.25,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"mo_schlaf","kante":1,"t":0.1241},"bindungGrund":""},
        {"id":"vmue2n39","art":"tuer","x":3.9,"y":6.38,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"mo_zimmer","kante":0,"t":0.1935},"bindungGrund":""},
        {"id":"vmue2n40","art":"tuer","x":7.1,"y":6.38,"w":0.8,"d":0.25,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"mo_bad","kante":0,"t":0.3018},"bindungGrund":""},
        {"id":"vmue2n41","art":"treppeoben","x":0.55,"y":2.55,"w":1,"d":3.4,"dreh":0}
      ]
    }
  ]
};
