"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";

type Upload = { id: string; name: string; preview: string };

const benefits = [
  ["01", "CM-Preis checken", "Low, Trend und Variante als Basis für deinen Trade."],
  ["02", "Last Sold vergleichen", "Sieh, was die Karte zuletzt wirklich gebracht hat."],
  ["03", "Tauschwert einschätzen", "Erkenne schnell, ob ein Angebot unter CM liegt."],
];

export default function Home() {
  const picker = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 50 - uploads.length)
      .map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, preview: URL.createObjectURL(file) }));
    setUploads((current) => [...current, ...next].slice(0, 50));
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
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
          <button className="text-link" type="button" onClick={() => picker.current?.click()}>
            Jetzt Karte scannen <span>↗</span>
          </button>
        </div>
        <div className="hero-art">
          <Image className="sigil" src="/brand/valoreon-sigil-comic-gold.png" alt="Valoreon V-Sigil" width={1024} height={1536} priority />
          <p className="floating-label">CM · Last Sold · Tauschwert</p>
        </div>
      </section>

      <section className="scanner-section" id="scanner">
        <div className="section-heading"><p className="eyebrow">MVP · Scan starten</p><h2>Ist dein Trade<br />unter CM?</h2><p>Scanne eine Karte und prüfe CM-Preise, Last Sold und deinen möglichen Tauschwert.</p></div>
        <div className="scanner-panel">
          <input ref={picker} className="visually-hidden" type="file" accept="image/*" capture="environment" multiple onChange={onInput} />
          <div className={`dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <div className="scan-icon" aria-hidden="true"><span /></div><h3>Foto hier ablegen</h3><p>oder nimm eines mit der Kamera auf</p>
            <button className="primary-button" type="button" onClick={() => picker.current?.click()}>Foto auswählen</button><small>JPG, PNG oder HEIC · maximal 50 Bilder</small>
          </div>
          {uploads.length > 0 && <div className="uploads" aria-live="polite"><div className="uploads-heading"><b>{uploads.length} {uploads.length === 1 ? "Bild" : "Bilder"} bereit</b><span>Erkennung folgt im nächsten MVP-Schritt</span></div><div className="upload-grid">{uploads.map((upload) => <figure key={upload.id}><img src={upload.preview} alt={upload.name} /><button type="button" onClick={() => setUploads((current) => current.filter((item) => item.id !== upload.id))} aria-label={`${upload.name} entfernen`}>×</button></figure>)}</div></div>}
        </div>
      </section>

      <section className="how-it-works" id="so-funktionierts"><p className="eyebrow">Einfacher Ablauf</p><div className="steps">{benefits.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="price-note" id="ueber"><p className="eyebrow">CM ist die Basis</p><h2>Nicht nur CM.<br /><em>Dein Tauschwert.</em></h2><p>Kartenblick zeigt CM-Preise, Last Sold, Quelle, Abrufzeit, Sprache und Variante. So erkennst du faire Trades und Angebote unter CM.</p></section>
      <footer><a className="brand" href="#oben"><span className="brand-mark">V</span><span>valoreon</span></a><span>© 2026 Valoreon · MVP</span></footer>
    </main>
  );
}
