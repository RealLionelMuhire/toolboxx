import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

const handler = async (req: Request) => {
  try {
    // Debug: Log authentication headers in production
    const authHeader = req.headers.get('authorization');
    const cookieHeader = req.headers.get('cookie');
    
    console.log('[TRPC Handler] Request info:', {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!authHeader,
      hasCookie: !!cookieHeader,
      originHeader: req.headers.get('origin'),
    });

    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error, type }) => {
        console.error(`[tRPC Error] ${path} (${type}):`, {
          message: error.message,
          code: error.code,
        });
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

