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
  artZubehoer: { de: 'Keller, Garage, Nebenraum', en: 'Cellar, garage, utility room', ru: 'Подвал, гараж, подсобное помещение' },

  /* Welle B: 3D-Ansicht des ganzen Hauses, Dach, Sonne, Durchgehen */
  dreiEtagen: { de: 'Etagen zeigen:', en: 'Show floors:', ru: 'Показать этажи:' },
  dreiEtagenAria: { de: 'Etagen in der 3D-Ansicht ein- und ausblenden', en: 'Show or hide floors in the 3D view', ru: 'Показать или скрыть этажи в 3D-виде' },
  dreiEtageAn: { de: '{name}: sichtbar. Antippen blendet die Etage aus.', en: '{name}: visible. Tap to hide this floor.', ru: '{name}: виден. Нажмите, чтобы скрыть этаж.' },
  dreiEtageAus: { de: '{name}: ausgeblendet. Antippen blendet die Etage ein.', en: '{name}: hidden. Tap to show this floor.', ru: '{name}: скрыт. Нажмите, чтобы показать этаж.' },
  dreiEtagenHilfe: { de: 'Etagen mit „Keller“ im Namen liegen unter dem Erdgeschoss, alle anderen übereinander in der Reihenfolge der Liste. Das ist eine Annahme.', en: 'Floors with “Keller” (cellar) in the name lie below the ground floor, all others are stacked in list order. This is an assumption.', ru: 'Этажи со словом «Keller» (подвал) в названии находятся под первым этажом, остальные расположены друг над другом в порядке списка. Это допущение.' },
  dreiSchnitt: { de: 'Aufschneiden', en: 'Cut open', ru: 'Разрез' },
  dreiSchnittHilfe: { de: 'Blendet alles über der gewählten Etage aus, so sehen Sie von oben hinein.', en: 'Hides everything above the selected floor so you can look in from above.', ru: 'Скрывает всё выше выбранного этажа, чтобы заглянуть внутрь сверху.' },
  dreiGehen: { de: 'Durchgehen', en: 'Walk through', ru: 'Пройтись' },
  dreiGehenHilfe: { de: 'Mit den Pfeiltasten durch die gewählte Etage gehen, Augenhöhe 1,60 m.', en: 'Walk through the selected floor with the arrow keys, eye height 1.60 m.', ru: 'Идти по выбранному этажу стрелками, высота глаз 1,60 м.' },
  dreiDachfarbe: { de: 'Dach nach Sonnenertrag', en: 'Roof by solar yield', ru: 'Крыша по выработке солнца' },
  dreiGehenZurueck: { de: 'Zurück zur Übersicht (Esc)', en: 'Back to overview (Esc)', ru: 'Назад к обзору (Esc)' },
  dreiVor: { de: 'Vorwärts gehen', en: 'Walk forward', ru: 'Идти вперёд' },
  dreiZurueck: { de: 'Rückwärts gehen', en: 'Walk backward', ru: 'Идти назад' },
  dreiLinks: { de: 'Nach links drehen', en: 'Turn left', ru: 'Повернуть налево' },
  dreiRechts: { de: 'Nach rechts drehen', en: 'Turn right', ru: 'Повернуть направо' },
  dreiGehenAria: { de: 'Bedienung zum Durchgehen', en: 'Walk-through controls', ru: 'Управление прогулкой' },
  dreiGehHinweis: { de: 'Mit den Pfeiltasten oder W A S D gehen: hoch und runter = vor und zurück, links und rechts = drehen. Zum Umschauen mit der Maus oder dem Finger ziehen. Auf dem Handy die Pfeile unten benutzen. Esc beendet.', en: 'Walk with the arrow keys or W A S D: up and down = forward and back, left and right = turn. Drag with the mouse or your finger to look around. On a phone use the arrows below. Esc ends.', ru: 'Идите стрелками или W A S D: вверх и вниз — вперёд и назад, влево и вправо — поворот. Чтобы осмотреться, перетащите мышью или пальцем. На телефоне используйте стрелки внизу. Esc — выход.' },
  dreiGehenLeer: { de: 'Zum Durchgehen braucht diese Etage mindestens einen Raum. Zeichnen Sie zuerst einen Raum.', en: 'This floor needs at least one room before you can walk through it. Draw a room first.', ru: 'Чтобы пройтись, на этаже нужна хотя бы одна комната. Сначала нарисуйте комнату.' },
  dreiGehenStatus: { de: 'Sie gehen durch „{name}“, Augenhöhe 1,60 m. Innenwände halten Sie nicht auf, nur der Außenumriss.', en: 'You are walking through “{name}”, eye height 1.60 m. Interior walls do not stop you, only the outer outline.', ru: 'Вы идёте по этажу «{name}», высота глаз 1,60 м. Внутренние стены вас не останавливают, только внешний контур.' },
  dreiSonne: { de: 'Sonne und Schatten', en: 'Sun and shadow', ru: 'Солнце и тень' },
  dreiZeit: { de: 'Tageszeit', en: 'Time of day', ru: 'Время суток' },
  dreiZeitWert: { de: '{h} Uhr', en: '{h} h', ru: '{h} ч' },
  dreiJahr: { de: 'Jahreszeit', en: 'Time of year', ru: 'Время года' },
  dreiSonneText: { de: 'Sonne am {datum} um {zeit} Uhr in {ort}: {hoehe}° über dem Horizont, aus Richtung {richtung}. Rechnung nach Standardformel, Uhrzeit mit Sommerzeit von April bis Oktober, eine Näherung.', en: 'Sun on {datum} at {zeit} in {ort}: {hoehe}° above the horizon, from the {richtung}. Standard formula; clock time includes summer time from April to October, an approximation.', ru: 'Солнце {datum} в {zeit} в {ort}:{hoehe}° над горизонтом, с направления {richtung}. Стандартная формула; время с учётом летнего с апреля по октябрь, приближённо.' },
  dreiSonneUnter: { de: 'Am {datum} um {zeit} Uhr in {ort} ist die Sonne noch nicht oder nicht mehr aufgegangen, es gibt keinen Schatten.', en: 'On {datum} at {zeit} in {ort} the sun has not risen yet or has already set, so there is no shadow.', ru: '{datum} в {zeit} в {ort} солнце ещё не взошло или уже зашло, тени нет.' },
  dreiRgN: { de: 'Norden', en: 'north', ru: 'севера' },
  dreiRgNO: { de: 'Nordosten', en: 'north-east', ru: 'северо-востока' },
  dreiRgO: { de: 'Osten', en: 'east', ru: 'востока' },
  dreiRgSO: { de: 'Südosten', en: 'south-east', ru: 'юго-востока' },
  dreiRgS: { de: 'Süden', en: 'south', ru: 'юга' },
  dreiRgSW: { de: 'Südwesten', en: 'south-west', ru: 'юго-запада' },
  dreiRgW: { de: 'Westen', en: 'west', ru: 'запада' },
  dreiRgNW: { de: 'Nordwesten', en: 'north-west', ru: 'северо-запада' },
  dreiRnN: { de: 'Nord', en: 'north', ru: 'север' },
  dreiRnNO: { de: 'Nordost', en: 'north-east', ru: 'северо-восток' },
  dreiRnO: { de: 'Ost', en: 'east', ru: 'восток' },
  dreiRnSO: { de: 'Südost', en: 'south-east', ru: 'юго-восток' },
  dreiRnS: { de: 'Süd', en: 'south', ru: 'юг' },
  dreiRnSW: { de: 'Südwest', en: 'south-west', ru: 'юго-запад' },
  dreiRnW: { de: 'West', en: 'west', ru: 'запад' },
  dreiRnNW: { de: 'Nordwest', en: 'north-west', ru: 'северо-запад' },
  dreiSflach: { de: 'waagerecht', en: 'horizontal', ru: 'горизонтально' },
  himN: { de: 'N', en: 'N', ru: 'С' },
  himO: { de: 'O', en: 'E', ru: 'В' },
  himS: { de: 'S', en: 'S', ru: 'Ю' },
  himW: { de: 'W', en: 'W', ru: 'З' },
  dreiDachTitel: { de: 'Dach nach Sonnenertrag', en: 'Roof by solar yield', ru: 'Крыша по выработке солнца' },
  dreiLegende: { de: 'Farben der Dachflächen', en: 'Roof face colours', ru: 'Цвета скатов крыши' },
  dreiKsehrgut: { de: 'sehr gut', en: 'very good', ru: 'очень хорошо' },
  dreiKgut: { de: 'gut', en: 'good', ru: 'хорошо' },
  dreiKmaessig: { de: 'mäßig', en: 'moderate', ru: 'умеренно' },
  dreiKschlecht: { de: 'schlecht', en: 'poor', ru: 'плохо' },
  dreiSchwellen: { de: 'Eigene Einordnung, keine Empfehlung: Jahresertrag im Verhältnis zur besten Ausrichtung in {ort} ({best} kWh je kWp). Sehr gut ab 90 %, gut ab 80 %, mäßig ab 65 %, darunter schlecht.', en: 'Own classification, not a recommendation: annual yield relative to the best orientation in {ort} ({best} kWh per kWp). Very good from 90 %, good from 80 %, moderate from 65 %, poor below.', ru: 'Собственная оценка, не рекомендация: годовая выработка относительно лучшей ориентации в {ort} ({best} кВт·ч на кВт пиковой мощности). Очень хорошо от 90 %, хорошо от 80 %, умеренно от 65 %, ниже — плохо.' },
  dreiDachQuelle: { de: 'Ertrag je Fläche: {quelle}, Abruf {abruf}. Anlage 1 kWp, 14 % Verluste, fest montiert, Ort {ort}. {urheber}', en: 'Yield per face: {quelle}, retrieved {abruf}. System 1 kWp, 14 % losses, fixed mounting, place {ort}. {urheber}', ru: 'Выработка по скатам: {quelle}, получено {abruf}. Система 1 кВт пик., потери 14 %, стационарная установка, место {ort}. {urheber}' },
  dreiDachZeile: { de: 'Dachfläche {n}, fällt nach {richtung}, {neigung}° Neigung: {ey} kWh je kWp und Jahr, {klasse}.', en: 'Roof face {n}, slopes down to the {richtung}, {neigung}° pitch: {ey} kWh per kWp and year, {klasse}.', ru: 'Скат {n}, наклон в сторону {richtung}, угол {neigung}°: {ey} кВт·ч на кВт пик. в год, {klasse}.' },
  dreiDachZeileFlach: { de: 'Dachfläche {n}, {richtung} (Flachdach, so gerechnet): {ey} kWh je kWp und Jahr, {klasse}.', en: 'Roof face {n}, {richtung} (flat roof, calculated this way): {ey} kWh per kWp and year, {klasse}.', ru: 'Скат {n}, {richtung} (плоская крыша, так посчитано): {ey} кВт·ч на кВт пик. в год, {klasse}.' },
  dreiDachKappung: { de: ' Neigung über 60°: die Tabelle endet bei 60°, dafür gilt der Wert von 60°.', en: ' Pitch above 60°: the table ends at 60°, so the 60° value is used.', ru: ' Угол больше 60°: таблица заканчивается на 60°, используется значение для 60°.' },
  dreiTipp: { de: 'Dachfläche {n}: {richtung}, {neigung}°, {ey} kWh je kWp und Jahr, {klasse}', en: 'Roof face {n}: {richtung}, {neigung}°, {ey} kWh per kWp and year, {klasse}', ru: 'Скат {n}: {richtung}, {neigung}°, {ey} кВт·ч на кВт пик. в год, {klasse}' },
  dreiDachNaeherung: { de: 'Das Dach wird als einfache Form über dem umschließenden Rechteck der obersten Etage berechnet. Gauben, Anbauten, Versprünge und Schatten von Nachbarn fehlen. Der Ertrag gilt je Fläche, nicht für das ganze Dach.', en: 'The roof is calculated as a simple shape over the bounding rectangle of the top floor. Dormers, extensions, set-backs and shadows from neighbours are missing. The yield is per face, not for the whole roof.', ru: 'Крыша считается как простая форма над охватывающим прямоугольником верхнего этажа. Мансардные окна, пристройки, уступы и тень от соседей не учтены. Выработка указана по скатам, а не для всей крыши.' },
  dreiKeineDaten: { de: 'Die Ertragstabelle (PVGIS) fehlt in dieser Fassung der Seite, die Dachflächen bleiben ungefärbt.', en: 'The yield table (PVGIS) is missing in this version of the page, so the roof faces stay uncoloured.', ru: 'Таблица выработки (PVGIS) отсутствует в этой версии страницы, скаты остаются без окраски.' },
  dreiKeinOrt: { de: 'Für den Ort „{ort}“ gibt es keine Ertragswerte, die Dachflächen bleiben ungefärbt.', en: 'There are no yield values for “{ort}”, so the roof faces stay uncoloured.', ru: 'Для места «{ort}» нет значений выработки, скаты остаются без окраски.' },
  dreiKeinDach: { de: 'Noch kein Dach: Zeichnen Sie in der obersten Etage einen Raum, dann erscheint es hier.', en: 'No roof yet: draw a room on the top floor and it appears here.', ru: 'Крыши пока нет: нарисуйте комнату на верхнем этаже, и она появится здесь.' },
  dreiOrt: { de: 'Ort für Sonne und Ertrag: {ort} (vorerst fest eingestellt)', en: 'Place for sun and yield: {ort} (fixed for now)', ru: 'Место для солнца и выработки: {ort} (пока задано жёстко)' },
  dreiBedienung: { de: 'Ziehen dreht das Haus, Strg + Mausrad zoomt. Mit der Tastatur: Pfeiltasten drehen, + und − zoomen.', en: 'Drag to turn the house, Ctrl + mouse wheel zooms. With the keyboard: arrow keys turn, + and − zoom.', ru: 'Перетаскивание вращает дом, Ctrl + колесо мыши — масштаб. С клавиатуры: стрелки вращают, + и − масштабируют.' },
  dreiCanvasAria: { de: '3D-Ansicht des Hauses. Pfeiltasten drehen, plus und minus zoomen.', en: '3D view of the house. Arrow keys turn, plus and minus zoom.', ru: '3D-вид дома. Стрелки вращают, плюс и минус масштабируют.' },
  dreiCanvasGehAria: { de: '3D-Ansicht beim Durchgehen. Pfeiltasten oder W A S D bewegen, Esc beendet.', en: '3D view while walking. Arrow keys or W A S D move, Esc ends.', ru: '3D-вид во время прогулки. Стрелки или W A S D — движение, Esc — выход.' },
  dachTitel: { de: 'Dach', en: 'Roof', ru: 'Крыша' },
  dachKurz: { de: 'Das Dach sehen Sie in der 3D-Ansicht. Es sitzt auf der obersten Etage.', en: 'You see the roof in the 3D view. It sits on the top floor.', ru: 'Крышу видно в 3D-виде. Она лежит на верхнем этаже.' },
  dachFormAria: { de: 'Dachform', en: 'Roof shape', ru: 'Форма крыши' },
  dachSattel: { de: 'Satteldach', en: 'Gable roof', ru: 'Двускатная' },
  dachWalm: { de: 'Walmdach', en: 'Hip roof', ru: 'Вальмовая' },
  dachPult: { de: 'Pultdach', en: 'Mono-pitch', ru: 'Односкатная' },
  dachFlach: { de: 'Flachdach', en: 'Flat roof', ru: 'Плоская' },
  dachNeigung: { de: 'Neigung in Grad', en: 'Pitch in degrees', ru: 'Угол наклона в градусах' },
  dachNeigungSchieber: { de: 'Dachneigung mit Schieber einstellen', en: 'Set roof pitch with slider', ru: 'Угол крыши ползунком' },
  dachFehlerNeigung: { de: 'Bitte eine Neigung von 0 bis 80 Grad eingeben.', en: 'Please enter a pitch from 0 to 80 degrees.', ru: 'Введите угол от 0 до 80 градусов.' },
  dachFirst: { de: 'Firstrichtung (höchste Linie)', en: 'Ridge direction (highest line)', ru: 'Направление конька (верхняя линия)' },
  dachFirstX: { de: 'waagerecht im Plan', en: 'horizontal on the plan', ru: 'горизонтально на плане' },
  dachFirstY: { de: 'senkrecht im Plan', en: 'vertical on the plan', ru: 'вертикально на плане' },
  dachFirstNur: { de: 'Beim Walm- und Flachdach bestimmt die Form die Firstrichtung, hier gibt es nichts einzustellen.', en: 'For hip and flat roofs the shape decides the ridge, nothing to set here.', ru: 'У вальмовой и плоской крыши направление конька задаёт форма, здесь ничего настраивать не нужно.' },
  dachHoch: { de: 'Hohe Seite des Pultdachs', en: 'High side of the mono-pitch roof', ru: 'Высокая сторона односкатной крыши' },
  dachHochOben: { de: 'oben im Plan', en: 'top of the plan', ru: 'вверху плана' },
  dachHochUnten: { de: 'unten im Plan', en: 'bottom of the plan', ru: 'внизу плана' },
  dachHochLinks: { de: 'links im Plan', en: 'left of the plan', ru: 'слева на плане' },
  dachHochRechts: { de: 'rechts im Plan', en: 'right of the plan', ru: 'справа на плане' },
  dachUeberstand: { de: 'Dachüberstand in cm', en: 'Roof overhang in cm', ru: 'Свес крыши в см' },
  dachFehlerUeberstand: { de: 'Bitte einen Überstand von 0 bis 200 cm eingeben.', en: 'Please enter an overhang from 0 to 200 cm.', ru: 'Введите свес от 0 до 200 см.' },

  /* Vorlagen: Auswahl "Vorlage laden" (Karten mit Skizze) */
  vorlageUeberschrift: { de: 'Vorlage laden', en: 'Load a template', ru: 'Загрузить шаблон' },
  vorlageHilfe: {
    de: 'Wählen Sie ein Haus zum Ausprobieren. Es ist schon eingerichtet; alle Maße sind Beispiele, und Sie können danach alles ändern.',
    en: 'Pick a house to try out. It is already furnished; all dimensions are examples, and you can change everything afterwards.',
    ru: 'Выберите дом, чтобы попробовать. Он уже обставлен; все размеры условные, потом можно изменить всё.'
  },
  bildUeberschrift: { de: 'Oder: Grundriss-Bild laden', en: 'Or: load a floor plan image', ru: 'Или: загрузить изображение плана' },
  vorlageLos: { de: 'Antippen zum Laden', en: 'Tap to load', ru: 'Нажмите, чтобы загрузить' },
  vorlageMeta: { de: 'ca. {qm} m² Wohnfläche\n{n} Geschosse', en: 'approx. {qm} m² living area\n{n} floors', ru: 'около {qm} м² жилой площади\nэтажей: {n}' },
  vorlageMetaEins: { de: 'ca. {qm} m² Wohnfläche\n1 Geschoss', en: 'approx. {qm} m² living area\n1 floor', ru: 'около {qm} м² жилой площади\n1 этаж' },
  vorlageNameBeispiel: { de: 'Beispielhaus', en: 'Example house', ru: 'Пример дома' },
  vorlageNameMuster: { de: 'Musterhaus', en: 'Show house', ru: 'Типовой дом' },
  vorlageNameKlein: { de: 'Kleines Haus', en: 'Small house', ru: 'Маленький дом' },
  vorlageNameGross: { de: 'Großes Haus', en: 'Large house', ru: 'Большой дом' },
  vorlageKurzBeispiel: { de: 'Erfunden: Wohnen, Dachgeschoss, Keller und Garage.', en: 'Invented: living floor, attic, cellar and garage.', ru: 'Выдуманный: жилой этаж, мансарда, подвал и гараж.' },
  vorlageKurzMuster: { de: 'Nach einer Vorlage des Nutzers; Obergeschoss angenommen.', en: 'Based on a template by the user; upper floor assumed.', ru: 'По шаблону пользователя; верхний этаж предположен.' },
  vorlageKurzKlein: { de: 'Erfunden: eingeschossig, Wohnen und Kochen offen.', en: 'Invented: single storey, open living and cooking.', ru: 'Выдуманный: один этаж, гостиная и кухня вместе.' },
  vorlageKurzGross: { de: 'Erfunden: zwei Geschosse, drei Schlafzimmer, Ankleide.', en: 'Invented: two floors, three bedrooms, dressing room.', ru: 'Выдуманный: два этажа, три спальни, гардеробная.' },
  vorlageTextBeispiel: { de: 'Beispielhaus mit erfundenen Maßen.', en: 'Example house with invented dimensions.', ru: 'Пример дома с выдуманными размерами.' },
  vorlageTextMuster: {
    de: 'Musterhaus nach einer Vorlage des Nutzers. Angenommen: das Obergeschoss (wie das Erdgeschoss), die Treppe (im Wohnzimmer, weil der Flur zu schmal ist) und einzelne Maße, die um 1 bis 4 cm geändert sind.',
    en: 'Show house based on a template by the user. Assumed: the upper floor (same as the ground floor), the staircase (in the living room because the hall is too narrow) and a few dimensions changed by 1 to 4 cm.',
    ru: 'Типовой дом по шаблону пользователя. Предположено: верхний этаж (как первый), лестница (в гостиной, потому что прихожая слишком узкая) и несколько размеров, изменённых на 1–4 см.'
  },
  vorlageTextKlein: {
    de: 'Kleines Haus mit erfundenen Maßen, eingeschossig; Fenster vor allem nach Süden.',
    en: 'Small house with invented dimensions, single storey; windows mainly facing south.',
    ru: 'Маленький дом с выдуманными размерами, один этаж; окна в основном на юг.'
  },
  vorlageTextGross: {
    de: 'Großes Haus mit erfundenen Maßen, zwei Geschosse; Wohnbereich nach Süden.',
    en: 'Large house with invented dimensions, two floors; living area facing south.',
    ru: 'Большой дом с выдуманными размерами, два этажа; жилая зона на юг.'
  },
  vorlageFrage: {
    de: 'Ihr jetziger Plan wird durch die Vorlage „{name}“ ersetzt. Vorher als Datei sichern?',
    en: 'Your current plan will be replaced by the template “{name}”. Save it as a file first?',
    ru: 'Ваш текущий план будет заменён шаблоном «{name}». Сначала сохранить его в файл?'
  },
  vorlageSichern: { de: 'Sichern und Vorlage laden', en: 'Save, then load template', ru: 'Сохранить и загрузить шаблон' },
  vorlageOhne: { de: 'Ohne Sichern ersetzen', en: 'Replace without saving', ru: 'Заменить без сохранения' },
  vorlageAbbrechen: { de: 'Abbrechen', en: 'Cancel', ru: 'Отмена' },
  vorlageGeladen: {
    de: '{name} geladen. {text} Oben bei „Etage“ wechseln Sie das Geschoss, mit „3D“ sehen Sie das Haus von außen.',
    en: '{name} loaded. {text} Use “Floor” above to switch floors; “3D” shows the house from outside.',
    ru: '{name} загружен. {text} Вверху в «Этаж» можно сменить этаж, в «3D» виден дом снаружи.'
  },
  vorlageFehlt: { de: 'Diese Vorlage fehlt in dieser Fassung der Seite.', en: 'This template is missing in this version of the page.', ru: 'Этого шаблона нет в этой версии страницы.' },
  vorlageNichtGeladen: { de: 'Die Vorlage konnte nicht geladen werden (die Daten sind unvollständig).', en: 'The template could not be loaded (its data is incomplete).', ru: 'Шаблон не удалось загрузить (данные неполные).' },

  /* ---------- Welle C: Bundesland, Haus-Angaben, Gebäudeklasse, Raumnutzung (grundriss_regeln.js) ---------- */
  landTitel: { de: 'Wo steht das Haus?', en: 'Where is the house?', ru: 'Где стоит дом?' },
  landAendern: { de: 'Ändern', en: 'Change', ru: 'Изменить' },
  landKurz: { de: 'Die Regeln hängen vom Bundesland ab. Tippen Sie auf Ihr Land.', en: 'The rules depend on the state. Tap your state.', ru: 'Правила зависят от земли. Выберите свою землю.' },
  landHilfe: {
    de: 'Jedes Bundesland hat eigene Bauregeln (Landesbauordnung). Tippen Sie Ihr Land an, dann prüft die Seite den Plan nach den Regeln dieses Landes. Auch Sonne und Dachertrag in der 3D-Ansicht richten sich nach der Hauptstadt des Landes.',
    en: 'Every German state has its own building rules (state building code). Tap your state and the page checks the plan against that state\'s rules. Sun and roof yield in the 3D view also follow the state capital.',
    ru: 'В каждой федеральной земле свои строительные правила (строительный кодекс земли). Выберите землю, и страница проверит план по её правилам. Солнце и доходность крыши в 3D тоже считаются по столице земли.'
  },
  landKarteAria: { de: 'Karte von Deutschland, Bundesland antippen', en: 'Map of Germany, tap a state', ru: 'Карта Германии, выберите землю' },
  landChipsAria: { de: 'Bundesland wählen', en: 'Choose a state', ru: 'Выбрать землю' },
  landGewaehlt: { de: 'Gewählt: {land}. Sonne und Dachertrag rechnen mit {stadt}.', en: 'Chosen: {land}. Sun and roof yield use {stadt}.', ru: 'Выбрано: {land}. Солнце и доходность крыши считаются для города {stadt}.' },
  landLbo: { de: 'Bauordnung: {lbo}, {fassung}', en: 'Building code: {lbo}, {fassung}', ru: 'Строительный кодекс: {lbo}, {fassung}' },
  landNichtGemerkt: {
    de: 'Das Bundesland gilt für diesen Plan, konnte aber nicht für neue Pläne gemerkt werden (Browser-Speicher gesperrt).',
    en: 'The state applies to this plan, but could not be remembered for new plans (browser storage is blocked).',
    ru: 'Земля действует для этого плана, но не сохранилась для новых планов (память браузера заблокирована).'
  },
  hausTitel: { de: 'Ihr Haus in Stichworten', en: 'Your house in brief', ru: 'Ваш дом вкратце' },
  hausFrei: { de: 'Steht das Haus frei?', en: 'Is the house detached?', ru: 'Дом стоит отдельно?' },
  hausFreiJa: { de: 'Freistehend', en: 'Detached', ru: 'Отдельно стоящий' },
  hausFreiNein: { de: 'Angebaut (Doppel-, Reihenhaus)', en: 'Attached (semi-detached, terraced)', ru: 'Пристроенный (дуплекс, рядный)' },
  hausWohnungen: { de: 'Wie viele Wohnungen?', en: 'How many dwellings?', ru: 'Сколько квартир?' },
  hausWeniger: { de: 'Eine Wohnung weniger', en: 'One dwelling fewer', ru: 'Одной квартирой меньше' },
  hausMehr: { de: 'Eine Wohnung mehr', en: 'One dwelling more', ru: 'Одной квартирой больше' },
  gkTitel: { de: 'Gebäudeklasse', en: 'Building class', ru: 'Класс здания' },
  gkKlasse: { de: 'Klasse {n}', en: 'Class {n}', ru: 'Класс {n}' },
  gkVorschlagKurz: { de: 'Vorschlag', en: 'Suggested', ru: 'Предложение' },
  gkWortEins: { de: 'freistehend', en: 'detached', ru: 'отдельно' },
  gkWortZwei: { de: 'angebaut', en: 'attached', ru: 'пристроен' },
  gkWortDrei: { de: 'bis 7 m', en: 'up to 7 m', ru: 'до 7 м' },
  gkWortVier: { de: 'bis 13 m', en: 'up to 13 m', ru: 'до 13 м' },
  gkWortFuenf: { de: 'höher', en: 'taller', ru: 'выше' },
  gkLangEins: { de: 'freistehend, bis 7 m hoch, höchstens 2 Wohnungen, zusammen bis 400 m²', en: 'detached, up to 7 m high, at most 2 dwellings, together up to 400 m²', ru: 'отдельно стоящий, до 7 м высотой, не более 2 квартир, вместе до 400 м²' },
  gkLangZwei: { de: 'wie Klasse 1, aber angebaut (Doppelhaus, Reihenhaus)', en: 'like class 1, but attached (semi-detached, terraced)', ru: 'как класс 1, но пристроенный (дуплекс, рядный дом)' },
  gkLangDrei: { de: 'alle übrigen Gebäude bis 7 m Höhe', en: 'all other buildings up to 7 m high', ru: 'все прочие здания высотой до 7 м' },
  gkLangVier: { de: 'bis 13 m Höhe, Nutzungseinheiten je höchstens 400 m²', en: 'up to 13 m high, units of at most 400 m² each', ru: 'до 13 м высотой, помещения не более 400 м² каждое' },
  gkLangFuenf: { de: 'alle übrigen, auch höher als 13 m', en: 'all others, also taller than 13 m', ru: 'все прочие, в том числе выше 13 м' },
  gkHilfe: {
    de: 'Die Gebäudeklasse sagt, wie streng Brandschutz und Rettungswege geregelt sind. Klasse 1: freistehend, bis 7 m hoch (Fußboden des obersten Geschosses mit Aufenthaltsräumen über dem Gelände), höchstens 2 Wohnungen, zusammen bis 400 m². Klasse 2: wie 1, aber angebaut. Unten steht mit Quelle, was Ihr Land für diese Klassen 1 und 2 sagt. Die Klassen 3 bis 5 (bis 7 m, bis 13 m, alles Übrige) sind eine Annahme nach der Musterbauordnung und für Ihr Land nicht gelesen. Den Vorschlag rechnet die Seite aus Ihrem Plan; Sie können ihn jederzeit ändern. Im Zweifel zählt, was das Bauamt sagt.',
    en: 'The building class says how strict fire protection and escape routes are. Class 1: detached, up to 7 m high (floor of the top storey with living rooms above ground), at most 2 dwellings, together up to 400 m². Class 2: like 1, but attached. Below you find what your state says about classes 1 and 2, with source. Classes 3 to 5 (up to 7 m, up to 13 m, everything else) are an assumption based on the model building code and have not been read for your state. The page works out the suggestion from your plan; you can change it at any time. When in doubt, the building authority decides.',
    ru: 'Класс здания показывает, насколько строги правила пожарной безопасности и путей эвакуации. Класс 1: отдельно стоящий, до 7 м (пол верхнего жилого этажа над землёй), не более 2 квартир, вместе до 400 м². Класс 2: как 1, но пристроенный. Ниже с источником показано, что говорит ваша земля о классах 1 и 2. Классы 3-5 (до 7 м, до 13 м, всё остальное) это допущение по типовому строительному кодексу, для вашей земли они не прочитаны. Предложение страница считает по вашему плану; его можно изменить. В сомнительных случаях решает строительный надзор.'
  },
  gkSatzAuto: {
    de: 'Vorschlag aus Ihrem Plan: Klasse {gk} (oberstes Geschoss etwa {hoehe} m über dem Gelände, Fläche etwa {bgf} m², {wohn} Wohnung(en)). Das ist eine Schätzung.',
    en: 'Suggestion from your plan: class {gk} (top storey about {hoehe} m above ground, area about {bgf} m², {wohn} dwelling(s)). This is an estimate.',
    ru: 'Предложение по вашему плану: класс {gk} (верхний этаж около {hoehe} м над землёй, площадь около {bgf} м², квартир: {wohn}). Это оценка.'
  },
  gkSatzGewaehlt: {
    de: 'Gewählt: Klasse {gk}. Der Plan würde Klasse {v} vorschlagen (oberstes Geschoss etwa {hoehe} m über dem Gelände, Fläche etwa {bgf} m², {wohn} Wohnung(en)).',
    en: 'Chosen: class {gk}. The plan would suggest class {v} (top storey about {hoehe} m above ground, area about {bgf} m², {wohn} dwelling(s)).',
    ru: 'Выбрано: класс {gk}. План предложил бы класс {v} (верхний этаж около {hoehe} м над землёй, площадь около {bgf} м², квартир: {wohn}).'
  },
  hausKurz: { de: 'Klasse {gk} · {wohn} Wohnung(en) · {frei}', en: 'Class {gk} · {wohn} dwelling(s) · {frei}', ru: 'Класс {gk} · квартир: {wohn} · {frei}' },
  hausKurzFrei: { de: 'freistehend', en: 'detached', ru: 'отдельно стоящий' },
  hausKurzAn: { de: 'angebaut', en: 'attached', ru: 'пристроенный' },
  gkSatzLeer: { de: 'Sobald Räume gezeichnet sind, schlägt die Seite hier eine Klasse vor. Bis dahin gilt Klasse 1.', en: 'As soon as rooms are drawn, the page suggests a class here. Until then class 1 applies.', ru: 'Когда комнаты нарисованы, страница предложит здесь класс. До этого действует класс 1.' },
  gkNehmen: { de: 'Vorschlag übernehmen', en: 'Use the suggestion', ru: 'Принять предложение' },
  gkAnnahme: { de: 'Annahme: Die Klassen 3 bis 5 (Grenze 13 m) stammen aus der Musterbauordnung und sind für {land} nicht gelesen.', en: 'Assumption: classes 3 to 5 (13 m limit) come from the model building code and have not been read for {land}.', ru: 'Допущение: классы 3-5 (граница 13 м) взяты из типового строительного кодекса и для земли {land} не прочитаны.' },
  gkLandHinweis: { de: 'Saarland und Rheinland-Pfalz definieren die Klassen leicht anders als die Musterbauordnung.', en: 'Saarland and Rhineland-Palatinate define the classes slightly differently from the model building code.', ru: 'Саар и Рейнланд-Пфальц определяют классы немного иначе, чем типовой строительный кодекс.' },
  nutzTitel: { de: 'Wofür wird der Raum genutzt?', en: 'What is the room used for?', ru: 'Для чего используется комната?' },
  nutzWaehlen: { de: 'Nutzung wählen', en: 'Choose a use', ru: 'Выбрать назначение' },
  nutzAuto: { de: '(aus dem Namen erkannt)', en: '(recognised from the name)', ru: '(определено по названию)' },
  nutzHilfe: { de: 'Die Nutzung bestimmt, welche Regeln für den Raum gelten, z. B. Mindesthöhe und Fenster für einen Aufenthaltsraum, nicht aber für ein Bad.', en: 'The use decides which rules apply to the room, e.g. minimum height and windows for a living space, but not for a bathroom.', ru: 'Назначение определяет, какие правила действуют для комнаты, например минимальная высота и окна для жилой комнаты, но не для ванной.' },
  nutzWohnen: { de: 'Wohnen', en: 'Living', ru: 'Гостиная' },
  nutzSchlafen: { de: 'Schlafen', en: 'Sleeping', ru: 'Спальня' },
  nutzKind: { de: 'Kinderzimmer', en: 'Children\'s room', ru: 'Детская' },
  nutzArbeiten: { de: 'Arbeiten', en: 'Working', ru: 'Кабинет' },
  nutzKueche: { de: 'Küche', en: 'Kitchen', ru: 'Кухня' },
  nutzEssen: { de: 'Essen', en: 'Dining', ru: 'Столовая' },
  nutzBad: { de: 'Bad', en: 'Bathroom', ru: 'Ванная' },
  nutzWc: { de: 'WC', en: 'Toilet', ru: 'Туалет' },
  nutzFlur: { de: 'Flur', en: 'Hallway', ru: 'Коридор' },
  nutzAbstell: { de: 'Abstellraum', en: 'Storage room', ru: 'Кладовая' },
  nutzTechnik: { de: 'Technik', en: 'Utility room', ru: 'Тех. комната' },
  nutzTreppe: { de: 'Treppe', en: 'Stairs', ru: 'Лестница' },
  nutzSonstiges: { de: 'Sonstiges', en: 'Other', ru: 'Другое' },

  /* ---------- Welle C: Karte „Regeln prüfen“ ---------- */
  regTitel: { de: 'Regeln prüfen', en: 'Check the rules', ru: 'Проверить правила' },
  regHilfe: {
    de: 'Die Ampel prüft Maße aus Ihrer Zeichnung gegen die Landesbauordnung des gewählten Landes: Raumhöhe, Fensterfläche, Rettungsfenster, Brüstung und welche Räume eine Wohnung haben muss. Grün passt, Gelb heißt prüfen oder Ausnahme, Rot passt nicht. Über das „?“ sehen Sie Paragraf, Wortlaut, Quelle und Abrufdatum. Faustregeln der Architekten zur Raumgröße und Flurbreite sind als eigene Einordnung markiert und ändern die Ampel nicht. Zu wenig Platz vor einem Möbel zeigt die Seite gelb, ebenfalls als eigene Einordnung. Der Status „prüfen vor Nutzung“ heißt: Die Quelle ist nicht der amtliche Gesetzestext.',
    en: 'The traffic light checks measurements from your drawing against the state building code of the chosen state: room height, window area, escape windows, parapet and which rooms a dwelling must have. Green fits, yellow means check or exception, red does not fit. The "?" shows section, wording, source and retrieval date. Architects\' rules of thumb on room size and hallway width are marked as our own classification and do not change the light. Too little space in front of furniture shows yellow, also as our own classification. The status "check before use" means the source is not the official legal text.',
    ru: 'Светофор проверяет размеры из вашего чертежа по строительному кодексу выбранной земли: высоту комнат, площадь окон, аварийные окна, парапет и какие помещения нужны в квартире. Зелёный подходит, жёлтый означает проверить или исключение, красный не подходит. Через «?» видны параграф, текст, источник и дата получения. Эмпирические правила архитекторов о размерах комнат и ширине коридора отмечены как собственная оценка и светофор не меняют. Нехватку места перед мебелью страница показывает жёлтым, тоже как собственную оценку. Статус «проверить перед использованием» означает, что источник не является официальным текстом закона.'
  },
  regKeinBaurecht: { de: 'Das ist keine Baugenehmigung und keine Statik. Ob gebaut werden darf, entscheiden Bauamt, Statiker und Architekt.', en: 'This is not a building permit and not a structural analysis. The building authority, a structural engineer and an architect decide whether you may build.', ru: 'Это не разрешение на строительство и не расчёт конструкций. Решают строительный надзор, инженер-конструктор и архитектор.' },
  regFehlerKern: { de: 'Die Regelprüfung konnte nicht gestartet werden: Der Regelkern (regeln_kern.js) fehlt in dieser Fassung der Seite.', en: 'The rule check could not start: the rule engine (regeln_kern.js) is missing in this version of the page.', ru: 'Проверку правил не удалось запустить: в этой версии страницы нет модуля правил (regeln_kern.js).' },
  regFehlerPlan: { de: 'Die Regelprüfung konnte nicht gestartet werden: Der Grundriss-Bereich ist nicht geladen.', en: 'The rule check could not start: the floor plan area is not loaded.', ru: 'Проверку правил не удалось запустить: раздел планировки не загружен.' },
  regFehlerDaten: { de: 'Die Bauregeln dieses Landes konnten nicht geladen werden (Daten fehlen). Bitte die Seite neu laden, sonst beim Bauamt fragen.', en: 'The building rules of this state could not be loaded (data missing). Please reload the page, otherwise ask the building authority.', ru: 'Строительные правила этой земли не удалось загрузить (нет данных). Перезагрузите страницу, иначе спросите в строительном надзоре.' },
  regSummeAria: { de: 'Zusammenfassung der Ampeln', en: 'Summary of the traffic lights', ru: 'Сводка светофоров' },
  ampelGruen: { de: 'passt', en: 'fits', ru: 'в порядке' },
  ampelGelb: { de: 'prüfen', en: 'check', ru: 'проверить' },
  ampelRot: { de: 'passt nicht', en: 'does not fit', ru: 'не подходит' },
  ampelNeutral: { de: 'nicht geprüft', en: 'not checked', ru: 'не проверено' },
  statusGeprueft: { de: 'geprüft', en: 'verified', ru: 'проверено' },
  statusPortal: { de: 'geprüft (Landesportal)', en: 'verified (state portal)', ru: 'проверено (портал земли)' },
  statusPruefen: { de: 'prüfen vor Nutzung', en: 'check before use', ru: 'проверить перед использованием' },
  statusLuecke: { de: 'nicht gelesen', en: 'not read', ru: 'не прочитано' },
  regAbruf: { de: 'Abruf {datum}', en: 'Retrieved {datum}', ru: 'Получено {datum}' },
  regGiltAb: { de: 'gilt ab {datum}', en: 'applies from {datum}', ru: 'действует с {datum}' },
  regGiltBis: { de: 'gilt bis {datum}', en: 'applies until {datum}', ru: 'действует до {datum}' },
  regRueckfall: { de: 'Die geltende Fassung nennt keinen Zahlenwert, es gilt der frühere Wert.', en: 'The version in force has no figure, so the earlier value is used.', ru: 'В действующей редакции нет числового значения, используется прежнее.' },
  regEigen: { de: 'Eigene Einordnung (Faustregel aus Ratgebern), keine Rechtsvorgabe.', en: 'Our own classification (rule of thumb from guides), not a legal requirement.', ru: 'Собственная оценка (эмпирическое правило из руководств), не требование закона.' },
  regEigenKurz: { de: 'Faustregel', en: 'rule of thumb', ru: 'эмпирическое правило' },
  regGekuerzt: { de: 'Wortlaut gekürzt: den ganzen Text lesen Sie über den Link zur Quelle.', en: 'Wording shortened: read the full text through the source link.', ru: 'Текст сокращён: полный текст по ссылке на источник.' },
  regQuelle: { de: 'Quelle', en: 'Source', ru: 'Источник' },
  regKeinLink: { de: 'kein Link', en: 'no link', ru: 'нет ссылки' },
  regKeineQuelle: { de: 'Keine Quelle abrufbar.', en: 'No source available.', ru: 'Источник недоступен.' },
  regBelegKnopf: { de: 'Paragraf, Wortlaut und Quelle zeigen', en: 'Show section, wording and source', ru: 'Показать параграф, текст и источник' },
  regAllesGut: { de: 'Alles in Ordnung.', en: 'Everything fits.', ru: 'Всё в порядке.' },
  regNichtsZuPruefen: { de: 'Für diese Nutzung gibt es hier nichts zu prüfen.', en: 'There is nothing to check here for this use.', ru: 'Для этого назначения здесь нечего проверять.' },
  regStichtag: { de: 'Regeln für {land}, Stand der Daten {stand}, gültig am {datum}.', en: 'Rules for {land}, data as of {stand}, valid on {datum}.', ru: 'Правила для земли {land}, данные на {stand}, действительны на {datum}.' },
  regKnopf: { de: 'Regeln prüfen', en: 'Check rules', ru: 'Проверить правила' },
  regKnopfZahl: { de: '{g} passen, {y} prüfen, {r} passen nicht', en: '{g} fit, {y} to check, {r} do not fit', ru: 'в порядке: {g}, проверить: {y}, не подходят: {r}' },
  regLandAendern: { de: 'Bundesland ändern', en: 'Change state', ru: 'Сменить землю' },
  regRohbau: { de: 'Fenstermaße aus Ihrem Plan gelten als Rohbaumaß (Öffnung in der Wand).', en: 'Window sizes from your plan count as rough opening size (opening in the wall).', ru: 'Размеры окон из вашего плана считаются размерами проёма в стене.' },
  regHaus: { de: 'Ganzes Haus', en: 'Whole house', ru: 'Весь дом' },
  regLeer: { de: 'Zeichnen Sie Räume oder laden Sie eine Vorlage, dann erscheint hier die Ampel für jeden Raum.', en: 'Draw rooms or load a template, and the traffic light for every room appears here.', ru: 'Нарисуйте комнаты или загрузите шаблон, и здесь появится светофор для каждой комнаты.' },
  rgLuecke: { de: 'Für {land} ist diese Regel noch nicht gelesen: bitte beim Bauamt fragen.', en: 'For {land} this rule has not been read yet: please ask the building authority.', ru: 'Для земли {land} это правило ещё не прочитано: спросите в строительном надзоре.' },
  rgNutzung: { de: 'Nutzung des Raums wählen, dann prüfe ich genauer.', en: 'Choose the room use, then I can check more closely.', ru: 'Выберите назначение комнаты, тогда проверка будет точнее.' },
  rgHoeheOk: { de: 'Raumhöhe {ist} m, verlangt sind mindestens {soll} m.', en: 'Room height {ist} m, at least {soll} m required.', ru: 'Высота комнаты {ist} м, требуется не менее {soll} м.' },
  rgHoeheDachOk: { de: 'Raumhöhe im Dach {ist} m, verlangt sind {soll} m über mindestens der halben Fläche.', en: 'Room height in the roof space {ist} m, {soll} m required over at least half the floor area.', ru: 'Высота в мансарде {ist} м, требуется {soll} м не менее чем на половине площади.' },
  rgHoeheDach: { de: 'Dachraum: Raumhöhe {ist} m, verlangt sind {soll} m über mindestens der halben Fläche. Niedrige Schrägen (jetzt {niedrig} %) genau nachmessen.', en: 'Roof space: room height {ist} m, {soll} m required over at least half the floor area. Measure low slopes (now {niedrig} %) carefully.', ru: 'Мансарда: высота {ist} м, требуется {soll} м не менее чем на половине площади. Низкие скаты (сейчас {niedrig} %) измерьте точно.' },
  rgHoeheAusnahme: { de: 'Raumhöhe {ist} m ist unter {soll} m. Für Wohnhäuser der Gebäudeklasse {gk} nimmt dieses Land die Mindesthöhe aus. Beim Bauamt klären.', en: 'Room height {ist} m is below {soll} m. For houses of building class {gk} this state exempts the minimum height. Clarify with the building authority.', ru: 'Высота {ist} м меньше {soll} м. Для жилых домов класса {gk} эта земля не требует минимальной высоты. Уточните в строительном надзоре.' },
  rgHoeheErmessen: { de: 'Raumhöhe {ist} m: Statt {soll} m lässt dieses Land {ersatz} m nur nach Ermessen der Behörde zu. Antrag nötig.', en: 'Room height {ist} m: instead of {soll} m this state allows {ersatz} m only at the authority\'s discretion. An application is needed.', ru: 'Высота {ist} м: вместо {soll} м эта земля допускает {ersatz} м только по усмотрению ведомства. Нужна заявка.' },
  rgHoeheErsatz: { de: 'Raumhöhe {ist} m: In Gebäudeklasse 1 und 2 genügen in diesem Land {ersatz} m statt {soll} m.', en: 'Room height {ist} m: in building classes 1 and 2 this state accepts {ersatz} m instead of {soll} m.', ru: 'Высота {ist} м: в классах 1 и 2 эта земля допускает {ersatz} м вместо {soll} м.' },
  rgHoeheZuNiedrig: { de: 'Raumhöhe {ist} m ist zu niedrig, verlangt sind mindestens {soll} m.', en: 'Room height {ist} m is too low, at least {soll} m required.', ru: 'Высота {ist} м слишком мала, требуется не менее {soll} м.' },
  rgFensterOk: { de: 'Fenster {ist} m² bei verlangten {soll} m² (ein {bruch} der Raumfläche).', en: 'Windows {ist} m² against {soll} m² required ({bruch} of the floor area).', ru: 'Окна {ist} м² при требуемых {soll} м² ({bruch} площади комнаты).' },
  rgFensterZuKlein: { de: 'Fenster nur {ist} m², verlangt sind {soll} m² (ein {bruch} der Raumfläche).', en: 'Windows only {ist} m², {soll} m² required ({bruch} of the floor area).', ru: 'Окна всего {ist} м², требуется {soll} м² ({bruch} площади комнаты).' },
  rgFensterFehlt: { de: 'Kein Fenster an einer Wand dieses Raums. Verlangt sind {soll} m² (ein {bruch} der Raumfläche).', en: 'No window on a wall of this room. {soll} m² required ({bruch} of the floor area).', ru: 'У стен комнаты нет окна. Требуется {soll} м² ({bruch} площади комнаты).' },
  rgUkSatz: { de: ', Unterkante höchstens {uk} m', en: ', lower edge at most {uk} m', ru: ', нижняя кромка не выше {uk} м' },
  rgRettungOk: { de: 'Mindestens ein Fenster eignet sich als Rettungsfenster ({breite} × {hoehe} m{ukSatz}).', en: 'At least one window works as an escape window ({breite} × {hoehe} m{ukSatz}).', ru: 'Хотя бы одно окно подходит как аварийное ({breite} × {hoehe} м{ukSatz}).' },
  rgRettungPruefen: { de: 'Zweiten Rettungsweg prüfen: Kein Fenster erreicht {breite} × {hoehe} m{ukSatz}. Ein zweiter Weg (Treppe oder Feuerwehr-Leiter) muss möglich sein.', en: 'Check the second escape route: no window reaches {breite} × {hoehe} m{ukSatz}. A second route (stairs or fire brigade ladder) must be possible.', ru: 'Проверьте второй путь эвакуации: ни одно окно не достигает {breite} × {hoehe} м{ukSatz}. Нужен второй путь (лестница или пожарная лестница).' },
  rgBruestungOk: { de: 'Brüstungen mindestens {soll} m: in Ordnung.', en: 'Parapets at least {soll} m: fine.', ru: 'Парапеты не ниже {soll} м: в порядке.' },
  rgBruestungNiedrig: { de: '{n} Fenster mit Brüstung unter {soll} m (niedrigste {kleinste} m). Absturzsicherung, z. B. Geländer oder Verglasung, einplanen.', en: '{n} window(s) with a parapet below {soll} m (lowest {kleinste} m). Plan fall protection, e.g. a railing or glazing.', ru: 'Окон с парапетом ниже {soll} м: {n} (самый низкий {kleinste} м). Предусмотрите защиту от падения, например ограждение или остекление.' },
  rgBruestungKeinWert: { de: 'In diesem Land nennt das Gesetz keinen festen Wert für die Brüstung. Eine sichere Absturzhöhe bleibt trotzdem nötig.', en: 'In this state the law gives no fixed value for the parapet. A safe fall height is still required.', ru: 'В этой земле закон не называет точной высоты парапета. Безопасная высота ограждения всё равно нужна.' },
  rgRauch: { de: 'Rauchwarnmelder einplanen (mindestens {n} in diesem Raum).', en: 'Plan smoke alarms (at least {n} in this room).', ru: 'Предусмотрите дымовые извещатели (не менее {n} в этой комнате).' },
  rgTuerSchmal: { de: '{n} Tür(en) schmaler als 90 cm. Empfehlung: 90 cm, damit Rollstuhl und Kinderwagen durchkommen.', en: '{n} door(s) narrower than 90 cm. Recommendation: 90 cm so wheelchairs and prams fit through.', ru: 'Дверей уже 90 см: {n}. Рекомендация: 90 см, чтобы проходили коляска и инвалидное кресло.' },
  rgTuerSchmalPflicht: { de: '{n} Tür(en) schmaler als 90 cm. Dieses Land verlangt barrierefreie Wohnungen ab mehr als {schwelle} Wohnungen.', en: '{n} door(s) narrower than 90 cm. This state requires accessible dwellings from more than {schwelle} dwellings.', ru: 'Дверей уже 90 см: {n}. Эта земля требует доступные квартиры при числе квартир больше {schwelle}.' },
  rgBewegungEng: { de: 'Keine freie Fläche von {cm} × {cm} cm im Raum. Empfehlung für Rollator und Rollstuhl.', en: 'No free area of {cm} × {cm} cm in the room. Recommended for walkers and wheelchairs.', ru: 'В комнате нет свободной площадки {cm} × {cm} см. Рекомендуется для ходунков и кресла-коляски.' },
  rgBewegungEngPflicht: { de: 'Keine freie Fläche von {cm} × {cm} cm im Raum. Bei barrierefreien Wohnungen verlangt.', en: 'No free area of {cm} × {cm} cm in the room. Required for accessible dwellings.', ru: 'В комнате нет свободной площадки {cm} × {cm} см. Требуется для доступных квартир.' },
  rgFaustKlein: { de: 'Mit {ist} m² eher klein. Faustregel der Architekten: ab {soll} m².', en: 'At {ist} m² rather small. Architects\' rule of thumb: from {soll} m².', ru: 'При {ist} м² скорее мала. Правило архитекторов: от {soll} м².' },
  rgFaustFlur: { de: 'Flur nur {ist} m breit. Faustregel: mindestens {soll} m.', en: 'Hallway only {ist} m wide. Rule of thumb: at least {soll} m.', ru: 'Коридор шириной всего {ist} м. Правило: не менее {soll} м.' },
  rgFreiEng: { de: 'Vor „{moebel}“ sollen {cm} cm frei bleiben, aber {mit} steht im Weg.', en: '{cm} cm should stay free in front of "{moebel}", but {mit} is in the way.', ru: 'Перед «{moebel}» должно быть свободно {cm} см, но мешает: {mit}.' },
  freiMitWand: { de: 'eine Wand', en: 'a wall', ru: 'стена' },
  freiMitMoebel: { de: 'ein anderes Möbel ({name})', en: 'another piece of furniture ({name})', ru: 'другая мебель ({name})' },
  rgKuecheOk: { de: 'Küche oder Kochnische ist vorhanden.', en: 'A kitchen or kitchenette is there.', ru: 'Кухня или кухонная ниша есть.' },
  rgKuecheFehlt: { de: 'Küche oder Kochnische fehlt (je Wohnung verlangt).', en: 'A kitchen or kitchenette is missing (required per dwelling).', ru: 'Нет кухни или кухонной ниши (требуется в каждой квартире).' },
  rgKuecheTechnisch: { de: 'In diesem Land müssen nur die Anschlüsse für eine Küche vorbereitet sein.', en: 'In this state only the connections for a kitchen must be prepared.', ru: 'В этой земле нужно подготовить только подключения для кухни.' },
  rgKuecheKeine: { de: 'In diesem Land steht keine ausdrückliche Pflicht für eine Küche im Gesetz.', en: 'In this state the law has no explicit duty for a kitchen.', ru: 'В законе этой земли нет прямого требования о кухне.' },
  rgBadOk: { de: 'Bad und Toilette sind vorhanden.', en: 'Bathroom and toilet are there.', ru: 'Ванная и туалет есть.' },
  rgBadFehlt: { de: 'Bad mit Wanne oder Dusche fehlt (je Wohnung verlangt).', en: 'A bathroom with bath or shower is missing (required per dwelling).', ru: 'Нет ванной с ванной или душем (требуется в каждой квартире).' },
  rgWcOk: { de: 'Toilette ist vorhanden (dieses Land verlangt nur eine Toilette).', en: 'A toilet is there (this state only requires a toilet).', ru: 'Туалет есть (эта земля требует только туалет).' },
  rgWcFehlt: { de: 'Toilette fehlt (je Wohnung verlangt).', en: 'A toilet is missing (required per dwelling).', ru: 'Нет туалета (требуется в каждой квартире).' },
  rgAbstellOk: { de: 'Abstellraum ist vorhanden.', en: 'A storage room is there.', ru: 'Кладовая есть.' },
  rgAbstellFehlt: { de: 'Abstellraum fehlt: Dieses Land verlangt einen ausreichend großen je Wohnung.', en: 'A storage room is missing: this state requires a large enough one per dwelling.', ru: 'Нет кладовой: эта земля требует достаточно большую кладовую в каждой квартире.' },
  rgAbstellFehltMass: { de: 'Abstellraum fehlt: Dieses Land verlangt mindestens {mind} m² je Wohnung.', en: 'A storage room is missing: this state requires at least {mind} m² per dwelling.', ru: 'Нет кладовой: эта земля требует не менее {mind} м² в каждой квартире.' },
  rgAbstellKlein: { de: 'Abstellraum {ist} m² je Wohnung, verlangt sind mindestens {mind} m².', en: 'Storage room {ist} m² per dwelling, at least {mind} m² required.', ru: 'Кладовая {ist} м² на квартиру, требуется не менее {mind} м².' },

  /* ---------- Welle C: Darf ich das ohne Genehmigung? ---------- */
  genTitel: { de: 'Darf ich das ohne Genehmigung?', en: 'May I do this without a permit?', ru: 'Можно ли это без разрешения?' },
  genHilfe: { de: 'Bei manchen Umbauten braucht man keinen Bauantrag („verfahrensfrei“). Hier sehen Sie, was Ihr Bundesland dazu sagt; Paragraf, Wortlaut und Quelle zeigt das „?“ bei jeder Zeile.', en: 'Some conversions need no building application ("exempt from procedure"). Here you see what your state says; the "?" on each line shows section, wording and source.', ru: 'Для некоторых переделок не нужна заявка на строительство («без процедуры»). Здесь видно, что говорит ваша земля; «?» у каждой строки показывает параграф, текст и источник.' },
  genWarn: { de: 'Verfahrensfrei heißt nur: kein Bauantrag nötig. Es heißt nicht, dass keine Regeln gelten. Statik, Brandschutz, Abstände und Denkmalschutz bleiben.', en: 'Exempt from procedure only means: no building application needed. It does not mean no rules apply. Structure, fire protection, distances and heritage protection remain.', ru: '«Без процедуры» значит лишь: заявка не нужна. Это не значит, что правил нет. Конструкции, пожарная безопасность, расстояния и охрана памятников остаются.' },
  genAntwort: { de: 'Das sagt das Land:', en: 'What the state says:', ru: 'Что говорит земля:' },
  genInnen: { de: 'Nicht tragende Wände versetzen oder entfernen', en: 'Move or remove non-load-bearing walls', ru: 'Переносить или убирать несущие перегородки' },
  genTragend: { de: 'Tragende Bauteile ändern', en: 'Change load-bearing parts', ru: 'Менять несущие элементы' },
  genDach: { de: 'Dachgeschoss ausbauen', en: 'Convert the attic', ru: 'Обустроить мансарду' },
  genSolar: { de: 'Solaranlage auf Dach oder Wand', en: 'Solar system on roof or wall', ru: 'Солнечная установка на крыше или стене' },
  genLand: { de: 'Gilt für {land} ({lbo}).', en: 'Applies to {land} ({lbo}).', ru: 'Действует для земли {land} ({lbo}).' },
  genEntscheidet: { de: 'Ob es im Einzelfall geht, entscheiden Bauamt, Statiker und Architekt. Bei Denkmal oder Bebauungsplan können strengere Regeln gelten.', en: 'Whether it works in your case is decided by the building authority, a structural engineer and an architect. Heritage buildings or a development plan can bring stricter rules.', ru: 'Подходит ли это в вашем случае, решают строительный надзор, инженер-конструктор и архитектор. Для памятников или плана застройки правила могут быть строже.' },

  /* ---------- Welle C: Freiflächen, Treppe in der Wohnfläche, Bestand ---------- */
  freiKnopf: { de: 'Freiflächen zeigen', en: 'Show free space', ru: 'Показать свободное место' },
  freiLegende: { de: 'Schraffiert: Platz, der vor dem Möbel frei bleiben soll. Rot schraffiert: Dort steht eine Wand oder ein anderes Möbel im Weg. Die Maße sind Richtwerte (DIN 18040-2 über BauNetz), keine Rechtsvorgabe.', en: 'Hatched: space that should stay free in front of the furniture. Red hatching: a wall or other furniture is in the way. The sizes are guide values (DIN 18040-2 via BauNetz), not a legal requirement.', ru: 'Штриховка: место, которое должно оставаться свободным перед мебелью. Красная штриховка: мешает стена или другая мебель. Размеры ориентировочные (DIN 18040-2 по BauNetz), не требование закона.' },
  wohnTreppeAbzug: { de: 'Davon abgezogen: Treppe {qm} (zählt nicht zur Wohnfläche, WoFlV § 3 Abs. 3 Nr. 2).', en: 'Deducted: stairs {qm} (not counted as living area, WoFlV § 3 para. 3 no. 2).', ru: 'Вычтено: лестница {qm} (не входит в жилую площадь, WoFlV § 3 абз. 3 п. 2).' },
  teilBestandGruppe: { de: 'Schon vorhanden oder neu?', en: 'Already there or new?', ru: 'Уже есть или новое?' },
  teilBestand: { de: 'Schon da (Bestand)', en: 'Already there (existing)', ru: 'Уже есть' },
  teilNeu: { de: 'Neu einbauen', en: 'Install new', ru: 'Установить новое' },
  teilBestandHinweis: { de: 'Bestand: Das Teil gibt es schon, es kostet keinen Umbau.', en: 'Existing: the part is already there, so it costs no conversion.', ru: 'Существующее: деталь уже есть, переделка не стоит денег.' },
  teilNeuHinweis: { de: 'Neu: Das Teil wird eingebaut und steht in der Kostenliste.', en: 'New: the part will be installed and appears in the cost list.', ru: 'Новое: деталь будет установлена и попадёт в список затрат.' }
};
