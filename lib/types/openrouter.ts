/**
 * OpenRouter API TypeScript type definitions
 *
 * Based on OpenRouter API specification:
 * https://openrouter.ai/docs/api-reference
 */

/**
 * Configuration options for OpenRouterClient constructor
 */
export interface OpenRouterClientConfig {
  /** OpenRouter API key (overrides OPENROUTER_API_KEY env var) */
  apiKey?: string;

  /** Model identifier (default: openai/gpt-4o-mini) */
  model?: string;

  /** Site URL for OpenRouter attribution/leaderboard */
  siteUrl?: string;

  /** Site name for OpenRouter attribution/leaderboard */
  siteName?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number;
}

/**
 * Message in OpenRouter chat format
 */
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Response format for structured JSON outputs
 * Follows OpenRouter specification for json_schema mode
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

/**
 * JSON Schema definition for response structure
 */
export interface JsonSchema {
  type: string;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  additionalProperties: boolean;
  description?: string;
}

/**
 * Property definition within JSON Schema
 */
export interface JsonSchemaProperty {
  type: string;
  description?: string;
  maxLength?: number;
  minLength?: number;
  items?: JsonSchemaProperty;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Request body for OpenRouter chat completions endpoint
 */
export interface OpenRouterRequestBody {
  /** Model identifier (e.g., 'openai/gpt-4o-mini') */
  model: string;

  /** Array of messages in conversation history */
  messages: OpenRouterMessage[];

  /** Optional JSON Schema for structured outputs */
  response_format?: ResponseFormat;

  /** Sampling temperature (0.0-2.0, default: 0.7) */
  temperature?: number;

  /** Maximum tokens to generate (default: 2000) */
  max_tokens?: number;

  /** Nucleus sampling threshold (0.0-1.0) */
  top_p?: number;

  /** Frequency penalty (-2.0-2.0) */
  frequency_penalty?: number;

  /** Presence penalty (-2.0-2.0) */
  presence_penalty?: number;
}

/**
 * Single choice in OpenRouter response
 */
export interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

/**
 * Token usage statistics from OpenRouter
 */
export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Complete response from OpenRouter API
 */
export interface OpenRouterResponse {
  /** Unique response ID */
  id: string;

  /** Model that generated the response */
  model: string;

  /** Unix timestamp of creation */
  created: number;

  /** Array of completion choices (usually 1 item) */
  choices: OpenRouterChoice[];

  /** Token usage statistics */
  usage?: OpenRouterUsage;
}
