-- O valor PIERRE guardava a marca antiga dentro do banco. RENAME VALUE preserva
-- as linhas existentes: nada é reescrito, só o rótulo do enum muda.
ALTER TYPE "PapelMensagem" RENAME VALUE 'PIERRE' TO 'ASSISTENTE';
