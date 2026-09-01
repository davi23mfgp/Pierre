# Identidade visual do Tino

Escrito para quem for mexer na tela sem ter participado da decisão. O que está
aqui não é gosto: cada escolha responde a alguma coisa do produto.

## De onde vem

A referência não é app de banco nem fintech: é **o livro-caixa e a bobina do
cupom**. Papel, pauta, tinta e carimbo. O Tino fala de dinheiro miúdo,
conferido peça por peça, e a tela devia parecer isso.

O visual anterior era um tema Apple genérico herdado do ERP Controllares. Além
de não dizer nada sobre o produto, era código de terceiro dentro de algo que
vai ser vendido.

## As cores dizem o que informam

Os tokens têm nome de função, não de cor: `positivo`, `negativo`, `atencao`,
`acao`. Trocar o azul do positivo por outro azul não obriga a mexer em 40
arquivos, e nenhuma tela fica dizendo "verde" depois que o verde saiu.

| Token | Para quê | Por que esse tom |
|---|---|---|
| `positivo` | sobra, saldo bom, meta batida | **azul**, porque em português quem tem sobra está "no azul". Verde está proibido nesta base — é o que toda fintech faz e já foi rejeitado aqui uma vez |
| `negativo` | buraco, dívida, estouro | vermelho de carimbo — "estar no vermelho" |
| `atencao` | perto do limite, vencendo | âmbar de papel envelhecido |
| `acao` | botão, link, o que se clica | a própria tinta, quase preta. Deixa a cor sobrar para o que informa, em vez de gastar em decoração |
| `alerta`, `destaque`, `dado` | gráfico e caso raro | usados com parcimônia |

Superfícies são `papel-1` (mais perto do olho), `papel-2` e `papel-3`. A borda
é `pauta` — a linha do livro-caixa.

No tema escuro o fundo é **grafite azulado, não preto puro**: em tela OLED o
preto absoluto faz cartão e fundo virarem a mesma coisa e a hierarquia some.

## Três fontes, três trabalhos

- **Bricolage Grotesque** (`font-display`) carrega a personalidade e aparece
  pouco: título e o número grande.
- **Public Sans** (`font-sans`) é neutra de propósito. Texto de app financeiro
  é lido com pressa e não deve chamar atenção para si.
- **IBM Plex Mono** (`font-numero`, classe `.numero`) existe por motivo
  funcional: dinheiro precisa de algarismo tabular. Sem largura fixa por
  dígito, a coluna de valores dança e conferir extrato vira caça ao erro.

A interface inteira tem `font-variant-numeric: tabular-nums`. A classe
`.numero` acrescenta a fonte mono, e vai só nos valores em destaque.

## A ficha

`.ficha` é o cartão. Papel, borda de pauta, raio de 14px e **uma linha de
pauta no topo** — o único enfeite do sistema, e o que dá à tela cara de papel
pautado em vez de painel de aplicativo.

## O Tino

Corpo de bloco de anotação, fita de cupom saindo do topo, pauta atravessando o
peito. Não é robô nem porquinho: o assunto é papel conferido peça por peça. O
mesmo desenho é o ícone do app — quem procura o app no celular procura a cara
dele.

**A expressão vem do motor de alertas, nunca de decoração.** Com alerta crítico
aberto ele franze; sem alerta nenhum ele fica tranquilo. Falha de rede deixa
ele "pensando", não "tranquilo": mascote sorrindo por falta de dado mentiria
sobre a situação, que é o defeito que esta base mais evita.

Estados em `src/components/tino-mascote.tsx`: `tranquilo`, `atento`,
`apertado`, `critico`, `comemorando`, `pensando`.

## Ao mexer

- cor nova só entra se responder a uma pergunta que o usuário faz. Decoração
  não ganha token
- valor em destaque leva `.numero`
- animação só quando o movimento for informação. `prefers-reduced-motion` já
  está respeitado no `globals.css`
- os componentes são shadcn/ui sobre Radix: personalize pelo token, não
  reescrevendo o componente
