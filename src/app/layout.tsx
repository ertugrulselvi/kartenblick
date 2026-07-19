import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valoreon · Kartenwerte einordnen",
  description: "Foto rein, Karte erkannt, Preise einordnen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
