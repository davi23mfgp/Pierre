import { prisma } from "@/lib/prisma"
import { comSessao, corpo, exigir, ok } from "@/lib/api"

export const GET = comSessao(async (sessao) =>
  ok(
    await prisma.categoria.findMany({
      where: { larId: sessao.larId },
      orderBy: [{ grupo: "asc" }, { ordem: "asc" }, { nome: "asc" }],
      include: { filhas: true },
    }),
  ),
)

export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    nome: string
    grupo?: string
    tipo?: "RECEITA" | "DESPESA"
    essencial?: boolean
    cor?: string
    icone?: string
    paiId?: string
  }>(requisicao)

  const categoria = await prisma.categoria.create({
    data: {
      larId: sessao.larId,
      nome: exigir(dados.nome, "Dê um nome à categoria").trim(),
      grupo: (dados.grupo ?? "OUTROS") as never,
      tipo: dados.tipo ?? "DESPESA",
      essencial: dados.essencial ?? false,
      cor: dados.cor ?? "blue",
      icone: dados.icone ?? "circle",
      paiId: dados.paiId ?? null,
    },
  })

  return ok(categoria, 201)
})
