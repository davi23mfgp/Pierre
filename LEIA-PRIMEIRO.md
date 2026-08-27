# Bean.counter — pacote completo

Projeto inteiro: código, histórico do git, documentação, testes e o banco de
decisões. Descompacte, instale as dependências e está rodando.

## Atenção: este pacote contém segredos

O arquivo **`.env`** está incluído para o projeto rodar sem configuração. Ele
tem o `JWT_SECRET` (que assina as sessões) e a senha do banco local.

Por isso: **não publique este zip, não anexe em issue, não suba em nuvem
pública.** No repositório do GitHub o `.env` está corretamente de fora — quem
clonar de lá recria o arquivo seguindo `docs/AMBIENTE.md`.

Se este zip vazar, gere outro `JWT_SECRET` (64 caracteres hex) e reinicie o app:
todas as sessões abertas caem, e é isso que você quer.

## Para voltar a rodar

```bash
npm install
npm run db:start     # Postgres portátil — não é serviço, não sobe sozinho
npm test             # 138 testes, deve dar tudo verde
npm run dev
```

Entrar: `demo@bean.local` / `demo12345`

O banco em si **não está aqui** — ele vive em `%LOCALAPPDATA%\bean-counter-pg`, fora
da pasta do projeto. Em outra máquina, recrie com as instruções de
`docs/AMBIENTE.md` e rode `node scripts/demo.mjs`.

## Para continuar o projeto em outra sessão do Claude

Leia **`docs/COMECAR-AQUI.md`**. O `CLAUDE.md` da raiz é lido automaticamente
pelo Claude Code no início de cada sessão.

## O que tem dentro

```
CLAUDE.md            regras do projeto — lidas automaticamente pelo agente
README.md            o que o app faz
docs/                começar aqui, decisões, histórico, arquitetura, ambiente
.claude/skills/      skill com as regras de cálculo financeiro
src/                 o app (119 arquivos)
testes/              138 testes do motor de cálculo
prisma/              schema e migrações
scripts/             banco portátil, conta de demonstração, ícones
.git/                7 commits com o porquê de cada mudança
```
