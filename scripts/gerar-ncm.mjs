/**
 * Gera src/lib/loja/ncm-dados.json a partir da tabela oficial de NCM.
 *
 * A fonte é a tabela completa da Receita/Comex Stat (formato usado pelo
 * flowdeal, o ERP do Davi, em ncm-oficial.json) — 15 mil entradas, a maioria
 * cabeçalho de capítulo, não código de produto de verdade. Filtra só as
 * folhas de 8 dígitos (o que a nota fiscal exige) e monta o caminho completo
 * ("Camisetas, de malha > De algodão"), porque a descrição de uma folha
 * sozinha costuma ser só "Outros" ou "De algodão" — sem o pai, não diz nada
 * pra quem está procurando.
 *
 * Rodar de novo quando a tabela oficial for atualizada:
 *   node scripts/gerar-ncm.mjs <caminho para o ncm-oficial.json de origem>
 */

import { readFileSync, writeFileSync } from "node:fs"

const origem = process.argv[2]
if (!origem) {
  console.error("Uso: node scripts/gerar-ncm.mjs <ncm-oficial.json>")
  process.exit(1)
}

const dados = JSON.parse(readFileSync(origem, "utf-8"))

function nivel(descricao) {
  const combinacao = descricao.match(/^(-+)\s?/)
  return combinacao ? combinacao[1].length : 0
}

function limpar(texto) {
  return texto
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const pilha = []
const resultado = []

for (const item of dados.Nomenclaturas) {
  const n = nivel(item.Descricao)
  const texto = limpar(item.Descricao.replace(/^-+\s?/, ""))

  while (pilha.length && pilha[pilha.length - 1].nivel >= n) pilha.pop()

  const codigo = item.Codigo.replace(/\D/g, "")
  if (codigo.length === 8) {
    const caminho = [...pilha.map((p) => p.texto), texto].join(" > ")
    resultado.push({ codigo, descricao: caminho })
  }

  pilha.push({ nivel: n, texto })
}

const destino = new URL("../src/lib/loja/ncm-dados.json", import.meta.url)
writeFileSync(destino, JSON.stringify(resultado))
console.log(`${resultado.length} códigos NCM gravados em ${destino.pathname}`)
console.log(`Fonte: ${dados.Data_Ultima_Atualizacao_NCM} — ${dados.Ato}`)
