import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ManageUsers from '../components/ManageUsers';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';

export default function ManageUsersPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('manage-users');

  // Redirect non-admins
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className={`min-h-screen transition-all duration-300 ease-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <TopBar user={user} />
          <main className="px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
                <p className="mt-2 text-slate-600">Only administrators can access this page.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.55),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`min-h-screen transition-all duration-300 ease-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="px-4 pb-8 pt-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[30px] border border-sky-100 bg-white/95 px-6 py-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] sm:px-8">
              <ManageUsers />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
