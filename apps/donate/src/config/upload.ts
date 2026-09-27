export const UPLOAD_CONFIG = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'] as const,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] as const,
  bucket: 'donation-proofs',
  eventAssetsBucket: 'event-assets',
} as const

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
