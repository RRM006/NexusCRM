-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('USER_TO_USER', 'SUPERADMIN_TO_COMPANY', 'SUPERADMIN_TO_CUSTOMER');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "companyId" TEXT,
    "userOneId" TEXT,
    "userTwoId" TEXT,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "isSuperAdminSender" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_companyId_idx" ON "conversations"("companyId");

-- CreateIndex
CREATE INDEX "conversations_userOneId_idx" ON "conversations"("userOneId");

-- CreateIndex
CREATE INDEX "conversations_userTwoId_idx" ON "conversations"("userTwoId");

-- CreateIndex
CREATE INDEX "conversations_targetUserId_idx" ON "conversations"("targetUserId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderUserId_idx" ON "messages"("senderUserId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
