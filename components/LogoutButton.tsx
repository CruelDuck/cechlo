// components/LogoutButton.tsx
'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';

export function LogoutButton() {
  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:underline"
    >
      Odhlásit
    </button>
  );
}
