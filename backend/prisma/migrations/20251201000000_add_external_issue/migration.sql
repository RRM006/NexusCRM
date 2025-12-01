-- CreateTable
CREATE TABLE "external_issues" (
    "id" TEXT NOT NULL,
    "linearIssueId" TEXT NOT NULL,
    "linearUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_issues_linearIssueId_key" ON "external_issues"("linearIssueId");

-- CreateIndex
CREATE INDEX "external_issues_tenantId_createdAt_idx" ON "external_issues"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "external_issues_linearIssueId_idx" ON "external_issues"("linearIssueId");

-- AddForeignKey
ALTER TABLE "external_issues" ADD CONSTRAINT "external_issues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

