import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3333),
  APP_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/lumnipsi'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5-mini'),
  ASSISTANT_ENABLED: z.string().default('true'),
  ASSISTANT_ALLOW_DB_WRITE: z.string().default('false'),
  ASSISTANT_SYSTEM_NAME: z.string().default('Lia'),
  STORAGE_PROVIDER: z.string().default('external'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  PRISMA_SLOW_QUERY_MS: z.coerce.number().default(300),
});

export const env = envSchema.parse(process.env);
