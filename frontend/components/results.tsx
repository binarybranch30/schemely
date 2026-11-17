"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { type Results, type Status, statuses } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Blank, SchemeCard } from "@/components/catalog";

export function Dashboard({ results, states, edit }: { results: Results; states: string[]; edit: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("relevance");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const categories = [...new Set(results.items.map(entry => entry.scheme.category.name))].sort();
  const visible = results.items.filter(entry => {
    const scheme = entry.scheme;
    const text = [scheme.name, scheme.description, scheme.category.name, scheme.benefits].join(" ").toLowerCase();
    return search.toLowerCase().trim().split(/\s+/).every(word => text.includes(word)) &&
      (!category || scheme.category.name === category) &&
      (!state || !scheme.state || scheme.state === state) &&
      (!level || scheme.level === level) &&
      (!status || entry.status === status);
  });
  if (sort !== "relevance") visible.sort((a,b) => a.scheme.name.localeCompare(b.scheme.name) * (sort === "name_desc" ? -1 : 1));

  const names = { likely: "Likely eligible", possible: "Need more information", ineligible: "Ineligible in this assessment" };
  return <section className="wrap section">
    <div className="section-head"><div><h2 ref={heading} tabIndex={-1}>Your scheme matches</h2><p>Illustrative results based on your answers. Confirm eligibility with the responsible department.</p></div><Button onClick={edit} variant="outline">Edit answers</Button></div>
    <div className="stats-grid panel">{(Object.keys(names) as Status[]).map(key => <div key={key}><strong>{results.counts[key]}</strong><span>{names[key]}</span></div>)}</div>
    <div className="chips" aria-label="Category breakdown">{Object.entries(results.categories).sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => <button type="button" key={key} className="tag cursor-pointer" aria-pressed={category === key} onClick={() => setCategory(category === key ? "" : key)}>{key} · {value}</button>)}</div>
    <div className="panel toolbar">
      <label className="field">Search results<input value={search} maxLength={150} onChange={event => setSearch(event.target.value)} placeholder="Name or keyword" /></label>
      <label className="field">Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label>
      <label className="field">State or union territory<select value={state} onChange={event => setState(event.target.value)}><option value="">All locations</option>{states.map(name => <option key={name}>{name}</option>)}</select></label>
      <label className="field">Government level<select value={level} onChange={event => setLevel(event.target.value)}><option value="">All levels</option><option value="central">Central</option><option value="state">State</option></select></label>
      <label className="field">Eligibility status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="field">Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="relevance">Relevance</option><option value="name">Name A–Z</option><option value="name_desc">Name Z–A</option></select></label>
    </div>
    <p className="muted mb-4" aria-live="polite">{visible.length} of {results.items.length} schemes</p>
    {visible.length ? <div className="card-grid">{visible.map(entry => <SchemeCard key={entry.scheme.id} scheme={entry.scheme} status={entry.status}>
      <details><summary className="text-link cursor-pointer">Why this status?</summary>
        <ul className="checks">{entry.checks.map((check,index) => {
          const Icon = check.outcome === "pass" ? CheckCircle2 : check.outcome === "fail" ? XCircle : CircleHelp;
          const outcome = { pass: "Met", fail: "Unmet", missing: "Missing" }[check.outcome];
          return <li className={"check-" + check.outcome} key={index}><Icon size={15} aria-hidden /><span><strong>{outcome}.</strong> {check.explanation}</span></li>;
        })}</ul>
      </details>
    </SchemeCard>)}</div> : <Blank title="No schemes match these filters">Try changing a filter or broadening your search.</Blank>}
  </section>;
}
