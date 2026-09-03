import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buscarNcm, ncmValido } from "@/lib/loja/ncm"
import type { CodigoNcm } from "@/lib/loja/ncm"

const TABELA: CodigoNcm[] = [
  { codigo: "61091000", descricao: "Camisetas, de malha > De algodão" },
  { codigo: "61102000", descricao: "Suéteres, pulôveres > De algodão" },
  { codigo: "85171231", descricao: "Telefones para redes celulares > Smartphones" },
]

describe("buscarNcm", () => {
  it("acha pela descrição, sem diferenciar maiúscula", () => {
    const achados = buscarNcm(TABELA, "CAMISETA")
    assert.equal(achados.length, 1)
    assert.equal(achados[0].codigo, "61091000")
  })

  it("acha pelo próprio código", () => {
    const achados = buscarNcm(TABELA, "8517")
    assert.equal(achados[0].codigo, "85171231")
  })

  it("termo vazio não devolve a tabela inteira", () => {
    assert.deepEqual(buscarNcm(TABELA, ""), [])
    assert.deepEqual(buscarNcm(TABELA, "   "), [])
  })

  it("respeita o limite", () => {
    const achados = buscarNcm(TABELA, "de algodão", 1)
    assert.equal(achados.length, 1)
  })

  it("sem achado nenhum devolve lista vazia, não erro", () => {
    assert.deepEqual(buscarNcm(TABELA, "xablau"), [])
  })
})

describe("ncmValido", () => {
  it("código real da tabela é válido, com ou sem pontuação", () => {
    assert.equal(ncmValido(TABELA, "61091000"), true)
    assert.equal(ncmValido(TABELA, "6109.10.00"), true)
  })

  it("código inventado não é válido — nada de aceitar número que parece certo", () => {
    assert.equal(ncmValido(TABELA, "99999999"), false)
  })
})
