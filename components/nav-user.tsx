"use client"
import { useState, useEffect } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DotsThreeVerticalIcon, BellIcon, SignOutIcon, SunIcon, MoonIcon, UserCircleGearIcon, PaletteIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  useEffect(() => {
    const savedColor = localStorage.getItem("app-primary-color")
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor)
      document.documentElement.style.setProperty('--sidebar-primary', savedColor)
    }
  }, [])

  const handleColorChange = (hexColor: string) => {
    document.documentElement.style.setProperty('--primary', hexColor)
    document.documentElement.style.setProperty('--sidebar-primary', hexColor)
    localStorage.setItem("app-primary-color", hexColor)
    setIsColorModalOpen(false)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-full grayscale">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-full bg-primary flex items-center justify-center">
                <UserCircleGearIcon size={32} className="text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-foreground/70">
                {user.email}
              </span>
            </div>
            <DotsThreeVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-full bg-primary flex items-center justify-center">
                      <UserCircleGearIcon size={32} className="text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-foreground/70">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>

              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                Toggle Theme
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => {
                // Beri jeda agar animasi tutup menu selesai dulu (mencegah bug pointer terkunci)
                setTimeout(() => setIsColorModalOpen(true), 150)
              }}>
                <PaletteIcon />
                Ubah Warna Tema
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              const { supabase } = await import('@/lib/supabase')
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}>
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Modal / Popup Ubah Warna Tema */}
      <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ubah Warna Tema</DialogTitle>
            <DialogDescription>
              Pilih warna aksen utama yang Anda inginkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-4 py-6 justify-center">
            {/* Supabase Green (Saat Ini) */}
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleColorChange("#33976aff")}>
              <div className="w-12 h-12 rounded-full bg-[#38ae79] ring-2 ring-offset-2 ring-[#38ae79] group-hover:scale-110 transition-transform"></div>
              <span className="text-xs text-muted-foreground font-medium">Supabase</span>
            </div>

            {/* Blue */}
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleColorChange("#2354c0ff")}>
              <div className="w-12 h-12 rounded-full bg-blue-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs text-muted-foreground font-medium">Blue</span>
            </div>

            {/* Rose */}
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleColorChange("#e11d48")}>
              <div className="w-12 h-12 rounded-full bg-rose-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs text-muted-foreground font-medium">Rose</span>
            </div>

            {/* Violet */}
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleColorChange("#6325cdff")}>
              <div className="w-12 h-12 rounded-full bg-violet-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs text-muted-foreground font-medium">Violet</span>
            </div>

            {/* Orange */}
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleColorChange("#dd640dff")}>
              <div className="w-12 h-12 rounded-full bg-orange-500 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs text-muted-foreground font-medium">Orange</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
