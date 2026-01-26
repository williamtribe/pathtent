use client

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { TrendingUp, PieChartIcon, Tags } from "lucide-react"
import type { QuantitativeResult, YearlyCount, TechFieldCount, IPCCount } from "../lib/api"

// Color palette matching LDA visualization
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#f43f5e", // rose
]

interface ChartDataYearly {
  year: string
  count: number
}

interface ChartDataTechField {
  name: string
  value: number
  percentage: number
  color: string
}

interface ChartDataIPC {
  code: string
  description: string
  count: number
  percentage: number
  label: string
}

interface QuantitativeChartsProps {
  data: QuantitativeResult
}

export function QuantitativeCharts({ data }: QuantitativeChartsProps) {
  const hasYearlyData = data.yearly_trend.length > 0
  const hasTechFieldData = data.tech_field_distribution.length > 0
  const hasIPCData = data.ipc_distribution.length > 0

  // Format yearly trend data for chart
  const yearlyChartData = useMemo((): ChartDataYearly[] => {
    return data.yearly_trend.map((item: YearlyCount) => ({
      year: item.year.toString(),
      count: item.count,
    }))
  }, [data.yearly_trend])

  // Format tech field data for pie chart
  const techFieldChartData = useMemo((): ChartDataTechField[] => {
    return data.tech_field_distribution.map((item: TechFieldCount, idx: number) => ({
      name: item.field,
      value: item.count,
      percentage: item.percentage,
      color: COLORS[idx % COLORS.length] ?? "#6366f1",
    }))
  }, [data.tech_field_distribution])

  // Format IPC data for horizontal bar chart
  const ipcChartData = useMemo((): ChartDataIPC[] => {
    return data.ipc_distribution.slice(0, 10).map((item: IPCCount) => ({
      code: item.code,
      description: item.description || item.code,
      count: item.count,
      percentage: item.percentage,
      label: item.description ? `${item.code} (${item.description})` : item.code,
    }))
  }, [data.ipc_distribution])

  if (!hasYearlyData && !hasTechFieldData && !hasIPCData) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <p>No data available for quantitative analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Yearly Application Trend */}
      {hasYearlyData && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">연도별 출원 동향</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {yearlyChartData.length > 10 ? (
                <LineChart data={yearlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value ?? 0}건`, "출원 수"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={yearlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value ?? 0}건`, "출원 수"]}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Tech Field Distribution */}
      {hasTechFieldData && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">기술 분야별 비중</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={techFieldChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, payload }) => `${name} (${payload?.percentage ?? 0}%)`}
                  labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                >
                  {techFieldChartData.map((entry: ChartDataTechField, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, _name, props) => [
                    `${value ?? 0}건 (${(props.payload as ChartDataTechField)?.percentage ?? 0}%)`,
                    "특허 수",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* IPC Code Distribution */}
      {hasIPCData && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Tags className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">IPC 코드 분포 (Top 10)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ipcChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  width={95}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, _name, props) => [
                    `${value ?? 0}건 (${(props.payload as ChartDataIPC)?.percentage ?? 0}%)`,
                    "특허 수",
                  ]}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}
