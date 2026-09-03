import { readFileSync } from "fs";
import pg from "pg";

const envRaw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const line = envRaw.split(/\r?\n/).find((l) => l.startsWith(k + "="));
  return line ? line.slice(k.length + 1).trim() : "";
};
const password = get("SUPABASE_DB_PASSWORD");
const ref = "jyjqscwixcejfwiueiqg";
const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

const hosts = ["aws-0-us-west-2.pooler.supabase.com"];

let client;
let used = "";
for (const host of hosts) {
  for (const port of [6543, 5432]) {
    const candidate = new pg.Client({
      host,
      port,
      user: `postgres.${ref}`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
    });
    try {
      await candidate.connect();
      client = candidate;
      used = `${host}:${port}`;
      break;
    } catch (err) {
      const msg = String(err.message);
      if (!msg.includes("ENOTFOUND") && !msg.includes("Tenant")) {
        console.log(`FAIL ${host}:${port} ${msg}`);
      } else {
        console.log(`MISS ${host}:${port}`);
      }
      try {
        await candidate.end();
      } catch {
        /* ignore */
      }
    }
  }
  if (client) break;
}

if (!client) {
  console.error("NO_CONNECTION");
  process.exit(2);
}

console.log(`CONNECTED ${used}`);
await client.query(sql);
const tables = await client.query(
  `select table_name from information_schema.tables where table_schema='public' order by 1`,
);
console.log("TABLES " + tables.rows.map((r) => r.table_name).join(","));
const stores = await client.query(`select username from public.stores`);
console.log("STORES " + stores.rows.map((r) => r.username).join(","));
await client.end();
console.log("SCHEMA_OK");
