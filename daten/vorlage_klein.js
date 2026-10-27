/* Vorlage „Kleines Haus“ für „Grundriss und Einrichtung“: eingeschossig, innen 7,40 × 8,40 m (außen etwa 8,0 × 9,0 m), Wohnfläche etwa 60 m².
   Ganz erfunden, keine echten Daten. Kompakter Quader ohne Vor- und Rücksprünge (Bericht recherche/29_hausform_dach.md: Erker und Versprünge
   verschlechtern die Kompaktheit), Fenster vor allem nach Süden (unten im Plan, Nord = 0), Satteldach 30 Grad, First waagerecht im Plan,
   damit eine Dachfläche nach Süden zeigt. Die Außenmaße weichen vom Wunsch 7,5 × 8,5 m ab, weil sonst nur etwa 50 m² Wohnfläche herauskommen.
   Erzeugt von tmp/vorlagen_erzeugen.js, nicht von Hand ändern. */
window.DATEN = window.DATEN || {};
window.DATEN.vorlagen = window.DATEN.vorlagen || {};
window.DATEN.vorlagen.klein = {
  app: "immo-grundriss",
  version: 2,
  aktiv: 0,
  wandhoehe: 2.5,
  nord: 0,
  beispiel: true,
  vorlage: "klein",
  dach: {"form":"sattel","neigung":30,"first":"x","ueberstand":0.3},
  preise: {},
  mengen: {},
  etagen: [
    {
      name: "Erdgeschoss", bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.115, decke: 0.25,
      raeume: [
        {"id":"k_bad","name":"Bad","art":"voll","nutzung":"bad","punkte":[[0,0],[2.1,0],[2.1,2.9],[0,2.9]]},
        {"id":"k_flur","name":"Flur/Technik","art":"voll","nutzung":"flur","punkte":[[2.215,0],[4,0],[4,2.9],[2.215,2.9]]},
        {"id":"k_zimmer","name":"Kleines Zimmer","art":"voll","nutzung":"arbeiten","punkte":[[4.115,0],[7.4,0],[7.4,2.9],[4.115,2.9]]},
        {"id":"k_wohn","name":"Wohnen / Kochen","art":"voll","nutzung":"wohnen","punkte":[[0,3.015],[4.4,3.015],[4.4,8.4],[0,8.4]]},
        {"id":"k_schlaf","name":"Schlafzimmer","art":"voll","nutzung":"schlafen","punkte":[[4.515,3.015],[7.4,3.015],[7.4,8.4],[4.515,8.4]]}
      ],
      teile: [
        {"id":"vkle1n1","art":"tuer","x":3.1,"y":-0.15,"w":1,"d":0.3,"dreh":0,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"k_flur","kante":0,"t":0.4958},"bindungGrund":""},
        {"id":"vkle1n2","art":"tuer","x":3.2,"y":2.958,"w":0.9,"d":0.115,"dreh":0,"hoehe":2,"bruestung":0,"bindung":{"raum":"k_wohn","kante":0,"t":0.7273},"bindungGrund":""},
        {"id":"vkle1n3","art":"tuer","x":2.157,"y":1.45,"w":0.8,"d":0.115,"dreh":90,"hoehe":2,"bruestung":0,"bindung":{"raum":"k_bad","kante":1,"t":0.5},"bindungGrund":""},
        {"id":"vkle1n4","art":"tuer","x":4.058,"y":1.45,"w":0.8,"d":0.115,"dreh":270,"hoehe":2,"bruestung":0,"bindung":{"raum":"k_zimmer","kante":3,"t":0.5},"bindungGrund":""},
        {"id":"vkle1n5","art":"tuer","x":4.458,"y":7,"w":0.8,"d":0.115,"dreh":270,"hoehe":2,"bruestung":0,"bindung":{"raum":"k_schlaf","kante":3,"t":0.26},"bindungGrund":""},
        {"id":"vkle1n6","art":"fenster","x":1.2,"y":8.55,"w":1.6,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"k_wohn","kante":2,"t":0.7273},"bindungGrund":""},
        {"id":"vkle1n7","art":"fenster","x":3.3,"y":8.55,"w":0.9,"d":0.3,"dreh":180,"hoehe":2.1,"bruestung":0,"bindung":{"raum":"k_wohn","kante":2,"t":0.25},"bindungGrund":""},
        {"id":"vkle1n8","art":"fenster","x":-0.15,"y":7.2,"w":1.2,"d":0.3,"dreh":270,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"k_wohn","kante":3,"t":0.2228},"bindungGrund":""},
        {"id":"vkle1n9","art":"fenster","x":5.95,"y":8.55,"w":1.4,"d":0.3,"dreh":180,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"k_schlaf","kante":2,"t":0.5026},"bindungGrund":""},
        {"id":"vkle1n10","art":"fenster","x":7.55,"y":6.5,"w":1,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"k_schlaf","kante":1,"t":0.6472},"bindungGrund":""},
        {"id":"vkle1n11","art":"fenster","x":7.55,"y":1.45,"w":1,"d":0.3,"dreh":90,"hoehe":1.3,"bruestung":0.9,"bindung":{"raum":"k_zimmer","kante":1,"t":0.5},"bindungGrund":""},
        {"id":"vkle1n12","art":"fenster","x":1.05,"y":-0.15,"w":0.6,"d":0.3,"dreh":0,"hoehe":0.6,"bruestung":1.2,"bindung":{"raum":"k_bad","kante":0,"t":0.5},"bindungGrund":""},
        {"id":"vkle1n13","art":"kueche","x":0.3,"y":4.55,"w":2.7,"d":0.6,"dreh":90},
        {"id":"vkle1n14","art":"kuehlschrank","x":0.285,"y":6.2,"w":0.55,"d":0.57,"dreh":90},
        {"id":"vkle1n15","art":"esstisch","x":2.45,"y":4.95,"w":1.25,"d":0.75,"dreh":0},
        {"id":"vkle1n16","art":"stuhl","x":2.1,"y":4.25,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vkle1n17","art":"stuhl","x":2.8,"y":4.25,"w":0.45,"d":0.5,"dreh":0},
        {"id":"vkle1n18","art":"stuhl","x":2.1,"y":5.65,"w":0.45,"d":0.5,"dreh":180},
        {"id":"vkle1n19","art":"stuhl","x":2.8,"y":5.65,"w":0.45,"d":0.5,"dreh":180},
        {"id":"vkle1n20","art":"sofa","x":2.2,"y":7.85,"w":2.18,"d":0.88,"dreh":0},
        {"id":"vkle1n21","art":"couchtisch","x":2.2,"y":6.75,"w":0.9,"d":0.55,"dreh":0},
        {"id":"vkle1n22","art":"bett180","x":6,"y":4.1,"w":1.9,"d":2.1,"dreh":0},
        {"id":"vkle1n23","art":"nachttisch","x":4.8,"y":3.25,"w":0.39,"d":0.41,"dreh":0},
        {"id":"vkle1n24","art":"nachttisch","x":7.15,"y":3.25,"w":0.39,"d":0.41,"dreh":0},
        {"id":"vkle1n25","art":"schrank2","x":7,"y":8.1,"w":0.79,"d":0.55,"dreh":0},
        {"id":"vkle1n26","art":"schreibtisch","x":5.7,"y":0.35,"w":1.2,"d":0.6,"dreh":180},
        {"id":"vkle1n27","art":"buerostuhl","x":5.7,"y":1,"w":0.6,"d":0.6,"dreh":0},
        {"id":"vkle1n28","art":"regal","x":6.8,"y":2.75,"w":0.8,"d":0.28,"dreh":0},
        {"id":"vkle1n29","art":"waschmaschine","x":0.35,"y":2.55,"w":0.6,"d":0.57,"dreh":0},
        {"id":"vkle1n30","art":"spiegelschrank","x":2.015,"y":0.7,"w":0.5,"d":0.17,"dreh":270}
      ]
    }
  ]
};
