import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

require('dotenv').config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
