import { PageHeader } from "@/components/page-header";
import { ProductsClient } from "@/components/products-client";
import { getProducts } from "@/lib/db-adapter";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  return (
    <>
      <PageHeader title="Produtos / ofertas" description="Escada comercial da Estrada do Artista com criação, edição e exclusão segura." />
      <ProductsClient initialProducts={await getProducts()} />
    </>
  );
}
