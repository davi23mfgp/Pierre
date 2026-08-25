import { redirect } from "next/navigation"

import { getSessao } from "@/lib/auth"

export default async function LayoutBemVindo({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao()
  if (!sessao) redirect("/login")

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-fg">Pierre</p>
      <p className="mt-1 text-sm text-muted-fg">
        Oi, {sessao.nome.split(" ")[0]}. Sete perguntas rápidas e eu já te mostro onde você está.
      </p>
      {children}
    </div>
  )
}
