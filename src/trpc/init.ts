import { initTRPC, TRPCError } from '@trpc/server';
import { getPayloadSingleton } from '@/lib/payload-singleton';
import superjson from "superjson";
import { headers as getHeaders } from 'next/headers';

import { cache } from 'react';
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  try {
    const headers = await getHeaders();
    const payload = await getPayloadSingleton();
    const session = await payload.auth({ headers });
    
    return { 
      userId: session.user?.id || null,
      user: session.user || null,
      db: payload 
    };
  } catch (error) {
    console.error('Error creating tRPC context:', error);
    return { 
      userId: null,
      user: null,
      db: await getPayloadSingleton()
    };
  }
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure.use(async ({ next }) => {
  const payload = await getPayloadSingleton();

  return next({ ctx: { db: payload } });
});

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const headers = await getHeaders();
  const session = await ctx.db.auth({ headers });

  if (!session.user) {
    // Log authentication failure for debugging
    console.error('[protectedProcedure] Authentication failed:', {
      hasCookie: headers.has('cookie'),
      cookieValue: headers.get('cookie')?.substring(0, 50) + '...',
      authorization: headers.has('authorization'),
    });
    
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        ...session,
        user: session.user,
      },
    },
  });
});

/**
 * Like protectedProcedure but does NOT throw when unauthenticated.
 * Passes session.user as null when not logged in. Use for count endpoints
 * that can safely return 0 when the user is not authenticated.
 */
export const optionalAuthProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const headers = await getHeaders();
  const session = await ctx.db.auth({ headers });

  return next({
    ctx: {
      ...ctx,
      session: {
        ...session,
        user: session.user ?? null,
      },
    },
  });
});
