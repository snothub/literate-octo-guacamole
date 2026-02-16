type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  component: string;
  action: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
  environment: string;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = /token|secret|password|authorization|credential/i;
const MAX_STRING_LENGTH = 500;

const sessionId = Math.random().toString(36).substring(2, 10);

const environment = import.meta.env.MODE || 'development';

const configuredLevel: LogLevel = (() => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL as string | undefined;
  if (envLevel && envLevel in LOG_LEVEL_PRIORITY) {
    return envLevel as LogLevel;
  }
  return environment === 'production' ? 'info' : 'debug';
})();

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    return value.substring(0, MAX_STRING_LENGTH) + '...[truncated]';
  }
  return value;
}

function sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.test(key)) {
      result[key] = '[REDACTED]';
    } else if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      result[key] = sanitizeMetadata(obj[key] as Record<string, unknown>);
    } else {
      result[key] = sanitizeValue(obj[key]);
    }
  }
  return result;
}

function safeStringify(entry: LogEntry): string {
  const seen = new WeakSet();
  return JSON.stringify(entry, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
}

function log(level: LogLevel, component: string, action: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    action,
    sessionId,
    environment,
  };

  if (metadata) {
    entry.metadata = sanitizeMetadata(metadata);
  }

  const json = safeStringify(entry);

  switch (level) {
    case 'error':
      console.error(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    default:
      console.log(json);
  }
}

export const logger = {
  debug: (component: string, action: string, metadata?: Record<string, unknown>) =>
    log('debug', component, action, metadata),
  info: (component: string, action: string, metadata?: Record<string, unknown>) =>
    log('info', component, action, metadata),
  warn: (component: string, action: string, metadata?: Record<string, unknown>) =>
    log('warn', component, action, metadata),
  error: (component: string, action: string, metadata?: Record<string, unknown>) =>
    log('error', component, action, metadata),
};
