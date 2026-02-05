import { json, type ActionFunctionArgs } from '@remix-run/node';
import OpenAI from 'openai';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.agent.generate-image');

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { prompt, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return json({ error: 'Prompt is required' }, { status: 400 });
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

    const imageData = response.data[0]?.b64_json;

    if (!imageData) {
      throw new Error('No image data received from OpenAI');
    }

    return json({ b64_json: imageData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to generate image', error);

    return json({ error: errorMessage }, { status: 500 });
  }
}
