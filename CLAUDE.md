# Bean.counter — instruções para o agente

Este arquivo é lido automaticamente no início de cada sessão do Claude Code.
Leia também `docs/` antes de mexer em qualquer cálculo.

## O que é

App de finanças pessoais para pessoa física (sozinha, casal, família) e MEI.
O dono é **Davi** (`davi23mfgp@gmail.com`), que usa o app para as próprias
contas, e pretende vendê-lo. Referência de código e visual: o ERP Controllares
— confirme a titularidade antes da venda, porque o `globals.css` veio de lá.

O produto se chamava Pierre até 27/08/2026. O nome foi trocado justamente
porque coincidia com o de um app de finanças existente, e marca é o que de fato
gera conflito — cálculo contábil, não. Se encontrar "pierre" em algum canto,
é sobra da renomeação; o que sobra de propósito está listado em
`docs/ESTADO.md`.

O objetivo declarado dele, nas palavras dele: um contador profissional que
ajude a organizar dívidas, juntar para metas, projetar e decidir empréstimo.

## Regras que não se negociam

1. **Dinheiro é sempre `Int` em centavos.** Nunca float. O nome do campo termina
   em `Centavos`. Float acumula erro e o extrato deixa de fechar com o banco.
2. **Taxa é sempre pontos-base (bps) `Int`.** 250 = 2,50% ao mês. O usuário
   digita "2,5" e a borda converte.
3. **Nada de número inventado.** Se falta dado, o app diz que falta e pede
   para cadastrar. Estimativa exibida como fato destrói a confiança na tela
   inteira — foi o defeito mais grave desta base até hoje.
4. **Todo indicador vem com a referência.** Percentual sem faixa não informa:
   22% de comprometimento é bom ou ruim? Só o limite responde.
5. **Nada entra no extrato sem conferência.** Notificação de banco erra (compra
   negada, estorno, pré-autorização de posto). Captura vai para fila.
6. **Comentário explica o porquê, não o quê.** Especialmente onde a escolha
   parece estranha: por que o cheque especial não é dívida separada, por que a
   nota tem teto. Veja os arquivos existentes para o tom.
7. **Português do Brasil em tudo**: código, comentários, commits, interface.
   Nomes de variáveis e funções em português.

## Antes de mexer em cálculo

```bash
npm test          # 138 testes, meio segundo
```

Se mudar regra de cálculo, o teste correspondente tem de mudar junto — e
**verifique que o teste falha quando você reverte a correção**. Um teste desta
suíte já passou com o código quebrado; foi reescrito só depois de provar que
pegava a regressão.

## Ambiente

```bash
npm run db:start   # Postgres portátil, não é serviço: não sobe sozinho
npm run dev
```

Detalhes em `docs/AMBIENTE.md`. O `.env` não está no repositório.

## Como o Davi trabalha

- Quer ver o defeito nomeado, não escondido. Reporte o que quebrou e o que
  ficou faltando, sem enfeitar.
- Prefere que você teste de verdade (curl, navegador) em vez de afirmar que
  funciona.
- Escreve mensagens curtas e com pressa; leia a intenção, não a ortografia.
- Já disse: **não vai usar Open Finance**. O código fica, mas fora do menu.
- Já disse: por enquanto, esqueça Telegram, PDF de fatura e integração com
  modelo de linguagem. O foco é cálculo e análise.
