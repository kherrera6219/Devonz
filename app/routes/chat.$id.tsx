import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  return json({ id: args.params.id });
}

export { RouteErrorBoundary as ErrorBoundary } from '~/components/errors/RouteErrorBoundary';

export default IndexRoute;
