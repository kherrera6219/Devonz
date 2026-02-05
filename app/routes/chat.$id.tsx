import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { default as IndexRoute } from './_index';

import { withSecurity } from '~/lib/security';

export const loader = withSecurity(async (args: LoaderFunctionArgs) => {
  return json({ id: args.params.id });
});

export default IndexRoute;
