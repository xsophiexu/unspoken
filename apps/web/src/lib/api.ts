import { createApiClient, type ApiClient } from '@unspoken/api-contract';

import { config } from './config';

// The services/api client, or null when NEXT_PUBLIC_API_URL is not set (the site still works; Send
// feedback shows its inline error).
export const apiClient: ApiClient | null = config.apiBaseUrl ? createApiClient({ baseUrl: config.apiBaseUrl }) : null;
