import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai';

const chatBodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(10000),
  })).max(100),
});

const SYSTEM_PROMPT = `You are a helpful AI assistant. You can help with a wide variety of tasks including answering questions, writing, analysis, and more. Be concise and helpful.`;

export const Route = createFileRoute('/api/ai/chat')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const requestSignal = request.signal;
                if (requestSignal.aborted) {
                    return new Response(null, { status: 499 });
                }
                const abortController = new AbortController();
                const timeoutId = setTimeout(() => abortController.abort(), 30000);
                try {
                    const rawBody = await request.json();
                    const parseResult = chatBodySchema.safeParse(rawBody);
                    if (!parseResult.success) {
                        return new Response(JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                    const { messages } = parseResult.data;
                    // Determine the best available provider
                    let provider = 'ollama';
                    let model = 'mistral:7b';
                    if (process.env.ANTHROPIC_API_KEY) {
                        provider = 'anthropic';
                        model = 'claude-haiku-4-5';
                    }
                    else if (process.env.OPENAI_API_KEY) {
                        provider = 'openai';
                        model = 'gpt-4o';
                    }
                    else if (process.env.GEMINI_API_KEY) {
                        provider = 'gemini';
                        model = 'gemini-2.0-flash-exp';
                    }
                    let adapter;
                    if (provider === 'anthropic') {
                        const { anthropicText } = await import('@tanstack/ai-anthropic');
                        adapter = anthropicText(model || 'claude-haiku-4-5');
                    } else if (provider === 'openai') {
                        const { openaiText } = await import('@tanstack/ai-openai');
                        adapter = openaiText(model || 'gpt-4o');
                    } else if (provider === 'gemini') {
                        const { geminiText } = await import('@tanstack/ai-gemini');
                        adapter = geminiText(model || 'gemini-2.0-flash-exp');
                    } else {
                        const { ollamaText } = await import('@tanstack/ai-ollama');
                        adapter = ollamaText(model || 'mistral:7b');
                    }
                    const stream = chat({
                        adapter,
                        systemPrompts: [SYSTEM_PROMPT],
                        agentLoopStrategy: maxIterations(5),
                        messages,
                        abortController,
                    });
                    clearTimeout(timeoutId);
                    return toServerSentEventsResponse(stream, { abortController });
                }
                catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError' || abortController.signal.aborted) {
                        return new Response(JSON.stringify({ error: 'Request timed out' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            },
        },
    },
});
