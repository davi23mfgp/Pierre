# Onde o projeto está

Última atualização: 25/08/2026.

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
| Regras | `/regras` | o que o Pierre aprendeu, reprocessar histórico |
| MEI | `/mei` | limite anual, DAS — **só leitura** |
| Configurações | `/configuracoes` | contas, refazer conversa inicial |
| Conversa inicial | `/bem-vindo` | 7 perguntas, todas puláveis |

## O que falta

Em ordem de valor, na minha leitura:

1. **MEI é só leitura.** Não dá para lançar faturamento nem dar baixa no DAS
   pela tela. A API (`/api/mei`) já aceita os dois — falta a interface.
2. **Publicar.** Sem isso o app só funciona com o computador ligado, e a
   captura por notificação não funciona fora de casa. Precisa de Postgres na
   nuvem (Neon, Supabase) e deploy (Vercel).
3. **Telas sem teste.** A suíte cobre o motor de cálculo, não a interface.
   Todo defeito de tela desta base apareceu à mão.
4. **Faturas em PDF do Davi.** Os três PDFs dele têm senha; o app já pede a
   senha na tela Importar, mas ele ainda não informou. São 31 parcelamentos
   reais que continuam fora do sistema.
5. **Taxa real do cheque especial dele.** O app assume o teto de 8% a.m.
   quando não informada.

## Contas no banco local

- `davi23mfgp@gmail.com` — a conta real do Davi. **Não apague.** Ele pulou a
  conversa inicial, então está quase vazia.
- `demo@pierre.local` / `demo12345` — demonstração "Casa da Marina", 6 meses de
  histórico. Recriar com `node scripts/demo.mjs`.

## Decisões de produto já tomadas

- **Sem Open Finance.** O Davi disse que não vai usar. O adaptador continua em
  `src/lib/open-finance/` (contrato + Pluggy + sandbox), fora do menu.
- **Telegram, PDF e modelo de linguagem: adiados.** O código existe e funciona,
  mas ele pediu foco em cálculo e análise.
- **Visual do ERP Controllares.** `globals.css` veio de lá. Tokens `ios-*`,
  `surface-1`, `hairline`, `.ios-card`, fonte Onest. Nada de verde estilo
  Pierre — foi corrigido uma vez, não reintroduza.
