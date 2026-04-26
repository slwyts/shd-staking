/**
 * @file config/appMode.ts
 * @description Public runtime mode used to select DApp network configuration.
 */

export type AppMode = "development" | "production";

function readAppMode(value: string | undefined): AppMode {
  if (value === "development" || value === "production") return value;
  return process.env.NODE_ENV === "development" ? "development" : "production";
}

export const appMode = readAppMode(process.env.NEXT_PUBLIC_APP_MODE);
export const isDevelopmentMode = appMode === "development";
