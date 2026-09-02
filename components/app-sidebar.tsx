"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SquaresFourIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, GearIcon, QuestionIcon, MagnifyingGlassIcon, DatabaseIcon, ChartLineIcon, FileIcon, CommandIcon, WalletIcon, MoneyIcon, BookBookmark, Bank, ShoppingBag, Storefront, ArrowCircleUp, ArrowSquareUp, ArrowCircleDown, UserIcon, HandPalmIcon, HandCoinsIcon, CaretCircleDoubleUpIcon, CurrencyCircleDollarIcon, AndroidLogo, ChartPieSliceIcon, HouseLineIcon } from "@phosphor-icons/react"

const data = {
  user: {
    name: "JMB Company",
    email: "admin@jmb.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: (
        <SquaresFourIcon />
      ),
    },
    {
      title: "Pelanggan",
      url: "/pelanggan",
      icon: (
        <UserIcon size={32} />
      ),
    },
    {
      title: "Pembelian",
      url: "/pembelian",
      icon: (
        <CaretCircleDoubleUpIcon size={32} />
      ),
    },
    {
      title: "Penjualan",
      url: "/penjualan",
      icon: (
        <CurrencyCircleDollarIcon size={32} />
      ),
    },
    {
      title: "Pemasukan",
      url: "/pemasukan",
      icon: (
        <HandCoinsIcon size={32} />
      ),
    },
    {
      title: "Pengeluaran",
      url: "/pengeluaran",
      icon: (
        <HandPalmIcon size={32} />
      ),
    },
    {
      title: "Piutang",
      url: "/piutang",
      icon: (
        <BookBookmark />
      ),
    },
    {
      title: "Titip Dana",
      url: "/titip-dana",
      icon: (
        <Bank />
      ),
    },
    {
      title: "Dompetku",
      url: "/dompetku",
      icon: (
        <WalletIcon />
      ),
    },
    {
      title: "Mutasi",
      url: "/mutasi",
      icon: (
        <ChartLineIcon />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <HouseLineIcon size={28} weight="bold" className="text-primary" />
              <span className="text-base font-bold text-primary">JMB Company</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
