import { comSessao, lerCompetencia, ok } from "@/lib/api"
import { competenciaAtual } from "@/lib/datas"
import { montarPanorama } from "@/lib/bean-counter/panorama"
import { compromissosFuturos, resumoParcelamentos } from "@/lib/parcelamentos"

export const GET = comSessao(async (sessao, requisicao) => {
  const url = new URL(requisicao.url)
  const competencia = lerCompetencia(url.searchParams.get("competencia"), competenciaAtual())

  // Panorama, parcelas e compromissos vêm juntos: a tela inicial mostra os três
  // e três chamadas separadas piscariam números em momentos diferentes.
  const [panorama, parcelamentos, compromissos] = await Promise.all([
    montarPanorama(sessao.larId, competencia),
    resumoParcelamentos(sessao.larId),
    compromissosFuturos(sessao.larId, 18),
  ])

  return ok({ ...panorama, parcelamentos, compromissos })
})
