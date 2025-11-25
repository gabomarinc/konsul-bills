-- Verificar y crear solo lo que falta
-- Este SQL es seguro de ejecutar múltiples veces

-- Verificar que las tablas existan (ya existen según el error)
-- Solo verificamos índices y foreign keys

-- Crear índices únicos (si no existen)
CREATE UNIQUE INDEX IF NOT EXISTS "GmailIntegration_userId_key" ON "public"."GmailIntegration"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingQuote_gmailIntegrationId_emailId_key" ON "public"."PendingQuote"("gmailIntegrationId", "emailId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedEmail_gmailIntegrationId_emailId_key" ON "public"."ProcessedEmail"("gmailIntegrationId", "emailId");

-- Crear índices (si no existen)
CREATE INDEX IF NOT EXISTS "GmailIntegration_userId_isActive_idx" ON "public"."GmailIntegration"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "PendingQuote_userId_status_idx" ON "public"."PendingQuote"("userId", "status");
CREATE INDEX IF NOT EXISTS "ProcessedEmail_gmailIntegrationId_processedAt_idx" ON "public"."ProcessedEmail"("gmailIntegrationId", "processedAt");

-- Agregar foreign keys solo si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'GmailIntegration_userId_fkey'
    ) THEN
        ALTER TABLE "public"."GmailIntegration" 
            ADD CONSTRAINT "GmailIntegration_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PendingQuote_gmailIntegrationId_fkey'
    ) THEN
        ALTER TABLE "public"."PendingQuote" 
            ADD CONSTRAINT "PendingQuote_gmailIntegrationId_fkey" 
            FOREIGN KEY ("gmailIntegrationId") REFERENCES "public"."GmailIntegration"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProcessedEmail_gmailIntegrationId_fkey'
    ) THEN
        ALTER TABLE "public"."ProcessedEmail" 
            ADD CONSTRAINT "ProcessedEmail_gmailIntegrationId_fkey" 
            FOREIGN KEY ("gmailIntegrationId") REFERENCES "public"."GmailIntegration"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

