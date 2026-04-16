export type AccountingEntryType = 'income' | 'expense';
export type AccountingPaymentMethod = 'cash' | 'transfer' | 'card' | 'other';
export type AccountingDocumentStatus = 'receipt' | 'replacement_receipt' | 'other_evidence';

export interface AccountingEntry {
  id: string;
  transactionDate: string;
  type: AccountingEntryType;
  amount: number;
  paymentMethod: AccountingPaymentMethod;
  description: string;
  category: string;
  counterpartyName?: string;
  counterpartyTaxId?: string;
  referenceNo?: string;
  note?: string;
  documentStatus: AccountingDocumentStatus;
  reasonNoReceipt?: string;
  proofUrls?: string[];
  createdByUid?: string;
  createdByName?: string;
  updatedAt?: number;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName?: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
  citizenId?: string;
  businessName?: string;
  businessTaxId?: string;
  businessBranchName?: string;
  address?: string;
  signatureName?: string;
  profileUpdatedAt?: number;
  status?: 'pending' | 'approved' | 'rejected';
}
