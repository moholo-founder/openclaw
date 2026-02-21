/**
 * Single source of truth for all default Google/Gemini model identifiers
 * used across the OpenClaw codebase.
 *
 * Other files should import from here instead of hardcoding model strings.
 */

// ── Chat / general-purpose models ────────────────────────────────────
export const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";
export const DEFAULT_GOOGLE_PRO_MODEL = "gemini-2.5-pro";

// Fully-qualified provider/model references
export const DEFAULT_GOOGLE_MODEL_REF = `google/${DEFAULT_GOOGLE_MODEL}` as const;
export const DEFAULT_GOOGLE_PRO_MODEL_REF = `google/${DEFAULT_GOOGLE_PRO_MODEL}` as const;

// ── Embedding models ─────────────────────────────────────────────────
export const DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

// ── Model prefix arrays (for live-model filtering) ───────────────────
export const GOOGLE_MODEL_PREFIXES = ["gemini-2.5"];
