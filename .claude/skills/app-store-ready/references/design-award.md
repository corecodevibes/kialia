# Design-Qualitaet — was ausgezeichnete Apps gemeinsam haben

Zuerst die Einordnung aus `SKILL.md`: Apple waehlt die Gewinner selbst aus, und
ausgezeichnete Apps sind praktisch immer tief nativ. Diese Datei ist trotzdem
nuetzlich — weil dieselben Eigenschaften Verweildauer, Bewertungen und die
Chance auf redaktionelle Platzierung heben, und das sind erreichbare Ziele.

## Die Kategorien als Denkraster

Die Auszeichnung wird in mehreren Kategorien vergeben — ueblicherweise entlang
von Freude, Inklusion, Innovation, Interaktion, gesellschaftlicher Wirkung und
visueller Gestaltung. Die genaue Liste aendert sich; nuetzlich ist die Frage
dahinter: **In welcher einzelnen Disziplin waere diese App die beste, die
jemand kennt?** Eine App, die in allen sechs solide ist, gewinnt nichts. Eine,
die in einer herausragt, wird gesehen.

Fuer kialia ist die naheliegende Disziplin nicht die Karte und nicht das
Budget — es ist das **Reisetagebuch**: der Gedanke, dass der Tag sich selbst
schreibt und am Ende ein Buch daraus wird, das man in zehn Jahren wieder
ansieht. Das ist der Teil, der Menschen beruehrt. Dort lohnt sich der Aufwand.

## Was Auszeichnungsniveau praktisch heisst

**Ein Hero-Moment, nicht fuenf.** Eine Sache, die die App besser kann als alles
andere, und die man in den ersten Sekunden sieht. Alles andere ordnet sich
unter. Fuenf gleich laut vorgetragene Funktionen ergeben keinen Hero-Moment,
sondern ein Menue.

**Motion erklaert, statt zu schmuecken.** Jede Bewegung beantwortet eine Frage:
Woher kam das? Wohin ist es gegangen? Was haengt zusammen? Eine Bewegung pro
Interaktion, nicht drei. Wo nichts zu erklaeren ist, ist Stillstand die bessere
Wahl. Und `prefers-reduced-motion` ist keine Pflichtuebung — fuer Menschen mit
vestibulaeren Stoerungen ist eine ignorierte Einstellung koerperlich
unangenehm.

**Barrierefreiheit ist Teil der Gestaltung, nicht ein Nachtrag.** VoiceOver,
dynamische Schriftgroessen bis in die grossen Stufen ohne zerbrechendes Layout,
Kontraste, sichtbarer Tastaturfokus, Trefferflaechen ab 44 pt. Apps, die hier
ernsthaft arbeiten, fallen positiv auf — und es ist die einzige Kategorie, in
der Muehe direkt sichtbar wird.

**Die App geht auf den Nutzer zu.** Nicht als Werbe-Stupser, sondern weil sie
den Zusammenhang kennt: Abends auf der Reise die eine Frage nach dem Tag. Vor
der Abreise der Hinweis, dass etwas Gebuchtes noch offen ist. Nach der Reise
das Angebot, das Buch zu drucken. Der Unterschied zwischen aufdringlich und
aufmerksam ist, ob der Zeitpunkt aus dem Leben des Nutzers kommt oder aus dem
Interesse des Anbieters.

**Leere Zustaende sind entworfen.** Der erste Bildschirm einer neuen Nutzerin
ist immer leer — und wird fast immer zuletzt gestaltet. Er ist aber der
haeufigste erste Eindruck.

**Fehlerzustaende auch.** Kein Netz ist kein Fehler, sondern ein Zustand: zeig,
was trotzdem da ist. Und nie einen Servertext durchreichen.

**Handwerk, das niemand benennt, aber jeder spuert.** Tabellenziffern, damit
Betraege beim Aktualisieren nicht springen. Skelette statt Ladekreisel.
Dunkelmodus als eigener Entwurf, nicht als Umkehrung — abends im Flugzeug,
morgens am Gate. Haptik bei Bestaetigungen.

## Die Pruefung nach jedem Bildschirm

Drei Fragen, in dieser Reihenfolge:

1. Funktioniert er ohne Netz?
2. Stimmt jede Zahl darauf — und sieht man, woher sie kommt?
3. Wuesste ich in zwei Sekunden, warum ich dafuer bezahlen wuerde?

Wenn eine davon nicht mit Ja zu beantworten ist, ist der Bildschirm nicht
fertig — egal wie gut er aussieht.

## Widgets und Systemintegration

Der wirksamste Hebel Richtung Auszeichnungsniveau ist nicht mehr Politur in
der App, sondern **Praesenz ausserhalb davon**. Was auf dem Sperrbildschirm
steht, wird oefter gesehen als jeder Bildschirm der App.

Fuer kialia naheliegend: Countdown bis zur Abreise, heutiges Restbudget, die
naechste Station mit Uhrzeit in Ortszeit des Ziels, Erinnerung an die
Abendfrage. Alles aus Daten, die auf dem Geraet liegen — ein Widget, das auf
das Netz wartet, ist ein leeres Widget.

Das ist ein eigenes Vorhaben mit eigenem Aufwand. Erst planen, wenn die App
selbst steht.
