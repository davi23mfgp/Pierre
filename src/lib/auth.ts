import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

// Sem fallback: subir sem JWT_SECRET assinaria token com segredo público, e
// qualquer pessoa forjaria uma sessão. Falhar na largada é melhor que a brecha.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado — defina a variável de ambiente antes de iniciar.")
}
const SEGREDO = new TextEncoder().encode(process.env.JWT_SECRET)

export const COOKIE_SESSAO = "pierre_sessao"

export interface Sessao {
  usuarioId: string
  email: string
  nome: string
  larId: string
  membroId: string | null
}

export async function criarToken(sessao: Sessao): Promise<string> {
  return new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SEGREDO)
}

export async function verificarToken(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, SEGREDO)
    return payload as unknown as Sessao
  } catch {
    return null
  }
}

export async function getSessao(): Promise<Sessao | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_SESSAO)?.value
  if (!token) return null
  return verificarToken(token)
}

/** Sessão obrigatória. Lança quando não há — usado nas rotas autenticadas. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await getSessao()
  if (!sessao) throw new Error("NAO_AUTENTICADO")
  return sessao
}

export async function gravarCookieSessao(token: string) {
  const jar = await cookies()
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    // secure em produção só: em localhost sem HTTPS o cookie seria descartado
    // e o login "funcionaria" sem nunca autenticar.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function limparCookieSessao() {
  const jar = await cookies()
  jar.delete(COOKIE_SESSAO)
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}
