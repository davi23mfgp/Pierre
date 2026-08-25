-- CreateEnum
CREATE TYPE "TipoLar" AS ENUM ('SOLO', 'CASAL', 'FAMILIA');

-- CreateEnum
CREATE TYPE "PapelMembro" AS ENUM ('TITULAR', 'CONJUGE', 'DEPENDENTE', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA', 'CARTAO_CREDITO', 'DINHEIRO', 'INVESTIMENTO', 'PJ_MEI');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "OrigemTransacao" AS ENUM ('MANUAL', 'IMPORT_OFX', 'IMPORT_CSV', 'IMPORT_PDF', 'OPEN_FINANCE', 'RECORRENCIA');

-- CreateEnum
CREATE TYPE "GrupoCategoria" AS ENUM ('MORADIA', 'ALIMENTACAO', 'TRANSPORTE', 'SAUDE', 'EDUCACAO', 'LAZER', 'PESSOAL', 'SERVICOS', 'DIVIDAS', 'IMPOSTOS', 'INVESTIMENTO', 'RENDA', 'NEGOCIO_MEI', 'OUTROS');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoMeta" AS ENUM ('RESERVA_EMERGENCIA', 'VIAGEM', 'APOSENTADORIA', 'IMOVEL', 'VEICULO', 'EDUCACAO', 'QUITAR_DIVIDA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusMeta" AS ENUM ('ATIVA', 'PAUSADA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDivida" AS ENUM ('CARTAO_ROTATIVO', 'CHEQUE_ESPECIAL', 'EMPRESTIMO_PESSOAL', 'CONSIGNADO', 'FINANCIAMENTO_VEICULO', 'FINANCIAMENTO_IMOVEL', 'ESTUDANTIL', 'PARCELAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstrategiaDivida" AS ENUM ('AVALANCHE', 'BOLA_DE_NEVE', 'PROPORCIONAL');

-- CreateEnum
CREATE TYPE "AtividadeMei" AS ENUM ('COMERCIO', 'INDUSTRIA', 'SERVICOS', 'COMERCIO_E_SERVICOS', 'TRANSPORTE_CARGA');

-- CreateEnum
CREATE TYPE "StatusConexao" AS ENUM ('ATIVA', 'EXPIRADA', 'ERRO', 'REVOGADA');

-- CreateEnum
CREATE TYPE "SeveridadeAlerta" AS ENUM ('INFO', 'ATENCAO', 'CRITICO');

-- CreateEnum
CREATE TYPE "PapelMensagem" AS ENUM ('USUARIO', 'PIERRE');

-- CreateTable
CREATE TABLE "Lar" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLar" NOT NULL DEFAULT 'SOLO',
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "fusoHorario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "diaInicioMes" INTEGER NOT NULL DEFAULT 1,
    "estrategiaDivida" "EstrategiaDivida" NOT NULL DEFAULT 'AVALANCHE',
    "mesesReserva" INTEGER NOT NULL DEFAULT 6,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "larId" TEXT NOT NULL,
    "membroId" TEXT,
    "ultimoLogin" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membro" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" "PapelMembro" NOT NULL DEFAULT 'TITULAR',
    "cor" TEXT NOT NULL DEFAULT 'blue',
    "rendaMensalCentavos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "membroId" TEXT,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "tipo" "TipoConta" NOT NULL DEFAULT 'CORRENTE',
    "saldoInicialCentavos" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT NOT NULL DEFAULT 'blue',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "limiteCentavos" INTEGER,
    "diaFechamento" INTEGER,
    "diaVencimento" INTEGER,
    "conexaoId" TEXT,
    "contaExternaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" "GrupoCategoria" NOT NULL DEFAULT 'OUTROS',
    "tipo" "TipoTransacao" NOT NULL DEFAULT 'DESPESA',
    "cor" TEXT NOT NULL DEFAULT 'blue',
    "icone" TEXT NOT NULL DEFAULT 'circle',
    "essencial" BOOLEAN NOT NULL DEFAULT false,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "paiId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transacao" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "membroId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "descricaoOriginal" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT true,
    "origem" "OrigemTransacao" NOT NULL DEFAULT 'MANUAL',
    "observacao" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "competencia" TEXT NOT NULL,
    "transferenciaParId" TEXT,
    "faturaId" TEXT,
    "metaId" TEXT,
    "dividaId" TEXT,
    "recorrenciaId" TEXT,
    "importacaoId" TEXT,
    "hashImport" TEXT,
    "transacaoExternaId" TEXT,
    "meiFaturamento" BOOLEAN NOT NULL DEFAULT false,
    "notaFiscal" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraCategorizacao" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "padrao" TEXT NOT NULL,
    "regex" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" TEXT NOT NULL,
    "membroId" TEXT,
    "renomearPara" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "acertos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegraCategorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "fechamento" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "totalCentavos" INTEGER NOT NULL DEFAULT 0,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "pagaEm" TIMESTAMP(3),

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL DEFAULT 'MENSAL',
    "diaVencimento" INTEGER NOT NULL,
    "proximaData" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3),
    "contaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "valorVariavel" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "limiteCentavos" INTEGER NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoMeta" NOT NULL DEFAULT 'OUTRO',
    "alvoCentavos" INTEGER NOT NULL,
    "saldoCentavos" INTEGER NOT NULL DEFAULT 0,
    "dataAlvo" TIMESTAMP(3),
    "aporteMensalCentavos" INTEGER NOT NULL DEFAULT 0,
    "rendimentoAnualBps" INTEGER NOT NULL DEFAULT 0,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusMeta" NOT NULL DEFAULT 'ATIVA',
    "cor" TEXT NOT NULL DEFAULT 'blue',
    "icone" TEXT NOT NULL DEFAULT 'target',
    "contaId" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Divida" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "credor" TEXT NOT NULL,
    "tipo" "TipoDivida" NOT NULL DEFAULT 'OUTRO',
    "saldoDevedorCentavos" INTEGER NOT NULL,
    "jurosMensalBps" INTEGER NOT NULL DEFAULT 0,
    "parcelaCentavos" INTEGER NOT NULL DEFAULT 0,
    "parcelasTotal" INTEGER,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "quitada" BOOLEAN NOT NULL DEFAULT false,
    "quitadaEm" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Divida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcelamento" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "estabelecimento" TEXT,
    "categoriaId" TEXT,
    "valorTotalCentavos" INTEGER NOT NULL,
    "parcelaCentavos" INTEGER NOT NULL,
    "parcelasTotal" INTEGER NOT NULL,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "dataCompra" TIMESTAMP(3) NOT NULL,
    "primeiraCompetencia" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "origem" "OrigemTransacao" NOT NULL DEFAULT 'MANUAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelaCompra" (
    "id" TEXT NOT NULL,
    "parcelamentoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "pagaEm" TIMESTAMP(3),

    CONSTRAINT "ParcelaCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulacaoEmprestimo" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "jurosMensalBps" INTEGER NOT NULL,
    "custosExtrasCentavos" INTEGER NOT NULL DEFAULT 0,
    "resultado" JSONB NOT NULL,
    "veredito" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulacaoEmprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeiPerfil" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "cnpj" TEXT,
    "razaoSocial" TEXT,
    "atividade" "AtividadeMei" NOT NULL DEFAULT 'SERVICOS',
    "dataAbertura" TIMESTAMP(3),
    "limiteAnualCentavos" INTEGER NOT NULL DEFAULT 8100000,
    "dasMensalCentavos" INTEGER NOT NULL DEFAULT 7580,
    "diaVencimentoDas" INTEGER NOT NULL DEFAULT 20,
    "proLaboreCentavos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeiPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeiCompetencia" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "receitaComercioCentavos" INTEGER NOT NULL DEFAULT 0,
    "receitaServicosCentavos" INTEGER NOT NULL DEFAULT 0,
    "dasPago" BOOLEAN NOT NULL DEFAULT false,
    "dasPagoEm" TIMESTAMP(3),
    "dasValorCentavos" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "MeiCompetencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Importacao" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "contaId" TEXT,
    "arquivoNome" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "importadas" INTEGER NOT NULL DEFAULT 0,
    "duplicadas" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConexaoOpenFinance" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "status" "StatusConexao" NOT NULL DEFAULT 'ATIVA',
    "ultimaSync" TIMESTAMP(3),
    "consentimentoExpiraEm" TIMESTAMP(3),
    "erroMensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConexaoOpenFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidade" "SeveridadeAlerta" NOT NULL DEFAULT 'INFO',
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "acaoRota" TEXT,
    "dados" JSONB,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "chave" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" TEXT NOT NULL,
    "larId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Nova conversa',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "papel" "PapelMensagem" NOT NULL,
    "texto" TEXT NOT NULL,
    "contexto" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_membroId_key" ON "Usuario"("membroId");

-- CreateIndex
CREATE INDEX "Usuario_larId_idx" ON "Usuario"("larId");

-- CreateIndex
CREATE INDEX "Membro_larId_idx" ON "Membro"("larId");

-- CreateIndex
CREATE INDEX "Conta_larId_idx" ON "Conta"("larId");

-- CreateIndex
CREATE INDEX "Categoria_larId_idx" ON "Categoria"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_larId_nome_paiId_key" ON "Categoria"("larId", "nome", "paiId");

-- CreateIndex
CREATE UNIQUE INDEX "Transacao_transferenciaParId_key" ON "Transacao"("transferenciaParId");

-- CreateIndex
CREATE INDEX "Transacao_larId_data_idx" ON "Transacao"("larId", "data");

-- CreateIndex
CREATE INDEX "Transacao_larId_competencia_idx" ON "Transacao"("larId", "competencia");

-- CreateIndex
CREATE INDEX "Transacao_contaId_data_idx" ON "Transacao"("contaId", "data");

-- CreateIndex
CREATE INDEX "Transacao_categoriaId_idx" ON "Transacao"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "Transacao_larId_hashImport_key" ON "Transacao"("larId", "hashImport");

-- CreateIndex
CREATE INDEX "RegraCategorizacao_larId_idx" ON "RegraCategorizacao"("larId");

-- CreateIndex
CREATE INDEX "Fatura_larId_idx" ON "Fatura"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_contaId_competencia_key" ON "Fatura"("contaId", "competencia");

-- CreateIndex
CREATE INDEX "Recorrencia_larId_idx" ON "Recorrencia"("larId");

-- CreateIndex
CREATE INDEX "Orcamento_larId_competencia_idx" ON "Orcamento"("larId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_larId_competencia_categoriaId_key" ON "Orcamento"("larId", "competencia", "categoriaId");

-- CreateIndex
CREATE INDEX "Meta_larId_idx" ON "Meta"("larId");

-- CreateIndex
CREATE INDEX "Divida_larId_idx" ON "Divida"("larId");

-- CreateIndex
CREATE INDEX "Parcelamento_larId_idx" ON "Parcelamento"("larId");

-- CreateIndex
CREATE INDEX "Parcelamento_contaId_idx" ON "Parcelamento"("contaId");

-- CreateIndex
CREATE INDEX "ParcelaCompra_competencia_idx" ON "ParcelaCompra"("competencia");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaCompra_parcelamentoId_numero_key" ON "ParcelaCompra"("parcelamentoId", "numero");

-- CreateIndex
CREATE INDEX "SimulacaoEmprestimo_larId_idx" ON "SimulacaoEmprestimo"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "MeiPerfil_larId_key" ON "MeiPerfil"("larId");

-- CreateIndex
CREATE INDEX "MeiCompetencia_larId_idx" ON "MeiCompetencia"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "MeiCompetencia_larId_competencia_key" ON "MeiCompetencia"("larId", "competencia");

-- CreateIndex
CREATE INDEX "Importacao_larId_idx" ON "Importacao"("larId");

-- CreateIndex
CREATE INDEX "ConexaoOpenFinance_larId_idx" ON "ConexaoOpenFinance"("larId");

-- CreateIndex
CREATE UNIQUE INDEX "ConexaoOpenFinance_larId_provedor_itemId_key" ON "ConexaoOpenFinance"("larId", "provedor", "itemId");

-- CreateIndex
CREATE INDEX "Alerta_larId_lido_idx" ON "Alerta"("larId", "lido");

-- CreateIndex
CREATE UNIQUE INDEX "Alerta_larId_chave_key" ON "Alerta"("larId", "chave");

-- CreateIndex
CREATE INDEX "Conversa_larId_idx" ON "Conversa"("larId");

-- CreateIndex
CREATE INDEX "Mensagem_conversaId_idx" ON "Mensagem"("conversaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_conexaoId_fkey" FOREIGN KEY ("conexaoId") REFERENCES "ConexaoOpenFinance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_transferenciaParId_fkey" FOREIGN KEY ("transferenciaParId") REFERENCES "Transacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_dividaId_fkey" FOREIGN KEY ("dividaId") REFERENCES "Divida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "Importacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraCategorizacao" ADD CONSTRAINT "RegraCategorizacao_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraCategorizacao" ADD CONSTRAINT "RegraCategorizacao_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraCategorizacao" ADD CONSTRAINT "RegraCategorizacao_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcelamento" ADD CONSTRAINT "Parcelamento_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcelamento" ADD CONSTRAINT "Parcelamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcelamento" ADD CONSTRAINT "Parcelamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaCompra" ADD CONSTRAINT "ParcelaCompra_parcelamentoId_fkey" FOREIGN KEY ("parcelamentoId") REFERENCES "Parcelamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulacaoEmprestimo" ADD CONSTRAINT "SimulacaoEmprestimo_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeiPerfil" ADD CONSTRAINT "MeiPerfil_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeiCompetencia" ADD CONSTRAINT "MeiCompetencia_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Importacao" ADD CONSTRAINT "Importacao_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConexaoOpenFinance" ADD CONSTRAINT "ConexaoOpenFinance_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_larId_fkey" FOREIGN KEY ("larId") REFERENCES "Lar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
