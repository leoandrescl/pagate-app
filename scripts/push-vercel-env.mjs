import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${k}=`));
  return line ? line.slice(k.length + 1).trim().replace(/^"|"$/g, "") : "";
};

const vars = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: get("NEXT_PUBLIC_SUPABASE_URL"),
    targets: "production,preview,development",
    sensitive: false,
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    value: get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    targets: "production,preview,development",
    sensitive: false,
  },
  {
    name: "SUPABASE_SECRET_KEY",
    value: get("SUPABASE_SECRET_KEY"),
    targets: "production,preview,development",
    sensitive: true,
  },
  {
    name: "NEXT_PUBLIC_STUDIO_URL",
    value: "https://studio.pagate.cl",
    targets: "production,preview",
    sensitive: false,
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    value: "https://pagate.cl",
    targets: "production,preview",
    sensitive: false,
  },
  {
    name: "GOOGLE_REDIRECT_URI",
    value: "https://studio.pagate.cl/api/google/callback",
    targets: "production,preview",
    sensitive: false,
  },
];

for (const item of vars) {
  if (!item.value) {
    console.log(`SKIP ${item.name} empty`);
    continue;
  }
  const sensitive = item.sensitive ? "--sensitive" : "--no-sensitive";
  const cmd = `npx vercel env add ${item.name} ${item.targets} --yes --force ${sensitive} --value ${JSON.stringify(item.value)}`;
  try {
    execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] });
    console.log(`OK ${item.name} -> ${item.targets}`);
  } catch (err) {
    const stderr = err.stderr?.toString() || err.message;
    console.log(
      `ERR ${item.name} ${stderr.split("\n").filter(Boolean).slice(-2).join(" | ")}`,
    );
  }
}
