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
  timeout_ms: number;
  max_retries?: number;
  variables?: Record<string, string>;
  input?: Record<string, string | string[]>;
  output: TaskOutput;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  details?: ApiFieldError[];
}
