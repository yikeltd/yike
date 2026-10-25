import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export type SendchampHttpResponse = {
  status: number;
  data: Record<string, unknown>;
  headers: Record<string, string>;
};

/**
 * POST JSON to Sendchamp — native https avoids Node fetch/undici failures on
 * authenticated POSTs to api.sendchamp.com (observed on Node 25).
 */
export async function sendchampJsonPost(
  url: string,
  body: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number
): Promise<SendchampHttpResponse> {
  const payload = JSON.stringify(body);
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const requestFn = isHttps ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestFn(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(text) as Record<string, unknown>;
          } catch {
            data = { message: text.slice(0, 200) };
          }
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === "string") headers[key] = value;
            else if (Array.isArray(value)) headers[key] = value.join(", ");
          }
          resolve({ status: res.statusCode ?? 0, data, headers });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(Object.assign(new Error("Sendchamp request timed out"), { name: "TimeoutError" }));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}
