/* Texte der neuen Planungsfunktionen in drei Sprachen: { schlüssel: { de, en, ru } }.
   Platzhalter in geschweiften Klammern, z. B. {raum}. Gelesen von sprache.js (window.TXT.t).
   Nur was neu zur Planung (Welle A) gehört steht hier; die übrige Seite bleibt vorerst Deutsch.
   Regel: kein Schlüssel ohne alle drei Sprachen (geprüft von tmp/planung_test.ps1).
   Russisch ohne "Zahl + Hauptwort"-Beugung, wo es geht (Form "Окна: 3"). */
window.TEXTE = {
  /* Kopf und Hinweisband */
  sprachNurDeutsch: {
    de: 'Dieser Bereich ist bisher nur auf Deutsch.',
    en: 'This area is only available in German so far.',
    ru: 'Этот раздел пока только на немецком языке.'
  },
  sprachGrundrissRest: {
    de: 'Nur die neuen Planungsfunktionen sind übersetzt; der Rest dieser Seite bleibt vorerst Deutsch.',
    en: 'Only the new planning functions are translated so far; the rest of this page stays German for now.',
    ru: 'Пока переведены только новые функции планирования; остальная часть страницы остаётся на немецком.'
  },
  spracheNichtGemerkt: {
    de: 'Die Sprachwahl konnte nicht gespeichert werden (Browser-Speicher gesperrt). Sie gilt nur bis zum Schließen der Seite.',
    en: 'The language choice could not be saved (browser storage is blocked). It only lasts until you close the page.',
    ru: 'Выбор языка не удалось сохранить (память браузера заблокирована). Он действует только до закрытия страницы.'
  },

  /* Knöpfe am Plan */
  masse: { de: 'Maße zeigen', en: 'Show dimensions', ru: 'Показать размеры' },
  drucken: { de: 'Plan drucken', en: 'Print plan', ru: 'Печать плана' },
  verstanden: { de: 'Verstanden', en: 'Got it', ru: 'Понятно' },
  masseNichtGemerkt: {
    de: 'Die Einstellung „Maße zeigen“ konnte nicht gespeichert werden (Browser-Speicher gesperrt). Sie gilt nur, bis Sie die Seite schließen.',
    en: 'The “Show dimensions” setting could not be saved (browser storage is blocked). It only lasts until you close the page.',
    ru: 'Настройку «Показать размеры» не удалось сохранить (память браузера заблокирована). Она действует только до закрытия страницы.'
  },
  einheitM: { de: 'm', en: 'm', ru: 'м' },

  /* Wandstärken (Annahme) */
  annahme: { de: 'Annahme', en: 'Assumption', ru: 'Допущение' },
  wandHinweis: {
    de: 'Außenwand {aussen} cm, Innenwand {innen} cm dick.',
    en: 'Outer walls {aussen} cm, inner walls {innen} cm thick.',
    ru: 'Толщина наружных стен {aussen} см, внутренних {innen} см.'
  },
  wandHilfe: {
    de: 'Der gezeichnete Raum ist das lichte Maß. Die Außenwand wächst nach außen, die Innenwand sitzt mittig auf der Kante, die zwei Räume gemeinsam haben. Die Wände werden nicht gespeichert, sondern aus den Räumen berechnet. Die Dicken sind Annahmen, keine Messwerte.',
    en: 'The room you draw is the clear (inside) size. The outer wall grows outward; the inner wall sits centred on the edge that two rooms share. Walls are not stored, they are calculated from the rooms. The thicknesses are assumptions, not measurements.',
    ru: 'Нарисованная комната — это размер «в чистоте». Наружная стена растёт наружу, внутренняя стоит по центру общей грани двух комнат. Стены не сохраняются, а рассчитываются из комнат. Толщина — допущение, а не измерение.'
  },
  wandDickeTitel: { de: 'Wanddicke dieser Etage', en: 'Wall thickness of this floor', ru: 'Толщина стен этого этажа' },
  wandAussenLabel: { de: 'Außenwand in cm', en: 'Outer wall in cm', ru: 'Наружная стена, см' },
  wandInnenLabel: { de: 'Innenwand in cm', en: 'Inner wall in cm', ru: 'Внутренняя стена, см' },
  wandFeldKurz: {
    de: 'Dicke der Wand in cm. Der gezeichnete Raum behält sein Maß, die Außenwand kommt nach außen dazu.',
    en: 'Thickness of the wall in cm. The room you drew keeps its size; the outer wall is added on the outside.',
    ru: 'Толщина стены в см. Нарисованная комната сохраняет свой размер, наружная стена добавляется снаружи.'
  },
  wandFeldFehler: {
    de: 'Bitte eine Dicke von {min} bis {max} cm eingeben, zum Beispiel 30 für eine Außenwand.',
    en: 'Please enter a thickness from {min} to {max} cm, for example 30 for an outer wall.',
    ru: 'Введите толщину от {min} до {max} см, например 30 для наружной стены.'
  },
  wandSkizzeAria: {
    de: 'Skizze von oben: dicke Außenwand und dünne Innenwand, jeweils mit Maßpfeil',
    en: 'Sketch from above: a thick outer wall and a thin inner wall, each with a dimension arrow',
    ru: 'Эскиз сверху: толстая наружная стена и тонкая внутренняя стена, у каждой стрелка размера'
  },
  wandSkizzeAussen: { de: 'außen', en: 'outer', ru: 'наруж.' },
  wandSkizzeInnen: { de: 'innen', en: 'inner', ru: 'внутр.' },
  hilfeKnopf: { de: 'Mehr erklären', en: 'Explain more', ru: 'Пояснить подробнее' },

  /* Himmelsrichtung */
  nordName: { de: 'Norden', en: 'North', ru: 'Север' },
  nordBuchstabe: { de: 'N', en: 'N', ru: 'С' },
  nordWert: { de: 'Norden zeigt {grad} Grad im Uhrzeigersinn von oben', en: 'North points {grad} degrees clockwise from up', ru: 'Север направлен на {grad} градусов по часовой стрелке от верха' },
  nordFeld: { de: 'Norden zeigt auf dem Plan nach (Grad)', en: 'North points on the plan to (degrees)', ru: 'Север на плане направлен на (градусы)' },
  nordHilfe: {
    de: 'Wohin zeigt Norden auf Ihrem Plan? Wichtig für Sonne und Solar. Ziehen Sie die Windrose im Plan oder tippen Sie eine Zahl: 0 = Norden ist oben, 90 = rechts, 180 = unten, 270 = links.',
    en: 'Which way does north point on your plan? Important for sun and solar. Drag the compass rose in the plan or type a number: 0 = north is up, 90 = right, 180 = down, 270 = left.',
    ru: 'Куда на вашем плане направлен север? Важно для солнца и солнечных батарей. Тяните розу ветров на плане или введите число: 0 = север вверху, 90 = справа, 180 = внизу, 270 = слева.'
  },
  nordZiehen: { de: 'Windrose: ziehen, um Norden einzustellen', en: 'Compass rose: drag to set north', ru: 'Роза ветров: тяните, чтобы задать север' },
  nordFehler: {
    de: 'Bitte einen Winkel von 0 bis 360 Grad eingeben, zum Beispiel 90, wenn Norden rechts liegt.',
    en: 'Please enter an angle from 0 to 360 degrees, for example 90 if north is on the right.',
    ru: 'Введите угол от 0 до 360 градусов, например 90, если север справа.'
  },

  /* Fenster und Türen */
  wortFenster: { de: 'Fenster', en: 'Window', ru: 'Окно' },
  wortTuer: { de: 'Tür', en: 'Door', ru: 'Дверь' },
  anWand: { de: 'an der Wand befestigt', en: 'fixed to the wall', ru: 'закреплено на стене' },
  eingerastet: {
    de: '{teil} sitzt jetzt an der Wand von „{raum}“. Zum Verschieben an der Wand entlang ziehen.',
    en: '{teil}: now on the wall of “{raum}”. Drag it along the wall to move it.',
    ru: '{teil}: теперь на стене комнаты «{raum}». Тяните вдоль стены, чтобы переместить.'
  },
  frei: {
    de: '{teil} steht frei, nicht an einer Wand. Ziehen Sie es nah an eine Wand (unter 40 cm), dann rastet es ein.',
    en: '{teil} is standing free, not on a wall. Drag it close to a wall (under 40 cm) and it will snap on.',
    ru: '{teil} стоит свободно, не на стене. Подвиньте его к стене (ближе 40 см), и оно встанет на место.'
  },
  keinRaum: {
    de: 'Es gibt noch keinen Raum mit Wand. Zeichnen Sie zuerst einen Raum, dann lässt sich das Teil an seine Wand setzen.',
    en: 'There is no room with a wall yet. Draw a room first, then the part can be placed on its wall.',
    ru: 'Пока нет комнаты со стеной. Сначала нарисуйте комнату, затем элемент можно поставить на её стену.'
  },
  loeschFrei: {
    de: 'Fenster und Türen dieses Raums ({n}) stehen jetzt frei, weil „{name}“ gelöscht wurde. Ziehen Sie sie an eine andere Wand.',
    en: 'Windows and doors of this room ({n}) are now free-standing because “{name}” was deleted. Drag them to another wall.',
    ru: 'Окна и двери этой комнаты ({n}) теперь стоят свободно, так как «{name}» удалена. Перетащите их к другой стене.'
  },
  grundGeloeschtName: {
    de: 'Grund: Der Raum „{name}“ wurde gelöscht.',
    en: 'Reason: the room “{name}” was deleted.',
    ru: 'Причина: комната «{name}» удалена.'
  },
  grundGeloescht: {
    de: 'Grund: Der zugehörige Raum wurde gelöscht.',
    en: 'Reason: the room it belonged to was deleted.',
    ru: 'Причина: комната, к которой оно относилось, удалена.'
  },
  grundKante: {
    de: 'Grund: Die Wand von „{name}“ gibt es nicht mehr.',
    en: 'Reason: the wall of “{name}” no longer exists.',
    ru: 'Причина: стены комнаты «{name}» больше нет.'
  },
  freiSatz: {
    de: 'Achtung: Fenster/Türen ohne Wand: {n} (zuerst: {teil}). {grund} Ziehen Sie sie an eine Wand.',
    en: 'Attention: windows/doors without a wall: {n} (first: {teil}). {grund} Drag them onto a wall.',
    ru: 'Внимание: окна/двери без стены: {n} (первое: {teil}). {grund} Перетащите их к стене.'
  },
  panelAnWand: { de: 'Sitzt an der Wand von „{raum}“.', en: 'Sits on the wall of “{raum}”.', ru: 'Стоит на стене комнаты «{raum}».' },
  panelFrei: { de: 'Nicht mehr an einer Wand.', en: 'No longer on a wall.', ru: 'Больше не на стене.' },
  panelNichtAnWand: {
    de: 'Steht frei im Raum. Ziehen Sie es an eine Wand oder drücken Sie den Knopf.',
    en: 'Standing free in the room. Drag it onto a wall or press the button.',
    ru: 'Стоит свободно в комнате. Перетащите его к стене или нажмите кнопку.'
  },
  anWandSetzen: { de: 'An nächste Wand setzen', en: 'Put on nearest wall', ru: 'Поставить на ближайшую стену' },
  wandFehlt: {
    de: 'Keine Wand in der Nähe gefunden. Zeichnen Sie zuerst einen Raum um das Teil herum.',
    en: 'No wall found nearby. Draw a room around the part first.',
    ru: 'Рядом нет стены. Сначала нарисуйте комнату вокруг элемента.'
  },
  feldBreite: { de: 'Breite in cm', en: 'Width in cm', ru: 'Ширина, см' },
  feldBreiteKurz: { de: 'Breite = wie weit es an der Wand entlang reicht.', en: 'Width = how far it reaches along the wall.', ru: 'Ширина = насколько оно тянется вдоль стены.' },
  feldHoehe: { de: 'Höhe in cm', en: 'Height in cm', ru: 'Высота, см' },
  feldHoeheKurz: { de: 'Höhe = von der Unterkante bis zur Oberkante.', en: 'Height = from the bottom edge to the top edge.', ru: 'Высота = от нижнего края до верхнего.' },
  feldBruestung: { de: 'Brüstung in cm', en: 'Sill height in cm', ru: 'Высота подоконника, см' },
  feldBruestungKurz: {
    de: 'Brüstung = Höhe vom Boden bis zur Fensterunterkante.',
    en: 'Sill height = distance from the floor to the bottom of the window.',
    ru: 'Высота подоконника = расстояние от пола до нижнего края окна.'
  },
  feldFehler: {
    de: 'Bitte eine Zahl von {von} bis {bis} eingeben (in Zentimetern, ohne Einheit).',
    en: 'Please enter a number from {von} to {bis} (in centimetres, no unit).',
    ru: 'Введите число от {von} до {bis} (в сантиметрах, без единицы).'
  },
  seiteWechseln: { de: 'Seite wechseln (R)', en: 'Flip side (R)', ru: 'Другая сторона (R)' },
  drehenR: { de: 'Drehen (R)', en: 'Rotate (R)', ru: 'Повернуть (R)' },
  loeschenEntf: { de: 'Löschen (Entf)', en: 'Delete (Del)', ru: 'Удалить (Del)' },
  hilfeFenster: {
    de: 'Das Fenster sitzt in der Wand. Die Breite geht an der Wand entlang, die Höhe nach oben. Die Brüstung ist das Stück Wand unter dem Fenster, vom Boden bis zur Fensterunterkante (üblich sind etwa 90 cm). Ziehen Sie das Fenster an der Wand entlang; mit den Punkten an seinen Enden machen Sie es breiter oder schmaler.',
    en: 'The window sits in the wall. Width runs along the wall, height goes upward. The sill height is the piece of wall below the window, from the floor to the bottom of the window (about 90 cm is usual). Drag the window along the wall; use the dots at its ends to make it wider or narrower.',
    ru: 'Окно находится в стене. Ширина идёт вдоль стены, высота — вверх. Высота подоконника — часть стены под окном, от пола до нижнего края окна (обычно около 90 см). Тяните окно вдоль стены; точками на концах его можно сделать шире или уже.'
  },
  hilfeTuer: {
    de: 'Die Tür sitzt in der Wand. Die gestrichelte Linie zeigt, wohin sie aufschwingt; „Seite wechseln“ dreht die Richtung um. Die Breite geht an der Wand entlang, die Höhe nach oben (üblich sind etwa 200 cm).',
    en: 'The door sits in the wall. The dashed line shows which way it swings; “Flip side” reverses the direction. Width runs along the wall, height goes upward (about 200 cm is usual).',
    ru: 'Дверь находится в стене. Пунктирная линия показывает, куда она открывается; «Другая сторона» меняет направление. Ширина идёт вдоль стены, высота — вверх (обычно около 200 см).'
  },
  panelZiehen: {
    de: 'Verschieben: an der Wand entlang ziehen oder Pfeiltasten. Breiter oder schmaler: die Punkte an den Enden ziehen.',
    en: 'Move: drag it along the wall or use the arrow keys. Wider or narrower: drag the dots at its ends.',
    ru: 'Переместить: тяните вдоль стены или клавишами-стрелками. Шире или уже: тяните точки на концах.'
  },
  hinweisWand: {
    de: 'Tipp: Ziehen Sie das Fenster an der Wand entlang. Es rastet von selbst an der Wand ein. Mit den Punkten an den Enden machen Sie es breiter oder schmaler.',
    en: 'Tip: drag the window along the wall. It snaps onto the wall by itself. Use the dots at its ends to make it wider or narrower.',
    ru: 'Подсказка: тяните окно вдоль стены. Оно само встаёт на стену. Точками на концах его можно сделать шире или уже.'
  },
  hoeheFehler: {
    de: 'Bitte eine Höhe zwischen 1,8 und 6 m eingeben, zum Beispiel 2,5.',
    en: 'Please enter a height between 1.8 and 6 m, for example 2.5.',
    ru: 'Введите высоту от 1,8 до 6 м, например 2,5.'
  },

  /* Druckseite */
  druckTitel: { de: 'Grundriss – {etage}', en: 'Floor plan – {etage}', ru: 'План этажа – {etage}' },
  druckDatum: { de: 'Datum', en: 'Date', ru: 'Дата' },
  druckMassstab: { de: 'Maßstab', en: 'Scale', ru: 'Масштаб' },
  druckHoehe: { de: 'Raumhöhe', en: 'Room height', ru: 'Высота помещения' },
  druckMassstabNote: {
    de: 'Maßstab 1:{n} gilt nur beim Drucken mit 100 % (nicht „An Seite anpassen“). Die Maßzahlen im Plan gelten immer.',
    en: 'Scale 1:{n} only applies when printing at 100 % (not “Fit to page”). The dimensions written in the plan always apply.',
    ru: 'Масштаб 1:{n} действует только при печати в 100 % (не «По размеру страницы»). Размеры, написанные на плане, действуют всегда.'
  },
  druckRaum: { de: 'Raum', en: 'Room', ru: 'Помещение' },
  druckArt: { de: 'Art', en: 'Type', ru: 'Тип' },
  druckGrund: { de: 'Grundfläche', en: 'Floor area', ru: 'Площадь пола' },
  druckWohn: { de: 'Wohnfläche', en: 'Living area', ru: 'Жилая площадь' },
  druckSumme: { de: 'Summe', en: 'Total', ru: 'Итого' },
  druckKeinBauplan: {
    de: 'Kein Bauplan: nachgezeichnete Maße, die Wohnfläche ist eine Näherung zum Prüfen.',
    en: 'Not a construction drawing: traced dimensions; the living area is an approximation for checking.',
    ru: 'Это не строительный чертёж: размеры обведены вручную, жилая площадь — приблизительная, для проверки.'
  },
  druckFehler: {
    de: 'Drucken ging nicht: {grund}. Versuchen Sie Strg+P oder laden Sie die Seite neu.',
    en: 'Printing failed: {grund}. Try Ctrl+P or reload the page.',
    ru: 'Печать не удалась: {grund}. Попробуйте Ctrl+P или перезагрузите страницу.'
  },
  druckLeer: {
    de: 'Es gibt noch nichts zu drucken. Zeichnen Sie zuerst einen Raum.',
    en: 'There is nothing to print yet. Draw a room first.',
    ru: 'Печатать пока нечего. Сначала нарисуйте комнату.'
  },
  artVoll: { de: 'Wohnraum', en: 'Living space', ru: 'Жилое помещение' },
  artBalkon: { de: 'Balkon, Loggia, Terrasse', en: 'Balcony, loggia, terrace', ru: 'Балкон, лоджия, терраса' },
  artWinter: { de: 'Wintergarten (unbeheizt)', en: 'Conservatory (unheated)', ru: 'Зимний сад (неотапливаемый)' },
  artZubehoer: { de: 'Keller, Garage, Nebenraum', en: 'Cellar, garage, utility room', ru: 'Подвал, гараж, подсобное помещение' }
};
