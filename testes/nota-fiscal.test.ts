import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { verificarPendenciasDeEmissao } from "@/lib/nota-fiscal/pendencias"

const LOJA_OK = { cnpj: "12345678000199", inscricaoEstadual: "123456789", certificadoConfiguradoEm: new Date() }
const ITEM_OK = { descricao: "Camiseta P", ncm: "6109.10.00" }

describe("pendências de emissão", () => {
  it("sem nenhuma pendência, pode emitir", () => {
    const verificacao = verificarPendenciasDeEmissao(LOJA_OK, [ITEM_OK], false)
    assert.equal(verificacao.podeEmitir, true)
    assert.deepEqual(verificacao.pendencias, [])
  })

  it("venda cancelada bloqueia mesmo com o resto certo", () => {
    const verificacao = verificarPendenciasDeEmissao(LOJA_OK, [ITEM_OK], true)
    assert.equal(verificacao.podeEmitir, false)
    assert.ok(verificacao.pendencias.some((linha) => linha.includes("cancelada")))
  })

  it("sem CNPJ, sem inscrição e sem certificado — as três pendências aparecem juntas", () => {
    const vazio = { cnpj: null, inscricaoEstadual: null, certificadoConfiguradoEm: null }
    const verificacao = verificarPendenciasDeEmissao(vazio, [ITEM_OK], false)

    assert.equal(verificacao.pendencias.length, 3)
  })

  it("produto sem NCM aparece pelo nome, não some na pendência genérica", () => {
    const verificacao = verificarPendenciasDeEmissao(
      LOJA_OK,
      [ITEM_OK, { descricao: "Boné sem NCM", ncm: null }],
      false,
    )

    assert.equal(verificacao.podeEmitir, false)
    assert.ok(verificacao.pendencias.some((linha) => linha.includes("Boné sem NCM")))
    // Camiseta P tem NCM — não deveria aparecer na lista do que falta.
    assert.ok(!verificacao.pendencias.some((linha) => linha.includes("Camiseta P")))
  })

  it("dois itens diferentes sem NCM aparecem juntos numa pendência só, sem repetir", () => {
    const verificacao = verificarPendenciasDeEmissao(
      LOJA_OK,
      [
        { descricao: "Boné", ncm: null },
        { descricao: "Boné", ncm: null },
        { descricao: "Meia", ncm: null },
      ],
      false,
    )

    const linhaNcm = verificacao.pendencias.find((linha) => linha.startsWith("Falta o NCM"))
    assert.equal(linhaNcm, "Falta o NCM de: Boné, Meia.")
  })
})
