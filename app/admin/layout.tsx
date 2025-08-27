'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  Clock,
  Book,
  UserCog,
  Settings,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/services', icon: Scissors, label: 'Dienstleistungen' },
  { href: '/admin/staff', icon: Users, label: 'Mitarbeiter' },
  { href: '/admin/schedule', icon: Calendar, label: 'Arbeitszeiten' },
  { href: '/admin/timeoff', icon: Clock, label: 'Abwesenheiten' },
  { href: '/admin/bookings', icon: Book, label: 'Termine' },
  { href: '/admin/customers', icon: UserCog, label: 'Kunden' },
  { href: '/admin/settings', icon: Settings, label: 'Einstellungen' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-lg font-semibold">Admin</h2>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
