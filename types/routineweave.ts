export interface SNSOutput {
  type: "sns";
  sns_topic_arn?: string;
}

export interface SlackOutput {
  type: "slack";
  webhook_url: string;
  channel?: string;
}

export interface WebhookOutput {
  type: "webhook";
  url: string;
  headers?: Record<string, string>;
}

export type TaskOutput = SNSOutput | SlackOutput | WebhookOutput;

export interface TaskDefinition {
  task_name: string;
  schedule: string;
  prompt: string;
  model: string;
  grounding: boolean;
  enabled: boolean;
  save_result: boolean;
  timeout_ms: number;
  max_retries?: number;
  variables?: Record<string, string>;
  input?: Record<string, string | string[]>;
  output: TaskOutput;
}

export interface ResultMeta {
  key: string;
  task_name: string;
  date: string;
  timestamp: string;
  size_bytes: number;
}

export interface TaskExecutionResult {
  task_name: string;
  timestamp: string;
  success: boolean;
  result?: string;
  structured_result?: {
    summary: string;
    data: unknown;
    raw_text: string;
    [key: string]: unknown;
  };
  error?: string;
  duration_ms: number;
}

export interface ResultsListResponse {
  task_name: string;
  save_result: boolean;
  results: ResultMeta[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  details?: ApiFieldError[];
}
