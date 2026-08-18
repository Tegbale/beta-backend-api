import { env } from '../config/env';

export async function generateCloudinaryDownloadUrl(url: string): Promise<string | null> {
  if (!url.includes('cloudinary.com')) return null;

  const match = url.match(/cloudinary\.com\/[^/]+\/([^/]+)\/upload\/v\d+\/(.+)$/);
  if (!match) return null;

  // For raw resources, the file extension is part of the public_id in Cloudinary's system.
  // Passing the full path as public_id and an empty format avoids a 404 from the download API.
  const [, resourceType, publicId] = match;

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });

  return (cloudinary.utils as any).private_download_url(publicId, '', {
    resource_type: resourceType,
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 300,
  }) as string;
}

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'auto' | 'image' | 'raw' = 'auto',
): Promise<string> {
  return env.storage.provider === 'spaces'
    ? uploadToSpaces(buffer, folder, filename)
    : uploadToCloudinary(buffer, folder, filename, resourceType);
}

async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'auto' | 'image' | 'raw',
): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

async function uploadToSpaces(buffer: Buffer, folder: string, filename: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { bucket, region, key, secret } = env.storage.spaces;
  const client = new S3Client({
    endpoint: `https://${region}.digitaloceanspaces.com`,
    region,
    credentials: { accessKeyId: key, secretAccessKey: secret },
  });
  const objectKey = `${folder}/${filename}`;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: buffer,
    ACL: 'public-read',
  }));
  return `https://${bucket}.${region}.digitaloceanspaces.com/${objectKey}`;
}
