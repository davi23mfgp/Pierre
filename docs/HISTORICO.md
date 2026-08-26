# Histórico: o que quebrou e como foi corrigido

Doze defeitos reais nesta base. Cada um está fixado por teste ou por comentário
no código. A lista existe para não reintroduzi-los — e porque o padrão deles
ensina onde esta base costuma errar.

## Contagem dupla e sinal

**1. Cheque especial contado duas vezes.** A conta negativa entrava como alvo
derivado do saldo *e* como `Divida` criada na conversa inicial. R$ 6.582 viravam
R$ 13.165. Corrigido com `Divida.contaId`: quem tem vínculo é pulado na
derivação.

**2. Transferência não movia saldo nenhum.** O cálculo só somava receitas e
despesas. Guardar na poupança ou pagar a fatura do cartão não mudava nada.
Apareceu ao montar a demonstração, quando o saldo da corrente subia mês a mês e
a fatura ficava aberta para sempre.

**3. Fatura inicial virava despesa do mês.** Inflava a média de gastos e a
projeção repetia aquele valor todos os meses. Passou a ser saldo inicial negativo
do cartão.

## Números que mentiam

**4. Nota 84 ao lado de "situação crítica".** A média premiava quatro
indicadores bons e um crítico. Ganhou teto pela pior faixa.

**5. Taxa de poupança de 83% num mês sem nenhuma receita lançada.** Usava a
renda declarada como se fosse realizada. Virou "sem faixa" com explicação.

**6. Renda declarada não chegava aos cálculos.** O plano dizia "não fecha"
mesmo com sobra, porque tratava quem acabou de chegar como se não ganhasse nada.

**7. `NaN%` na barra de amortização** quando a prestação era zero.

## Leitura de texto

**8. "parcelada em 3/10" lida como 3 de outubro.** O gasto sumia do mês em que
aconteceu. O trecho da parcela passou a sair do texto antes da busca por data.

**9. "no cartão final 4213: R$ 52,30 em ASSAI"** virava o estabelecimento
"Cartao Final 4213: r$ 52" — valor certo com nome errado, que é pior que nome
nenhum porque parece confiável e ainda ensina uma regra de categoria errada.

**10. "Sua fatura de setembro fechou"** era lida como compra. O padrão não
aceitava palavras entre "fatura" e o verbo.

## Sessão e interface

**11. Token válido apontando para lar apagado quebrava todas as telas** com erro
de servidor. Acontece quando a conta é apagada em outro aparelho ou o banco é
recriado. Agora manda para o login.

**12. Erro de hidratação na tela Anotar.** `window.location.origin` lido no
corpo do componente: vazio no servidor, preenchido no cliente. O React descarta
a árvore inteira.

## Sobre os testes

Escrever os testes achou mais dois problemas — nos próprios testes:

- Um cenário de dívida cuja parcela não cobria o próprio juro. A dívida nunca
  quitava, então a ordem de ataque não era observável e o teste "provava" o
  contrário do esperado.
- Um teste que **passava com o código quebrado**: outra proteção já cobria
  aquele caso. Foi reescrito até pegar a regressão real (parcela "3/10" quando
  3 de outubro está no passado).

A lição: depois de escrever um teste de regressão, **reverta a correção e
confirme que ele falha**. Sem isso o teste é decoração.

## O padrão

Onze dos doze defeitos passavam pelo build e pelo TypeScript sem reclamar. Nove
só apareceram quando os números foram olhados com dados reais na tela. Nenhum
teria sido pego por revisão de código lendo o diff.
