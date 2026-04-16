import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import AccountingPrototype from './AccountingPrototype';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef4f6]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4a9b6f] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <main className="admin-clay min-h-screen bg-[#eef4f6] px-4 py-4 text-slate-900 md:px-6">
      <AccountingPrototype />
    </main>
  );
};

export default App;
