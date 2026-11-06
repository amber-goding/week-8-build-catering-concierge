-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('MANUAL', 'EMAIL', 'WEB_FORM');

-- CreateEnum
CREATE TYPE "InquiryStage" AS ENUM ('NEW', 'NEEDS_DETAILS', 'QUOTING', 'AWAITING_CLIENT', 'CONFIRMED');

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "source" "InquirySource" NOT NULL,
    "stage" "InquiryStage" NOT NULL DEFAULT 'NEW',
    "eventName" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "eventDate" DATE,
    "guestCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_restaurantId_stage_createdAt_idx" ON "Inquiry"("restaurantId", "stage", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_restaurantId_createdAt_idx" ON "Inquiry"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_restaurantId_eventDate_idx" ON "Inquiry"("restaurantId", "eventDate");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
