// Response helpers shared by every route.

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

// Read a JSON body, or null when it is missing or not JSON.
export async function readJson(request) {
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const nowIso = () => new Date().toISOString();
