import type { AccountingDocumentStatus, AccountingPaymentMethod } from '../types/accounting';

export const MONTHS = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' },
] as const;

export const INCOME_CATEGORIES = ['ค่าขนส่ง', 'รายรับลูกค้า', 'รับคืนเงิน', 'รายได้อื่นๆ'];

export const EXPENSE_CATEGORIES = [
  'ค่าน้ำมัน',
  'ค่าทางด่วน',
  'ค่าแรง',
  'ค่าซ่อมบำรุง',
  'ค่าอะไหล่',
  'ค่าใช้จ่ายสำนักงาน',
  'ค่าใช้จ่ายหน้างาน',
  'ค่าใช้จ่ายอื่นๆ',
];

export const ACCOUNTING_CATEGORY_STORAGE_KEY = 'admin-accounting-category-options';

export const MOBILE_KEYPAD_KEYS = [
  { key: '7', label: '7' },
  { key: '8', label: '8' },
  { key: '9', label: '9' },
  { key: 'Del', label: 'ลบ' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: 'C', label: 'C' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '.', label: '.' },
  { key: '0', label: '0', span: 'col-span-4' },
] as const;

export const PAYMENT_METHOD_LABEL: Record<AccountingPaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'เงินโอน',
  card: 'บัตร',
  other: 'อื่นๆ',
};

export const DOCUMENT_STATUS_LABEL: Record<AccountingDocumentStatus, string> = {
  receipt: 'มีใบเสร็จ/ใบกำกับ',
  replacement_receipt: 'ใบรับรองแทนใบเสร็จ',
  other_evidence: 'หลักฐานอื่น',
};
