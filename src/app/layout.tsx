import type { Metadata, Viewport } from "next";
import { Fraunces, Quicksand } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-fraunces",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chá Revelação — Bernardo ou Maria Júlia?",
  description:
    "Vem descobrir com a gente se é o Bernardo ou a Maria Júlia! 21 de novembro de 2026, às 13h.",
  openGraph: {
    title: "Chá Revelação — Bernardo ou Maria Júlia?",
    description:
      "Um amor que já é impossível de medir. Vem descobrir com a gente!",
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Chá Revelação — Bernardo ou Maria Júlia?",
    description:
      "Um amor que já é impossível de medir. Vem descobrir com a gente!",
  },
};

export const viewport: Viewport = {
  themeColor: "#F1E6D6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
