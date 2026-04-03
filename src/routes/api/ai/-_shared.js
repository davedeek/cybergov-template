/**
 * Shared helpers for AI API routes — deduplicates validation and key-checking boilerplate.
 */

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns `{ data }` on success or a 400 Response on failure.
 */
export async function parseBody(request, schema) {
  const rawBody = await request.json()
  const parseResult = schema.safeParse(rawBody)
  if (!parseResult.success) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }
  return { data: parseResult.data }
}

/**
 * Require an environment variable to be set. Returns a 500 Response if missing.
 */
export function requireKey(keyName) {
  if (!process.env[keyName]) {
    return new Response(
      JSON.stringify({ error: `${keyName} is not configured` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
  return null
}

/**
 * Detect the best available AI provider based on configured API keys.
 * Returns { provider, model } for chat routes.
 */
export function resolveProvider() {
  if (process.env.ANTHROPIC_API_KEY) return { provider: 'anthropic', model: 'claude-haiku-4-5' }
  if (process.env.OPENAI_API_KEY) return { provider: 'openai', model: 'gpt-4o' }
  if (process.env.GEMINI_API_KEY) return { provider: 'gemini', model: 'gemini-2.0-flash-exp' }
  return { provider: 'ollama', model: 'mistral:7b' }
}

/**
 * Get the text adapter for the resolved provider.
 */
export async function getTextAdapter(provider, model) {
  if (provider === 'anthropic') {
    const { anthropicText } = await import('@tanstack/ai-anthropic')
    return anthropicText(model)
  }
  if (provider === 'openai') {
    const { openaiText } = await import('@tanstack/ai-openai')
    return openaiText(model)
  }
  if (provider === 'gemini') {
    const { geminiText } = await import('@tanstack/ai-gemini')
    return geminiText(model)
  }
  const { ollamaText } = await import('@tanstack/ai-ollama')
  return ollamaText(model)
}

/**
 * Standard JSON error response.
 */
export function errorResponse(message, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}
