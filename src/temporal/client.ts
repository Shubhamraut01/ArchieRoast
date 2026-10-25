import { Client, Connection } from "@temporalio/client";

import { temporalConfig } from "./config";

// Cached on globalThis so the connection survives Next.js hot reloads.
const g = globalThis as unknown as { __temporalClient?: Promise<Client> };

export function getTemporalClient(): Promise<Client> {
  if (!g.__temporalClient) {
    const cfg = temporalConfig();
    const pending = Connection.connect({
      address: cfg.address,
      ...(cfg.apiKey ? { tls: true, apiKey: cfg.apiKey } : {}),
    }).then(
      (connection) => new Client({ connection, namespace: cfg.namespace }),
    );
    // Do not cache a failed connection attempt.
    pending.catch(() => {
      g.__temporalClient = undefined;
    });
    g.__temporalClient = pending;
  }
  return g.__temporalClient;
}
