import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  custoDaMercadoriaVendida,
  custoMedioCentavos,
  margemDoProduto,
  saldoDoProduto,
  situacaoDoProduto,
} from "@/lib/loja/estoque"
import type { Movimento } from "@/lib/loja/estoque"

const dia = (d: number) => new Date(`2026-08-${String(d).padStart(2, "0")}T12:00:00.000Z`)

const entrada = (quantidade: number, custo: number, d: number): Movimento => ({
  tipo: "ENTRADA",
  quantidade,
  custoUnitarioCentavos: custo,
  criadoEm: dia(d),
})

const saida = (quantidade: number, d: number): Movimento => ({
  tipo: "SAIDA",
  quantidade,
  criadoEm: dia(d),
})

describe("saldo do produto", () => {
  it("é a soma dos movimentos", () => {
    assert.equal(saldoDoProduto([entrada(10, 1000, 1), saida(3, 2), saida(2, 3)]), 5)
  })

  it("sem movimento nenhum, é zero", () => {
    assert.equal(saldoDoProduto([]), 0)
  })

  it("a contagem física manda, e o que veio antes dela não conta mais", () => {
    // O que está na prateleira é a verdade; o registro é que estava errado.
    const movimentos: Movimento[] = [
      entrada(10, 1000, 1),
      saida(3, 2),
      { tipo: "AJUSTE", quantidade: 4, criadoEm: dia(5) },
      saida(1, 6),
    ]

    assert.equal(saldoDoProduto(movimentos), 3)
  })

  it("aceita saldo negativo em vez de esconder", () => {
    // Vender mais do que o registro tem significa que a entrada não foi
    // lançada. Travar em zero apagaria a pista de que falta lançar mercadoria.
    assert.equal(saldoDoProduto([entrada(2, 500, 1), saida(5, 2)]), -3)
  })

  it("não depende da ordem em que os movimentos chegam", () => {
    const fora = [saida(1, 6), { tipo: "AJUSTE" as const, quantidade: 4, criadoEm: dia(5) }, entrada(10, 1000, 1)]
    assert.equal(saldoDoProduto(fora), 3)
  })
})

describe("custo médio", () => {
  it("pondera pela quantidade, não pela média simples", () => {
    // 10 peças a R$ 10 e 90 a R$ 20: a média simples diria R$ 15, o que faria
    // a margem de 90% do estoque sair errada.
    const custo = custoMedioCentavos([entrada(10, 1000, 1), entrada(90, 2000, 2)])
    assert.equal(custo, 1900)
  })

  it("sem entrada com custo, responde que não sabe", () => {
    // null é "não sei". Zero seria mercadoria de graça, e a margem sairia 100%.
    assert.equal(custoMedioCentavos([]), null)
    assert.equal(custoMedioCentavos([entrada(5, 0, 1)]), null)
  })

  it("ignora a saída no cálculo do custo", () => {
    assert.equal(custoMedioCentavos([entrada(10, 1000, 1), saida(9, 2)]), 1000)
  })
})

describe("margem", () => {
  it("separa margem de markup", () => {
    // Comprar por 50 e vender por 100 é 50% de margem e 100% de markup. O
    // comércio confunde os dois, e a diferença é dinheiro.
    const margem = margemDoProduto(10000, 5000)

    assert.equal(margem.lucroCentavos, 5000)
    assert.equal(margem.margemBps, 5000)
    assert.equal(margem.markupBps, 10000)
  })

  it("sem custo conhecido, não inventa margem", () => {
    const margem = margemDoProduto(10000, null)

    assert.equal(margem.lucroCentavos, null)
    assert.equal(margem.margemBps, null)
    assert.equal(margem.markupBps, null)
  })

  it("mostra prejuízo como prejuízo", () => {
    const margem = margemDoProduto(4000, 5000)

    assert.equal(margem.lucroCentavos, -1000)
    assert.equal(margem.margemBps, -2500)
  })
})

describe("situação na prateleira", () => {
  it("avisa quando está acabando, pelo mínimo do dono", () => {
    const situacao = situacaoDoProduto({
      precoCentavos: 5000,
      movimentos: [entrada(10, 2000, 1), saida(8, 2)],
      minimo: 3,
    })

    assert.equal(situacao.saldo, 2)
    assert.equal(situacao.acabando, true)
    assert.equal(situacao.semSaldo, false)
  })

  it("sem mínimo definido, não inventa um limite", () => {
    // Avisar tarde é melhor que avisar por um número que o dono não escolheu.
    const situacao = situacaoDoProduto({
      precoCentavos: 5000,
      movimentos: [entrada(10, 2000, 1), saida(8, 2)],
    })

    assert.equal(situacao.acabando, false)
  })

  it("acabou não é o mesmo que está acabando", () => {
    const situacao = situacaoDoProduto({
      precoCentavos: 5000,
      movimentos: [entrada(10, 2000, 1), saida(10, 2)],
      minimo: 3,
    })

    assert.equal(situacao.semSaldo, true)
    assert.equal(situacao.acabando, false)
  })

  it("leva a margem junto", () => {
    const situacao = situacaoDoProduto({ precoCentavos: 5000, movimentos: [entrada(10, 2000, 1)] })
    assert.equal(situacao.margem.margemBps, 6000)
  })
})

describe("custo da mercadoria vendida", () => {
  it("soma o que tem custo e conta à parte o que não tem", () => {
    // Sem separar, o lucro sairia otimista: peça sem custo entraria como se
    // tivesse saído de graça.
    const resultado = custoDaMercadoriaVendida([
      { quantidade: 3, custoUnitarioCentavos: 2000 },
      { quantidade: 2, custoUnitarioCentavos: null },
      { quantidade: 1, custoUnitarioCentavos: 0 },
    ])

    assert.equal(resultado.totalCentavos, 6000)
    assert.equal(resultado.pecasSemCusto, 3)
  })
})
