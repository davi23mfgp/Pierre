/**
 * O que cada papel de acesso pode abrir.
 *
 * Funcionário da loja loga com usuário próprio (ver docs/TINO-MEI.md, Fase 7),
 * mas nunca deveria ver conta pessoal, dívida ou saldo do dono — quem atende o
 * balcão não é sócio da vida financeira de quem contratou.
 *
 * A checagem mora aqui, pura, porque tanto o `middleware.ts` (barra a URL)
 * quanto o menu (esconde o item) precisam da mesma resposta. Dois lugares
 * decidindo o mesmo por conta própria é a receita para um deles ficar
 * desatualizado e abrir uma porta que o outro achava fechada.
 *
 * MEI e DAS ficam de fora do funcionário de propósito: é situação tributária
 * do dono, não operação de balcão.
 */

export type PapelDeAcesso = "TITULAR" | "CONJUGE" | "DEPENDENTE" | "CONVIDADO" | "FUNCIONARIO_LOJA"

const LIBERADO_PARA_FUNCIONARIO = ["/loja", "/api/loja", "/login", "/api/auth/logout"]

export function rotaPermitida(papel: PapelDeAcesso, caminho: string): boolean {
  if (papel !== "FUNCIONARIO_LOJA") return true

  return LIBERADO_PARA_FUNCIONARIO.some((prefixo) => caminho === prefixo || caminho.startsWith(`${prefixo}/`))
}
