/*
  Warnings:

  - A unique constraint covering the columns `[userId,accountId,date,amount,description]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "transactions_accountId_idx";

-- DropIndex
DROP INDEX "transactions_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "transactions_userId_accountId_date_amount_description_key" ON "transactions"("userId", "accountId", "date", "amount", "description");
