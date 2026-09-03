/**
 * Contrato de emissor de nota fiscal (NFC-e).
 *
 * O Tino não emite nota fiscal por conta própria: exige credenciamento junto à
 * SEFAZ e homologação de software emissor, que é outro projeto inteiro. O
 * caminho viável é uma API de terceiro (Focus NFe, eNotas, WebmaniaBR — ver
 * docs/TINO-MEI.md) — este arquivo é a fronteira que isola qual está em uso.
 *
 * Trocar de provedor deve ser escrever um arquivo novo em `provedores/`, nunca
 * mexer na tela ou na rota. Mesmo padrão de `open-finance/tipos.ts`.
 */

export interface ItemDaNota {
  descricao: string
  /// Código da mercadoria perante a Receita. Sem ele nenhum provedor emite.
  ncm: string
  quantidade: number
  precoUnitarioCentavos: number
}

export interface DadosParaEmissao {
  cnpj: string
  inscricaoEstadual: string
  /// Número da venda no Tino, não da nota — vira referência externa para achar
  /// a venda de novo se a resposta do provedor se perder no caminho.
  numeroVenda: number
  itens: ItemDaNota[]
  totalCentavos: number
}

export interface NotaEmitida {
  chaveAcesso: string
  numero: number
  serie: number
  /// XML autorizado pela SEFAZ. Guardado como veio — é o documento fiscal de
  /// verdade, recriar por conta própria divergiria do que foi autorizado.
  xml: string
}

/// Emissão recusada pela SEFAZ ou pelo provedor (dado fiscal errado, serviço
/// fora do ar). Não é erro de programação — por isso não é uma exceção comum:
/// quem chama decide se mostra o motivo e deixa tentar de novo.
export interface FalhaDeEmissao {
  motivo: string
}

export interface EmissorDeNotaFiscal {
  nome: string
  emitir(dados: DadosParaEmissao): Promise<NotaEmitida>
  cancelar(params: { chaveAcesso: string; justificativa: string }): Promise<void>
}
