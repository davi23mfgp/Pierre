# Tino.mei — sistema para a loja do MEI

Documento de escopo. Nada aqui está construído ainda; serve para o Davi
corrigir o alvo antes de virar código, que é a correção mais barata que existe.

## Quem usa

MEI dono de loja física em galeria ou shopping. Vende no balcão, para quem
entra. Roupa, acessório, calçado, celular e capinha, papelaria, cosmético —
o comércio de rua e de galeria brasileiro.

Não é o MEI prestador de serviço (esse quer orçamento e ordem de serviço, que
ficam para depois). Não é loja com CNPJ acima do MEI, que precisa de nota
fiscal em todo venda e de regime tributário mais complicado.

## A dor, nas palavras do Davi

Hoje essa pessoa opera a loja em quatro ou cinco lugares que não se falam:

| Onde | Para quê |
|---|---|
| maquininha | receber cartão — e o dinheiro cai depois, com taxa |
| caderno | fiado, encomenda, quem levou para provar |
| planilha ou nada | estoque e preço |
| app do banco | ver se o dinheiro entrou |
| WhatsApp | cliente perguntando preço e disponibilidade |

O resultado é o dono não saber duas coisas que decidem o negócio: **quanto
sobrou de verdade** e **quanto ainda cabe no limite do MEI**. A maquininha
mostra o bruto; o extrato mostra o líquido semanas depois; o limite anual só
aparece quando estoura.

A promessa do Tino.mei é acoplar na loja como ela já funciona, sem obrigar
ninguém a mudar de maquininha nem a montar cadastro de mil produtos antes de
vender a primeira vez.

## Premissas que assumi

Marcadas porque o Davi ainda não confirmou. Errar qualquer uma muda o trabalho.

1. **A maquininha continua sendo a que ele já tem.** O Tino.mei não processa
   pagamento: registra a venda e calcula quanto e quando cai, pela taxa que o
   dono informa. Virar adquirente é outro negócio, com licença e risco.
2. **Nota fiscal fica fora da primeira entrega.** MEI não é obrigado a emitir
   para consumidor pessoa física; é obrigado quando vende para empresa. Quando
   entrar, é integração com a prefeitura ou com emissor terceiro, não código
   nosso do zero.
3. **Fiado existe e é grande.** Em galeria, "anota aí" é meio de pagamento.
   Fica na primeira fatia, não como enfeite.
4. **Cadastro de produto precisa ser preguiçoso.** Vender primeiro, cadastrar
   depois. Um sistema que exige cadastro completo antes da primeira venda é
   abandonado no primeiro sábado cheio.
5. **O celular é o computador da loja.** Balcão de galeria não tem espaço para
   monitor. Tudo tem de funcionar em tela de telefone, em pé, com uma mão.

## As fatias, em ordem

### 1. Balcão e caixa

O núcleo. Sem isso nada mais importa.

- venda rápida: escolhe item, forma de pagamento, fecha
- formas: dinheiro, Pix, débito, crédito à vista, crédito parcelado, fiado
- **cada forma sabe quanto e quando cai** — a taxa e o prazo do cartão são
  cadastrados uma vez e o sistema para de mentir que a venda de R$ 100 no
  crédito virou R$ 100 hoje
- abertura e fechamento de caixa, sangria, conferência do dinheiro na gaveta
- produto cadastrado na hora da venda, com nome e preço, se ainda não existir
- o faturamento cai sozinho na competência do MEI e no limite anual

### 2. Estoque

- entrada de mercadoria com custo, saída automática pela venda
- saldo por produto, com aviso de acabando
- grade quando fizer sentido (tamanho e cor para roupa e calçado)
- margem por produto: preço de venda contra custo, que é o número que o dono
  de loja mais erra

### 3. Clientes e fiado

- cadastro leve: nome e telefone bastam
- quem deve, quanto, desde quando
- histórico de compra do cliente
- lembrete de cobrança pelo WhatsApp, escrito por ele, enviado por ele

### 4. Contas a pagar da loja

- aluguel da loja, condomínio da galeria, fornecedor, maquininha
- vencimento e aviso
- com a fatia 1 e a 2, fecha o lucro real: vendeu menos custou menos gastou

### 5. O que a loja rende

- venda por dia, por hora, por forma de pagamento
- produto que mais sai e produto parado
- quanto vai cair na conta nos próximos 30 dias, somando o que a maquininha
  ainda deve
- limite do MEI: quanto usou, quanto cabe, e em que mês estoura no ritmo atual

### 6. Nota fiscal

Último. Depende de certificado digital e de regra municipal, e a maioria das
vendas de balcão do MEI não exige.

## O que este documento não decide

- **Preço e forma de cobrança do Tino.mei.** É decisão de negócio do Davi.
- **Grade de produto na fatia 1.** Roupa precisa tamanho e cor; capinha de
  celular precisa modelo do aparelho; papelaria não precisa de nada. Modelar
  grade cedo demais complica a venda rápida, que é o que decide a adoção.
- **Importar a planilha que a loja já tem.** Vale muito para "acoplar sem
  trabalho", mas cada loja tem uma planilha diferente. Precisa de exemplo real
  antes de virar código.

## Relação com o Tino

Produto separado no que o cliente vê: marca própria, telas próprias, preço
próprio. Mesma base de código no que ele não vê — o motor financeiro em
centavos, a autenticação, os componentes de tela e o cálculo do limite do MEI
já existem e estão testados. Manter dois repositórios seria pagar duas vezes
pela mesma manutenção sem entregar nada a mais.
