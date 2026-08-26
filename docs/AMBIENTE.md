# Ambiente

## Máquina

Windows 11, o projeto em `C:\Users\iasdn\Documents\pierre`.

## Banco

**Postgres 17 portátil** em `%LOCALAPPDATA%\pierre-pg`, sem serviço do Windows e
sem privilégio de administrador.

Por que portátil: o instalador oficial exige UAC, e a elevação foi recusada na
máquina do Davi. Binários extraídos + `initdb` resolvem sem admin.

Consequência: **não sobe sozinho depois de reiniciar o computador.**

```bash
npm run db:start
npm run db:stop
```

Conexão (já no `.env`, que não está no repositório):

```
postgresql://pierre:pierre_local_2026@127.0.0.1:5432/pierre
```

Recriar do zero, se um dia sumir:

```bash
# baixe postgresql-17-windows-x64-binaries.zip, extraia em %LOCALAPPDATA%\pierre-pg
initdb -D %LOCALAPPDATA%\pierre-pg\data -U pierre --pwfile=senha.txt -E UTF8 --locale=C
pg_ctl -D %LOCALAPPDATA%\pierre-pg\data -l pg.log -o "-p 5432" start
psql -U pierre -h 127.0.0.1 -d postgres -c "CREATE DATABASE pierre;"
npx prisma migrate deploy
node scripts/demo.mjs
```

## `.env`

Fora do repositório de propósito. Para recriar:

```
DATABASE_URL="postgresql://pierre:pierre_local_2026@127.0.0.1:5432/pierre?schema=public"
JWT_SECRET="<64 caracteres hex aleatórios>"
OPEN_FINANCE_PROVIDER="sandbox"
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-opus-5"
```

`JWT_SECRET` não tem valor padrão no código de propósito: subir sem ele
assinaria sessão com segredo público, e qualquer pessoa forjaria login.

## Rodar

```bash
npm run dev
```

Se a porta 3000 estiver presa por um processo travado sem permissão para
encerrar, o Next escolhe outra e imprime qual. Para descobrir depois:

```bash
netstat -ano | findstr LISTENING | findstr node
```

## Celular

Mesma rede Wi-Fi, `http://<IP-do-PC>:<porta>`. O IP aparece como "Network" no
`npm run dev`. Na máquina do Davi é `192.168.0.51`.

O firewall já libera Node (regra "Node.js JavaScript Runtime", entrada).

No navegador do celular: menu → **Adicionar à tela de início**. O manifesto e os
ícones já estão prontos, então abre sem barra de navegador.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | 138 testes do motor, meio segundo |
| `npm run build` | build de produção (roda `prisma generate` antes) |
| `npm run db:start` / `db:stop` | Postgres portátil |
| `npx prisma migrate dev` | nova migração após mexer no schema |
| `npx prisma studio` | ver o banco numa interface |
| `node scripts/demo.mjs` | recria a conta de demonstração |
| `node scripts/demo.mjs --limpar` | remove a demonstração |
| `node scripts/icones.mjs` | regenera os ícones do app |

## Armadilhas conhecidas

- **O dev server do Next 16 recusa subir** se já houver outro no mesmo
  diretório: `Another next dev server is already running`. Aconteceu várias
  vezes e os testes por HTTP voltavam vazios sem explicação óbvia.
- **Prisma Client fica velho no servidor em execução.** Depois de
  `prisma migrate dev`, reinicie o `npm run dev` — senão dá
  `Unknown argument` em campo que existe no schema.
- **`Can't reach database server`** quase sempre é o Postgres que não subiu
  depois de um reinício. `npm run db:start`.
