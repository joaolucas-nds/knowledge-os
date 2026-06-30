/**
 * Plugin de autenticação — verifica o JWT emitido pelo Supabase Auth.
 *
 * Estratégia escolhida: HS256 com o "Legacy JWT Secret" do projeto
 * (Project Settings → API → JWT Settings → JWT Secret no painel do
 * Supabase). É a forma mais simples de verificar o token num backend
 * próprio (sem precisar buscar chave pública via JWKS endpoint), e é a
 * que o Supabase documenta para "verificação em backend de terceiros".
 *
 * Se o seu projeto Supabase for novo o suficiente para usar as chaves
 * assimétricas (ES256/RS256) por padrão, ainda é possível habilitar o
 * Legacy JWT Secret na mesma tela — ele continua funcionando em paralelo,
 * não é um ou-outro. Ver SETUP.md para o passo exato.
 *
 * Por que @fastify/jwt e não verificar manualmente: ele já decora
 * `request.jwtVerify()` e integra com o ciclo de vida do Fastify (erros
 * de token expirado/inválido viram 401 automaticamente via error handler).
 */

import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

/**
 * Formato mínimo do payload de um JWT do Supabase Auth — só os campos
 * que este projeto usa. O token real tem mais campos (aud, role, etc.),
 * mas tipar só o que se usa evita acoplamento desnecessário.
 */
export interface SupabaseJwtPayload {
  /** ID do usuário (UUID) — é o que importa para filtrar dados por dono. */
  sub: string;
  email?: string;
  /** Timestamp Unix de expiração — @fastify/jwt já valida isso automaticamente. */
  exp: number;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SupabaseJwtPayload;
    /** Tipo de retorno de `request.user` — populado automaticamente por `request.jwtVerify()`. */
    user: SupabaseJwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /** Middleware para usar em `preHandler` de rotas protegidas. */
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthPluginOptions {
  /** undefined = auth desabilitada (rotas protegidas retornam 503, não 401). */
  supabaseJwtSecret: string | undefined;
}

async function authPlugin(
  fastify: FastifyInstance,
  options: AuthPluginOptions,
): Promise<void> {
  const { supabaseJwtSecret } = options;

  if (supabaseJwtSecret) {
    await fastify.register(jwt, {
      secret: supabaseJwtSecret,
      // Supabase assina com HS256 quando o Legacy JWT Secret está ativo.
      verify: { algorithms: ["HS256"] },
    });
  }

  fastify.decorate(
    "requireAuth",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!supabaseJwtSecret) {
        // Não é erro do cliente (401) — é a API mal configurada (503).
        // Distinguir os dois evita o usuário pensar que digitou a senha
        // errada quando na verdade falta SUPABASE_JWT_SECRET no .env.
        return reply.code(503).send({
          status: "auth_not_configured" as const,
          message: "SUPABASE_JWT_SECRET não foi definido no servidor.",
        });
      }

      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({
          status: "unauthorized" as const,
          message: "Token ausente, inválido ou expirado.",
        });
      }
    },
  );
}

// fastify-plugin evita o encapsulamento padrão do Fastify, para que
// `requireAuth` fique disponível em qualquer rota registrada depois,
// não só dentro do mesmo escopo do plugin.
export default fp(authPlugin, { name: "auth-plugin" });
