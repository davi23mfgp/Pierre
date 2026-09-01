/**
 * Estoque da loja.
 *
 * Função pura, como o resto do motor. O saldo de um produto é a soma dos
 * movimentos — nunca um campo gravado. Campo gravado e soma divergem no
 * primeiro erro de gravação, e a partir daí ninguém sabe em qual acreditar;
 * é o mesmo motivo pelo qual o saldo da conta no Tino pessoal também é
 * derivado dos lançamentos.
 */

export type TipoMovimento = "ENTRADA" | "SAIDA" | "AJUSTE"

export interface Movimento {
  tipo: TipoMovimento
  /// Sempre positiva. No AJUSTE é o saldo contado, não a diferença.
  quantidade: number
  custoUnitarioCentavos?: number
  criadoEm: Date
}

/**
 * Saldo do produto.
 *
 * O AJUSTE zera a história: a contagem física manda, porque o que está na
 * prateleira é a verdade e o resto é registro. Por isso a soma recomeça a
 * partir do último ajuste.
 */
export function saldoDoProduto(movimentos: Movimento[]): number {
  const ordenados = [...movimentos].sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())

  const ultimoAjuste = ordenados.map((m) => m.tipo).lastIndexOf("AJUSTE")
  const relevantes = ultimoAjuste >= 0 ? ordenados.slice(ultimoAjuste) : ordenados

  return relevantes.reduce((saldo, movimento) => {
    if (movimento.tipo === "AJUSTE") return movimento.quantidade
    if (movimento.tipo === "ENTRADA") return saldo + movimento.quantidade
    return saldo - movimento.quantidade
  }, 0)
}

/**
 * Custo médio ponderado das entradas.
 *
 * A mesma peça é comprada por preços diferentes ao longo do ano. Usar a última
 * compra faria a margem pular a cada remessa nova; usar a primeira faria a
 * margem envelhecer. A média ponderada pela quantidade é a que responde
 * "quanto me custou, em média, o que está na prateleira".
 *
 * Sem nenhuma entrada com custo, devolve null — e null aqui significa "não
 * sei", que é a resposta honesta. Zero significaria mercadoria de graça, e a
 * margem sairia como 100%.
 */
export function custoMedioCentavos(movimentos: Movimento[]): number | null {
  const entradas = movimentos.filter(
    (movimento) => movimento.tipo === "ENTRADA" && (movimento.custoUnitarioCentavos ?? 0) > 0,
  )
  if (entradas.length === 0) return null

  const pecas = entradas.reduce((soma, movimento) => soma + movimento.quantidade, 0)
  if (pecas === 0) return null

  const total = entradas.reduce(
    (soma, movimento) => soma + movimento.quantidade * (movimento.custoUnitarioCentavos ?? 0),
    0,
  )

  return Math.round(total / pecas)
}

export interface MargemDoProduto {
  precoCentavos: number
  custoCentavos: number | null
  lucroCentavos: number | null
  margemBps: number | null
  markupBps: number | null
}

/**
 * Margem do produto.
 *
 * Margem e markup são confundidos o tempo todo no comércio, e a diferença é
 * dinheiro: comprar por 50 e vender por 100 é 100% de markup e 50% de margem.
 * O app devolve os dois com nome, em vez de escolher um e chamar de "lucro".
 *
 * Sem custo conhecido, tudo volta null. O app diz que falta o custo em vez de
 * exibir uma margem inventada.
 */
export function margemDoProduto(precoCentavos: number, custoCentavos: number | null): MargemDoProduto {
  if (custoCentavos === null || custoCentavos <= 0) {
    return { precoCentavos, custoCentavos, lucroCentavos: null, margemBps: null, markupBps: null }
  }

  const lucroCentavos = precoCentavos - custoCentavos

  return {
    precoCentavos,
    custoCentavos,
    lucroCentavos,
    margemBps: precoCentavos > 0 ? Math.round((lucroCentavos / precoCentavos) * 10_000) : null,
    markupBps: Math.round((lucroCentavos / custoCentavos) * 10_000),
  }
}

export interface SituacaoDoProduto {
  saldo: number
  custoMedioCentavos: number | null
  margem: MargemDoProduto
  acabando: boolean
  semSaldo: boolean
}

/**
 * Situação do produto na prateleira.
 *
 * `minimo` é quanto o dono considera pouco. Sem ele definido, o aviso de
 * "acabando" só dispara no último item — melhor avisar tarde do que inventar
 * um limite que não é o dele.
 */
export function situacaoDoProduto(entrada: {
  precoCentavos: number
  movimentos: Movimento[]
  minimo?: number
}): SituacaoDoProduto {
  const saldo = saldoDoProduto(entrada.movimentos)
  const custo = custoMedioCentavos(entrada.movimentos)
  const minimo = entrada.minimo ?? 1

  return {
    saldo,
    custoMedioCentavos: custo,
    margem: margemDoProduto(entrada.precoCentavos, custo),
    acabando: saldo > 0 && saldo <= minimo,
    semSaldo: saldo <= 0,
  }
}

/**
 * Custo da mercadoria vendida no período.
 *
 * É a metade que falta para o lucro real: o dono vê o que entrou de dinheiro,
 * mas não o que a mercadoria custou. Só conta saída com custo conhecido, e
 * devolve à parte quantas peças ficaram de fora — assim a tela pode dizer
 * "faltam 12 peças sem custo" em vez de mostrar um lucro otimista demais.
 */
export function custoDaMercadoriaVendida(
  saidas: { quantidade: number; custoUnitarioCentavos: number | null }[],
): { totalCentavos: number; pecasSemCusto: number } {
  let totalCentavos = 0
  let pecasSemCusto = 0

  for (const saida of saidas) {
    if (saida.custoUnitarioCentavos === null || saida.custoUnitarioCentavos <= 0) {
      pecasSemCusto += saida.quantidade
      continue
    }
    totalCentavos += saida.quantidade * saida.custoUnitarioCentavos
  }

  return { totalCentavos, pecasSemCusto }
}
