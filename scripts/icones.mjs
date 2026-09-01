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

// Os mesmos tons do tema escuro do app: grafite azulado e o azul do positivo.
const FUNDO = [27, 29, 36]
const ACENTO = [104, 152, 240]

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

/**
 * Desenha o Tino no ícone.
 *
 * O mesmo personagem da tela: corpo de bloco de anotação, fita de cupom saindo
 * do topo, dois olhos e a linha de pauta no peito. Ícone e mascote precisam ser
 * a mesma coisa — quem procura o app na tela do celular procura a cara dele.
 *
 * Tudo em coordenada relativa ao lado, para 192 e 512 saírem idênticos.
 */
function pixel(x, y, lado) {
  const u = x / lado
  const v = y / lado

  const dentroDoRetangulo = (x0, y0, x1, y1) => u >= x0 && u <= x1 && v >= y0 && v <= y1
  const distanciaDe = (cx, cy) => Math.hypot(u - cx, v - cy)

  // Corpo: retângulo com cantos aparados na diagonal, que a essa resolução
  // lê como canto arredondado sem precisar de curva de verdade.
  const corpo = dentroDoRetangulo(0.2, 0.26, 0.8, 0.78)
  const cantoCortado =
    (u < 0.26 && v < 0.32 && 0.26 - u + (0.32 - v) > 0.055) ||
    (u > 0.74 && v < 0.32 && u - 0.74 + (0.32 - v) > 0.055) ||
    (u < 0.26 && v > 0.72 && 0.26 - u + (v - 0.72) > 0.055) ||
    (u > 0.74 && v > 0.72 && u - 0.74 + (v - 0.72) > 0.055)

  if (corpo && !cantoCortado) {
    // Olhos.
    if (distanciaDe(0.39, 0.47) < 0.045 || distanciaDe(0.61, 0.47) < 0.045) return FUNDO
    // Boca: traço reto, a expressão tranquila.
    if (dentroDoRetangulo(0.41, 0.6, 0.59, 0.628)) return FUNDO
    // Pauta do peito.
    if (dentroDoRetangulo(0.2, 0.7, 0.8, 0.715)) return FUNDO
    return ACENTO
  }

  // Fita de cupom saindo do topo, em duas partes: a subida e a dobra.
  if (Math.abs(u - 0.5) < 0.02 && v > 0.16 && v < 0.27) return ACENTO
  if (distanciaDe(0.6, 0.17) > 0.075 && distanciaDe(0.6, 0.17) < 0.1 && v < 0.2 && u > 0.5) return ACENTO

  // Pés.
  if (dentroDoRetangulo(0.34, 0.78, 0.38, 0.85)) return ACENTO
  if (dentroDoRetangulo(0.62, 0.78, 0.66, 0.85)) return ACENTO

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
