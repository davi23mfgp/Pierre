# Onde o projeto está

Última atualização: 26/08/2026.

## Resumo

App funcionando de ponta a ponta, rodando local. 149 arquivos, 6 commits em
`main`, 138 testes passando, build limpo. Ainda **não publicado** — roda no
computador do Davi e é acessado pelo celular na rede de casa.

## Telas prontas

| Tela | Rota | O que faz |
|---|---|---|
| Visão geral | `/painel` | saldo, mês corrente, mapa de calor, categorias vs. mês passado, parcelas comprometidas, o que fazer agora |
| Análise | `/analise` | parecer contábil: DRE, balanço, 6 indicadores com faixa, prioridades ordenadas |
| Anotar | `/capturas` | fila de conferência e canais de entrada (celular, texto livre) |
| Transações | `/transacoes` | lista com filtros; corrigir categoria cria regra |
| Cartões | `/cartoes` | fatura aberta, limite consumido por parcela futura |
| Parcelamentos | `/parcelamentos` | cada parcela datada, compromisso por mês |
| Orçamento | `/orcamento` | limite por categoria, sugestão pela mediana de 6 meses |
| Dívidas | `/dividas` | CRUD, avalanche x bola de neve lado a lado |
| Plano de pagamento | `/plano` | roteiro mês a mês juntando conta negativa, fatura e dívidas |
| Simulador | `/simulador` | hipóteses empilháveis, comparação com e sem, 12 a 60 meses |
| Projeção | `/projecao` | fluxo de caixa de 12 meses |
| Empréstimo | `/emprestimos` | CET, veredito, tabela de amortização |
| Metas | `/metas` | progresso, aporte necessário, data prevista |
| Contas fixas | `/recorrencias` | alimenta projeção e reserva |
| Regras | `/regras` | o que o Bean aprendeu, reprocessar histórico |
| MEI | `/mei` | limite anual, DAS, lançamento de faturamento e baixa do DAS |
| Configurações | `/configuracoes` | contas, refazer conversa inicial |
| Conversa inicial | `/bem-vindo` | 7 perguntas, todas puláveis |

## O que falta

Em ordem de valor, na minha leitura:

1. **Publicar.** O código já está pronto para isso: o `build` aplica as
   migrations, o schema tem `directUrl` para o pooler do Postgres gerenciado e
   `docs/PUBLICAR.md` tem o passo a passo. Falta o que só o Davi pode fazer —
   criar as contas no Neon e na Vercel e colar as variáveis.
2. **Telas com teste raso.** `npm run test:fumaca` prova que as 40 checagens
   passam: toda página e toda rota de leitura respondem, rota protegida sem
   sessão continua fechada, e o saldo do painel bate com `/api/panorama`. O que
   falta é comportamento — preencher formulário, salvar, conferir o que a tela
   passa a mostrar — e os métodos de escrita da API, que o script não exercita
   para não sujar o banco.
3. **Faturas em PDF do Davi.** Os três PDFs dele têm senha; o app já pede a
   senha na tela Importar, mas ele ainda não informou. São 31 parcelamentos
   reais que continuam fora do sistema.
4. **Taxa real do cheque especial dele.** O app assume o teto de 8% a.m.
   quando não informada.

## Contas no banco local

- `davi23mfgp@gmail.com` — a conta real do Davi. **Não apague.** Ele pulou a
  conversa inicial, então está quase vazia.
- `demo@bean.local` / `demo12345` — demonstração "Casa da Marina", 6 meses de
  histórico. Recriar com `node scripts/demo.mjs`.

## Renomeação: o que ainda carrega o nome antigo

O produto virou **Bean.counter** em 27/08/2026. Código, telas, rotas, documentos
e o enum `PapelMensagem` já usam o nome novo. Continua antigo, de propósito:

| O quê | Por quê | Como trocar |
|---|---|---|
| repositório `davi23mfgp/Pierre` | renomear no GitHub muda a URL de todo mundo | Settings → Rename, e `git remote set-url origin` |
| pasta do projeto `Documents\pierre` | caminho aberto em editor e terminal | renomear e reabrir |
| cluster `%LOCALAPPDATA%\pierre-pg`, banco e usuário `pierre` | tem os dados dentro; renomear exige dump e restore | `pg_dump`, recriar com o nome novo, restaurar, ajustar `.env` |

Nada disso aparece para quem usa o app nem para quem for comprar o produto —
só para quem abrir a máquina de desenvolvimento.

## Decisões de produto já tomadas

- **Sem Open Finance.** O Davi disse que não vai usar. O adaptador continua em
  `src/lib/open-finance/` (contrato + Pluggy + sandbox), fora do menu.
- **Sem Open Finance (detalhe achado depois).** O callback em
  `src/app/api/open-finance/callback/route.ts:17` redireciona para `/contas`,
  página que não existe. Como o fluxo nunca é chamado, não quebra nada hoje —
  mas se o adaptador voltar ao menu, isso quebra primeiro.
- **Telegram, PDF e modelo de linguagem: adiados.** O código existe e funciona,
  mas ele pediu foco em cálculo e análise.
- **Visual do ERP Controllares.** `globals.css` veio de lá. Tokens `ios-*`,
  `surface-1`, `hairline`, `.ios-card`, fonte Onest. Nada de verde estilo
  Bean.counter — foi corrigido uma vez, não reintroduza.
