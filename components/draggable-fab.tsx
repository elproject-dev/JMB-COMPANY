"use client"

import React, { useRef, useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, ChartLine as ChartLineIcon, Plus, Palette } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function DraggableFab() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isDragging: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("fabPosition")
    if (saved) {
      try {
        setPosition(JSON.parse(saved))
      } catch (e) { }
    }
  }, [])

  if (!mounted) return null

  // Sembunyikan FAB jika berada di halaman login
  if (typeof window !== "undefined" && window.location.pathname === "/login") return null

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: position.x,
      lastY: position.y,
      isDragging: false,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return // Only process if left button is pressed
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    // If moved more than 5px, it's a drag
    if (!dragRef.current.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dragRef.current.isDragging = true
      setIsDragging(true)
      setIsOpen(false) // Close menu if dragging starts
    }

    if (!dragRef.current.isDragging) return

    const newX = dragRef.current.lastX - dx
    const newY = dragRef.current.lastY - dy

    const maxX = window.innerWidth - 70
    const maxY = window.innerHeight - 150

    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(80, Math.min(newY, maxY)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!dragRef.current.isDragging) {
      // It was a click
      setIsOpen(!isOpen)
    } else {
      // It was a drag
      setIsDragging(false)
      localStorage.setItem("fabPosition", JSON.stringify(position))
    }
    dragRef.current.isDragging = false
  }

  const handleColorChange = (hexColor: string) => {
    document.documentElement.style.setProperty('--primary', hexColor)
    document.documentElement.style.setProperty('--sidebar-primary', hexColor)
    localStorage.setItem("app-primary-color", hexColor)
    setIsColorModalOpen(false)
    setIsOpen(false)
  }

  return (
    <>
      <div
        className="md:hidden fixed z-50 flex flex-col items-center justify-end"
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
        }}
      >
        {/* Menu Items */}
        <div
          className={`flex flex-col gap-3 mb-4 transition-all duration-300 ease-in-out ${isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-10 pointer-events-none"
            }`}
        >
          <button
            onClick={() => setIsColorModalOpen(true)}
            className="w-12 h-12 bg-card border shadow-md rounded-full flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
            title="Ubah Warna Tema"
          >
            <Palette size={20} weight="bold" />
          </button>
          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark")
              setIsOpen(false)
            }}
            className="w-12 h-12 bg-card border shadow-md rounded-full flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
            title="Ubah Tema"
          >
            {theme === "dark" ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
          </button>
          <button
            onClick={() => {
              router.push("/mutasi")
              setIsOpen(false)
            }}
            className="w-12 h-12 bg-card border shadow-md rounded-full flex items-center justify-center text-primary hover:bg-muted/50 transition-colors"
            title="Mutasi"
          >
            <ChartLineIcon size={20} weight="bold" />
          </button>
        </div>

        {/* Main FAB */}
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 touch-none ${isDragging ? "cursor-grabbing scale-95" : "cursor-pointer hover:scale-105"
            } bg-primary text-primary-foreground`}
        >
          <Plus
            size={24}
            weight="bold"
            className={`transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}
          />
        </button>
      </div>

      <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ubah Warna Tema</DialogTitle>
            <DialogDescription>
              Pilih warna aksen utama yang Anda inginkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-4 py-6 justify-center">
            {/* Supabase Green */}
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
    </>
  )
}
