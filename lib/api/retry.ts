const RETRYABLE_READ_STATUSES = new Set([502, 503, 504]);

export function shouldRetryReadRequest(method: string, status: number, attempt: number) {
  return attempt === 0
    && (method === "GET" || method === "HEAD")
    && RETRYABLE_READ_STATUSES.has(status);
}
