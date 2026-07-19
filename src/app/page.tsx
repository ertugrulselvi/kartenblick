"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";

type CardCandidate = {
  id: string;
  name: string;
  number: string;
  setName: string;
  setTotal?: number;
  rarity?: string;
  image?: string;
};

type Upload = {
  id: string;
  name: string;
  preview: string;
  file: File;
  status: "ready" | "reading" | "review" | "confirmed" | "error";
  progress?: number;
  hints?: { name?: string; number?: string };
  candidates?: CardCandidate[];
  selected?: CardCandidate;
  message?: string;
};

type CatalogSearch = {
  query: string;
  normalized?: string;
  status: "searching" | "review" | "confirmed" | "error";
  candidates?: CardCandidate[];
  hints?: { name?: string; number?: string };
  selected?: CardCandidate;
  message: string;
};

type VoiceSearch = {
  transcript: string;
  normalized?: string;
  status: "listening" | "searching" | "review" | "confirmed" | "error";
  candidates?: CardCandidate[];
  hints?: { name?: string; number?: string };
  selected?: CardCandidate;
  message: string;
};

type VoiceRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type VoiceRecognitionConstructor = new () => VoiceRecognition;

const benefits = [
  ["01", "CM-Preis checken", "Low, Trend und Variante als Basis für deinen Trade."],
  ["02", "Last Sold vergleichen", "Sieh, was die Karte zuletzt wirklich gebracht hat."],
  ["03", "Tauschwert einschätzen", "Erkenne schnell, ob ein Angebot unter CM liegt."],
];

const POKEMON_CATALOG_TERMS: Record<string, string> = {
  bisaflor: "Venusaur", bisaknosp: "Ivysaur", bummelz: "Slakoth", dragoran: "Dragonite", dratini: "Dratini", evoli: "Eevee", flemli: "Torchic", garados: "Gyarados", gengar: "Gengar", geckarbor: "Treecko", gewaldro: "Sceptile", glurak: "Charizard", glurack: "Charizard", hydropi: "Mudkip", hydropie: "Mudkip", jungglut: "Combusken", koraidon: "Koraidon", lohgock: "Blaziken", lucario: "Lucario", miraidon: "Miraidon", mewtu: "Mewtwo", pikachu: "Pikachu", rayquaza: "Rayquaza", relaxo: "Snorlax", schiggy: "Squirtle", simsal: "Alakazam", sumpex: "Swampert", turtok: "Blastoise",
};

const GERMAN_NUMBER_WORDS: Record<string, number> = {
  null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwolf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19, zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, fünfzig: 50, funfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90,
};

function germanNumber(value: string): number | undefined {
  const word = value.toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
  if (/^\d{1,3}$/.test(word)) return Number(word);
  if (GERMAN_NUMBER_WORDS[word] !== undefined) return GERMAN_NUMBER_WORDS[word];
  const hundreds = word.match(/^(ein|eins|zwei|drei|vier|fünf|funf|sechs|sieben|acht|neun)?hundert(.*)$/);
  if (hundreds) {
    const leading = hundreds[1] ? germanNumber(hundreds[1]) : 1;
    const trailing = hundreds[2] ? germanNumber(hundreds[2]) : 0;
    return leading !== undefined && trailing !== undefined ? leading * 100 + trailing : undefined;
  }
  const compound = word.match(/^(ein|eins|zwei|drei|vier|fünf|funf|sechs|sieben|acht|neun)und(zwanzig|dreißig|dreissig|vierzig|fünfzig|funfzig|sechzig|siebzig|achtzig|neunzig)$/);
  if (compound) {
    const unit = germanNumber(compound[1]);
    const tens = germanNumber(compound[2]);
    return unit !== undefined && tens !== undefined ? unit + tens : undefined;
  }
  return undefined;
}

function normalizeCatalogQuery(query: string) {
  let normalized = query.toLowerCase();
  normalized = normalized.replace(/\b([a-zäöüß0-9]+)\s+von\s+([a-zäöüß0-9]+)\b/gi, (whole, numerator, denominator) => {
    const top = germanNumber(numerator);
    const bottom = germanNumber(denominator);
    return top !== undefined && bottom !== undefined ? `\n${top}/${bottom}\n` : whole;
  });
  for (const [spoken, catalogName] of Object.entries(POKEMON_CATALOG_TERMS)) {
    normalized = normalized.replace(new RegExp(`\\b${spoken}\\b`, "gi"), `\n${catalogName}\n`);
  }
  return normalized.replace(/\s*\/\s*/g, "/").replace(/\n{2,}/g, "\n").trim();
}

function editDistance(left: string, right: string) {
  const table = Array.from({ length: left.length + 1 }, (_, row) => Array.from({ length: right.length + 1 }, (_, column) => row === 0 ? column : column === 0 ? row : 0));
  for (let row = 1; row <= left.length; row += 1) for (let column = 1; column <= right.length; column += 1) table[row][column] = left[row - 1] === right[column - 1] ? table[row - 1][column - 1] : Math.min(table[row - 1][column], table[row][column - 1], table[row - 1][column - 1]) + 1;
  return table[left.length][right.length];
}

function fuzzyPokemonTerms(query: string) {
  const words = query.split(/(\s+)/);
  return words.map((part) => {
    const word = part.toLowerCase().replace(/[^a-zäöüß]/g, "");
    if (word.length < 5 || POKEMON_CATALOG_TERMS[word]) return part;
    const match = Object.keys(POKEMON_CATALOG_TERMS).find((term) => Math.abs(term.length - word.length) <= 1 && editDistance(term, word) <= 1);
    return match ? POKEMON_CATALOG_TERMS[match] : part;
  }).join("");
}

async function cropCardZone(file: File, zone: "name" | "number") {
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Das Foto konnte nicht für den Scan vorbereitet werden."));
      element.src = source;
    });
    if (image.naturalHeight < image.naturalWidth * 1.12) return file;

    const bounds = zone === "name"
      ? { x: 0.06, y: 0.02, width: 0.88, height: 0.22 }
      : { x: 0.05, y: 0.78, width: 0.9, height: 0.2 };
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = Math.round(canvas.width * (bounds.height * image.naturalHeight) / (bounds.width * image.naturalWidth));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Der Scanbereich konnte nicht vorbereitet werden.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.filter = "grayscale(1) contrast(1.7)";
    context.drawImage(image, image.naturalWidth * bounds.x, image.naturalHeight * bounds.y, image.naturalWidth * bounds.width, image.naturalHeight * bounds.height, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Der Scanbereich konnte nicht erstellt werden.")), "image/jpeg", 0.92));
  } finally {
    URL.revokeObjectURL(source);
  }
}

export default function Home() {
  const scanner = useRef<HTMLElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogSearch, setCatalogSearch] = useState<CatalogSearch | null>(null);
  const [voiceSearch, setVoiceSearch] = useState<VoiceSearch | null>(null);

  function updateUpload(id: string, changes: Partial<Upload>) {
    setUploads((current) => current.map((upload) => upload.id === id ? { ...upload, ...changes } : upload));
  }

  async function searchCatalog(text: string) {
    const response = await fetch("/api/cards/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const data = await response.json() as { candidates?: CardCandidate[]; hints?: { number?: string; names?: string[] }; error?: string };
    if (!response.ok) throw new Error(data.error ?? "Die Katalogsuche konnte nicht gestartet werden.");
    return data;
  }

  async function scanUpload(upload: Upload) {
    updateUpload(upload.id, { status: "reading", progress: 0, message: "Fokus-Scan: Kartenname oben, Kartennummer unten …" });
    try {
      const { recognize } = await import("tesseract.js");
      const nameZone = await cropCardZone(upload.file, "name");
      const numberZone = await cropCardZone(upload.file, "number");
      const nameResult = await recognize(nameZone, "eng", {
        logger: (event) => {
          if (event.status === "recognizing text" && typeof event.progress === "number") {
            updateUpload(upload.id, { progress: Math.round(event.progress * 55), message: "Kartenname wird gelesen …" });
          }
        },
      });
      const numberResult = await recognize(numberZone, "eng", {
        logger: (event) => {
          if (event.status === "recognizing text" && typeof event.progress === "number") {
            updateUpload(upload.id, { progress: 55 + Math.round(event.progress * 40), message: "Kartennummer wird gelesen …" });
          }
        },
      });
      const focusedText = `${nameResult.data.text}\n${numberResult.data.text}`.trim();
      if (focusedText.length < 3) throw new Error("Name und Kartennummer waren auf dem Bild nicht lesbar.");
      updateUpload(upload.id, { progress: 100, message: "Katalog wird durchsucht …" });
      let data = await searchCatalog(focusedText);
      if ((data.candidates?.length ?? 0) === 0) {
        updateUpload(upload.id, { message: "Kein Fokus-Treffer – Vollbild wird als Rückfall geprüft …" });
        const fullResult = await recognize(upload.file, "eng");
        if (fullResult.data.text.trim().length >= 3) data = await searchCatalog(fullResult.data.text);
      }
      const candidates = data.candidates ?? [];
      updateUpload(upload.id, candidates.length > 0 ? {
        status: "review", candidates, hints: { name: data.hints?.names?.[0], number: data.hints?.number }, message: "Bitte bestätige die passende Karte.",
      } : {
        status: "error", hints: { name: data.hints?.names?.[0], number: data.hints?.number }, message: "Kein sicherer Treffer. Fotografiere Name und Kartennummer möglichst scharf.",
      });
    } catch (error) {
      updateUpload(upload.id, { status: "error", message: error instanceof Error ? error.message : "Die Erkennung ist fehlgeschlagen." });
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return 0;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || /\.(avif|heic|heif|jpe?g|png|webp)$/i.test(file.name))
      .slice(0, 50 - uploads.length)
      .map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, preview: URL.createObjectURL(file), file, status: "reading" as const, message: "Foto angekommen. Karte wird vorbereitet …" }));
    setUploads((current) => [...current, ...next].slice(0, 50));
    next.forEach((upload) => void scanUpload(upload));
    return next.length;
  }

  function onFileSelected(event: ChangeEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) {
    if (!event.currentTarget.files?.length) return;
    const added = addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
    setScanNotice(added > 0 ? "Foto angekommen – Karte wird gelesen." : "Das Foto wurde gewählt, aber das Format konnte nicht gelesen werden.");
    window.setTimeout(() => scanner.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  function onCameraOpened() {
    setScanNotice("Kamera geöffnet – nach dem Foto startet die Erkennung automatisch.");
  }

  async function runCatalogSearch() {
    const query = catalogQuery.trim();
    if (!query) {
      setCatalogSearch({ status: "error", query: "", message: "Gib mindestens einen Kartennamen ein – idealerweise mit Kartennummer." });
      return;
    }
    const normalized = normalizeCatalogQuery(query);
    setCatalogSearch({ status: "searching", query, normalized, message: "Pokémonbegriff und Kartennummer werden abgeglichen …" });
    try {
      let data = await searchCatalog(normalized);
      if ((data.candidates?.length ?? 0) === 0 && normalized !== query) data = await searchCatalog(query);
      const candidates = data.candidates ?? [];
      setCatalogSearch(candidates.length > 0 ? { status: "review", query, normalized, candidates, hints: { name: data.hints?.names?.[0], number: data.hints?.number }, message: "Bitte bestätige die passende Karte." } : { status: "error", query, normalized, hints: { name: data.hints?.names?.[0], number: data.hints?.number }, message: "Kein eindeutiger Treffer. Prüfe Kartenname und Kartennummer." });
    } catch (error) {
      setCatalogSearch({ status: "error", query, normalized, message: error instanceof Error ? error.message : "Die Katalogsuche ist fehlgeschlagen." });
    }
  }

  function startVoiceSearch() {
    const speechWindow = window as typeof window & { SpeechRecognition?: VoiceRecognitionConstructor; webkitSpeechRecognition?: VoiceRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSearch({ status: "error", transcript: "", message: "Dein Browser unterstützt die Spracheingabe nicht. Nutze bitte Safari über die HTTPS-Vorschau." });
      return;
    }
    const recognition = new Recognition();
    let alternatives: string[] = [];
    recognition.lang = "de-DE";
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => setVoiceSearch({ status: "listening", transcript: "", message: "Ich höre zu – sag Name, Nummer und Besonderheit." });
    recognition.onresult = (event) => {
      alternatives = Array.from(event.results).flatMap((result) => Array.from(result).map((item) => item.transcript.trim())).filter(Boolean);
      setVoiceSearch({ status: "listening", transcript: alternatives[0] ?? "", message: "Ich höre zu – sag Name, Nummer und Besonderheit." });
    };
    recognition.onerror = (event) => setVoiceSearch({ status: "error", transcript: alternatives[0] ?? "", message: event.error === "not-allowed" ? "Mikrofon wurde nicht freigegeben." : `Spracheingabe fehlgeschlagen: ${event.error}` });
    recognition.onend = () => {
      if (alternatives.length === 0) return;
      void (async () => {
        const attempts = Array.from(new Set(alternatives.flatMap((spoken) => {
          const fuzzy = fuzzyPokemonTerms(spoken);
          const normalized = normalizeCatalogQuery(fuzzy);
          return [normalized, spoken];
        }))).filter(Boolean).slice(0, 6);
        const transcript = alternatives[0];
        setVoiceSearch({ status: "searching", transcript, normalized: attempts[0], message: "Pokémonbegriffe, Nummer und drei Sprachvarianten werden abgeglichen …" });
        try {
          let data: Awaited<ReturnType<typeof searchCatalog>> | undefined;
          for (const attempt of attempts) {
            const result = await searchCatalog(attempt);
            data = result;
            if ((result.candidates?.length ?? 0) > 0) break;
          }
          const candidates = data?.candidates ?? [];
          setVoiceSearch(candidates.length > 0 ? { status: "review", transcript, normalized: attempts[0], candidates, hints: { name: data?.hints?.names?.[0], number: data?.hints?.number }, message: "Bitte bestätige die passende Karte." } : { status: "error", transcript, normalized: attempts[0], message: "Kein eindeutiger Treffer. Sage Name und Kartennummer noch einmal deutlich." });
        } catch (error) {
          setVoiceSearch({ status: "error", transcript, normalized: attempts[0], message: error instanceof Error ? error.message : "Die Katalogsuche ist fehlgeschlagen." });
        }
      })();
    };
    recognition.start();
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#oben" aria-label="Valoreon Startseite"><span className="brand-mark">V</span><span>valoreon</span></a>
        <nav aria-label="Hauptnavigation"><a href="#so-funktionierts">So funktioniert&apos;s</a><a href="#ueber">Über Kartenblick</a></nav>
      </header>

      <section className="hero" id="oben">
        <div className="hero-copy">
          <p className="eyebrow">Für Trades · Binder · Flohmarkt</p>
          <h1>Deine Karten.<br /><em>Dein Tauschwert.</em></h1>
          <p className="hero-text">CM-Preise, Last Sold und Tauschwert auf einen Blick. Damit du weißt, ob dein Deal unter CM liegt.</p>
          <label className="text-link file-trigger">
            <input className="native-file-input" type="file" accept="image/*,.heic,.heif" capture="environment" onClick={onCameraOpened} onInput={onFileSelected} onChange={onFileSelected} />
            Jetzt Karte scannen <span>↗</span>
          </label>
        </div>
        <div className="hero-art" aria-label="Stilisierte Sammelkarte">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="showcase-card"><div className="card-topline"><span>FLAMMARA</span><span>HP 130</span></div><div className="card-illustration"><span>✦</span></div><div className="card-copy"><b>Feueratem</b><small>130</small></div><div className="card-number">136/165 · DE</div></div>
          <p className="floating-label">CM · Last Sold · Tauschwert</p>
        </div>
      </section>

      <section className="scanner-section" id="scanner" ref={scanner}>
        <div className="section-heading"><p className="eyebrow">MVP · Scan starten</p><h2>Ist dein Trade<br />unter CM?</h2><p>Scanne eine Karte und prüfe CM-Preise, Last Sold und deinen möglichen Tauschwert.</p></div>
        <div className="scanner-panel">
          <div className={`dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <div className="scan-icon" aria-hidden="true"><span /></div><h3>Direkt Karte scannen</h3><p>Öffnet die Rückkamera – halte die Karte hochkant ins Bild. Valoreon liest gezielt den Namen oben und die Nummer unten.</p>
            <div className="scan-actions"><label className="primary-button file-trigger"><input className="native-file-input" type="file" accept="image/*,.heic,.heif" capture="environment" onClick={onCameraOpened} onInput={onFileSelected} onChange={onFileSelected} />Kamera öffnen</label><label className="secondary-button file-trigger"><input className="native-file-input" type="file" accept="image/*,.heic,.heif" multiple onClick={() => setScanNotice("Mediathek geöffnet – nach der Auswahl startet die Erkennung automatisch.")} onInput={onFileSelected} onChange={onFileSelected} />Aus Galerie</label></div><small>Kamera: eine Karte · Galerie: bis zu 50 Bilder</small>
          </div>
          <div className="text-search-panel"><div><b>Katalog direkt testen</b><p>Tippe Kartenname und Kartennummer ein. Deutsche Pokémonnamen werden abgeglichen.</p></div><div className="text-search-controls"><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runCatalogSearch(); }} placeholder="z. B. Glurak 4/102 Holo" aria-label="Kartenname und Kartennummer" /><button type="button" onClick={() => void runCatalogSearch()}>Karte suchen</button></div></div>
          {catalogSearch && <div className={`text-search-result text-${catalogSearch.status}`} aria-live="polite"><p className="scan-state">{catalogSearch.status === "searching" ? "Katalogsuche läuft" : catalogSearch.status === "review" ? "Treffer prüfen" : catalogSearch.status === "confirmed" ? "Karte bestätigt" : "Suche braucht Hilfe"}</p><p className="scan-message">{catalogSearch.message}</p>{catalogSearch.query && <p className="text-query">Eingabe: „{catalogSearch.query}“</p>}{catalogSearch.normalized && catalogSearch.normalized !== catalogSearch.query && <p className="text-normalized">Abgleich: {catalogSearch.normalized.replace(/\n/g, " · ")}</p>}{catalogSearch.hints && <p className="scan-hints">Erkannt: {catalogSearch.hints.name ?? "Name unklar"}{catalogSearch.hints.number ? ` · ${catalogSearch.hints.number}` : ""}</p>}{catalogSearch.status === "review" && <div className="candidate-list">{catalogSearch.candidates?.map((candidate) => <button className="candidate" key={candidate.id} type="button" onClick={() => setCatalogSearch((current) => current ? { ...current, status: "confirmed", selected: candidate, message: `${candidate.name} ist für die Preisprüfung vorgemerkt.` } : current)}>{candidate.image && <img src={candidate.image} alt="" />}<span><b>{candidate.name}</b><small>{candidate.setName} · {candidate.number}{candidate.setTotal ? `/${candidate.setTotal}` : ""}</small></span><i>Auswählen</i></button>)}</div>}{catalogSearch.status === "confirmed" && catalogSearch.selected && <div className="confirmed-card"><img src={catalogSearch.selected.image} alt="" /><span><b>{catalogSearch.selected.name}</b><small>{catalogSearch.selected.setName} · {catalogSearch.selected.number}{catalogSearch.selected.setTotal ? `/${catalogSearch.selected.setTotal}` : ""}</small></span></div>}</div>}
          <div className="voice-panel"><div><b>Oder per Stimme</b><p>Valoreon vergleicht bis zu drei Sprachvarianten mit Pokémonbegriffen und Kartennummern.</p></div><button className="voice-button" type="button" onClick={startVoiceSearch}>{voiceSearch?.status === "listening" ? "Ich höre zu …" : "🎙️ Spracheingabe"}</button></div>
          {voiceSearch && <div className={`voice-result voice-${voiceSearch.status}`} aria-live="polite"><p className="scan-state">{voiceSearch.status === "listening" ? "Spracheingabe läuft" : voiceSearch.status === "searching" ? "Katalogsuche läuft" : voiceSearch.status === "review" ? "Treffer prüfen" : voiceSearch.status === "confirmed" ? "Karte bestätigt" : "Spracheingabe braucht Hilfe"}</p><p className="scan-message">{voiceSearch.message}</p>{voiceSearch.transcript && <p className="voice-transcript">Gesagt: „{voiceSearch.transcript}“</p>}{voiceSearch.normalized && voiceSearch.normalized !== voiceSearch.transcript && <p className="voice-normalized">Abgleich: {voiceSearch.normalized.replace(/\n/g, " · ")}</p>}{voiceSearch.hints && <p className="scan-hints">Erkannt: {voiceSearch.hints.name ?? "Name unklar"}{voiceSearch.hints.number ? ` · ${voiceSearch.hints.number}` : ""}</p>}{voiceSearch.status === "review" && <div className="candidate-list">{voiceSearch.candidates?.map((candidate) => <button className="candidate" key={candidate.id} type="button" onClick={() => setVoiceSearch((current) => current ? { ...current, status: "confirmed", selected: candidate, message: `${candidate.name} ist für die Preisprüfung vorgemerkt.` } : current)}>{candidate.image && <img src={candidate.image} alt="" />}<span><b>{candidate.name}</b><small>{candidate.setName} · {candidate.number}{candidate.setTotal ? `/${candidate.setTotal}` : ""}</small></span><i>Auswählen</i></button>)}</div>}{voiceSearch.status === "confirmed" && voiceSearch.selected && <div className="confirmed-card"><img src={voiceSearch.selected.image} alt="" /><span><b>{voiceSearch.selected.name}</b><small>{voiceSearch.selected.setName} · {voiceSearch.selected.number}{voiceSearch.selected.setTotal ? `/${voiceSearch.selected.setTotal}` : ""}</small></span></div>}</div>}
          {uploads.length > 0 && <div className="uploads" aria-live="polite"><div className="uploads-heading"><b>{uploads.length} {uploads.length === 1 ? "Scan" : "Scans"}</b><span>Erkennung läuft direkt auf deinem Bild</span></div><p className="scan-feedback" role="status"><span>✓</span> Foto angekommen – Kartenname und Nummer werden jetzt gelesen.</p><div className="scan-list">{uploads.map((upload) => <article className={`scan-result scan-${upload.status}`} key={upload.id}><div className="scan-preview"><img src={upload.preview} alt={upload.name} /><button type="button" onClick={() => setUploads((current) => current.filter((item) => item.id !== upload.id))} aria-label={`${upload.name} entfernen`}>×</button></div><div className="scan-content"><p className="scan-state">{upload.status === "reading" ? `Scan läuft${upload.progress ? ` · ${upload.progress}%` : ""}` : upload.status === "review" ? "Treffer prüfen" : upload.status === "confirmed" ? "Karte bestätigt" : "Scan braucht Hilfe"}</p><p className="scan-message">{upload.message}</p>{upload.hints && <p className="scan-hints">Gelesen: {upload.hints.name ?? "Name unklar"}{upload.hints.number ? ` · ${upload.hints.number}` : ""}</p>}{upload.status === "review" && <div className="candidate-list">{upload.candidates?.map((candidate) => <button className="candidate" key={candidate.id} type="button" onClick={() => updateUpload(upload.id, { status: "confirmed", selected: candidate, message: `${candidate.name} ist für die Preisprüfung vorgemerkt.` })}>{candidate.image && <img src={candidate.image} alt="" />}<span><b>{candidate.name}</b><small>{candidate.setName} · {candidate.number}{candidate.setTotal ? `/${candidate.setTotal}` : ""}</small></span><i>Auswählen</i></button>)}</div>}{upload.status === "confirmed" && upload.selected && <div className="confirmed-card"><img src={upload.selected.image} alt="" /><span><b>{upload.selected.name}</b><small>{upload.selected.setName} · {upload.selected.number}{upload.selected.setTotal ? `/${upload.selected.setTotal}` : ""}</small></span></div>}</div></article>)}</div></div>}
        </div>
      </section>

      <section className="how-it-works" id="so-funktionierts"><p className="eyebrow">Einfacher Ablauf</p><div className="steps">{benefits.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="price-note" id="ueber"><p className="eyebrow">CM ist die Basis</p><h2>Nicht nur CM.<br /><em>Dein Tauschwert.</em></h2><p>Kartenblick zeigt CM-Preise, Last Sold, Quelle, Abrufzeit, Sprache und Variante. So erkennst du faire Trades und Angebote unter CM.</p></section>
      <footer><a className="brand" href="#oben"><span className="brand-mark">V</span><span>valoreon</span></a><span>© 2026 Valoreon · MVP</span></footer>
      {scanNotice && <p className="scan-toast" role="status">{scanNotice}</p>}
    </main>
  );
}
