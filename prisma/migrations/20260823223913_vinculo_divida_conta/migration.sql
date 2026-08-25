-- AlterTable
ALTER TABLE "Divida" ADD COLUMN     "contaId" TEXT;

-- AlterTable
ALTER TABLE "Lar" ADD COLUMN     "custoEstimadoCentavos" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
