/**
 * Gera os ícones do app (192 e 512 px) sem depender de biblioteca de imagem.
 *
 * O PNG é montado à mão: cabeçalho, um bloco de pixels comprimido com zlib e o
 * fim do arquivo. São ~40 linhas e evitam trazer uma dependência de imagem só
 * para desenhar um quadrado com um símbolo dentro.
 *
 *   node scripts/icones.mjs
 */

import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const FUNDO = [11, 11, 12] // mesmo preto do tema escuro
const ACENTO = [10, 132, 255] // ios-blue

/** CRC32 — o PNG exige um por bloco, e não há um pronto no Node. */
function crc32(buffer) {
  let tabela = crc32.tabela
  if (!tabela) {
    tabela = crc32.tabela = new Int32Array(256)
    for (let n = 0; n < 256; n += 1) {
      let c = n
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      tabela[n] = c
    }
  }

  let crc = -1
  for (const byte of buffer) crc = (crc >>> 8) ^ tabela[(crc ^ byte) & 0xff]
  return (crc ^ -1) >>> 0
}

function bloco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados])
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const verificacao = Buffer.alloc(4)
  verificacao.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, verificacao])
}

/** Desenha o ícone: fundo escuro, moeda azul e uma barra clara atravessando. */
function pixel(x, y, lado) {
  const centro = lado / 2
  const raio = lado * 0.31
  const distancia = Math.hypot(x - centro, y - centro)

  // Anel externo
  if (distancia > raio && distancia < raio * 1.14) return ACENTO

  // Barra vertical do "cifrão", em azul mais claro para dar contraste no anel
  const larguraBarra = lado * 0.045
  if (Math.abs(x - centro) < larguraBarra && distancia < raio * 1.32) return ACENTO

  // Traços horizontais que sugerem as linhas de um extrato
  const alturaTraco = lado * 0.035
  const dentro = distancia < raio * 0.82
  if (dentro && Math.abs(y - (centro - raio * 0.3)) < alturaTraco) return ACENTO
  if (dentro && Math.abs(y - (centro + raio * 0.3)) < alturaTraco) return ACENTO

  return FUNDO
}

function gerarPng(lado) {
  // Cada linha do PNG começa com um byte de filtro; 0 = sem filtro.
  const linhas = []
  for (let y = 0; y < lado; y += 1) {
    const linha = Buffer.alloc(1 + lado * 3)
    for (let x = 0; x < lado; x += 1) {
      const [r, g, b] = pixel(x, y, lado)
      linha[1 + x * 3] = r
      linha[2 + x * 3] = g
      linha[3 + x * 3] = b
    }
    linhas.push(linha)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 2 // cor RGB
  // 10..12 ficam em zero: compressão, filtro e entrelaçamento padrão.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(Buffer.concat(linhas), { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ])
}

const destino = join(process.cwd(), "public", "icones")
mkdirSync(destino, { recursive: true })

for (const lado of [192, 512]) {
  const caminho = join(destino, `icone-${lado}.png`)
  writeFileSync(caminho, gerarPng(lado))
  console.log(`gerado ${caminho}`)
}
