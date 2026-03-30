"use client";

import Link from "next/link";
import { 
  ShoppingCart, 
  User, 
  Filter, 
  Plus, 
  TrendingUp,
  MoreVertical
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function SalesPage() {
  const chartData = [
    { name: 'MON', value: 4000 },
    { name: 'TUE', value: 3000 },
    { name: 'WED', value: 8000 },
    { name: 'THU', value: 3500 },
    { name: 'FRI', value: 4200 },
    { name: 'SAT', value: 3800 },
  ];

  const recentOrders = [
    {
      id: "#ORD-9021",
      customer: "Jordan Smith",
      initial: "JS",
      initialBg: "bg-blue-100 text-blue-700",
      avatar: null,
      date: "Oct 24, 2024",
      total: "$2,450.00",
      status: "DELIVERED",
      statusColors: "bg-emerald-100 text-emerald-700 font-bold"
    },
    {
      id: "#ORD-9022",
      customer: "Sarah Connor",
      initial: "SC",
      initialBg: "",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
      date: "Oct 24, 2024",
      total: "$840.50",
      status: "PROCESSING",
      statusColors: "bg-purple-100 text-purple-700 font-bold"
    },
    {
      id: "#ORD-9023",
      customer: "Mike Kruger",
      initial: "MK",
      initialBg: "bg-gray-100 text-gray-700",
      avatar: null,
      date: "Oct 23, 2024",
      total: "$1,200.00",
      status: "CANCELLED",
      statusColors: "bg-rose-100 text-rose-700 font-bold"
    },
    {
      id: "#ORD-9024",
      customer: "Elena Rossi",
      initial: "ER",
      initialBg: "bg-indigo-100 text-indigo-700",
      avatar: null,
      date: "Oct 23, 2024",
      total: "$3,120.00",
      status: "DELIVERED",
      statusColors: "bg-emerald-100 text-emerald-700 font-bold"
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header (Note: the mock shows "Sales Overview" in place of the search bar, but we just put it as a page title here if we're inside the layout) */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Sales Overview</h1>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Revenue - Large Blue Card */}
        <div className="bg-[#4f46e5] text-white p-8 rounded-[24px] shadow-sm flex flex-col justify-center relative overflow-hidden xl:col-span-1 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="text-[11px] font-bold text-indigo-100 tracking-widest uppercase mb-2">Total Revenue</div>
          <div className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">$128,430.00</div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-semibold w-fit backdrop-blur-sm">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% from last month
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-fuchsia-100 rounded-2xl flex items-center justify-center text-fuchsia-600">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <span className="text-emerald-600 text-sm font-extrabold">+8%</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">Active Orders</div>
            <div className="text-3xl font-extrabold text-gray-900">1,240</div>
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600">
              <User className="w-7 h-7" />
            </div>
            <span className="text-emerald-600 text-sm font-extrabold">+12%</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">New Customers</div>
            <div className="text-3xl font-extrabold text-gray-900">452</div>
          </div>
        </div>
      </div>

      {/* Nav Row & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-gray-100 p-1.5 rounded-full w-fit">
          <button className="px-6 py-2 bg-white text-indigo-700 font-bold text-sm rounded-full shadow-sm transition">
            Orders
          </button>
          <button className="px-6 py-2 text-gray-500 hover:text-gray-900 font-semibold text-sm rounded-full transition">
            Payments
          </button>
          <button className="px-6 py-2 text-gray-500 hover:text-gray-900 font-semibold text-sm rounded-full transition">
            Stats
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-full transition shadow-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">Recent Orders</h2>
            <Link href="#" className="text-sm font-bold text-indigo-700 hover:text-indigo-800 transition">View All</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-5">
                      <Link href="#" className="font-bold text-indigo-600 hover:underline">{order.id}</Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {order.avatar ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img src={order.avatar} alt={order.customer} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${order.initialBg}`}>
                            {order.initial}
                          </div>
                        )}
                        <span className="font-bold text-gray-900">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-medium">{order.date}</td>
                    <td className="px-6 py-5 font-extrabold text-gray-900">{order.total}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-full ${order.statusColors}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Sales Performance */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold text-gray-900">Sales Performance</h2>
            <button className="text-gray-400 hover:text-gray-900 transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-48 w-full mb-6 relative">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                  dy={10}
                />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                  {
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#4f46e5' : '#e5e7eb'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-gray-50">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]"></div>
                   <span className="text-sm font-medium text-gray-600">Gross Sales</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900">$9,400</div>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                   <span className="text-sm font-medium text-gray-600">Net Income</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900">$7,240</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
