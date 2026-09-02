import { redirect } from "next/navigation"

import { getSessao } from "@/lib/auth"

/**
 * A vitrine só existe para quem não entrou.
 *
 * Quem já tem sessão vai direto para o painel: mostrar a página de vendas a
 * quem já é cliente é pedir para a pessoa se perguntar se está pagando por algo
 * que já tem.
 */
export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()
  if (sessao) redirect("/painel")

  return <>{children}</>
}
