import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { fimDaCompetencia, ultimasCompetencias } from "@/lib/datas"

/**
 * O balanço mensal lê do banco, então o motor inteiro não roda aqui. O que dá
 * para provar sem banco é a regra que decide a série: qual lançamento entra em
 * qual mês. Errar esse corte joga a despesa do dia 31 para o mês seguinte e o
 * patrimônio de dezembro aparece melhor do que foi.
 */

/** Mesma conta que a série faz, isolada para poder ser testada. */
function saldoAte(
  transacoes: { data: Date; valorCentavos: number; tipo: string }[],
  ultimoDia: Date,
): number {
  return transacoes
    .filter((linha) => linha.data <= ultimoDia && linha.tipo !== "TRANSFERENCIA")
    .reduce((soma, linha) => soma + (linha.tipo === "RECEITA" ? linha.valorCentavos : -linha.valorCentavos), 0)
}

function parceladoApos(parcelas: { vencimento: Date; valorCentavos: number }[], ultimoDia: Date): number {
  return parcelas
    .filter((parcela) => parcela.vencimento > ultimoDia)
    .reduce((soma, parcela) => soma + parcela.valorCentavos, 0)
}

const emUtc = (texto: string) => new Date(`${texto}T12:00:00.000Z`)

describe("corte do mês", () => {
  it("o último dia do mês entra no mês, não no seguinte", () => {
    const fim = fimDaCompetencia("2026-01")
    const transacoes = [
      { data: emUtc("2026-01-31"), valorCentavos: 10000, tipo: "RECEITA" },
      { data: emUtc("2026-02-01"), valorCentavos: 50000, tipo: "RECEITA" },
    ]

    assert.equal(saldoAte(transacoes, fim), 10000)
  })

  it("fevereiro fecha no dia 28 ou 29, conforme o ano", () => {
    assert.equal(fimDaCompetencia("2026-02").getUTCDate(), 28)
    // 2028 é bissexto.
    assert.equal(fimDaCompetencia("2028-02").getUTCDate(), 29)
  })
})

describe("o que entra no saldo", () => {
  const fim = fimDaCompetencia("2026-03")

  it("receita soma e despesa subtrai", () => {
    const transacoes = [
      { data: emUtc("2026-03-05"), valorCentavos: 500000, tipo: "RECEITA" },
      { data: emUtc("2026-03-10"), valorCentavos: 120000, tipo: "DESPESA" },
    ]

    assert.equal(saldoAte(transacoes, fim), 380000)
  })

  it("transferência não entra", () => {
    // Ela move dinheiro entre contas do mesmo dono; somá-la contaria o mesmo
    // real duas vezes e inflaria o patrimônio.
    const transacoes = [
      { data: emUtc("2026-03-05"), valorCentavos: 500000, tipo: "RECEITA" },
      { data: emUtc("2026-03-06"), valorCentavos: 200000, tipo: "TRANSFERENCIA" },
    ]

    assert.equal(saldoAte(transacoes, fim), 500000)
  })

  it("saldo negativo aparece como negativo", () => {
    const transacoes = [{ data: emUtc("2026-03-02"), valorCentavos: 30000, tipo: "DESPESA" }]
    assert.equal(saldoAte(transacoes, fim), -30000)
  })
})

describe("passivo de parcelamento", () => {
  it("conta só o que ainda vai vencer", () => {
    const fim = fimDaCompetencia("2026-03")
    const parcelas = [
      { vencimento: emUtc("2026-02-10"), valorCentavos: 10000 },
      { vencimento: emUtc("2026-03-10"), valorCentavos: 10000 },
      { vencimento: emUtc("2026-04-10"), valorCentavos: 10000 },
      { vencimento: emUtc("2026-05-10"), valorCentavos: 10000 },
    ]

    // Em março, o que resta são abril e maio.
    assert.equal(parceladoApos(parcelas, fim), 20000)
  })

  it("no fim do parcelamento, o passivo zera", () => {
    const fim = fimDaCompetencia("2026-06")
    const parcelas = [{ vencimento: emUtc("2026-04-10"), valorCentavos: 10000 }]

    assert.equal(parceladoApos(parcelas, fim), 0)
  })
})

describe("série de competências", () => {
  it("devolve os meses em ordem, terminando no atual", () => {
    const serie = ultimasCompetencias(3, "2026-03")
    assert.deepEqual(serie, ["2026-01", "2026-02", "2026-03"])
  })

  it("atravessa a virada do ano", () => {
    const serie = ultimasCompetencias(3, "2026-02")
    assert.deepEqual(serie, ["2025-12", "2026-01", "2026-02"])
  })
})
