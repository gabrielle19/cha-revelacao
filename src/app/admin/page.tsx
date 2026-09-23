import type { Metadata } from "next";
import BackgroundPattern from "@/components/BackgroundPattern";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Chá Revelação",
  // Não indexar: continua sendo um endereço "não divulgado", mesmo sem senha.
  robots: { index: false, follow: false },
};

// Página pública, sem senha (só acompanhamento de confirmações, sem dados
// sensíveis). Os dados são buscados no navegador com a chave pública, e a
// segurança fica a cargo das regras (RLS) do banco.
export default function AdminPage() {
  return (
    <>
      <BackgroundPattern />
      <AdminDashboard />
    </>
  );
}
