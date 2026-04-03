import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { generateImage, createImageOptions } from '@tanstack/ai';
import { parseBody, requireKey, errorResponse } from './-_shared';

const imageBodySchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(1000),
    numberOfImages: z.number().int().min(1).max(4).optional().default(1),
    size: z.enum(['256x256', '512x512', '1024x1024']).optional().default('1024x1024'),
});

export const Route = createFileRoute('/api/ai/image')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const parsed = await parseBody(request, imageBodySchema);
                if (parsed.error) return parsed.error;
                const { prompt, numberOfImages, size } = parsed.data;

                const keyError = requireKey('OPENAI_API_KEY');
                if (keyError) return keyError;

                try {
                    const { openaiImage } = await import('@tanstack/ai-openai');
                    const options = createImageOptions({
                        adapter: openaiImage('gpt-image-1'),
                    });
                    const result = await generateImage({
                        ...options,
                        prompt,
                        numberOfImages,
                        size,
                    });
                    return new Response(JSON.stringify({
                        images: result.images,
                        model: 'gpt-image-1',
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
