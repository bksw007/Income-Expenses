import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotoSansThaiBase64 } from '../fonts/NotoSansThai';
import type { AccountingEntry, UserProfile } from '../types/accounting';
import type { ProfileFormState } from '../types/accountingUi';
import { DOCUMENT_STATUS_LABEL } from './accountingConstants';
import {
  formatCurrency,
  formatThaiDate,
  getLocalDate,
  getMonthName,
  resolveSignatureName,
  resolveTaxId,
  resolveTaxPayerName,
} from './accountingHelpers';

const ensurePdfFont = (doc: jsPDF) => {
  doc.addFileToVFS('NotoSansThai.ttf', NotoSansThaiBase64);
  doc.addFont('NotoSansThai.ttf', 'NotoSansThai', 'normal');
  doc.setFont('NotoSansThai');
};

const thaiNumberWords = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const thaiPositionWords = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

const convertThaiInteger = (raw: string): string => {
  const normalized = raw.replace(/^0+/, '') || '0';
  if (normalized === '0') return thaiNumberWords[0];
  if (normalized.length > 6) {
    const millionsIndex = normalized.length - 6;
    return `${convertThaiInteger(normalized.slice(0, millionsIndex))}ล้าน${convertThaiInteger(normalized.slice(millionsIndex))}`;
  }

  return normalized
    .split('')
    .map((digitRaw, index, list) => {
      const digit = Number(digitRaw);
      if (digit === 0) return '';

      const position = list.length - index - 1;
      if (position === 0 && digit === 1 && list.length > 1) return 'เอ็ด';
      if (position === 1 && digit === 1) return 'สิบ';
      if (position === 1 && digit === 2) return `ยี่${thaiPositionWords[position]}`;

      return `${thaiNumberWords[digit]}${thaiPositionWords[position]}`;
    })
    .join('');
};

const numberToThaiBaht = (value: number) => {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const [bahtPart, satangPart] = safe.toFixed(2).split('.');
  const bahtText = convertThaiInteger(bahtPart);
  const satangValue = Number(satangPart);
  if (satangValue === 0) return `${bahtText}บาทถ้วน`;
  return `${bahtText}บาท${convertThaiInteger(satangPart)}สตางค์`;
};

const getAddressLines = (address: string | undefined, doc: jsPDF, width: number) => {
  const trimmedAddress = address?.trim();
  if (!trimmedAddress) return ['-'];
  const wrappedLines = doc.splitTextToSize(trimmedAddress, width) as string[];
  return wrappedLines.length > 0 ? wrappedLines.slice(0, 3) : ['-'];
};

export const exportLedgerPdf = (
  entries: AccountingEntry[],
  profile: ProfileFormState | UserProfile | null,
  month: number,
  year: number,
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  ensurePdfFont(doc);

  const totalIncome = entries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = entries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
  const businessYear = year + 543;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text('สมุดบัญชีรายรับ - รายจ่าย', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(11);
  const ledgerAddressLines = getAddressLines(profile?.address, doc, 136);
  doc.text(`ชื่อผู้ประกอบการ: ${resolveTaxPayerName(profile)}`, 14, 26);
  doc.text(`เลขผู้เสียภาษี/เลขบัตรประชาชน: ${resolveTaxId(profile)}`, 14, 32);
  doc.text(`สาขา: ${profile?.businessBranchName?.trim() || 'สำนักงานใหญ่'}`, 14, 38);
  doc.text('ที่อยู่:', 14, 44);
  ledgerAddressLines.forEach((line, index) => {
    doc.text(line, 24, 44 + index * 5.5);
  });
  doc.text(`ประจำเดือน ${getMonthName(month)} ${businessYear}`, 14, 62);
  doc.text(`พิมพ์เมื่อ ${formatThaiDate(getLocalDate())}`, pageWidth - 14, 62, { align: 'right' });

  autoTable(doc, {
    startY: 68,
    margin: { left: 10, right: 10 },
    styles: {
      font: 'NotoSansThai',
      fontSize: 8,
      cellPadding: 1.8,
      lineColor: [191, 199, 213],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 123, 86],
      textColor: 255,
      fontStyle: 'normal',
    },
    bodyStyles: {
      textColor: [31, 41, 55],
    },
    head: [['วัน/เดือน/ปี', 'เลขที่อ้างอิง', 'รายการ', 'คู่ค้า/ร้านค้า', 'หลักฐาน', 'รายรับ', 'รายจ่าย']],
    body: entries.map((entry) => [
      formatThaiDate(entry.transactionDate),
      entry.referenceNo || '-',
      `${entry.description}${entry.category ? ` (${entry.category})` : ''}`,
      entry.counterpartyName || '-',
      DOCUMENT_STATUS_LABEL[entry.documentStatus],
      entry.type === 'income' ? formatCurrency(entry.amount) : '',
      entry.type === 'expense' ? formatCurrency(entry.amount) : '',
    ]),
    foot: [['', '', 'รวมทั้งเดือน', '', '', formatCurrency(totalIncome), formatCurrency(totalExpense)]],
    footStyles: {
      fillColor: [236, 253, 245],
      textColor: [6, 78, 59],
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 24 },
      2: { cellWidth: 58 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;
  doc.setFontSize(11);
  doc.text(`สรุปรายรับ ${formatCurrency(totalIncome)} บาท`, 14, finalY + 10);
  doc.text(`สรุปรายจ่าย ${formatCurrency(totalExpense)} บาท`, 14, finalY + 16);
  doc.text(`คงเหลือสุทธิ ${formatCurrency(totalIncome - totalExpense)} บาท`, 14, finalY + 22);
  doc.setFontSize(9);
  doc.text(
    'หมายเหตุ: รายการที่ไม่มีใบเสร็จควรจัดเก็บเลขอ้างอิงเรียงตามเดือน พร้อมแนบใบรับรองแทนใบเสร็จหรือหลักฐานประกอบอื่น',
    14,
    finalY + 30,
  );

  doc.save(`accounting-ledger-${year}-${String(month).padStart(2, '0')}.pdf`);
};

export const exportReplacementReceiptPdf = (
  entry: AccountingEntry,
  profile: ProfileFormState | UserProfile | null,
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  ensurePdfFont(doc);

  doc.setFontSize(17);
  doc.text('ใบรับรองแทนใบเสร็จรับเงิน', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  const receiptAddressLines = getAddressLines(profile?.address, doc, 136);
  doc.text(`เลขที่อ้างอิง ${entry.referenceNo || '-'}`, 195, 26, { align: 'right' });
  doc.text(`ชื่อผู้ประกอบการ: ${resolveTaxPayerName(profile)}`, 14, 32);
  doc.text(`เลขผู้เสียภาษี/เลขบัตรประชาชน: ${resolveTaxId(profile)}`, 14, 38);
  doc.text(`สาขา: ${profile?.businessBranchName?.trim() || 'สำนักงานใหญ่'}`, 14, 44);
  doc.text('ที่อยู่:', 14, 50);
  receiptAddressLines.forEach((line, index) => {
    doc.text(line, 24, 50 + index * 5.5);
  });
  doc.text('ขอรับรองว่าได้จ่ายเงินตามรายการต่อไปนี้จริง และไม่สามารถเรียกใบเสร็จรับเงินจากผู้รับเงินได้', 14, 68);

  autoTable(doc, {
    startY: 74,
    margin: { left: 10, right: 10 },
    styles: {
      font: 'NotoSansThai',
      fontSize: 9,
      cellPadding: 2,
      lineColor: [191, 199, 213],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 123, 86],
      textColor: 255,
      fontStyle: 'normal',
    },
    head: [['วัน/เดือน/ปี', 'รายละเอียดรายจ่าย', 'ผู้รับเงิน/ร้านค้า', 'จำนวนเงิน (บาท)']],
    body: [[
      formatThaiDate(entry.transactionDate),
      `${entry.description}${entry.category ? ` (${entry.category})` : ''}`,
      entry.counterpartyName || '-',
      formatCurrency(entry.amount),
    ]],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 82 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, halign: 'right' },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFontSize(10);
  const reasonLines = doc.splitTextToSize(
    `เหตุผลที่ไม่สามารถเรียกใบเสร็จรับเงิน: ${entry.reasonNoReceipt?.trim() || '-'}`,
    182,
  );
  doc.text(reasonLines, 14, finalY + 10);
  doc.text(`จำนวนเงินตัวอักษร: ${numberToThaiBaht(entry.amount)}`, 14, finalY + 22);
  doc.text(
    'เอกสารฉบับนี้ใช้ประกอบรายจ่ายกรณีไม่มีใบเสร็จรับเงิน และควรแนบสลิปโอน/รูปถ่าย/หลักฐานอื่นของรายการเดียวกันไว้ด้วย',
    14,
    finalY + 30,
  );

  doc.text('ลงชื่อ .......................................................... ผู้รับรองรายการ', 118, 245, { align: 'center' });
  doc.text(`(${resolveSignatureName(profile)})`, 118, 253, { align: 'center' });
  doc.text(`วันที่ ${formatThaiDate(getLocalDate())}`, 118, 261, { align: 'center' });

  doc.save(`replacement-receipt-${entry.referenceNo || entry.id}.pdf`);
};
