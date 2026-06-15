import { PrismaClient } from "@prisma/client";
import { ORIGENS_INICIAIS, PRODUTOS_INICIAIS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (const origem of ORIGENS_INICIAIS) {
    await prisma.origin.upsert({
      where: { nome: origem },
      update: { ativo: true },
      create: { nome: origem },
    });
  }

  for (const produto of PRODUTOS_INICIAIS) {
    await prisma.product.upsert({
      where: { nome: produto.nome },
      update: {
        categoria: produto.categoria,
        preco: produto.preco,
        recorrente: produto.recorrente,
        ativo: true,
      },
      create: produto,
    });
  }

  await prisma.profile.upsert({
    where: { email: "admin@estradadoartista.local" },
    update: { role: "Admin", ativo: true },
    create: {
      nome: "Admin Estrada do Artista",
      email: "admin@estradadoartista.local",
      role: "Admin",
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
