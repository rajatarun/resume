import { ApiErrorPayload, TaskDefinition } from "@/types/routineweave";

export class RoutineWeaveApiError extends Error {
  status: number;
  details?: ApiErrorPayload["details"];

  constructor(message: string, status: number, details?: ApiErrorPayload["details"]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_ROUTINEWEAVE_API_URL;
  if (!url) throw new RoutineWeaveApiError("NEXT_PUBLIC_ROUTINEWEAVE_API_URL is not configured.", 500);
  return url.replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: extraHeaders, ...restInit } = init ?? {};
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...restInit,
    headers: { "Content-Type": "application/json", ...(extraHeaders as Record<string, string> | undefined) },
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }

  if (!response.ok) {
    const p = payload as Partial<ApiErrorPayload>;
    const message = p.error ?? `Request failed with status ${response.status}`;
    throw new RoutineWeaveApiError(message, response.status, p.details);
  }

  return payload as T;
}

export async function listTasks(): Promise<TaskDefinition[]> {
  const data = await request<{ tasks: TaskDefinition[] }>("/tasks");
  return data.tasks;
}

export async function getTask(name: string): Promise<TaskDefinition> {
  const data = await request<{ task: TaskDefinition }>(`/tasks/${encodeURIComponent(name)}`);
  return data.task;
}

export async function createTask(data: TaskDefinition): Promise<TaskDefinition> {
  const result = await request<{ task: TaskDefinition }>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.task;
}

export async function updateTask(name: string, data: Partial<TaskDefinition>): Promise<TaskDefinition> {
  const result = await request<{ task: TaskDefinition }>(`/tasks/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return result.task;
}

export async function deleteTask(name: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/tasks/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
