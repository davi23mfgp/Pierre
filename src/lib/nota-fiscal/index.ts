/**
 * Emissão de nota fiscal de uma venda.
 *
 * Sem provedor escolhido ainda (ver docs/TINO-MEI.md, Fase 6) — por isso só
 * existe o sandbox aqui. Plugar Focus NFe, eNotas ou outro é escrever um
 * arquivo novo em `provedores/` e um `case` novo em `criarEmissor`, sem tocar
 * na tela nem na rota. Mesmo desenho de `open-finance/index.ts`.
 */

import { prisma } from "@/lib/prisma"
import { verificarPendenciasDeEmissao } from "@/lib/nota-fiscal/pendencias"
import type { EmissorDeNotaFiscal, ItemDaNota } from "@/lib/nota-fiscal/tipos"
import { emissorSandbox } from "@/lib/nota-fiscal/provedores/sandbox"

export function criarEmissor(): EmissorDeNotaFiscal {
  const escolhido = (process.env.NOTA_FISCAL_PROVIDER || "sandbox").toLowerCase()

  // Sandbox em produção significaria mandar pro cliente uma "nota fiscal" que
  // a SEFAZ nunca viu — documento fiscal falso, não bug de tela.
  if (process.env.NODE_ENV === "production" && escolhido === "sandbox") {
    throw new Error("Nota fiscal: provedor sandbox não pode ser usado em produção. Configure NOTA_FISCAL_PROVIDER.")
  }
  return emissorSandbox
}

export class PendenciaDeEmissao extends Error {
  constructor(readonly pendencias: string[]) {
    super(pendencias.join(" "))
  }
}

/**
 * Emite a nota de uma venda já fechada.
 *
 * Falha do provedor vira nota `REJEITADA` com o motivo gravado, não exceção
 * solta — é assim que a tela mostra o que corrigir e deixa tentar de novo.
 * Pendência de cadastro (sem CNPJ, sem NCM) é diferente: nem chega a chamar o
 * provedor, então lança `PendenciaDeEmissao` antes de gastar a emissão.
 */
export async function emitirNotaDaVenda(params: { larId: string; vendaId: string }) {
  const venda = await prisma.vendaLoja.findFirstOrThrow({
    where: { id: params.vendaId, loja: { larId: params.larId } },
    include: { itens: { include: { produto: true } }, loja: true },
  })

  const itensParaNota: ItemDaNota[] = venda.itens.map((item) => ({
    descricao: item.descricao,
    ncm: item.produto?.ncm ?? "",
    quantidade: item.quantidade,
    precoUnitarioCentavos: item.precoUnitarioCentavos,
  }))

  const verificacao = verificarPendenciasDeEmissao(
    {
      cnpj: venda.loja.cnpj,
      inscricaoEstadual: venda.loja.inscricaoEstadual,
      certificadoConfiguradoEm: venda.loja.certificadoConfiguradoEm,
    },
    venda.itens.map((item) => ({ descricao: item.descricao, ncm: item.produto?.ncm ?? null })),
    venda.cancelada,
  )
  if (!verificacao.podeEmitir) throw new PendenciaDeEmissao(verificacao.pendencias)

  const emissor = criarEmissor()

  try {
    const emitida = await emissor.emitir({
      cnpj: venda.loja.cnpj as string,
      inscricaoEstadual: venda.loja.inscricaoEstadual as string,
      numeroVenda: venda.numero,
      itens: itensParaNota,
      totalCentavos: venda.totalCentavos,
    })

    return prisma.notaFiscalVenda.upsert({
      where: { vendaId: venda.id },
      create: {
        vendaId: venda.id,
        status: "EMITIDA",
        chaveAcesso: emitida.chaveAcesso,
        numero: emitida.numero,
        serie: emitida.serie,
        xml: emitida.xml,
        emitidaEm: new Date(),
      },
      update: {
        status: "EMITIDA",
        chaveAcesso: emitida.chaveAcesso,
        numero: emitida.numero,
        serie: emitida.serie,
        xml: emitida.xml,
        motivoRejeicao: null,
        emitidaEm: new Date(),
      },
    })
  } catch (falha) {
    const motivo = falha instanceof Error ? falha.message : "Falha desconhecida no emissor."

    return prisma.notaFiscalVenda.upsert({
      where: { vendaId: venda.id },
      create: { vendaId: venda.id, status: "REJEITADA", motivoRejeicao: motivo },
      update: { status: "REJEITADA", motivoRejeicao: motivo },
    })
  }
}
