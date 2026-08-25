/**
 * Liga e desliga o Postgres local do Pierre.
 *
 * O banco roda a partir de binários portáteis em %LOCALAPPDATA%\pierre-pg, sem
 * serviço do Windows e sem privilégio de administrador. Como não é serviço, ele
 * não sobe sozinho depois de reiniciar a máquina — daí este script.
 *
 *   npm run db:start
 *   npm run db:stop
 */

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"

const base = join(process.env.LOCALAPPDATA ?? "", "pierre-pg")
const pgCtl = join(base, "pgsql", "bin", "pg_ctl.exe")
const dados = join(base, "data")
const log = join(base, "pg.log")

if (!existsSync(pgCtl)) {
  console.error(`Postgres local não encontrado em ${base}.`)
  console.error("Veja a seção 'Banco local' do README para instalar de novo.")
  process.exit(1)
}

const acao = process.argv[2] ?? "start"
const argumentos =
  acao === "stop"
    ? ["-D", dados, "-m", "fast", "stop"]
    : ["-D", dados, "-l", log, "-o", "-p 5432", "start"]

const resultado = spawnSync(pgCtl, argumentos, { stdio: "inherit" })

// pg_ctl devolve 0 também quando o servidor já estava no estado pedido, então
// um código diferente de zero aqui é problema de verdade.
process.exit(resultado.status ?? 1)
