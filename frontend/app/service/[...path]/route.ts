import { backend } from "@/lib/api";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, { params }: Context) {
  const path = (await params).path.map(encodeURIComponent).join("/");
  const url = new URL(request.url);
  const isCatalog = /^(health|categories|states|schemes(?:\/[a-z0-9-]+)?)$/.test(path);
  const isProfile = path === "eligibility/check" && request.method === "POST";
  if (!(isCatalog && request.method === "GET") && !isProfile) {
    return Response.json({ detail: "Endpoint not found." }, { status: 404 });
  }
  try {
    const response = await fetch(backend() + "/api/" + path + url.search, {
      method: request.method,
      body: isProfile ? await request.text() : undefined,
      headers: isProfile ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ detail: "The scheme service is unavailable. Please try again." }, { status: 503 });
  }
}

export { proxy as GET, proxy as POST };
