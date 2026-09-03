/**
 * Emissor de mentirinha, para rodar sem contrato com provedor nenhum.
 *
 * "Emite" na hora, sem chamar rede, com uma chave de acesso fake — dá para
 * testar a tela e o fluxo de ponta a ponta antes do Davi escolher e pagar por
 * um provedor de verdade. Nunca pode responder em produção: ver a checagem em
 * `../index.ts`, mesma regra do sandbox de Open Finance.
 */

import type { EmissorDeNotaFiscal, NotaEmitida } from "@/lib/nota-fiscal/tipos"

let sequencia = 1

export const emissorSandbox: EmissorDeNotaFiscal = {
  nome: "sandbox",

  async emitir(dados): Promise<NotaEmitida> {
    const numero = sequencia++
    return {
      chaveAcesso: `SANDBOX${String(numero).padStart(10, "0")}`,
      numero,
      serie: 1,
      xml: `<NFCe sandbox="true" numero="${numero}" total="${dados.totalCentavos}" />`,
    }
  },

  async cancelar(): Promise<void> {
    // Não há nada de verdade para desfazer no sandbox.
  },
}
