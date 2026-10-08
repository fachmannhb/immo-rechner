/* 3D-Ansicht der Deutschlandkarte (Three.js r160, global THREE): jeder Landkreis als Säule in seiner Form,
   Höhe = Wert der gewählten Ebene (0–100), Farbe = Ampel. Zeichnet nur bei Änderung oder Drehen (ruhig).
   Kartenpunkt (x,y) in km → 3D (x, 0, y). Löcher (umschlossene kreisfreie Städte) werden als Löcher gebaut. */
(function () {
  'use strict';
  var canvas = document.getElementById('k-3d'), ersatz = document.getElementById('k-3d-ersatz');
  if (!canvas) return;
  function kaputt() { ersatz.hidden = false; canvas.hidden = true; }
  if (typeof THREE === 'undefined') { window.KARTE3D = { zeige: kaputt }; return; }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  var renderer = null, szene, kamera, gruppe, licht = {}, formen = null;
  var ziel = new THREE.Vector3(326, 0, 450), winkel = 0, hoehe = 0.95, abstand = 1500;

  function anlegen() {
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch (e) { kaputt(); return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    szene = new THREE.Scene();
    kamera = new THREE.PerspectiveCamera(35, 1, 1, 6000);
    licht.himmel = new THREE.HemisphereLight(0xffffff, 0x404040, 1.0);
    licht.sonne = new THREE.DirectionalLight(0xffffff, 1.3); licht.sonne.position.set(-300, 900, 600);
    szene.add(licht.himmel); szene.add(licht.sonne);
    gruppe = new THREE.Group(); szene.add(gruppe);
    var z = null;
    canvas.addEventListener('pointerdown', function (ev) { z = { x: ev.clientX, y: ev.clientY, w: winkel, h: hoehe }; canvas.setPointerCapture(ev.pointerId); });
    canvas.addEventListener('pointermove', function (ev) {
      if (!z) return;
      winkel = z.w - (ev.clientX - z.x) * 0.006;
      hoehe = Math.max(0.25, Math.min(1.5, z.h + (ev.clientY - z.y) * 0.004));
      zeichnen();
    });
    canvas.addEventListener('pointerup', function () { z = null; });
    canvas.addEventListener('pointercancel', function () { z = null; });
    canvas.addEventListener('wheel', function (ev) {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      abstand = Math.max(250, Math.min(2500, abstand * (ev.deltaY > 0 ? 1.12 : 1 / 1.12))); zeichnen();
    }, { passive: false });
    if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(canvas);
    return true;
  }
  function groesse() {
    if (!renderer) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix(); zeichnen();
  }
  function zeichnen() {
    if (!renderer) return;
    kamera.position.set(ziel.x + abstand * Math.cos(hoehe) * Math.sin(winkel), abstand * Math.sin(hoehe), ziel.z + abstand * Math.cos(hoehe) * Math.cos(winkel));
    kamera.lookAt(ziel);
    renderer.render(szene, kamera);
  }

  /* Pfad „M x y x y …Z“ → Ringe; Außenringe und Löcher nach Umlaufsinn trennen */
  function ringe(pfad) {
    return pfad.split('Z').map(function (t) {
      var z = t.replace('M', '').trim().split(/\s+/).map(Number), r = [];
      for (var i = 0; i + 1 < z.length; i += 2) r.push([z[i], z[i + 1]]);
      return r;
    }).filter(function (r) { return r.length >= 3; });
  }
  function flaecheMitVorzeichen(r) { var s = 0; for (var i = 0; i < r.length; i++) { var a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function drin(x, y, r) {
    var d = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      if (((r[i][1] > y) !== (r[j][1] > y)) && (x < (r[j][0] - r[i][0]) * (y - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0])) d = !d;
    }
    return d;
  }
  function formenBauen(kreise) {
    return kreise.map(function (k) {
      var rs = ringe(k.pfad);
      if (!rs.length) return [];
      var groesster = rs.reduce(function (a, b) { return Math.abs(flaecheMitVorzeichen(b)) > Math.abs(flaecheMitVorzeichen(a)) ? b : a; });
      var sinn = Math.sign(flaecheMitVorzeichen(groesster));
      var aussen = rs.filter(function (r) { return Math.sign(flaecheMitVorzeichen(r)) === sinn; });
      var loecher = rs.filter(function (r) { return Math.sign(flaecheMitVorzeichen(r)) !== sinn; });
      return aussen.map(function (r) {
        var f = new THREE.Shape(r.map(function (p) { return new THREE.Vector2(p[0], -p[1]); }));
        loecher.filter(function (l) { return drin(l[0][0], l[0][1], r); }).forEach(function (l) {
          f.holes.push(new THREE.Path(l.map(function (p) { return new THREE.Vector2(p[0], -p[1]); })));
        });
        return f;
      });
    });
  }
  function leeren() {
    while (gruppe.children.length) { var o = gruppe.children.pop(); o.geometry.dispose(); o.material.dispose(); }
  }

  function zeige(kreise, werte, ampeln) {
    if (!renderer && !anlegen()) return;
    if (!formen) formen = formenBauen(kreise);
    leeren();
    var dunkel = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    licht.himmel.intensity = dunkel ? 0.75 : 1.05;
    var farbe = { gut: css('--gut'), warn: css('--warn'), schlecht: css('--schlecht'), leer: css('--linie2') };
    kreise.forEach(function (k, i) {
      var h = 2 + (werte[i] != null ? werte[i] : 0) * 0.6;
      /* Ampelfarben aus der Palette, im hellen Design etwas aufgehellt, damit die Seiten nicht zu dunkel wirken */
      var c = new THREE.Color(farbe[ampeln[i] || 'leer']).lerp(new THREE.Color(0xffffff), dunkel ? 0.05 : 0.15);
      var mat = new THREE.MeshLambertMaterial({ color: c });
      formen[i].forEach(function (f) {
        var g = new THREE.ExtrudeGeometry(f, { depth: h, bevelEnabled: false });
        var m = new THREE.Mesh(g, mat.clone());
        m.rotation.x = -Math.PI / 2; /* Form liegt in x/-y; nach der Drehung zeigt die Tiefe nach oben */
        gruppe.add(m);
      });
      mat.dispose();
    });
    groesse(); zeichnen();
  }
  window.KARTE3D = { zeige: zeige };
})();
