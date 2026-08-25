import { prisma } from "@/lib/prisma"
import { comSessao, corpo, exigir, ok } from "@/lib/api"

export const GET = comSessao(async (sessao) => {
  const contas = await prisma.conta.findMany({
    where: { larId: sessao.larId, arquivada: false },
    orderBy: { criadoEm: "asc" },
    include: { membro: true, conexao: { select: { instituicao: true, status: true, ultimaSync: true } } },
  })

  // O saldo é sempre derivado dos lançamentos, nunca um campo gravado: campo de
  // saldo desatualiza no primeiro lançamento editado ou apagado.
  const movimentos = await prisma.transacao.groupBy({
    by: ["contaId", "tipo"],
    where: { larId: sessao.larId, pago: true, tipo: { in: ["RECEITA", "DESPESA"] } },
    _sum: { valorCentavos: true },
  })

  // Transferência move saldo entre contas sem ser receita nem despesa. A ponta
  // de destino é a que aponta para a de origem — mesma regra usada no panorama,
  // para as duas telas nunca mostrarem saldos diferentes.
  const transferencias = await prisma.transacao.findMany({
    where: { larId: sessao.larId, pago: true, tipo: "TRANSFERENCIA" },
    select: { contaId: true, valorCentavos: true, transferenciaParId: true },
  })

  const somar = (contaId: string, tipo: string) =>
    movimentos.find((m) => m.contaId === contaId && m.tipo === tipo)?._sum.valorCentavos ?? 0

  return ok(
    contas.map((conta) => ({
      ...conta,
      saldoCentavos:
        conta.saldoInicialCentavos +
        somar(conta.id, "RECEITA") -
        somar(conta.id, "DESPESA") +
        transferencias
          .filter((linha) => linha.contaId === conta.id)
          .reduce((soma, linha) => soma + (linha.transferenciaParId ? linha.valorCentavos : -linha.valorCentavos), 0),
    })),
  )
})

export const POST = comSessao(async (sessao, requisicao) => {
  const dados = await corpo<{
    nome: string
    tipo: "CORRENTE" | "POUPANCA" | "CARTAO_CREDITO" | "DINHEIRO" | "INVESTIMENTO" | "PJ_MEI"
    instituicao?: string
    saldoInicialCentavos?: number
    limiteCentavos?: number
    diaFechamento?: number
    diaVencimento?: number
    membroId?: string
    cor?: string
  }>(requisicao)

  const conta = await prisma.conta.create({
    data: {
      larId: sessao.larId,
      nome: exigir(dados.nome, "Dê um nome à conta").trim(),
      tipo: dados.tipo ?? "CORRENTE",
      instituicao: dados.instituicao?.trim() || null,
      saldoInicialCentavos: dados.saldoInicialCentavos ?? 0,
      limiteCentavos: dados.limiteCentavos ?? null,
      diaFechamento: dados.diaFechamento ?? null,
      diaVencimento: dados.diaVencimento ?? null,
      membroId: dados.membroId ?? null,
      cor: dados.cor ?? "blue",
    },
  })

  return ok(conta, 201)
})
