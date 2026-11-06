-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "aiReview" TEXT,
ADD COLUMN     "inquiryMessage" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zapierRecordId" TEXT,
ADD COLUMN     "zapierTableId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_restaurantId_zapierTableId_zapierRecordId_key" ON "Inquiry"("restaurantId", "zapierTableId", "zapierRecordId");
