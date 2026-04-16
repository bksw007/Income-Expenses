import React from 'react';
import AccountingPrototype from './AccountingPrototype';

const App: React.FC = () => {
  return (
    <main className="admin-clay min-h-screen bg-[#eef4f6] px-4 py-4 text-slate-900 md:px-6">
      <div className="mx-auto mb-4 max-w-7xl rounded-3xl border border-[#dce7de] bg-white px-5 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Starter Extraction</p>
        <h1 className="mt-2 text-2xl font-black">Accounting Prototype</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          โฟลเดอร์นี้เป็นต้นแบบที่แยกจาก Trucklog แล้ว ใช้ local storage เก็บข้อมูลรายรับ-รายจ่ายและข้อมูลผู้เสียภาษี
          เพื่อให้ย้ายออกไปต่อยอดเป็นโปรเจคใหม่ได้ทันที
        </p>
      </div>
      <AccountingPrototype />
    </main>
  );
};

export default App;
