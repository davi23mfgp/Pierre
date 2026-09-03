/**
 * NCM — código da mercadoria perante a Receita, exigido pela nota fiscal.
 *
 * Motor puro: recebe a tabela como argumento em vez de importar o arquivo de
 * dados aqui dentro, para o teste rodar contra uma tabela pequena de mentira
 * em vez de varrer os 10 mil códigos reais a cada asserção. Quem precisa da
 * tabela de verdade importa `ncm-dados.json` (ver `api/loja/ncm/route.ts`).
 */

export interface CodigoNcm {
  codigo: string
  descricao: string
}

function normalizarCodigo(valor: string): string {
  return valor.replace(/\D/g, "")
}

/** Busca por trecho da descrição ou do próprio código. Termo vazio não devolve nada — evitar mandar a tabela inteira por engano. */
export function buscarNcm(tabela: CodigoNcm[], termo: string, limite = 10): CodigoNcm[] {
  const alvo = termo.trim().toLowerCase()
  if (!alvo) return []

  const alvoNumerico = normalizarCodigo(alvo)

  return tabela
    .filter(
      (item) =>
        item.descricao.toLowerCase().includes(alvo) || (alvoNumerico && item.codigo.includes(alvoNumerico)),
    )
    .slice(0, limite)
}

/** Existe de verdade na tabela oficial — não é só "tem 8 dígitos". */
export function ncmValido(tabela: CodigoNcm[], codigo: string): boolean {
  const alvo = normalizarCodigo(codigo)
  return tabela.some((item) => item.codigo === alvo)
}
