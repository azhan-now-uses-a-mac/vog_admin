export const SITE = {
  name: 'A Vision of Good',
  arabicName: 'رؤية الخير',
  shortName: 'VOG',
  mainSiteUrl: 'https://www.avisionofgood.com',
  // Public forms, used for the "open on site" links in the admin.
  // Override with VITE_DONATE_URL / VITE_VOLUNTEER_URL if your subdomains differ.
  donateUrl: import.meta.env.VITE_DONATE_URL || 'https://donate.avisionofgood.com',
  volunteerUrl:
    import.meta.env.VITE_VOLUNTEER_URL || 'https://volunteer.avisionofgood.com',
} as const
