import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MinIOService');

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'devonz_admin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'devonz_storage_password';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

function getBucketName() {
  return process.env.S3_BUCKET || 'devonz-assets';
}

class MinIOService {
  private _client: S3Client;

  constructor() {
    this._client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this._ensureBucketExists();
  }

  private async _ensureBucketExists() {
    try {
      // Small delay to ensure MinIO is up if this is called during boot
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const bucket = getBucketName();
        await this._client.send(new HeadBucketCommand({ Bucket: bucket }));
        logger.info(`MinIO bucket ${bucket} exists`);
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          const bucket = getBucketName();
          logger.info(`Creating MinIO bucket: ${bucket}`);
          await this._client.send(new CreateBucketCommand({ Bucket: bucket }));
        } else {
          throw error;
        }
      }

      logger.info(`MinIO service initialized for bucket: ${getBucketName()}`);
    } catch (error) {
      logger.error('Failed to initialize MinIO service', error);
    }
  }

  async uploadFile(path: string, content: Buffer | string, contentType?: string, projectId?: string) {
    try {
      const fullPath = projectId ? `projects/${projectId}/${path}` : path;
      const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: fullPath,
        Body: content,
        ContentType: contentType,
      });

      await this._client.send(command);
      logger.info(`Successfully uploaded file to MinIO: ${fullPath}`);
    } catch (error) {
      logger.error(`Failed to upload file to MinIO: ${path}`, error);
      throw error;
    }
  }

  async getProjectFiles(projectId: string) {
    try {
      const prefix = `projects/${projectId}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
      });

      const response = await this._client.send(listCommand);

      return (response.Contents || []).map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
    } catch (error) {
      logger.error(`Failed to list project files for project: ${projectId}`, error);

      return [];
    }
  }

  async deleteFolder(prefix: string, projectId?: string) {
    try {
      const fullPrefix = projectId ? `projects/${projectId}/${prefix}` : prefix;
      const listCommand = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: fullPrefix,
      });

      const listResponse = await this._client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Map to DeleteObjects structure
        const objectsToDelete = listResponse.Contents.map((obj) => ({ Key: obj.Key }));

        const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: getBucketName(),
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        });

        await this._client.send(deleteCommand);
        logger.info(`Deleted ${objectsToDelete.length} items from MinIO: ${prefix}`);
      }
    } catch (error) {
      logger.error(`Failed to delete folder from MinIO: ${prefix}`, error);
      throw error;
    }
  }
}

export const minioService = new MinIOService();
