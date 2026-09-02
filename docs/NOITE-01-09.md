# O que foi feito na noite de 31/08 para 01/09

Resumo para o Davi acordar sabendo. Tudo está no GitHub em `davi23mfgp/tino`,
branch `main`.

## O que você pediu, e o que saiu

| Pedido | Onde ver |
|---|---|
| Balanço mensal, em gráfico | `/analise`, abaixo do balanço estático |
| Menos opções na tela | menu lateral, de 20 itens para 12 |
| Separar pessoa física de MEI no acesso | `/cadastro`, primeira pergunta |

## Balanço mês a mês

Barras para o que se tem e o que se deve, linha para o que sobra dos dois. O
passivo desce abaixo do zero em vez de virar barra ao lado — dívida puxa para
baixo, e a leitura fica imediata para quem nunca viu um balanço.

**A série usa só o que tem data em cada lançamento**: saldo em conta e
parcelamentos. Meta e dívida cadastrada à mão têm apenas o valor de hoje no
banco; repetir esse valor para trás faria o gráfico mostrar uma melhora que não
houve. A tela diz quais ficaram de fora.

Na conta de demonstração: variação de **+R$ 35.312,00** em doze meses.

## Menu curto

À mostra ficaram as cinco telas do dia a dia e as quatro decisões que o app
existe para ajudar a tomar. As outras oito vivem atrás de **Mais ferramentas**,
que abre sozinho quando alguém chega numa delas por link.

Nenhuma rota foi removida. Endereço que some quebra link salvo e quebra quem já
aprendeu o caminho.

No celular, quem tem loja recebe **Balcão** e **Prateleira** na barra do
polegar, no lugar de Análise e Cartões: no dia de trabalho o lojista abre o
balcão dezenas de vezes e a análise nenhuma.

## Pessoa física e MEI separados

Era uma caixinha "Sou MEI" no fim do formulário. Agora é a primeira pergunta,
em duas portas: **Meu dinheiro** ou **Meu dinheiro e minha loja**.

Quem não é MEI nunca vê balcão, prateleira nem limite de faturamento — o menu
encolhe um terço. E a promessa "dá para mudar depois em Configurações" agora é
verdadeira: o interruptor existe, e desligar nunca apaga o faturamento já
lançado, que é prova do que foi declarado à Receita.

## O que apareceu no caminho

**Fiado da loja** (`/loja/fiado`). O fiado já era registrado na venda, mas
ninguém conseguia ver quem devia. A lista vem ordenada pelo mais antigo, não
pelo maior valor: quem deve pouco há muito tempo costuma ser quem não vai
pagar. O texto de cobrança é copiado, nunca enviado — mensagem automática em
nome da loja azeda relação de bairro.

**Resumo dos últimos 30 dias**, dentro do balcão. Quanto vendeu, quanto disso é
seu depois da taxa, quanto ainda vai cair e em que dia. Ficou dentro do balcão,
e não em tela nova, porque o pedido era ter menos opções.

**Um defeito corrigido: o troco estava virando receita.** O resumo mostrou na
cara — "vira seu" apareceu maior que "vendeu", com taxa negativa. Quem paga
R$ 50 numa venda de R$ 35 entregou R$ 50, mas deu R$ 35 à loja e levou R$ 15 de
volta; o pagamento estava sendo gravado pelos R$ 50. Corrigido no código e nos
dois registros que já estavam no banco.

**Outro, dos gráficos:** todos estavam sem cor. O Recharts escreve a cor em
atributo do SVG, e o navegador não expande `var()` ali — a linha saía sem traço
e o gráfico aparecia vazio, com os eixos no lugar.

## Dois defeitos que uma revisão pegou depois

**Parcela do dia 31 caía no mês errado.** `setMonth` em 31 de janeiro mais um
mês devolve 3 de março, porque fevereiro não tem dia 31 e o JavaScript
transborda o excedente. Numa venda parcelada no dia 31, a parcela caía um mês
inteiro fora do lugar e a previsão de caixa apontava dinheiro na semana errada.

**O balanço lia o histórico inteiro.** Trazia cada transação da vida da conta
para a memória. Agora uma consulta soma tudo que veio antes da janela e a outra
traz só o período mostrado — o número conferido é o mesmo.

## Números

226 testes, 51 rotas de pé na fumaça, `tsc` limpo, build de produção passando.

`npm run lint` estava quebrado desde sempre: o projeto nunca teve config de
ESLint, e o `next lint` — que gerava uma — saiu no Next 16. Virou
`npm run tipos`. Reconfigurar o ESLint exige subir dependência com o build
funcionando, então deixei para você decidir.

## O que ficou para você

1. **Deploy.** O build da Vercel falha com `DIRECT_URL` vazia. É cadastrar a
   variável — a string do Neon **sem** o `-pooler` no host — em Settings →
   Environment Variables, e mandar Redeploy. O banco no Neon já está com o
   schema completo.
2. **WhatsApp.** O código está pronto e espera `WHATSAPP_TOKEN`,
   `WHATSAPP_PHONE_ID` e `WHATSAPP_VERIFY_TOKEN`. Precisa de número dedicado e
   conta Meta Business, e o webhook só funciona depois do app publicado.
3. **Revisar com advogado** os textos da tela de longo prazo antes de vender.
   Escrevi do lado da calculadora, nunca da recomendação, mas quem assume o
   risco é você.
4. **INPI** para a marca Tino, classes 9 e 42.
5. **Contrato do Controllares** — a cláusula de propriedade intelectual.

## O que eu não fiz, e por quê

**Contas a pagar da loja** (fase 4 do plano) ficou de fora. Ela acrescenta mais
uma tela de cadastro ao menu, e você tinha acabado de pedir menos opções. Prefiro
que você decida se ela entra como tela própria ou como um bloco dentro do
balcão, junto do resumo.
