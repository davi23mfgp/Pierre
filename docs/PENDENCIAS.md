# Pendências — só o Davi resolve

Tudo aqui trava em decisão de negócio, conta em serviço externo, ou dado que
só ele tem. Nada nesta lista é código esperando ser escrito; é o que falta
*antes* de algum código já pronto valer alguma coisa, ou decisão que precisa
vir antes de escrever o próximo.

## Do que já foi construído (Fases 6, 7 e 8 — 03/09/2026)

- [ ] **Rodar a migration.** `NotaFiscalVenda`, `FUNCIONARIO_LOJA` no enum de
  papel, e os campos novos em `Loja`/`ProdutoLoja` estão no `schema.prisma`,
  mas nunca rodaram contra um banco de verdade — o ambiente que escreveu isso
  não tinha Postgres local. Rodar `npx prisma migrate dev --name fases_6_7_8`
  antes de usar qualquer coisa das três fases, em dev ou produção.

- [ ] **Contratar o Focus NFe (ou trocar de ideia) e decidir o preço.** O
  adapter já está escrito e pronto (`src/lib/nota-fiscal/provedores/focus-nfe.ts`,
  direto da doc oficial deles) — falta só a conta e o token de verdade. Ainda
  falta decidir: quanto cobrar a mais no plano do Tino pra cobrir custo por
  nota + margem, e se o certificado digital é do lojista ou centralizado.
  Sem o token em `FOCUS_NFE_TOKEN`, continua no sandbox.

- [ ] **Responder a pergunta do sócio.** Pedido de "sócio, pró-labore e
  distribuição de lucro" não cabe no MEI por definição legal. Precisa saber:
  é para não fechar a porta no futuro (não muda nada agora), ou já tem
  cliente de verdade precisando disso já (aí o Tino.mei passa a atender
  também ME/LTDA, produto diferente, tributação diferente)? Detalhe em
  `docs/TINO-MEI.md`, seção "A empresa fora do MEI".

- [ ] **Definir a regra de conciliação da conta PJ.** Guardar o extrato na
  conta certa já funciona (`/importar` deixa escolher a conta). Conciliação de
  verdade — bater o extrato do banco contra o que `aCairPorDia` previu — ainda
  não tem regra: o que fazer quando o valor bate mas a data não, ou duas
  vendas do mesmo dia têm o mesmo valor? São perguntas de produto.

## De antes (`docs/ESTADO.md`, 26/08/2026 — ainda valem)

- [ ] **Publicar.** Código pronto (`docs/PUBLICAR.md` tem o passo a passo);
  falta criar as contas no Neon e na Vercel e colar as variáveis.

- [ ] **Reportar a senha dos PDFs de fatura.** Três PDFs seus têm senha; o
  app já pergunta na tela Importar, mas nunca foi informada. 31 parcelamentos
  reais continuam fora do sistema até isso.

- [ ] **Confirmar a taxa real do seu cheque especial.** Hoje o app assume o
  teto legal de 8% a.m. por falta do valor real.

- [ ] **Decidir sobre `npm run lint`.** Ficou sem configuração quando o
  `next lint` saiu do Next 16 (`npm run tipos` cobre a verificação real hoje).
  Só mexe se quiser ESLint de volta — não é bloqueio de nada.
