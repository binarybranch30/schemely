import Link from "next/link";
import { Blank } from "@/components/catalog";
export default function NotFound() { return <div className="wrap section"><Blank title="Page not found"><Link className="text-link" href="/schemes">Browse schemes</Link></Blank></div>; }
