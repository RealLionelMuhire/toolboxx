import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

const handler = async (req: Request) => {
  try {
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error }) => {
        console.error(`[tRPC Error] ${path}:`, error);
      },
    });
  } catch (error) {
    console.error('[tRPC Handler Error]:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR' 
        } 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export { handler as GET, handler as POST };

