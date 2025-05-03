import { SERVICE_ACCOUNT_JSON, DEBUG } from "./config.ts";

export async function getAccessTokenFromServiceAccount(): Promise<string> {
  const account = JSON.parse(SERVICE_ACCOUNT_JSON);
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

  const keyData = account.private_key;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    new TextEncoder().encode(keyData),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(toSign));
  const jwt = `${toSign}.${base64url(new Uint8Array(signature))}`;

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
    if (DEBUG) console.error("Failed to get access token:", json);
    throw new Error("Google Auth Error");
  }

  return json.access_token;
}
