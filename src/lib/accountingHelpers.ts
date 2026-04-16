import type { AccountingEntry, AccountingEntryType, UserProfile } from '../types/accounting';
import type { EntryFormState, ProfileFormState, ProfileLike } from '../types/accountingUi';
import { MONTHS } from './accountingConstants';

export const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatAmountInput = (raw: string) => {
  if (!raw) return '';
  const [integerPartRaw, decimalPart] = raw.split('.');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const formattedInteger = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(integerPart));

  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

export const formatThaiDate = (value: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 543}`;
};

export const getMonthName = (month: number) => MONTHS.find((item) => item.value === month)?.label || '';

export const parseAmount = (raw: string) => {
  const amount = Number(raw.replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const createEmptyEntryForm = (type: AccountingEntryType): EntryFormState => ({
  type,
  transactionDate: getLocalDate(),
  amountInput: '',
  paymentMethod: type === 'income' ? 'transfer' : 'cash',
  description: '',
  category: '',
  counterpartyName: '',
  counterpartyTaxId: '',
  referenceNo: '',
  note: '',
  documentStatus: 'receipt',
  reasonNoReceipt: '',
});

export const createProfileForm = (profile: UserProfile | null): ProfileFormState => ({
  fullName: profile?.fullName || profile?.displayName || '',
  citizenId: profile?.citizenId || '',
  businessName: profile?.businessName || '',
  businessTaxId: profile?.businessTaxId || '',
  businessBranchName: profile?.businessBranchName || 'สำนักงานใหญ่',
  address: profile?.address || '',
  signatureName: profile?.signatureName || profile?.fullName || profile?.displayName || '',
});

const getDisplayName = (profile: ProfileLike) =>
  profile && 'displayName' in profile ? profile.displayName?.trim() || '' : '';

export const resolveTaxPayerName = (profile: ProfileLike) =>
  profile?.businessName?.trim() || profile?.fullName?.trim() || getDisplayName(profile) || '-';

export const resolveTaxId = (profile: ProfileLike) =>
  profile?.businessTaxId?.trim() || profile?.citizenId?.trim() || '-';

export const resolveSignatureName = (profile: ProfileLike) =>
  profile?.signatureName?.trim() || profile?.fullName?.trim() || getDisplayName(profile) || '-';

export const createReferenceNo = (
  entries: AccountingEntry[],
  transactionDate: string,
  type: AccountingEntryType,
): string => {
  const prefix = type === 'income' ? 'RV' : 'PV';
  const monthKey = transactionDate.slice(0, 7).replace('-', '');
  const sequence =
    entries
      .filter((entry) => entry.type === type && entry.transactionDate.startsWith(transactionDate.slice(0, 7)))
      .map((entry) => {
        const match = (entry.referenceNo || '').match(/(\d{3,})$/);
        return match ? Number(match[1]) : 0;
      })
      .reduce((max, value) => Math.max(max, value), 0) + 1;

  return `${prefix}-${monthKey}-${String(sequence).padStart(3, '0')}`;
};

export const getDocumentHint = (status: 'receipt' | 'replacement_receipt' | 'other_evidence') => {
  if (status === 'replacement_receipt') return 'ไม่มีใบเสร็จ ให้ระบุเหตุผลและเก็บหลักฐานประกอบ';
  if (status === 'other_evidence') return 'ใช้สลิปหรือเอกสารอื่น ควรแนบคำอธิบายสั้นๆ';
  return 'มีใบเสร็จหรือใบกำกับภาษีแล้ว';
};

export const validateProfileForTaxPdf = (profile: ProfileLike): string[] => {
  const missing: string[] = [];
  if (!resolveTaxPayerName(profile) || resolveTaxPayerName(profile) === '-') {
    missing.push('ชื่อผู้ประกอบการ/ชื่อผู้เสียภาษี');
  }
  if (!resolveTaxId(profile) || resolveTaxId(profile) === '-') {
    missing.push('เลขผู้เสียภาษีหรือเลขบัตรประชาชน');
  }
  if (!resolveSignatureName(profile) || resolveSignatureName(profile) === '-') {
    missing.push('ชื่อผู้ลงนาม');
  }
  return missing;
};
