/**
 * Provedor sandbox — desenvolvimento e demonstração.
 *
 * Gera contas e lançamentos plausíveis para que todo o fluxo de Open Finance
 * (consentimento, sincronização, expiração) possa ser desenvolvido e testado
 * sem contrato com agregador. Nunca deve rodar em produção: `criarProvedor`
 * só o entrega quando OPEN_FINANCE_PROVIDER=sandbox.
 */

import type { Conexao, ContaExterna, ProvedorOpenFinance, TransacaoExterna } from "@/lib/open-finance/tipos"

const INSTITUICOES = ["Banco do Brasil", "Itaú", "Nubank", "Caixa", "Bradesco", "Inter"]

const COMERCIANTES: { descricao: string; min: number; max: number; tipo: "RECEITA" | "DESPESA" }[] = [
  { descricao: "IFOOD *IFOOD", min: 2500, max: 9000, tipo: "DESPESA" },
  { descricao: "SUPERMERCADO PAO DE ACUCAR", min: 8000, max: 45000, tipo: "DESPESA" },
  { descricao: "UBER *TRIP", min: 1200, max: 6500, tipo: "DESPESA" },
  { descricao: "POSTO IPIRANGA", min: 10000, max: 30000, tipo: "DESPESA" },
  { descricao: "NETFLIX.COM", min: 3990, max: 5990, tipo: "DESPESA" },
  { descricao: "DROGARIA RAIA", min: 2000, max: 18000, tipo: "DESPESA" },
  { descricao: "ENEL DISTRIBUICAO", min: 9000, max: 32000, tipo: "DESPESA" },
  { descricao: "PAGAMENTO SALARIO", min: 350000, max: 900000, tipo: "RECEITA" },
  { descricao: "PIX RECEBIDO CLIENTE", min: 50000, max: 250000, tipo: "RECEITA" },
]

/**
 * Gerador determinístico: a mesma semente devolve sempre os mesmos dados.
 * Sem isso, cada recarregar da tela mostraria valores diferentes e nada
 * poderia ser conferido durante o desenvolvimento.
 */
function aleatorio(semente: number): () => number {
  let estado = semente || 1
  return () => {
    estado = (estado * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return estado / 4_294_967_296
  }
}

function semeadoDe(texto: string): number {
  let soma = 0
  for (let i = 0; i < texto.length; i += 1) soma = (soma * 31 + texto.charCodeAt(i)) % 2_147_483_647
  return soma
}

export const provedorSandbox: ProvedorOpenFinance = {
  nome: "sandbox",

  async urlConsentimento({ larId, retornoUrl }) {
    const url = new URL(retornoUrl)
    url.searchParams.set("codigo", `sandbox-${larId}`)
    url.searchParams.set("sandbox", "1")
    return url.toString()
  },

  async concluirConsentimento({ codigo }) {
    const sorteio = aleatorio(semeadoDe(codigo))
    const expira = new Date()
    expira.setUTCMonth(expira.getUTCMonth() + 12)
    return {
      itemId: `item-${codigo}`,
      instituicao: INSTITUICOES[Math.floor(sorteio() * INSTITUICOES.length)],
      status: "ATIVA",
      consentimentoExpiraEm: expira,
    }
  },

  async listarContas(itemId) {
    const sorteio = aleatorio(semeadoDe(itemId))
    const instituicao = INSTITUICOES[Math.floor(sorteio() * INSTITUICOES.length)]
    const contas: ContaExterna[] = [
      {
        id: `${itemId}-cc`,
        nome: "Conta corrente",
        tipo: "CORRENTE",
        instituicao,
        numero: `${Math.floor(sorteio() * 90_000 + 10_000)}-${Math.floor(sorteio() * 9)}`,
        saldoCentavos: Math.floor(sorteio() * 800_000) + 50_000,
        moeda: "BRL",
      },
      {
        id: `${itemId}-cartao`,
        nome: "Cartão de crédito",
        tipo: "CARTAO_CREDITO",
        instituicao,
        saldoCentavos: -(Math.floor(sorteio() * 300_000) + 20_000),
        limiteCentavos: Math.floor(sorteio() * 1_000_000) + 200_000,
        moeda: "BRL",
      },
    ]
    return contas
  },

  async listarTransacoes({ contaExternaId, de, ate }) {
    const sorteio = aleatorio(semeadoDe(contaExternaId))
    const transacoes: TransacaoExterna[] = []
    const dias = Math.max(1, Math.round((ate.getTime() - de.getTime()) / 86_400_000))
    const cartao = contaExternaId.endsWith("cartao")

    for (let dia = 0; dia < dias; dia += 1) {
      const quantidade = Math.floor(sorteio() * 3)
      for (let n = 0; n < quantidade; n += 1) {
        const modelo = COMERCIANTES[Math.floor(sorteio() * COMERCIANTES.length)]
        // Cartão de crédito não recebe salário: filtrar mantém o dado plausível.
        if (cartao && modelo.tipo === "RECEITA") continue
        const data = new Date(de.getTime() + dia * 86_400_000)
        transacoes.push({
          id: `${contaExternaId}-${data.toISOString().slice(0, 10)}-${n}`,
          contaExternaId,
          data,
          descricao: modelo.descricao,
          valorCentavos: Math.floor(sorteio() * (modelo.max - modelo.min)) + modelo.min,
          tipo: modelo.tipo,
        })
      }
    }
    return transacoes
  },

  async revogar() {
    // Sandbox não guarda estado remoto: revogar é só apagar a conexão local,
    // o que quem chama já faz.
  },
}

export type { Conexao }
