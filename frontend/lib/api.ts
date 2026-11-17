export type Category = { id: string; name: string };
export type Scheme = { id: string; name: string; description: string; benefits: string; category: Category; level: "central" | "state"; state: string | null; department: string; featured: boolean; demo: boolean };
export type Page = { items: Scheme[]; total: number; page: number; page_size: number };
export type Detail = Scheme & { application_process: string; rules: { field: string; operator: string; value: string | number | boolean | string[] }[]; documents: { name: string }[]; sources: { url: string; application_url: string | null; verification_status: string; last_verified: string | null }[] };
export const statuses = { likely: "Likely Eligible", possible: "Possibly Eligible / More Information Needed", ineligible: "Not Eligible Based on Provided Information" };
export type Status = keyof typeof statuses;
export type Match = { scheme: Scheme; status: Status; checks: { field: string; outcome: "pass" | "fail" | "missing"; explanation: string }[] };
export type Results = { items: Match[]; counts: Record<Status, number>; categories: Record<string, number> };

export const backend = () => process.env.BACKEND_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const origin = typeof window === "undefined" ? backend() + "/api" : "/service";
  let response: Response;
  try {
    response = await fetch(origin + path, { ...init, cache: "no-store" });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiError(503, "The scheme service is unavailable. Please try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, typeof body?.detail === "string" ? body.detail : "Something went wrong. Please try again.");
  }
  return response.json();
}
