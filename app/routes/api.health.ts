import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { withSecurity } from '~/lib/security.server';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: 'desktop' | 'server';
  services: Record<string, ServiceHealth>;
}

async function checkPostgres(): Promise<ServiceHealth> {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_HOST) {
    return { status: 'unconfigured' };
  }

  try {
    const { Pool: pgPool } = await import('pg');
    const pool = new pgPool({
      connectionString:
        process.env.DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'devonz_user'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'devonz_db'}`,
      connectionTimeoutMillis: 3000,
    });
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();

    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return { status: 'unconfigured' };
  }

  try {
    const ioRedis = (await import('ioredis')).default;
    const redis = new ioRedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    const start = Date.now();
    await redis.connect();
    await redis.ping();
    await redis.quit();

    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkNeo4j(): Promise<ServiceHealth> {
  if (!process.env.NEO4J_URI) {
    return { status: 'unconfigured' };
  }

  try {
    const neo4j = await import('neo4j-driver');
    const driver = neo4j.default.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.default.auth.basic('neo4j', process.env.NEO4J_PASSWORD || ''),
    );
    const start = Date.now();
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    await driver.close();

    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export const loader = withSecurity(
  async ({ request: _request }: LoaderFunctionArgs) => {
    const url = new URL(_request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    // Quick health check for load balancers / desktop tray
    if (!detailed) {
      return json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    }

    // Detailed health check with service connectivity
    const [postgres, redis, neo4j] = await Promise.allSettled([checkPostgres(), checkRedis(), checkNeo4j()]);

    const services: Record<string, ServiceHealth> = {
      postgres: postgres.status === 'fulfilled' ? postgres.value : { status: 'unhealthy', error: 'Check failed' },
      redis: redis.status === 'fulfilled' ? redis.value : { status: 'unhealthy', error: 'Check failed' },
      neo4j: neo4j.status === 'fulfilled' ? neo4j.value : { status: 'unhealthy', error: 'Check failed' },
    };

    // Only count configured services for health assessment
    const configuredServices = Object.values(services).filter((s) => s.status !== 'unconfigured');
    const unhealthyCount = configuredServices.filter((s) => s.status === 'unhealthy').length;

    const overallStatus: HealthResponse['status'] =
      configuredServices.length === 0
        ? 'healthy' // No external services configured = desktop mode, app is healthy
        : unhealthyCount === 0
          ? 'healthy'
          : unhealthyCount === configuredServices.length
            ? 'unhealthy'
            : 'degraded';

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      environment: configuredServices.length === 0 ? 'desktop' : 'server',
      services,
    };

    return json(response, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
    });
  },
  { rateLimit: false },
);
