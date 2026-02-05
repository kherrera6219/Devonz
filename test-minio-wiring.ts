import dotenv from 'dotenv';
import { minioService } from './app/lib/services/minioService.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testMinIO() {
  console.log('Testing MinIO Wiring...');
  const testPath = 'diagnostics/test-wiring.txt';
  const testContent = 'MinIO wiring test successful at ' + new Date().toISOString();

  try {
    console.log(`Uploading file to MinIO: ${testPath}`);
    await minioService.uploadFile(testPath, testContent, 'text/plain');
    console.log('✅ Upload successful!');

    // We don't have a listFiles in minioService, but we can check if it fails
    // Let's check the bucket name used in the service
    const bucket = process.env.S3_BUCKET || 'devonz-imports';
    console.log(`Target Bucket: ${bucket}`);
  } catch (error) {
    console.error('❌ MinIO test failed:', error);
  }
}

testMinIO();
