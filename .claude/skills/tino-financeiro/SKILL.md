---
name: tino-financeiro
description: Regras de cálculo financeiro do app Tino — centavos inteiros, taxas em pontos-base, saldo derivado, cheque especial como saldo negativo. Use ao mexer em qualquer código que envolva dinheiro, juros, projeção, saldo, parcela, dívida, meta ou indicador financeiro neste projeto.
---

# Cálculo financeiro no Tino

Antes de escrever qualquer linha que toque dinheiro, confira estas regras.
O detalhamento de cada uma está em `docs/DECISOES.md`.

## Unidades

- **Dinheiro: `Int` em centavos.** Nome do campo termina em `Centavos`.
  Nunca float — `0.1 + 0.2 !== 0.3`, e o erro acumula mês a mês.
- **Taxa: `Int` em pontos-base.** 250 = 2,50% ao mês. A borda converte o que o
  usuário digita ("2,5") com `Math.round(Number(texto) * 100)`.
- **Competência: `"YYYY-MM"` em string.** Datas em UTC à meia-noite.
- **Divisão de dinheiro devolve a soma exata.** Use `ratear` / `ratearPorPeso`
  de `@/lib/dinheiro` — nunca `valor / n` direto.

## Saldo

- Saldo é **derivado dos lançamentos**, nunca gravado.
- **Cartão de crédito não entra no saldo disponível** — limite é dívida futura.
- **Transferência move saldo entre contas** mas não é receita nem despesa.
  A ponta de destino é a que tem `transferenciaParId`.
- **Saldo negativo em conta é o próprio cheque especial**, com juros sobre ele.
  Não modele como dívida separada — conta o mesmo buraco duas vezes.
  A `Divida` do tipo `CHEQUE_ESPECIAL` existe para guardar a taxa e aparecer na
  lista; quem tem `contaId` é pulado na derivação.

## Honestidade dos números

- **Se falta dado, diga que falta.** Nunca exiba estimativa como fato.
- **Todo indicador vem com a faixa de referência.** Percentual sem referência
  não informa nada.
- **Indicador sem base real não recebe nota** — marque como sem faixa e explique.
- **Nota composta tem teto pela pior faixa.** Média premiando quatro bons e um
  crítico produz "nota 84, situação crítica".
- **Guarde toda divisão**: `Math.max(1, divisor)`. `NaN%` chega até a tela.

## Onde o número mora

`src/lib/tino/panorama.ts` é a **fonte única**. Precisa de um número novo numa
tela? Adicione ao panorama, não calcule na tela — dois cálculos divergem e o
mesmo saldo aparece diferente em dois lugares.

O motor é **função pura**: sem banco, sem React. Mantenha assim; é o que faz os
138 testes rodarem em meio segundo.

## Antes de terminar

```bash
npm test
```

Mudou regra de cálculo? Mude o teste junto — e **reverta a correção para
confirmar que o teste falha**. Um teste desta suíte já passou com o código
quebrado.
