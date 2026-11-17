export const dynamic = 'force-dynamic';

import { api } from "@/lib/api";
import { Questionnaire } from "@/components/questionnaire";

export const metadata = { title: "Find my schemes" };

export default async function Profile() {
  const states = await api<string[]>("/states");
  return <>
    <section className="page-intro"><div className="wrap"><p className="eyebrow">Personalised scheme finder</p><h1>Find my schemes</h1><p>Your answers stay in this session and are used to check illustrative rules.</p></div></section>
    <Questionnaire states={states} />
  </>;
}
