import type { AccountingEntry, UserProfile } from '../types/accounting';
import { supabase } from './supabaseClient';

// ── helpers ────────────────────────────────────────────────────────────────

const toEntry = (row: Record<string, unknown>): AccountingEntry => ({
  id: row.id as string,
  transactionDate: row.transaction_date as string,
  type: row.type as AccountingEntry['type'],
  amount: Number(row.amount),
  paymentMethod: row.payment_method as AccountingEntry['paymentMethod'],
  description: (row.description as string) ?? '',
  category: (row.category as string) ?? '',
  counterpartyName: row.counterparty_name as string | undefined,
  counterpartyTaxId: row.counterparty_tax_id as string | undefined,
  referenceNo: row.reference_no as string | undefined,
  note: row.note as string | undefined,
  documentStatus: row.document_status as AccountingEntry['documentStatus'],
  reasonNoReceipt: row.reason_no_receipt as string | undefined,
  proofUrls: (row.proof_urls as string[]) ?? [],
  createdByName: row.created_by_name as string | undefined,
  timestamp: new Date(row.created_at as string).getTime(),
  updatedAt: new Date(row.updated_at as string).getTime(),
});

const toProfile = (row: Record<string, unknown>): UserProfile => ({
  uid: row.uid as string,
  email: row.email as string,
  displayName: (row.display_name as string) ?? '',
  fullName: row.full_name as string | undefined,
  role: (row.role as 'admin' | 'user') ?? 'user',
  citizenId: row.citizen_id as string | undefined,
  businessName: row.business_name as string | undefined,
  businessTaxId: row.business_tax_id as string | undefined,
  businessBranchName: (row.business_branch_name as string) ?? 'สำนักงานใหญ่',
  address: row.address as string | undefined,
  signatureName: row.signature_name as string | undefined,
  createdAt: new Date(row.created_at as string).getTime(),
  profileUpdatedAt: new Date(row.updated_at as string).getTime(),
  status: (row.status as 'pending' | 'approved' | 'rejected') ?? 'pending',
});

// ── profile ────────────────────────────────────────────────────────────────

export const getAccountingProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('uid', user.id)
    .single();
  return data ? toProfile(data as Record<string, unknown>) : null;
};

export const updateAccountingProfile = async (patch: Partial<UserProfile>): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const updateData: Record<string, unknown> = {};
  if (patch.displayName !== undefined) updateData.display_name = patch.displayName;
  if (patch.fullName !== undefined) updateData.full_name = patch.fullName;
  if (patch.citizenId !== undefined) updateData.citizen_id = patch.citizenId;
  if (patch.businessName !== undefined) updateData.business_name = patch.businessName;
  if (patch.businessTaxId !== undefined) updateData.business_tax_id = patch.businessTaxId;
  if (patch.businessBranchName !== undefined) updateData.business_branch_name = patch.businessBranchName;
  if (patch.address !== undefined) updateData.address = patch.address;
  if (patch.signatureName !== undefined) updateData.signature_name = patch.signatureName;
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('uid', user.id)
    .select()
    .single();
  if (error) throw error;
  return toProfile(data as Record<string, unknown>);
};

// ── proof uploads ──────────────────────────────────────────────────────────

export const uploadAccountingProofs = async (files: File[], entryId: string): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${entryId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('proofs').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('proofs').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
};

// ── entries ────────────────────────────────────────────────────────────────

export const subscribeToAccountingEntries = (
  callback: (entries: AccountingEntry[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  let active = true;

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !active) return;
    const { data, error } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('uid', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { onError?.(error); return; }
    if (active) callback((data as Record<string, unknown>[]).map(toEntry));
  };

  fetch();

  const channel = supabase
    .channel('accounting_entries_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_entries' }, () => fetch())
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
};

export const addAccountingEntry = async (
  entry: Omit<AccountingEntry, 'id' | 'timestamp'>,
  proofFiles: File[] = [],
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const tempId = `temp-${Date.now()}`;
  const proofUrls = proofFiles.length > 0 ? await uploadAccountingProofs(proofFiles, tempId) : [];
  const { data, error } = await supabase
    .from('accounting_entries')
    .insert({
      uid: user.id,
      transaction_date: entry.transactionDate,
      type: entry.type,
      amount: entry.amount,
      payment_method: entry.paymentMethod,
      description: entry.description,
      category: entry.category,
      counterparty_name: entry.counterpartyName,
      counterparty_tax_id: entry.counterpartyTaxId,
      reference_no: entry.referenceNo,
      note: entry.note,
      document_status: entry.documentStatus,
      reason_no_receipt: entry.reasonNoReceipt,
      proof_urls: proofUrls,
      created_by_name: entry.createdByName,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
};

export const updateAccountingEntry = async (
  id: string,
  patch: Partial<Omit<AccountingEntry, 'id' | 'timestamp'>>,
): Promise<void> => {
  const updateData: Record<string, unknown> = {};
  if (patch.transactionDate !== undefined) updateData.transaction_date = patch.transactionDate;
  if (patch.type !== undefined) updateData.type = patch.type;
  if (patch.amount !== undefined) updateData.amount = patch.amount;
  if (patch.paymentMethod !== undefined) updateData.payment_method = patch.paymentMethod;
  if (patch.description !== undefined) updateData.description = patch.description;
  if (patch.category !== undefined) updateData.category = patch.category;
  if (patch.counterpartyName !== undefined) updateData.counterparty_name = patch.counterpartyName;
  if (patch.counterpartyTaxId !== undefined) updateData.counterparty_tax_id = patch.counterpartyTaxId;
  if (patch.referenceNo !== undefined) updateData.reference_no = patch.referenceNo;
  if (patch.note !== undefined) updateData.note = patch.note;
  if (patch.documentStatus !== undefined) updateData.document_status = patch.documentStatus;
  if (patch.reasonNoReceipt !== undefined) updateData.reason_no_receipt = patch.reasonNoReceipt;
  if (patch.proofUrls !== undefined) updateData.proof_urls = patch.proofUrls;
  const { error } = await supabase.from('accounting_entries').update(updateData).eq('id', id);
  if (error) throw error;
};

export const deleteAccountingEntry = async (target: AccountingEntry): Promise<void> => {
  const { error } = await supabase.from('accounting_entries').delete().eq('id', target.id);
  if (error) throw error;
};

// ── admin functions ────────────────────────────────────────────────────────

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(toProfile);
};

export const setUserStatus = async (
  targetUid: string,
  status: 'approved' | 'rejected',
): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ status })
    .eq('uid', targetUid);
  if (error) throw error;
};
