import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { generateImage, createImageOptions } from '@tanstack/ai';

const imageBodySchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(1000),
    numberOfImages: z.number().int().min(1).max(4).optional().default(1),
    size: z.enum(['256x256', '512x512', '1024x1024']).optional().default('1024x1024'),
});

export const Route = createFileRoute('/api/ai/image')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const rawBody = await request.json();
                const parseResult = imageBodySchema.safeParse(rawBody);
                if (!parseResult.success) {
                    return new Response(JSON.stringify({ error: 'Invalid request body', details: parseResult.error.flatten() }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                const { prompt, numberOfImages, size } = parseResult.data;
                if (!process.env.OPENAI_API_KEY) {
                    return new Response(JSON.stringify({
                        error: 'OPENAI_API_KEY is not configured',
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
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
                    return new Response(JSON.stringify({
                        error: error.message || 'An error occurred',
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            },
        },
    },
});
