import { NextResponse } from "next/server";
import { franc } from "franc-min";

/** Minimum characters before calling detection / translation (short snippets are unreliable). */
const MIN_LENGTH = 28;

/** Maximum characters per MyMemory request (stay under free-tier limits; long text is chunked). */
const CHUNK_SIZE = 420;

/**
 * ISO 639-3 (franc-min) → ISO 639-1 for MyMemory `langpair` and Intl.DisplayNames.
 * Unknown codes fall back to no translation.
 */
const ISO639_3_TO_639_1 = {
  afr: "af",
  ara: "ar",
  bul: "bg",
  cat: "ca",
  ces: "cs",
  cym: "cy",
  dan: "da",
  deu: "de",
  ell: "el",
  eng: "en",
  spa: "es",
  est: "et",
  eus: "eu",
  pes: "fa",
  fas: "fa",
  fin: "fi",
  fra: "fr",
  glg: "gl",
  guj: "gu",
  heb: "he",
  hin: "hi",
  hrv: "hr",
  hun: "hu",
  ind: "id",
  ita: "it",
  isl: "is",
  jpn: "ja",
  kat: "ka",
  kan: "kn",
  kor: "ko",
  lav: "lv",
  lit: "lt",
  mkd: "mk",
  mal: "ml",
  mon: "mn",
  zsm: "ms",
  nde: "nd",
  npi: "ne",
  nld: "nl",
  nob: "no",
  pan: "pa",
  pol: "pl",
  por: "pt",
  ron: "ro",
  rus: "ru",
  slk: "sk",
  slv: "sl",
  sqi: "sq",
  srp: "sr",
  swe: "sv",
  swa: "sw",
  tam: "ta",
  tel: "te",
  tha: "th",
  tur: "tr",
  ukr: "uk",
  urd: "ur",
  vie: "vi",
  cmn: "zh",
  zho: "zh",
  /** Japanese script variants */
  wuu: "zh",
  yue: "zh",
};

async function fetchMyMemoryChunk(text, source639_1) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source639_1}|en`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== "string") return null;
  return translated.trim();
}

function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > CHUNK_SIZE) {
    let cut = rest.lastIndexOf("\n\n", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = rest.lastIndexOf(". ", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = rest.lastIndexOf(" ", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = CHUNK_SIZE;
    if (cut <= 0) cut = Math.min(CHUNK_SIZE, rest.length);
    const piece = rest.slice(0, cut).trim();
    if (!piece) break;
    chunks.push(piece);
    rest = rest.slice(cut).trim();
    if (!rest) break;
  }
  if (rest) chunks.push(rest);
  return chunks.length ? chunks : [text];
}

async function translateWithMyMemory(text, source639_1) {
  const parts = chunkText(text);
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    const t = await fetchMyMemoryChunk(part, source639_1);
    if (t == null) return null;
    out.push(t);
  }
  return out.join("\n\n");
}

function languageDisplayName(code639_1) {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code639_1);
  } catch {
    return code639_1;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (text.length < MIN_LENGTH) {
      return NextResponse.json({ translated: false, reason: "short" });
    }

    const detected = franc(text);
    if (detected === "und") {
      return NextResponse.json({ translated: false, reason: "undetermined" });
    }

    const lang639_1 = ISO639_3_TO_639_1[detected];
    if (!lang639_1 || lang639_1 === "en") {
      return NextResponse.json({
        translated: false,
        reason: "english_or_unmapped",
        detected,
      });
    }

    const translatedText = await translateWithMyMemory(text, lang639_1);
    if (!translatedText || translatedText === text) {
      return NextResponse.json({ translated: false, reason: "unchanged" });
    }

    return NextResponse.json({
      translated: true,
      text: translatedText,
      sourceLanguage: languageDisplayName(lang639_1),
      sourceCode: lang639_1,
    });
  } catch (e) {
    console.error("reviews/translate:", e);
    return NextResponse.json(
      { translated: false, reason: "error" },
      { status: 500 },
    );
  }
}
