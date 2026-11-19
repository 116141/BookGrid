import 'server-only';
import { headers } from 'next/headers';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

/**
 * Extracts the client IP address from Next.js 15 async `headers()`.
 */
export async function getClientIpAddress(): Promise<string> {
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }
  const realIp = reqHeaders.get('x-real-ip')?.trim();
  return realIp || 'unknown-ip';
}

/**
 * Sliding-window in-memory rate limiter to protect public `bookgrid.app/[slug]`
 * endpoints against booking spam and automated abuse.
 */
export async function checkPublicRateLimit(
  namespace: string,
  maxRequests = 5,
  windowMs = 15 * 60 * 1000
): Promise<RateLimitResult> {
  const now = Date.now();
  const ip = await getClientIpAddress();
  const key = `${namespace}:${ip}`;

  // Periodic cleanup of expired buckets to bound memory usage
  if (rateLimitStore.size > 2000) {
    for (const [bucketKey, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAtMs <= now) {
        rateLimitStore.delete(bucketKey);
      }
    }
  }

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAtMs <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAtMs: now + windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: 0,
  };
}
