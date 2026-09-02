/**
 * Fiado.
 *
 * Em galeria, "anota aí" é meio de pagamento. O caderno cumpre o papel de
 * registrar, mas não responde as três perguntas que decidem se a loja vai
 * receber: quem deve, quanto, e desde quando.
 *
 * A última é a que mais importa e a que o caderno esconde: dívida de trinta
 * dias e dívida de oito meses pedem conversas diferentes, e no caderno as duas
 * têm a mesma cara.
 */

export interface VendaFiada {
  vendaId: string
  numero: number
  valorCentavos: number
  criadoEm: Date
  recebidoEm: Date | null
}

export interface ClienteDevedor {
  id: string
  nome: string
  telefone: string | null
  devendoCentavos: number
  vendas: VendaFiada[]
  /// Dias desde a compra fiada mais antiga ainda em aberto.
  diasDaMaisAntiga: number
}

/**
 * Quem deve, quanto e há quanto tempo.
 *
 * Ordena pelo mais antigo primeiro, não pelo maior valor: quem deve pouco há
 * muito tempo costuma ser quem não vai pagar, e é essa a cobrança que precisa
 * sair antes.
 */
export function montarDevedores(
  clientes: {
    id: string
    nome: string
    telefone: string | null
    vendas: { id: string; numero: number; criadoEm: Date; pagamentos: { forma: string; valorCentavos: number; recebidoEm: Date | null }[] }[]
  }[],
  hoje = new Date(),
): ClienteDevedor[] {
  const devedores: ClienteDevedor[] = []

  for (const cliente of clientes) {
    const vendas: VendaFiada[] = []

    for (const venda of cliente.vendas) {
      const fiado = venda.pagamentos.filter((pagamento) => pagamento.forma === "FIADO")
      if (fiado.length === 0) continue

      const emAberto = fiado.filter((pagamento) => pagamento.recebidoEm === null)
      if (emAberto.length === 0) continue

      vendas.push({
        vendaId: venda.id,
        numero: venda.numero,
        valorCentavos: emAberto.reduce((soma, pagamento) => soma + pagamento.valorCentavos, 0),
        criadoEm: venda.criadoEm,
        recebidoEm: null,
      })
    }

    if (vendas.length === 0) continue

    const maisAntiga = vendas.reduce((antiga, venda) => (venda.criadoEm < antiga.criadoEm ? venda : antiga))

    devedores.push({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      devendoCentavos: vendas.reduce((soma, venda) => soma + venda.valorCentavos, 0),
      vendas: vendas.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime()),
      diasDaMaisAntiga: Math.floor((hoje.getTime() - maisAntiga.criadoEm.getTime()) / 86_400_000),
    })
  }

  return devedores.sort((a, b) => b.diasDaMaisAntiga - a.diasDaMaisAntiga)
}

export interface ResumoDoFiado {
  totalCentavos: number
  clientes: number
  /// Em aberto há mais de 30 dias.
  atrasadoCentavos: number
}

export function resumirFiado(devedores: ClienteDevedor[]): ResumoDoFiado {
  return {
    totalCentavos: devedores.reduce((soma, devedor) => soma + devedor.devendoCentavos, 0),
    clientes: devedores.length,
    // Trinta dias é a régua do comércio de rua: o combinado é pagar no mês
    // seguinte. Passou disso, a loja está financiando sem juro e sem contrato.
    atrasadoCentavos: devedores
      .filter((devedor) => devedor.diasDaMaisAntiga > 30)
      .reduce((soma, devedor) => soma + devedor.devendoCentavos, 0),
  }
}

/**
 * Texto de cobrança, para o dono mandar no WhatsApp.
 *
 * Escrito por ele, enviado por ele. Cobrança automática em nome da loja azeda
 * relação de bairro — e quem conhece o cliente sabe o tom certo, que nenhum
 * modelo acerta de fora.
 */
export function textoDeCobranca(devedor: ClienteDevedor, nomeDaLoja: string, formatar: (centavos: number) => string) {
  const primeiro = devedor.nome.split(" ")[0]
  const quantas = devedor.vendas.length

  return [
    `Oi, ${primeiro}! Aqui é da ${nomeDaLoja}.`,
    ``,
    quantas === 1
      ? `Ficou ${formatar(devedor.devendoCentavos)} da sua compra.`
      : `Ficaram ${formatar(devedor.devendoCentavos)} de ${quantas} compras.`,
    `Quando puder acertar, me avisa.`,
  ].join("\n")
}
