"use client";

import { ChangeEvent, useRef, useState } from "react";

type Upload = { id: string; name: string; preview: string };

const benefits = [
  ["01", "Foto aufnehmen", "Direkt mit der Kamera oder aus deiner Galerie."],
  ["02", "Karte bestätigen", "Name, Set und Kartennummer sicher zuordnen."],
  ["03", "Preise verstehen", "Marktdaten mit Quelle, Zeitpunkt und Kontext."],
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
        <a className="brand" href="#oben" aria-label="Kartenblick Startseite"><span className="brand-mark">K</span><span>kartenblick</span></a>
        <nav aria-label="Hauptnavigation"><a href="#so-funktionierts">So funktioniert&apos;s</a><a href="#ueber">Über Kartenblick</a></nav>
      </header>

      <section className="hero" id="oben">
        <div className="hero-copy">
          <p className="eyebrow">Pokémon-Karten verstehen</p>
          <h1>Deine Karten.<br /><em>Ihr Marktwert.</em></h1>
          <p className="hero-text">Foto hochladen, Karte erkennen lassen, Preise einordnen. Klar, schnell und mit dem nötigen Kontext.</p>
          <a className="text-link" href="#scanner">Karte scannen <span>↓</span></a>
        </div>
        <div className="hero-art" aria-label="Stilisierte Pokémon-Karte">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="showcase-card"><div className="card-topline"><span>FLAMMARA</span><span>HP 130</span></div><div className="card-illustration"><span>✦</span></div><div className="card-copy"><b>Feueratem</b><small>130</small></div><div className="card-number">136/165 · DE</div></div>
          <p className="floating-label">Name · Set · Nummer · Variante</p>
        </div>
      </section>

      <section className="scanner-section" id="scanner">
        <div className="section-heading"><p className="eyebrow">MVP · Scan starten</p><h2>Welche Karte<br />möchtest du prüfen?</h2><p>Ein Foto oder bis zu 50 Bilder auswählen. Die Erkennung wird im nächsten Schritt angebunden.</p></div>
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
      <section className="price-note" id="ueber"><p className="eyebrow">Transparente Daten</p><h2>Ein Preis ist erst mit seinem<br /><em>Kontext</em> etwas wert.</h2><p>Kartenblick zeigt Quelle, Abrufzeit, Sprache und Variante. Marktdaten sind Orientierung – kein verbindlicher Ankaufspreis.</p></section>
      <footer><a className="brand" href="#oben"><span className="brand-mark">K</span><span>kartenblick</span></a><span>© 2026 Kartenblick · MVP</span></footer>
    </main>
  );
}
