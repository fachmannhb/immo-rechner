/* 3D-Ansicht für „Grundriss und Einrichtung“ (Three.js r160, global THREE).
   Welle B (27.10.2026): ganzes Haus (alle Etagen übereinander, einzeln ein- und ausblendbar, „Aufschneiden“), echte Wände mit
   Öffnungen für gebundene Fenster und Türen (grundriss_dach.js → wandKoerper), Dach (Sattel, Walm, Pult, Flach) über dem
   umschließenden Rechteck der obersten Etage, Sonne mit Schatten (Tageszeit, Jahreszeit), Himmelsrichtungen auf dem Boden,
   Dachflächen nach Solarertrag gefärbt (daten/pvgis.js), Durchgehen in Augenhöhe.
   Zeichnet nur bei Änderung, Drehen oder solange eine Gehtaste gehalten wird, ohne Dauerschleife.
   Planpunkt (x, y) → 3D (x, höhe, y). Ansichtseinstellungen (Etagen aus, Aufschneiden, Sonne) gehören nicht zum Plan. */
(function () {
  'use strict';
  var canvas = document.getElementById('g-3d');
  var ersatz = document.getElementById('g-3d-ersatz');
  if (!canvas) return;
  var $ = function (id) { return document.getElementById(id); };
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function kaputt(grund) { ersatz.hidden = false; canvas.hidden = true; if (grund) ersatz.textContent = grund; }
  var DACH = window.GRUNDRISS_DACH, GEO = window.GRUNDRISS_GEO;
  if (typeof THREE === 'undefined' || !DACH || !GEO) { window.GRUNDRISS3D = { zeige: function () { kaputt(); }, aktiv: function () {}, pause: function () {} }; return; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  var RAD = Math.PI / 180;

  var renderer = null, szene, kamera, wurzel, licht = {};
  var ziel = new THREE.Vector3(), winkel = 0.35, hoehe = 1.0, abstand = 20;
  var kugel = { c: new THREE.Vector3(), r: 10 };
  var texturen = {}, gedreht = false;
  var P = null, A = null;                       /* letzter Plan und Möbelkatalog */
  var an = { versteckt: {}, schnitt: false, dachfarbe: true, stunde: 14, monat: 6 };
  var ort = { name: 'Bremen', lat: 53.079, lon: 8.802, tabelle: false };
  var gruppenEtage = [], ebenenZ = [], dachGruppe = null, dachI = -1, dachMeshes = [], dachInfo = [], etageZahl = -1;
  var aktiv3d = false, geh = null, tasten = {}, laufId = 0, letzt = 0, hover = null;
  var farbeKlasse = {}, sonneInit = false;

  /* ---------- Aufbau von Szene und Eingabe ---------- */
  function anlegen() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { kaputt(); return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    szene = new THREE.Scene();
    kamera = new THREE.PerspectiveCamera(35, 1, 0.05, 600);
    licht.himmel = new THREE.HemisphereLight(0xffffff, 0x404040, 0.8);
    licht.sonne = new THREE.DirectionalLight(0xffffff, 1.5);
    licht.sonne.castShadow = true;
    licht.sonne.shadow.mapSize.set(1024, 1024);
    licht.sonne.shadow.bias = -0.0006; licht.sonne.shadow.normalBias = 0.03;
    licht.lampe = new THREE.PointLight(0xffffff, 0.7, 0, 0);   /* nur beim Durchgehen: Licht am Auge, damit Innenräume nicht schwarz sind */
    licht.lampe.visible = false;
    szene.add(licht.himmel); szene.add(licht.sonne); szene.add(licht.sonne.target); szene.add(licht.lampe);
    wurzel = new THREE.Group(); szene.add(wurzel);
    eingabe();
    if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(canvas);
    return true;
  }
  function eingabe() {
    var ziehen = null;
    canvas.addEventListener('pointerdown', function (ev) {
      ziehen = { x: ev.clientX, y: ev.clientY, w: winkel, h: hoehe, yaw: geh ? geh.yaw : 0, pitch: geh ? geh.pitch : 0, weit: 0, typ: ev.pointerType };
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ohne Capture reicht move auf dem Element */ }
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!ziehen) { if (!geh && ev.pointerType !== 'touch') dachZeigenAn(ev, false); return; }
      var dx = ev.clientX - ziehen.x, dy = ev.clientY - ziehen.y;
      ziehen.weit = Math.max(ziehen.weit, Math.hypot(dx, dy));
      if (geh) {
        geh.yaw = ziehen.yaw - dx * 0.005;
        geh.pitch = Math.max(-1.2, Math.min(1.2, ziehen.pitch + dy * 0.004));
      } else {
        winkel = ziehen.w - dx * 0.008;
        hoehe = Math.max(0.05, Math.min(1.45, ziehen.h + dy * 0.005));
        gedreht = true;
      }
      zeichnen();
    });
    function los(ev) {
      if (ziehen && ziehen.weit < 6 && !geh) dachZeigenAn(ev, true);   /* Tippen/Klicken ohne Ziehen: Wert der Dachfläche zeigen */
      ziehen = null;
    }
    canvas.addEventListener('pointerup', los);
    canvas.addEventListener('pointercancel', function () { ziehen = null; });
    canvas.addEventListener('pointerleave', function (ev) { if (ev.pointerType !== 'touch') tippWeg(); });
    canvas.addEventListener('wheel', function (ev) {
      if (!ev.ctrlKey || geh) return;
      ev.preventDefault();
      abstand = Math.max(kugel.r * 0.9, Math.min(kugel.r * 9, abstand * (ev.deltaY > 0 ? 1.12 : 1 / 1.12)));
      zeichnen();
    }, { passive: false });
    canvas.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (geh) {
        var n = gehTaste(k);
        if (n) { ev.preventDefault(); if (!ev.repeat) taste(n, true); }
        return;
      }
      var tat = true;
      if (k === 'ArrowLeft') winkel += 0.12; else if (k === 'ArrowRight') winkel -= 0.12;
      else if (k === 'ArrowUp') hoehe = Math.min(1.45, hoehe + 0.06); else if (k === 'ArrowDown') hoehe = Math.max(0.05, hoehe - 0.06);
      else if (k === '+' || k === '=') abstand = Math.max(kugel.r * 0.9, abstand / 1.15);
      else if (k === '-' || k === '_') abstand = Math.min(kugel.r * 9, abstand * 1.15);
      else tat = false;
      if (tat) { ev.preventDefault(); gedreht = true; zeichnen(); }
    });
    canvas.addEventListener('keyup', function (ev) { var n = gehTaste(ev.key); if (n) taste(n, false); });
    canvas.addEventListener('blur', function () { Object.keys(tasten).forEach(function (n) { tasten[n] = false; }); });
  }
  function groesse() {
    if (!renderer) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    var alt = kamera.aspect;
    kamera.aspect = w / h; kamera.updateProjectionMatrix();
    if (!gedreht && !geh && P && Math.abs(alt - kamera.aspect) > 0.01) abstand = kugel.r * 3.6 * Math.max(1, 1.1 / kamera.aspect);
    zeichnen();
  }
  function zeichnen() {
    if (!renderer) return;
    if (geh) {
      var eb = ebenenZ[P.aktiv], ay = (eb ? eb.basis : 0) + 1.6, cp = Math.cos(geh.pitch);
      kamera.position.set(geh.x, ay, geh.y);
      licht.lampe.position.set(geh.x, ay - 0.2, geh.y);
      kamera.lookAt(geh.x + Math.sin(geh.yaw) * cp, ay + Math.sin(geh.pitch), geh.y - Math.cos(geh.yaw) * cp);
    } else {
      kamera.position.set(
        ziel.x + abstand * Math.cos(hoehe) * Math.sin(winkel),
        ziel.y + abstand * Math.sin(hoehe),
        ziel.z + abstand * Math.cos(hoehe) * Math.cos(winkel));
      kamera.lookAt(ziel);
    }
    renderer.render(szene, kamera);
  }

  /* ---------- Hilfen zum Bauen ---------- */
  function entsorgen(o) {
    o.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        (Array.isArray(c.material) ? c.material : [c.material]).forEach(function (m) {
          if (m.map && !m.map.userData.cache) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
  function leeren() {
    while (wurzel.children.length) { var o = wurzel.children[wurzel.children.length - 1]; wurzel.remove(o); entsorgen(o); }
    gruppenEtage = []; ebenenZ = []; dachGruppe = null; dachMeshes = []; dachInfo = []; hover = null;
  }
  function lambert(farbe, opak) {
    var m = new THREE.MeshLambertMaterial({ color: farbe });
    if (opak != null && opak < 1) { m.transparent = true; m.opacity = opak; }
    return m;
  }
  function kasten(g, b, h, t, mat, x, y, z, drehY, art) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), mat);
    m.position.set(x, y, z); m.rotation.y = drehY || 0; m.userData.kind = art || 'teil';
    g.add(m);
    return m;
  }
  /* Treppen: Löcher in Boden und Decke, Stufen. Maße (Grundfläche w × d, Laufrichtung zur Planoberkante bei Drehung 0) aus dem Teil. */
  function eckenVon(t, schrumpf) {
    var hw = Math.max(0.01, t.w / 2 - schrumpf), hd = Math.max(0.01, t.d / 2 - schrumpf), r = (t.dreh || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (q) { return [t.x + q[0] * c - q[1] * s, t.y + q[0] * s + q[1] * c]; });
  }
  /* Ecken der Öffnungen (Teile dieser Arten), deren Mitte im Raum r liegt; 2 cm nach innen gerückt, damit das Loch den Rand nicht berührt */
  function loecher(e, r, arten) {
    var res = [];
    (e.teile || []).forEach(function (t) {
      var a = A[t.art];
      if (!a || arten.indexOf(a.form) < 0 || !GEO.punktImVieleck([t.x, t.y], r.punkte)) return;
      res.push(eckenVon(t, 0.02));
    });
    return res;
  }
  function lochPfad(q) {
    var p = new THREE.Path();
    q.forEach(function (c, k) { if (k) p.lineTo(c[0], -c[1]); else p.moveTo(c[0], -c[1]); });
    p.closePath();
    return p;
  }
  function treppeBauen(g, t, oben, z, hatOben, mat, matGel) {
    var r = (t.dreh || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), drehY = -r;
    function ort(lx, ly) { return [t.x + lx * c - ly * s, t.y + lx * s + ly * c]; }
    if (oben) {
      /* Geländer an den beiden langen Seiten und am unteren Ende der Öffnung; oben (Planoberkante) bleibt sie frei */
      [[-t.w / 2 + 0.02, 0, 0.04, t.d], [t.w / 2 - 0.02, 0, 0.04, t.d], [0, t.d / 2 - 0.02, t.w, 0.04]].forEach(function (k) {
        var p = ort(k[0], k[1]); kasten(g, k[2], 1.0, k[3], matGel, p[0], 0.5, p[1], drehY, 'treppe');
      });
      return;
    }
    var gesamt = z.hoehe + z.decke;
    if (!hatOben) {   /* keine Etage darüber: nur die Grundfläche andeuten */
      var q = ort(0, 0); kasten(g, t.w, 0.04, t.d, mat, q[0], 0.03, q[1], drehY, 'treppe'); return;
    }
    var n = Math.max(3, Math.round(gesamt / 0.18)), steig = gesamt / n, lauf = t.d / (n - 1);
    for (var k = 1; k < n; k++) {
      var p2 = ort(0, t.d / 2 - (k - 0.5) * lauf);
      kasten(g, t.w, k * steig, lauf, mat, p2[0], k * steig / 2, p2[1], drehY, 'treppe');
    }
  }
  function textur(url) {
    if (texturen[url]) return texturen[url];
    var t = new THREE.TextureLoader().load(url, function () { zeichnen(); });
    t.colorSpace = THREE.SRGBColorSpace; t.userData.cache = true;
    texturen = {}; texturen[url] = t; /* nur das aktuelle Bild behalten */
    return t;
  }
  function buchstabe(text, farbe) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d');
    x.font = '800 96px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,0.85)'; x.strokeText(text, 64, 68);
    x.fillStyle = farbe; x.fillText(text, 64, 68);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function istDunkel() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function hex(c) { return '#' + c.getHexString(); }
  function klassenFarben() {
    var g = new THREE.Color(css('--gut') || '#1f7542'), w = new THREE.Color(css('--warn') || '#8a6400'), s = new THREE.Color(css('--schlecht') || '#b23b2b');
    farbeKlasse = { sehrgut: g, gut: g.clone().lerp(w, 0.5), maessig: w, schlecht: s };
  }

  /* ---------- Gebäude bauen ---------- */
  function bauen() {
    if (!renderer || !P) return;
    leeren();
    var dunkel = istDunkel(), plan = P, eb = DACH.ebenen(plan);
    ebenenZ = eb; dachI = DACH.dachEtage(plan);
    klassenFarben();
    /* hell: warmes Weiß wie bisher; dunkel: aus den Themenfarben heller gemischt, damit die Wände sich vom Boden abheben */
    var wandFarbe = dunkel ? new THREE.Color(css('--linie2')).lerp(new THREE.Color(css('--text')), 0.4) : new THREE.Color('#f3efe8');
    var M = {
      aussen: lambert(wandFarbe), innen: lambert(wandFarbe.clone().multiplyScalar(0.9)),
      decke: lambert(wandFarbe.clone().multiplyScalar(0.8)),
      glas: lambert(new THREE.Color(css('--c2')), 0.38), blatt: lambert(new THREE.Color(css('--f6'))),
      gelaender: lambert(wandFarbe, 0.55), wandweg: lambert(new THREE.Color(css('--schlecht')), 0.35)
    };
    M.glas.depthWrite = false; M.gelaender.depthWrite = false; M.wandweg.depthWrite = false;
    var farbe = { voll: css('--f2'), balkon: css('--f4'), wintergarten: css('--f1'), zubehoer: css('--f7') };
    var teilFarbe = { wohnung: css('--f2'), monteur: css('--f5'), umbau: css('--f3') };

    var x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity, ymin = 0, ymax = 2.5;
    function nimm(x, z) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }

    plan.etagen.forEach(function (e, i) {
      var z = eb[i], H = z.hoehe, g = new THREE.Group();
      g.position.y = z.basis; g.userData.etage = i; wurzel.add(g); gruppenEtage[i] = g;
      ymin = Math.min(ymin, z.basis); ymax = Math.max(ymax, z.oben + z.decke);
      if (e.bild && i === plan.aktiv) {
        var bw = e.bildB * e.mpp, bh = e.bildH * e.mpp;
        var boden = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: textur(e.bild), transparent: true, opacity: 0.9 }));
        boden.rotation.x = -Math.PI / 2; boden.position.set(bw / 2, -0.01, bh / 2); boden.userData.kind = 'bild';
        g.add(boden);
        nimm(0, 0); nimm(bw, bh);
      }
      var deckeG = new THREE.Group(); g.add(deckeG); g.userData.decke = deckeG;
      var hatOben = plan.etagen.some(function (e2, j) { return j !== i && eb[j] && !eb[j].keller && eb[j].basis > z.basis; });
      e.raeume.forEach(function (r) {
        var form = new THREE.Shape(), formDecke = new THREE.Shape();
        r.punkte.forEach(function (p, k) { if (k) form.lineTo(p[0], -p[1]); else form.moveTo(p[0], -p[1]); if (k) formDecke.lineTo(p[0], -p[1]); else formDecke.moveTo(p[0], -p[1]); nimm(p[0], p[1]); });
        /* Treppenöffnung: im Boden dieser Etage (Teil „Treppenöffnung“) und in der Decke über der Treppe (Teil „Treppe“, nur wenn oben eine Etage liegt) */
        loecher(e, r, ['treppeoben']).forEach(function (q) { form.holes.push(lochPfad(q)); });
        if (hatOben) loecher(e, r, ['treppe']).forEach(function (q) { formDecke.holes.push(lochPfad(q)); });
        var b = new THREE.Mesh(new THREE.ShapeGeometry(form), new THREE.MeshLambertMaterial({ color: farbe[r.art] || farbe.voll, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        b.rotation.x = -Math.PI / 2; b.position.y = 0.01; b.receiveShadow = true; b.userData.kind = 'boden';
        g.add(b);
        if (r.art === 'balkon') {
          r.punkte.forEach(function (p, k) {
            var q = r.punkte[(k + 1) % r.punkte.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
            if (L < 0.01) return;
            kasten(g, L + 0.1, 1.0, 0.1, M.gelaender, (p[0] + q[0]) / 2, 0.5, (p[1] + q[1]) / 2, -Math.atan2(dz, dx), 'gelaender').renderOrder = 2;
          });
        } else {
          var sl = new THREE.Mesh(new THREE.ExtrudeGeometry(formDecke, { depth: z.decke, bevelEnabled: false }), M.decke);
          sl.rotation.x = -Math.PI / 2; sl.position.y = H; sl.castShadow = true; sl.receiveShadow = true; sl.userData.kind = 'decke';
          deckeG.add(sl);
        }
      });
      /* Wände mit Öffnungen */
      var kk = DACH.wandKoerper(e, A, H);
      kk.forEach(function (k) {
        var mat = k.k === 'glas' ? M.glas : k.k === 'blatt' ? M.blatt : (k.typ === 'innen' ? M.innen : M.aussen);
        var m = kasten(g, k.len, k.z1 - k.z0, k.dick, mat, k.cx, (k.z0 + k.z1) / 2, k.cy, -Math.atan2(k.uy, k.ux), k.k);
        if (k.k !== 'glas') { m.castShadow = true; m.receiveShadow = true; }
        else m.renderOrder = 3;
      });
      /* Möbel und freie (ungebundene) Fenster und Türen wie bisher */
      e.teile.forEach(function (t) {
        var a = A[t.art]; if (!a) return;
        if (kk.verbraucht && kk.verbraucht[t.id]) return;
        if (a.form === 'treppe' || a.form === 'treppeoben') {
          treppeBauen(g, t, a.form === 'treppeoben', z, hatOben, lambert(new THREE.Color(teilFarbe.umbau)), M.gelaender);
          nimm(t.x - t.w / 2, t.y - t.w / 2); nimm(t.x + t.w / 2, t.y + t.w / 2);
          return;
        }
        var drehY = -t.dreh * Math.PI / 180, h = (a.hoehe || 80) / 100, y = h / 2, mat;
        var f = new THREE.Color(teilFarbe[a.gruppe] || teilFarbe.wohnung), opak = 1;
        if (a.form === 'wand') { h = H; y = H / 2; }
        if (a.form === 'wandweg') { h = H; y = H / 2; f = new THREE.Color(css('--schlecht')); opak = 0.35; }
        if (a.form === 'fenster') { if (t.hoehe) h = t.hoehe; y = (t.bruestung != null ? t.bruestung : 0.9) + h / 2; f = new THREE.Color(css('--c2')); opak = 0.55; }
        if (a.form === 'flaeche') { h = 0.04; y = 0.03; opak = 0.6; }
        mat = lambert(f, opak);
        var m = kasten(g, t.w, h, t.d, mat, t.x, y, t.y, drehY, 'teil');
        m.castShadow = true;
        nimm(t.x - t.w / 2, t.y - t.w / 2); nimm(t.x + t.w / 2, t.y + t.w / 2);
      });
    });
    if (!isFinite(x0)) { x0 = 0; z0 = 0; x1 = 10; z1 = 8; }
    var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, halb = Math.hypot(x1 - x0, z1 - z0) / 2;

    /* Dach */
    var roofTop = ymax;
    if (dachI >= 0) {
      var re = plan.etagen[dachI], rect = DACH.huellRechteck(re);
      if (rect) {
        var zT = eb[dachI].oben + eb[dachI].decke, df = DACH.dachFlaechen(plan.dach, rect, zT);
        dachGruppe = new THREE.Group(); wurzel.add(dachGruppe);
        dachBauen(df, M, plan);
        roofTop = Math.max(ymax, df.zFirst);
        nimm(rect.x0 - plan.dach.ueberstand, rect.y0 - plan.dach.ueberstand); nimm(rect.x1 + plan.dach.ueberstand, rect.y1 + plan.dach.ueberstand);
        cx = (x0 + x1) / 2; cz = (z0 + z1) / 2; halb = Math.hypot(x1 - x0, z1 - z0) / 2;
      }
    }
    /* Boden mit Himmelsrichtungen */
    kugel.c.set(cx, (ymin + roofTop) / 2, cz);
    kugel.r = Math.max(4, Math.hypot(halb, (roofTop - ymin) / 2));
    var bo = new THREE.Mesh(new THREE.CircleGeometry(kugel.r * 2.4, 64), new THREE.MeshLambertMaterial({ color: css('--linie') || '#d9d3e0', transparent: true, opacity: 0.78 }));
    bo.rotation.x = -Math.PI / 2; bo.position.set(cx, -0.03, cz); bo.receiveShadow = true; bo.userData.kind = 'grund'; bo.renderOrder = -1;
    wurzel.add(bo);
    var nord = plan.nord || 0, namen = ['himN', 'himO', 'himS', 'himW'], rd = halb + 2.6;
    namen.forEach(function (n, k) {
      var az = (k * 90 + nord) * RAD, dx = Math.sin(az), dz = -Math.cos(az);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: buchstabe(tr(n), k === 0 ? css('--schlecht') : css('--text')), transparent: true, depthWrite: false }));
      m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = Math.atan2(-dx, -dz);
      m.position.set(cx + dx * rd, 0.02, cz + dz * rd); m.userData.kind = 'himmel';
      wurzel.add(m);
    });

    ziel.copy(kugel.c);
    if (!geh) {
      abstand = kugel.r * 3.6 * Math.max(1, 1.1 / kamera.aspect);   /* Hochformat (Handy): weiter weg, damit das Haus ins Bild passt */
      if (!gedreht) { hoehe = 0.5; winkel = 0.5; }   /* schräg von vorn und leicht von der Seite, so sieht man Dach und Wände */
    }
    var etikett = $('g-3d-etikett');
    var e0 = plan.etagen[plan.aktiv] || plan.etagen[0];
    if (etikett) etikett.textContent = e0.name + (e0.raeume.length ? '' : ' (noch keine Räume)');
  }

  function flaecheGeo(pts) {
    var pos = [];
    for (var i = 1; i + 1 < pts.length; i++) [pts[0], pts[i], pts[i + 1]].forEach(function (p) { pos.push(p[0], p[2], p[1]); });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }
  function dachBauen(df, M, plan) {
    var daten = window.DATEN && window.DATEN.pvgis, nord = plan.nord || 0;
    var zeile = daten ? DACH.stadtZeile(daten, ort.name) : null, best = zeile ? DACH.bestwert(daten, ort.name) : null;
    var neutral = new THREE.Color(css('--f6'));
    df.faces.forEach(function (f, n) {
      var info = { n: n + 1, neigung: Math.round(f.neigung), bergab: f.bergab, richtung: f.bergab ? Math.round(DACH.himmelsrichtung(f.bergab, nord)) : null, ey: null, klasse: null, gekappt: false };
      if (zeile) {
        var asp = f.bergab ? DACH.aspekt(f.bergab, nord) : 0, er = DACH.ertrag(daten, ort.name, asp, f.neigung);
        info.ey = Math.round(er.ey); info.gekappt = er.gekappt; info.klasse = DACH.klasse(er.ey, best); info.aspekt = Math.round(asp);
      }
      var farbe = an.dachfarbe && info.klasse ? farbeKlasse[info.klasse] : neutral;
      var mat = new THREE.MeshLambertMaterial({ color: farbe, side: THREE.DoubleSide });
      mat.emissive = farbe.clone().multiplyScalar(0.22);
      var m = new THREE.Mesh(flaecheGeo(f.pts), mat);
      m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'dach'; m.userData.info = info; m.userData.emi = 0.22;
      dachGruppe.add(m); dachMeshes.push(m); dachInfo.push(info);
    });
    df.giebel.forEach(function (p) {
      var m = new THREE.Mesh(flaecheGeo(p), new THREE.MeshLambertMaterial({ color: M.aussen.color, side: THREE.DoubleSide }));
      m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'giebel';
      dachGruppe.add(m);
    });
    if (df.kasten) {
      var k = df.kasten, b = new THREE.Mesh(new THREE.BoxGeometry(k.x1 - k.x0, k.z1 - k.z0, k.y1 - k.y0), M.decke);
      b.position.set((k.x0 + k.x1) / 2, (k.z0 + k.z1) / 2, (k.y0 + k.y1) / 2); b.castShadow = true; b.receiveShadow = true; b.userData.kind = 'dachplatte';
      dachGruppe.add(b);
    }
  }

  /* ---------- Sichtbarkeit (Etagen, Aufschneiden) ---------- */
  function sichtbarkeit() {
    if (!P || !gruppenEtage.length) return;
    var ak = Math.min(P.aktiv, ebenenZ.length - 1), bAk = ebenenZ[ak].basis;
    gruppenEtage.forEach(function (g, i) {
      var oben = ebenenZ[i].basis > bAk + 1e-9;
      g.visible = !an.versteckt[i] && !(an.schnitt && oben);
      g.userData.decke.visible = !(an.schnitt && i === ak);
    });
    if (dachGruppe) dachGruppe.visible = !an.schnitt && !an.versteckt[dachI];
    tippWeg();
  }
  function leisteBauen() {
    var box = $('g-3d-etagen'); if (!box || !P) return;
    box.innerHTML = '';
    P.etagen.forEach(function (e, i) {
      var b = document.createElement('button'), zu = !!an.versteckt[i];
      b.type = 'button'; b.className = 'chip mit-symbol g-3d-etage';
      b.setAttribute('aria-pressed', zu ? 'false' : 'true');
      var txt = tr(zu ? 'dreiEtageAus' : 'dreiEtageAn', { name: e.name });
      b.setAttribute('aria-label', txt); b.title = txt;
      b.innerHTML = '<svg class="sym" aria-hidden="true"><use href="#' + (zu ? 'i-auge-zu' : 'i-auge') + '"/></svg><span></span>';
      b.lastChild.textContent = e.name;
      b.addEventListener('click', function () { an.versteckt[i] = !an.versteckt[i]; leisteBauen(); sichtbarkeit(); zeichnen(); });
      box.appendChild(b);
    });
    box.title = tr('dreiEtagenHilfe');
    $('g-3d-schnitt').setAttribute('aria-pressed', an.schnitt ? 'true' : 'false');
    $('g-3d-dachfarbe').setAttribute('aria-pressed', an.dachfarbe ? 'true' : 'false');
    $('g-3d-gehen').setAttribute('aria-pressed', geh ? 'true' : 'false');
  }

  /* ---------- Sonne ---------- */
  function ortWaehlen(name) {
    var d = window.DATEN && window.DATEN.pvgis, z = d ? DACH.stadtZeile(d, name) : null;
    if (z) ort = { name: z.name, lat: z.lat, lon: z.lon, tabelle: true };
    else ort = { name: name, lat: ort.lat, lon: ort.lon, tabelle: false };
  }
  function zeitText(h) {
    var m = Math.round(h * 60), hh = Math.floor(m / 60), mm = m % 60;
    return hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function datumText(opt) {
    try { return new Date(2026, an.monat - 1, 21).toLocaleDateString(window.TXT ? window.TXT.lang() : 'de', opt); } catch (e) { return String(an.monat) + '.'; }
  }
  /* Himmelsrichtung als Wort: 'R' = Genitiv/„nach Süden“, 'S' = Nennform „Süd“ (Schlüssel als volle Zeichenketten, damit tmp/planung_test.py sie findet) */
  var RICHT_GEN = ['dreiRgN', 'dreiRgNO', 'dreiRgO', 'dreiRgSO', 'dreiRgS', 'dreiRgSW', 'dreiRgW', 'dreiRgNW'];
  var RICHT_NOM = ['dreiRnN', 'dreiRnNO', 'dreiRnO', 'dreiRnSO', 'dreiRnS', 'dreiRnSW', 'dreiRnW', 'dreiRnNW'];
  var KLASSE_TEXT = { sehrgut: 'dreiKsehrgut', gut: 'dreiKgut', maessig: 'dreiKmaessig', schlecht: 'dreiKschlecht' };
  function himmelWort(grad, form) { return tr((form === 'S' ? RICHT_NOM : RICHT_GEN)[Math.round((((grad % 360) + 360) % 360) / 45) % 8]); }
  function sonneSetzen() {
    if (!renderer) return;
    var s = DACH.sonnenstand(ort.lat, ort.lon, an.monat, an.stunde), dunkel = istDunkel(), nord = (P && P.nord) || 0;
    var el = Math.max(0.03, s.hoehe * RAD), az = (s.azimut + nord) * RAD;
    var dist = kugel.r * 3 + 20, R = kugel.r * 1.6;
    var dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    licht.sonne.position.copy(kugel.c).addScaledVector(dir, dist);
    licht.sonne.target.position.copy(kugel.c); licht.sonne.target.updateMatrixWorld();
    var sc = licht.sonne.shadow.camera;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = Math.max(0.5, dist - R * 1.7); sc.far = dist + R * 1.7; sc.updateProjectionMatrix();
    licht.sonne.castShadow = s.ueber;
    licht.sonne.intensity = s.ueber ? (dunkel ? 1.1 : 1.6) * Math.min(1, 0.4 + 1.2 * Math.sin(el)) : 0;
    licht.himmel.intensity = s.ueber ? (dunkel ? 0.55 : 0.8) : (dunkel ? 0.35 : 0.5);
    var zt = zeitText(an.stunde);
    $('g-3d-zeit-w').textContent = tr('dreiZeitWert', { h: zt });
    $('g-3d-jahr-w').textContent = datumText({ month: 'long' });
    $('g-3d-sonnetext').textContent = s.ueber
      ? tr('dreiSonneText', { datum: datumText({ day: 'numeric', month: 'long' }), zeit: zt, ort: ort.name, hoehe: Math.round(s.hoehe), richtung: himmelWort(s.azimut, 'R') })
      : tr('dreiSonneUnter', { datum: datumText({ day: 'numeric', month: 'long' }), zeit: zt, ort: ort.name });
    stand = s;
  }
  var stand = null;

  /* ---------- Dach: Legende, Liste, Wert beim Zeigen ---------- */
  function dachBoxZeigen() {
    var box = $('g-3d-dachbox'); if (!box) return;
    var daten = window.DATEN && window.DATEN.pvgis;
    box.hidden = !aktiv3d || !an.dachfarbe;
    if (box.hidden) return;
    box.querySelectorAll('.g-3d-legende .muster').forEach(function (s) { s.style.background = hex(farbeKlasse[s.getAttribute('data-k')] || new THREE.Color('#888')); });
    var liste = $('g-3d-dachliste'); liste.innerHTML = '';
    var best = daten ? DACH.bestwert(daten, ort.name) : null;
    $('g-3d-schwellen').textContent = best ? tr('dreiSchwellen', { ort: ort.name, best: Math.round(best) }) : '';
    $('g-3d-dachquelle').textContent = daten && best ? tr('dreiDachQuelle', { quelle: daten.quelle, abruf: daten.abruf, ort: ort.name, urheber: daten.urheber }) : '';
    $('g-3d-ort').textContent = tr('dreiOrt', { ort: ort.name });
    var li;
    if (!dachInfo.length) { li = document.createElement('li'); li.textContent = tr('dreiKeinDach'); liste.appendChild(li); }
    dachInfo.forEach(function (d) {
      li = document.createElement('li');
      var sw = document.createElement('span'), tx = document.createElement('span');
      sw.className = 'muster'; sw.setAttribute('aria-hidden', 'true');
      if (d.klasse) sw.style.background = hex(farbeKlasse[d.klasse]); else sw.style.background = 'transparent';
      tx.textContent = d.klasse
        ? tr(d.richtung == null ? 'dreiDachZeileFlach' : 'dreiDachZeile', { n: d.n, richtung: d.richtung == null ? tr('dreiSflach') : himmelWort(d.richtung, 'R'), neigung: d.neigung, ey: d.ey, klasse: tr(KLASSE_TEXT[d.klasse]) }) + (d.gekappt ? tr('dreiDachKappung') : '')
        : tr(daten ? 'dreiKeinOrt' : 'dreiKeineDaten', { ort: ort.name });
      li.appendChild(sw); li.appendChild(tx); liste.appendChild(li);
    });
  }
  function tippWeg() {
    var t = $('g-3d-tipp'); if (t) { t.hidden = true; t.textContent = ''; }
    if (hover) { hover.material.emissive.copy(hover.material.color).multiplyScalar(hover.userData.emi); hover = null; zeichnen(); }
  }
  function dachZeigenAn(ev, tippen) {
    if (!dachMeshes.length || !dachGruppe || !dachGruppe.visible || !renderer) return;
    var r = canvas.getBoundingClientRect();
    var v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    var rc = new THREE.Raycaster(); rc.setFromCamera(v, kamera);
    var sichtbarMeshes = [];
    wurzel.traverse(function (o) { if (o.isMesh && sichtbarGanz(o) && o.userData.kind !== 'grund' && o.userData.kind !== 'himmel' && o.userData.kind !== 'glas') sichtbarMeshes.push(o); });
    var hit = rc.intersectObjects(sichtbarMeshes, false)[0];
    var m = hit && hit.object.userData.kind === 'dach' ? hit.object : null;
    var t = $('g-3d-tipp');
    if (hover && hover !== m) { hover.material.emissive.copy(hover.material.color).multiplyScalar(hover.userData.emi); hover = null; }
    if (!m) { t.hidden = true; t.textContent = ''; zeichnen(); return; }
    var d = m.userData.info;
    hover = m; m.material.emissive.copy(m.material.color).multiplyScalar(0.7);
    var sp = document.createElement('span');
    sp.textContent = d.klasse
      ? tr('dreiTipp', { n: d.n, richtung: d.richtung == null ? tr('dreiSflach') : himmelWort(d.richtung, 'S'), neigung: d.neigung, ey: d.ey, klasse: tr(KLASSE_TEXT[d.klasse]) })
      : tr('dreiDachTitel') + ' ' + d.n;
    t.textContent = ''; t.appendChild(sp); t.hidden = false;
    zeichnen();
  }
  function sichtbarGanz(o) { for (var p = o; p; p = p.parent) if (!p.visible) return false; return true; }

  /* ---------- Durchgehen ---------- */
  function gehTaste(k) {
    switch (k) {
      case 'ArrowUp': case 'w': case 'W': return 'vor';
      case 'ArrowDown': case 's': case 'S': return 'zurueck';
      case 'ArrowLeft': case 'a': case 'A': return 'links';
      case 'ArrowRight': case 'd': case 'D': return 'rechts';
      default: return null;
    }
  }
  function erlaubt(x, y) {
    var e = P.etagen[P.aktiv];
    return e.raeume.some(function (r) {
      if (GEO.punktImVieleck([x, y], r.punkte)) return true;
      for (var i = 0; i < r.punkte.length; i++) if (GEO.abstandPunktStrecke([x, y], r.punkte[i], r.punkte[(i + 1) % r.punkte.length]) < 0.12) return true;
      return false;
    });
  }
  function schritt(nx, ny) {
    if (erlaubt(nx, ny)) { geh.x = nx; geh.y = ny; return true; }
    if (erlaubt(nx, geh.y)) { geh.x = nx; return true; }
    if (erlaubt(geh.x, ny)) { geh.y = ny; return true; }
    return false;
  }
  function lauf(t) {
    laufId = 0;
    if (!geh) return;
    var dt = Math.min(0.1, Math.max(0.001, (t - letzt) / 1000)); letzt = t;
    bewegen(dt);
    if (Object.keys(tasten).some(function (n) { return tasten[n]; })) laufId = requestAnimationFrame(lauf);
  }
  function bewegen(dt) {
    var v = (tasten.vor ? 1 : 0) - (tasten.zurueck ? 1 : 0), d = (tasten.rechts ? 1 : 0) - (tasten.links ? 1 : 0);
    if (!v && !d) return;
    geh.yaw += d * 1.8 * dt;
    if (v) { var s = v * 1.8 * dt; schritt(geh.x + Math.sin(geh.yaw) * s, geh.y - Math.cos(geh.yaw) * s); }
    hinweisZu();
    zeichnen();
  }
  function taste(n, ein) {
    if (!geh) return;
    var vorher = !!tasten[n]; tasten[n] = ein;
    document.querySelectorAll('[data-geh="' + n + '"]').forEach(function (b) { b.classList.toggle('an', ein); });
    if (ein && !vorher) { bewegen(0.04); if (!laufId) { letzt = performance.now(); laufId = requestAnimationFrame(lauf); } }
  }
  function startPunkt(e) {
    var best = null;
    e.raeume.forEach(function (r) {
      if (r.art === 'balkon') return;
      var f = 0, cx = 0, cy = 0;
      r.punkte.forEach(function (p, i) { var q = r.punkte[(i + 1) % r.punkte.length], k = p[0] * q[1] - q[0] * p[1]; f += k; cx += (p[0] + q[0]) * k; cy += (p[1] + q[1]) * k; });
      var fl = Math.abs(f) / 2; if (!fl || (best && best.f >= fl)) return;
      var c = [cx / (3 * f), cy / (3 * f)];
      if (!GEO.punktImVieleck(c, r.punkte)) {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, bp = null, bd = Infinity;
        r.punkte.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
        for (var x = x0; x <= x1; x += 0.25) for (var y = y0; y <= y1; y += 0.25) if (GEO.punktImVieleck([x, y], r.punkte)) { var d = Math.hypot(x - c[0], y - c[1]); if (d < bd) { bd = d; bp = [x, y]; } }
        if (!bp) return;
        c = bp;
      }
      best = { f: fl, x: c[0], y: c[1] };
    });
    return best;
  }
  function gehenStart() {
    if (!P || !renderer) return false;
    var e = P.etagen[P.aktiv], sp = startPunkt(e);
    if (!sp) { fehler(tr('dreiGehenLeer')); return false; }
    fehler('');
    var wohin = Math.atan2(kugel.c.x - sp.x, -(kugel.c.z - sp.y));
    geh = { x: sp.x, y: sp.y, yaw: Math.hypot(kugel.c.x - sp.x, kugel.c.z - sp.y) > 0.5 ? wohin : 0, pitch: 0, etage: P.aktiv };
    $('g-3d-geh').hidden = false; $('g-3d-gehstatus').hidden = false;
    $('g-3d-gehstatus').textContent = tr('dreiGehenStatus', { name: e.name });
    canvas.style.touchAction = 'none'; licht.lampe.visible = true;
    var bu = canvas.parentNode.querySelector('figcaption'); if (bu) bu.hidden = true;
    canvas.setAttribute('aria-label', tr('dreiCanvasGehAria'));
    leisteBauen();
    hinweisErst();
    document.addEventListener('keydown', escGehen);
    canvas.focus({ preventScroll: true });
    tippWeg(); zeichnen();
    return true;
  }
  function escGehen(ev) { if (ev.key === 'Escape' && geh) { ev.preventDefault(); gehenEnde(true); } }
  function gehenEnde(fokus) {
    if (!geh) return;
    geh = null; tasten = {};
    document.removeEventListener('keydown', escGehen);
    document.querySelectorAll('[data-geh]').forEach(function (b) { b.classList.remove('an'); });
    $('g-3d-geh').hidden = true; $('g-3d-gehstatus').hidden = true; hinweisZu();
    canvas.style.touchAction = ''; licht.lampe.visible = false;
    var bu = canvas.parentNode.querySelector('figcaption'); if (bu) bu.hidden = false;
    canvas.setAttribute('aria-label', tr('dreiCanvasAria'));
    leisteBauen(); zeichnen();
    if (fokus && $('g-3d-gehen')) $('g-3d-gehen').focus();
  }
  var HINWEIS_KEY = 'immo-hinweis-gehen';
  function hinweisErst() {
    var schon = false;
    try { schon = localStorage.getItem(HINWEIS_KEY) === '1'; } catch (e) { schon = false; }
    if (schon) return;
    try { localStorage.setItem(HINWEIS_KEY, '1'); } catch (e) { /* dann kommt der Hinweis beim nächsten Mal wieder */ }
    var h = $('g-3d-gehhinweis'); $('g-3d-gehhinweis-text').textContent = tr('dreiGehHinweis'); h.hidden = false;
    h.setAttribute('lang', window.TXT ? window.TXT.lang() : 'de');
  }
  function hinweisZu() { var h = $('g-3d-gehhinweis'); if (h) h.hidden = true; }
  function fehler(text) { var f = $('g-3d-fehler'); if (f) f.textContent = text || ''; }

  /* ---------- Bedienelemente der Leiste ---------- */
  function leisteBedienen() {
    $('g-3d-schnitt').addEventListener('click', function () { an.schnitt = !an.schnitt; leisteBauen(); sichtbarkeit(); zeichnen(); });
    $('g-3d-dachfarbe').addEventListener('click', function () { an.dachfarbe = !an.dachfarbe; leisteBauen(); if (P) { bauen(); sichtbarkeit(); dachBoxZeigen(); zeichnen(); } });
    $('g-3d-gehen').addEventListener('click', function () { if (geh) gehenEnde(false); else gehenStart(); });
    $('g-3d-geh-zu').addEventListener('click', function () { gehenEnde(true); });
    $('g-3d-gehhinweis-zu').addEventListener('click', function () { $('g-3d-gehhinweis').hidden = true; canvas.focus({ preventScroll: true }); });
    $('g-3d-zeit').addEventListener('input', function () { an.stunde = Number(this.value); sonneSetzen(); zeichnen(); });
    $('g-3d-jahr').addEventListener('input', function () { an.monat = Number(this.value); sonneSetzen(); zeichnen(); });
    document.querySelectorAll('[data-geh]').forEach(function (b) {
      var n = b.getAttribute('data-geh');
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch (e) { /* egal */ } taste(n, true); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, function () { taste(n, false); }); });
      b.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) taste(n, true); } });
      b.addEventListener('keyup', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') taste(n, false); });
    });
    window.addEventListener('sprachegewechselt', function () {
      if (!aktiv3d || !P) return;
      bauen(); leisteBauen(); sonneSetzen(); sichtbarkeit(); dachBoxZeigen(); zeichnen();
      if (geh) $('g-3d-gehstatus').textContent = tr('dreiGehenStatus', { name: P.etagen[P.aktiv].name });
    });
  }

  /* ---------- Schnittstelle ---------- */
  function zeige(plan, ART) {
    if (!renderer && !anlegen()) return;
    P = plan; A = ART;
    if (!sonneInit) { sonneInit = true; var sb = $('g-3d-sonnebox'); if (sb && window.matchMedia) sb.open = !window.matchMedia('(max-width: 640px)').matches; }   /* am Handy zugeklappt, damit das Haus gleich im Bild ist */
    if (etageZahl !== plan.etagen.length) { an.versteckt = {}; etageZahl = plan.etagen.length; }
    if (geh && geh.etage != null && geh.etage !== plan.aktiv) gehenEnde(false);
    ortWaehlen(ort.name);
    bauen();
    if (geh) { geh.etage = plan.aktiv; if (!erlaubt(geh.x, geh.y)) { var sp = startPunkt(plan.etagen[plan.aktiv]); if (sp) { geh.x = sp.x; geh.y = sp.y; } else gehenEnde(false); } }
    leisteBauen(); sonneSetzen(); sichtbarkeit(); dachBoxZeigen();
    fehler(!window.DATEN || !window.DATEN.pvgis ? tr('dreiKeineDaten') : '');
    groesse(); zeichnen();
  }
  function aktivSetzen(an3d) {
    aktiv3d = !!an3d;
    if (!aktiv3d) { gehenEnde(false); tippWeg(); }
    dachBoxZeigen();
  }
  function pause() { gehenEnde(false); tasten = {}; }

  /* Prüfhilfen (nur für tmp/dreid_test.py): lesen im selben Aufruf, in dem gezeichnet wird, weil der Zeichenpuffer danach leer ist */
  function pixelAn(x, y, z) {
    if (!renderer) return null;
    kamera.updateMatrixWorld();
    var p = new THREE.Vector3(x, z, y).project(kamera);
    var w = renderer.domElement.width, h = renderer.domElement.height;
    var px = Math.round((p.x + 1) / 2 * (w - 1)), py = Math.round((p.y + 1) / 2 * (h - 1));
    if (px < 0 || py < 0 || px >= w || py >= h) return null;
    return pixelBei(px, py);
  }
  function pixelBei(px, py) {
    renderer.render(szene, kamera);
    var gl = renderer.getContext(), buf = new Uint8Array(4);
    gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return Array.prototype.slice.call(buf);
  }
  function strahl(von, bis) {
    var a = new THREE.Vector3(von[0], von[2], von[1]), b = new THREE.Vector3(bis[0], bis[2], bis[1]);
    var rc = new THREE.Raycaster(a, b.clone().sub(a).normalize(), 0, a.distanceTo(b)), liste = [];
    wurzel.traverse(function (o) { if (o.isMesh && sichtbarGanz(o) && ['wand', 'decke', 'blatt', 'dach', 'giebel', 'dachplatte'].indexOf(o.userData.kind) >= 0) liste.push(o); });
    wurzel.updateMatrixWorld(true);
    var h = rc.intersectObjects(liste, false)[0];
    return h ? { kind: h.object.userData.kind, abstand: h.distance } : null;
  }
  window.GRUNDRISS3D = {
    zeige: zeige, aktiv: aktivSetzen, pause: pause, ort: ortWaehlen,
    test: {
      pixelWelt: pixelAn,
      pixelEcke: function () { return pixelBei(0, renderer.domElement.height - 1); },
      strahl: strahl,
      stand: function () { return { geht: !!geh, x: geh && geh.x, y: geh && geh.y, yaw: geh && geh.yaw, kamera: kamera ? [kamera.position.x, kamera.position.y, kamera.position.z] : null, sonne: stand, schnitt: an.schnitt }; },
      sichtbar: function () { return gruppenEtage.map(function (g) { return g.visible; }).concat([dachGruppe ? dachGruppe.visible : null]); },
      dach: function () { return dachInfo.map(function (d, i) { var m = dachMeshes[i]; return Object.assign({}, d, { farbe: m ? '#' + m.material.color.getHexString() : null }); }); },
      ebenen: function () { return ebenenZ; },
      kugel: function () { return { c: [kugel.c.x, kugel.c.y, kugel.c.z], r: kugel.r }; },
      bildschirm: function (x, y, z) { kamera.updateMatrixWorld(); var p = new THREE.Vector3(x, z, y).project(kamera), r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; },
      ansicht: function (w, h) { winkel = w; hoehe = h; gedreht = true; zeichnen(); },
      setzeGeh: function (x, y, yaw) { if (geh) { geh.x = x; geh.y = y; geh.yaw = yaw; zeichnen(); } },
      zeichnen: zeichnen, ort: function () { return ort; },
      schatten: function () { return !!(licht.sonne && licht.sonne.castShadow); }
    }
  };
  leisteBedienen();
  /* Farben der Legende und der 3D-Ansicht folgen dem Farbwechsel (hell/dunkel) über grundriss.js → zeige() */
  window.addEventListener('resize', function () { if (aktiv3d) groesse(); });
})();
