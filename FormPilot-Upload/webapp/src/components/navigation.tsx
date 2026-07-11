"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArchiveIcon,
  ClipboardIcon,
  FileIcon,
  HomeIcon,
  SendIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/icons";
import { logoutAction } from "@/app/(auth)/actions";
import { env } from "@/env";

/** Navigationsstruktur — identisch zur validierten Demo (max. 7 Hauptbereiche). */
const NAV = [
  { href: "/app", label: "Übersicht", icon: HomeIcon },
  { href: "/app/vorgaenge", label: "Vorgänge", icon: ClipboardIcon },
  { href: "/app/safe", label: "Dokumentensafe", icon: ArchiveIcon },
  { href: "/app/pakete", label: "Pakete", icon: FileIcon },
  { href: "/app/profil", label: "Profil", icon: UserIcon },
  { href: "/app/freigaben", label: "Freigaben", icon: SendIcon },
  { href: "/app/sicherheit", label: "Sicherheit & Zugriff", icon: ShieldCheckIcon },
] as const;

/** Mobile Tab-Leiste: max. 5 Einträge (Brand-Guideline). */
const MOBILE_NAV = [
  { href: "/app", label: "Übersicht", icon: HomeIcon },
  { href: "/app/vorgaenge", label: "Vorgänge", icon: ClipboardIcon },
  { href: "/app/safe", label: "Safe", icon: ArchiveIcon },
  { href: "/app/freigaben", label: "Freigaben", icon: SendIcon },
  { href: "/app/profil", label: "Profil", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="side-logo">
        <Image
          src="/formpilot_logo.svg"
          alt="FormPilot — Dokumente. Daten. Freigaben."
          width={172}
          height={52}
          priority
        />
      </div>
      <span className="beta-tag">Beta · Phase 1</span>
      <nav aria-label="Hauptnavigation">
        {NAV.map((item) => {
          const ItemIcon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <ItemIcon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="side-foot">
        Angemeldet als {userEmail}
        <br />
        Umgebung: {env.NEXT_PUBLIC_APP_ENV}
        <br />
        <form action={logoutAction} style={{ display: "inline" }}>
          <button type="submit" className="link-btn" style={{ fontSize: 12.5, color: "var(--slate)" }}>
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <div className="mobilehead">
      <Image
        src="/formpilot_logo.svg"
        alt="FormPilot — Dokumente. Daten. Freigaben."
        width={148}
        height={44}
        priority
      />
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottomnav" aria-label="Hauptnavigation (mobil)">
      {MOBILE_NAV.map((item) => {
        const ItemIcon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bn-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <ItemIcon size={21} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
