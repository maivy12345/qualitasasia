import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const issues = [];
const htmlFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "artifacts"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
  }
}

walk(root);

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const isRedirect = /http-equiv="refresh"/i.test(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (!isRedirect && h1Count !== 1) issues.push(`${relative(root, file)}: expected one H1, found ${h1Count}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map(match => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter(value => value === id).length > 1) issues.push(`${relative(root, file)}: duplicate id ${id}`);
  }

  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/gi)) {
    const url = match[1];
    if (!url || url === "/") continue;
    let target = join(root, url.replace(/^\/+/, ""));
    if (url.endsWith("/")) target = join(target, "index.html");
    if (!existsSync(target)) issues.push(`${relative(root, file)}: broken local link ${url}`);
  }
}

const serviceDirs = [
  "quality-management-frameworks-itps",
  "technical-compliance-review-desktop-audit",
  "non-conformance-corrective-action",
  "commissioning-handover-dossier-governance",
  "esg-monitoring-reporting-frameworks"
];

for (const directory of serviceDirs) {
  const html = readFileSync(join(root, "services", directory, "index.html"), "utf8");
  if (!html.includes("<h2>Key deliverables</h2>")) issues.push(`${directory}: missing Key deliverables`);
  if (!html.includes("<h2>Who it’s for</h2>")) issues.push(`${directory}: missing Who it’s for`);
  const block = html.match(/<div class="related-service-grid">([\s\S]*?)<\/div>/)?.[1] || "";
  const links = [...block.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  if (links.length < 2 || links.length > 3) issues.push(`${directory}: expected 2–3 related services, found ${links.length}`);
  if (links.includes(`/services/${directory}/`)) issues.push(`${directory}: related services link points to itself`);
}

const articleDirs = [
  "quality-is-planned-not-inspected-the-case-for-itps",
  "desktop-compliance-review-independence-without-the-site-visit",
  "non-conformances-are-a-sign-of-a-healthy-system-not-a-failure"
];

for (const directory of articleDirs) {
  const html = readFileSync(join(root, "insights", directory, "index.html"), "utf8");
  if (!html.includes("article:published_time")) issues.push(`${directory}: missing published metadata`);
  if ((html.match(/data-share=/g) || []).length !== 2) issues.push(`${directory}: expected two share actions`);
  if ((html.match(/class="panel" href="\/insights\//g) || []).length !== 2) issues.push(`${directory}: expected two related articles`);
}

const faq = readFileSync(join(root, "faq", "index.html"), "utf8");
if ((faq.match(/<details>/g) || []).length !== 20) issues.push("FAQ: expected 20 questions");

const insights = readFileSync(join(root, "insights", "index.html"), "utf8");
if ((insights.match(/data-insight-topic=/g) || []).length !== 3) issues.push("Insights: expected three published cards");
if ((insights.match(/data-filter=/g) || []).length !== 4) issues.push("Insights: expected four filter controls");

if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${htmlFiles.length} HTML files, 5 service pages, 3 insight articles and 20 FAQs.`);
}
