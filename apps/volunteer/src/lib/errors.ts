export class AppError extends Error {
  readonly userMessage: string
  constructor(userMessage: string, cause?: unknown) { super(userMessage); this.name = 'AppError'; this.userMessage = userMessage; this.cause = cause }
}
export function toUserMessage(error: unknown, fallback: string) { return error instanceof AppError ? error.userMessage : fallback }
