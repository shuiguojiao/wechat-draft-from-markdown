import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface WechatExtendConfig {}

export interface ResolvedAccount {
  name?: string;
  alias?: string;
  default_publish_method?: string;
  default_author?: string;
  need_open_comment: number;
  only_fans_can_comment: number;
  app_id?: string;
  app_secret?: string;
  chrome_profile_path?: string;
}

export interface LoadedCredentials {
  appId: string;
  appSecret: string;
  source: string;
  skippedSources: string[];
}

function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

function pickCredentials(
  sourceName: string,
  values: Record<string, string | undefined>,
): LoadedCredentials | undefined {
  const appId = values.WECHAT_APP_ID?.trim();
  const appSecret = values.WECHAT_APP_SECRET?.trim();
  if (!appId || !appSecret) return undefined;
  return {
    appId,
    appSecret,
    source: sourceName,
    skippedSources: [],
  };
}

export function loadWechatExtendConfig(): WechatExtendConfig {
  return {};
}

export function resolveAccount(): ResolvedAccount {
  return {
    default_publish_method: "api",
    need_open_comment: 1,
    only_fans_can_comment: 0,
  };
}

export function loadCredentials(): LoadedCredentials {
  const cwdEnv = loadEnvFile(path.join(process.cwd(), ".env"));
  const baoyuEnv = loadEnvFile(path.join(process.cwd(), ".baoyu-skills", ".env"));
  const homeEnv = loadEnvFile(path.join(os.homedir(), ".baoyu-skills", ".env"));

  return (
    pickCredentials("process.env", process.env) ||
    pickCredentials("<cwd>/.env", cwdEnv) ||
    pickCredentials("<cwd>/.baoyu-skills/.env", baoyuEnv) ||
    pickCredentials("~/.baoyu-skills/.env", homeEnv) ||
    (() => {
      throw new Error(
        "Missing WECHAT_APP_ID or WECHAT_APP_SECRET. Set them in the environment or current .env file."
      );
    })()
  );
}
