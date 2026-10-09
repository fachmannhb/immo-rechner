/* Flache Zeichnungen je Bereich (Welle 1, Variante A „ruhig und hell“, 09.10.2026).
   Eigene Zeichnungen, keine Fremdbilder, keine Lizenzen. Farben nur über Variablen (--i1 bis --i6, aus der Palette),
   damit hell und dunkel passen. Rein dekorativ: die Bilder tragen kein Wissen, darum aria-hidden.
   app.js baut daraus einen unsichtbaren Bildvorrat (<symbol id="il-NAME">) und setzt ihn in jedes <svg data-bild="NAME">. */
window.DATEN = window.DATEN || {};
(function () {
  var GRUND = '<circle cx="260" cy="190" r="170" fill="var(--i3)"/><circle cx="78" cy="78" r="16" fill="var(--i4)"/><circle cx="452" cy="96" r="10" fill="var(--i4)"/>' +
    '<rect x="30" y="306" width="460" height="14" rx="7" fill="var(--i4)"/>';
  /* Haus aus der Startzeichnung; Ursprung wie dort, Fußpunkt bei y=308; s = Maßstab, (x, y) = Fußpunkt Mitte */
  var HAUS = '<rect x="260" y="104" width="24" height="46" fill="var(--i1)"/>' +
    '<rect x="116" y="176" width="190" height="132" fill="var(--i5)" stroke="var(--i1)" stroke-width="5"/>' +
    '<polygon points="98,182 211,92 324,182" fill="var(--i1)"/>' +
    '<rect x="192" y="236" width="40" height="72" rx="4" fill="var(--i2)"/><circle cx="224" cy="274" r="3.5" fill="var(--i5)"/>' +
    '<rect x="136" y="200" width="42" height="42" rx="3" fill="var(--i4)" stroke="var(--i1)" stroke-width="4"/>' +
    '<rect x="246" y="200" width="42" height="42" rx="3" fill="var(--i4)" stroke="var(--i1)" stroke-width="4"/>' +
    '<path d="M157 200v42M136 221h42M267 200v42M246 221h42" stroke="var(--i1)" stroke-width="3"/>';
  function haus(x, y, s) { return '<g transform="translate(' + (x - 211 * s) + ' ' + (y - 308 * s) + ') scale(' + s + ')">' + HAUS + '</g>'; }
  var EURO = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="var(--i1)"/><text x="' + x + '" y="' + (y + r * .38) + '" text-anchor="middle" font-size="' + (r * 1.15) + '" font-weight="800" fill="var(--i5)" font-family="Manrope, Segoe UI, Arial, sans-serif">€</text>'; };
  function taste(x, y, f) { return '<rect x="' + x + '" y="' + y + '" width="30" height="24" rx="6" fill="' + (f || 'var(--i3)') + '"/>'; }
  var RECHNER = '<rect x="338" y="146" width="134" height="164" rx="18" fill="var(--i2)"/><rect x="352" y="160" width="106" height="36" rx="8" fill="var(--i5)"/>' +
    '<path d="M366 182h40" stroke="var(--i2)" stroke-width="5" stroke-linecap="round"/>' +
    taste(352, 210) + taste(390, 210) + taste(428, 210) + taste(352, 242) + taste(390, 242) + taste(428, 242, 'var(--i1)') +
    '<rect x="352" y="274" width="68" height="24" rx="6" fill="var(--i3)"/>' + taste(428, 274, 'var(--i1)');

  var Z = {};
  Z.uebersicht = GRUND + '<rect x="62" y="262" width="12" height="46" fill="var(--i2)"/><circle cx="68" cy="236" r="38" fill="var(--i4)" stroke="var(--i2)" stroke-width="4"/>' +
    HAUS + RECHNER + EURO(412, 118, 22);
  Z.rechner = GRUND + haus(150, 308, .62) + RECHNER + EURO(412, 118, 22) +
    EURO(290, 266, 26) + EURO(246, 282, 20);
  Z.karte = GRUND +
    '<polygon points="88,112 208,90 312,122 432,96 432,272 312,300 208,270 88,296" fill="var(--i5)" stroke="var(--i1)" stroke-width="6" stroke-linejoin="round"/>' +
    '<polygon points="104,138 192,122 192,232 104,244" fill="var(--i4)"/><polygon points="226,150 296,160 296,250 226,240" fill="var(--i3)"/><polygon points="328,142 416,126 416,240 328,256" fill="var(--i4)"/>' +
    '<path d="M208 90v180M312 122v178" stroke="var(--i1)" stroke-width="4" opacity=".45"/>' +
    '<path d="M118 258Q180 196 240 220T404 188" fill="none" stroke="var(--i2)" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round"/>' +
    '<path d="M330 196C300 160 288 140 288 116a42 42 0 0 1 84 0c0 24-12 44-42 80z" fill="var(--i1)"/><circle cx="330" cy="116" r="15" fill="var(--i5)"/>';
  Z.suche = GRUND + haus(205, 308, .85) +
    '<circle cx="352" cy="214" r="72" fill="var(--i4)" fill-opacity=".55" stroke="var(--i2)" stroke-width="13"/><path d="M404 268l50 50" stroke="var(--i2)" stroke-width="20" stroke-linecap="round"/>' +
    '<path d="M318 214l34-30 34 30M326 212v30h52v-30" fill="none" stroke="var(--i1)" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>';
  Z.merkliste = GRUND + [54, 138, 222].map(function (y, i) {
    return '<rect x="110" y="' + y + '" width="300" height="74" rx="16" fill="var(--i5)" stroke="var(--i4)" stroke-width="4"/>' +
      '<rect x="126" y="' + (y + 12) + '" width="50" height="50" rx="10" fill="' + (i === 0 ? 'var(--i3)' : 'var(--i4)') + '"/>' +
      '<path d="M138 ' + (y + 40) + 'l14-14 14 14M141 ' + (y + 38) + 'v16h22v-16" fill="none" stroke="var(--i1)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<rect x="190" y="' + (y + 18) + '" width="130" height="12" rx="6" fill="var(--i4)"/><rect x="190" y="' + (y + 40) + '" width="90" height="12" rx="6" fill="var(--i3)"/>' +
      '<circle cx="378" cy="' + (y + 37) + '" r="14" fill="' + (i === 1 ? 'var(--i2)' : 'var(--i1)') + '"/>';
  }).join('') + '<path d="M376 36v62l-18-14-18 14V36z" fill="var(--i1)"/>';
  Z.wert = GRUND +
    '<rect x="252" y="112" width="16" height="182" fill="var(--i1)"/><rect x="196" y="288" width="128" height="18" rx="9" fill="var(--i1)"/>' +
    '<rect x="104" y="106" width="312" height="14" rx="7" fill="var(--i1)"/><circle cx="260" cy="113" r="18" fill="var(--i5)" stroke="var(--i1)" stroke-width="6"/>' +
    '<path d="M122 120L84 214M122 120L160 214M398 120L360 214M398 120L436 214" stroke="var(--i1)" stroke-width="4" fill="none"/>' +
    '<path d="M64 214h116a58 38 0 0 1-116 0z" fill="var(--i2)"/><path d="M340 214h116a58 38 0 0 1-116 0z" fill="var(--i2)"/>' +
    haus(122, 214, .42) + EURO(380, 190, 22) + EURO(418, 196, 18) + '<ellipse cx="400" cy="210" rx="30" ry="6" fill="var(--i1)" opacity=".25"/>';
  Z.umbau = GRUND + '<path d="M96 308V170M96 170h54M96 230h54" stroke="var(--i4)" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    haus(230, 308, 1) +
    '<g transform="rotate(32 392 224)"><rect x="384" y="132" width="16" height="170" rx="7" fill="var(--i2)"/><rect x="350" y="114" width="86" height="40" rx="9" fill="var(--i1)"/><rect x="420" y="122" width="26" height="24" rx="5" fill="var(--i1)"/></g>' +
    '<circle cx="440" cy="270" r="5" fill="var(--i1)"/><circle cx="456" cy="288" r="4" fill="var(--i2)"/>';
  Z.grundriss = GRUND +
    '<rect x="116" y="96" width="288" height="196" rx="6" fill="var(--i5)" stroke="var(--i1)" stroke-width="9"/>' +
    '<rect x="124" y="104" width="130" height="86" fill="var(--i3)"/><rect x="266" y="104" width="130" height="94" fill="var(--i4)"/><rect x="124" y="200" width="84" height="84" fill="var(--i4)"/><rect x="220" y="210" width="176" height="74" fill="var(--i3)"/>' +
    '<path d="M260 100V170M260 214V288M120 195H180M214 195H400M214 195V240" stroke="var(--i1)" stroke-width="7" fill="none"/>' +
    '<path d="M260 170a22 22 0 0 1 22 22" fill="none" stroke="var(--i2)" stroke-width="4"/>' +
    '<path d="M116 66H404M116 56v20M404 56v20" stroke="var(--i2)" stroke-width="5" stroke-linecap="round"/><rect x="226" y="52" width="68" height="28" rx="8" fill="var(--i3)"/>' +
    '';
  Z.pruefliste = GRUND +
    '<rect x="150" y="62" width="220" height="244" rx="18" fill="var(--i5)" stroke="var(--i1)" stroke-width="7"/><rect x="214" y="44" width="92" height="36" rx="10" fill="var(--i1)"/>' +
    [112, 160, 208, 256].map(function (y, i) {
      return '<rect x="176" y="' + y + '" width="28" height="28" rx="7" fill="' + (i < 3 ? 'var(--i3)' : 'var(--i5)') + '" stroke="var(--i1)" stroke-width="4"/>' +
        (i < 3 ? '<path d="M182 ' + (y + 15) + 'l7 7 12-14" fill="none" stroke="var(--i2)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
        '<rect x="220" y="' + (y + 8) + '" width="' + (i === 3 ? 90 : 118) + '" height="12" rx="6" fill="var(--i4)"/>';
    }).join('') +
    '<g transform="rotate(38 410 230)"><rect x="402" y="120" width="16" height="140" rx="4" fill="var(--i2)"/><polygon points="402,260 418,260 410,284" fill="var(--i1)"/></g>';
  Z.recht = GRUND +
    '<path d="M260 118C222 98 160 98 112 112V292C160 278 222 278 260 298z" fill="var(--i5)" stroke="var(--i1)" stroke-width="7" stroke-linejoin="round"/>' +
    '<path d="M260 118C298 98 360 98 408 112V292C360 278 298 278 260 298z" fill="var(--i5)" stroke="var(--i1)" stroke-width="7" stroke-linejoin="round"/>' +
    '<rect x="140" y="140" width="92" height="10" rx="5" fill="var(--i4)"/><rect x="140" y="168" width="92" height="10" rx="5" fill="var(--i3)"/><rect x="140" y="196" width="72" height="10" rx="5" fill="var(--i4)"/>' +
    '<rect x="290" y="140" width="92" height="10" rx="5" fill="var(--i4)"/><rect x="290" y="168" width="72" height="10" rx="5" fill="var(--i3)"/><rect x="290" y="196" width="92" height="10" rx="5" fill="var(--i4)"/>' +
    '<circle cx="396" cy="104" r="46" fill="var(--i1)"/><text x="396" y="124" text-anchor="middle" font-size="58" font-weight="800" fill="var(--i5)" font-family="Manrope, Segoe UI, Arial, sans-serif">§</text>';
  Z.monteur = GRUND +
    '<rect x="104" y="150" width="16" height="156" rx="6" fill="var(--i1)"/><rect x="104" y="226" width="300" height="16" rx="8" fill="var(--i1)"/><rect x="388" y="244" width="16" height="62" rx="6" fill="var(--i1)"/>' +
    '<rect x="122" y="190" width="276" height="38" rx="12" fill="var(--i5)" stroke="var(--i1)" stroke-width="5"/><rect x="136" y="172" width="78" height="26" rx="13" fill="var(--i4)"/>' +
    '<rect x="228" y="190" width="170" height="38" rx="12" fill="var(--i2)"/>' +
    '<path d="M338 176a48 48 0 0 1 96 0z" fill="var(--i1)"/><rect x="324" y="174" width="124" height="14" rx="7" fill="var(--i1)"/><rect x="380" y="126" width="12" height="46" rx="6" fill="var(--i4)"/>';
  Z.leer = GRUND +
    '<path d="M196 150L260 96l64 54" fill="none" stroke="var(--i1)" stroke-width="6" stroke-dasharray="10 10" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M214 144v-40" stroke="var(--i1)" stroke-width="6" stroke-dasharray="10 10" fill="none"/>' +
    '<rect x="150" y="204" width="220" height="100" rx="10" fill="var(--i5)" stroke="var(--i1)" stroke-width="7"/>' +
    '<polygon points="150,206 116,164 214,150 232,206" fill="var(--i4)" stroke="var(--i1)" stroke-width="6" stroke-linejoin="round"/>' +
    '<polygon points="370,206 404,164 306,150 288,206" fill="var(--i3)" stroke="var(--i1)" stroke-width="6" stroke-linejoin="round"/>' +
    '<circle cx="410" cy="110" r="9" fill="var(--i2)"/><circle cx="122" cy="120" r="7" fill="var(--i2)"/>';
  Z.impressum = GRUND +
    '<rect x="168" y="58" width="184" height="248" rx="14" fill="var(--i5)" stroke="var(--i1)" stroke-width="7"/>' +
    '<rect x="194" y="92" width="132" height="14" rx="7" fill="var(--i1)"/>' +
    [128, 156, 184, 212].map(function (y, i) { return '<rect x="194" y="' + y + '" width="' + (i === 3 ? 80 : 132) + '" height="10" rx="5" fill="var(--i4)"/>'; }).join('') +
    '<circle cx="330" cy="258" r="44" fill="var(--i3)" stroke="var(--i2)" stroke-width="6"/><path d="M310 258l14 14 26-30" fill="none" stroke="var(--i2)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';

  /* Steuern sparen: Haus mit Münzen, die in ein Sparschwein fallen (Block 4) */
  Z.steuern = GRUND + haus(170, 308, .72) +
    '<ellipse cx="368" cy="244" rx="82" ry="62" fill="var(--i2)"/><circle cx="414" cy="228" r="8" fill="var(--i5)"/>' +
    '<rect x="318" y="294" width="20" height="26" rx="6" fill="var(--i2)"/><rect x="394" y="294" width="20" height="26" rx="6" fill="var(--i2)"/>' +
    '<polygon points="436,206 468,180 462,226" fill="var(--i2)"/>' +
    '<rect x="338" y="196" width="60" height="9" rx="4.5" fill="var(--i5)"/>' +
    EURO(368, 128, 24) + EURO(402, 82, 17) + '<path d="M368 160v30" stroke="var(--i1)" stroke-width="5" stroke-dasharray="4 8" stroke-linecap="round"/>';

  window.DATEN.bilder = {
    namen: Object.keys(Z),
    symbole: function () {
      return Object.keys(Z).map(function (k) { return '<symbol id="il-' + k + '" viewBox="0 0 520 380">' + Z[k] + '</symbol>'; }).join('');
    }
  };
})();
