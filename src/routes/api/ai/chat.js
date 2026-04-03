import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai';
import { parseBody, resolveProvider, getTextAdapter, errorResponse } from './_shared';

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
                    const parsed = await parseBody(request, chatBodySchema);
                    if (parsed.error) return parsed.error;
                    const { messages } = parsed.data;

                    const { provider, model } = resolveProvider();
                    const adapter = await getTextAdapter(provider, model);

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
                        return errorResponse('Request timed out', 504);
                    }
                    return errorResponse('Failed to process chat request');
                }
            },
        },
    },
});
