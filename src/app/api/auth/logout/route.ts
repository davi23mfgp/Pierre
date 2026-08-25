import { limparCookieSessao } from "@/lib/auth"
import { ok } from "@/lib/api"

export async function POST() {
  await limparCookieSessao()
  return ok({ saiu: true })
}
