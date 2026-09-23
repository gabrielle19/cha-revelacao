/**
 * Gera o convite em PDF (e uma prévia PNG) a partir de convite.html.
 *
 * O PDF é montado com UMA imagem opaca em alta resolução + o link por cima do
 * envelope. Sombras/filtros vetoriais do Chromium viram imagens com máscara de
 * transparência, que alguns leitores (ex.: iPhone) desenham como um retângulo
 * escuro; com a imagem "achatada" o convite fica idêntico em qualquer leitor.
 *
 * Uso (precisa do Playwright com Chromium instalado):
 *   npx -y -p playwright node specs/convite-pdf/render.js
 */
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const W = 1080;
const H = 1350;
const SITE = "https://cha-revelacao-knny.onrender.com/";

(async () => {
  const src = pathToFileURL(path.join(__dirname, "convite.html")).href;
  const out = path.join(__dirname, "..", "Convite_Cha_Revelacao.pdf");
  const png = path.join(__dirname, "preview.png");

  const browser = await chromium.launch();

  // 1. Renderiza o design em 2x e guarda a área clicável (envelope).
  const design = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });
  await design.goto(src, { waitUntil: "networkidle" });
  await design.evaluate(() => document.fonts.ready);
  const link = await design.evaluate(() => {
    const r = document.querySelector("a.open").getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  await design.screenshot({ path: png });
  const jpg = await design.screenshot({ type: "jpeg", quality: 97 });

  // 2. Monta a página do PDF: imagem opaca + link transparente por cima.
  const sheet = await browser.newPage({ viewport: { width: W, height: H } });
  await sheet.setContent(`<!doctype html><html><head><style>
    @page { size: ${W}px ${H}px; margin: 0; }
    * { margin: 0; padding: 0; }
    body { width: ${W}px; height: ${H}px; position: relative; }
    img { display: block; width: ${W}px; height: ${H}px; }
    a { position: absolute; left: ${link.x}px; top: ${link.y}px;
        width: ${link.w}px; height: ${link.h}px; }
  </style></head><body>
    <img src="data:image/jpeg;base64,${jpg.toString("base64")}" alt="Convite Chá Revelação" />
    <a href="${SITE}"></a>
  </body></html>`);
  await sheet.pdf({
    path: out,
    width: `${W}px`,
    height: `${H}px`,
    printBackground: true,
    pageRanges: "1",
  });

  await browser.close();
  console.log("PDF:", out);
})();
