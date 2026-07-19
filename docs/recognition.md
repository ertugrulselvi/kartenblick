# Erkennung

Geplanter Ablauf:

1. Das Foto wird für den MVP in zwei Zonen zerlegt: Kartename im oberen Bereich und Kartennummer im unteren Bereich. Bei einem quer aufgenommenen Bild fällt die Erkennung auf das Gesamtbild zurück.
2. OCR liest Kartenname und Kartennummer direkt im Browser. Das Bild wird dafür nicht an Valoreon hochgeladen.
3. Eine serverseitige Suche in der Pokémon-TCG-API grenzt bis zu drei Treffer ein; Kartennummer hat Vorrang vor dem Namen.
4. Die Person bestätigt einen Treffer bewusst, bevor die Karte als erkannt gilt.

## Entwicklungsstand

- Ohne `POKEMON_TCG_API_KEY` arbeitet die Suche im kostenlosen Testlimit der Pokémon-TCG-API.
- Ein Key wird ausschließlich serverseitig über `.env.local` eingebunden und nie an den Browser ausgeliefert.
- Die API ist ein Drittanbieter-Katalog. Deutsche, japanische sowie besondere Druckvarianten brauchen in einem späteren Schritt einen ergänzten Varianten-Katalog.
4. Referenzbild und Textmerkmale bestimmen einen Confidence Score.
5. Unsichere Treffer werden mit bis zu drei Vorschlägen zur Bestätigung angezeigt.

Automatische Zustands- oder Grading-Erkennung gehört nicht zum ersten Release.
