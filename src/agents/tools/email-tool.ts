import { Type } from "@sinclair/typebox";
import { Resend, type CreateEmailOptions } from "resend";
import type { OpenClawConfig } from "../../config/config.js";
import { loadConfig } from "../../config/config.js";
import { normalizeSecretInput } from "../../utils/normalize-secret-input.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam, ToolInputError } from "./common.js";

const EmailToolSchema = Type.Object({
  to: Type.Optional(
    Type.String({
      description:
        "Recipient email address(es), comma-separated for multiple. If omitted, uses tools.email.defaultTo from config.",
    }),
  ),
  subject: Type.String({ description: "Email subject line." }),
  html: Type.Optional(Type.String({ description: "HTML body (provide html and/or text)." })),
  text: Type.Optional(Type.String({ description: "Plain-text body (provide html and/or text)." })),
  from: Type.Optional(
    Type.String({
      description:
        "Override From address (must be a sender you verified in Resend). Defaults to tools.email.from or RESEND_FROM.",
    }),
  ),
  replyTo: Type.Optional(Type.String({ description: "Optional Reply-To address." })),
});

function resolveApiKey(cfg: OpenClawConfig | undefined): string | undefined {
  const raw = cfg?.tools?.email?.apiKey?.trim() || process.env.RESEND_API_KEY?.trim();
  return raw ? normalizeSecretInput(raw) : undefined;
}

function resolveFrom(cfg: OpenClawConfig | undefined, override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) {
    return trimmed;
  }
  const fromCfg = cfg?.tools?.email?.from?.trim();
  if (fromCfg) {
    return fromCfg;
  }
  const fromEnv = process.env.RESEND_FROM?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return "onboarding@resend.dev";
}

export function createEmailTool(opts?: { config?: OpenClawConfig }): AnyAgentTool {
  return {
    label: "Email",
    name: "email",
    ownerOnly: true,
    description:
      "Send one email via Resend (transactional). Requires RESEND_API_KEY or tools.email.apiKey. Restricted to verified owner senders. Provide subject plus html and/or text. Use a verified From domain in production (defaults to onboarding@resend.dev only for testing).",
    parameters: EmailToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const cfg = opts?.config ?? loadConfig();
      if (cfg.tools?.email?.enabled === false) {
        return jsonResult({
          ok: false,
          error: "Email tool disabled in config (tools.email.enabled=false).",
        });
      }
      const apiKey = resolveApiKey(cfg);
      if (!apiKey) {
        return jsonResult({
          ok: false,
          error: "Missing Resend API key. Set RESEND_API_KEY or tools.email.apiKey.",
        });
      }

      const defaultTo = cfg.tools?.email?.defaultTo?.trim();
      const toRaw = readStringParam(params, "to");
      const to = (toRaw ?? defaultTo)?.trim();
      if (!to) {
        throw new ToolInputError("Recipient `to` is required unless tools.email.defaultTo is set.");
      }

      const subject = readStringParam(params, "subject", { required: true });
      const html = readStringParam(params, "html", { allowEmpty: true });
      const text = readStringParam(params, "text", { allowEmpty: true });
      if (!html && !text) {
        throw new ToolInputError("Provide at least one of `html` or `text` for the message body.");
      }

      const from = resolveFrom(cfg, readStringParam(params, "from"));
      const replyTo = readStringParam(params, "replyTo");

      const resend = new Resend(apiKey);
      const recipients = to
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        from,
        to: recipients.length === 1 ? recipients[0] : recipients,
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        ...(replyTo ? { replyTo } : {}),
      } as CreateEmailOptions;

      const { data, error } = await resend.emails.send(payload);
      if (error) {
        return jsonResult({
          ok: false,
          error:
            typeof error === "object" && error && "message" in error
              ? String(error.message)
              : error,
        });
      }
      return jsonResult({ ok: true, id: data?.id, to, subject });
    },
  };
}
