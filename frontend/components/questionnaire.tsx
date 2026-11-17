"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api, type Results } from "@/lib/api";
import { type Answers, sections, formatAnswer, payload } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { Dashboard } from "@/components/results";

export function Questionnaire({ states }: { states: string[] }) {
  const steps = sections(states);
  const allQuestions = steps.flatMap(step => step.questions);
  const heading = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [focusStep, setFocusStep] = useState(false);
  const review = index === steps.length;
  const visible = (review ? allQuestions : steps[index].questions).filter(question => !question.when || question.when(answers));
  const title = review ? "Review your answers" : steps[index].title;

  useEffect(() => {
    if (focusStep && !results) heading.current?.focus();
  }, [index, focusStep, results]);

  function changeStep(next: number) {
    setError("");
    setFocusStep(true);
    setIndex(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!review) { changeStep(index + 1); return; }
    setLoading(true);
    setError("");
    try {
      const results = await api<Results>("/eligibility/check", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(allQuestions, answers)),
      });
      setResults(results);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not check eligibility. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (results) return <Dashboard results={results} states={states} edit={() => setResults(null)} />;
  return <div className="wrap section form-shell">
    <div className="summary-row"><strong>Step {index + 1} of {steps.length + 1}</strong><span className="muted">{title}</span></div>
    <progress className="progress" aria-label="Questionnaire progress" max={steps.length + 1} value={index + 1} />
    <form className="panel profile-panel" onSubmit={submit}>
      <h2 ref={heading} tabIndex={-1}>{title}</h2>
      <p className="muted mt-2">{review ? "Check your answers before submitting." : "Share what you know and leave any question blank if you prefer."}</p>
      {review ? <dl className="review">{visible.map(question => <div key={question.key}><dt>{question.label}</dt><dd>{answers[question.key]?.trim() ? formatAnswer(answers[question.key]) : "Not provided"}</dd></div>)}</dl> :
        <div className="form-grid">{visible.map(question => {
          const value = answers[question.key] || "";
          const update = (value: string) => setAnswers(previous => ({ ...previous, [question.key]: value }));
          return <label className="field" key={question.key}>{question.label}
            {question.type === "select" ? <select value={value} onChange={event => update(event.target.value)}><option value="">Choose or skip</option>{question.options?.map(option => <option value={option} key={option}>{formatAnswer(option)}</option>)}</select> :
              <input type={question.type} value={value} onChange={event => update(event.target.value)} min={question.min} max={question.max} step={question.step} maxLength={question.type === "text" ? 100 : undefined} />}
          </label>;
        })}</div>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        {index > 0 ? <Button type="button" variant="outline" disabled={loading} onClick={() => changeStep(index - 1)}><ArrowLeft size={17} aria-hidden /> Previous</Button> : <span/>}
        <Button type="submit" disabled={loading}>{loading ? "Checking eligibility…" : review ? "See My Results" : "Next"} <ArrowRight size={17} aria-hidden /></Button>
      </div>
    </form>
  </div>;
}
