export const FEATURES = {
  // PRO FEATURES
  RECURRING_TRANSACTIONS: "recurring_transactions",
  AI_RECEIPT_SCAN: "unlimited_ai_receipt_scans",
  BUDGET_ALERT_EMAILS: "budget_alert_emails",
  AI_SEPENDING_INSIGHTS: "ai_spending_insights",

  // PREMIUM FEATURES
  MULTIPLE_ACCOUNTS: "multiple_accounts",
  AI_FINANCE_CHATBOT: "ai_finance_chatbot",
  CSV_EXCEL_EXPORT: "csv_excel_export",
  AI_BULK_INSERT: "ai_bulk_insert",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];
