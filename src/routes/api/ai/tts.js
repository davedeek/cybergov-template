import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { generateSpeech } from '@tanstack/ai';
import { parseBody, requireKey, errorResponse } from './_shared';

const ttsBodySchema = z.object({
    text: z.string().min(1, 'Text is required').max(4096),
    voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('alloy'),
    model: z.enum(['tts-1', 'tts-1-hd']).optional().default('tts-1'),
    format: z.enum(['mp3', 'opus', 'aac', 'flac']).optional().default('mp3'),
    speed: z.number().min(0.25).max(4.0).optional().default(1.0),
});

export const Route = createFileRoute('/api/ai/tts')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const parsed = await parseBody(request, ttsBodySchema);
                if (parsed.error) return parsed.error;
                const { text, voice, model, format, speed } = parsed.data;

                const keyError = requireKey('OPENAI_API_KEY');
                if (keyError) return keyError;

                try {
                    const { openaiSpeech } = await import('@tanstack/ai-openai');
                    const adapter = openaiSpeech(model);
                    const result = await generateSpeech({
                        adapter,
                        text,
                        voice,
                        format,
                        speed,
                    });
                    return new Response(JSON.stringify({
                        id: result.id,
                        model: result.model,
                        audio: result.audio,
                        format: result.format,
                        contentType: result.contentType,
                        duration: result.duration,
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                catch (error) {
                    return errorResponse(error.message || 'An error occurred');
                }
            },
        },
    },
});
