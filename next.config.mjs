/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exportação 100% estática: gera a pasta `out/` para publicar como
  // Static Site no Render (sem servidor, sem cold start).
  output: "export",
  // O otimizador de imagens do Next exige servidor; desligado no export.
  images: { unoptimized: true },
};

export default nextConfig;
