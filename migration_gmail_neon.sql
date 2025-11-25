-- Migración para agregar integración de Gmail en Neon
-- Ejecutar este SQL en Neon SQL Editor

-- Crear tabla GmailIntegration
CREATE TABLE IF NOT EXISTS "GmailIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GmailIntegration_pkey" PRIMARY KEY ("id")
);

-- Crear tabla PendingQuote
CREATE TABLE IF NOT EXISTS "PendingQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailIntegrationId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailFrom" TEXT NOT NULL,
    "emailDate" TIMESTAMP(3) NOT NULL,
    "emailBody" TEXT,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "title" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "tax" DOUBLE PRECISION,
    "description" TEXT,
    "issueDate" TEXT,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PendingQuote_pkey" PRIMARY KEY ("id")
);

-- Crear tabla ProcessedEmail
CREATE TABLE IF NOT EXISTS "ProcessedEmail" (
    "id" TEXT NOT NULL,
    "gmailIntegrationId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedEmail_pkey" PRIMARY KEY ("id")
);

-- Crear índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "GmailIntegration_userId_key" ON "GmailIntegration"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingQuote_gmailIntegrationId_emailId_key" ON "PendingQuote"("gmailIntegrationId", "emailId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedEmail_gmailIntegrationId_emailId_key" ON "ProcessedEmail"("gmailIntegrationId", "emailId");

-- Crear índices
CREATE INDEX IF NOT EXISTS "GmailIntegration_userId_isActive_idx" ON "GmailIntegration"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "PendingQuote_userId_status_idx" ON "PendingQuote"("userId", "status");
CREATE INDEX IF NOT EXISTS "ProcessedEmail_gmailIntegrationId_processedAt_idx" ON "ProcessedEmail"("gmailIntegrationId", "processedAt");

-- Agregar foreign keys (solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'GmailIntegration_userId_fkey'
    ) THEN
        ALTER TABLE "GmailIntegration" 
            ADD CONSTRAINT "GmailIntegration_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PendingQuote_gmailIntegrationId_fkey'
    ) THEN
        ALTER TABLE "PendingQuote" 
            ADD CONSTRAINT "PendingQuote_gmailIntegrationId_fkey" 
            FOREIGN KEY ("gmailIntegrationId") REFERENCES "GmailIntegration"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProcessedEmail_gmailIntegrationId_fkey'
    ) THEN
        ALTER TABLE "ProcessedEmail" 
            ADD CONSTRAINT "ProcessedEmail_gmailIntegrationId_fkey" 
            FOREIGN KEY ("gmailIntegrationId") REFERENCES "GmailIntegration"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

