import { prisma } from "@/lib/prisma"
import { comSessao, ok, ErroDeUso } from "@/lib/api"

type Contexto = { params: Promise<{ id: string }> }

/**
 * Remove o acesso de quem atendia o balcão.
 *
 * Apaga o usuário e o membro criados só para esse login — diferente do dono,
 * que nunca se apaga por aqui. A venda que essa pessoa registrou fica: o
 * histórico é da loja, não do login de quem bateu o caixa.
 */
export const DELETE = comSessao<Contexto>(async (sessao, _requisicao, contexto) => {
  if (sessao.papel === "FUNCIONARIO_LOJA") {
    throw new ErroDeUso("Este login não gerencia quem tem acesso à loja.", 403)
  }

  const { id } = await contexto.params
  const usuario = await prisma.usuario.findFirst({
    where: { id, larId: sessao.larId, membro: { papel: "FUNCIONARIO_LOJA" } },
  })
  if (!usuario) throw new ErroDeUso("Login não encontrado.", 404)

  await prisma.usuario.delete({ where: { id: usuario.id } })
  if (usuario.membroId) await prisma.membro.delete({ where: { id: usuario.membroId } })

  return ok({ removido: true })
})
