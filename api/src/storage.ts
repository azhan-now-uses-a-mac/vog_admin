import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Buckets declared in neon.ts.
export const PROOFS_BUCKET = 'images' // private: donor receipts
export const QR_BUCKET = 'qr-codes' // public_read: event QR codes

// Credentials, endpoint and region come from the AWS_* vars Neon injects.
// Neon requires path-style addressing.
const s3 = new S3Client({ forcePathStyle: true })

export async function putObject(
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: bucket === QR_BUCKET ? 'public, max-age=31536000, immutable' : undefined,
    }),
  )
}

export async function deleteObject(bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

// Public objects are readable anonymously at <endpoint>/<bucket>/<key>.
export function publicUrl(bucket: string, key: string | null): string | null {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  const endpoint = (process.env.AWS_ENDPOINT_URL_S3 ?? '').replace(/\/+$/, '')
  if (!endpoint) return null
  const path = key.split('/').map(encodeURIComponent).join('/')
  return `${endpoint}/${bucket}/${path}`
}

// Private objects are shared with a short-lived signed link.
export async function signedUrl(bucket: string, key: string, expiresIn: number) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn,
  })
}
