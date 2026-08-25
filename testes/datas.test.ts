import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  competenciaDe,
  competenciaMaisMeses,
  distanciaEmMeses,
  diaSeguro,
  diasNoMes,
  janelaDoMes,
  intervaloCompetencias,
  ultimasCompetencias,
  lerData,
  rotuloCompetencia,
} from "@/lib/datas"

describe("competências", () => {
  it("vira o ano ao somar meses", () => {
    assert.equal(competenciaMaisMeses("2026-11", 3), "2027-02")
    assert.equal(competenciaMaisMeses("2026-01", -1), "2025-12")
  })

  it("mede distância em meses nos dois sentidos", () => {
    assert.equal(distanciaEmMeses("2026-01", "2026-12"), 11)
    assert.equal(distanciaEmMeses("2026-12", "2026-01"), -11)
    assert.equal(distanciaEmMeses("2026-05", "2026-05"), 0)
  })

  it("extrai a competência de uma data em UTC", () => {
    assert.equal(competenciaDe(new Date(Date.UTC(2026, 7, 24))), "2026-08")
  })

  it("gera intervalos e devolve vazio quando invertido", () => {
    assert.deepEqual(intervaloCompetencias("2026-01", "2026-03"), ["2026-01", "2026-02", "2026-03"])
    assert.deepEqual(intervaloCompetencias("2026-03", "2026-01"), [])
  })

  it("últimas competências terminam na informada", () => {
    const lista = ultimasCompetencias(3, "2026-08")
    assert.deepEqual(lista, ["2026-06", "2026-07", "2026-08"])
  })

  it("rotula em português", () => {
    assert.equal(rotuloCompetencia("2026-08"), "agosto de 2026")
    assert.equal(rotuloCompetencia("2026-08", true), "ago/26")
  })
})

describe("diaSeguro", () => {
  it("não estoura em mês curto", () => {
    // Vencimento dia 31 em fevereiro cai no último dia — é o que o banco faz.
    assert.equal(diaSeguro(2026, 2, 31).getUTCDate(), 28)
    assert.equal(diaSeguro(2028, 2, 31).getUTCDate(), 29, "2028 é bissexto")
    assert.equal(diaSeguro(2026, 4, 31).getUTCDate(), 30)
  })

  it("mantém o dia quando cabe no mês", () => {
    assert.equal(diaSeguro(2026, 8, 15).getUTCDate(), 15)
  })

  it("conta os dias de cada mês", () => {
    assert.equal(diasNoMes(2026, 2), 28)
    assert.equal(diasNoMes(2028, 2), 29)
    assert.equal(diasNoMes(2026, 12), 31)
  })
})

describe("janelaDoMes", () => {
  it("com início no dia 1 cobre o mês inteiro", () => {
    const janela = janelaDoMes("2026-08", 1)
    assert.equal(janela.de.getUTCDate(), 1)
    assert.equal(janela.ate.getUTCDate(), 31)
  })

  it("com início no dia 5 vai do dia 5 ao dia 4 do mês seguinte", () => {
    // Quem recebe dia 5 não pensa em 1º a 31: o orçamento dele começa no
    // dia do salário, e fechar antes separaria salário e contas em meses
    // diferentes.
    const janela = janelaDoMes("2026-08", 5)
    assert.equal(janela.de.getUTCDate(), 5)
    assert.equal(janela.de.getUTCMonth(), 7)
    assert.equal(janela.ate.getUTCMonth(), 8, "termina em setembro")
    assert.equal(janela.ate.getUTCDate(), 4)
  })

  it("a janela nunca deixa buraco entre meses", () => {
    const agosto = janelaDoMes("2026-08", 10)
    const setembro = janelaDoMes("2026-09", 10)
    assert.equal(setembro.de.getTime() - agosto.ate.getTime(), 1, "um milissegundo de diferença, sem lacuna")
  })
})

describe("lerData", () => {
  it("aceita os formatos que os bancos usam", () => {
    assert.equal(lerData("2026-08-24")?.getUTCDate(), 24)
    assert.equal(lerData("24/08/2026")?.getUTCDate(), 24)
    assert.equal(lerData("24/08/26")?.getUTCFullYear(), 2026)
    assert.equal(lerData("20260824")?.getUTCMonth(), 7)
  })

  it("devolve null para texto que não é data", () => {
    assert.equal(lerData("abc"), null)
    assert.equal(lerData(""), null)
  })

  it("não escorrega de dia por causa de fuso", () => {
    // Datas gravadas em UTC à meia-noite: sem isso, o dia muda ao renderizar
    // em America/Sao_Paulo.
    assert.equal(lerData("2026-08-24")?.getUTCHours(), 0)
  })
})
