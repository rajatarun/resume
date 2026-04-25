const BASE_URL = process.env.NEXT_PUBLIC_DEVICEWEAVE_API_URL;
if (!BASE_URL) throw new Error("NEXT_PUBLIC_DEVICEWEAVE_API_URL is not set");

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(0, "Unable to reach DeviceWeave API. Check your connection.");
  }
  if (!res.ok) {
    let message =
      res.status >= 500
        ? "Something went wrong on the server. Try again."
        : `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.error === "string") message = body.error;
      else if (typeof body.message === "string") message = body.message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

function jsonInit(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceType =
  | "SmartBulb"
  | "SmartPlug"
  | "SmartAC"
  | "SmartFan"
  | "SmartHeater"
  | "SmartSwitch";

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  capabilities: string[];
}

export interface CreateDeviceBody {
  device_id: string;
  name: string;
  device_type?: DeviceType;
  capabilities?: string[];
  ip?: string;
  model?: string;
}

export interface UpdateDeviceBody {
  name?: string;
  device_type?: DeviceType;
  capabilities?: string[];
  ip?: string;
  model?: string;
}

export interface UpdateDeviceResponse {
  device_id: string;
  updated: string[];
  updated_at: string;
}

export interface DeleteDeviceResponse {
  device_id: string;
  status: "inactive";
  updated_at: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  action_count: number;
  sample_phrases: string[];
}

export interface Learning {
  device_id: string;
  phrase: string;
  source: "learned" | "manual";
  confidence: number;
  use_count: number;
  created_at: string;
}

export interface DeleteLearningBody {
  device_id: string;
  phrase: string;
}

export interface AddLearningBody {
  device_id: string;
  phrase: string;
}

export interface AddLearningResponse {
  status: "learned";
  device_id: string;
  phrase: string;
  persisted: boolean;
}

export type PolicyDeviceType = "fan" | "light" | "ac" | "plug" | "heater";
export type ActionType = "block" | "allow" | "modify";

export interface Condition {
  field: "temperature" | "humidity" | "time_hour" | "is_home";
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
  value: number | boolean;
}

export interface Policy {
  rule_id: string;
  version: number;
  scope: { device_type: PolicyDeviceType };
  conditions: Condition[];
  action: { type: ActionType; reason: string; params: Record<string, unknown> };
  confidence: number;
  source_text: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Presence {
  is_home: boolean;
  updated_at: string | null;
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export const getDevices = () =>
  request<{ devices: Device[]; count: number }>("/devices");

export const createDevice = (body: CreateDeviceBody) =>
  request<Device>("/devices", { method: "POST", ...jsonInit(body) });

export const updateDevice = (id: string, body: UpdateDeviceBody) =>
  request<UpdateDeviceResponse>(`/devices/${encodeURIComponent(id)}`, {
    method: "PUT",
    ...jsonInit(body),
  });

export const deleteDevice = (id: string) =>
  request<DeleteDeviceResponse>(`/devices/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

// ─── Scenes ───────────────────────────────────────────────────────────────────

export const getScenes = () =>
  request<{ scenes: Scene[]; count: number }>("/scenes");

// ─── Learnings ────────────────────────────────────────────────────────────────

export const getLearnings = () =>
  request<{ learnings: Learning[]; count: number }>("/learnings");

export const deleteLearning = (body: DeleteLearningBody) =>
  request<{ device_id: string; phrase: string; deleted: true }>("/learnings", {
    method: "DELETE",
    ...jsonInit(body),
  });

export const addLearning = (body: AddLearningBody) =>
  request<AddLearningResponse>("/learn", { method: "POST", ...jsonInit(body) });

// ─── Policies ─────────────────────────────────────────────────────────────────

export const getPolicies = (params?: {
  device_type?: PolicyDeviceType;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.device_type) qs.set("device_type", params.device_type);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return request<{ policies: Policy[]; count: number }>(
    `/policies${q ? `?${q}` : ""}`,
  );
};

export const authorPolicy = (body: { rule: string }) =>
  request<Policy>("/policies/author", { method: "POST", ...jsonInit(body) });

export const deletePolicy = (id: string) =>
  request<{ rule_id: string; status: "inactive" }>(
    `/policies/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );

// ─── Presence ─────────────────────────────────────────────────────────────────

export const getPresence = () => request<Presence>("/presence");

export const setPresence = (body: { is_home: boolean }) =>
  request<{ is_home: boolean; updated_at: string }>("/presence", {
    method: "POST",
    ...jsonInit(body),
  });
