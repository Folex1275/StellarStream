"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  CirclePlus,
  ClipboardCheck,
  Gauge,
  Settings,
  Waves,
  PanelLeftClose,
  PanelLeftOpen,
  History as HistoryIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: ComponentType<{ className?: string }>;
  /** Number shown as a badge. Omit or 0 to hide. */
  badge?: number;
};

interface SidebarProps {
  onOpenAuditLog: () => void;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export function Sidebar({ onOpenAuditLog }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: Gauge },
    { label: "My Streams", href: "/dashboard/streams", icon: Waves },
    {
      label: "Pending Approvals",
      href: "/dashboard/pending",
      icon: ClipboardCheck,
      badge: 2,
    },
    {
      label: "History",
      onClick: onOpenAuditLog,
      icon: HistoryIcon,
    },
    {
      label: "Create Stream",
      href: "/dashboard/create-stream",
      icon: CirclePlus,
    },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* ── Desktop / Tablet sidebar ── */}
      <aside
        className={`hidden flex-col border-r border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:flex transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-[248px]"
          }`}
      >
        {/* Header + toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className={`overflow-hidden transition-all duration-300 ease-in-out hover:opacity-80 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
          >
            <p className="font-heading text-lg text-white whitespace-nowrap">
              StellarStream
            </p>
            <p className="font-body text-xs text-white/60 whitespace-nowrap">
              Navigation Blade
            </p>
          </Link>

          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href ? isActive(pathname, item.href) : false;
            const content = (
              <>
                <span
                  className={`absolute rounded-lg blur-md transition-all duration-200 ${active ? "bg-[#8A00FF]/45 opacity-100" : "opacity-0"
                    } ${collapsed ? "inset-1" : "inset-y-1 left-2 w-8"}`}
                />
                <Icon
                  className={`relative h-4.5 w-4.5 shrink-0 ${active
                      ? "text-[#E9C8FF]"
                      : "text-white/70 group-hover:text-white"
                    }`}
                />
                <span
                  className={`font-body relative text-sm whitespace-nowrap transition-all duration-300 ease-in-out flex-1 ${active ? "text-white" : "text-white/78"
                    } ${collapsed
                      ? "w-0 overflow-hidden opacity-0"
                      : "w-auto opacity-100"
                    }`}
                >
                  {item.label}
                </span>
                {!collapsed && item.badge && item.badge > 0 ? (
                  <span className="relative ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00f5ff] px-1 text-[10px] font-bold leading-none text-black shadow-[0_0_8px_rgba(0,245,255,0.6)]">
                    {item.badge}
                  </span>
                ) : null}
                {collapsed && item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#00f5ff] text-[8px] font-bold leading-none text-black">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );

            const className = `group relative flex items-center rounded-xl border transition-all duration-200 ${active
              ? "border-white/20 bg-white/8"
              : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
              } ${collapsed
                ? "h-10 w-10 justify-center p-0"
                : "gap-3 justify-start px-3 py-2.5"
              }`;

            if (item.href) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={className}
                >
                  {content}
                </Link>
              );
            } else {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  title={collapsed ? item.label : undefined}
                  className={className}
                >
                  {content}
                </button>
              );
            }
          })}
        </nav>

        {/* Wallet card */}
        <div
          className={`mt-5 rounded-2xl border border-white/10 bg-black/25 transition-all duration-300 ease-in-out ${collapsed ? "h-10 w-10 flex items-center justify-center p-0" : "p-3"
            }`}
        >
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""
              }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#00F5FF]/35 bg-[#00F5FF]/12 text-xs font-semibold text-[#CCFAFF]">
              G
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
            >
              <p className="font-body text-xs text-white/55 whitespace-nowrap">
                Connected Wallet
              </p>
              <p className="font-body text-sm text-white whitespace-nowrap">
                GAB3...X7QP
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar (unchanged) ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-white/5 px-3 py-2 backdrop-blur-2xl md:hidden">
        <nav className="mx-auto flex max-w-xl items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href ? isActive(pathname, item.href) : false;
            const content = (
              <>
                <span
                  className={`absolute inset-x-3 top-1 h-6 rounded-lg blur-md ${active ? "bg-[#8A00FF]/45" : "bg-transparent"
                    }`}
                />
                <Icon
                  className={`relative h-4.5 w-4.5 ${active ? "text-[#EED7FF]" : "text-white/70"
                    }`}
                />
                <span
                  className={`font-body relative mt-1 text-[9px] whitespace-nowrap ${active ? "text-white" : "text-white/72"
                    }`}
                >
                  {item.label}
                </span>
              </>
            );

            const className = "relative flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-2";

            if (item.href) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                >
                  {content}
                </Link>
              );
            } else {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={className}
                >
                  {content}
                </button>
              );
            }
          })}
        </nav>
      </div>
    </>
  );
}