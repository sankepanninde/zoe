import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      churchId: string;
      role: string;
      email: string;
    };
  }
}