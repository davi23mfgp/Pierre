# Pierre — contador pessoal (PF e MEI)

App de finanças pessoais para quem cuida do dinheiro sozinho, em casal ou em família, com modo MEI.
Feito sobre a mesma stack do ERP Controllares: Next.js (App Router), Prisma + PostgreSQL, Tailwind,
Radix e autenticação por JWT em cookie `httpOnly`.

## O que ele faz

- **Contas e cartões** — saldo derivado dos lançamentos (nunca um campo gravado que desatualiza).
  Cartão de crédito não entra no saldo disponível: limite não é dinheiro seu.
- **Importação de extrato** — OFX (SGML e XML), CSV (detecta separador, cabeçalho e coluna de valor
  sozinho) e PDF. Toda importação passa por uma prévia antes de gravar, e reimportar o mesmo arquivo
  não duplica nada (impressão digital por conta + data + valor + descrição, ou o `FITID` do banco).
- **Categorização que aprende** — dicionário embutido de comerciantes brasileiros para o primeiro
  extrato; cada correção sua vira uma regra com prioridade acima do dicionário.
- **Parcelamentos** — cada parcela é uma linha datada. É o que mostra quanto de cada fatura futura já
  está comprometido antes de você gastar qualquer coisa.
- **Plano de pagamento** — junta conta negativa (cheque especial), fatura de cartão, empréstimos e
  parcelas num roteiro mês a mês: quanto sobra, para onde vai, quando fica limpo.
- **Projeção de 12 meses** — receita e despesa pela sua média, mais recorrências e parcelas
  contratadas. Avisa em que mês o caixa fica negativo.
- **Simulador de cenários** — empilhe hipóteses (cortar gasto, mudar renda, comprar parcelado, pegar
  empréstimo, quitar dívida, pagar extra, gasto ou entrada única) e veja o fluxo de caixa mês a mês
  com e sem a mudança, lado a lado, por 12 a 60 meses. O veredito sai em português: quanto mais rico
  ou mais pobre você termina, quanto muda de juros, se antecipa a quitação e se evita o vermelho.
- **Metas** — reserva de emergência, viagem, aposentadoria. Calcula o aporte necessário e a data
  prevista com juro composto.
- **Decisão de empréstimo** — parcela pela Tabela Price, CET real (por bisseção sobre o fluxo de
  caixa, incluindo IOF e tarifas), comprometimento de renda e veredito com alternativas.
- **MEI** — faturamento contra o limite anual (proporcional no ano de abertura), mês em que o limite
  estoura no ritmo atual, teto mensal seguro e controle de DAS em aberto.
- **Análise contábil** — parecer no formato que um contador entrega: DRE do mês (de onde veio e para
  onde foi), balanço (ativo, passivo, patrimônio líquido) e seis indicadores, cada um com o número, a
  faixa de referência e o que fazer. Fecha com as prioridades em ordem e o efeito estimado em reais.
- **Captura rápida** — três caminhos para anotar um gasto sem abrir planilha: digitar
  "mercado 52,30" no app, encaminhar a notificação de compra do banco pelo celular, ou mandar o
  arquivo da fatura no Telegram. Tudo cai numa fila de conferência: nada vira lançamento sem um toque
  seu, porque notificação de banco erra (compra negada, estorno, pré-autorização de posto).
- **Gráficos** — evolução de entradas e saídas, rosca de gastos por categoria, fluxo de caixa
  projetado com a linha do zero em destaque e barras das parcelas já comprometidas.
- **Pierre, o assessor** — responde sobre os seus números. Motor de regras local resolve as perguntas
  frequentes na hora e de graça; o modelo de linguagem entra só no que sobra, e é opcional.

## Rodar

O banco e o `.env` já estão prontos nesta máquina. No dia a dia são dois comandos:

```bash
npm run db:start
npm run dev
```

Depois abra `http://localhost:3000`, crie sua conta e responda as sete perguntas do Pierre — é ele
que monta seu painel a partir das respostas. Dá para pular e cadastrar tudo depois.

Para desligar o banco: `npm run db:stop`.

### Banco local

Postgres 17 roda a partir de binários portáteis em `%LOCALAPPDATA%\pierre-pg`, sem serviço do
Windows e sem privilégio de administrador (o instalador oficial exige UAC; este caminho não).
Como não é serviço, ele não sobe sozinho ao ligar o computador — daí o `npm run db:start`.

Recriar do zero, se um dia precisar:

```bash
# baixe postgresql-17-windows-x64-binaries.zip, extraia em %LOCALAPPDATA%\pierre-pg
initdb -D %LOCALAPPDATA%\pierre-pg\data -U pierre --pwfile=senha.txt -E UTF8 --locale=C
pg_ctl -D %LOCALAPPDATA%\pierre-pg\data -l pg.log -o "-p 5432" start
psql -U pierre -h 127.0.0.1 -d postgres -c "CREATE DATABASE pierre;"
npx prisma migrate deploy
```

`JWT_SECRET` não tem valor padrão de propósito: subir sem ele assinaria sessão com segredo público.

## Como o cheque especial é modelado

Saldo negativo em conta **não** é tratado como uma dívida à parte: é o próprio saldo, com juros
incidindo sobre ele. Modelar como dívida separada contaria o mesmo buraco duas vezes (uma no saldo,
outra no passivo) e faria a sobra do mês ficar parada ao lado de uma dívida a 8% — o oposto do que
acontece na conta real, onde qualquer entrada abate o negativo na hora.

Fatura de cartão é diferente e entra como dívida de verdade: ela só diminui quando é paga.

## Primeiro acesso

Em vez de abrir um painel vazio, o app conversa. Sete passos, todos puláveis:

1. quanto entra e quanto sai por mês, e em que dia você recebe;
2. onde está o dinheiro (com um interruptor para conta no negativo);
3. cartões — limite, vencimento e fatura em aberto;
4. compras parceladas em andamento (o passo que mais muda a projeção);
5. outras dívidas, com o juro de cada uma;
6. uma meta para começar;
7. se você é MEI.

Pulou? Em **Configurações → Conversa inicial** dá para responder depois. Nada é apagado — o que você
responder soma ao que já existe.

Conta no negativo vira dívida de cheque especial a 8% ao mês (o teto legal), já no topo do plano de
pagamento — é quase sempre o juro mais caro que uma pessoa física paga. Ajuste para a taxa do seu
contrato em Configurações.

## Captura rápida: como o celular anota sozinho

Um site não consegue ler notificações do Android — quem lê é um app de automação no seu aparelho,
que repassa o texto. A parte que recebe já está pronta:

| Caminho | Como funciona |
|---|---|
| **Notificação do banco** | MacroDroid ou Tasker: gatilho "notificação recebida" filtrando o app do banco, ação POST para `/api/capturar` com `Authorization: Bearer SUA_CHAVE`. |
| **Telegram** | Gere a chave, mande `/conectar SUA_CHAVE` ao bot. Depois é só escrever "uber 18" ou encaminhar o PDF da fatura. |
| **Dentro do app** | Campo único em **Anotar**: escreva como falaria. |

As instruções passo a passo, com o endereço já preenchido, ficam na tela **Anotar**.

Detalhes que importam:

- a chave é guardada só como hash; o valor em claro aparece uma única vez, na criação, e cada
  aparelho tem a sua para poder ser revogada isoladamente;
- o leitor descarta sozinho o que não é gasto — compra negada, estorno, aviso de fatura, Pix
  recebido, alerta de segurança;
- avisos repetidos (o mesmo alerta no celular e no relógio) são reconhecidos como a mesma compra;
- senha de PDF nunca passa pelo Telegram: mensagem de chat fica guardada no aparelho e no servidor do
  mensageiro. Para fatura com senha, use a tela **Importar**, que pergunta na hora e não guarda.

## Como a nota de saúde é calculada

Média das faixas dos indicadores, **com teto pela pior delas**: se algum indicador está crítico a nota
não passa de 55, e com a conta no negativo não passa de 40. Sem esse teto a média premiava quem tem
quatro indicadores bons e um crítico — a tela mostrava nota 84 ao lado do rótulo "situação crítica".
Em finanças o pior item manda: estar sem reserva não é compensado por ter pouco custo fixo.

Indicador sem base real não recebe faixa. Se você não lançou nenhuma receita no mês, a taxa de
poupança aparece marcada como "sem faixa", explicando que usou a renda declarada — dar nota a uma
sobra que ninguém viu acontecer seria elogiar um número inventado.

## Open Finance — o que é possível e o que não é

Puxar dados direto do seu banco exige ser instituição autorizada pelo Banco Central **ou** contratar
um agregador já certificado (Pluggy, Belvo e similares). Não há caminho legítimo fora disso: qualquer
solução que peça a senha do seu banco é raspagem de tela, viola o contrato da instituição e coloca
sua credencial em risco.

O app já está pronto para os dois cenários:

| `OPEN_FINANCE_PROVIDER` | Comportamento |
|---|---|
| `sandbox` (padrão) | Dados fictícios determinísticos, para desenvolver e testar o fluxo inteiro. Bloqueado em produção. |
| `pluggy` | Integração real. Preencha `OPEN_FINANCE_CLIENT_ID` e `OPEN_FINANCE_CLIENT_SECRET`. |

Trocar de agregador é escrever um arquivo em `src/lib/open-finance/provedores/` implementando
`ProvedorOpenFinance`. Nenhuma tela muda.

Em qualquer provedor: a autenticação acontece no site do banco, o app recebe só permissão de leitura,
o consentimento tem prazo (12 meses no padrão do BCB) e o app avisa antes de expirar. Revogar é um
botão em Configurações.

## Assistente

Sem `ANTHROPIC_API_KEY` o Pierre funciona pelo motor de regras: saldo, gastos por categoria, dívidas,
metas, reserva, projeção, empréstimo e MEI. Com a chave, ele também responde o que fugir desses temas,
usando apenas o panorama financeiro enviado no contexto.

Limites que ele respeita sem exceção: não recomenda ativo, corretora ou aplicação específica
(atividade regulada), e em questão tributária explica o funcionamento mas manda confirmar com contador.

## Estrutura

```
prisma/schema.prisma        modelo de dados (dinheiro sempre em centavos Int)
src/lib/financeiro.ts       Price, CET, amortização, metas, aposentadoria, MEI
src/lib/categorizar.ts      dicionário + regras que aprendem
src/lib/importar/           OFX, CSV, PDF e deduplicação
src/lib/open-finance/       contrato + provedores (sandbox, Pluggy)
src/lib/parcelamentos.ts    parcelas datadas e compromisso futuro
src/lib/pierre/             panorama, diagnóstico, alertas, plano de pagamento, simulador, chat
src/lib/captura/            leitor de notificação bancária e ponte com o celular
src/app/(app)/              telas autenticadas
src/app/api/                rotas
```

## Sobre o seed

Não há seed com dados de exemplo: o app começa vazio e aprende com você no primeiro acesso.
Para carregar histórico de verdade, use **Importar** com o OFX, CSV ou PDF do seu banco.
