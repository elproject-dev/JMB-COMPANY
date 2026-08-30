"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Disc2,
  ChartBar,
  Box,
  Pointer,
  Users,
  Settings2,
  User2,
  Menu,
  Settings,
  HdIcon,
  LayoutGrid,
  CirclePercent,
  CalendarDays,
  HandCoins,
  CircleUser,
  Shield,
  ShieldUser,
  Database,
  UserCog,
  IdCard,
  ScanBarcode,
  Megaphone,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

import { supabase } from "@/lib/supabase"

const defaultMainLinks = [
  { href: "/home", label: "Beranda", icon: LayoutGrid },
  { href: "/promo", label: "Promo", icon: CirclePercent },
  { href: "/card", label: "Card", icon: ScanBarcode },
  { href: "/event", label: "Event", icon: CalendarDays },
]

const adminMainLinks = [
  { href: "/home", label: "Beranda", icon: LayoutGrid },
  { href: "/promo", label: "Promo", icon: CirclePercent },
  { href: "/broadcast", label: "Broadcast", icon: Send },
  { href: "/event", label: "Event", icon: CalendarDays },
]

const moreLinks = [
  { href: "/staf", label: "Staf", icon: UserCog },
  { href: "/poin", label: "Poin", icon: HandCoins },
  { href: "/database", label: "Database", icon: Database },
  { href: "/pelanggan", label: "Pelanggan", icon: Users },
  { href: "/settings", label: "Manajemen", icon: Settings },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const [isAdminOrStaff, setIsAdminOrStaff] = useState(false)

  const checkRole = async (email: string | undefined) => {
    if (!email) {
      setIsAdminOrStaff(false)
      return
    }
    
    if (email === "elproject.dev@gmail.com") {
      setIsAdminOrStaff(true)
      return
    }
    
    const { data: staffData } = await supabase
      .from('staf')
      .select('id')
      .eq('email', email)
      .maybeSingle()
      
    if (staffData) {
      setIsAdminOrStaff(true)
    } else {
      setIsAdminOrStaff(false)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        checkRole(session.user.email)
      }
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkRole(session.user.email)
      } else {
        setIsAdminOrStaff(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const filteredMoreLinks = isAdminOrStaff
    ? moreLinks
    : moreLinks.filter(
        (link) =>
          link.href !== "/database" &&
          link.href !== "/pelanggan" &&
          link.href !== "/poin" &&
          link.href !== "/settings"
      )

  const currentMainLinks = isAdminOrStaff ? adminMainLinks : defaultMainLinks

  return (
    <>
      {/* Overlay backdrop */}
      {isAdminOrStaff && showMore && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.15)] rounded-t-2xl">
        {/* Expandable "More" panel */}
        {isAdminOrStaff && (
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out bg-background rounded-t-2xl",
              showMore
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-5 py-3 px-1 gap-y-3 border-b border-border">
                {filteredMoreLinks.map((link) => {
                  const Icon = link.icon
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMore(false)}
                      className={cn(
                        "flex flex-col items-center justify-center w-16 mx-auto py-1.5 rounded-xl transition-all duration-200",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 mb-1",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-medium text-center leading-tight",
                          isActive
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                        {link.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main bottom bar */}
        <div className="grid grid-cols-5 py-2 px-1 relative z-10 bg-background rounded-t-2xl">
          {currentMainLinks.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href ||
              (link.href !== "/home" && pathname.startsWith(link.href))
            return link.label === "Card" ? (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex flex-col items-center justify-center w-16 mx-auto transition-all duration-200 group"
              >
                <div className={cn(
                  "absolute -top-7 flex items-center justify-center w-14 h-14 shrink-0 aspect-square rounded-full shadow-lg border-2 border-muted transition-transform group-hover:-translate-y-1 bg-black text-white"
                )}
                style={{ borderRadius: '50%' }}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 mx-auto py-1 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-5 h-5 mb-1",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium text-center leading-tight",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}

          {/* "More" button or Member link */}
          {isAdminOrStaff ? (
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex flex-col items-center justify-center w-16 mx-auto py-1 rounded-xl transition-all duration-200",
                showMore
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Menu className="w-5 h-5 mb-1" />
              <span
                className={cn(
                  "text-[9px] font-medium text-center leading-tight",
                  showMore
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Lainnya
              </span>
            </button>
          ) : (
            <Link
              href="/member"
              className={cn(
                "flex flex-col items-center justify-center w-16 mx-auto py-1 rounded-xl transition-all duration-200 relative",
                pathname === "/member" || (pathname.startsWith("/member") && pathname !== "/home")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <CircleUser
                  className={cn(
                    "w-5 h-5 mb-1",
                    pathname === "/member" || (pathname.startsWith("/member") && pathname !== "/home")
                      ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium text-center leading-tight",
                  pathname === "/member" || (pathname.startsWith("/member") && pathname !== "/home")
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Member
              </span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
