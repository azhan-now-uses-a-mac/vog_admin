import type { EventRecord } from '@/types/event'

interface QrCodePaymentProps {
  event: EventRecord
}

export function QrCodePayment({ event }: QrCodePaymentProps) {
  const qrUrl = event.qr_code_url

  if (!qrUrl) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-vog-brown">QR Code</h3>
      <div className="flex justify-center rounded-2xl border border-vog-brown/10 bg-white p-4">
        <img
          src={qrUrl}
          alt={`Payment QR code for ${event.name}`}
          className="h-56 w-56 object-contain"
        />
      </div>
    </div>
  )
}
