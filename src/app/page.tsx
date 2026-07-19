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

const benefits = [
  ["01", "CM-Preis checken", "Low, Trend und Variante als Basis für deinen Trade."],
  ["02", "Last Sold vergleichen", "Sieh, was die Karte zuletzt wirklich gebracht hat."],
  ["03", "Tauschwert einschätzen", "Erkenne schnell, ob ein Angebot unter CM liegt."],
];

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
