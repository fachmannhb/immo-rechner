/* 3D-Balkenfeld der Merkliste: Zeilen = Objekte, Spalten = Kennzahlen (Three.js r160, global THREE).
   Höhe = Wert geteilt durch den größten Betrag dieser Kennzahl; negative Werte zeigen nach unten.
   Echte Werte im Hover-Hinweis und in der Tabelle darunter. */
(function () {
  'use strict';
  var box = document.getElementById('merk3d-box');
  var canvas = document.getElementById('merk3d');
  if (!box || !canvas) { window.MERK3D = { zeichne: function () {} }; return; }
  if (typeof THREE === 'undefined') { window.MERK3D = { zeichne: function () {} }; box.hidden = true; return; }

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function dunkel() { return getComputedStyle(document.documentElement).colorScheme === 'dark'; }
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { window.MERK3D = { zeichne: function () {} }; box.hidden = true; return; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var szene = new THREE.Scene();
  var kamera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  szene.add(new THREE.HemisphereLight(0xffffff, 0x445555, 1.0));
  var licht = new THREE.DirectionalLight(0xffffff, 1.3);
  licht.position.set(5, 12, 8);
  szene.add(licht);
  var gruppe = new THREE.Group();
  szene.add(gruppe);

  var winkel = -0.62, hoehe = 0.5, abstand = 16, ziel = new THREE.Vector3(0, 0.2, 0);
  var balken = [];
  var raycaster = new THREE.Raycaster(), maus = new THREE.Vector2();
  var letzteDaten = null;

  function textSprite(text, farbe, groesse) {
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    var px = 44;
    ctx.font = '600 ' + px + 'px "Source Sans 3", "Segoe UI", sans-serif';
    var w = Math.ceil(ctx.measureText(text).width) + 20;
    c.width = w; c.height = px + 20;
    ctx.font = '600 ' + px + 'px "Source Sans 3", "Segoe UI", sans-serif';
    ctx.fillStyle = farbe;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, c.height / 2);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    var g = groesse || 0.42;
    sp.scale.set(g * w / c.height, g, 1);
    return sp;
  }
  function leeren() {
    while (gruppe.children.length) {
      var o = gruppe.children.pop();
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    }
    balken = [];
  }

  /* daten: { kennzahlen: [{name, farbVar, format}], objekte: [{titel, werte: [zahl|null,...]}] } */
  function zeichne(daten) {
    letzteDaten = daten;
    if (!daten || !daten.objekte.length) { box.hidden = true; return; }
    box.hidden = false;
    leeren();
    var K = daten.kennzahlen, O = daten.objekte.slice(0, 15);
    var abstandX = 1.5, abstandZ = 1.25, breite = 0.62, hMax = 3.2;
    var x0 = -(K.length - 1) * abstandX / 2, z0 = -(O.length - 1) * abstandZ / 2;
    var textFarbe = css('--text'), leise = css('--leise');

    var bodenGeo = new THREE.PlaneGeometry(K.length * abstandX + 1.6, O.length * abstandZ + 1.4);
    var boden = new THREE.Mesh(bodenGeo, new THREE.MeshStandardMaterial({ color: css('--karte2'), transparent: true, opacity: 0.55, depthWrite: false }));
    boden.rotation.x = -Math.PI / 2;
    gruppe.add(boden);
    var raster = new THREE.GridHelper(Math.max(K.length * abstandX, O.length * abstandZ) + 2, Math.max(K.length, O.length) * 2 + 2, css('--linie2'), css('--linie'));
    raster.position.y = 0.002;
    raster.material.transparent = true; raster.material.opacity = 0.5;
    gruppe.add(raster);

    K.forEach(function (k, ki) {
      var max = 0;
      O.forEach(function (o) { var w = o.werte[ki]; if (w !== null && isFinite(w)) max = Math.max(max, Math.abs(w)); });
      var farbe = new THREE.Color(css(k.farbVar));
      var schlecht = new THREE.Color(css('--schlecht'));
      O.forEach(function (o, oi) {
        var w = o.werte[ki];
        if (w === null || !isFinite(w) || max === 0) return;
        var h = Math.max(0.04, Math.abs(w) / max * hMax);
        var geo = new THREE.BoxGeometry(breite, h, breite * 0.8);
        var neg = w < 0;
        var m = new THREE.MeshStandardMaterial({ color: neg ? schlecht : farbe, roughness: 0.45, metalness: 0.1, emissive: neg ? schlecht : farbe, emissiveIntensity: dunkel() ? 0.22 : 0.06 });
        var b = new THREE.Mesh(geo, m);
        b.position.set(x0 + ki * abstandX, neg ? -h / 2 : h / 2, z0 + oi * abstandZ);
        b.userData = { tip: '<b>' + o.titel.replace(/</g, '&lt;') + '</b><br>' + k.name + ': ' + k.format(w) };
        gruppe.add(b);
        balken.push(b);
        var kante = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: css('--karte'), transparent: true, opacity: 0.5 }));
        kante.position.copy(b.position);
        gruppe.add(kante);
      });
      var s = textSprite(k.name, textFarbe, 0.46);
      s.position.set(x0 + ki * abstandX, 0.3, z0 + O.length * abstandZ + 0.1);
      gruppe.add(s);
    });
    O.forEach(function (o, oi) {
      var t = o.titel.length > 22 ? o.titel.slice(0, 21) + '…' : o.titel;
      var s = textSprite(t, textFarbe, 0.42);
      s.center.set(1, 0.5);
      s.position.set(x0 - 0.75, 0.35, z0 + oi * abstandZ);
      gruppe.add(s);
    });
    abstand = 5.5 + Math.max(K.length * abstandX, O.length * abstandZ) * 1.05;
    groesse();
  }

  function kameraSetzen() {
    kamera.position.set(ziel.x + abstand * Math.cos(hoehe) * Math.sin(winkel), ziel.y + abstand * Math.sin(hoehe), ziel.z + abstand * Math.cos(hoehe) * Math.cos(winkel));
    kamera.lookAt(ziel);
  }
  function render() { kameraSetzen(); renderer.render(szene, kamera); }
  function groesse() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    render();
  }

  var ziehen = null;
  canvas.addEventListener('pointerdown', function (ev) { ziehen = { x: ev.clientX, y: ev.clientY, w: winkel, h: hoehe }; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointerup', function () { ziehen = null; });
  canvas.addEventListener('pointercancel', function () { ziehen = null; });
  canvas.addEventListener('pointermove', function (ev) {
    if (ziehen) {
      winkel = ziehen.w - (ev.clientX - ziehen.x) * 0.008;
      hoehe = Math.max(0.12, Math.min(1.25, ziehen.h + (ev.clientY - ziehen.y) * 0.005));
      render();
      return;
    }
    var r = canvas.getBoundingClientRect();
    maus.x = (ev.clientX - r.left) / r.width * 2 - 1;
    maus.y = -(ev.clientY - r.top) / r.height * 2 + 1;
    raycaster.setFromCamera(maus, kamera);
    var treffer = raycaster.intersectObjects(balken)[0];
    var tip = document.getElementById('tip');
    if (treffer && tip) {
      tip.innerHTML = treffer.object.userData.tip;
      tip.hidden = false;
      tip.style.left = Math.min(window.innerWidth - 240, ev.clientX + 14) + 'px';
      tip.style.top = (ev.clientY + 14) + 'px';
    } else if (tip) tip.hidden = true;
  });
  canvas.addEventListener('pointerleave', function () { var t = document.getElementById('tip'); if (t) t.hidden = true; });
  if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(canvas);
  window.addEventListener('themagewechselt', function () { if (letzteDaten) zeichne(letzteDaten); });

  window.MERK3D = { zeichne: zeichne, groesse: groesse };
})();
