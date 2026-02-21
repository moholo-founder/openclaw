import type { OpenClawConfig } from "../config/config.js";
import { DEFAULT_GOOGLE_MODEL_REF } from "../config/model-defaults.js";
import { applyAgentDefaultPrimaryModel } from "./model-default.js";

export const GOOGLE_GEMINI_DEFAULT_MODEL = DEFAULT_GOOGLE_MODEL_REF;

export function applyGoogleGeminiModelDefault(cfg: OpenClawConfig): {
  next: OpenClawConfig;
  changed: boolean;
} {
  return applyAgentDefaultPrimaryModel({ cfg, model: GOOGLE_GEMINI_DEFAULT_MODEL });
}
