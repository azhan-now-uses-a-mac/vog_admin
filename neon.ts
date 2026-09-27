import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Managed Better Auth (admin login). Already enabled on the branch; declared
  // here so NEON_AUTH_BASE_URL / NEON_AUTH_JWKS_URL reach the API function.
  auth: true,
  preview: {
    // Upgrade to a paid plan to enable AI Gateway for your project.
    // aiGateway: true,
    buckets: {
      // Donor proof-of-payment receipts. Private: only the API can read them.
      images: { access: "private" },
      // Event payment QR codes. Public: shown to every visitor on the donate site.
      "qr-codes": { access: "public_read" },
    },
    functions: {
      // Backend for the donate, volunteer and admin sites.
      api: { name: "vog api", source: "./api/src/index.ts" },
    },
  },
});
