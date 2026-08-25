import { redirect } from "next/navigation"

import { getSessao } from "@/lib/auth"

export default async function Raiz() {
  const sessao = await getSessao()
  redirect(sessao ? "/painel" : "/login")
}
