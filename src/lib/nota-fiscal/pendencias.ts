/**
 * O que falta antes de tentar emitir.
 *
 * Motor puro, como o resto da base: nem a tela nem a rota decidem sozinhas se
 * dá para emitir — as duas perguntam aqui, para não existir um lugar que deixa
 * passar o que o outro bloqueia.
 *
 * Devolve a lista de pendências em vez de um booleano só: a tela mostra
 * exatamente o que falta corrigir, em vez de um "não deu" sem explicação — o
 * mesmo motivo pelo qual `margemDoProduto` devolve `null` em vez de inventar
 * número.
 */

export interface DadosFiscaisDaLoja {
  cnpj: string | null
  inscricaoEstadual: string | null
  certificadoConfiguradoEm: Date | null
}

export interface ItemParaNota {
  descricao: string
  ncm: string | null
}

export interface VerificacaoDeEmissao {
  podeEmitir: boolean
  pendencias: string[]
}

export function verificarPendenciasDeEmissao(
  loja: DadosFiscaisDaLoja,
  itens: ItemParaNota[],
  vendaCancelada: boolean,
): VerificacaoDeEmissao {
  const pendencias: string[] = []

  if (vendaCancelada) pendencias.push("Venda cancelada não emite nota.")
  if (!loja.cnpj) pendencias.push("Cadastre o CNPJ da loja.")
  if (!loja.inscricaoEstadual) pendencias.push("Cadastre a inscrição estadual da loja.")
  if (!loja.certificadoConfiguradoEm) pendencias.push("Configure o certificado digital no emissor.")

  const semNcm = [...new Set(itens.filter((item) => !item.ncm).map((item) => item.descricao))]
  if (semNcm.length > 0) pendencias.push(`Falta o NCM de: ${semNcm.join(", ")}.`)

  return { podeEmitir: pendencias.length === 0, pendencias }
}
