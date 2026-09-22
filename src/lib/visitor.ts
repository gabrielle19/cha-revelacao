"use client";

import type { GiftSize } from "./event";

const VISITOR_KEY = "cha_visitor_id";
const GIFT_KEY = "cha_gift_size";
const GIFT_SCRATCHED_KEY = "cha_gift_scratched";

/** Recupera (ou cria) o identificador anônimo do visitante. */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getStoredGift(): GiftSize | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(GIFT_KEY);
  return v === "P" || v === "M" || v === "G" || v === "GG" ? v : null;
}

export function setStoredGift(size: GiftSize): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GIFT_KEY, size);
}

/** Marca/consulta se o visitante já raspou a raspadinha. */
export function getGiftScratched(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GIFT_SCRATCHED_KEY) === "1";
}

export function setGiftScratched(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GIFT_SCRATCHED_KEY, "1");
}
