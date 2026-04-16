import type {
  AccountingDocumentStatus,
  AccountingEntryType,
  AccountingPaymentMethod,
  UserProfile,
} from './accounting';

export type AccountingTab = 'income' | 'expense' | 'summary' | 'history' | 'profile' | 'admin';
export type HistoryFilter = 'all' | 'income' | 'expense';

export type EntryFormState = {
  id?: string;
  type: AccountingEntryType;
  transactionDate: string;
  amountInput: string;
  paymentMethod: AccountingPaymentMethod;
  description: string;
  category: string;
  counterpartyName: string;
  counterpartyTaxId: string;
  referenceNo: string;
  note: string;
  documentStatus: AccountingDocumentStatus;
  reasonNoReceipt: string;
};

export type ProfileFormState = {
  fullName: string;
  citizenId: string;
  businessName: string;
  businessTaxId: string;
  businessBranchName: string;
  address: string;
  signatureName: string;
};

export type AlertModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
};

export type ProfileLike = ProfileFormState | UserProfile | null;
