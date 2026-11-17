import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { api, ApiError, type Detail } from "@/lib/api";
import { CategoryIcon } from "@/components/catalog";
import { Button } from "@/components/ui/button";

const labels: Record<string,string> = { age: "Age (years)", income: "Annual household income (INR)", landholding: "Landholding (hectares)", bpl: "BPL status", daughter_under_ten: "Girl child under ten in your care" };
const comparisons: Record<string,string> = { eq: "must be", lte: "must be at most", gte: "must be at least", in: "must be one of" };

export default async function SchemeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let scheme: Detail;
  try { scheme = await api<Detail>("/schemes/" + encodeURIComponent(id)); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  return <>
    <section className="page-intro"><div className="wrap">
      <Link href="/schemes" className="text-link"><ArrowLeft size={16} aria-hidden /> Scheme explorer</Link>
      <div className="chips"><CategoryIcon category={scheme.category.id} /><span className="tag">{scheme.category.name}</span><span className="tag">{scheme.state || "Central Government"}</span><span className="tag">Demo record</span></div>
      <h1>{scheme.name}</h1><p>{scheme.department}</p>
    </div></section>
    <div className="wrap section detail-grid">
      <section>
        <div className="panel"><h2>Overview</h2><p className="muted mt-2">{scheme.description}</p><h3 className="mt-4">Benefits</h3><p className="muted mt-2">{scheme.benefits}</p></div>
        <div className="panel"><h2>Illustrative eligibility criteria</h2><p className="muted mt-2">The matching tool uses these demo rules. Official requirements can change.</p>
          <ul className="bullets mt-3">{scheme.rules.map(({ field, operator, value }, index) => <li key={index}>{labels[field] || field.replaceAll("_", " ")} {comparisons[operator]} {typeof value === "boolean" ? (value ? "yes" : "no") : String(value).replaceAll("_"," ").replaceAll(",", ", ")}.</li>)}</ul>
        </div>
        <div className="panel"><h2>How to apply</h2><p className="muted mt-2">{scheme.application_process}</p></div>
      </section>
      <aside>
        <div className="panel"><h2>Documents to check</h2><p className="muted mt-2">Examples only. Confirm the required list before applying.</p><ul className="bullets mt-3">{scheme.documents.map(doc => <li key={doc.name}>{doc.name}</li>)}</ul></div>
        <div className="panel"><h2>Official references</h2>{scheme.sources.map(source => <div key={source.url} className="mt-3"><p className="muted">{source.verification_status.replace(";", " ·")}</p><p className="muted">Last verified {source.last_verified || "date unavailable"}</p><a className="text-link mt-2" href={source.url}>Visit official reference <ExternalLink size={14} aria-hidden /></a>{source.application_url && <p><a className="text-link" href={source.application_url}>Open application portal <ExternalLink size={14} aria-hidden /></a></p>}</div>)}</div>
        <Button asChild><Link href="/profile">Check my profile</Link></Button>
      </aside>
    </div>
  </>;
}
