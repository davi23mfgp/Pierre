# Arquitetura

## Stack

Next.js 16 (App Router) · Prisma 5 + PostgreSQL · Tailwind + Radix · JWT em
cookie `httpOnly` (jose) · recharts · TypeScript estrito.

A escolha veio do ERP Controllares, do próprio Davi: mesma stack, mesmo sistema
visual, para ele não reaprender nada.

## Onde fica o quê

```
prisma/schema.prisma       modelo de dados
src/lib/
  dinheiro.ts              centavos, formatação, rateio, pontos-base
  datas.ts                 competências, janela do mês, dia seguro
  financeiro.ts            Price, CET, quitação, metas, aposentadoria, MEI
  categorizar.ts           dicionário + regras que aprendem
  parcelamentos.ts         parcelas datadas, compromisso futuro
  importar/               OFX, CSV, PDF, deduplicação
  captura/                leitor de notificação, ponte com celular, Telegram
  open-finance/           contrato + Pluggy + sandbox (fora do menu)
  tino/
    panorama.ts            a foto financeira completa — fonte única de números
    diagnostico.ts         DRE, balanço, indicadores, parecer
    simulador.ts           cenários e comparação
    plano-pagamento.ts     roteiro de quitação
    alertas.ts             o que o Tino diria sem ser perguntado
    chat.ts                motor de regras do assistente
    modelo.ts              camada opcional de modelo de linguagem
  semear.ts                categorias e regras iniciais de um lar novo
  pagina.ts                sessão para telas (checa que o lar existe)
  api.ts                   utilidades das rotas
src/app/(app)/             telas autenticadas
src/app/api/               rotas
testes/                    138 testes do motor
scripts/                   banco portátil, demonstração, ícones
```

## A regra mais importante da arquitetura

**`panorama.ts` é a fonte única de números.** Painel, análise, alertas, chat,
simulador e plano leem dele. Ter um cálculo por tela é como o mesmo saldo
aparece diferente em dois lugares e o usuário perde a confiança no sistema
inteiro.

Se você precisa de um número novo numa tela, **adicione ao panorama**, não
calcule na tela.

Exceção consciente: `api/contas/route.ts` recalcula saldo por conta, porque a
tela de configurações precisa dele sem montar o panorama inteiro. As duas
implementações usam a mesma regra de transferência — se mudar uma, mude a outra.

## Camadas

O motor (`financeiro.ts`, `simulador.ts`, `diagnostico.ts`, `categorizar.ts`,
`captura/notificacao.ts`) é **função pura**: não toca banco, não importa React.
Por isso os 138 testes rodam em meio segundo sem subir nada.

Mantenha assim. Se um cálculo precisa do banco, busque os dados fora e passe
como argumento.

## Fluxo de um gasto

```
notificação do celular  →  /api/capturar (chave)     ┐
texto livre no app      →  /api/capturas/rapida      ├→  Captura (PENDENTE)
extrato OFX/CSV/PDF     →  /api/importar (prévia)    ┘         ↓
                                                    conferência do usuário
                                                              ↓
                                                         Transacao
                                                              ↓
                                                         panorama.ts
                                                              ↓
                                            painel · análise · plano · simulador
```

## Modelo de dados, em uma frase cada

- **Lar** — o inquilino. Quase tudo é isolado por `larId`.
- **Membro** — pessoa do lar; nem toda faz login (filho, dependente).
- **Conta** — corrente, poupança, cartão, dinheiro, investimento, PJ do MEI.
- **Transacao** — o lançamento. Valor sempre positivo; o sinal vem de `tipo`.
- **Parcelamento** / **ParcelaCompra** — compra parcelada, cada parcela datada.
- **Divida** — empréstimo, financiamento, cheque especial (com `contaId`).
- **Meta**, **Orcamento**, **Recorrencia**, **RegraCategorizacao**.
- **Captura** / **ChaveCaptura** — fila de conferência e canais de entrada.
- **MeiPerfil** / **MeiCompetencia** — faturamento e DAS.
