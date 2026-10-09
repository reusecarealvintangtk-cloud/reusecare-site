import crypto from "node:crypto";
import { Readable } from "node:stream";

const ALLOWED_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const MIME_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function encodePath(value) {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getExtension(key) {
  const match = key.toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function getObjectKey(request) {
  const raw = Array.isArray(request.query.path)
    ? request.query.path.join("/")
    : request.query.path || "";

  let key;
  try {
    key = decodeURIComponent(raw).replace(/^\/+/, "");
  } catch {
    return null;
  }

  if (
    !key ||
    key.length > 1024 ||
    key.includes("\\") ||
    key.split("/").some((segment) => segment === ".." || segment === ".") ||
    !ALLOWED_EXTENSIONS.has(getExtension(key))
  ) {
    return null;
  }

  return key;
}

function signedR2Request(method, key) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || "reusecare-media";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 proxy credentials are not configured");
  }

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodePath(key)}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256("");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${host}${canonicalUri}`,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).send("Method not allowed");
  }

  const key = getObjectKey(request);
  if (!key) {
    return response.status(404).send("Image not found");
  }

  try {
    const signed = signedR2Request(request.method, key);
    const upstream = await fetch(signed.url, {
      method: request.method,
      headers: signed.headers,
      redirect: "error",
    });

    if (!upstream.ok) {
      return response
        .status(upstream.status === 404 ? 404 : 502)
        .send(upstream.status === 404 ? "Image not found" : "Image unavailable");
    }

    const extension = getExtension(key);
    const contentType = upstream.headers.get("content-type") || MIME_TYPES[extension];
    if (contentType) response.setHeader("Content-Type", contentType);

    for (const header of ["content-length", "etag", "last-modified"]) {
      const value = upstream.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    response.setHeader("Vercel-CDN-Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.method === "HEAD" || !upstream.body) {
      return response.status(200).end();
    }

    response.status(200);
    Readable.fromWeb(upstream.body).pipe(response);
  } catch (error) {
    console.error("R2 media proxy error", error instanceof Error ? error.message : error);
    return response.status(503).send("Image service unavailable");
  }
}
