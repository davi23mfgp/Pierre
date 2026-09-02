-- CreateEnum
CREATE TYPE "CategoriaDaLoja" AS ENUM ('ALUGUEL', 'CONDOMINIO', 'FORNECEDOR', 'ENERGIA', 'MAQUININHA', 'IMPOSTO', 'FUNCIONARIO', 'OUTRO');

-- CreateTable
CREATE TABLE "ContaDaLoja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaDaLoja" NOT NULL DEFAULT 'OUTRO',
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "pagaEm" TIMESTAMP(3),
    "mensal" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaDaLoja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContaDaLoja_lojaId_vencimento_idx" ON "ContaDaLoja"("lojaId", "vencimento");

-- CreateIndex
CREATE INDEX "ContaDaLoja_lojaId_paga_idx" ON "ContaDaLoja"("lojaId", "paga");

-- AddForeignKey
ALTER TABLE "ContaDaLoja" ADD CONSTRAINT "ContaDaLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
