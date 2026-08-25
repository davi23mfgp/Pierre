/**
 * Leitor de extrato e fatura em PDF.
 *
 * PDF de banco não tem estrutura de tabela: o texto extraído vem como linhas
 * soltas. A estratégia é procurar, em cada linha, o trio data + descrição +
 * valor. O que não casar volta para o usuário como "linha não reconhecida"
 * em vez de ser adivinhado — chute em extrato vira erro de saldo.
 */

import { extractText, getDocumentProxy } from "unpdf"

import { lerData } from "@/lib/datas"
import { paraCentavos } from "@/lib/dinheiro"
import type { LancamentoBruto } from "@/lib/importar/ofx"

export interface ResultadoPdf {
  lancamentos: LancamentoBruto[]
  paginas: number
  naoReconhecidas: string[]
  textoBruto: string
}

const DATA = /(\d{2}[\/.-]\d{2}(?:[\/.-]\d{2,4})?)/
const VALOR = /(-?\s?R?\$?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*([DC])?\s*$/

/** Erro específico para o app pedir a senha em vez de mostrar falha genérica. */
export class PdfProtegido extends Error {
  constructor(readonly senhaIncorreta: boolean) {
    super(
      senhaIncorreta
        ? "Senha incorreta para este PDF."
        : "Este PDF é protegido por senha. Bancos costumam usar os primeiros dígitos do CPF ou a data de nascimento.",
    )
  }
}

export async function lerPdf(
  dados: ArrayBuffer,
  anoPadrao = new Date().getUTCFullYear(),
  senha?: string,
): Promise<ResultadoPdf> {
  let documento
  try {
    // Fatura de banco vem cifrada quase sempre. Sem repassar a senha aqui, o
    // pdf.js lança e a importação inteira falha sem dizer o motivo.
    documento = await getDocumentProxy(new Uint8Array(dados), senha ? { password: senha } : undefined)
  } catch (erro) {
    const nome = (erro as { name?: string })?.name
    if (nome === "PasswordException") throw new PdfProtegido(Boolean(senha))
    throw erro
  }

  const { text, totalPages } = await extractText(documento, { mergePages: true })
  const textoBruto = Array.isArray(text) ? text.join("\n") : text

  const lancamentos: LancamentoBruto[] = []
  const naoReconhecidas: string[] = []

  for (const linhaBruta of textoBruto.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/\s{2,}/g, " ").trim()
    if (linha.length < 8) continue

    const casaData = DATA.exec(linha)
    const casaValor = VALOR.exec(linha)
    if (!casaData || !casaValor) {
      if (/\d,\d{2}/.test(linha)) naoReconhecidas.push(linha.slice(0, 140))
      continue
    }

    // Extrato costuma omitir o ano ("12/03"); o ano do arquivo entra no lugar.
    const dataTexto = casaData[1].length <= 5 ? `${casaData[1]}/${anoPadrao}` : casaData[1]
    const data = lerData(dataTexto)
    if (!data) {
      naoReconhecidas.push(linha.slice(0, 140))
      continue
    }

    const centavos = paraCentavos(casaValor[1])
    const descricao = linha
      .replace(casaData[1], "")
      .replace(casaValor[0], "")
      .replace(/\s{2,}/g, " ")
      .trim()

    // Alguns bancos marcam o sinal com "D"/"C" no fim em vez do menos.
    const marcador = casaValor[2]
    const despesa = marcador ? marcador === "D" : centavos < 0

    lancamentos.push({
      data,
      descricao: descricao || "Lançamento sem descrição",
      valorCentavos: Math.abs(centavos),
      tipo: despesa ? "DESPESA" : "RECEITA",
    })
  }

  return { lancamentos, paginas: totalPages, naoReconhecidas, textoBruto }
}
