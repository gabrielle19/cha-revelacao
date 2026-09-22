import type { Metadata } from "next";
import { getAdminData } from "@/lib/admin-data";
import BackgroundPattern from "@/components/BackgroundPattern";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Chá Revelação",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Acesso sem senha (proteção desativada a pedido). Para reativar, volte a
// checar o cookie de sessão aqui e no middleware.
export default async function AdminPage() {
  let data;
  try {
    data = await getAdminData();
  } catch (err) {
    return (
      <>
        <BackgroundPattern />
        <SetupNeeded message={err instanceof Error ? err.message : String(err)} />
      </>
    );
  }

  return (
    <>
      <BackgroundPattern />
      <AdminDashboard data={data} />
    </>
  );
}

function SetupNeeded({ message }: { message: string }) {
  const missingTable = /Could not find the table|does not exist|PGRST205/i.test(
    message
  );
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col items-center justify-center gap-4 px-5 py-10 text-center">
      <div className="card w-full px-6 py-6">
        <h1 className="font-display text-2xl text-browndark">
          Banco de dados ainda não configurado
        </h1>
        {missingTable ? (
          <div className="mt-3 space-y-2 font-body text-sm text-brownlabel-deep">
            <p>
              As tabelas do Supabase ainda não existem. No painel do Supabase,
              abra o <strong>SQL Editor</strong> e execute, nesta ordem:
            </p>
            <ol className="mx-auto max-w-sm list-decimal space-y-1 pl-5 text-left">
              <li>
                <code>supabase/migrations/0001_init.sql</code>
              </li>
              <li>
                <code>supabase/migrations/0002_messages.sql</code>
              </li>
            </ol>
            <p>Depois recarregue esta página.</p>
          </div>
        ) : (
          <p className="mt-3 font-body text-sm text-brownlabel-deep">
            Não foi possível carregar os dados. Verifique as variáveis do
            Supabase no <code>.env.local</code> e recarregue.
          </p>
        )}
        <p className="mt-4 break-words font-body text-xs text-brownlabel/70">
          {message}
        </p>
      </div>
    </main>
  );
}
