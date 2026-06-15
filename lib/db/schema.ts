import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ------------------------------------------------------------------
// Better Auth tables
// ------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  categories: many(categories),
  monthlyPlans: many(monthlyPlans),
  recurringExpenses: many(recurringExpenses),
  installments: many(installments),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// ------------------------------------------------------------------
// Application tables
// ------------------------------------------------------------------

export const incomeStatusEnum = pgEnum("income_status", [
  "expected",
  "received",
]);

export const expenseFrequencyEnum = pgEnum("expense_frequency", [
  "monthly",
  "quarterly",
  "annual",
]);

export const categoryTypeEnum = pgEnum("category_type", [
  "fixed_expenses",
  "investments",
  "donations",
  "free_spending",
]);

export type CategoryType = typeof categoryTypeEnum.enumValues[number];

export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: categoryTypeEnum("type").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("categories_userId_idx").on(table.userId)]
);

export const monthlyPlans = pgTable(
  "monthly_plans",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    yearMonth: text("year_month").notNull(), // YYYY-MM
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("monthly_plans_userId_idx").on(table.userId),
    index("monthly_plans_yearMonth_idx").on(table.yearMonth),
  ]
);

export const income = pgTable(
  "income",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    monthlyPlanId: uuid("monthly_plan_id")
      .notNull()
      .references(() => monthlyPlans.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: incomeStatusEnum("status").default("expected").notNull(),
    expectedDate: timestamp("expected_date"),
    receivedAt: timestamp("received_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("income_monthlyPlanId_idx").on(table.monthlyPlanId)]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    monthlyPlanId: uuid("monthly_plan_id")
      .notNull()
      .references(() => monthlyPlans.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("expenses_monthlyPlanId_idx").on(table.monthlyPlanId),
    index("expenses_categoryId_idx").on(table.categoryId),
  ]
);

export const recurringExpenses = pgTable(
  "recurring_expenses",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    frequency: expenseFrequencyEnum("frequency").default("monthly").notNull(),
    startDate: timestamp("start_date").defaultNow().notNull(),
    dayOfMonth: integer("day_of_month").default(1).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("recurring_expenses_userId_idx").on(table.userId),
    index("recurring_expenses_categoryId_idx").on(table.categoryId),
  ]
);

export const installments = pgTable(
  "installments",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    totalInstallments: integer("total_installments").notNull(),
    currentInstallment: integer("current_installment").default(1).notNull(),
    installmentAmount: numeric("installment_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    remainingBalance: numeric("remaining_balance", {
      precision: 12,
      scale: 2,
    }).notNull(),
    startDate: timestamp("start_date").defaultNow().notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("installments_userId_idx").on(table.userId)]
);

export const allocationRules = pgTable(
  "allocation_rules",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    monthlyPlanId: uuid("monthly_plan_id")
      .notNull()
      .references(() => monthlyPlans.id, { onDelete: "cascade" }),
    type: categoryTypeEnum("type").notNull(),
    percentage: integer("percentage").default(0).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("allocation_rules_monthlyPlanId_idx").on(table.monthlyPlanId),
    uniqueIndex("allocation_rules_plan_type_idx").on(
      table.monthlyPlanId,
      table.type
    ),
  ]
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(user, { fields: [categories.userId], references: [user.id] }),
  expenses: many(expenses),
  recurringExpenses: many(recurringExpenses),
}));

export const monthlyPlansRelations = relations(
  monthlyPlans,
  ({ one, many }) => ({
    user: one(user, { fields: [monthlyPlans.userId], references: [user.id] }),
    income: many(income),
    expenses: many(expenses),
    allocationRules: many(allocationRules),
  })
);

export const incomeRelations = relations(income, ({ one }) => ({
  monthlyPlan: one(monthlyPlans, {
    fields: [income.monthlyPlanId],
    references: [monthlyPlans.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  monthlyPlan: one(monthlyPlans, {
    fields: [expenses.monthlyPlanId],
    references: [monthlyPlans.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const recurringExpensesRelations = relations(
  recurringExpenses,
  ({ one }) => ({
    user: one(user, {
      fields: [recurringExpenses.userId],
      references: [user.id],
    }),
    category: one(categories, {
      fields: [recurringExpenses.categoryId],
      references: [categories.id],
    }),
  })
);

export const installmentsRelations = relations(installments, ({ one }) => ({
  user: one(user, { fields: [installments.userId], references: [user.id] }),
}));

export const allocationRulesRelations = relations(
  allocationRules,
  ({ one }) => ({
    monthlyPlan: one(monthlyPlans, {
      fields: [allocationRules.monthlyPlanId],
      references: [monthlyPlans.id],
    }),
  })
);
