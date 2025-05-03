import { SERVICE_ACCOUNT_JSON, DEBUG } from "./config.ts";

function decodePEM(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .trim();

  const binaryStr = atob(lines);
  const binaryLen = binaryStr.length;
  const bytes = new Uint8Array(binaryLen);

  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return bytes.buffer;
}

export async function getAccessTokenFromServiceAccount(): Promise<string> {
  try {
    if (DEBUG) console.log("🔍 Parsing GOOGLE_SERVICE_ACCOUNT_JSON...");
    const account = JSON.parse(SERVICE_ACCOUNT_JSON);
    if (DEBUG) console.log("✅ Parsed service account:", account.client_email);

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const payload = {
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };

    function base64url(source: Uint8Array) {
      return btoa(String.fromCharCode(...source))
        .replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    }

    const encoder = new TextEncoder();
    const encHeader = base64url(encoder.encode(JSON.stringify(header)));
    const encPayload = base64url(encoder.encode(JSON.stringify(payload)));
    const toSign = `${encHeader}.${encPayload}`;

    if (DEBUG) console.log("🔧 Creating JWT for Drive API access...");

    const keyData = decodePEM(account.private_key);
    const key = await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(toSign));
    const jwt = `${toSign}.${base64url(new Uint8Array(signature))}`;

    if (DEBUG) console.log("🌐 Fetching access token from Google...");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to fetch access token from Google:");
      console.error("Status:", res.status);
      console.error("Response:", JSON.stringify(json, null, 2));
      throw new Error("Google Auth Error");
    }

    if (DEBUG) console.log("✅ Successfully received access token.");
    return json.access_token;

  } catch (err) {
    console.error("🔥 Critical error in getAccessTokenFromServiceAccount:");
    console.error(err?.message || err);
    if (err?.stack) console.error(err.stack);
    throw err;
  }
}
