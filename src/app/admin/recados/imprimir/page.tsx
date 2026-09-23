import type { Metadata } from "next";
import PrintMessages from "@/components/admin/PrintMessages";

export const metadata: Metadata = {
  title: "Recadinhos para imprimir — Chá Revelação",
  robots: { index: false, follow: false },
};

export default function PrintMessagesPage() {
  return <PrintMessages />;
}
