import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  corteViraPatrimonio,
  dividirPorArca,
  dividirRenda,
  efeitoDoCorte,
} from "@/lib/tino/investir"

describe("divisão da renda", () => {
  it("aplica os percentuais de referência", () => {
    const fatias = dividirRenda(600000)
    const porNome = Object.fromEntries(fatias.map((fatia) => [fatia.nome, fatia.valorCentavos]))

    assert.equal(porNome.necessidades, 360000)
    assert.equal(porNome.lazer, 60000)
    assert.equal(porNome.educacao, 60000)
    assert.equal(porNome.longoPrazo, 90000)
    assert.equal(porNome.reserva, 30000)
  })

  it("a soma das fatias devolve a renda exata", () => {
    // Valor escolhido para forçar arredondamento em todas as fatias.
    for (const renda of [333333, 100001, 777777, 1]) {
      const soma = dividirRenda(renda).reduce((total, fatia) => total + fatia.valorCentavos, 0)
      assert.equal(soma, renda, `não fechou para ${renda}`)
    }
  })

  it("renda zero não vira fatia negativa", () => {
    assert.ok(dividirRenda(0).every((fatia) => fatia.valorCentavos === 0))
    assert.ok(dividirRenda(-500).every((fatia) => fatia.valorCentavos === 0))
  })
})

describe("ARCA", () => {
  it("divide em quatro partes que somam o valor", () => {
    const partes = dividirPorArca(100000)
    assert.equal(partes.length, 4)
    assert.equal(
      partes.reduce((soma, parte) => soma + parte.valorCentavos, 0),
      100000,
    )
  })

  it("não perde centavo em valor indivisível por quatro", () => {
    const partes = dividirPorArca(1001)
    assert.equal(
      partes.reduce((soma, parte) => soma + parte.valorCentavos, 0),
      1001,
    )
  })
})

describe("efeito do corte no caixa", () => {
  const base = {
    saldoInicialCentavos: 100000,
    receitaMensalCentavos: 500000,
    despesaMensalCentavos: 560000,
    meses: 12,
    jurosNegativoMensalBps: 800,
  }

  it("sem corte, o caixa afunda", () => {
    const resultado = efeitoDoCorte({ ...base, cortePorMesCentavos: 0 })

    assert.ok(resultado.serie[11].semCorteCentavos < 0)
    // R$ 1.000 de saldo aguentam o primeiro mês de déficit de R$ 600; o buraco
    // aparece no segundo.
    assert.equal(resultado.mesQueFicaNegativoSemCorte, 2)
  })

  it("o corte muda o fim da história", () => {
    const resultado = efeitoDoCorte({ ...base, cortePorMesCentavos: 80000 })

    assert.ok(resultado.serie[11].comCorteCentavos > resultado.serie[11].semCorteCentavos)
    assert.ok(resultado.diferencaCentavos > 0)
  })

  it("saldo negativo paga juros, e não fica parado", () => {
    // Sem cobrar o cheque especial, a projeção sugeriria que ficar no vermelho
    // não custa nada — e o corte pareceria menos urgente do que é.
    const comJuros = efeitoDoCorte({ ...base, cortePorMesCentavos: 0 })
    const semJuros = efeitoDoCorte({ ...base, cortePorMesCentavos: 0, jurosNegativoMensalBps: 0 })

    assert.ok(comJuros.serie[11].semCorteCentavos < semJuros.serie[11].semCorteCentavos)
  })

  it("aponta o mês em que o corte tira do vermelho", () => {
    const resultado = efeitoDoCorte({ ...base, cortePorMesCentavos: 70000 })

    assert.ok(resultado.mesQueSaiDoVermelho !== null)
    const mes = resultado.mesQueSaiDoVermelho as number
    assert.ok(resultado.serie[mes - 1].comCorteCentavos >= 0)
    assert.ok(resultado.serie[mes - 1].semCorteCentavos < 0)
  })

  it("quem já está no azul não recebe mês de saída", () => {
    const resultado = efeitoDoCorte({
      saldoInicialCentavos: 1000000,
      receitaMensalCentavos: 500000,
      despesaMensalCentavos: 400000,
      cortePorMesCentavos: 10000,
      meses: 12,
    })

    assert.equal(resultado.mesQueFicaNegativoSemCorte, null)
    assert.equal(resultado.mesQueSaiDoVermelho, null)
  })
})

describe("corte virando patrimônio", () => {
  it("separa o que foi aportado do que veio de juros", () => {
    const resultado = corteViraPatrimonio({
      cortePorMesCentavos: 20000,
      anos: 20,
      rendimentoRealAnualBps: 500,
    })

    assert.equal(resultado.aportadoCentavos, 20000 * 240)
    assert.ok(resultado.patrimonioCentavos > resultado.aportadoCentavos)
    assert.equal(resultado.jurosCentavos, resultado.patrimonioCentavos - resultado.aportadoCentavos)
  })

  it("sem rendimento, patrimônio é só a soma dos aportes", () => {
    const resultado = corteViraPatrimonio({ cortePorMesCentavos: 10000, anos: 5, rendimentoRealAnualBps: 0 })

    assert.equal(resultado.patrimonioCentavos, 10000 * 60)
    assert.equal(resultado.jurosCentavos, 0)
  })

  it("prazo zero não inventa patrimônio", () => {
    const resultado = corteViraPatrimonio({ cortePorMesCentavos: 50000, anos: 0, rendimentoRealAnualBps: 600 })
    assert.equal(resultado.patrimonioCentavos, 0)
  })
})
