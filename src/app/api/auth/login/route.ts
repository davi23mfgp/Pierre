import { prisma } from "@/lib/prisma"
import { conferirSenha, criarToken, gravarCookieSessao } from "@/lib/auth"
import { corpo, erro, exigir, ok } from "@/lib/api"

export async function POST(requisicao: Request) {
  const dados = await corpo<{ email: string; senha: string }>(requisicao)
  const email = exigir(dados.email, "Informe o e-mail").trim().toLowerCase()
  const senha = exigir(dados.senha, "Informe a senha")

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  // Mesma mensagem para e-mail inexistente e senha errada: respostas diferentes
  // permitiriam descobrir quais e-mails têm conta no sistema.
  const invalido = erro("E-mail ou senha incorretos.", 401)
  if (!usuario) return invalido
  if (!(await conferirSenha(senha, usuario.senhaHash))) return invalido

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLogin: new Date() } })

  await gravarCookieSessao(
    await criarToken({
      usuarioId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      larId: usuario.larId,
      membroId: usuario.membroId,
    }),
  )

  return ok({ id: usuario.id, nome: usuario.nome, email: usuario.email })
}
