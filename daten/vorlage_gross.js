/* Vorlage „Großes Haus“ für „Grundriss und Einrichtung“: zwei Geschosse, innen 10,0 × 10,4 m (außen etwa 10,6 × 11,0 m), Wohnfläche etwa 200 m².
   Ganz erfunden, keine echten Daten. Kompakter Quader, Wohnbereich im Süden (unten im Plan, Nord = 0), Eingang, Treppe und Nebenräume im Norden,
   Satteldach 35 Grad mit waagerechtem First, damit eine Dachfläche nach Süden zeigt (Bericht recherche/29_hausform_dach.md). Treppe 1,00 × 3,40 m
   gerade, Steigung etwa 18 cm (Maß geschätzt). Die Außenmaße sind größer als der Wunsch 10 × 11 m, damit die Wohnfläche bei 200 m² landet.
   Erzeugt von erzeuger/vorlagen_erzeugen.js, nicht von Hand ändern. */
window.DATEN = window.DATEN || {};
window.DATEN.vorlagen = window.DATEN.vorlagen || {};
window.DATEN.vorlagen.gross = {
  app: "immo-grundriss",
  version: 2,
  aktiv: 0,
  wandhoehe: 2.5,
  nord: 0,
  beispiel: true,
  vorlage: "gross",
  dach: {"form":"sattel","neigung":35,"first":"x","ueberstand":0.3},
  preise: {},
  mengen: {},
  etagen: [
    {
      name: "Erdgeschoss", bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.115, decke: 0.25,
      raeume: [
        {"id":"ge_arbeit","name":"Arbeitszimmer","art":"voll","nutzung":"arbeiten","punkte":[[0,0],[3.4,0],[3.4,4.4],[0,4.4]]},
        {"id":"ge_wc","name":"WC","art":"voll","nutzung":"wc","punkte":[[3.515,0],[5.3,0],[5.3,2],[3.515,2]]},
        {"id":"ge_hwr","name":"HWR / Technik","art":"voll","nutzung":"technik","punkte":[[3.515,2.115],[5.3,2.115],[5.3,4.4],[3.515,4.4]]},
        {"id":"ge_flur","name":"Flur","art":"voll","nutzung":"flur","punkte":[[5.415,0],[8,0],[8,4.4],[5.415,4.4]]},
        {"id":"ge_speis","name":"Abstell","art":"voll","nutzung":"abstell","punkte":[[8.115,0],[10,0],[10,4.4],[8.115,4.4]]},
        {"id":"ge_wek","name":"Wohnen / Essen / Küche","art":"voll","nutzung":"wohnen","punkte":[[0,4.515],[10,4.515],[10,10.4],[0,10.4]]}
      ],
      teile: [
        {"id":"vgre1n1","art":"tuer","x":6.25,"y":-0.15,"w":1.1,"d":0.3,"dreh":0,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"ge_flur","kante":0,"t":0.323},"bindungGrund":""},
        {"id":"vgre1n2","art":"tuer","x":6,"y":4.458,"w":0.9,"d":0.115,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"ge_wek","kante":0,"t":0.6},"bindungGrund":""},
        {"id":"vgre1n3","art":"tuer","x":1.7,"y":4.458,"w":0.9,"d":0.115,"dreh":180,"hoehe":2,"bruestung":0,"bindung":{"raum":"ge_arbeit","kante":2,"t":0.5},"bindungGrund":""},
        {"id":"vgre1n4","art":"tuer","x":9,"y":4.458,"w":0.8,"d":0.115,"dreh":180,"hoehe":2,"bruestung":0,"bindung":{"raum":"ge_speis","kante":2,"t":0.5305},"bindungGrund":""},
        {"id":"vgre1n5","art":"tuer","x":5.358,"y":1,"w":0.8,"d":0.115,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"ge_wc","kante":1,"t":0.5},"bindungGrund":""},
        {"id":"vgre1n6","art":"tuer","x":5.358,"y":3,"w":0.8,"d":0.115,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"ge_hwr","kante":1,"t":0.3873},"bindungGrund":""},
        {"id":"vgre1n7","art":"fenster","x":1.5,"y":10.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_wek","kante":2,"t":0.85},"bindungGrund":""},
        {"id":"vgre1n8","art":"fenster","x":3.9,"y":10.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_wek","kante":2,"t":0.61},"bindungGrund":""},
        {"id":"vgre1n9","art":"fenster","x":6.5,"y":10.55,"w":1.2,"d":0.3,"dreh":180,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"ge_wek","kante":2,"t":0.35},"bindungGrund":""},
        {"id":"vgre1n10","art":"fenster","x":8.6,"y":10.55,"w":1.2,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_wek","kante":2,"t":0.14},"bindungGrund":""},
        {"id":"vgre1n11","art":"fenster","x":-0.15,"y":7.5,"w":1.4,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_wek","kante":3,"t":0.4928},"bindungGrund":""},
        {"id":"vgre1n12","art":"fenster","x":10.15,"y":9.2,"w":1,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_wek","kante":1,"t":0.7961},"bindungGrund":""},
        {"id":"vgre1n13","art":"fenster","x":1.7,"y":-0.15,"w":1.4,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_arbeit","kante":0,"t":0.5},"bindungGrund":""},
        {"id":"vgre1n14","art":"fenster","x":-0.15,"y":1.8,"w":1.2,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"ge_arbeit","kante":3,"t":0.5909},"bindungGrund":""},
        {"id":"vgre1n15","art":"fenster","x":4.4,"y":-0.15,"w":0.6,"d":0.3,"dreh":0,"hoehe":0.6,"bruestung":1.2,"bindung":{"raum":"ge_wc","kante":0,"t":0.4958},"bindungGrund":""},
        {"id":"vgre1n16","art":"treppe","x":7.47,"y":1.85,"w":1,"d":3.4,"dreh":180},
        {"id":"vgre1n17","art":"schreibtisch","x":1.7,"y":0.35,"w":1.2,"d":0.6,"dreh":180},
        {"id":"vgre1n18","art":"buerostuhl","x":1.7,"y":1,"w":0.6,"d":0.6,"dreh":0},
        {"id":"vgre1n19","art":"regal","x":3.26,"y":2.6,"w":0.8,"d":0.28,"dreh":90},
        {"id":"vgre1n20","art":"waschmaschine","x":3.95,"y":3.95,"w":0.6,"d":0.57,"dreh":0},
        {"id":"vgre1n21","art":"trockner","x":4.75,"y":3.95,"w":0.6,"d":0.6,"dreh":0},
        {"id":"vgre1n22","art":"sofa","x":2.5,"y":9,"w":2.18,"d":0.88,"dreh":0},
        {"id":"vgre1n23","art":"couchtisch","x":2.5,"y":7.8,"w":0.9,"d":0.55,"dreh":0},
        {"id":"vgre1n24","art":"tvboard","x":2.5,"y":5.4,"w":1.2,"d":0.41,"dreh":180},
        {"id":"vgre1n25","art":"kueche","x":9.7,"y":7,"w":2.7,"d":0.6,"dreh":270},
        {"id":"vgre1n26","art":"kuehlschrank","x":9.715,"y":5.25,"w":0.55,"d":0.57,"dreh":270},
        {"id":"vgre1n27","art":"esstisch","x":6.8,"y":7.2,"w":1.25,"d":0.75,"dreh":0},
        {"id":"vgre1n28","art":"stuhl","x":6.45,"y":6.5,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vgre1n29","art":"stuhl","x":7.15,"y":6.5,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vgre1n30","art":"stuhl","x":6.45,"y":7.9,"w":0.45,"d":0.5,"dreh":180},
        {"id":"vgre1n31","art":"stuhl","x":7.15,"y":7.9,"w":0.45,"d":0.5,"dreh":180}
      ]
    },
    {
      name: "Obergeschoss", bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.115, decke: 0.25,
      raeume: [
        {"id":"go_schlaf2","name":"Schlafzimmer 2","art":"voll","nutzung":"schlafen","punkte":[[0,0],[3.4,0],[3.4,4.4],[0,4.4]]},
        {"id":"go_flur","name":"Flur / Galerie","art":"voll","nutzung":"flur","punkte":[[3.515,0],[8,0],[8,4.4],[3.515,4.4]]},
        {"id":"go_bad","name":"Bad","art":"voll","nutzung":"bad","punkte":[[8.115,0],[10,0],[10,4.4],[8.115,4.4]]},
        {"id":"go_ankleide","name":"Ankleide / Abstell","art":"voll","nutzung":"abstell","punkte":[[0,4.515],[6.4,4.515],[6.4,6.3],[0,6.3]]},
        {"id":"go_eltern","name":"Schlafzimmer 1","art":"voll","nutzung":"schlafen","punkte":[[0,6.415],[6.4,6.415],[6.4,10.4],[0,10.4]]},
        {"id":"go_zimmer3","name":"Schlafzimmer 3","art":"voll","nutzung":"schlafen","punkte":[[6.515,4.515],[10,4.515],[10,10.4],[6.515,10.4]]}
      ],
      teile: [
        {"id":"vgre2n32","art":"tuer","x":3.458,"y":1.8,"w":0.9,"d":0.115,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"go_schlaf2","kante":1,"t":0.4091},"bindungGrund":""},
        {"id":"vgre2n33","art":"tuer","x":8.058,"y":1.8,"w":0.8,"d":0.115,"dreh":270,"hoehe":2,"bruestung":0,"bindung":{"raum":"go_bad","kante":3,"t":0.5909},"bindungGrund":""},
        {"id":"vgre2n34","art":"tuer","x":4.6,"y":4.458,"w":0.9,"d":0.115,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"go_ankleide","kante":0,"t":0.7187},"bindungGrund":""},
        {"id":"vgre2n35","art":"tuer","x":3,"y":6.358,"w":0.9,"d":0.115,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"go_eltern","kante":0,"t":0.4688},"bindungGrund":""},
        {"id":"vgre2n36","art":"tuer","x":7.3,"y":4.458,"w":0.9,"d":0.115,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"go_zimmer3","kante":0,"t":0.2253},"bindungGrund":""},
        {"id":"vgre2n37","art":"fenster","x":1.7,"y":-0.15,"w":1.4,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_schlaf2","kante":0,"t":0.5},"bindungGrund":""},
        {"id":"vgre2n38","art":"fenster","x":-0.15,"y":1.8,"w":1.2,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_schlaf2","kante":3,"t":0.5909},"bindungGrund":""},
        {"id":"vgre2n39","art":"fenster","x":5.75,"y":-0.15,"w":1.2,"d":0.3,"dreh":0,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_flur","kante":0,"t":0.4983},"bindungGrund":""},
        {"id":"vgre2n40","art":"fenster","x":9.05,"y":-0.15,"w":0.6,"d":0.3,"dreh":0,"hoehe":0.6,"bruestung":1.2,"bindung":{"raum":"go_bad","kante":0,"t":0.496},"bindungGrund":""},
        {"id":"vgre2n41","art":"fenster","x":-0.15,"y":5.4,"w":1,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_ankleide","kante":3,"t":0.5042},"bindungGrund":""},
        {"id":"vgre2n42","art":"fenster","x":-0.15,"y":9.3,"w":1,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_eltern","kante":3,"t":0.276},"bindungGrund":""},
        {"id":"vgre2n43","art":"fenster","x":1.6,"y":10.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_eltern","kante":2,"t":0.75},"bindungGrund":""},
        {"id":"vgre2n44","art":"fenster","x":4.4,"y":10.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_eltern","kante":2,"t":0.3125},"bindungGrund":""},
        {"id":"vgre2n45","art":"fenster","x":8.25,"y":10.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_zimmer3","kante":2,"t":0.5022},"bindungGrund":""},
        {"id":"vgre2n46","art":"fenster","x":10.15,"y":9,"w":1.2,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_zimmer3","kante":1,"t":0.7621},"bindungGrund":""},
        {"id":"vgre2n47","art":"fenster","x":10.15,"y":5.6,"w":1,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"go_zimmer3","kante":1,"t":0.1844},"bindungGrund":""},
        {"id":"vgre2n48","art":"treppeoben","x":7.47,"y":1.85,"w":1,"d":3.4,"dreh":180},
        {"id":"vgre2n49","art":"bett140","x":1.5,"y":1.35,"w":1.5,"d":2.1,"dreh":0},
        {"id":"vgre2n50","art":"schrank2","x":0.45,"y":4.05,"w":0.79,"d":0.55,"dreh":180},
        {"id":"vgre2n51","art":"bett180","x":5.33,"y":8.4,"w":1.9,"d":2.1,"dreh":90},
        {"id":"vgre2n52","art":"nachttisch","x":6.18,"y":7.25,"w":0.39,"d":0.41,"dreh":90},
        {"id":"vgre2n53","art":"nachttisch","x":6.18,"y":9.55,"w":0.39,"d":0.41,"dreh":90},
        {"id":"vgre2n54","art":"schrank3","x":0.3,"y":7.3,"w":1.17,"d":0.55,"dreh":90},
        {"id":"vgre2n55","art":"bett140","x":8.6,"y":5.7,"w":1.5,"d":2.1,"dreh":0},
        {"id":"vgre2n56","art":"schreibtisch","x":7.2,"y":10.05,"w":1.2,"d":0.6,"dreh":180},
        {"id":"vgre2n57","art":"buerostuhl","x":7.2,"y":9.4,"w":0.6,"d":0.6,"dreh":0},
        {"id":"vgre2n58","art":"waschmaschine","x":8.45,"y":4.1,"w":0.6,"d":0.57,"dreh":0},
        {"id":"vgre2n59","art":"spiegelschrank","x":9.915,"y":2.7,"w":0.5,"d":0.17,"dreh":270}
      ]
    }
  ]
};
