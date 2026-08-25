import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { sessaoDaPagina } from "@/lib/pagina"
import { competenciaAtual, rotuloCompetencia } from "@/lib/datas"
import { formatarMoeda } from "@/lib/dinheiro"
import { avaliarMei, limiteProporcionalMei } from "@/lib/financeiro"
import { Barra, Cartao, Metrica, Vazio } from "@/components/ui/painel"

export const dynamic = "force-dynamic"

const AVISO_RISCO: Record<string, { texto: string; tom: string }> = {
  OK: { texto: "Faturamento dentro do limite.", tom: "border-hairline bg-surface-2" },
  ATENCAO: {
    texto: "No ritmo atual o limite anual pode estourar. Vale segurar o faturamento ou já se preparar para migrar de regime.",
    tom: "border-ios-orange/40 bg-ios-orange/10 text-ios-orange",
  },
  ESTOURO_ATE_20: {
    texto:
      "O limite foi ultrapassado em até 20%. O imposto sobre o excedente é recolhido e o desenquadramento passa a valer em janeiro do ano seguinte. Confirme os detalhes com seu contador.",
    tom: "border-ios-red/40 bg-ios-red/10 text-ios-red",
  },
  ESTOURO_ACIMA_20: {
    texto:
      "O limite foi ultrapassado em mais de 20%. Nesse patamar o desenquadramento é retroativo ao início do ano. Procure um contador com urgência.",
    tom: "border-ios-red/50 bg-ios-red/15 text-ios-red",
  },
}

export default async function Mei() {
  const sessao = await sessaoDaPagina()

  const perfil = await prisma.meiPerfil.findUnique({ where: { larId: sessao.larId } })
  if (!perfil) redirect("/configuracoes")

  const competencias = await prisma.meiCompetencia.findMany({
    where: { larId: sessao.larId },
    orderBy: { competencia: "desc" },
  })

  const agora = competenciaAtual()
  const ano = Number(agora.slice(0, 4))
  const mesAtual = Number(agora.slice(5, 7))

  const abriuNesteAno = perfil.dataAbertura?.getUTCFullYear() === ano
  const limiteAnual = abriuNesteAno
    ? limiteProporcionalMei(perfil.limiteAnualCentavos, (perfil.dataAbertura as Date).getUTCMonth() + 1)
    : perfil.limiteAnualCentavos

  const situacao = avaliarMei({
    faturamentoPorCompetencia: competencias.map((linha) => ({
      competencia: linha.competencia,
      valorCentavos: linha.receitaComercioCentavos + linha.receitaServicosCentavos,
    })),
    limiteAnualCentavos: limiteAnual,
    mesAtual,
    ano,
  })

  const emAberto = competencias.filter((linha) => !linha.dasPago && linha.competencia < agora)
  const aviso = AVISO_RISCO[situacao.risco]

  return (
    <div className="space-y-4">
      <Cartao titulo={`Faturamento ${ano}`}>
        <p className="text-4xl font-bold tracking-tight">{formatarMoeda(situacao.faturamentoAnoCentavos)}</p>
        <p className="mt-1 text-sm text-muted-fg">
          de {formatarMoeda(limiteAnual)} de limite
          {abriuNesteAno && " (proporcional aos meses de atividade neste primeiro ano)"}
        </p>

        <div className="mt-4">
          <Barra percentual={situacao.percentualUsado} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metrica rotulo="Usado" valor={`${situacao.percentualUsado}%`} />
          <Metrica rotulo="Ainda cabe" valor={formatarMoeda(situacao.disponivelCentavos)} tom="positivo" />
          <Metrica rotulo="Média mensal" valor={formatarMoeda(situacao.mediaMensalCentavos)} />
          <Metrica
            rotulo="Teto por mês"
            valor={formatarMoeda(situacao.tetoMensalRestanteCentavos)}
            detalhe="para fechar o ano dentro do limite"
          />
        </div>

        <p className={`mt-4 rounded-2xl border p-3 text-sm ${aviso.tom}`}>
          {aviso.texto}
          {situacao.mesQueEstoura && situacao.risco === "ATENCAO" && (
            <> No ritmo de hoje, o limite estoura em {rotuloCompetencia(situacao.mesQueEstoura)}.</>
          )}
        </p>
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="DAS">
          <p className="text-2xl font-semibold">{formatarMoeda(perfil.dasMensalCentavos)}</p>
          <p className="mt-1 text-sm text-muted-fg">
            por mês, vencendo todo dia {perfil.diaVencimentoDas}.
          </p>

          {emAberto.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-ios-red/40 bg-ios-red/10 p-3">
              <p className="text-sm font-medium text-ios-red">{emAberto.length} DAS em aberto</p>
              <p className="mt-1 text-xs text-ios-red/80">
                {emAberto.map((linha) => rotuloCompetencia(linha.competencia, true)).join(", ")}. Atraso gera multa e
                juros, e o mês não conta para a aposentadoria enquanto não for pago.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ios-green">DAS em dia.</p>
          )}
        </Cartao>

        <Cartao titulo="Separação PF e PJ">
          <p className="text-sm text-muted-fg">
            Pró-labore registrado: {formatarMoeda(perfil.proLaboreCentavos)} por mês.
          </p>
          <p className="mt-2 text-sm text-muted-fg">
            Misturar dinheiro do CNPJ com o pessoal é o erro que mais complica MEI: o faturamento vira estimativa e o
            limite anual deixa de ser confiável. Mantenha a conta PJ separada e transfira para a conta pessoal só o
            pró-labore.
          </p>
        </Cartao>
      </div>

      <Cartao titulo="Competências">
        {competencias.length === 0 ? (
          <Vazio titulo="Nenhuma competência lançada" texto="Registre o faturamento de cada mês para o acompanhamento do limite." />
        ) : (
          <div className="divide-y divide-hairline">
            {competencias.map((linha) => {
              const total = linha.receitaComercioCentavos + linha.receitaServicosCentavos
              return (
                <div key={linha.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{rotuloCompetencia(linha.competencia)}</span>
                  <span className="text-muted-fg">{formatarMoeda(total)}</span>
                  <span className={linha.dasPago ? "text-ios-green" : "text-ios-orange"}>
                    {linha.dasPago ? "DAS pago" : "DAS pendente"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Cartao>
    </div>
  )
}
