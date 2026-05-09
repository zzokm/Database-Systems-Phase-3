/**
 * Base URL for browser calls to the Flask API (`NEXT_PUBLIC_API_BASE_URL`).
 *
 * Must be defined at **build time** when you need a non-default host (Docker:
 * pass `NEXT_PUBLIC_API_BASE_URL` as a build-arg). If unset during `next build`,
 * we fall back so static generation succeeds; redeploy/rebuild with the real
 * public API URL before production demos.
 */
const DEFAULT_PUBLIC_API_BASE = "http://localhost:5000";

export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_PUBLIC_API_BASE;
  return base.replace(/\/+$/, "");
}
