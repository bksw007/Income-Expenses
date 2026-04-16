import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { getAccountingProfile } from './lib/supabaseStorage';
import type { UserProfile } from './types/accounting';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import PendingApproval from './components/PendingApproval';
import AccountingPrototype from './AccountingPrototype';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setUserProfile(null); return; }
    setProfileLoading(true);
    getAccountingProfile().then((profile) => {
      setUserProfile(profile);
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Initial loading
  if (session === undefined || (session && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D97757] border-t-transparent" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <LoginPage />;
  }

  const avatarUrl = session.user.user_metadata?.avatar_url as string | undefined;
  const displayName = userProfile?.displayName || session.user.email || '';
  const email = session.user.email;

  const navbar = (
    <Navbar
      avatarUrl={avatarUrl}
      displayName={displayName}
      email={email}
      onLogout={handleLogout}
    />
  );

  // Pending or rejected
  if (!userProfile || userProfile.status === 'pending' || userProfile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        {navbar}
        <div className="pt-14">
          <PendingApproval status={userProfile?.status ?? 'pending'} onLogout={handleLogout} />
        </div>
      </div>
    );
  }

  // Approved
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {navbar}
      <main className="admin-clay pt-14 text-[#1A1818]">
        <div className="px-4 py-4 md:px-6">
          <AccountingPrototype
            userProfile={userProfile}
            onProfileUpdate={setUserProfile}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
