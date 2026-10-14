-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "emailInfo" TEXT,
ADD COLUMN     "emailStatus" "EmailStatus";
