import { type ActionFunctionArgs } from '@remix-run/node';
import OpenAI from 'openai';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security.server';

const logger = createScopedLogger('api.agent.generate-image');

export const action = withSecurity(
  async ({ request }: ActionFunctionArgs) => {
    try {
      const { prompt, size = '1024x1024' } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      logger.info(`Generating image for prompt: ${prompt}`);

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: size as any,
        response_format: 'b64_json',
      });

      const imageData = response.data?.[0]?.b64_json;

      if (!imageData) {
        throw new Error('No image data received from OpenAI');
      }

      return { b64_json: imageData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to generate image', error);

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
  { allowedMethods: ['POST'] },
);
