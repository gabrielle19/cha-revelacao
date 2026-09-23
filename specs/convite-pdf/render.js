/**
 * Gera o convite em PDF (e uma prévia PNG) a partir de convite.html.
 *
 * Uso (precisa do Playwright com Chromium instalado):
 *   npx -y -p playwright node specs/convite-pdf/render.js
 */
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

(async () => {
  const src = pathToFileURL(path.join(__dirname, "convite.html")).href;
  const out = path.join(__dirname, "..", "Convite_Cha_Revelacao.pdf");
  const png = path.join(__dirname, "preview.png");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(src, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: png });
  await page.pdf({
    path: out,
    width: "1080px",
    height: "1350px",
    printBackground: true,
    pageRanges: "1",
  });
  await browser.close();
  console.log("PDF:", out);
})();
