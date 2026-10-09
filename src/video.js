// Serves the trailer files in public/video/ with HTTP Range support.
//
// Browsers fetch video in byte ranges (Safari and iOS will not play a video at
// all without 206 responses), so the Worker fetches the whole static asset and
// streams back only the requested slice. Nothing is buffered in memory.

const RANGE = /^bytes=(\d*)-(\d*)$/;

export async function serveVideo(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (asset.status !== 200) return asset;

  const size = Number(asset.headers.get("Content-Length"));
  const headers = new Headers({
    "Content-Type": asset.headers.get("Content-Type") || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=604800"
  });
  const etag = asset.headers.get("ETag");
  if (etag) headers.set("ETag", etag);

  const match = RANGE.exec(request.headers.get("Range") || "");
  if (!match || !Number.isFinite(size) || size <= 0) {
    if (Number.isFinite(size) && size > 0) headers.set("Content-Length", String(size));
    return new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers });
  }

  let start, end;
  if (match[1] === "") {                       // "bytes=-500": the last 500 bytes
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) {
    asset.body?.cancel();
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") {
    asset.body?.cancel();
    return new Response(null, { status: 206, headers });
  }
  return new Response(asset.body.pipeThrough(slice(start, end)), { status: 206, headers });
}

// Passes through only bytes start..end (inclusive) of the stream, then stops reading.
function slice(start, end) {
  let pos = 0;
  return new TransformStream({
    transform(chunk, controller) {
      const from = Math.max(start - pos, 0);
      const to = Math.min(end + 1 - pos, chunk.byteLength);
      if (from < to) controller.enqueue(chunk.subarray(from, to));
      pos += chunk.byteLength;
      if (pos > end) controller.terminate();
    }
  });
}
