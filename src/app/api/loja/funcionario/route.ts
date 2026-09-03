import { prisma } from "@/lib/prisma"
import { comSessao, corpo, ok, ErroDeUso, exigir } from "@/lib/api"
import { hashSenha } from "@/lib/auth"

/**
 * Login de quem atende o balcão, separado do dono.
 *
 * Só existe um jeito de entrar aqui: o dono cria a senha na hora, na tela de
 * Configurações. Convite por e-mail seria mais "certinho", mas funcionário de
 * loja troca de gente com frequência — o dono quer criar o acesso e já
 * entregar usuário e senha para quem vai usar, não esperar clique de convite.
 */

function exigirDono(papel: string) {
  if (papel === "FUNCIONARIO_LOJA") throw new ErroDeUso("Este login não gerencia quem tem acesso à loja.", 403)
}

export const GET = comSessao(async (sessao) => {
  exigirDono(sessao.papel)

  const funcionarios = await prisma.usuario.findMany({
    where: { larId: sessao.larId, membro: { papel: "FUNCIONARIO_LOJA" } },
    select: { id: true, nome: true, email: true, ultimoLogin: true },
    orderBy: { criadoEm: "asc" },
  })

  return ok({ funcionarios })
})

export const POST = comSessao(async (sessao, requisicao) => {
  exigirDono(sessao.papel)

  const dados = await corpo<{ nome: string; email: string; senha: string }>(requisicao)
  const nome = exigir(dados.nome, "Informe o nome de quem vai usar.").trim()
  const email = exigir(dados.email, "Informe um e-mail.").trim().toLowerCase()
  const senha = exigir(dados.senha, "Defina uma senha.")
  if (senha.length < 8) throw new ErroDeUso("A senha precisa ter ao menos 8 caracteres.")

  const jaExiste = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  if (jaExiste) throw new ErroDeUso("Já existe uma conta com esse e-mail.", 409)

  const membro = await prisma.membro.create({
    data: { larId: sessao.larId, nome, papel: "FUNCIONARIO_LOJA" },
  })

  const usuario = await prisma.usuario.create({
    data: { email, nome, senhaHash: await hashSenha(senha), larId: sessao.larId, membroId: membro.id },
  })

  return ok({ id: usuario.id, nome: usuario.nome, email: usuario.email }, 201)
})
