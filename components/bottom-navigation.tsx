"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFour as SquaresFourIcon,
  HandCoins as HandCoinsIcon,
  HandPalm as HandPalmIcon,
  ChartLine as ChartLineIcon,
  List as ListIcon,
  Wallet as WalletIcon,
  BookBookmark,
  User as UserIcon,
  CaretCircleDoubleUp as CaretCircleDoubleUpIcon,
  CurrencyCircleDollar as CurrencyCircleDollarIcon,
  PlusCircle as PlusCircleIcon,
  HouseLineIcon
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const mainLinks = [
  { href: "/", label: "Beranda", icon: HouseLineIcon },
  { href: "/pembelian", label: "Pembelian", icon: CaretCircleDoubleUpIcon },
  { href: "/tambah-transaksi", label: "Transaksi", icon: PlusCircleIcon },
  { href: "/penjualan", label: "Penjualan", icon: CurrencyCircleDollarIcon },
]

const moreLinks = [
  { href: "/pemasukan", label: "Pemasukan", icon: HandCoinsIcon },
  { href: "/pengeluaran", label: "Pengeluaran", icon: HandPalmIcon },
  { href: "/dompetku", label: "Dompetku", icon: WalletIcon },
  { href: "/piutang", label: "Piutang", icon: BookBookmark },
  { href: "/pelanggan", label: "Pelanggan", icon: UserIcon },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  if (pathname === "/login") {
    return null
  }

  return (
    <>
      {/* Overlay backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50 rounded-none shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.15)]">
        {/* Expandable "More" panel */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out bg-background rounded-none",
            showMore ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-5 py-3 px-1 gap-y-3 border-b border-border">
              {moreLinks.map((link) => {
                const Icon = link.icon
                const isActive =
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center justify-center w-16 mx-auto py-1.5 rounded-none transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn("w-5 h-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")}
                      weight={isActive ? "bold" : "regular"}
                    />
                    <span
                      className={cn(
                        "text-[9px] font-medium text-center leading-tight",
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
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

        {/* Main bottom bar */}
        <div className="grid grid-cols-5 py-2 px-1 relative z-10 bg-background rounded-none">
          {mainLinks.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 mx-auto py-1 rounded-none transition-all duration-200 relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn("w-5 h-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")}
                    weight={isActive ? "bold" : "regular"}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium text-center leading-tight",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}

          {/* "More" button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center justify-center w-16 mx-auto py-1 rounded-none transition-all duration-200",
              showMore ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListIcon className="w-5 h-5 mb-1" weight={showMore ? "bold" : "regular"} />
            <span
              className={cn(
                "text-[9px] font-medium text-center leading-tight",
                showMore ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              Lainnya
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
