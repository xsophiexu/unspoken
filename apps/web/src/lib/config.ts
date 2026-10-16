import { clientConfigSchema } from '@unspoken/api-contract';

// Deployment settings from the environment, validated once. Next inlines only literal
// process.env.NEXT_PUBLIC_* reads, so each variable is read here by its full name.
// An unset or malformed value is left out: the site still works, without that service.

const fields = clientConfigSchema.shape;

function valid<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }, value: string | undefined): T | undefined {
  if (!value) return undefined;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export const config = {
  // services/api; Send feedback shows an inline error while it is missing.
  apiBaseUrl: valid(fields.apiBaseUrl, process.env.NEXT_PUBLIC_API_URL),
  // Google Analytics loads only when this is set.
  gaMeasurementId: valid(fields.gaMeasurementId, process.env.NEXT_PUBLIC_GA_ID),
  // The path the site is served under (GitHub Pages: /unspoken), for URLs Next does not prefix itself.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
};
