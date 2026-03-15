import type { GatewayBrowserClient } from "../gateway.ts";
import type { AgentsListResult } from "../types.ts";

export type AgentsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  agentsLoading: boolean;
  agentsError: string | null;
  agentsList: AgentsListResult | null;
  agentsSelectedId: string | null;
};

export async function loadAgents(state: AgentsState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.agentsLoading) {
    return;
  }
  state.agentsLoading = true;
  state.agentsError = null;
  try {
    const res = await state.client.request<AgentsListResult>("agents.list", {});
    if (res) {
      state.agentsList = res;
      const selected = state.agentsSelectedId;
      const known = res.agents.some((entry) => entry.id === selected);
      if (!selected || !known) {
        state.agentsSelectedId = res.defaultId ?? res.agents[0]?.id ?? null;
      }
    }
  } catch (err) {
    state.agentsError = String(err);
  } finally {
    state.agentsLoading = false;
  }
}

export async function createAgent(
  state: AgentsState,
  payload: { name: string; workspace: string; emoji?: string; avatar?: string },
) {
  if (!state.client || !state.connected) {
    return null;
  }
  await state.client.request("agents.create", payload);
  await loadAgents(state);
  return true;
}

export async function updateAgent(
  state: AgentsState,
  payload: { agentId: string; name?: string; workspace?: string; model?: string; avatar?: string },
) {
  if (!state.client || !state.connected) {
    return null;
  }
  await state.client.request("agents.update", payload);
  await loadAgents(state);
  return true;
}
