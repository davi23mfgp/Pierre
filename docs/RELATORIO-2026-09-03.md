# O que foi feito no Tino em 03/09/2026

Ponto de retomada. Tudo abaixo está commitado **local**, na branch `main`,
sem `git push`.

## Estado no fim do dia

- 259 testes passando
- `npm run tipos` (tsc --noEmit) limpo
- `npm run build` de produção completo
- 7 commits novos

## O que entrou

### Fase 5 — o que a loja rende (fechada)

O motor financeiro (`resumirLoja`, `aCairPorDia`) já existia e já estava na tela
do Balcão. Faltava a última peça: **desempenho por produto**.

- `src/lib/loja/desempenho.ts` — motor puro, 7 testes. Diz o que mais vende e há
  quantos dias cada produto não sai.
- Ligado em `/api/loja/estoque` e na tela da Prateleira: dois blocos novos, "O
  que mais vende" e "Parado na prateleira".
- "Parado" usa o mesmo corte de 30 dias que o "a cair" do Balcão já usava, em
  vez de inventar um número novo.

### Fase 6 — nota fiscal (esqueleto pronto, falta o contrato)

- Schema: `NotaFiscalVenda` (PENDENTE / EMITIDA / REJEITADA / CANCELADA), `ncm`
  no produto, dados fiscais na loja (CNPJ, inscrição estadual, flag de
  certificado).
- `src/lib/nota-fiscal/pendencias.ts` — motor puro, 5 testes. Diz exatamente o
  que falta antes de tentar emitir, em vez de um "não deu" genérico.
- `src/lib/nota-fiscal/tipos.ts` — contrato `EmissorDeNotaFiscal`, isolando o
  provedor (mesmo desenho de `open-finance/tipos.ts`).
- `provedores/sandbox.ts` — emissor de mentirinha, para rodar sem contratar
  nada.
- `provedores/focus-nfe.ts` — **adapter real**, escrito da doc oficial deles.
  Trata a peculiaridade da API: rejeição da SEFAZ também responde HTTP 201, só
  o campo `status` no corpo diferencia.
- Rotas: `POST/GET /api/loja/vendas/[id]/nota-fiscal`, `PATCH
  /api/loja/produtos/[id]` (só NCM).
- Botão "emitir nota" na lista de últimas vendas do Balcão, com chip de status.

### NCM de verdade

- Tabela oficial (10.515 códigos, Resolução Gecex nº 926/2026), tirada do
  `ncm-oficial.json` do flowdeal.
- `scripts/gerar-ncm.mjs` regenera quando a tabela oficial mudar.
- `src/lib/loja/ncm.ts` (motor puro, 7 testes) + `/api/loja/ncm` (busca) +
  autocompletar na Prateleira.
- O PATCH do produto agora **confere contra a tabela**: antes qualquer número de
  8 dígitos passava e só ia falhar na hora de emitir.

### Fase 7 — login por papel (funcionário da loja)

- `FUNCIONARIO_LOJA` no enum `PapelMembro`, papel gravado no JWT.
- `src/lib/acesso.ts` (motor puro, 10 testes) diz o que cada papel abre. Mesma
  resposta usada pelo `src/proxy.ts` (barra por URL) e pelo menu.
- `src/proxy.ts` — o `middleware.ts` foi renomeado assim porque o Next 16 mudou
  a convenção.
- Configurações ganha "Quem atende o balcão": dono cria login com senha na hora.
- **Bug real corrigido no caminho:** o onboarding entrava em loop de
  redirecionamento para esse papel (layout mandava para `/bem-vindo`, o proxy
  barrava e mandava de volta).
- **Vazamento corrigido depois:** o funcionário via custo e margem de cada
  produto na Prateleira. Agora o corte é no servidor (a API zera os campos), não
  só na tela — esconder só no componente deixaria o número real na resposta,
  visível em qualquer inspetor de rede.

### Fase 8 — DRE da loja, separado do pessoal

- `src/lib/loja/demonstrativo.ts` (4 testes): receita líquida menos CMV menos
  despesa.
- Tela `/loja/financas` + rota `/api/loja/demonstrativo` (30/90/365 dias).
- **Decisão revisada durante a implementação:** o plano previa filtrar
  `diagnostico.ts` por `Conta.tipo = PJ_MEI`. Não foi por aí. O demonstrativo
  nunca lê `Conta` nem `Transacao` — é construído só dos modelos da loja. A
  separação vem da fonte do dado, não de um filtro, o que é garantia mais forte.

### Separação Tino / Tino PJ_MEI, e menu mais simples

- Alternador **Pessoal / Empresa** no topo do menu. Sem estado próprio: o modo
  é derivado da URL (`/loja*` ou `/mei` = empresa), então chegar por link, aba
  salva ou pelo botão dá o mesmo resultado.
- No modo empresa o menu vira só "Tino PJ_MEI"; no pessoal, a loja nem aparece.
- Menu pessoal: "Decidir" e "Ferramentas" viraram um grupo só ("Mais"), com
  legenda interna. Três grupos de nível viraram dois. Nenhuma tela saiu.

## O que ficou pendente (só o Davi resolve)

Lista completa em `docs/PENDENCIAS.md`. Resumo:

1. **Rodar a migration** — `npx prisma migrate dev --name fases_6_7_8`. Nada das
   fases 6/7/8 funciona antes disso; o ambiente de hoje não tinha Postgres para
   testar.
2. **Contratar o Focus NFe e decidir o preço** — adapter pronto, falta o token
   real em `FOCUS_NFE_TOKEN` e a decisão de quanto cobrar a mais no plano.
3. **Responder a pergunta do sócio** — "sócio, pró-labore e distribuição de
   lucro" não cabe no MEI (por definição legal, MEI não tem sócio). É sobre o
   futuro, ou já tem cliente precisando agora? A resposta muda o produto.
   Detalhe em `docs/TINO-MEI.md`.
4. **Definir a regra de conciliação da conta PJ** — bater extrato do banco
   contra o que `aCairPorDia` previu. Falta decidir o que fazer quando só a data
   diverge, ou quando duas vendas do mesmo dia têm o mesmo valor.
5. De antes: publicar (Neon + Vercel), senha dos PDFs de fatura, taxa real do
   cheque especial.

## Achado que vale registrar: o Olist

O `flowdeal` (seu ERP) já tem OAuth2 funcionando contra a API v3 do Olist/Tiny,
incluindo emitir e cancelar nota. É código provado, não pesquisa.

Mas o Olist exige **pedido com produto, depósito e vendedor já cadastrados no
catálogo dele** antes de gerar a nota. O Focus NFe recebe a venda solta. Ou
seja: usar o Olist no Tino.mei significa manter produto e cliente sincronizados
com o Olist de cada lojista, um Olist conectado por loja. Está documentado em
`docs/TINO-MEI.md`, com a troca na mesa, para você escolher.
