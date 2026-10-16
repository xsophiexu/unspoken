import type { Context, MiddlewareHandler } from 'hono';

import { fail, type AppEnv } from './http';

type RateLimit = { limit: number; windowSeconds: number; key: (c: Context<AppEnv>) => string };

// A fixed-window request limit per key, counted in memory. Each instance counts on its own, so N
// instances allow up to N times the limit; move the counts to a shared store if that ever matters.
export function rateLimit({ limit, windowSeconds, key }: RateLimit): MiddlewareHandler<AppEnv> {
  // Every window is the same length, so insertion order is expiry order and expired ones sit in front.
  const windows = new Map<string, { hits: number; resetAt: number }>();
  return async (c, next) => {
    const now = Date.now();
    for (const [id, window] of windows) {
      if (window.resetAt > now) break;
      windows.delete(id);
    }
    const id = key(c);
    const window = windows.get(id) ?? { hits: 0, resetAt: now + windowSeconds * 1000 };
    windows.set(id, window);
    window.hits += 1;
    if (window.hits > limit) {
      c.header('Retry-After', String(Math.ceil((window.resetAt - now) / 1000)));
      return fail(c, 'rate_limited', 'Too many requests. Try again later.');
    }
    await next();
  };
}

// The caller's address. Proxies such as Cloud Run's front end append the address they saw to
// X-Forwarded-For, after anything the caller sent, so the client is `trustedHops` entries from the end.
export function clientAddress(c: Context<AppEnv>, trustedHops: number): string {
  const forwarded = (c.req.header('x-forwarded-for') ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  const fromProxy = trustedHops > 0 ? forwarded[Math.max(0, forwarded.length - trustedHops)] : undefined;
  return fromProxy ?? c.env?.incoming?.socket?.remoteAddress ?? 'unknown';
}
