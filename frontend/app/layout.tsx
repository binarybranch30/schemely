import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Info } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Schemely | Government Scheme Finder", template: "%s | Schemely" },
  description: "Explore sample Indian government schemes and check illustrative eligibility.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header"><div className="wrap nav">
      <Link href="/" className="brand"><span><Compass size={21} aria-hidden /></span>Schemely</Link>
      <nav aria-label="Main navigation"><Link href="/schemes">Explore schemes</Link><Link className="nav-cta" href="/profile">Find my schemes</Link></nav>
    </div></header>
    <div className="demo-banner"><div className="wrap"><Info size={17} aria-hidden /><p>Demo Application — Scheme information and eligibility assessments are illustrative. Verify details through official government sources before applying.</p></div></div>
    <main id="main">{children}</main>
    <footer><div className="wrap footer"><Link href="/" className="brand"><span><Compass size={21} aria-hidden /></span>Schemely</Link><p>Indian government scheme discovery demo</p><nav aria-label="Footer"><Link href="/schemes">Scheme explorer</Link><Link href="/#how-it-works">How it works</Link><a href="https://www.myscheme.gov.in/">Official myScheme</a></nav></div></footer>
  </body></html>;
}
