import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { paraCentavos, formatarMoeda, ratear, ratearPorPeso, bpsParaTaxa, taxaParaBps } from "@/lib/dinheiro"

describe("paraCentavos", () => {
  it("lê o formato brasileiro", () => {
    assert.equal(paraCentavos("1.234,56"), 123456)
    assert.equal(paraCentavos("R$ 1.234,56"), 123456)
    assert.equal(paraCentavos("52,30"), 5230)
    assert.equal(paraCentavos("0,01"), 1)
  })

  it("lê o formato americano", () => {
    assert.equal(paraCentavos("1,234.56"), 123456)
    assert.equal(paraCentavos("12.34"), 1234)
  })

  it("distingue milhar de decimal quando só há ponto", () => {
    // "1.234" é mil duzentos e trinta e quatro reais; "12.34" é doze e trinta e
    // quatro. A diferença está no tamanho do último grupo.
    assert.equal(paraCentavos("1.234"), 123400)
    assert.equal(paraCentavos("12.34"), 1234)
  })

  it("entende negativo com sinal e com parênteses", () => {
    assert.equal(paraCentavos("-52,30"), -5230)
    assert.equal(paraCentavos("(52,30)"), -5230)
  })

  it("devolve zero para texto sem número", () => {
    assert.equal(paraCentavos(""), 0)
    assert.equal(paraCentavos("abc"), 0)
  })

  it("converte número em centavos sem erro de float", () => {
    // 0.1 + 0.2 em float dá 0.30000000000000004; em centavos precisa dar 30.
    assert.equal(paraCentavos(0.1) + paraCentavos(0.2), 30)
    assert.equal(paraCentavos(19.99), 1999)
  })
})

describe("formatarMoeda", () => {
  it("formata em real com duas casas", () => {
    assert.match(formatarMoeda(123456), /1\.234,56/)
    assert.match(formatarMoeda(-5230), /-.*52,30/)
    assert.match(formatarMoeda(0), /0,00/)
  })
})

describe("ratear", () => {
  it("divide sem perder centavo", () => {
    const partes = ratear(1000, 3)
    assert.deepEqual(partes, [334, 333, 333])
    assert.equal(
      partes.reduce((soma, parte) => soma + parte, 0),
      1000,
    )
  })

  it("mantém o sinal ao dividir valor negativo", () => {
    const partes = ratear(-1000, 3)
    assert.equal(
      partes.reduce((soma, parte) => soma + parte, 0),
      -1000,
    )
    assert.ok(partes.every((parte) => parte < 0))
  })

  it("devolve lista vazia para zero partes", () => {
    assert.deepEqual(ratear(1000, 0), [])
  })
})

describe("ratearPorPeso", () => {
  it("divide pela renda de cada um e fecha a soma", () => {
    const partes = ratearPorPeso(100000, [5200, 3400])
    assert.equal(
      partes.reduce((soma, parte) => soma + parte, 0),
      100000,
    )
    assert.ok(partes[0] > partes[1], "quem ganha mais paga mais")
  })

  it("cai na divisão igual quando os pesos somam zero", () => {
    const partes = ratearPorPeso(900, [0, 0, 0])
    assert.deepEqual(partes, [300, 300, 300])
  })
})

describe("pontos-base", () => {
  it("converte ida e volta sem perder valor", () => {
    assert.equal(bpsParaTaxa(250), 0.025)
    assert.equal(taxaParaBps(0.025), 250)
    assert.equal(taxaParaBps(bpsParaTaxa(789)), 789)
  })
})
