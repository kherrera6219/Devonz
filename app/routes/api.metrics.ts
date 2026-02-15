import { type LoaderFunctionArgs } from '@remix-run/node';
import { register } from '~/lib/metrics.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const metrics = await register.metrics();

    return new Response(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
