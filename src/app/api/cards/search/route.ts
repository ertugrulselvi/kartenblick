import { NextResponse } from "next/server";

type PokemonCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  set: { name: string; printedTotal?: number; total?: number };
  images?: { small?: string };
};

type CardCandidate = {
  id: string;
  name: string;
  number: string;
  setName: string;
  setTotal?: number;
  rarity?: string;
  image?: string;
  score: number;
};

const IGNORED_LINES = new Set([
  "BASIS", "BASIS POKEMON", "BASIS-POKEMON", "POKEMON", "TRAINER", "ENERGIE",
  "SCHWACHE", "RESISTENZ", "RÜCKZUG", "RUECKZUG", "ILLUSTRATION", "RULE BOX",
  "STUFE", "PHASE", "BASIC", "STAGE", "WEAKNESS", "RESISTANCE", "RETREAT",
]);

function cleanLine(line: string) {
  return line.replace(/[|]/g, "I").replace(/[^a-zA-ZÀ-ÿ0-9' -]/g, " ").replace(/\s+/g, " ").trim();
}

function extractHints(text: string) {
  const numberMatch = text.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
  const number = numberMatch ? `${numberMatch[1]}/${numberMatch[2]}` : undefined;
  const names = text.split(/\r?\n/).map(cleanLine).filter((line) => {
    const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, "");
    return letters.length >= 3 && letters.length <= 28 && !IGNORED_LINES.has(line.toUpperCase()) && !/^\d/.test(line);
  }).filter((line, index, all) => all.findIndex((item) => item.toLowerCase() === line.toLowerCase()) === index).slice(0, 8);
  return { number, names };
}

function escapeQuery(value: string) {
  return value.replace(/[+\-!(){}[\]^"~*?:\\/]/g, "\\$&");
}

function rankCard(card: PokemonCard, names: string[], number?: string) {
  const cardName = card.name.toLowerCase();
  const exactName = names.some((name) => name.toLowerCase() === cardName);
  const containedName = names.some((name) => cardName.includes(name.toLowerCase()) || name.toLowerCase().includes(cardName));
  const numberOnly = number?.split("/")[0];
  const setTotal = number?.split("/")[1];
  const numberMatch = Boolean(numberOnly && card.number.replace(/^0+/, "") === numberOnly.replace(/^0+/, ""));
  const totalMatch = Boolean(setTotal && String(card.set.printedTotal ?? card.set.total) === setTotal);
  return (numberMatch ? 100 : 0) + (totalMatch ? 80 : 0) + (exactName ? 40 : 0) + (containedName ? 15 : 0);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.slice(0, 4_000) : "";
    if (!text.trim()) return NextResponse.json({ error: "Kein lesbarer Kartentext empfangen." }, { status: 400 });

    const hints = extractHints(text);
    if (hints.names.length === 0) return NextResponse.json({ candidates: [], hints });

    const headers: HeadersInit = { Accept: "application/json" };
    if (process.env.POKEMON_TCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
    const responses = await Promise.all(hints.names.slice(0, 5).map(async (name) => {
      try {
      const url = new URL("https://api.pokemontcg.io/v2/cards");
      const [number] = hints.number?.split("/") ?? [];
      const filters = [`name:\"${escapeQuery(name)}\"`];
      if (number) filters.push(`number:\"${escapeQuery(number)}\"`);
      url.searchParams.set("q", filters.join(" "));
      url.searchParams.set("pageSize", "30");
      url.searchParams.set("select", "id,name,number,rarity,set,images");
      const response = await fetch(url, { headers, next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return [] as PokemonCard[];
      const data = (await response.json()) as { data?: PokemonCard[] };
      return data.data ?? [];
      } catch {
        return [] as PokemonCard[];
      }
    }));

    const unique = new Map<string, CardCandidate>();
    for (const card of responses.flat()) {
      const candidate = { id: card.id, name: card.name, number: card.number, setName: card.set.name, setTotal: card.set.printedTotal ?? card.set.total, rarity: card.rarity, image: card.images?.small, score: rankCard(card, hints.names, hints.number) };
      const existing = unique.get(card.id);
      if (!existing || candidate.score > existing.score) unique.set(card.id, candidate);
    }
    const candidates = [...unique.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 3);
    return NextResponse.json({ candidates, hints });
  } catch {
    return NextResponse.json({ error: "Katalogsuche ist gerade nicht erreichbar." }, { status: 502 });
  }
}
