/**
 * Semeadura de um lar novo.
 *
 * Um app de finanças que abre em branco exige do usuário exatamente o trabalho
 * que ele veio evitar. O lar nasce com plano de contas, contas básicas, regras
 * de categorização e, se for o caso, o perfil MEI.
 */

import { prisma } from "@/lib/prisma"
import type { GrupoCategoria, TipoTransacao } from "@prisma/client"

interface Semente {
  nome: string
  grupo: GrupoCategoria
  tipo?: TipoTransacao
  essencial?: boolean
  icone?: string
  cor?: string
}

export const CATEGORIAS_PADRAO: Semente[] = [
  // Moradia
  { nome: "Aluguel e condomínio", grupo: "MORADIA", essencial: true, icone: "home", cor: "blue" },
  { nome: "Energia elétrica", grupo: "MORADIA", essencial: true, icone: "zap", cor: "yellow" },
  { nome: "Água", grupo: "MORADIA", essencial: true, icone: "droplet", cor: "teal" },
  { nome: "Gás", grupo: "MORADIA", essencial: true, icone: "flame", cor: "orange" },
  { nome: "Manutenção da casa", grupo: "MORADIA", icone: "wrench", cor: "blue" },

  // Alimentação
  { nome: "Supermercado", grupo: "ALIMENTACAO", essencial: true, icone: "shopping-cart", cor: "green" },
  { nome: "Restaurante", grupo: "ALIMENTACAO", icone: "utensils", cor: "orange" },
  { nome: "Delivery", grupo: "ALIMENTACAO", icone: "bike", cor: "red" },
  { nome: "Padaria e café", grupo: "ALIMENTACAO", icone: "coffee", cor: "orange" },

  // Transporte
  { nome: "Combustível", grupo: "TRANSPORTE", essencial: true, icone: "fuel", cor: "yellow" },
  { nome: "Aplicativos de transporte", grupo: "TRANSPORTE", icone: "car", cor: "purple" },
  { nome: "Transporte público", grupo: "TRANSPORTE", essencial: true, icone: "bus", cor: "blue" },
  { nome: "Estacionamento e pedágio", grupo: "TRANSPORTE", icone: "parking-circle", cor: "blue" },
  { nome: "Manutenção do veículo", grupo: "TRANSPORTE", icone: "wrench", cor: "teal" },

  // Saúde
  { nome: "Plano de saúde", grupo: "SAUDE", essencial: true, icone: "heart-pulse", cor: "red" },
  { nome: "Farmácia", grupo: "SAUDE", essencial: true, icone: "pill", cor: "green" },
  { nome: "Consultas e exames", grupo: "SAUDE", essencial: true, icone: "stethoscope", cor: "teal" },
  { nome: "Academia", grupo: "SAUDE", icone: "dumbbell", cor: "purple" },

  // Educação
  { nome: "Educação", grupo: "EDUCACAO", essencial: true, icone: "graduation-cap", cor: "blue" },
  { nome: "Livros e cursos", grupo: "EDUCACAO", icone: "book", cor: "purple" },

  // Lazer
  { nome: "Assinaturas e streaming", grupo: "LAZER", icone: "play", cor: "red" },
  { nome: "Lazer e eventos", grupo: "LAZER", icone: "ticket", cor: "purple" },
  { nome: "Viagem", grupo: "LAZER", icone: "plane", cor: "teal" },

  // Pessoal
  { nome: "Vestuário", grupo: "PESSOAL", icone: "shirt", cor: "purple" },
  { nome: "Cuidados pessoais", grupo: "PESSOAL", icone: "scissors", cor: "orange" },
  { nome: "Compras online", grupo: "PESSOAL", icone: "package", cor: "orange" },
  { nome: "Pet", grupo: "PESSOAL", icone: "paw-print", cor: "yellow" },
  { nome: "Presentes e doações", grupo: "PESSOAL", icone: "gift", cor: "red" },

  // Serviços
  { nome: "Telefone e internet", grupo: "SERVICOS", essencial: true, icone: "wifi", cor: "blue" },
  { nome: "Seguros", grupo: "SERVICOS", essencial: true, icone: "shield", cor: "teal" },
  { nome: "Serviços domésticos", grupo: "SERVICOS", icone: "brush", cor: "green" },

  // Dívidas e impostos
  { nome: "Empréstimos", grupo: "DIVIDAS", icone: "landmark", cor: "red" },
  { nome: "Tarifas e juros", grupo: "DIVIDAS", icone: "percent", cor: "red" },
  { nome: "Impostos e taxas", grupo: "IMPOSTOS", essencial: true, icone: "receipt", cor: "yellow" },

  // Investimento
  { nome: "Aportes", grupo: "INVESTIMENTO", icone: "piggy-bank", cor: "green" },

  // Receitas
  { nome: "Salário", grupo: "RENDA", tipo: "RECEITA", icone: "wallet", cor: "green" },
  { nome: "Rendimentos", grupo: "INVESTIMENTO", tipo: "RECEITA", icone: "trending-up", cor: "green" },
  { nome: "Outras receitas", grupo: "RENDA", tipo: "RECEITA", icone: "plus-circle", cor: "teal" },

  // MEI
  { nome: "Recebimentos de vendas", grupo: "NEGOCIO_MEI", tipo: "RECEITA", icone: "store", cor: "green" },
  { nome: "Prestação de serviços", grupo: "NEGOCIO_MEI", tipo: "RECEITA", icone: "briefcase", cor: "teal" },
  { nome: "DAS do MEI", grupo: "NEGOCIO_MEI", essencial: true, icone: "file-text", cor: "yellow" },
  { nome: "Custos do negócio", grupo: "NEGOCIO_MEI", icone: "boxes", cor: "orange" },

  { nome: "Outros", grupo: "OUTROS", icone: "circle", cor: "blue" },
]

/** Regras iniciais: ligam o dicionário embutido ao plano de contas do lar. */
const REGRAS_PADRAO: { padrao: string; categoria: string; renomearPara?: string }[] = [
  { padrao: "IFOOD", categoria: "Delivery", renomearPara: "iFood" },
  { padrao: "RAPPI", categoria: "Delivery", renomearPara: "Rappi" },
  { padrao: "UBER", categoria: "Aplicativos de transporte", renomearPara: "Uber" },
  { padrao: "99APP", categoria: "Aplicativos de transporte", renomearPara: "99" },
  { padrao: "NETFLIX", categoria: "Assinaturas e streaming", renomearPara: "Netflix" },
  { padrao: "SPOTIFY", categoria: "Assinaturas e streaming", renomearPara: "Spotify" },
  { padrao: "POSTO", categoria: "Combustível" },
  { padrao: "DROGARIA", categoria: "Farmácia" },
  { padrao: "DROGASIL", categoria: "Farmácia", renomearPara: "Drogasil" },
  { padrao: "SUPERMERCADO", categoria: "Supermercado" },
  { padrao: "SALARIO", categoria: "Salário", renomearPara: "Salário" },
  { padrao: "DAS SIMPLES", categoria: "DAS do MEI", renomearPara: "DAS do MEI" },
]

export async function semearLar(larId: string, opcoes: { modoMei?: boolean } = {}) {
  await prisma.categoria.createMany({
    data: CATEGORIAS_PADRAO.map((semente, ordem) => ({
      larId,
      nome: semente.nome,
      grupo: semente.grupo,
      tipo: semente.tipo ?? "DESPESA",
      essencial: semente.essencial ?? false,
      icone: semente.icone ?? "circle",
      cor: semente.cor ?? "blue",
      sistema: true,
      ordem,
    })),
    skipDuplicates: true,
  })

  const categorias = await prisma.categoria.findMany({ where: { larId }, select: { id: true, nome: true } })
  const porNome = new Map(categorias.map((categoria) => [categoria.nome, categoria.id]))

  await prisma.regraCategorizacao.createMany({
    data: REGRAS_PADRAO.filter((regra) => porNome.has(regra.categoria)).map((regra) => ({
      larId,
      padrao: regra.padrao,
      categoriaId: porNome.get(regra.categoria) as string,
      renomearPara: regra.renomearPara ?? null,
      // Prioridade baixa: qualquer regra que o usuário criar depois vence estas.
      prioridade: 10,
    })),
  })

  await prisma.conta.createMany({
    data: [
      { larId, nome: "Conta corrente", tipo: "CORRENTE", cor: "blue" },
      { larId, nome: "Carteira", tipo: "DINHEIRO", cor: "green" },
    ],
  })

  // Reserva de emergência é a primeira meta de qualquer plano: nasce junto,
  // com alvo em zero até o app conhecer o custo mensal do lar.
  await prisma.meta.create({
    data: {
      larId,
      nome: "Reserva de emergência",
      tipo: "RESERVA_EMERGENCIA",
      alvoCentavos: 0,
      prioridade: 100,
      icone: "shield",
      cor: "teal",
      observacao: "O alvo é ajustado automaticamente conforme o Bean aprende seu custo mensal.",
    },
  })

  if (opcoes.modoMei) {
    await prisma.meiPerfil.create({ data: { larId } })
    await prisma.conta.create({
      data: { larId, nome: "Conta do CNPJ", tipo: "PJ_MEI", cor: "purple" },
    })
  }
}
