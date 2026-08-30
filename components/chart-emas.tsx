"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { DotsThreeVertical } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "Grafik Harga Emas Saat Ini"

const chartConfig = {
  harga: {
    label: "Harga Emas",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartEmas() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchGoldData() {
      setLoading(true)
      try {
        const response = await fetch('/api/gold-price')
        const result = await response.json()
        if (result.status === 'success') {
          setChartData(result.data)
        }
      } catch (error) {
        console.error("Gagal mengambil data harga emas:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchGoldData()
  }, [])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [chartData, timeRange])

  // Get min and max for YAxis domain to make chart look dynamic
  const minHarga = Math.min(...filteredData.map(d => d.harga)) - 10000
  const maxHarga = Math.max(...filteredData.map(d => d.harga)) + 10000

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b pt-3 pb-4">
        <div className="flex flex-col gap-1 flex-1 text-left">
          <CardTitle className="text-base sm:text-lg">Pergerakan Harga Emas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Grafik fluktuasi harga emas Antam per Gram
          </CardDescription>
        </div>
        {/* Mobile Filter (Titik Tiga) */}
        <div className="sm:hidden ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors">
              <DotsThreeVertical size={24} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeRange("7d")} className="flex justify-between">
                7 Hari {timeRange === "7d" && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("30d")} className="flex justify-between">
                30 Hari {timeRange === "30d" && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("90d")} className="flex justify-between">
                3 Bulan {timeRange === "90d" && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Filter (Select) */}
        <div className="hidden sm:block ml-auto">
          <Select value={timeRange} onValueChange={(value) => {
            if (value) setTimeRange(value)
          }}>
            <SelectTrigger
              className="w-[160px]"
              aria-label="Pilih rentang waktu"
            >
              <SelectValue placeholder="30 Hari Terakhir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">
                7 Hari
              </SelectItem>
              <SelectItem value="30d">
                30 Hari
              </SelectItem>
              <SelectItem value="90d">
                3 Bulan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Memuat data harga emas...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Belum ada data harga untuk ditampilkan.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillHarga" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-harga)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-harga)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)", textAnchor: "middle" }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                hide={true}
                domain={[minHarga, maxHarga]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelClassName="text-center pb-1"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    }}
                    indicator="line"
                    formatter={(value: any, name, props) => {
                       return <div className="flex w-full justify-between items-center gap-4">
                         <span className="text-muted-foreground">Harga per Gram</span>
                         <span className="font-bold">Rp {parseInt(value).toLocaleString('id-ID')}</span>
                       </div>
                    }}
                  />
                }
              />
              <Area
                dataKey="harga"
                type="natural"
                fill="url(#fillHarga)"
                stroke="var(--color-harga)"
                strokeWidth={2}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
