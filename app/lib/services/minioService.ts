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
const S3_BUCKET = process.env.S3_BUCKET || 'devonz-imports';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

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
        await this._client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
        logger.info(`MinIO bucket ${S3_BUCKET} exists`);
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          logger.info(`Creating MinIO bucket: ${S3_BUCKET}`);
          await this._client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
        } else {
          throw error;
        }
      }

      logger.info(`MinIO service initialized for bucket: ${S3_BUCKET}`);
    } catch (error) {
      logger.error('Failed to initialize MinIO service', error);
    }
  }

  async uploadFile(path: string, content: Buffer | string, contentType?: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: path,
        Body: content,
        ContentType: contentType,
      });

      await this._client.send(command);
      logger.debug(`File uploaded to MinIO: ${path}`);
    } catch (error) {
      logger.error(`Failed to upload file to MinIO: ${path}`, error);
      throw error;
    }
  }

  async deleteFolder(prefix: string) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
      });

      const listResponse = await this._client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const deletePromises = listResponse.Contents.map((obj: any) => {
          return this._client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: obj.Key,
            }),
          );
        });

        await Promise.all(deletePromises);
        logger.info(`Deleted folder from MinIO: ${prefix}`);
      }
    } catch (error) {
      logger.error(`Failed to delete folder from MinIO: ${prefix}`, error);
      throw error;
    }
  }
}

export const minioService = new MinIOService();
