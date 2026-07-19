# Valoreon – Brand Kit

Arbeitsstand: Juli 2026 · aktuell pausierte Designrichtung  
Projektordner: `kartenblick`  
Markenname: **Valoreon** (vor Verwendung noch Domain- und Markenrecherche durchführen)

Hinweis: Der Name Valoreon bleibt aktiv, die Navy-/Gold-Richtung wird im Moment jedoch nicht auf der Landingpage verwendet.

## Markenidee

Valoreon hilft dabei, Sammelkarten schnell einzuordnen und ihren Marktwert sichtbar zu machen. Die visuelle Idee ist daher **Entdeckung trifft Präzision**: ein klares V-Sigil als wiederkehrendes Zeichen, umgeben von Orientierungspunkten, Konstellationen und dynamischer Energie.

Die Marke ist nicht an Pokémon gebunden. Das ist wichtig, damit sie auf andere TCGs übertragbar bleibt und keine Nähe zu bestehenden Charaktermarken braucht.

## Logo

Das Logo ist ein abstraktes **V-Sigil**: ein dunkles, dynamisches V mit einer vierzackigen Gold-Glintmarke im Zentrum. Es steht für Value, Verifizierung und das Auffinden besonderer Karten.

| Asset | Einsatz |
| --- | --- |
| [`valoreon-sigil-comic-gold.png`](../public/brand/valoreon-sigil-comic-gold.png) | Brand-Key-Art, Landingpage, Social Media, Produkt-Header |

### Einsatzregeln

- Auf dunklem Navy-Hintergrund verwenden, damit das Gold leuchtet.
- Rundum mindestens eine halbe Zeichenbreite freien Raum lassen.
- Für Favicon, App-Icon und sehr kleine Größen später eine reine, einfarbige SVG-Version des V-Sigils ableiten.
- Das Comic-Sigil nicht verzerren, nachzeichnen oder mit Schatten, Verläufen und zusätzlichen Texturen versehen.
- Kein Tier, keine Karte, keine Münze und keine Pokémon-ähnliche Figur neben dem Zeichen einsetzen.

## Farben

| Rolle | Name | Hex | Einsatz |
| --- | --- | --- | --- |
| Primär | Valoreon Navy | `#071D3C` | Header, App-Hintergrund, Logo-Sigil |
| Dunkel | Ink Navy | `#0B2A52` | Karten, Flächen, Hover-Zustände |
| Akzent | Antique Gold | `#D79A25` | zentrale Wert-/Fundmarke, primäre CTA |
| Hellakzent | Signal Gold | `#F0AE2D` | Hover, Highlights, Diagrammpunkte |
| Sekundär | Index Teal | `#3F7F83` | Filter, Metadaten, Orbitlinien |
| Fläche hell | Archive | `#F7F3E8` | helle Seiten, Tabellenhintergründe |
| Text dunkel | Ink | `#11233B` | Text auf hellen Flächen |
| Text hell | Parchment | `#FFF7E4` | Text auf Navy |

### Kontrastregel

- Fließtext nur `Ink` auf `Archive` oder `Parchment` auf `Valoreon Navy`.
- Gold ist eine Akzentfarbe: keine längeren Texte in Gold setzen.
- Gold auf hellem Hintergrund nur für große, dekorative Elemente; bei UI-Text und Icons Navy verwenden.

## Typografie

Beide Familien sind frei nutzbar unter der **SIL Open Font License 1.1** und über Google Fonts bzw. `next/font/google` verfügbar.

| Einsatz | Schrift | Schnitte | Anwendung |
| --- | --- | --- | --- |
| Headlines, Zahlen, Preise | **Space Grotesk** | 600, 700 | klar, wertig, leicht technisch |
| Fließtext, UI, Tabellen | **Manrope** | 400, 500, 600, 700 | ruhig, gut lesbar, modern |

Empfohlene Hierarchie:

```text
H1: Space Grotesk 700 / 44–56 px / 1.05
H2: Space Grotesk 700 / 28–36 px / 1.15
Preis: Space Grotesk 700 / 24–32 px / 1.00
Body: Manrope 400 / 16 px / 1.55
UI: Manrope 600 / 14–16 px / 1.20
Meta: Manrope 500 / 12–13 px / 1.30
```

## Wiederkehrende Formen und Strukturen

### 1. V-Sigil

- Das V ist das zentrale Kennzeichen.
- Als große Key-Art darf es mit rauer Comic-Tusche erscheinen.
- In der App selbst als sauberes, geometrisches Zeichen verwenden.

### 2. Vierpunkt-Glint

- Eine asymmetrisch lange vierzackige Sternform steht für Fund, Treffer oder bestätigte Karte.
- Nur einmal pro Modul/Karte einsetzen; nicht als Aufzählungszeichen missbrauchen.

### 3. Index-Orbits

- Dünne Teal-Bögen und einzelne Punkte bilden ein abstraktes System aus Verbindungen.
- Gut für leere Zustände, Scan-Fortschritt, Hero-Bereiche und Hintergrundflächen.
- In produktiven Tabellen und Preisansichten nur sehr dezent verwenden.

### 4. Comic-Burst

- Handgezeichnete, nach außen laufende Navy- und Goldlinien.
- Ausschließlich für große emotionale Momente: Landingpage-Hero, Scan-Erfolg, Social Media.
- Niemals als Hintergrund hinter langen Texten oder Datenlisten.

### 5. Rasterpunkte

- Sparse Halbton-Punktfelder in Navy oder Gold.
- Als Randtextur, nie als vollflächiges Muster.

## UI-Stil

- 8-Pixel-Abstandsraster.
- Große, ruhige Flächen und klar getrennte Scan-Ergebnisse.
- Abgerundete Ecken: `12 px` für Karten, `999 px` für Chips.
- Primärer Button: Antique Gold mit Navy-Text.
- Sekundärer Button: transparenter Hintergrund, Navy-Umrandung, Navy-Text.
- Preise sind groß, Navy und tabellarisch gesetzt; Quelle und Zeitstempel bleiben klein und sachlich.

## Tonalität

Kurz, sachlich, neugierig. Nicht wie ein Preisratgeber mit Preisversprechen formulieren.

Beispiele:

- „Karte erkannt. Prüfe den Treffer.“
- „Trendpreis aktualisiert am 19. Juli, 09:30 Uhr.“
- „Möglicher Fund: bestätige die Variante.“

Vermeiden:

- „Diese Karte ist garantiert X € wert.“
- übertriebenes Hype-Vokabular und künstliche Seltenheitsversprechen.

## Nächster Designschritt

Vor dem Produktstart aus dem PNG eine finale Logo-Familie erstellen:

1. primäres V-Sigil als SVG (einfarbig Navy),
2. Goldversion für dunkle Flächen,
3. Favicon/App-Icon,
4. Wordmark `VALOREON` mit Space Grotesk 700 oder einer maßgeschneiderten Wortmarke.
