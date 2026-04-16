import React, { useEffect, useState } from 'react';
import { Check, X, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../types/accounting';
import { getAllUserProfiles, setUserStatus } from '../lib/supabaseStorage';

interface UserApprovalProps {
  currentUserUid: string;
}

const statusBadge = (status?: string) => {
  if (status === 'approved')
    return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">อนุมัติแล้ว</span>;
  if (status === 'rejected')
    return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">ปฏิเสธ</span>;
  return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">รออนุมัติ</span>;
};

const UserApproval: React.FC<UserApprovalProps> = ({ currentUserUid }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await getAllUserProfiles();
      setUsers(all);
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleAction = async (uid: string, status: 'approved' | 'rejected') => {
    setActing(uid);
    try {
      await setUserStatus(uid, status);
      await load();
    } catch {
      setError('ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1A1818]">อนุมัติผู้ใช้</h2>
          <p className="mt-1 text-sm text-[#8C8074]">จัดการสิทธิ์การเข้าถึงระบบของผู้ใช้</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl border border-[#E8DFCF] bg-white px-3 py-2 text-sm text-[#5A5248] transition hover:bg-[#FAF7F2] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#D97757] border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8C8074]">ยังไม่มีผู้ใช้</p>
      ) : (
        <div className="divide-y divide-[#E8DFCF] rounded-2xl border border-[#E8DFCF] bg-white overflow-hidden">
          {users.map((u) => (
            <div key={u.uid} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1A1818]">
                  {u.displayName || u.fullName || '—'}
                  {u.uid === currentUserUid && (
                    <span className="ml-2 text-xs font-normal text-[#8C8074]">(คุณ)</span>
                  )}
                </p>
                <p className="truncate text-xs text-[#8C8074]">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(u.status)}
                {u.uid !== currentUserUid && u.status === 'pending' && (
                  <>
                    <button
                      onClick={() => void handleAction(u.uid, 'approved')}
                      disabled={acting === u.uid}
                      title="อนุมัติ"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => void handleAction(u.uid, 'rejected')}
                      disabled={acting === u.uid}
                      title="ปฏิเสธ"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;
