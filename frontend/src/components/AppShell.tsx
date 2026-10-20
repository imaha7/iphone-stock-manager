'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Smartphone,
  PackagePlus,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LogOut,
  UserRound,
  Pencil,
  Save,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/api';
import { AuthUser } from '@/lib/types';

const navItems = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', shortLabel: 'Stock', icon: Smartphone },
  { href: '/purchases', label: 'Stock In', shortLabel: 'Stock In', icon: PackagePlus },
  { href: '/sales', label: 'Sales', shortLabel: 'Sales', icon: ShoppingCart },
  { href: '/invoices', label: 'Invoice', shortLabel: 'Invoice', icon: FileText },
  { href: '/reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Overview',
    subtitle: 'Business summary for this period',
  },
  '/stock': {
    title: 'iPhone Stock',
    subtitle: 'Manage inventory, specifications, and unit availability',
  },
  '/purchases': {
    title: 'Stock In',
    subtitle: 'Record new units purchased from suppliers',
  },
  '/sales': {
    title: 'Sales Transactions',
    subtitle: 'Record unit sales, deal prices, and additional costs',
  },
  '/invoices': {
    title: 'Sales Invoices',
    subtitle: 'Find and print sales invoices',
  },
  '/reports': {
    title: 'Financial & Profit Reports',
    subtitle: 'Analyze gross profit, operating costs, and net profit per unit',
  },
};

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (isAuthPage) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    setAuthLoading(true);
    auth.me()
      .then((user) => {
        if (active) {
          setCurrentUser(user);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (active) router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [hasMounted, isAuthPage, router]);

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await auth.logout();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Failed to log out',
      );
    }
  };

  const openProfileEditor = () => {
    setProfileName(currentUser?.name ?? '');
    setProfileError(null);
    setProfileOpen(true);
    setMobileMenuOpen(false);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSaving(true);
    try {
      const updatedUser = await auth.updateProfile({ name: profileName.trim() });
      setCurrentUser(updatedUser);
      setProfileOpen(false);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Failed to update profile',
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (isAuthPage) return <>{children}</>;

  if (!hasMounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  const currentPage = pageTitles[pathname] || {
    title: pathname.startsWith('/sales/')
      ? 'Sales Invoice'
      : 'iPhone Stock Manager',
    subtitle: pathname.startsWith('/sales/')
      ? 'Sales invoice details'
      : 'iPhone inventory and store finance management',
  };

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-slate-900 flex flex-col md:flex-row antialiased">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-[#17171b] text-white border-r border-[#28282e]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 border-b border-[#2b2b31] px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ed552d] text-sm font-extrabold text-white shadow-md shadow-orange-950/30">
              IS
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">iPhone Stock</h1>
              <p className="text-[11px] text-slate-400">Inventory Manager</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="mt-5 flex-1 space-y-1 px-3">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/invoices' &&
                  pathname.startsWith('/sales/') &&
                  pathname.endsWith('/invoice'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 before:absolute before:bottom-2 before:left-[-12px] before:top-2 before:w-[3px] before:rounded-r before:bg-transparent',
                    isActive
                      ? 'bg-[#25252b] text-white before:bg-[#ed552d]'
                      : 'text-slate-400 hover:bg-[#202025] hover:text-slate-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors duration-150 group-hover:text-white',
                        isActive ? 'text-white' : 'text-slate-500'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-white/80" />}
                </Link>
              );
            })}
          </nav>

          {/* System Status in Sidebar Footer */}
          <div className="border-t border-[#2b2b31] p-4">
            <button
              onClick={openProfileEditor}
              className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[#2b2b31] bg-[#202025] p-2.5 text-left transition hover:bg-[#29292f]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ed552d] text-xs font-bold text-white">
                {currentUser?.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-white">
                  {currentUser?.name}
                </span>
                <span className="block text-[11px] text-slate-400">Edit profile</span>
              </span>
              <Pencil className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed left-0 top-0 bottom-0 w-3/4 max-w-xs bg-slate-950 text-white p-5 flex flex-col shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ed552d]">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">iPhone Stock</h2>
                    <p className="max-w-36 truncate text-xs text-slate-400">
                      {currentUser?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-5 space-y-1.5 flex-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                        isActive
                          ? 'border-l-2 border-[#ed552d] bg-[#25252b] text-white'
                          : 'border-l-2 border-transparent text-slate-300 hover:bg-[#202025]'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={openProfileEditor}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
              <div className="pt-4 text-xs text-slate-500 text-center">
                iPhone Stock Manager &bull; v1.2
              </div>
            </div>
          </div>
        )}

        {/* Main App Container */}
        <div className="flex flex-1 flex-col md:ml-64 min-w-0">
          {/* Mobile Top Header (Sticky) */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ed552d] text-white shadow-sm">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight">
                {currentPage.title.split(' ')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openProfileEditor}
                className="flex max-w-36 items-center gap-1.5 truncate rounded-xl bg-orange-50 px-2.5 py-2 text-xs font-semibold text-orange-700"
                aria-label="Edit profile"
              >
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentUser?.name}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Desktop Top Header Bar */}
          <header className="hidden md:flex sticky top-0 z-30 items-center justify-between border-b border-[#ebe7e2] bg-white/95 px-6 py-3.5 backdrop-blur-md lg:px-8">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {currentPage.title}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentPage.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openProfileEditor}
                className="flex items-center gap-2 rounded-xl border border-[#ebe7e2] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#faf9f7]"
              >
                <UserRound className="h-4 w-4 text-orange-600" />
                <span>{currentUser?.name}</span>
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-[#ebe7e2] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#faf9f7] hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </header>

          {/* Page Content Viewport */}
          <main className="min-w-0 w-full flex-1 p-3.5 pb-24 sm:p-6 md:p-8 md:pb-8 lg:p-10">
            {authError && (
              <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {authError}
              </p>
            )}
            <div key={pathname} className="page-transition min-w-0">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (Thumb-friendly UX for smartphones) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 py-1.5 backdrop-blur-lg md:hidden shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-orange-600 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-orange-50 text-orange-600' : ''
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        {profileOpen && (
          <div
            className="modal-overlay z-[60]"
            onClick={() => setProfileOpen(false)}
          >
            <div
              className="modal-card max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
                  <p className="text-sm text-slate-500">
                    Update the name shown in the menu.
                  </p>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label htmlFor="profile-name" className="label">
                    Full name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="input"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    maxLength={100}
                    required
                    autoFocus
                  />
                </div>
                {profileError && (
                  <p role="alert" className="text-sm text-rose-600">
                    {profileError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-4 py-2"
                    onClick={() => setProfileOpen(false)}
                    disabled={profileSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                    disabled={profileSaving || !profileName.trim()}
                  >
                    <Save className="h-4 w-4" />
                    {profileSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
