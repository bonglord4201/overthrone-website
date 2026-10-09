// OVERTHRONE SMP Worker.
//
// Static files in public/ are still served by Workers Static Assets. This
// Worker only runs first for the routes listed in wrangler.jsonc
// (assets.run_worker_first): the JSON API, uploaded media, the trailer video
// (for byte-range requests), the admin panel and
// the main HTML pages, into which it writes the editable site settings.

import { handleApi, serveMedia } from "./api.js";
import { getAdmin, authConfigured } from "./auth.js";
import { getSettings, isHttpUrl, isLink, VOTE_SLOTS, voteName, voteHost } from "./settings.js";
import { secure } from "./http.js";
import { serveVideo } from "./video.js";

const isAdminPath = (p) => p === "/admin" || p === "/admin/" || p === "/admin.html" || p.startsWith("/admin/");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) return secure(await handleApi(request, env, url));

    if (path.startsWith("/video/")) return secure(await serveVideo(request, env));

    if (path.startsWith("/media/")) {
      try {
        return secure(await serveMedia(env, path.slice(7)));
      } catch {
        return secure(new Response("Not found", { status: 404 }));
      }
    }

    if (isAdminPath(path)) {
      const admin = await getAdmin(request, env);
      if (!admin) return secure(adminDenied(authConfigured(env)), { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
      const res = await env.ASSETS.fetch(new Request(new URL("/admin", url), request));
      return secure(res, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
    }

    // The page body depends on settings, so skip the asset ETag revalidation:
    // a 304 would let browsers keep a page rendered with old settings.
    const req = new Request(request);
    req.headers.delete("If-None-Match");
    req.headers.delete("If-Modified-Since");
    const res = await env.ASSETS.fetch(req);
    if (!(res.headers.get("Content-Type") || "").includes("text/html") || res.status !== 200) return res;
    let settings = null;
    try {
      if (env.DB) settings = await getSettings(env);
    } catch (err) {
      console.error("Settings unavailable", String(err && err.message || err));
    }
    if (!settings) return res;
    const out = secure(applySettings(res, settings, path), { "Cache-Control": "public, max-age=0, must-revalidate" });
    out.headers.delete("ETag");
    return out;
  }
};

// Writes editable settings into the static HTML. The HTML already contains the
// defaults, so pages still work if the database is unreachable.
function applySettings(res, s, path) {
  const text = (key) => ({ element(el) { if (s[key]) el.setInnerContent(s[key]); } });
  const rw = new HTMLRewriter()
    .on("[data-setting]", {
      element(el) {
        const v = s[el.getAttribute("data-setting")];
        if (v) el.setInnerContent(v);
      }
    })
    .on("a[data-discord]", { element(el) { if (isHttpUrl(s.discord_url)) el.setAttribute("href", s.discord_url); } })
    .on("[data-copy-ip][aria-label]", { element(el) { if (s.server_address) el.setAttribute("aria-label", "Copy server address " + s.server_address); } })
    .on("body", {
      element(el) {
        if (s.server_address) el.setAttribute("data-server-address", s.server_address);
        if (isHttpUrl(s.tebex_url)) el.setAttribute("data-tebex-url", s.tebex_url);
      }
    })
    .on("a[data-social]", {
      element(el) {
        const v = s["social_" + el.getAttribute("data-social")];
        if (isHttpUrl(v)) { el.setAttribute("href", v); el.removeAttribute("hidden"); }
      }
    });

  // Vote page: show each vote site that has a link, and hide "coming soon" once any exist.
  let anyVote = false;
  let voteCount = 0;
  for (let n = 1; n <= VOTE_SLOTS; n++) {
    let url = String(s[`vote_${n}_url`] || "").trim();
    if (url && !/^[a-z]+:/i.test(url)) url = "https://" + url;
    if (!isHttpUrl(url)) continue;
    anyVote = true;
    voteCount++;
    const name = voteName(url, s[`vote_${n}_name`]);
    rw.on(`a[data-vote="${n}"]`, { element(el) { el.setAttribute("href", url); el.removeAttribute("hidden"); } });
    rw.on(`[data-vote-name="${n}"]`, { element(el) { el.setInnerContent(name); } });
    rw.on(`[data-vote-host="${n}"]`, { element(el) { el.setInnerContent(voteHost(url)); } });
  }
  if (anyVote) rw.on("[data-vote-total]", { element(el) { el.setInnerContent(String(voteCount)); } });
  if (anyVote) rw.on("[data-vote-empty]", { element(el) { el.setAttribute("hidden", ""); } });

  if (s.banner_enabled === "1" && s.banner_text) {
    rw.on("[data-banner]", { element(el) { el.removeAttribute("hidden"); } })
      .on("[data-banner-text]", text("banner_text"))
      .on("a[data-banner-link]", {
        element(el) {
          if (isLink(s.banner_link)) { el.setAttribute("href", s.banner_link); el.removeAttribute("hidden"); }
        }
      });
  }

  if (path === "/") {
    if (s.seo_home_title) rw.on("title", text("seo_home_title")).on('meta[property="og:title"], meta[name="twitter:title"]', {
      element(el) { el.setAttribute("content", s.seo_home_title); }
    });
    if (s.seo_home_description) rw.on('meta[name="description"]', { element(el) { el.setAttribute("content", s.seo_home_description); } });
  }
  if (s.seo_og_description) {
    rw.on('meta[property="og:description"], meta[name="twitter:description"]', { element(el) { el.setAttribute("content", s.seo_og_description); } });
  }
  return rw.transform(res);
}

function adminDenied(configured) {
  const reason = configured
    ? "Sign in through Cloudflare Access with an approved admin account to continue."
    : "Admin sign-in has not been configured yet. Follow the setup steps in the README.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Admin | OVERTHRONE SMP</title><link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="stylesheet" href="/styles.css"></head><body><main id="main" class="container center-page"><div>
<h1>Admin</h1><p class="lead">Access denied.</p><p class="muted">${reason}</p><a class="btn btn-primary" href="/">Back to Home</a>
</div></main></body></html>`;
  return new Response(html, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
