import type { FastifyInstance, FastifyRequest } from "fastify";

type RateLimitRule = {
  limit: number;
  methods: Set<string>;
  pathPattern: RegExp;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const rules: RateLimitRule[] = [
  {
    limit: 10,
    methods: new Set(["POST"]),
    pathPattern: /^\/auth\/(?:login|register)$/,
    windowMs: 60_000,
  },
  {
    limit: 30,
    methods: new Set(["POST"]),
    pathPattern: /^\/rooms\/[^/]+\/(?:join|token)$/,
    windowMs: 60_000,
  },
  {
    limit: 20,
    methods: new Set(["POST"]),
    pathPattern: /^\/servers\/join$/,
    windowMs: 60_000,
  },
];

function clientKey(request: FastifyRequest) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0];

  return (ip?.trim() || request.ip || "unknown").slice(0, 120);
}

function matchingRule(request: FastifyRequest) {
  return rules.find((rule) => rule.methods.has(request.method) && rule.pathPattern.test(request.url.split("?")[0] ?? request.url));
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1_000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export async function rateLimitPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const rule = matchingRule(request);

    if (!rule) {
      return;
    }

    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = `${clientKey(request)}:${request.method}:${request.url.split("?")[0]}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      return;
    }

    bucket.count += 1;

    if (bucket.count > rule.limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      reply.header("Retry-After", retryAfter.toString());
      return reply.status(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "Muitas tentativas. Aguarde e tente novamente.",
        },
      });
    }
  });
}
