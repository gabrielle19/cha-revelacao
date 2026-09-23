/**
 * Limite simples em memória (por aba), só para evitar duplo clique.
 * Sem servidor não dá para limitar por IP de verdade — e tudo bem, porque
 * as regras do banco (RLS) já impedem abuso de dados.
 *
 * Retorna `true` quando a ação deve ser BLOQUEADA (chamou cedo demais).
 */
const lastAt: Record<string, number> = {};

export function isThrottled(key: string, windowMs = 10_000): boolean {
  const now = Date.now();
  const prev = lastAt[key];
  if (prev && now - prev < windowMs) return true;
  lastAt[key] = now;
  return false;
}
