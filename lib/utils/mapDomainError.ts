import { ErrorCode } from "../constants/error-codes";

export function mapDomainError(error: unknown) {
  if (!(error instanceof Error)) return { error: "Something went wrong" };

  switch (error.message as ErrorCode) {
    // Auth errors
    case ErrorCode.UNAUTHORIZED:
      return {
        error: "You must be logged in to perform this action",
      };
    case ErrorCode.USER_NOT_FOUND:
      return { error: "User not found" };

    // validation
    case ErrorCode.INVALID_FORM_DATA:
      return { error: "Invalid form data" };

    // Transactions
    case ErrorCode.INSUFFICIENT_BALANCE:
      return { error: "Insufficient balance" };

    case ErrorCode.PRO_FEATURE_REQUIRED:
      return {
        error: "Upgrade to Pro to use recurring transactions",
      };
    case ErrorCode.PREMIUM_FEATURE_REQUIRED:
      return {
        error: "Upgrade to Premium to access this feature",
      };
    case ErrorCode.TRANSACTION_UPDATE_FAILED:
      return { error: "Failed to update transaction" };
    case ErrorCode.TRANSACTION_DELETE_FAILED:
      return { error: "Failed to delete transactions" };
    case ErrorCode.TRANSACTION_NOT_FOUND:
      return { error: "No transaction found to delete" };
    case ErrorCode.TRANSACTION_FETCH_FAILED:
      return { error: "Failed to fetch transactions" };

    // Accounts
    case ErrorCode.ACCOUNT_NOT_FOUND:
      return { error: "Account not found" };
    case ErrorCode.ACCOUNTS_FETCH_FAILED:
      return { error: "Failed to fetch accounts" };
    case ErrorCode.LAST_DEFAULT_ACCOUNT:
      return {
        error: "You cannot delete your last default account",
      };
    case ErrorCode.ACCOUNT_ALREADY_DEFAULT:
      return {
        error: "This account is already set as default",
      };
    case ErrorCode.INVALID_BALANCE:
      return { error: "Invalid account balance" };
    case ErrorCode.ACCOUNT_CREATION_FAILED:
      return { error: "Failed to create account" };
    case ErrorCode.ACCOUNT_UPDATE_FAILED:
      return { error: "Failed to update account" };
    case ErrorCode.ACCOUNT_DELETE_FAILED:
      return { error: "Failed to delete account" };

    // Budget
    case ErrorCode.BUDGET_NOT_FOUND:
      return { error: "Budget not found" };

    case ErrorCode.BUDGET_CREATION_FAILED:
      return { error: "Failed to create budget" };

    case ErrorCode.BUDGET_UPDATE_FAILED:
      return { error: "Failed to update budget" };
    case ErrorCode.BUDGET_FETCH_FAILED:
      return { error: "Failed to fetch budget" };

    // AI Receipt Scan limit
    case ErrorCode.AI_RECEIPT_LIMIT_REACHED:
      return { error: "AI receipt scan limit reached" };

    case ErrorCode.RECEIPT_UNREADABLE:
      return {
        error: "Receipt image is unclear. Please upload a clearer photo.",
      };

    case ErrorCode.NO_TRANSACTIONS_FOR_BULK_SCAN:
      return { error: "No transactions found. try with a different file" };

    case ErrorCode.BULK_RECEIPT_NOT_ALLOWED:
      return { error: "Bulk receipt scanning is not allowed" };

    case ErrorCode.IMPORT_JOB_UPDATE_FAILED:
      return { error: "Failed to update import job status" };

    case ErrorCode.IMPORT_JOB_ID_NOT_FOUND:
      return { error: "Import job ID not found" };

    case ErrorCode.IMPORT_JOB_UPDATE_FAILED:
      return { error: "Failed to update import job status" };

    case ErrorCode.IMPORT_JOB_ALREADY_PROCESSED:
      return {
        error: "That receipt scan has already been converted into transactions",
      };

    case ErrorCode.DUPLICATE_TRANSACTION:
      return { error: "Duplicate transaction detected" };

    // Rate limiting
    case ErrorCode.RATE_LIMITED:
      return { error: "Rate limit exceeded" };
    default:
      throw error; // unknown errors → 500
  }
}
