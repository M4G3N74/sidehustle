'use client';

import { useState } from 'react';
import { toggleUserBan, resetUserPassword } from '@/app/admin-actions';
import { ShieldAlert, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type UserData = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  isBanned: number;
  createdAt: Date | null;
};

export default function UserManagementClient({ 
  users, 
  currentUserId,
  currentUserRole 
}: { 
  users: UserData[], 
  currentUserId: number,
  currentUserRole: string 
}) {
  const { showToast } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  
  const [confirmBanId, setConfirmBanId] = useState<number | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<number | null>(null);
  const [newPasswordContext, setNewPasswordContext] = useState<{name: string, pass: string} | null>(null);

  const handleToggleBan = async (id: number) => {
    setLoadingId(id);
    const res = await toggleUserBan(id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('User status updated successfully.', 'success');
    }
    setLoadingId(null);
    setConfirmBanId(null);
  };

  const handleResetPassword = async (id: number, name: string) => {
    setLoadingId(id);
    const res = await resetUserPassword(id);
    if (res.error) {
      showToast(res.error, 'error');
    } else if (res.temporaryPassword) {
      showToast('Password reset generated successfully.', 'success');
      setNewPasswordContext({ name, pass: res.temporaryPassword });
    }
    setLoadingId(null);
    setConfirmResetId(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-sm">
              <th className="pb-3 px-2 font-medium">User / Email</th>
              <th className="pb-3 px-2 font-medium">Role</th>
              <th className="pb-3 px-2 font-medium">Status</th>
              <th className="pb-3 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isTargetAdmin = user.role === 'ADMIN';
              // Logic check if the current user is allowed to act on this row
              const canModify = !isSelf && !(isTargetAdmin && currentUserRole !== 'ADMIN');

              return (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-2">
                    <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                    <div className="text-white/50 text-sm mt-0.5">{user.email}</div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' :
                      user.role === 'MOD' ? 'bg-indigo-500/20 text-indigo-300' :
                      'bg-white/10 text-white/70'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      user.isBanned === 1 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {user.isBanned === 1 ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      {canModify ? (
                        <>
                          <button
                            onClick={() => setConfirmResetId(user.id)}
                            disabled={loadingId === user.id}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4 text-indigo-400" />
                            <span className="sr-only">Reset password</span>
                          </button>
                          
                          <button
                            onClick={() => setConfirmBanId(user.id)}
                            disabled={loadingId === user.id}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                            title={user.isBanned === 1 ? "Unban User" : "Suspend User"}
                          >
                            {user.isBanned === 1 ? (
                              <ShieldCheck className="w-4 h-4 text-green-400" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-red-400" />
                            )}
                            <span className="sr-only">{user.isBanned === 1 ? 'Unban' : 'Ban'}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-white/30 text-xs italic">Restricted</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-12 text-white/50">
            No users found in the system.
          </div>
        )}
      </div>

      {newPasswordContext && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a163a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-indigo-400">
              <KeyRound className="w-8 h-8" />
              <h2 className="text-xl font-bold text-white">Password Resetted</h2>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              The password for <strong>{newPasswordContext.name}</strong> has been securely randomized. Please copy and provide them with the following key:
            </p>
            <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-center mb-6 overflow-hidden">
              <code className="text-2xl font-mono text-green-400 font-bold select-all">
                {newPasswordContext.pass}
              </code>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setNewPasswordContext(null)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmBanId !== null}
        title={users.find(u => u.id === confirmBanId)?.isBanned === 1 ? "Restore User Account" : "Suspend User Account"}
        message={users.find(u => u.id === confirmBanId)?.isBanned === 1 
          ? "Are you sure you want to lift the suspension for this user? They will instantly regain platform access." 
          : "Are you sure you want to suspend this user? They will immediately be fully locked out of all hustle tracking functions."}
        onConfirm={() => confirmBanId && handleToggleBan(confirmBanId)}
        onCancel={() => setConfirmBanId(null)}
        confirmLabel={users.find(u => u.id === confirmBanId)?.isBanned === 1 ? "Restore Access" : "Suspend"}
      />

      <ConfirmDialog
        isOpen={confirmResetId !== null}
        title="Reset Password"
        message="Are you sure you want to generate a new password? The user will be instantly logged out and their current internal password will be permanently erased."
        onConfirm={() => confirmResetId && handleResetPassword(confirmResetId, users.find(u => u.id === confirmResetId)?.name || 'User')}
        onCancel={() => setConfirmResetId(null)}
        confirmLabel="Generate New Password"
      />
    </>
  );
}
