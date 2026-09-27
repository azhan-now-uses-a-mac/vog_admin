import type { DonationInsert } from '@/types/donation'

export interface DonationReceivedEmailPayload {
  eventName: string
  donation: DonationInsert
}

export function buildDonationReceivedEmail(payload: DonationReceivedEmailPayload) {
  const { eventName, donation } = payload
  const paymentMethodLabel =
    donation.payment_method === 'qr_code' ? 'QR Code' : 'Bank Transfer'

  const subject = `Donation submission received: ${eventName}`

  const text = [
    'JazakAllahu khayran for your contribution.',
    '',
    `Thank you for supporting A Vision of Good and contributing to ${eventName}.`,
    '',
    'Your donation submission and proof of payment have been successfully received. Our team will review your submission.',
    '',
    `Event: ${eventName}`,
    `Amount: ${donation.amount} ${donation.currency}`,
    `Payment method: ${paymentMethodLabel}`,
    `Reference ID: ${donation.id}`,
    '',
    'This email confirms receipt of your submission. It does not mean the payment has been verified.',
    '',
    'May Allah accept your contribution and reward you for your generosity.',
    '',
    'A Vision of Good',
  ].join('\n')

  return { subject, text }
}

/**
 * Placeholder for a confirmation email. Not wired up yet: sending should happen
 * server-side (in the API) after the donation row is saved, never from the browser.
 */
export async function requestDonationConfirmationEmail(
  _payload: DonationReceivedEmailPayload,
): Promise<void> {
  return Promise.resolve()
}
