import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function readEnvFile(path) {
  if (!existsSync(path)) return {};

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const index = trimmed.indexOf("=");
      if (index === -1) return env;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (key) env[key] = value;
      return env;
    }, {});
}

export function writeEnvFile(path, values, comments = {}) {
  const lines = [];

  for (const [key, value] of Object.entries(values)) {
    if (comments[key]) {
      if (lines.length > 0) lines.push("");
      lines.push(comments[key]);
    }
    lines.push(`${key}=${value ?? ""}`);
  }

  writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

export function updateEnvValue(path, key, value) {
  const content = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = content ? content.split(/\r?\n/) : [];
  const nextLine = `${key}=${value}`;
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true;
      return nextLine;
    }
    return line;
  });

  if (!replaced) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") nextLines.push("");
    nextLines.push(nextLine);
  }

  writeFileSync(path, `${nextLines.filter((line, index, array) => index < array.length - 1 || line !== "").join("\n")}\n`, "utf8");
}

export function mergeFileEnv(path) {
  return { ...readEnvFile(path), ...process.env };
}