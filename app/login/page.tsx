"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LockKey, EnvelopeSimple, GarageIcon, Eye, EyeClosed } from "@phosphor-icons/react"
import { toast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.add({
        title: "Gagal Login",
        description: "Email dan password tidak boleh kosong.",
      })
      return
    }

    setIsLoading(true)

    try {
      // Asumsi menggunakan Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.add({
          title: "Login Gagal",
          description: error.message || "Email atau password salah.",
        })
      } else {
        toast.add({
          title: "Berhasil Login",
          description: "Selamat datang kembali!",
        })
        router.push("/")
      }
    } catch (error) {
      toast.add({
        title: "Terjadi Kesalahan",
        description: "Gagal menghubungi server.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

      <Card className="w-full max-w-md z-10 shadow-xl border-primary/10 rounded-none bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 flex items-center justify-center text-primary">
              <GarageIcon weight="duotone" className="w-24 h-24" />

            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Jaya Maju Bersama</CardTitle>
          <CardDescription className="text-muted-foreground">
            Silakan login untuk mengakses dashboard keuangan Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 relative">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <EnvelopeSimple size={18} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10 h-12 rounded-none bg-background/50 border-muted focus:border-primary transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <LockKey size={18} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 rounded-none bg-background/50 border-muted focus:border-primary transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-4 rounded-none text-md font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            Akses sistem ini terbatas untuk pengguna yang berwenang.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
