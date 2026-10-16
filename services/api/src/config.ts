import { z } from 'zod';

// Every deployment-specific value, read from the environment once at startup and validated here.
// Defaults suit local development; .env.example lists every variable.

const positive = (fallback: number) => z.coerce.number().int().positive().default(fallback);

// Compared exactly with the browser's Origin header: scheme, host and port, with no path.
const origin = z
  .string()
  .refine((value) => URL.canParse(value) && new URL(value).origin === value, 'Use an origin such as https://example.com, with no path or trailing slash');

// A service account key file's JSON, pasted into one variable.
const serviceAccount = z
  .string()
  .transform((text, ctx) => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Must be the JSON of a service account key' });
      return z.NEVER;
    }
  })
  .pipe(z.object({ project_id: z.string(), client_email: z.string(), private_key: z.string() }))
  .transform((key) => ({ projectId: key.project_id, clientEmail: key.client_email, privateKey: key.private_key }));

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    // Comma-separated browser origins allowed to call the API. Native apps send no Origin and need none.
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((list) => list.split(',').map((o) => o.trim()).filter(Boolean))
      .pipe(z.array(origin)),
    // Proxies in front of the service that append the caller's address to X-Forwarded-For.
    TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
    BODY_LIMIT_BYTES: positive(8192),
    FEEDBACK_RATE_LIMIT: positive(5),
    FEEDBACK_RATE_WINDOW_SECONDS: positive(600),
    FEEDBACK_COLLECTION: z.string().default('feedback'),
    // Feedback is stored once a project is known, from this or from the service account key.
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT: serviceAccount.optional(),
  })
  .transform((env) => {
    const projectId = env.FIREBASE_PROJECT_ID ?? env.FIREBASE_SERVICE_ACCOUNT?.projectId;
    return {
      port: env.PORT,
      corsOrigins: env.CORS_ORIGINS,
      trustProxyHops: env.TRUST_PROXY_HOPS,
      bodyLimitBytes: env.BODY_LIMIT_BYTES,
      feedback: {
        collection: env.FEEDBACK_COLLECTION,
        rateLimit: env.FEEDBACK_RATE_LIMIT,
        rateWindowSeconds: env.FEEDBACK_RATE_WINDOW_SECONDS,
      },
      // Without a service account key, the Admin SDK uses Application Default Credentials.
      firebase: projectId ? { projectId, serviceAccount: env.FIREBASE_SERVICE_ACCOUNT } : undefined,
    };
  });

export type ServiceConfig = z.output<typeof envSchema>;
export type FirebaseConfig = NonNullable<ServiceConfig['firebase']>;

// Empty variables count as unset, so a copied .env.example with blanks still starts. Throws one error
// naming every bad variable.
export function loadConfig(env: Record<string, string | undefined> = process.env): ServiceConfig {
  const set = Object.fromEntries(Object.entries(env).filter(([, value]) => value?.trim()));
  const parsed = envSchema.safeParse(set);
  if (!parsed.success) throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}
