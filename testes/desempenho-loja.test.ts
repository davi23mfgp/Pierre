import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { desempenhoDosProdutos } from "@/lib/loja/desempenho"
import type { SaldoDoProduto, VendaDoProduto } from "@/lib/loja/desempenho"

const HOJE = new Date("2026-09-01T12:00:00.000Z")
const diasAtras = (quantos: number) => new Date(HOJE.getTime() - quantos * 86_400_000)

const venda = (produtoId: string, descricao: string, quantidade: number, ha: number): VendaDoProduto => ({
  produtoId,
  descricao,
  quantidade,
  criadoEm: diasAtras(ha),
})

const saldo = (produtoId: string, descricao: string, valor: number): SaldoDoProduto => ({
  produtoId,
  descricao,
  saldo: valor,
})

describe("desempenho dos produtos", () => {
  it("soma a quantidade vendida por produto", () => {
    const linhas = desempenhoDosProdutos(
      [venda("p1", "Camiseta P", 2, 10), venda("p1", "Camiseta P", 3, 3)],
      [saldo("p1", "Camiseta P", 5)],
      HOJE,
    )

    assert.equal(linhas[0].quantidadeVendida, 5)
  })

  it("marca a data da venda mais recente, não a mais antiga", () => {
    const linhas = desempenhoDosProdutos(
      [venda("p1", "Camiseta P", 1, 20), venda("p1", "Camiseta P", 1, 3)],
      [saldo("p1", "Camiseta P", 5)],
      HOJE,
    )

    assert.equal(linhas[0].diasSemVender, 3)
    assert.equal(linhas[0].nuncaVendeu, false)
  })

  it("produto com saldo que nunca vendeu aparece com nuncaVendeu — não com dias inventados", () => {
    const linhas = desempenhoDosProdutos([], [saldo("p2", "Boné", 8)], HOJE)

    assert.equal(linhas[0].nuncaVendeu, true)
    assert.equal(linhas[0].diasSemVender, null)
    assert.equal(linhas[0].quantidadeVendida, 0)
  })

  it("produto sem saldo nenhum (nunca cadastrado movimento) não aparece na lista", () => {
    // Só entra quem está no cadastro de saldos — venda órfã de produto apagado não vira linha.
    const linhas = desempenhoDosProdutos([venda("fantasma", "Sumiu", 1, 1)], [], HOJE)

    assert.equal(linhas.length, 0)
  })

  it("venda cancelada não deve ser passada aqui — a função soma o que recebe, sem filtrar cancelamento", () => {
    // Guarda de documentação: quem monta a lista (a rota) já filtra `cancelada`,
    // igual resumirLoja faz. Este teste marca essa responsabilidade.
    const linhas = desempenhoDosProdutos([venda("p1", "Camiseta P", 4, 1)], [saldo("p1", "Camiseta P", 1)], HOJE)
    assert.equal(linhas[0].quantidadeVendida, 4)
  })

  it("ordena do mais vendido para o menos vendido", () => {
    const linhas = desempenhoDosProdutos(
      [venda("p1", "Camiseta P", 2, 1), venda("p2", "Boné", 9, 1)],
      [saldo("p1", "Camiseta P", 5), saldo("p2", "Boné", 5)],
      HOJE,
    )

    assert.equal(linhas[0].produtoId, "p2")
    assert.equal(linhas[1].produtoId, "p1")
  })

  it("produto zerado no estoque não entra como 'nunca vendeu' se já vendeu tudo", () => {
    const linhas = desempenhoDosProdutos([venda("p1", "Camiseta P", 5, 2)], [saldo("p1", "Camiseta P", 0)], HOJE)

    assert.equal(linhas[0].nuncaVendeu, false)
    assert.equal(linhas[0].diasSemVender, 2)
    assert.equal(linhas[0].saldo, 0)
  })
})
