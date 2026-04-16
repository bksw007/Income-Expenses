import type { AccountingEntry, UserProfile } from '../types/accounting';

const ENTRIES_KEY = 'accounting-prototype:entries';
const PROFILE_KEY = 'accounting-prototype:profile';
const CHANGE_EVENT = 'accounting-prototype:entries-changed';

export const DEMO_USER = {
  uid: 'prototype-admin',
  email: 'prototype@example.com',
};

const defaultProfile: UserProfile = {
  uid: DEMO_USER.uid,
  email: DEMO_USER.email,
  displayName: 'Prototype Admin',
  fullName: 'Prototype Admin',
  role: 'admin',
  createdAt: Date.now(),
  businessBranchName: 'สำนักงานใหญ่',
  signatureName: 'Prototype Admin',
};

const isBrowser = typeof window !== 'undefined';

const readJson = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const emitEntriesChanged = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

const readEntries = (): AccountingEntry[] => {
  const rows = readJson<AccountingEntry[]>(ENTRIES_KEY, []);
  return Array.isArray(rows)
    ? rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    : [];
};

const writeEntries = (entries: AccountingEntry[]) => {
  writeJson(ENTRIES_KEY, entries);
  emitEntriesChanged();
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const getAccountingProfile = (): UserProfile => {
  const saved = readJson<Partial<UserProfile> | null>(PROFILE_KEY, null);
  const profile = {
    ...defaultProfile,
    ...(saved || {}),
  };
  if (!saved) {
    writeJson(PROFILE_KEY, profile);
  }
  return profile;
};

export const updateAccountingProfile = async (
  patch: Partial<UserProfile>,
): Promise<UserProfile> => {
  const nextProfile = {
    ...getAccountingProfile(),
    ...patch,
  };
  writeJson(PROFILE_KEY, nextProfile);
  return nextProfile;
};

export const uploadAccountingProofs = async (
  files: File[],
  entryId: string,
): Promise<string[]> => {
  const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
  return dataUrls.map((url, index) => `${url}#entry=${entryId}&file=${index}`);
};

export const subscribeToAccountingEntries = (
  callback: (entries: AccountingEntry[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  try {
    callback(readEntries());
  } catch (error) {
    onError?.(error as Error);
  }

  if (!isBrowser) return () => undefined;

  const handler = () => {
    try {
      callback(readEntries());
    } catch (error) {
      onError?.(error as Error);
    }
  };

  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};

export const addAccountingEntry = async (
  entry: Omit<AccountingEntry, 'id' | 'timestamp'>,
  proofFiles: File[] = [],
): Promise<string> => {
  const timestamp = Date.now();
  const id = `acc-${timestamp}`;
  const proofUrls = proofFiles.length > 0 ? await uploadAccountingProofs(proofFiles, id) : [];
  const nextEntry: AccountingEntry = {
    ...entry,
    id,
    proofUrls,
    timestamp,
    updatedAt: timestamp,
  };
  writeEntries([nextEntry, ...readEntries()]);
  return id;
};

export const updateAccountingEntry = async (
  id: string,
  patch: Partial<Omit<AccountingEntry, 'id' | 'timestamp'>>,
): Promise<void> => {
  const nextEntries = readEntries().map((entry) =>
    entry.id === id
      ? {
          ...entry,
          ...patch,
          updatedAt: Date.now(),
        }
      : entry,
  );
  writeEntries(nextEntries);
};

export const deleteAccountingEntry = async (target: AccountingEntry): Promise<void> => {
  const nextEntries = readEntries().filter((entry) => entry.id !== target.id);
  writeEntries(nextEntries);
};
