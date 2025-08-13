-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "messageText" TEXT,
    "templateName" TEXT,
    "templateParams" TEXT,
    "mediaUrl" TEXT,
    "mediaId" TEXT,
    "wamid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "clinicaId" TEXT,
    "userId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "components" TEXT NOT NULL,
    "example" TEXT,
    "clinicaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsAppWebhook" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clinicaId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "public"."PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationToken_token_key" ON "public"."PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_userId_idx" ON "public"."PushNotificationToken"("userId");

-- CreateIndex
CREATE INDEX "PushNotificationToken_token_idx" ON "public"."PushNotificationToken"("token");

-- CreateIndex
CREATE INDEX "PushNotificationToken_platform_idx" ON "public"."PushNotificationToken"("platform");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_to_idx" ON "public"."WhatsAppMessage"("to");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "public"."WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_clinicaId_idx" ON "public"."WhatsAppMessage"("clinicaId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_userId_idx" ON "public"."WhatsAppMessage"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_wamid_idx" ON "public"."WhatsAppMessage"("wamid");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_name_idx" ON "public"."WhatsAppTemplate"("name");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_status_idx" ON "public"."WhatsAppTemplate"("status");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_clinicaId_idx" ON "public"."WhatsAppTemplate"("clinicaId");

-- CreateIndex
CREATE INDEX "WhatsAppWebhook_eventType_idx" ON "public"."WhatsAppWebhook"("eventType");

-- CreateIndex
CREATE INDEX "WhatsAppWebhook_processed_idx" ON "public"."WhatsAppWebhook"("processed");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_clinicaId_idx" ON "public"."AuditLog"("clinicaId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "public"."AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "public"."AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
