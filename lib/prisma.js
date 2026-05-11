// Configuración centralizada de Prisma para Prisma 7
// Este archivo exporta una instancia única del cliente de Prisma

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Configuración del pool de conexiones para PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Creación del adaptador
const adapter = new PrismaPg(pool);

// Instancia única de PrismaClient con el adaptador de Postgres
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
