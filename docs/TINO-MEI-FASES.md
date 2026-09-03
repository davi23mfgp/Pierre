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

**Continua fora até o Davi decidir provedor e preço:** a chamada de API em si.
Escrever o modelo e a tela sem a chamada real é possível e não trava em nada —
plugar o provedor depois é troca de uma função, não redesenho.

**Prova:** venda antiga sem nota continua funcionando normalmente; venda nova
pode ficar com nota `PENDENTE` indefinidamente sem quebrar nenhum relatório.

---

## Fase 7 — Login por papel: dono e funcionário da loja

Motivação e decisão em `TINO-MEI.md`, seção "Extensão de 03/09/2026".

- `PapelMembro` ganha `FUNCIONARIO_LOJA`, ao lado de `TITULAR`, `CONJUGE`,
  `DEPENDENTE`, `CONVIDADO`. Migration de banco simples (novo valor de enum),
  mas precisa rodar contra um Postgres de pé — **fica para o Davi**
  (`npx prisma migrate dev --name papel_funcionario_loja`), o ambiente que
  gerou este documento não tinha banco local para testar de verdade.
- Restrição de rota por `middleware.ts` na raiz do projeto (novo arquivo):
  lê o papel do token (já vem no JWT da sessão) e barra qualquer caminho fora
  de `/loja`, `/api/loja` e `/api/auth/logout` para quem for
  `FUNCIONARIO_LOJA`. Escolhido middleware, e não um `if` dentro de
  `sessaoDaPagina`, porque só o middleware do Next sabe o caminho da
  requisição antes da página renderizar — `sessaoDaPagina` não recebe isso
  hoje.
- `Navegacao` (componente do menu) esconde os itens fora da loja para esse
  papel, mas isso é só cosmético: quem barra de verdade é o middleware, contra
  URL digitada direto.
- Cadastro do funcionário: tela em Configurações → "Balcão" → "Adicionar quem
  atende", que cria `Usuario` + `Membro` com o papel novo, senha definida pelo
  dono na hora (funcionário de loja troca de gente com frequência; convite por
  e-mail é fricção que este fluxo não precisa).

**Fora desta fase:** permissão fina dentro da loja (esconder custo/margem do
funcionário, por exemplo). Entra quando um lojista de verdade pedir.

**Prova:** funcionário loga e vê só `/loja/*`; URL digitada direto para
`/painel` ou `/dividas` redireciona sem erro de servidor; dono continua vendo
tudo, sem mudança de comportamento para ele.

---

## Fase 8 — A empresa, separada do pessoal

Motivação em `TINO-MEI.md`. Cobre as duas partes do pedido do Davi que cabem
dentro do MEI como está (DRE/balanço e conta PJ) — a terceira (sócio,
pró-labore, distribuição de lucro) está descrita ali como pendência de
decisão, não como fase.

- **DRE e balanço só da empresa.** Hoje `/analise` mistura pessoal e loja no
  mesmo parecer, porque os dois vivem no mesmo `Lar`. A fatia técnica é
  filtrar `diagnostico.ts` por origem (`Conta.tipo === "PJ_MEI"` já existe no
  enum de conta) em vez de modelar uma segunda "empresa" — menos schema novo,
  mesmo resultado. Tela nova: `/loja/financas`, no espírito do menu "Finanças"
  do Olist (Balancete, DRE, Fluxo de Caixa, Contas a Pagar, Contas a Receber
  como abas de relatório do mesmo lugar, reaproveitando `resumirLoja`,
  `aCairPorDia` e as contas da Fase 4).
- **Conta PJ com conciliação própria.** `Conta` já tem o tipo PJ do MEI; falta
  só permitir importar extrato (`src/lib/importar/`, que já lê OFX/CSV/PDF)
  filtrando para essa conta específica, sem misturar com o extrato pessoal do
  dono na mesma tela.

**Prova:** demonstrativo da empresa bate com a soma das vendas líquidas da
loja menos custo de mercadoria vendida menos despesa da loja (mesma prova da
Fase 4), sem nenhum número da vida pessoal do dono dentro. Extrato da conta PJ
importado não aparece em `/transacoes` (tela pessoal) nem entra no cálculo do
painel pessoal.

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
