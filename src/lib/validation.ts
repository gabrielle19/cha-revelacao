import { z } from "zod";

/** Conta apenas os dígitos do telefone. */
export function countPhoneDigits(phone: string): number {
  return (phone.match(/\d/g) || []).length;
}

/** Normaliza o telefone para apenas dígitos (com DDI 55 para links do WhatsApp). */
export function phoneToWhatsApp(phone: string): string {
  const digits = (phone.match(/\d/g) || []).join("");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export const rsvpSchema = z.object({
  names: z
    .string()
    .trim()
    .min(2, "Digite ao menos um nome.")
    .max(600, "Texto muito longo."),
  phone: z
    .string()
    .trim()
    .refine((v) => {
      const d = countPhoneDigits(v);
      return d === 10 || d === 11;
    }, "Telefone inválido. Use DDD + número."),
  guests_count: z
    .number({ invalid_type_error: "Informe um número." })
    .int("Use um número inteiro.")
    .min(1, "Mínimo de 1 pessoa.")
    .max(50, "Quantidade muito alta."),
  visitor_id: z.string().uuid().optional().nullable(),
  gift_size: z.enum(["P", "M", "G", "GG"]).optional().nullable(),
  // Honeypot: precisa vir vazio
  company: z.string().max(0, "spam").optional().default(""),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const messageSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(1, "Digite o seu nome.")
    .max(60, "Nome muito longo."),
  message: z
    .string()
    .trim()
    .min(1, "Escreva o seu recadinho.")
    .max(400, "Recadinho muito longo."),
  visitor_id: z.string().uuid().optional().nullable(),
  // Honeypot: precisa vir vazio
  company: z.string().max(0, "spam").optional().default(""),
});

export type MessageInput = z.infer<typeof messageSchema>;
