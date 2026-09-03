/**
 * Desempenho dos produtos.
 *
 * Duas perguntas que decidem compra e vitrine: o que mais sai, e o que está
 * parado ocupando prateleira e capital. Nenhuma das duas aparece pela venda
 * isolada — só pela série.
 *
 * Não devolvemos um rótulo pronto de "parado": isso seria inventar um corte
 * dentro do motor puro, e o corte certo varia por tipo de loja (roupa de
 * coleção parada há 15 dias já é problema; papelaria básica não). A função
 * devolve o fato — há quantos dias não vende, ou se nunca vendeu — e quem
 * chama decide o corte, documentado, no mesmo lugar que decide o resto da
 * tela.
 */

export interface VendaDoProduto {
  produtoId: string
  /// Copiada da venda (`ItemVenda.descricao`), não buscada de novo no produto:
  /// mesma razão do histórico da venda — produto renomeado ou apagado não pode
  /// apagar o nome de quando a venda aconteceu.
  descricao: string
  quantidade: number
  criadoEm: Date
}

export interface SaldoDoProduto {
  produtoId: string
  descricao: string
  saldo: number
}

export interface DesempenhoDoProduto {
  produtoId: string
  descricao: string
  saldo: number
  quantidadeVendida: number
  ultimaVendaEm: Date | null
  /// `null` só quando `nuncaVendeu` é true — não existe data para subtrair.
  diasSemVender: number | null
  nuncaVendeu: boolean
}

const UM_DIA_MS = 86_400_000

/**
 * Junta saldo e histórico de venda por produto.
 *
 * Quem chama já filtra venda cancelada antes de montar `vendas` — igual
 * `resumirLoja` faz para o financeiro. Cancelamento é decisão de "essa venda
 * não aconteceu", não deste motor.
 *
 * Só entram produtos presentes em `saldos`: venda de produto já apagado do
 * cadastro não tem prateleira para aparecer "parada".
 */
export function desempenhoDosProdutos(
  vendas: VendaDoProduto[],
  saldos: SaldoDoProduto[],
  hoje = new Date(),
): DesempenhoDoProduto[] {
  const porProduto = new Map<string, { quantidade: number; ultimaVendaEm: Date }>()

  for (const venda of vendas) {
    const atual = porProduto.get(venda.produtoId)
    porProduto.set(venda.produtoId, {
      quantidade: (atual?.quantidade ?? 0) + venda.quantidade,
      ultimaVendaEm: atual && atual.ultimaVendaEm > venda.criadoEm ? atual.ultimaVendaEm : venda.criadoEm,
    })
  }

  return saldos
    .map((produto): DesempenhoDoProduto => {
      const historico = porProduto.get(produto.produtoId)
      const nuncaVendeu = historico === undefined

      return {
        produtoId: produto.produtoId,
        descricao: produto.descricao,
        saldo: produto.saldo,
        quantidadeVendida: historico?.quantidade ?? 0,
        ultimaVendaEm: historico?.ultimaVendaEm ?? null,
        nuncaVendeu,
        diasSemVender: nuncaVendeu
          ? null
          : Math.floor((hoje.getTime() - historico.ultimaVendaEm.getTime()) / UM_DIA_MS),
      }
    })
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
}
