-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "codeVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "paymentAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationCode" TEXT;
