import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const host = "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const enquiryRecipient = process.env.ENQUIRY_TO_EMAIL ?? "contact@qualitasasia.com";
const enquirySender = process.env.ENQUIRY_FROM_EMAIL ?? "Qualitas website <enquiries@qualitasasia.com>";
const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resendApiUrl = process.env.RESEND_API_URL ?? "https://api.resend.com/emails/batch";
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMax = 5;
const submissionAttempts = new Map();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

const cacheableImageExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

async function resolveFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = normalize(decodedPath).replace(/^([/\\])+/, "");
  let filePath = resolve(root, relativePath);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = join(filePath, "index.html");
    }
    return (await stat(filePath)).isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function cleanField(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanLine(value, maxLength) {
  return cleanField(value, maxLength).replace(/[\r\n]+/g, " ");
}

function clientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const trustedForwarded = process.env.TRUST_PROXY === "1"
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim()
    : "";
  return trustedForwarded || request.socket.remoteAddress || "unknown";
}

function isRateLimited(address) {
  const now = Date.now();
  const recent = (submissionAttempts.get(address) ?? []).filter(timestamp => now - timestamp < rateLimitWindowMs);
  if (recent.length >= rateLimitMax) {
    submissionAttempts.set(address, recent);
    return true;
  }
  recent.push(now);
  submissionAttempts.set(address, recent);
  return false;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function sendEnquiry(payload) {
  if (!resendApiKey) throw new Error("EMAIL_NOT_CONFIGURED");

  const company = payload.company || "Not provided";
  const phone = payload.phone || "Not provided";
  const internalText = [
    "New website enquiry",
    "",
    `Name: ${payload.name}`,
    `Company: ${company}`,
    `Email: ${payload.email}`,
    `Phone: ${phone}`,
    "",
    "Project details:",
    payload.message
  ].join("\n");
  const confirmationText = [
    `Hello ${payload.name},`,
    "",
    "Thank you for contacting Qualitas Engineering Asia. We have received your project enquiry and will respond as soon as possible.",
    "",
    "A copy of your enquiry:",
    payload.message,
    "",
    "Qualitas Engineering Asia Limited",
    "contact@qualitasasia.com"
  ].join("\n");

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `website-enquiry/${payload.submissionId}`
    },
    body: JSON.stringify([
      {
        from: enquirySender,
        to: [enquiryRecipient],
        reply_to: payload.email,
        subject: `Website enquiry — ${payload.name}${payload.company ? `, ${payload.company}` : ""}`,
        text: internalText
      },
      {
        from: enquirySender,
        to: [payload.email],
        reply_to: enquiryRecipient,
        subject: "We received your Qualitas enquiry",
        text: confirmationText
      }
    ])
  });

  if (!response.ok) {
    const providerError = await response.text();
    console.error(`Email provider rejected enquiry ${payload.submissionId}: ${response.status} ${providerError.slice(0, 300)}`);
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}

async function handleEnquiry(request, response) {
  try {
    const body = await readJson(request);
    const payload = {
      name: cleanLine(body.name, 120),
      company: cleanLine(body.company, 160),
      email: cleanField(body.email, 254).toLowerCase(),
      phone: cleanLine(body.phone, 60),
      message: cleanField(body.message, 5000),
      website: cleanField(body.website, 200),
      consent: body.consent === true || body.consent === "on",
      formStartedAt: Number(body.formStartedAt),
      submissionId: cleanField(body.submissionId, 128) || randomUUID()
    };

    if (payload.website) {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
    const submissionIdIsValid = /^[A-Za-z0-9_-]{16,128}$/.test(payload.submissionId);
    const elapsed = Date.now() - payload.formStartedAt;
    if (!payload.name || !emailIsValid || !payload.message || !payload.consent || !submissionIdIsValid || !Number.isFinite(payload.formStartedAt) || payload.formStartedAt <= 0 || elapsed < 2000 || elapsed > 86_400_000) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ message: "Please check the required fields and try again." }));
      return;
    }

    if (isRateLimited(clientAddress(request))) {
      response.writeHead(429, { "Content-Type": "application/json; charset=utf-8", "Retry-After": "900" });
      response.end(JSON.stringify({ message: "Too many attempts. Please wait 15 minutes and try again." }));
      return;
    }

    await sendEnquiry(payload);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(JSON.stringify({ ok: true }));
  } catch (error) {
    const unavailable = error.message === "EMAIL_NOT_CONFIGURED";
    const invalidJson = error instanceof SyntaxError || error.message === "PAYLOAD_TOO_LARGE";
    response.writeHead(invalidJson ? 400 : unavailable ? 503 : 502, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(JSON.stringify({
      message: unavailable
        ? "Enquiry delivery is not configured yet."
        : invalidJson
          ? "The enquiry could not be read. Please check the form and try again."
          : "We could not send your enquiry right now."
    }));
  }
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host || "localhost"}`);
    if (request.method === "POST" && requestUrl.pathname === "/api/enquiry") {
      await handleEnquiry(request, response);
      return;
    }

    const filePath = await resolveFile(request.url ?? "/");

    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(join(root, "404.html")).pipe(response);
      return;
    }

    const extension = extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Cache-Control": cacheableImageExtensions.has(extension)
        ? "public, max-age=604800, stale-while-revalidate=86400"
        : "no-cache",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
    console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`Qualitas preview: http://${host}:${port}/`);
});
