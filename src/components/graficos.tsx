"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatarMoeda, formatarMoedaCurta } from "@/lib/dinheiro"
import { rotuloCompetencia } from "@/lib/datas"

/**
 * Gráficos do Pierre.
 *
 * Regras que valem para todos:
 * - o eixo de valores usa forma curta (R$ 1,2 mil); o número exato aparece no
 *   toque, porque rótulo cheio em 12 meses vira parede de dígitos;
 * - vermelho só para o que está no negativo — cor demais faz a pessoa parar de
 *   notar a cor que importa;
 * - nada de eixo Y começando fora do zero: encolher a escala exagera variação
 *   e é a forma mais comum de um gráfico mentir sem mentir.
 */

const AZUL = "oklch(var(--lch-ios-blue))"
const VERDE = "oklch(var(--lch-ios-green))"
const VERMELHO = "oklch(var(--lch-ios-red))"
const LARANJA = "oklch(var(--lch-ios-orange))"
const ROXO = "oklch(var(--lch-ios-purple))"
const AMARELO = "oklch(var(--lch-ios-yellow))"
const TEAL = "oklch(var(--lch-ios-teal))"

export const PALETA = [AZUL, VERDE, LARANJA, ROXO, TEAL, AMARELO, VERMELHO]

const eixo = { fontSize: 11, fill: "currentColor", opacity: 0.55 }

function Dica({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-hairline bg-surface-1 px-3 py-2 shadow-apple-float">
      {label && <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-fg">{label}</p>}
      {payload.map((linha, indice) => (
        <p key={indice} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ background: linha.color }} />
          <span className="text-muted-fg">{linha.name}</span>
          <span className="font-medium">{formatarMoeda(Number(linha.value ?? 0))}</span>
        </p>
      ))}
    </div>
  )
}

// ============================================================
// EVOLUÇÃO MENSAL
// ============================================================

export function GraficoEvolucao({
  dados,
  altura = 220,
}: {
  dados: { competencia: string; receitasCentavos: number; despesasCentavos: number }[]
  altura?: number
}) {
  const serie = dados.map((linha) => ({
    mes: rotuloCompetencia(linha.competencia, true),
    Entrou: linha.receitasCentavos,
    Saiu: linha.despesasCentavos,
  }))

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="entrou" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VERDE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={VERDE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="saiu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VERMELHO} stopOpacity={0.3} />
            <stop offset="100%" stopColor={VERMELHO} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
        <YAxis tick={eixo} axisLine={false} tickLine={false} tickFormatter={(v) => formatarMoedaCurta(Number(v))} />
        <Tooltip content={<Dica />} />
        <Area type="monotone" dataKey="Entrou" stroke={VERDE} strokeWidth={2} fill="url(#entrou)" />
        <Area type="monotone" dataKey="Saiu" stroke={VERMELHO} strokeWidth={2} fill="url(#saiu)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// GASTOS POR CATEGORIA
// ============================================================

export function GraficoCategorias({
  dados,
  altura = 240,
}: {
  dados: { nome: string; totalCentavos: number }[]
  altura?: number
}) {
  // Sete fatias já é o limite do que se lê num relance; o resto vira "outras"
  // em vez de virar uma roda de fatias finas sem nome legível.
  const principais = dados.slice(0, 6)
  const resto = dados.slice(6).reduce((soma, linha) => soma + linha.totalCentavos, 0)
  const serie = [...principais, ...(resto > 0 ? [{ nome: "Outras", totalCentavos: resto }] : [])].map((linha) => ({
    name: linha.nome,
    value: linha.totalCentavos,
  }))

  const total = serie.reduce((soma, linha) => soma + linha.value, 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={altura} className="max-w-[240px]">
        <PieChart>
          <Pie data={serie} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
            {serie.map((_, indice) => (
              <Cell key={indice} fill={PALETA[indice % PALETA.length]} />
            ))}
          </Pie>
          <Tooltip content={<Dica />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="w-full space-y-1.5">
        {serie.map((linha, indice) => (
          <li key={linha.name} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETA[indice % PALETA.length] }} />
            <span className="min-w-0 flex-1 truncate">{linha.name}</span>
            <span className="text-muted-fg">{total > 0 ? `${Math.round((linha.value / total) * 100)}%` : "0%"}</span>
            <span className="w-24 text-right">{formatarMoeda(linha.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================
// FLUXO DE CAIXA PROJETADO
// ============================================================

export function GraficoFluxo({
  dados,
  altura = 260,
  comparar,
}: {
  dados: { competencia: string; saldoAcumuladoCentavos: number }[]
  altura?: number
  /// Série do cenário atual, para o simulador desenhar o antes por baixo.
  comparar?: { competencia: string; saldoAcumuladoCentavos: number }[]
}) {
  const serie = dados.map((linha, indice) => ({
    mes: rotuloCompetencia(linha.competencia, true),
    Simulado: linha.saldoAcumuladoCentavos,
    ...(comparar ? { Hoje: comparar[indice]?.saldoAcumuladoCentavos ?? null } : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="fluxo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AZUL} stopOpacity={0.35} />
            <stop offset="100%" stopColor={AZUL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={eixo} axisLine={false} tickLine={false} tickFormatter={(v) => formatarMoedaCurta(Number(v))} />
        <Tooltip content={<Dica />} />
        {/* A linha do zero é a informação mais importante do gráfico: é ela que
            mostra em que mês o dinheiro acaba. */}
        <ReferenceLine y={0} stroke={VERMELHO} strokeDasharray="4 4" strokeOpacity={0.6} />
        {comparar && <Line type="monotone" dataKey="Hoje" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} dot={false} />}
        <Area
          type="monotone"
          dataKey="Simulado"
          name={comparar ? "Simulado" : "Saldo"}
          stroke={AZUL}
          strokeWidth={2}
          fill="url(#fluxo)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// COMPROMISSO FUTURO (PARCELAS)
// ============================================================

export function GraficoParcelas({
  dados,
  altura = 200,
}: {
  dados: { competencia: string; totalCentavos: number }[]
  altura?: number
}) {
  const serie = dados.map((linha) => ({
    mes: rotuloCompetencia(linha.competencia, true),
    Parcelas: linha.totalCentavos,
  }))

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
        <YAxis tick={eixo} axisLine={false} tickLine={false} tickFormatter={(v) => formatarMoedaCurta(Number(v))} />
        <Tooltip content={<Dica />} cursor={{ fill: "currentColor", opacity: 0.04 }} />
        <Bar dataKey="Parcelas" fill={LARANJA} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// PROGRESSO DE META / ORÇAMENTO
// ============================================================

export function GraficoAnel({
  percentual,
  rotulo,
  valor,
  altura = 160,
}: {
  percentual: number
  rotulo: string
  valor: string
  altura?: number
}) {
  const limitado = Math.max(0, Math.min(100, percentual))
  const cor = percentual > 100 ? VERMELHO : percentual >= 80 ? LARANJA : VERDE

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={altura}>
        <RadialBarChart
          data={[{ name: rotulo, value: limitado }]}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} fill={cor} background={{ fill: "currentColor", opacity: 0.07 }} />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-semibold leading-none tracking-tight">{valor}</span>
        <span className="mt-1 text-[11px] uppercase tracking-widest text-muted-fg">{rotulo}</span>
      </div>
    </div>
  )
}
