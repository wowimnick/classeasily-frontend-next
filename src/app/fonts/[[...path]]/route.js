import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const FONTS_DIR = path.join(process.cwd(), "src", "assets", "fonts");

const PROXIMA_SOFT_CSS = `@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('/fonts/ProximaSoft-Light.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/ProximaSoft-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/ProximaSoft-Medium.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/ProximaSoft-SemiBold.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/ProximaSoft-Bold.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/fonts/ProximaSoft-ExtraBold.ttf') format('truetype');
}
@font-face {
  font-family: 'Proxima Soft';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url('/fonts/ProximaSoft-Black.ttf') format('truetype');
}
`;

const ALLOWED_FONTS = new Set([
  "ProximaSoft-Light.ttf",
  "ProximaSoft-Regular.ttf",
  "ProximaSoft-Medium.ttf",
  "ProximaSoft-SemiBold.ttf",
  "ProximaSoft-Bold.ttf",
  "ProximaSoft-ExtraBold.ttf",
  "ProximaSoft-Black.ttf",
]);

export async function GET(request, context) {
  const params = await context.params;
  const pathSegments = params?.path ?? [];
  const filename = Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments;

  if (!filename) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (filename === "proxima-soft.css") {
    return new NextResponse(PROXIMA_SOFT_CSS, {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (ALLOWED_FONTS.has(filename)) {
    try {
      const filePath = path.join(FONTS_DIR, filename);
      const buffer = await readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "font/ttf",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error("[fonts] Failed to serve font:", filename, err);
      return new NextResponse("Not found", { status: 404 });
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
