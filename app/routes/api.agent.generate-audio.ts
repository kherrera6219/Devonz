import { json, type ActionFunctionArgs } from '@remix-run/node';
import OpenAI from 'openai';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security.server';

const logger = createScopedLogger('api.agent.generate-audio');

export const action = withSecurity(
  async ({ request }: ActionFunctionArgs) => {
    try {
      const { text, voice = 'alloy' } = await request.json();

      if (!text) {
        return json({ error: 'Text is required' }, { status: 400 });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      logger.info(`Generating audio for text: ${text.substring(0, 50)}...`);

      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      const b64Json = buffer.toString('base64');

      return json({ b64_json: b64Json });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to generate audio', error);

      return json({ error: errorMessage }, { status: 500 });
    }
  },
  { allowedMethods: ['POST'] },
);
