# Database Setup

In the real world, we'd want to use a database to store the user's personal finance history.

For this tutorial, we'll use a local SQLite database.

## Creating the database

```typescript title="src/lib/db/index.ts"
import { PrismaClient } from "@prisma/client";
import { initializeDb } from "./init";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Initialize the database when this module is imported
(async () => {
  try {
    await initializeDb(prisma);
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
})();

// Handle cleanup when the Node process is terminated
process.on("beforeExit", async () => {
  await prisma?.$disconnect();
});

export default prisma;
```

## Filling it up with mock data
Since we don't have a real database, we'll need to fill it up with mock data.

```typescript title="src/lib/db/init.ts"
import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";

export async function initializeDb(prisma: PrismaClient) {
  // Check if there are any existing transactions
  const existingTransaction = await prisma.transaction.findFirst();

  if (!existingTransaction) {
    const debitCategories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Shopping",
      "Education",
    ];

    const creditCategories = [
      "Salary",
      "Investment",
      "Refund",
      "Gift",
      "Bonus",
    ];

    let balance = 0;
    // Generate transactions with approximately 5:1 ratio of debits to credits
    const transactions = Array.from({ length: 100 }, (_, i) => {
      const transactionType = i % 6 === 0 ? "credit" : "debit";
      const amount = Number((Math.random() * 490 + 10).toFixed(2)); // Random amount between 10 and 500, rounded to 2 decimal places
      const finalAmount = transactionType === "credit" ? amount : -amount;
      balance += finalAmount;

      const category =
        transactionType === "credit"
          ? creditCategories[
              Math.floor(Math.random() * creditCategories.length)
            ]
          : debitCategories[Math.floor(Math.random() * debitCategories.length)];

      const date = new Date();
      date.setDate(date.getDate() - randomInt(1, 365)); // Random date within the last year

      return {
        date,
        amount: finalAmount,
        balance,
        category,
        description: "Mock transaction",
        transaction_type: transactionType,
      };
    });

    // Create all transactions in a single transaction
    await prisma.transaction.createMany({
      data: transactions,
    });
  }
}
```

## Check that the database is setup correctly

```sh
npx prisma studio
```
