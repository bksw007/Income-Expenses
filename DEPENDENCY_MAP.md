# Dependency Map

เอกสารนี้สรุปว่า prototype บัญชีที่ extract ออกมา ตอนนี้พึ่งอะไรอยู่บ้าง และเวลาจะย้ายไปโปรเจคใหม่ควรแกะตรงไหนก่อน

## Feature Entry

- `src/AccountingPrototype.tsx`
  - หน้าหลักของระบบ
  - ดูแล tab, form state, save/edit/delete flow, summary, history, profile

## Local Modules

### UI

- `src/components/ConfirmModal.tsx`
  - modal กลางสำหรับ alert / confirm

### Types

- `src/types/accounting.ts`
  - core domain types
  - `AccountingEntry`
  - `AccountingEntryType`
  - `AccountingPaymentMethod`
  - `AccountingDocumentStatus`
  - `UserProfile`

- `src/types/accountingUi.ts`
  - UI-only types
  - `AccountingTab`
  - `HistoryFilter`
  - `EntryFormState`
  - `ProfileFormState`
  - `AlertModalState`

### Constants

- `src/lib/accountingConstants.ts`
  - เดือน
  - หมวดรายรับ/รายจ่าย
  - keypad layout
  - label maps

### Business Helpers

- `src/lib/accountingHelpers.ts`
  - date helpers
  - amount formatters
  - reference number
  - profile form mapping
  - validation ก่อน export PDF

### PDF

- `src/lib/accountingPdf.ts`
  - `exportLedgerPdf`
  - `exportReplacementReceiptPdf`
  - ฟอนต์ไทย
  - helper สำหรับเลขเงินบาทและ layout PDF

### Persistence

- `src/lib/accountingStorage.ts`
  - local storage repository ของ prototype
  - แทน Firestore / Storage ชั่วคราว
  - จุดนี้คือ adapter แรกที่ควรเปลี่ยนเมื่อย้ายไป backend ใหม่

## External Packages

- `react`
- `react-dom`
- `lucide-react`
- `jspdf`
- `jspdf-autotable`
- `vite`
- `tailwindcss`

## สิ่งที่ถูกตัดออกจาก Trucklog แล้ว

- `AuthContext`
- `ThemeContext`
- Firebase Firestore / Storage
- User service ของระบบหลัก
- route/query param ของระบบหลัก

## จุดที่ควรเปลี่ยนก่อนใช้งานจริง

### 1. storage layer

ไฟล์:
- `src/lib/accountingStorage.ts`

แนะนำ:
- เปลี่ยนเป็น repository interface เช่น
  - `listEntries`
  - `createEntry`
  - `updateEntry`
  - `deleteEntry`
  - `uploadProofs`
  - `getProfile`
  - `saveProfile`

### 2. auth / owner model

ตอนนี้ใช้ user demo:
- `DEMO_USER`

ถ้าจะใช้จริงควรเปลี่ยนเป็น auth ของโปรเจคใหม่

### 3. PDF branding

ไฟล์:
- `src/lib/accountingPdf.ts`

ควรแยกต่อในอนาคต:
- `ledgerPdf.ts`
- `replacementReceiptPdf.ts`

### 4. large component split

ตอนนี้ `src/AccountingPrototype.tsx` ยังเป็น orchestrator หลัก

ขั้นต่อไปที่เหมาะ:
- `components/EntryFormSection.tsx`
- `components/SummaryPanel.tsx`
- `components/HistoryList.tsx`
- `components/ProfileForm.tsx`
