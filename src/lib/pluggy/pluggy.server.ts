// Server-only Pluggy API client. Credentials never leave the server.
import type { PluggyAccount, PluggyTransaction } from "./normalize";

const BASE = "https://api.pluggy.ai";

async function call<T>(path: string, init: RequestInit & { apiKey?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.apiKey) headers.set("X-API-KEY", init.apiKey);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    console.error(`[pluggy] ${init.method ?? "GET"} ${path} -> ${res.status}`);
    throw new Error(`Falha ao comunicar com a Pluggy (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export async function pluggyApiKey() {
  const clientId = process.env["PLUGGY_CLIENT_ID"];
  const clientSecret = process.env["PLUGGY_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("Integração com a Pluggy ainda não configurada.");
  const { apiKey } = await call<{ apiKey: string }>("/auth", {
    method: "POST",
    body: JSON.stringify({ clientId, clientSecret }),
  });
  return apiKey;
}

export async function createConnectToken(apiKey: string, clientUserId: string) {
  const { accessToken } = await call<{ accessToken: string }>("/connect_token", {
    method: "POST",
    apiKey,
    body: JSON.stringify({ options: { clientUserId } }),
  });
  return accessToken;
}

export type PluggyItem = { id: string; status?: string; clientUserId?: string | null; connector?: { name?: string } };

export const getItem = (apiKey: string, itemId: string) =>
  call<PluggyItem>(`/items/${encodeURIComponent(itemId)}`, { apiKey });

export async function listAccounts(apiKey: string, itemId: string) {
  const r = await call<{ results: PluggyAccount[] }>(`/accounts?itemId=${encodeURIComponent(itemId)}`, { apiKey });
  return r.results ?? [];
}

export async function listTransactions(apiKey: string, accountId: string) {
  const all: PluggyTransaction[] = [];
  for (let page = 1; page <= 20; page++) {
    const r = await call<{ results: PluggyTransaction[]; totalPages?: number }>(
      `/transactions?accountId=${encodeURIComponent(accountId)}&pageSize=500&page=${page}`,
      { apiKey },
    );
    all.push(...(r.results ?? []));
    if (!r.totalPages || page >= r.totalPages) break;
  }
  return all;
}
