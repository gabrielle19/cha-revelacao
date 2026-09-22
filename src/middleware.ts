import { NextResponse, type NextRequest } from "next/server";

/**
 * Proteção do /admin DESATIVADA a pedido — a área fica acessível sem senha.
 *
 * Para reativar a senha, restaure a verificação do cookie assinado
 * (verifySessionToken / ADMIN_COOKIE) que bloqueava /admin e /api/admin/*,
 * e volte a checar a sessão em `src/app/admin/page.tsx` e na página de
 * impressão `src/app/admin/recados/imprimir/page.tsx`.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
