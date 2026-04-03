import { createFileRoute } from '@tanstack/react-router';
import { generateTranscription } from '@tanstack/ai';
import { openaiTranscription } from '@tanstack/ai-openai';
import { requireKey, errorResponse } from './_shared';

export const Route = createFileRoute('/api/ai/transcription')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const formData = await request.formData();
                const audioFile = formData.get('audio');
                const audioBase64 = formData.get('audioBase64');
                const model = formData.get('model') || 'whisper-1';
                const language = formData.get('language');
                const responseFormat = formData.get('responseFormat');
                if (!audioFile && !audioBase64) {
                    return errorResponse('Audio file or base64 data is required', 400);
                }

                const keyError = requireKey('OPENAI_API_KEY');
                if (keyError) return keyError;

                try {
                    const adapter = openaiTranscription(model);
                    let audioData;
                    if (audioFile) {
                        audioData = audioFile;
                    }
                    else if (audioBase64) {
                        audioData = audioBase64;
                    }
                    else {
                        throw new Error('No audio data provided');
                    }
                    const result = await generateTranscription({
                        adapter,
                        audio: audioData,
                        language: language || undefined,
                        responseFormat: responseFormat || 'verbose_json',
                    });
                    return new Response(JSON.stringify({
                        id: result.id,
                        model: result.model,
                        text: result.text,
                        language: result.language,
                        duration: result.duration,
                        segments: result.segments,
                        words: result.words,
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
