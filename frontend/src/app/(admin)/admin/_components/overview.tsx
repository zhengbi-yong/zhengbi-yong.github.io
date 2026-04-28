'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const data = [
  { name: '1月', comments: 42, users: 8 },
  { name: '2月', comments: 38, users: 5 },
  { name: '3月', comments: 55, users: 12 },
  { name: '4月', comments: 48, users: 7 },
  { name: '5月', comments: 62, users: 10 },
  { name: '6月', comments: 45, users: 6 },
  { name: '7月', comments: 51, users: 9 },
  { name: '8月', comments: 58, users: 11 },
  { name: '9月', comments: 43, users: 4 },
  { name: '10月', comments: 67, users: 15 },
  { name: '11月', comments: 52, users: 8 },
  { name: '12月', comments: 39, users: 6 },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value}`}
        />
        <Bar
          dataKey="comments"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
        <Bar
          dataKey="users"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary/40"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
