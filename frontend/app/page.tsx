export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ArrowRight, ClipboardList, ListChecks, Search, ShieldCheck } from "lucide-react";
import { api, type Category, type Page } from "@/lib/api";
import { Blank, CategoryIcon, SchemeCard } from "@/components/catalog";
import { HeroArt } from "@/components/hero-art";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const [featured, categories, all] = await Promise.all([
    api<Page>("/schemes?featured=true&page_size=3").catch(() => null),
    api<Category[]>("/categories").catch(() => null),
    api<Page>("/schemes?page_size=1").catch(() => null),
  ]);
  return <>
    <section className="hero"><div className="wrap hero-inner">
      <div><p className="eyebrow"><span className="tricolor" /> INDIAN GOVERNMENT SCHEMES</p>
        <h1>Find Government Schemes <em>Made for You</em></h1>
        <p className="hero-copy">Explore support for education, farming, healthcare, housing and more. Answer a few questions to see which schemes may fit your circumstances.</p>
        <form action="/schemes" className="hero-search"><Search size={21} aria-hidden /><label className="sr-only" htmlFor="home-search">Search schemes</label><input id="home-search" name="q" maxLength={150} placeholder="Search schemes, e.g. scholarships" /><Button type="submit" variant="outline">Search</Button></form>
        <div className="hero-actions"><Button asChild><Link href="/profile">Find My Schemes <ArrowRight size={17} aria-hidden /></Link></Button><span><ShieldCheck size={17} aria-hidden /> No Aadhaar required</span></div>
      </div><HeroArt />
    </div></section>
    {all && categories && <section className="stats" aria-label="Demo catalog statistics"><div className="wrap stats-grid"><div><strong>{all.total}</strong><span>Demo scheme records</span></div><div><strong>{categories.length}</strong><span>Demo categories</span></div><div><strong>2</strong><span>Government levels in demo</span></div></div></section>}
    <section className="wrap section"><div className="section-head"><div><h2>Browse by category</h2><p>Explore schemes by the kind of support you need.</p></div><Link href="/schemes" className="text-link">Explore all <ArrowRight size={16} aria-hidden /></Link></div>
      {categories ? <div className="category-grid">{categories.map(category => <Link key={category.id} href={"/schemes?category=" + category.id} className="category-card"><CategoryIcon category={category.id} /><span>{category.name}</span></Link>)}</div> : <Blank title="Categories are unavailable">Try reloading the page.</Blank>}
    </section>
    <section className="featured"><div className="wrap section"><div className="section-head"><div><h2>Featured schemes</h2><p>Get to know programmes from the demo catalog.</p></div><Link href="/schemes?sort=featured" className="text-link">View catalog <ArrowRight size={16} aria-hidden /></Link></div>
      {featured?.items.length ? <div className="card-grid">{featured.items.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}</div> : <Blank title="Featured schemes are unavailable">Try browsing the scheme explorer.</Blank>}
    </div></section>
    <section className="wrap section" id="how-it-works"><div className="section-head"><h2>How it works</h2></div><div className="card-grid">{[
      [ClipboardList, "Share basic details", "Answer questions about where you live, your household and your circumstances."],
      [ListChecks, "Review your matches", "See which demo rules you meet and which answers are missing."],
      [ShieldCheck, "Verify and apply", "Follow the official reference to confirm requirements and application steps."],
    ].map(([Icon, title, body]) => { const StepIcon = Icon as typeof ClipboardList; return <article className="step-card" key={String(title)}><span className="category-icon"><StepIcon size={22} aria-hidden /></span><h3>{String(title)}</h3><p className="muted">{String(body)}</p></article>; })}</div></section>
  </>;
}
