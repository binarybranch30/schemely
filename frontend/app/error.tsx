"use client";
import { Blank } from "@/components/catalog";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="wrap section"><Blank title="This page could not load"><Button onClick={reset} variant="outline">Try again</Button></Blank></div>;
}
