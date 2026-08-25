-- CreateEnum
CREATE TYPE "OrigemCaptura" AS ENUM ('NOTIFICACAO', 'TELEGRAM', 'ATALHO', 'EMAIL', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusCaptura" AS ENUM ('PENDENTE', 'CONFIRMADA', 'DESCARTADA', 'NAO_ENTENDIDA');

-- CreateTable
CREATE TABLE "ChaveCaptura" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "chaveHash" TEXT NOT NULL,
    "sufixo" TEXT NOT NULL,
    "origem" "OrigemCaptura" NOT NULL DEFAULT 'NOTIFICACAO',
    "chatId" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ultimoUso" TIMESTAMP(3),
    "usos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChaveCaptura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Captura" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "chaveId" TEXT,
    "origem" "OrigemCaptura" NOT NULL DEFAULT 'NOTIFICACAO',
    "status" "StatusCaptura" NOT NULL DEFAULT 'PENDENTE',
    "textoBruto" TEXT NOT NULL,
    "valorCentavos" INTEGER,
    "estabelecimento" TEXT,
    "data" TIMESTAMP(3),
    "cartaoFinal" TEXT,
    "instituicao" TEXT,
    "parcelaNumero" INTEGER,
    "parcelaTotal" INTEGER,
    "contaId" TEXT,
    "categoriaId" TEXT,
    "confianca" INTEGER NOT NULL DEFAULT 0,
    "transacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decididoEm" TIMESTAMP(3),

    CONSTRAINT "Captura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChaveCaptura_chaveHash_key" ON "ChaveCaptura"("chaveHash");

-- CreateIndex
CREATE INDEX "ChaveCaptura_larId_idx" ON "ChaveCaptura"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "Captura_transacaoId_key" ON "Captura"("transacaoId");

-- CreateIndex
CREATE INDEX "Captura_larId_status_idx" ON "Captura"("larId", "status");

-- AddForeignKey
ALTER TABLE "ChaveCaptura" ADD CONSTRAINT "ChaveCaptura_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Captura" ADD CONSTRAINT "Captura_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Captura" ADD CONSTRAINT "Captura_chaveId_fkey" FOREIGN KEY ("chaveId") REFERENCES "ChaveCaptura"("id") ON DELETE SET NULL ON UPDATE CASCADE;
