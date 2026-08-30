-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO_VISTA', 'CREDITO_PARCELADO', 'FIADO');

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormaRecebimento" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "taxaBps" INTEGER NOT NULL DEFAULT 0,
    "prazoDias" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormaRecebimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoLoja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "precoCentavos" INTEGER NOT NULL DEFAULT 0,
    "custoCentavos" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdutoLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteLoja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixa" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),
    "aberturaCentavos" INTEGER NOT NULL DEFAULT 0,
    "fechamentoInformadoCentavos" INTEGER,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SangriaCaixa" (
    "id" TEXT NOT NULL,
    "caixaId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SangriaCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendaLoja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "caixaId" TEXT,
    "clienteId" TEXT,
    "numero" INTEGER NOT NULL,
    "totalCentavos" INTEGER NOT NULL DEFAULT 0,
    "descontoCentavos" INTEGER NOT NULL DEFAULT 0,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "canceladaEm" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVenda" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "totalCentavos" INTEGER NOT NULL,

    CONSTRAINT "ItemVenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoVenda" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "taxaBps" INTEGER NOT NULL DEFAULT 0,
    "valorLiquidoCentavos" INTEGER NOT NULL,
    "previsaoRecebimentoEm" TIMESTAMP(3) NOT NULL,
    "recebidoEm" TIMESTAMP(3),
    "parcelas" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PagamentoVenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loja_larId_idx" ON "Loja"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "FormaRecebimento_lojaId_forma_key" ON "FormaRecebimento"("lojaId", "forma");

-- CreateIndex
CREATE INDEX "ProdutoLoja_lojaId_nome_idx" ON "ProdutoLoja"("lojaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoLoja_lojaId_codigoBarras_key" ON "ProdutoLoja"("lojaId", "codigoBarras");

-- CreateIndex
CREATE INDEX "ClienteLoja_lojaId_nome_idx" ON "ClienteLoja"("lojaId", "nome");

-- CreateIndex
CREATE INDEX "Caixa_lojaId_abertoEm_idx" ON "Caixa"("lojaId", "abertoEm");

-- CreateIndex
CREATE INDEX "VendaLoja_lojaId_criadoEm_idx" ON "VendaLoja"("lojaId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "VendaLoja_lojaId_numero_key" ON "VendaLoja"("lojaId", "numero");

-- CreateIndex
CREATE INDEX "ItemVenda_vendaId_idx" ON "ItemVenda"("vendaId");

-- CreateIndex
CREATE INDEX "PagamentoVenda_vendaId_idx" ON "PagamentoVenda"("vendaId");

-- CreateIndex
CREATE INDEX "PagamentoVenda_previsaoRecebimentoEm_idx" ON "PagamentoVenda"("previsaoRecebimentoEm");

-- AddForeignKey
ALTER TABLE "Loja" ADD CONSTRAINT "Loja_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormaRecebimento" ADD CONSTRAINT "FormaRecebimento_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoLoja" ADD CONSTRAINT "ProdutoLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteLoja" ADD CONSTRAINT "ClienteLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SangriaCaixa" ADD CONSTRAINT "SangriaCaixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaLoja" ADD CONSTRAINT "VendaLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaLoja" ADD CONSTRAINT "VendaLoja_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaLoja" ADD CONSTRAINT "VendaLoja_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteLoja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVenda" ADD CONSTRAINT "ItemVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "VendaLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVenda" ADD CONSTRAINT "ItemVenda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "ProdutoLoja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoVenda" ADD CONSTRAINT "PagamentoVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "VendaLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
