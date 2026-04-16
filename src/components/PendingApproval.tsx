import React from 'react';
import { Clock, LogOut } from 'lucide-react';

interface PendingApprovalProps {
  status?: 'pending' | 'rejected';
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ status = 'pending', onLogout }) => {
  const isRejected = status === 'rejected';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#E8DFCF] bg-white px-6 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF0EA]">
          <Clock size={32} className="text-[#D97757]" />
        </div>

        <h2 className="mt-5 text-xl font-black text-[#1A1818]">
          {isRejected ? 'ไม่ได้รับการอนุมัติ' : 'รอการอนุมัติ'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#8C8074]">
          {isRejected
            ? 'บัญชีของคุณไม่ได้รับการอนุมัติจากผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบ'
            : 'บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอสักครู่'}
        </p>

        <button
          onClick={onLogout}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E8DFCF] px-4 py-2.5 text-sm font-medium text-[#5A5248] transition hover:bg-[#FAF7F2]"
        >
          <LogOut size={15} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
