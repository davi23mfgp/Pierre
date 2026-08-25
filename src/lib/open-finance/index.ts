/**
 * Seleção do provedor e sincronização para dentro do banco do Pierre.
 */

import { prisma } from "@/lib/prisma"
import { competenciaDe } from "@/lib/datas"
import { categorizar, type RegraAplicavel } from "@/lib/categorizar"
import { impressaoDigital } from "@/lib/importar"
import type { ProvedorOpenFinance } from "@/lib/open-finance/tipos"
import { provedorSandbox } from "@/lib/open-finance/provedores/sandbox"
import { provedorPluggy } from "@/lib/open-finance/provedores/pluggy"

export function criarProvedor(): ProvedorOpenFinance {
  const escolhido = (process.env.OPEN_FINANCE_PROVIDER || "sandbox").toLowerCase()

  if (escolhido === "pluggy") return provedorPluggy

  // Sandbox em produção significaria mostrar dados inventados como se fossem
  // do banco do usuário. Falhar aqui é melhor que essa confusão.
  if (process.env.NODE_ENV === "production" && escolhido === "sandbox") {
    throw new Error("Open Finance: provedor sandbox não pode ser usado em produção. Configure OPEN_FINANCE_PROVIDER.")
  }
  return provedorSandbox
}

export interface ResultadoSync {
  contasCriadas: number
  transacoesNovas: number
  transacoesDuplicadas: number
}

/**
 * Puxa contas e lançamentos da conexão e grava o que ainda não existe.
 *
 * A janela padrão é de 90 dias: o suficiente para pegar o que ficou para trás
 * entre duas sincronizações sem baixar anos de histórico a cada execução.
 */
export async function sincronizarConexao(params: {
  larId: string
  conexaoId: string
  dias?: number
}): Promise<ResultadoSync> {
  const conexao = await prisma.conexaoOpenFinance.findFirstOrThrow({
    where: { id: params.conexaoId, larId: params.larId },
  })

  if (conexao.consentimentoExpiraEm && conexao.consentimentoExpiraEm < new Date()) {
    await prisma.conexaoOpenFinance.update({
      where: { id: conexao.id },
      data: { status: "EXPIRADA", erroMensagem: "Consentimento expirado. Renove o acesso no banco." },
    })
    throw new Error("Consentimento expirado. Renove o acesso para voltar a sincronizar.")
  }

  const provedor = criarProvedor()
  const ate = new Date()
  const de = new Date(ate.getTime() - (params.dias ?? 90) * 86_400_000)

  const [regras, categorias] = await Promise.all([
    prisma.regraCategorizacao.findMany({ where: { larId: params.larId, ativa: true } }),
    prisma.categoria.findMany({ where: { larId: params.larId }, select: { id: true, nome: true } }),
  ])
  const mapaCategorias = new Map(categorias.map((categoria) => [categoria.nome, categoria.id]))

  let contasCriadas = 0
  let transacoesNovas = 0
  let transacoesDuplicadas = 0

  try {
    const externas = await provedor.listarContas(conexao.itemId)

    for (const externa of externas) {
      let conta = await prisma.conta.findFirst({
        where: { larId: params.larId, contaExternaId: externa.id },
      })

      if (!conta) {
        conta = await prisma.conta.create({
          data: {
            larId: params.larId,
            nome: externa.nome,
            instituicao: externa.instituicao || conexao.instituicao,
            tipo: externa.tipo,
            // O saldo vem do banco já com todo o histórico embutido. Gravá-lo
            // como saldo inicial e depois somar as transações contaria o mesmo
            // dinheiro duas vezes, então a conta nasce zerada.
            saldoInicialCentavos: 0,
            limiteCentavos: externa.limiteCentavos ?? null,
            conexaoId: conexao.id,
            contaExternaId: externa.id,
          },
        })
        contasCriadas += 1
      }

      const transacoes = await provedor.listarTransacoes({
        itemId: conexao.itemId,
        contaExternaId: externa.id,
        de,
        ate,
      })

      for (const transacao of transacoes) {
        const hash = impressaoDigital({
          contaId: conta.id,
          data: transacao.data,
          valorCentavos: transacao.valorCentavos,
          descricao: transacao.descricao,
          identificadorExterno: transacao.id,
        })

        const jaExiste = await prisma.transacao.findFirst({
          where: { larId: params.larId, hashImport: hash },
          select: { id: true },
        })
        if (jaExiste) {
          transacoesDuplicadas += 1
          continue
        }

        const sugestao = categorizar(transacao.descricao, regras as unknown as RegraAplicavel[], mapaCategorias)
        await prisma.transacao.create({
          data: {
            larId: params.larId,
            contaId: conta.id,
            categoriaId: sugestao.categoriaId ?? null,
            data: transacao.data,
            descricao: sugestao.descricaoLimpa,
            descricaoOriginal: transacao.descricao,
            valorCentavos: transacao.valorCentavos,
            tipo: transacao.tipo,
            competencia: competenciaDe(transacao.data),
            origem: "OPEN_FINANCE",
            hashImport: hash,
            transacaoExternaId: transacao.id,
          },
        })
        transacoesNovas += 1
      }
    }

    await prisma.conexaoOpenFinance.update({
      where: { id: conexao.id },
      data: { ultimaSync: new Date(), status: "ATIVA", erroMensagem: null },
    })
  } catch (erro) {
    await prisma.conexaoOpenFinance.update({
      where: { id: conexao.id },
      data: { status: "ERRO", erroMensagem: erro instanceof Error ? erro.message : "Falha desconhecida" },
    })
    throw erro
  }

  return { contasCriadas, transacoesNovas, transacoesDuplicadas }
}
