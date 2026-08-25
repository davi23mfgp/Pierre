"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { enviar } from "@/lib/cliente"
import { cn } from "@/lib/utils"

const TIPOS = [
  { valor: "SOLO", rotulo: "Só eu", texto: "Uma pessoa, um orçamento." },
  { valor: "CASAL", rotulo: "Casal", texto: "Contas juntas e separadas." },
  { valor: "FAMILIA", rotulo: "Família", texto: "Com dependentes." },
] as const

export default function Cadastro() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [tipoLar, setTipoLar] = useState<"SOLO" | "CASAL" | "FAMILIA">("SOLO")
  const [modoMei, setModoMei] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)

  async function criar(evento: React.FormEvent) {
    evento.preventDefault()
    setCriando(true)
    setErro(null)

    try {
      await enviar("/api/auth/cadastro", { nome, email, senha, tipoLar, modoMei })
      router.push("/painel")
      router.refresh()
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : "Não consegui criar a conta.")
      setCriando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-fg">Pierre</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Criar sua conta</h1>

        <form onSubmit={criar} className="mt-8 space-y-3">
          <input
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="seu nome"
            required
            className="w-full rounded-2xl border border-hairline bg-background px-4 py-3 text-sm outline-none focus:border-ios-blue/50"
          />
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-hairline bg-background px-4 py-3 text-sm outline-none focus:border-ios-blue/50"
          />
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            placeholder="senha (mínimo 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-2xl border border-hairline bg-background px-4 py-3 text-sm outline-none focus:border-ios-blue/50"
          />

          <div className="space-y-2 pt-2">
            <p className="text-xs uppercase tracking-widest text-muted-fg">Como você cuida do dinheiro</p>
            {TIPOS.map((tipo) => (
              <button
                key={tipo.valor}
                type="button"
                onClick={() => setTipoLar(tipo.valor)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                  tipoLar === tipo.valor
                    ? "border-ios-blue/50 bg-ios-blue/10"
                    : "border-hairline hover:border-border",
                )}
              >
                <span className="font-medium">{tipo.rotulo}</span>
                <span className="block text-[12px] text-muted-fg">{tipo.texto}</span>
              </button>
            ))}
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-hairline px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={modoMei}
              onChange={(evento) => setModoMei(evento.target.checked)}
              className="mt-1"
            />
            <span>
              Sou MEI
              <span className="block text-[12px] text-muted-fg">
                Acompanha faturamento, limite anual e DAS, com a conta do CNPJ separada da pessoal.
              </span>
            </span>
          </label>

          {erro && <p className="text-sm text-ios-red">{erro}</p>}

          <button
            type="submit"
            disabled={criando}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {criando ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-fg">
          Já tem conta?{" "}
          <Link href="/login" className="text-ios-blue hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
