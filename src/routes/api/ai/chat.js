import { createFileRoute } from '@tanstack/react-router';
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { openaiText } from '@tanstack/ai-openai';
import { geminiText } from '@tanstack/ai-gemini';
import { ollamaText } from '@tanstack/ai-ollama';

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
                try {
                    const body = await request.json();
                    const { messages } = body;
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
                    const adapterConfig = {
                        anthropic: () => anthropicText((model || 'claude-haiku-4-5')),
                        openai: () => openaiText((model || 'gpt-4o')),
                        gemini: () => geminiText((model || 'gemini-2.0-flash-exp')),
                        ollama: () => ollamaText((model || 'mistral:7b')),
                    };
                    const adapter = adapterConfig[provider]();
                    const stream = chat({
                        adapter,
                        systemPrompts: [SYSTEM_PROMPT],
                        agentLoopStrategy: maxIterations(5),
                        messages,
                        abortController,
                    });
                    return toServerSentEventsResponse(stream, { abortController });
                }
                catch (error) {
                    if (error.name === 'AbortError' || abortController.signal.aborted) {
                        return new Response(null, { status: 499 });
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
