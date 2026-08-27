/**
 * Contrato de agregador de Open Finance.
 *
 * O Bean não fala direto com o Open Finance do Banco Central: participar do
 * ecossistema exige ser instituição autorizada e certificada. O caminho viável
 * para um app é um agregador já autorizado (Pluggy, Belvo e similares) — este
 * arquivo é a fronteira que isola qual deles está em uso.
 *
 * Trocar de agregador deve ser escrever um arquivo novo em `provedores/`, nunca
 * mexer nas telas ou nas rotas.
 */

export interface ContaExterna {
  id: string
  nome: string
  tipo: "CORRENTE" | "POUPANCA" | "CARTAO_CREDITO" | "INVESTIMENTO"
  instituicao: string
  numero?: string
  saldoCentavos: number
  limiteCentavos?: number
  moeda: string
}

export interface TransacaoExterna {
  id: string
  contaExternaId: string
  data: Date
  descricao: string
  valorCentavos: number
  tipo: "RECEITA" | "DESPESA"
  categoriaProvedor?: string
  documento?: string
}

export interface Conexao {
  itemId: string
  instituicao: string
  status: "ATIVA" | "EXPIRADA" | "ERRO" | "REVOGADA"
  /// Consentimento no padrão do Banco Central vale no máximo 12 meses.
  /// Sem esta data o app não consegue avisar antes da sincronização parar.
  consentimentoExpiraEm?: Date
  erroMensagem?: string
}

export interface ProvedorOpenFinance {
  nome: string

  /// URL do fluxo de consentimento. O usuário autentica no banco, nunca aqui —
  /// o app jamais recebe ou armazena senha bancária.
  urlConsentimento(params: { larId: string; retornoUrl: string }): Promise<string>

  /// Troca o código do callback por uma conexão persistente.
  concluirConsentimento(params: { codigo: string; larId: string }): Promise<Conexao>

  listarContas(itemId: string): Promise<ContaExterna[]>

  listarTransacoes(params: { itemId: string; contaExternaId: string; de: Date; ate: Date }): Promise<TransacaoExterna[]>

  /// Revoga o consentimento no agregador. O usuário tem de conseguir desligar
  /// a conexão pelo app, não só pelo banco.
  revogar(itemId: string): Promise<void>
}
