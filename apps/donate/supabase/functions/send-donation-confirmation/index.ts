interface DonationRecord {
  id: string
  event_id: string
  email: string
  amount: number | string
  currency: string
  payment_method: string
  full_name: string
  phone: string
  proof_storage_path: string
  message: string | null
}

function buildEmail(eventName: string, donation: DonationRecord) {
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail =
    Deno.env.get('DONATION_FROM_EMAIL') ?? 'A Vision of Good <noreply@avisionofgood.com>'
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!resendKey || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ skipped: true, reason: 'email_not_configured' })
  }

  const payload = await req.json()
  const record = (payload.record ?? payload) as DonationRecord

  if (!record?.id || !record.email || !record.event_id) {
    return Response.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const eventResponse = await fetch(
    `${supabaseUrl}/rest/v1/events?id=eq.${record.event_id}&select=name`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )

  const events = (await eventResponse.json()) as Array<{ name: string }>
  const eventName = events[0]?.name ?? 'A Vision of Good campaign'
  const email = buildEmail(eventName, record)

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [record.email],
      subject: email.subject,
      text: email.text,
    }),
  })

  if (!resendResponse.ok) {
    return Response.json({ error: 'email_send_failed' }, { status: 502 })
  }

  return Response.json({ ok: true })
})
