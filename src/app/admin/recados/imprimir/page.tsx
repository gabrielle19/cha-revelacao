import type { Metadata } from "next";
import { getMessages } from "@/lib/admin-data";
import BearHead from "@/components/BearHead";
import PrintButton from "@/components/admin/PrintButton";

export const metadata: Metadata = {
  title: "Recadinhos para imprimir — Chá Revelação",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PrintMessagesPage() {
  const messages = await getMessages();

  return (
    <div className="min-h-[100dvh] bg-cream px-5 py-8">
      {/* Regras de impressão */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              .recado-card { break-inside: avoid; page-break-inside: avoid; }
              body { background: #fff; }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/admin" className="btn-secondary">
            Voltar ao painel
          </a>
          <PrintButton />
        </div>

        <header className="mb-8 flex flex-col items-center text-center">
          <BearHead size={72} blush />
          <h1 className="mt-3 font-display text-3xl text-browndark">
            Recadinhos para o nosso bebê
          </h1>
          <p className="mt-1 font-body text-sm italic text-brownlabel">
            Mensagens de carinho guardadas com amor · Chá Revelação
          </p>
        </header>

        {messages.length === 0 ? (
          <p className="text-center font-body text-brownlabel">
            Ainda não há recadinhos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {messages.map((m) => (
              <article
                key={m.id}
                className="recado-card rounded-card border-2 border-beige bg-white p-5 shadow-card"
              >
                <p className="font-body italic leading-relaxed text-browndark">
                  &ldquo;{m.message}&rdquo;
                </p>
                <div className="mt-4 border-t border-beige pt-3">
                  <p className="font-display text-lg text-caramel">
                    {m.author_name}
                  </p>
                  <p className="font-body text-xs text-brownlabel">
                    {formatDate(m.created_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
