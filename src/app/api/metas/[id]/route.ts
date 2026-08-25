import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso } from "@/lib/api"
import { competenciaDe } from "@/lib/datas"

type Contexto = { params: Promise<{ id: string }> }

export const PATCH = comSessao<Contexto>(async (sessao, requisicao, contexto) => {
  const { id } = await contexto.params
  const dados = await corpo<Record<string, unknown>>(requisicao)

  const meta = await prisma.meta.findFirst({ where: { id, larId: sessao.larId } })
  if (!meta) throw new ErroDeUso("Meta não encontrada.", 404)

  const permitidos = [
    "nome",
    "tipo",
    "alvoCentavos",
    "saldoCentavos",
    "aporteMensalCentavos",
    "rendimentoAnualBps",
    "prioridade",
    "status",
    "cor",
    "icone",
    "contaId",
    "observacao",
  ] as const

  const atualizacao: Record<string, unknown> = Object.fromEntries(
    permitidos.filter((campo) => campo in dados).map((campo) => [campo, dados[campo]]),
  )
  if ("dataAlvo" in dados) atualizacao.dataAlvo = dados.dataAlvo ? new Date(dados.dataAlvo as string) : null

  return ok(await prisma.meta.update({ where: { id }, data: atualizacao }))
})

export const DELETE = comSessao<Contexto>(async (sessao, _requisicao, contexto) => {
  const { id } = await contexto.params
  const meta = await prisma.meta.findFirst({ where: { id, larId: sessao.larId } })
  if (!meta) throw new ErroDeUso("Meta não encontrada.", 404)

  // O aporte é um lançamento real de dinheiro: desligá-lo da meta preserva o
  // extrato, enquanto apagar em cascata mudaria o saldo das contas.
  await prisma.transacao.updateMany({ where: { metaId: id }, data: { metaId: null } })
  await prisma.meta.delete({ where: { id } })
  return ok({ removida: true })
})

/**
 * Aporte na meta. Registra o lançamento e atualiza o saldo na mesma transação:
 * um sem o outro faria a meta e o extrato contarem histórias diferentes.
 */
export const POST = comSessao<Contexto>(async (sessao, requisicao, contexto) => {
  const { id } = await contexto.params
  const dados = await corpo<{ valorCentavos: number; contaId?: string; data?: string; retirada?: boolean }>(requisicao)

  const meta = await prisma.meta.findFirst({ where: { id, larId: sessao.larId } })
  if (!meta) throw new ErroDeUso("Meta não encontrada.", 404)

  const valor = Math.abs(Number(dados.valorCentavos))
  if (!valor) throw new ErroDeUso("Informe o valor do aporte.")

  const contaId = dados.contaId ?? meta.contaId
  const data = dados.data ? new Date(dados.data) : new Date()
  const delta = dados.retirada ? -valor : valor

  if (dados.retirada && meta.saldoCentavos < valor) {
    throw new ErroDeUso("A meta não tem esse valor guardado.")
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const atualizada = await tx.meta.update({
      where: { id },
      data: {
        saldoCentavos: { increment: delta },
        // Meta que atingiu o alvo sai da lista de ativas sozinha — obrigar o
        // usuário a marcar "concluída" é trabalho que o app pode fazer.
        ...(meta.saldoCentavos + delta >= meta.alvoCentavos && meta.alvoCentavos > 0
          ? { status: "CONCLUIDA" as const }
          : {}),
      },
    })

    // Sem conta vinculada, o aporte só move o saldo da meta: seria preciso
    // inventar de qual conta o dinheiro saiu.
    const lancamento = contaId
      ? await tx.transacao.create({
          data: {
            larId: sessao.larId,
            contaId,
            metaId: id,
            data,
            descricao: dados.retirada ? `Retirada — ${meta.nome}` : `Aporte — ${meta.nome}`,
            valorCentavos: valor,
            tipo: dados.retirada ? "RECEITA" : "DESPESA",
            competencia: competenciaDe(data),
            membroId: sessao.membroId,
          },
        })
      : null

    return { meta: atualizada, lancamento }
  })

  return ok(resultado, 201)
})
