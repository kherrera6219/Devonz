import dotenv from 'dotenv';
// Load environment variables BEFORE importing the service
dotenv.config({ path: '.env.local' });

import { minioService } from './app/lib/services/minioService.ts';

async function testMinIO() {
  console.log('Testing MinIO Wiring (Corrected)...');
  const testPath = 'diagnostics/test-wiring-fixed.txt';
  const testContent = 'MinIO wiring test successful at ' + new Date().toISOString();

  try {
    // Wait for the service to ensure the bucket exists (it has a 1s delay in constructor)
    console.log('Waiting for MinIO service initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Uploading file to MinIO: ${testPath}`);
    await minioService.uploadFile(testPath, testContent, 'text/plain');
    console.log('✅ Upload successful!');

    console.log(`Target Bucket: ${process.env.S3_BUCKET || 'devonz-imports'}`);
  } catch (error) {
    console.error('❌ MinIO test failed:', error);
  }
}

testMinIO();
