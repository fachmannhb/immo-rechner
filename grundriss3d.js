/* 3D-Ansicht für „Grundriss und Einrichtung“ (Three.js r160, global THREE).
   Zeigt die aktive Etage: Grundrissbild als Boden, Räume als Böden mit Wänden entlang der
   Ränder, Möbel als Klötze in echter Größe. Zeichnet nur bei Änderung oder Drehen, ohne
   Dauerschleife (dadurch auch bei „Bewegung reduzieren“ ruhig). Planpunkt (x,y) → 3D (x,0,y). */
(function () {
  'use strict';
  var canvas = document.getElementById('g-3d');
  var ersatz = document.getElementById('g-3d-ersatz');
  if (!canvas) return;
  function kaputt() { ersatz.hidden = false; canvas.hidden = true; }
  if (typeof THREE === 'undefined') { window.GRUNDRISS3D = { zeige: kaputt }; return; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  var renderer = null, szene, kamera, gruppe, licht = {};
  var ziel = new THREE.Vector3(), winkel = 0.7, hoehe = 0.75, abstand = 20, grund = 20;
  var texturen = {}, gedreht = false;

  function anlegen() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { kaputt(); return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    szene = new THREE.Scene();
    kamera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
    licht.himmel = new THREE.HemisphereLight(0xffffff, 0x404040, 1.0);
    licht.sonne = new THREE.DirectionalLight(0xffffff, 1.4);
    licht.sonne.position.set(8, 20, 12);
    szene.add(licht.himmel); szene.add(licht.sonne);
    gruppe = new THREE.Group(); szene.add(gruppe);

    var ziehen = null;
    canvas.addEventListener('pointerdown', function (ev) { ziehen = { x: ev.clientX, y: ev.clientY, w: winkel, h: hoehe }; canvas.setPointerCapture(ev.pointerId); });
    canvas.addEventListener('pointermove', function (ev) {
      if (!ziehen) return;
      winkel = ziehen.w - (ev.clientX - ziehen.x) * 0.008;
      hoehe = Math.max(0.15, Math.min(1.45, ziehen.h + (ev.clientY - ziehen.y) * 0.005));
      gedreht = true;
      zeichnen();
    });
    function los() { ziehen = null; }
    canvas.addEventListener('pointerup', los); canvas.addEventListener('pointercancel', los);
    canvas.addEventListener('wheel', function (ev) {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      abstand = Math.max(grund * 0.3, Math.min(grund * 3, abstand * (ev.deltaY > 0 ? 1.12 : 1 / 1.12)));
      zeichnen();
    }, { passive: false });
    if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(canvas);
    return true;
  }
  function groesse() {
    if (!renderer) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h; kamera.updateProjectionMatrix();
    zeichnen();
  }
  function zeichnen() {
    if (!renderer) return;
    kamera.position.set(
      ziel.x + abstand * Math.cos(hoehe) * Math.sin(winkel),
      ziel.y + abstand * Math.sin(hoehe),
      ziel.z + abstand * Math.cos(hoehe) * Math.cos(winkel));
    kamera.lookAt(ziel);
    renderer.render(szene, kamera);
  }
  function leeren() {
    while (gruppe.children.length) {
      var o = gruppe.children.pop();
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map && !o.material.map.userData.cache) o.material.map.dispose(); o.material.dispose(); }
    }
  }
  function kasten(b, h, t, farbe, x, y, z, drehY, opak) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), new THREE.MeshLambertMaterial({ color: farbe, transparent: opak < 1, opacity: opak }));
    m.position.set(x, y, z); m.rotation.y = drehY || 0;
    gruppe.add(m);
    return m;
  }
  function textur(url) {
    if (texturen[url]) return texturen[url];
    var t = new THREE.TextureLoader().load(url, function () { zeichnen(); });
    t.colorSpace = THREE.SRGBColorSpace; t.userData.cache = true;
    texturen = {}; texturen[url] = t; /* nur das aktuelle Bild behalten */
    return t;
  }

  function zeige(plan, ART) {
    if (!renderer && !anlegen()) return;
    var e = plan.etagen[plan.aktiv] || plan.etagen[0], H = plan.wandhoehe || 2.5;
    var dunkel = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    leeren();
    licht.himmel.intensity = dunkel ? 0.7 : 1.05;
    licht.sonne.intensity = dunkel ? 1.0 : 1.4;
    var farbe = { voll: css('--f2'), balkon: css('--f4'), wintergarten: css('--f1'), zubehoer: css('--f7') };
    var teilFarbe = { wohnung: css('--f2'), monteur: css('--f5'), umbau: css('--f3') };
    var wand = new THREE.Color(dunkel ? css('--linie2') : '#f3efe8');

    var x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    function nimm(x, z) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }

    if (e.bild) {
      var bw = e.bildB * e.mpp, bh = e.bildH * e.mpp;
      var boden = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: textur(e.bild), transparent: true, opacity: 0.9 }));
      boden.rotation.x = -Math.PI / 2; boden.position.set(bw / 2, -0.01, bh / 2);
      gruppe.add(boden);
      nimm(0, 0); nimm(bw, bh);
    }
    e.raeume.forEach(function (r) {
      var form = new THREE.Shape();
      r.punkte.forEach(function (p, i) { if (i) form.lineTo(p[0], -p[1]); else form.moveTo(p[0], -p[1]); nimm(p[0], p[1]); });
      var b = new THREE.Mesh(new THREE.ShapeGeometry(form), new THREE.MeshLambertMaterial({ color: farbe[r.art] || farbe.voll, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      b.rotation.x = -Math.PI / 2; b.position.y = 0.01;
      gruppe.add(b);
      var hoch = r.art === 'balkon' ? 1.0 : H; /* Balkon: Brüstung */
      r.punkte.forEach(function (p, i) {
        var q = r.punkte[(i + 1) % r.punkte.length], dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
        if (L < 0.01) return;
        /* leicht durchscheinend, damit Möbel hinter Wänden sichtbar bleiben */
        var m = kasten(L + 0.1, hoch, 0.1, wand, (p[0] + q[0]) / 2, hoch / 2, (p[1] + q[1]) / 2, -Math.atan2(dz, dx), 0.55);
        m.material.depthWrite = false; m.renderOrder = 2;
      });
    });
    e.teile.forEach(function (t) {
      var a = ART[t.art]; if (!a) return;
      var drehY = -t.dreh * Math.PI / 180, h = (a.hoehe || 80) / 100, y = h / 2, opak = 1;
      var f = new THREE.Color(teilFarbe[a.gruppe] || teilFarbe.wohnung);
      if (a.form === 'wand') { h = H; y = H / 2; }
      if (a.form === 'wandweg') { h = H; y = H / 2; f = new THREE.Color(css('--schlecht')); opak = 0.35; }
      if (a.form === 'fenster') { y = 0.9 + h / 2; f = new THREE.Color(css('--c2')); opak = 0.55; }
      if (a.form === 'flaeche') { h = 0.04; y = 0.03; opak = 0.6; }
      kasten(t.w, h, t.d, f, t.x, y, t.y, drehY, opak);
      nimm(t.x - t.w / 2, t.y - t.w / 2); nimm(t.x + t.w / 2, t.y + t.w / 2);
    });
    if (!isFinite(x0)) { x0 = 0; z0 = 0; x1 = 10; z1 = 8; }
    ziel.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    grund = Math.max(6, Math.hypot(x1 - x0, z1 - z0));
    abstand = grund * 1.55;
    if (!gedreht) { hoehe = 1.0; winkel = 0.35; } /* schräg von oben, von derselben Seite wie der Plan */
    var etikett = document.getElementById('g-3d-etikett');
    if (etikett) etikett.textContent = e.name + (e.raeume.length ? '' : ' (noch keine Räume)');
    groesse();
    zeichnen();
  }

  window.GRUNDRISS3D = { zeige: zeige };
})();
