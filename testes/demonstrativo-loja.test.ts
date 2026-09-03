import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { demonstrativoDaLoja } from "@/lib/loja/demonstrativo"

describe("demonstrativo da loja", () => {
  it("lucro é receita líquida menos CMV menos despesa", () => {
    const demonstrativo = demonstrativoDaLoja({
      receitaLiquidaCentavos: 100000,
      saidasDeEstoque: [{ quantidade: 10, custoUnitarioCentavos: 3000 }],
      despesasPagasCentavos: [15000, 5000],
    })

    assert.equal(demonstrativo.cmvCentavos, 30000)
    assert.equal(demonstrativo.despesasCentavos, 20000)
    assert.equal(demonstrativo.lucroCentavos, 100000 - 30000 - 20000)
  })

  it("saída sem custo conhecido não vira CMV inventado — conta à parte", () => {
    const demonstrativo = demonstrativoDaLoja({
      receitaLiquidaCentavos: 50000,
      saidasDeEstoque: [
        { quantidade: 5, custoUnitarioCentavos: 1000 },
        { quantidade: 3, custoUnitarioCentavos: null },
      ],
      despesasPagasCentavos: [],
    })

    assert.equal(demonstrativo.cmvCentavos, 5000)
    assert.equal(demonstrativo.pecasSemCusto, 3)
  })

  it("sem venda, sem custo e sem despesa — demonstrativo zerado, não null nem NaN", () => {
    const demonstrativo = demonstrativoDaLoja({
      receitaLiquidaCentavos: 0,
      saidasDeEstoque: [],
      despesasPagasCentavos: [],
    })

    assert.equal(demonstrativo.lucroCentavos, 0)
    assert.equal(demonstrativo.pecasSemCusto, 0)
  })

  it("despesa maior que a receita dá lucro negativo, sem travar", () => {
    const demonstrativo = demonstrativoDaLoja({
      receitaLiquidaCentavos: 10000,
      saidasDeEstoque: [],
      despesasPagasCentavos: [50000],
    })

    assert.equal(demonstrativo.lucroCentavos, -40000)
  })
})
