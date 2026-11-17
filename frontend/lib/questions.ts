export type Answers = Record<string, string>;
export type Question = { key: string; label: string; type: "select" | "number" | "text"; options?: string[]; min?: number; max?: number; step?: string; when?: (answers: Answers) => boolean };
const yesNo = ["yes", "no"];
const select = (key: string, label: string, options: string[], when?: Question["when"]): Question => ({ key, label, type: "select", options, when });

export function sections(states: string[]): { title: string; questions: Question[] }[] {
  return [
    { title: "Personal details", questions: [
      { key: "age", label: "Age in years", type: "number", min: 0, max: 120 },
      select("gender", "Gender", ["female", "male", "non_binary", "other"]),
      select("state", "State or union territory", states),
      { key: "district", label: "District", type: "text" },
      select("residence", "Residence", ["rural", "urban"]),
      select("occupation", "Occupation", ["farmer", "student", "business", "worker", "homemaker", "retired", "other"]),
    ] },
    { title: "Economic details", questions: [
      { key: "income", label: "Annual household income (INR)", type: "number", min: 0, max: 1000000000 },
      select("employment", "Employment status", ["employed", "self_employed", "unemployed", "retired", "not_seeking"]),
      select("bpl", "Below Poverty Line (BPL) status", yesNo),
      select("farmer", "Are you a farmer?", yesNo),
      { key: "landholding", label: "Landholding (hectares)", type: "number", min: 0, max: 100000, step: "any", when: a => a.farmer === "yes" },
      select("street_vendor", "Are you a street vendor?", yesNo, a => a.residence === "urban" && ["worker", "business", "other"].includes(a.occupation)),
    ] },
    { title: "Education", questions: [
      select("education", "Highest education level", ["none", "primary", "secondary", "higher_secondary", "diploma", "undergraduate", "postgraduate"]),
      select("student", "Are you currently a student?", yesNo),
    ] },
    { title: "Additional eligibility factors", questions: [
      select("disability", "Do you have a disability?", yesNo),
      select("social_category", "Social category", ["general", "sc", "st", "obc", "ews", "other"]),
      select("minority", "Do you belong to a minority community?", yesNo),
      select("marital_status", "Marital status", ["single", "married", "separated", "widowed"], a => a.gender === "female" && (Number(a.age) >= 40 || (a.state === "West Bengal" && a.student === "yes"))),
      select("pregnancy_or_recent_birth", "Are you pregnant or have you recently given birth?", yesNo, a => a.gender === "female" && Number(a.age) >= 15 && Number(a.age) <= 55),
      select("daughter_under_ten", "Are you the guardian of a girl under 10?", yesNo, a => Number(a.age) >= 18),
    ] },
  ];
}

export const formatAnswer = (value: string) => {
  if (["sc", "st", "obc", "ews"].includes(value)) return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
};

export function payload(questions: Question[], answers: Answers) {
  return Object.fromEntries(questions.flatMap(question => {
    const value = answers[question.key]?.trim();
    if (!value || (question.when && !question.when(answers))) return [];
    const converted = question.type === "number" ? Number(value) : value === "yes" ? true : value === "no" ? false : value;
    return [[question.key, converted]];
  }));
}
