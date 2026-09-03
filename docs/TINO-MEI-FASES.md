# Tino.mei — plano de fases

O escopo e o público estão em `docs/TINO-MEI.md`. Aqui está a ordem técnica:
o que cada fase entrega, o que ela prova, e o que fica de fora dela.

Regra de corte: **cada fase termina de pé.** Nada de fase que só faz sentido
quando a seguinte existir — se a 2 atrasar, a 1 tem de continuar servindo a
loja. É o que permite pôr na mão de um lojista de verdade cedo e descobrir o
que está errado enquanto corrigir ainda é barato.

Todo dinheiro é `Int` em centavos e toda taxa é ponto-base `Int`, como no resto
da base. Ver `CLAUDE.md` e `docs/DECISOES.md`.

---

## Fase 0 — Fundação ✅

Sem tela. Prepara o terreno para que as fases seguintes não briguem com o Tino
pessoal.

- modelos novos no Prisma, todos presos ao `Lar` que já existe: `Loja`,
  `ProdutoLoja`, `VendaLoja`, `ItemVenda`, `PagamentoVenda`, `Caixa`
- enum de forma de pagamento com prazo e taxa por forma
- migration e regeneração do client
- as rotas de loja vivem em `/loja/*` e `/api/loja/*`, separadas das do Tino
  pessoal, para o produto poder ser vendido à parte sem desmontar nada

**Prova de que ficou de pé:** migration aplica, `npx tsc --noEmit` limpo,
`npm test` com os 138 continuando a passar.

---

## Fase 1 — Balcão e caixa ✅

A fase que decide o produto. Se a venda no balcão não for mais rápida que o
caderno, nada mais importa.

- tela de venda: escolhe item, quantidade, forma de pagamento, fecha
- produto criado na hora, com nome e preço, quando ainda não existe
- cliente com nome e telefone, criado na hora — entra aqui e não na fase 3
  porque fiado sem saber de quem não serve para cobrar, que é exatamente para
  o que o caderno é usado hoje
- formas: dinheiro, Pix, débito, crédito à vista, crédito parcelado, fiado
- **cada forma calcula líquido e data de recebimento** a partir da taxa e do
  prazo cadastrados: a venda de R$ 100 no crédito não vira R$ 100 hoje, e o
  sistema para de contar dinheiro que ainda não chegou
- abrir e fechar caixa, com sangria e conferência da gaveta
- a venda alimenta a competência do MEI e o limite anual, sem digitação

**Prova:** venda de cada forma de pagamento com o líquido conferido no teste;
fechamento de caixa que bate com a soma das vendas em dinheiro menos sangria;
teste de fumaça passando pelas telas novas.

**Fora:** estoque (a venda ainda não baixa saldo), histórico e cobrança do
cliente, troca e devolução.

---

## Fase 2 — Estoque ✅

- entrada de mercadoria com custo
- saída automática pela venda da fase 1
- saldo por produto derivado dos movimentos, nunca gravado — mesmo motivo do
  saldo de conta no Tino pessoal: número gravado e número calculado divergem, e
  aí ninguém sabe qual acreditar
- margem por produto: preço contra custo
- aviso de produto acabando

**Prova:** saldo igual à soma dos movimentos em teste; venda derrubando saldo;
margem conferida contra o custo real de entrada.

**Fora:** grade de tamanho e cor, inventário cíclico, transferência entre
lojas.

---

## Fase 3 — Clientes e fiado ✅

- cadastro leve: nome e telefone bastam
- fiado vira dívida do cliente com a loja, com data
- quem deve, quanto, desde quando
- histórico de compra do cliente
- texto de cobrança pronto para o dono mandar no WhatsApp — escrito por ele,
  enviado por ele, sem integração

**Prova:** fiado da fase 1 aparecendo como dívida; baixa parcial e total;
inadimplência somando certo.

**Fora:** crediário com juros e carnê, negativação, cobrança automática.

---

## Fase 4 — Contas a pagar da loja

- aluguel, condomínio da galeria, fornecedor, maquininha
- vencimento e aviso do que vence na semana
- fecha o lucro real: vendeu, menos o que a mercadoria custou, menos o que a
  loja gasta para existir

**Prova:** demonstrativo do mês batendo com a soma das vendas líquidas menos
custo de mercadoria vendida menos despesa.

---

## Fase 5 — O que a loja rende ✅

- venda por dia e por forma de pagamento — `resumirLoja`, na tela do Balcão
- quanto cai na conta nos próximos 30 dias, somando o que a maquininha deve —
  `aCairPorDia`, mesma tela
- produto que mais sai e produto parado no estoque — `desempenhoDosProdutos`,
  na Prateleira; "parado" usa os mesmos 30 dias do item anterior como
  referência, documentado no código, em vez de um corte novo
- limite do MEI: usado, disponível, e em que mês estoura no ritmo atual —
  `avaliarMei`, na tela MEI (a venda da loja já alimenta a competência sozinha,
  por `somarNoFaturamentoMei`)

**Prova:** todo indicador com faixa de referência, como manda a regra 4 do
`CLAUDE.md`. Indicador sem base real não recebe nota.

Por hora não entrou: a venda de balcão grava a data completa, mas nenhuma tela
ainda agrupa por hora do dia. Fica para quando um lojista de verdade pedir —
é consulta nova em cima de dado que já existe, não modelagem.

---

## Fase 6 — Nota fiscal

Escopo e pesquisa de mercado em `TINO-MEI.md`, seção "Extensão de 03/09/2026".
Resumo técnico do que muda quando entrar:

- Modelo novo, `NotaFiscalVenda`, preso a `VendaLoja` (uma venda pode ter nota
  emitida depois, não só na hora — SEFAZ cai, contingência existe).
- Campos: status (`PENDENTE` | `EMITIDA` | `REJEITADA` | `CANCELADA`), chave de
  acesso, XML retornado (guardado, nunca regerado — é o documento fiscal de
  verdade), motivo quando rejeitada.
- Botão "emitir nota" na venda já fechada, não obrigatório — nem todo MEI
  precisa hoje (ver a exceção de São Paulo em `TINO-MEI.md`).
- Reemissão manual quando a SEFAZ rejeitar. Sem retry automático: erro fiscal
  automático demais é dinheiro saindo sem o dono ver.
- Cadastro que falta hoje e a nota exige: NCM por produto (`ProdutoLoja` não
  tem), inscrição estadual da loja, tipo de certificado.

**Atualização de 03/09/2026 — adapter do Focus NFe escrito antes do contrato:**
`src/lib/nota-fiscal/provedores/focus-nfe.ts` já implementa emissão de verdade
(POST `/v2/nfce`, autenticação Basic com o token, mapeamento de forma de
pagamento pra tabela SEFAZ), direto da doc oficial deles — mesmo raciocínio do
adapter Pluggy em `open-finance/` (escrito antes do contrato existir, sem
travar nada até lá). Falta só `FOCUS_NFE_TOKEN` de uma conta de verdade e
`NOTA_FISCAL_PROVIDER=focus_nfe` pra sair do sandbox. Cancelamento ainda não
funciona por esse adapter — a API cancela pela `ref` da emissão, e o schema
não guarda essa `ref` hoje; fica para quando a Fase 6 sair do esqueleto.

**Continua fora até o Davi decidir preço:** quanto cobrar a mais no plano do
Tino para cobrir custo por nota + margem, e se o certificado digital é do
lojista ou centralizado. Nenhuma das duas trava o código escrito até aqui.

**Prova:** venda antiga sem nota continua funcionando normalmente; venda nova
pode ficar com nota `PENDENTE` indefinidamente sem quebrar nenhum relatório.

---

## Fase 7 — Login por papel: dono e funcionário da loja ✅ (falta a migration)

Motivação e decisão em `TINO-MEI.md`, seção "Extensão de 03/09/2026".

- `PapelMembro` ganha `FUNCIONARIO_LOJA`, ao lado de `TITULAR`, `CONJUGE`,
  `DEPENDENTE`, `CONVIDADO`.
- Papel gravado no próprio JWT da sessão (login e cadastro) — `src/lib/acesso.ts`
  (`rotaPermitida`, motor puro, testado) diz o que cada papel abre, e é a
  mesma resposta usada tanto pelo `src/proxy.ts` (bloqueio de URL, sem tocar
  banco) quanto pela `Navegacao` (esconde item do menu). Um só lugar decide;
  os outros dois só perguntam.
- `src/proxy.ts` — chama-se assim porque o Next 16 renomeou `middleware.ts` —
  barra qualquer caminho fora de `/loja`, `/api/loja` e `/login` para
  `FUNCIONARIO_LOJA`. MEI e DAS ficam de fora de propósito: é situação
  tributária do dono, não operação de balcão.
- Layout pula o redirect de onboarding (`/bem-vindo`) para esse papel — sem a
  exceção, um lar sem onboarding feito entraria em loop (layout manda para
  lá, o proxy barra e manda de volta).
- Cadastro do funcionário: Configurações → "Quem atende o balcão". Dono
  define a senha na hora (funcionário de loja troca de gente com frequência;
  convite por e-mail seria fricção sem necessidade), API em
  `/api/loja/funcionario`, bloqueada para quem já é `FUNCIONARIO_LOJA` —
  ninguém cria acesso de dentro do próprio acesso restrito.

**Fora desta fase:** permissão fina dentro da loja (esconder custo/margem do
funcionário, por exemplo). Entra quando um lojista de verdade pedir.

**Prova:** funcionário loga e vê só `/loja/*`; URL digitada direto para
`/painel` ou `/dividas` redireciona sem erro de servidor; dono continua vendo
tudo, sem mudança de comportamento para ele. 246 testes passando, `tsc`
limpo, build de produção completo.

**Pendência real:** a migration do enum novo precisa rodar contra Postgres de
pé — `npx prisma migrate dev --name papel_funcionario_loja` — o ambiente que
escreveu isto não tinha banco local para confirmar de ponta a ponta.

---

## Fase 8 — A empresa, separada do pessoal ✅ (parcial — ver ressalva)

Motivação em `TINO-MEI.md`. Cobre a parte do pedido do Davi que tinha escopo
claro (DRE) — conciliação de conta PJ e a terceira parte (sócio, pró-labore,
distribuição de lucro) continuam como pendência de decisão, não como fase.

- **DRE só da empresa**, em `/loja/financas` + `/api/loja/demonstrativo`:
  receita líquida (`resumirLoja`, Fase 5), custo da mercadoria vendida
  (`custoDaMercadoriaVendida`, Fase 2, pelo custo médio atual do produto —
  mesma referência que a Prateleira já usa na margem, não o custo exato do dia
  da venda) e despesa (`ContaDaLoja` pagas no período, Fase 4). Motor puro
  `demonstrativoDaLoja` testado (4 testes).
- **Decisão tomada no caminho, revisando o plano original:** não veio de um
  filtro em `diagnostico.ts` por `Conta.tipo === "PJ_MEI"` como este documento
  previa antes de codar. `demonstrativoDaLoja` nunca lê `Conta` nem
  `Transacao` — é construído só a partir dos modelos da loja, então não existe
  número pessoal para vazar, em vez de existir e precisar ser filtrado. Mais
  simples e com uma garantia mais forte que a do plano original.
- **Conta PJ com conciliação:** `Conta.tipo = PJ_MEI` já existe, e `/importar`
  já deixa escolher a conta de destino — logo um extrato PJ já entra separado
  do pessoal, na conta certa, sem código novo.

**O que a "conciliação" pedida ainda não tem, e por quê parou aqui:**
conciliação de verdade é casar o que caiu no extrato do banco com o que
`aCairPorDia` (Fase 5) previu — não só guardar o extrato na conta certa, que
já funciona. Isso é bater valor e data contra a previsão e sinalizar
divergência, uma tela e uma regra de casamento que este documento ainda não
tem definidas. Não dá pra codar sem saber, por exemplo, o que fazer quando o
valor bate mas a data não, ou quando duas vendas do mesmo dia têm o mesmo
valor — perguntas de produto, não de banco de dados.

**Prova do que está pronto:** demonstrativo bate com a soma das vendas
líquidas da loja menos CMV menos despesa da loja, sem nenhum número da vida
pessoal do dono dentro — garantido pela fonte de dados, não por um filtro.
252 testes passando, `tsc` limpo, build de produção completo.

---

## O que pode furar o plano

- **Grade de produto.** Se o primeiro lojista de verdade for de roupa, tamanho
  e cor deixam de ser fase 2 e viram fase 1 — sem grade, ele não consegue nem
  registrar o que vendeu.
- **Importar a planilha da loja.** É o que mais aproxima do "acopla sem
  trabalho", mas cada loja tem uma planilha diferente. Precisa de um exemplo
  real na mão antes de virar código.
- **Taxa de maquininha por bandeira.** O plano assume uma taxa por forma de
  pagamento. Se na prática o lojista tiver taxa diferente por bandeira e por
  número de parcelas, a modelagem de recebimento cresce e é melhor descobrir
  isso na fase 1 do que na 5.
