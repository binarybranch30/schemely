import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, HeartHandshake, HeartPulse, House, Landmark, Sprout, UsersRound, Accessibility, Wallet } from "lucide-react";
import { type Scheme, type Status, statuses } from "@/lib/api";

const icons = { agriculture: Sprout, education: GraduationCap, health: HeartPulse, women: HeartHandshake, employment: BriefcaseBusiness, business: Landmark, housing: House, senior: UsersRound, disability: Accessibility, finance: Wallet };

export function CategoryIcon({ category }: { category: string }) {
  const Icon = icons[category as keyof typeof icons] || Landmark;
  return <span className={"category-icon tint-" + category}><Icon size={21} aria-hidden /></span>;
}

export function SchemeCard({ scheme, status, children }: { scheme: Scheme; status?: Status; children?: React.ReactNode }) {
  return <article className="scheme-card">
    <div className="flex items-center justify-between gap-3"><CategoryIcon category={scheme.category.id} /><span className="tag">{scheme.state || "Central Government"}</span></div>
    <p className="eyebrow">{scheme.category.name}</p>
    <h3><Link href={"/schemes/" + scheme.id}>{scheme.name}</Link></h3>
    <p className="muted">{scheme.description}</p>
    {scheme.benefits !== scheme.description && <p><strong>Benefits</strong> {scheme.benefits}</p>}
    {status && <span className={"status " + status}>{statuses[status]}</span>}
    {children}
    <Link className="text-link mt-auto" href={"/schemes/" + scheme.id}>Scheme details <ArrowUpRight size={15} aria-hidden /></Link>
  </article>;
}

export function Blank({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="blank" role="status"><h2>{title}</h2><div className="muted">{children}</div></div>;
}
