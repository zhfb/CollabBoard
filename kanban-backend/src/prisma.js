const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

module.exports = prisma;
