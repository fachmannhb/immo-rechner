/* 3D-Modell eines Mehrfamilienhauses für den Kopf der Übersicht (Three.js r160, global THREE).
   Läuft nur, solange die Szene sichtbar ist; bei reduzierter Bewegung kein Selbstdrehen.
   Farben aus den CSS-Variablen, beim Designwechsel neu gesetzt. */
(function () {
  'use strict';
  var canvas = document.getElementById('haus3d');
  var ersatz = document.getElementById('haus-ersatz');
  if (!canvas) return;
  if (typeof THREE === 'undefined') { ersatz.hidden = false; return; }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    ersatz.hidden = false; canvas.hidden = true; return;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var szene = new THREE.Scene();
  var kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  var ziel = new THREE.Vector3(0, 2.1, 0);

  /* Licht */
  var himmel = new THREE.HemisphereLight(0xffffff, 0x404040, 0.9);
  szene.add(himmel);
  var sonne = new THREE.DirectionalLight(0xffffff, 1.6);
  sonne.position.set(6, 10, 7);
  sonne.castShadow = true;
  sonne.shadow.mapSize.set(1024, 1024);
  sonne.shadow.camera.left = -8; sonne.shadow.camera.right = 8; sonne.shadow.camera.top = 8; sonne.shadow.camera.bottom = -8;
  sonne.shadow.radius = 4;
  szene.add(sonne);
  var schein = new THREE.PointLight(0xffffff, 6, 9, 2);
  schein.position.set(0, 1.4, 2.6);
  szene.add(schein);

  /* Materialien (Farben werden in faerben() gesetzt) */
  var mat = {
    boden: new THREE.MeshStandardMaterial({ roughness: 1 }),
    wand: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
    dach: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
    nachbar: new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true, opacity: 0.85 }),
    kante: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 }),
    kanteLeise: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 }),
    fenster: new THREE.MeshBasicMaterial({ toneMapped: false }),
    tuer: new THREE.MeshStandardMaterial({ roughness: 0.5 }),
    baum: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    stamm: new THREE.MeshStandardMaterial({ roughness: 1 }),
    ring: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6, side: THREE.DoubleSide, toneMapped: false })
  };

  function kanten(geo, m) { return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), m); }

  /* Boden mit Raster und Grundstückslinie */
  var boden = new THREE.Mesh(new THREE.CircleGeometry(9, 64), mat.boden);
  boden.rotation.x = -Math.PI / 2;
  boden.receiveShadow = true;
  szene.add(boden);
  var raster = new THREE.GridHelper(18, 36);
  raster.material.transparent = true;
  raster.material.opacity = 0.35;
  raster.position.y = 0.002;
  szene.add(raster);
  var ring = new THREE.Mesh(new THREE.RingGeometry(3.95, 4.02, 4, 1), mat.ring);
  ring.rotation.x = -Math.PI / 2;
  ring.rotation.z = Math.PI / 4;
  ring.scale.set(1.25, 1, 1);
  ring.position.y = 0.01;
  szene.add(ring);

  /* Haus mit Satteldach */
  function haus(breite, hoehe, tiefe, dachHoehe, wandMat, dachMat, kantenMat) {
    var g = new THREE.Group();
    var korpusGeo = new THREE.BoxGeometry(breite, hoehe, tiefe);
    var korpus = new THREE.Mesh(korpusGeo, wandMat);
    korpus.position.y = hoehe / 2;
    korpus.castShadow = true; korpus.receiveShadow = true;
    g.add(korpus);
    var k = kanten(korpusGeo, kantenMat); k.position.copy(korpus.position); g.add(k);
    var form = new THREE.Shape();
    var ueber = 0.18;
    form.moveTo(-breite / 2 - ueber, 0);
    form.lineTo(breite / 2 + ueber, 0);
    form.lineTo(0, dachHoehe);
    form.lineTo(-breite / 2 - ueber, 0);
    var dachGeo = new THREE.ExtrudeGeometry(form, { depth: tiefe + ueber * 2, bevelEnabled: false });
    dachGeo.translate(0, 0, -(tiefe + ueber * 2) / 2);
    var dach = new THREE.Mesh(dachGeo, dachMat);
    dach.position.y = hoehe;
    dach.castShadow = true;
    g.add(dach);
    var kd = kanten(dachGeo, kantenMat); kd.position.copy(dach.position); g.add(kd);
    return g;
  }

  var B = 4.4, H = 3.6, T = 2.8, GESCHOSSE = 4;
  var hauptHaus = haus(B, H, T, 1.35, mat.wand, mat.dach, mat.kante);
  szene.add(hauptHaus);

  /* Fenster als Instanzen: vorne/hinten je 5 Spalten, Seiten je 3 Spalten */
  var fensterPos = [];
  var fh = H / GESCHOSSE;
  for (var e = 0; e < GESCHOSSE; e++) {
    var y = e * fh + fh * 0.55;
    for (var s = 0; s < 5; s++) {
      var x = -B / 2 + B / 5 * (s + 0.5);
      if (!(e === 0 && s === 2)) fensterPos.push({ x: x, y: y, z: T / 2 + 0.011, ry: 0 });
      fensterPos.push({ x: x, y: y, z: -T / 2 - 0.011, ry: Math.PI });
    }
    for (var t = 0; t < 3; t++) {
      var z = -T / 2 + T / 3 * (t + 0.5);
      fensterPos.push({ x: B / 2 + 0.011, y: y, z: z, ry: Math.PI / 2 });
      fensterPos.push({ x: -B / 2 - 0.011, y: y, z: z, ry: -Math.PI / 2 });
    }
  }
  var fenster = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.46, 0.52), mat.fenster, fensterPos.length);
  var hilf = new THREE.Object3D();
  var an = fensterPos.map(function (_, i) { return ((i * 7919) % 10) < 6; }); /* feste Anfangsverteilung */
  fensterPos.forEach(function (p, i) {
    hilf.position.set(p.x, p.y, p.z);
    hilf.rotation.set(0, p.ry, 0);
    hilf.updateMatrix();
    fenster.setMatrixAt(i, hilf.matrix);
  });
  szene.add(fenster);

  var tuerGeo = new THREE.BoxGeometry(0.62, 0.86, 0.06);
  var tuer = new THREE.Mesh(tuerGeo, mat.tuer);
  tuer.position.set(0, 0.43, T / 2 + 0.03);
  szene.add(tuer);

  /* Nachbarhäuser und Bäume */
  var n1 = haus(2.4, 1.5, 2.0, 0.8, mat.nachbar, mat.nachbar, mat.kanteLeise);
  n1.position.set(-6.2, 0, -3.4); n1.rotation.y = 0.25; szene.add(n1);
  var n2 = haus(2.0, 1.8, 1.8, 0.7, mat.nachbar, mat.nachbar, mat.kanteLeise);
  n2.position.set(6.0, 0, -3.8); n2.rotation.y = -0.3; szene.add(n2);
  [[-3.6, 2.6, 1], [3.7, 2.2, 0.85], [-2.6, -3.6, 0.9], [2.4, -3.9, 1.1]].forEach(function (b) {
    var g = new THREE.Group();
    var stamm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 8), mat.stamm);
    stamm.position.y = 0.3; g.add(stamm);
    var krone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 10), mat.baum);
    krone.position.y = 1.25; krone.castShadow = true; g.add(krone);
    g.position.set(b[0], 0, b[1]); g.scale.setScalar(b[2]);
    szene.add(g);
  });

  /* Farben aus dem Design */
  var fensterAn = new THREE.Color(), fensterAus = new THREE.Color();
  function fensterFaerben() {
    for (var i = 0; i < fensterPos.length; i++) fenster.setColorAt(i, an[i] ? fensterAn : fensterAus);
    fenster.instanceColor.needsUpdate = true;
  }
  function faerben() {
    var dunkel = css('color-scheme').indexOf('dark') !== -1 || getComputedStyle(document.documentElement).colorScheme === 'dark';
    mat.boden.color.set(css('--karte'));
    mat.wand.color.set(dunkel ? css('--karte2') : '#f4f7f7');
    mat.dach.color.set(css('--c1')).multiplyScalar(dunkel ? 0.55 : 0.8);
    mat.nachbar.color.set(css('--linie2'));
    mat.kante.color.set(css('--akzent-text'));
    mat.kanteLeise.color.set(css('--leise'));
    mat.tuer.color.set(css('--c2'));
    mat.baum.color.set(css('--c1')).multiplyScalar(dunkel ? 0.7 : 0.9);
    mat.stamm.color.set(css('--leise'));
    mat.ring.color.set(css('--akzent'));
    raster.material.color = new THREE.Color(css('--linie2'));
    raster.material.vertexColors = false;
    raster.material.needsUpdate = true;
    fensterAn.set(css('--c2')).multiplyScalar(dunkel ? 1.6 : 1.15);
    fensterAus.set(dunkel ? css('--linie') : css('--linie2'));
    fensterFaerben();
    himmel.intensity = dunkel ? 0.55 : 1.0;
    sonne.intensity = dunkel ? 0.9 : 1.7;
    schein.color.set(css('--c2'));
    schein.intensity = dunkel ? 7 : 2;
    zeichnen();
  }

  /* Kamera und Drehen */
  var winkel = 0.65, hoehe = 0.42, abstand = 20;
  var ziehen = null, zuletztGezogen = 0;
  function kameraSetzen() {
    kamera.position.set(
      ziel.x + abstand * Math.cos(hoehe) * Math.sin(winkel),
      ziel.y + abstand * Math.sin(hoehe),
      ziel.z + abstand * Math.cos(hoehe) * Math.cos(winkel)
    );
    kamera.lookAt(ziel);
  }
  canvas.addEventListener('pointerdown', function (ev) {
    ziehen = { x: ev.clientX, y: ev.clientY, w: winkel, h: hoehe };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', function (ev) {
    if (!ziehen) return;
    winkel = ziehen.w - (ev.clientX - ziehen.x) * 0.008;
    hoehe = Math.max(0.08, Math.min(1.1, ziehen.h + (ev.clientY - ziehen.y) * 0.005));
    zuletztGezogen = performance.now();
    if (!laeuft) zeichnen();
  });
  function loslassen() { ziehen = null; zuletztGezogen = performance.now(); }
  canvas.addEventListener('pointerup', loslassen);
  canvas.addEventListener('pointercancel', loslassen);

  function groesse() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    abstand = w / h < 1.05 ? 23 : 20;
    kamera.updateProjectionMatrix();
    zeichnen();
  }
  function zeichnen() { kameraSetzen(); renderer.render(szene, kamera); }

  /* Schleife nur bei Sichtbarkeit */
  var sichtbar = false, laeuft = false, letzterWechsel = 0, t0 = performance.now();
  function schleife(jetzt) {
    if (!sichtbar || document.hidden) { laeuft = false; return; }
    laeuft = true;
    if (!ruhig && !ziehen && jetzt - zuletztGezogen > 2500) winkel += 0.0022;
    if (!ruhig) {
      mat.ring.opacity = 0.45 + 0.25 * Math.sin((jetzt - t0) / 900);
      if (jetzt - letzterWechsel > 1800) {
        var i = Math.floor(Math.random() * an.length);
        an[i] = !an[i];
        fensterFaerben();
        letzterWechsel = jetzt;
      }
    }
    zeichnen();
    requestAnimationFrame(schleife);
  }
  function starten() { if (!laeuft && sichtbar && !document.hidden) requestAnimationFrame(schleife); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (eintraege) {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar) { groesse(); starten(); }
    }).observe(canvas);
  } else { sichtbar = true; }
  document.addEventListener('visibilitychange', starten);
  if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(canvas);
  window.addEventListener('themagewechselt', faerben);

  var etikett = document.getElementById('haus-etikett');
  if (etikett) etikett.textContent = 'Beispielmodell';
  faerben();
  groesse();
  starten();
})();
