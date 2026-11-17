import Link from "next/link";
import { api, type Category, type Page } from "@/lib/api";
import { Blank, SchemeCard } from "@/components/catalog";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Explore schemes" };

export default async function Explorer({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const read = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const q = read("q").slice(0, 150);
  const category = read("category").slice(0, 40);
  const state = read("state").slice(0, 80);
  const requestedSort = read("sort");
  const sort = ["name", "name_desc", "featured"].includes(requestedSort) ? requestedSort : "name";
  const page = Math.min(10000, Math.max(1, Number.parseInt(read("page"), 10) || 1));
  const [categories, states] = await Promise.all([api<Category[]>("/categories"), api<string[]>("/states")]);
  const query = new URLSearchParams({ q, category: categories.some(x => x.id === category) ? category : "", state: states.includes(state) ? state : "", sort, page: String(page), page_size: "9" });
  const listing = await api<Page>("/schemes?" + query);
  const pages = Math.max(1, Math.ceil(listing.total / listing.page_size));
  const link = (number: number) => "/schemes?" + new URLSearchParams({ ...Object.fromEntries(query), page: String(number) });

  return <>
    <section className="page-intro"><div className="wrap"><p className="eyebrow">Scheme catalog</p><h1>Explore schemes</h1><p>Search central and state programmes in the demo catalog.</p></div></section>
    <div className="wrap section">
      <form action="/schemes" className="panel toolbar">
        <label className="field">Search schemes<input name="q" defaultValue={q} maxLength={150} placeholder="Name or keyword" /></label>
        <label className="field">Category<select name="category" defaultValue={category}><option value="">All categories</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field">State or union territory<select name="state" defaultValue={state}><option value="">All locations</option>{states.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="field">Sort by<select name="sort" defaultValue={sort}><option value="name">Name A–Z</option><option value="name_desc">Name Z–A</option><option value="featured">Featured first</option></select></label>
        <Button type="submit">Apply filters</Button>
      </form>
      <div className="summary-row"><p className="muted">{listing.total} {listing.total === 1 ? "scheme" : "schemes"} found</p><Link className="text-link" href="/schemes">Clear filters</Link></div>
      {listing.items.length ? <div className="card-grid">{listing.items.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}</div> : <Blank title="No schemes on this page">Change the filters or return to the first page.</Blank>}
      {pages > 1 && <nav className="pagination" aria-label="Catalog pagination">
        {page > 1 && <Button asChild variant="outline"><Link href={link(page > pages ? 1 : page - 1)}>Previous page</Link></Button>}
        <span className="muted">Page {page} of {pages}</span>
        {page < pages && <Button asChild variant="outline"><Link href={link(page + 1)}>Next page</Link></Button>}
      </nav>}
    </div>
  </>;
}
