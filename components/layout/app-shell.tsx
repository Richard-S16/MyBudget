"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Landmark,
  LayoutDashboard,
  Menu,
  Receipt,
  Repeat,
  Tag,
  Wallet,
  Waves,
} from "lucide-react";
import { UserButton } from "@/components/auth/user-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/cashflow", label: "Cash Flow", icon: Waves },
  { href: "/dashboard/plan", label: "Monthly Plan", icon: CalendarDays },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/categories", label: "Categories", icon: Tag },
  { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
  { href: "/dashboard/installments", label: "Installments", icon: Landmark },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar p-6 md:flex">
        <Link
          href="/dashboard"
          className="mb-8 font-heading text-2xl font-semibold tracking-tight text-sidebar-foreground"
        >
          MyBudget
        </Link>
        <NavLinks />
        <div className="mt-auto pt-6">
          <UserButton user={user} />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/dashboard"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          MyBudget
        </Link>
        <div className="flex items-center gap-2">
          <UserButton user={user} />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 bg-sidebar p-6">
              <SheetHeader className="mb-6 p-0">
                <SheetTitle className="text-left font-heading text-2xl">
                  MyBudget
                </SheetTitle>
              </SheetHeader>
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
