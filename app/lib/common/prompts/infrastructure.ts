import { stripIndents } from '~/utils/stripIndent';

export interface LocalInfrastructure {
  postgres?: {
    url: string;
    host: string;
    port: string;
    database: string;
    user: string;
  };
  s3?: {
    endpoint: string;
    bucket: string;
    region: string;
    accessKey: string;
  };
  redis?: {
    url: string;
    host: string;
    port: string;
  };
}

export function getInfrastructurePrompt(infra?: LocalInfrastructure) {
  if (!infra || (!infra.postgres && !infra.s3 && !infra.redis)) {
    return '';
  }

  let prompt = '\n<local_infrastructure>\n';
  prompt += '  You have access to the following local infrastructure services running on the host machine.\n';
  prompt += '  When building applications, you can configure them to use these services for persistence, storage, and caching.\n\n';

  if (infra.postgres) {
    prompt += stripIndents`
      ### PostgreSQL Database
      - URL: ${infra.postgres.url} (Use this in .env)
      - Host: ${infra.postgres.host}
      - Port: ${infra.postgres.port}
      - Database: ${infra.postgres.database}
      - User: ${infra.postgres.user}
      - Password: (Check .env.local on host if needed, usually 'devonz_password')
    ` + '\n\n';
  }

  if (infra.s3) {
    prompt += stripIndents`
      ### Local Object Storage (MinIO / S3 Compatible)
      - Endpoint: ${infra.s3.endpoint}
      - Bucket: ${infra.s3.bucket}
      - Region: ${infra.s3.region}
      - Access Key: ${infra.s3.accessKey}
      - Secret Key: (Check .env.local on host if needed, usually 'devonz_storage_password')
      - IMPORTANT: Use 'forcePathStyle: true' in S3 clients.
    ` + '\n\n';
  }

  if (infra.redis) {
    prompt += stripIndents`
      ### Redis Cache
      - URL: ${infra.redis.url}
      - Host: ${infra.redis.host}
      - Port: ${infra.redis.port}
    ` + '\n';
  }

  prompt += '</local_infrastructure>\n';

  return prompt;
}
