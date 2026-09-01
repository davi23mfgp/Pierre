-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "MovimentoEstoque" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnitarioCentavos" INTEGER NOT NULL DEFAULT 0,
    "vendaId" TEXT,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimentoEstoque_produtoId_criadoEm_idx" ON "MovimentoEstoque"("produtoId", "criadoEm");

-- CreateIndex
CREATE INDEX "MovimentoEstoque_vendaId_idx" ON "MovimentoEstoque"("vendaId");

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "ProdutoLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
