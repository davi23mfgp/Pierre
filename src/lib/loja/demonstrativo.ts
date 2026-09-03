/**
 * DRE da loja — separado do parecer pessoal do dono.
 *
 * Reaproveita o que já existe e já é testado: receita líquida vem de
 * `resumirLoja` (Fase 5), CMV vem de `custoDaMercadoriaVendida` (Fase 2),
 * despesa vem das `ContaDaLoja` pagas no período (Fase 4). Este arquivo só
 * soma as três pontas.
 *
 * De propósito não é uma variação de `src/lib/tino/diagnostico.ts`: aquele é
 * o motor da vida PESSOAL do dono, alimentado por `Conta`/`Transacao`. Este
 * nunca toca nenhuma das duas — é construído só a partir dos modelos da loja
 * — então não existe risco de vazar número pessoal aqui por engano. Mesma
 * separação de "produto separado" que já existe entre `src/lib/loja` e
 * `src/lib/tino` (ver docs/TINO-MEI.md).
 */

import { custoDaMercadoriaVendida } from "@/lib/loja/estoque"

export interface DemonstrativoDaLoja {
  receitaLiquidaCentavos: number
  cmvCentavos: number
  despesasCentavos: number
  lucroCentavos: number
  /// Peças vendidas sem custo de entrada conhecido — o CMV acima não as conta,
  /// então o lucro está inflado nessa medida. Mostrar isso é o que impede o
  /// demonstrativo de parecer mais saudável do que é de verdade.
  pecasSemCusto: number
}

export function demonstrativoDaLoja(params: {
  receitaLiquidaCentavos: number
  saidasDeEstoque: { quantidade: number; custoUnitarioCentavos: number | null }[]
  despesasPagasCentavos: number[]
}): DemonstrativoDaLoja {
  const { totalCentavos: cmvCentavos, pecasSemCusto } = custoDaMercadoriaVendida(params.saidasDeEstoque)
  const despesasCentavos = params.despesasPagasCentavos.reduce((soma, valor) => soma + valor, 0)

  return {
    receitaLiquidaCentavos: params.receitaLiquidaCentavos,
    cmvCentavos,
    despesasCentavos,
    lucroCentavos: params.receitaLiquidaCentavos - cmvCentavos - despesasCentavos,
    pecasSemCusto,
  }
}
