/*
  Warnings:

  - You are about to drop the `MessageTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "messaging"."MessageTemplate" DROP CONSTRAINT "MessageTemplate_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."MessageTemplate" DROP CONSTRAINT "MessageTemplate_userId_fkey";

-- DropTable
DROP TABLE "messaging"."MessageTemplate";
