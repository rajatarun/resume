import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse sample digital products and resources by Tarun Raja.",
  openGraph: {
    title: "Tarun Raja Store",
    description: "Sample products and resources. Store is coming soon.",
    url: "/store"
  }
};

export default function StorePage() {
  return (
    <PageShell title="Store" intro="Curated digital products and accelerators for engineering teams. Browse placeholders now and replace with your live catalog later.">
      <Section title="Featured products">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{product.description}</p>
              <p className="mt-4 text-sm font-medium">{product.price}</p>
              <Link href="#" className="focus-ring mt-4 inline-block text-sm text-sky-600 hover:text-sky-700">View details</Link>
            </Card>
          ))}
        </div>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
          Store is coming soon. Product entries are placeholders and can be replaced anytime.
        </p>
      </Section>
    </PageShell>
  );
}
