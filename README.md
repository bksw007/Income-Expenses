# Accounting Prototype Extraction

โฟลเดอร์นี้เป็น starter extraction ของระบบ `รายรับ-รายจ่าย` ที่ดึงออกจาก Trucklog เพื่อให้ย้ายไปต่อยอดเป็นโปรเจคใหม่ได้ง่ายขึ้น

## สิ่งที่ตัดออกแล้ว

- `AuthContext`
- `ThemeContext`
- Firebase Firestore / Storage
- user profile service ของระบบหลัก
- routing ของแอพเดิม

## สิ่งที่ยังคงไว้

- หน้ารายรับ-รายจ่ายหลัก
- บันทึกรับ / บันทึกจ่าย / ภาพรวม / ประวัติ / ข้อมูลผู้เสียภาษี
- PDF ledger และใบรับรองแทนใบเสร็จ
- modal ยืนยัน / แจ้งเตือน
- ฟอนต์ไทยสำหรับ PDF

## storage ที่ใช้ใน prototype

- `accounting-prototype:entries`
- `accounting-prototype:profile`
- `admin-accounting-category-options`

## ไฟล์หลัก

- `src/AccountingPrototype.tsx` หน้า feature หลัก
- `src/lib/accountingStorage.ts` local repository สำหรับ prototype
- `src/types/accounting.ts` type ที่ย้ายออกมา
- `src/components/ConfirmModal.tsx`
- `src/fonts/NotoSansThai.ts`

## วิธีรันหลังย้ายโฟลเดอร์ออก

```bash
npm install
npm run dev
```

## ขั้นถัดไปที่แนะนำ

1. เปลี่ยน local storage repository เป็น backend ใหม่
2. แยก PDF helpers ออกเป็น `src/lib/pdf/`
3. แยก business logic จาก component หลัก
4. ทำ branding และ route structure ใหม่
