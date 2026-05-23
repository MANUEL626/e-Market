"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Package,
  PenTool,
  Plus,
  ShoppingCart,
  UserPlus,
  Zap,
} from "lucide-react";
import { isAdminProfile } from "@/lib/authz";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";

const OverviewSalesChart = dynamic(
  () =>
    import("@/components/charts/overview-sales-chart").then(
      (m) => m.OverviewSalesChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[240px] w-full min-h-[240px] rounded-xl bg-gray-50 animate-pulse"
        aria-hidden
      />
    ),
  }
);

const data = [
  { name: 'MON', value: 400 },
  { name: 'TUE', value: 300 },
  { name: 'WED', value: 600 },
  { name: 'THU', value: 500 },
  { name: 'FRI', value: 700 },
  { name: 'SAT', value: 450 },
  { name: 'SUN', value: 350 },
];

export default function DashboardPage() {
  const { profile } = useMemberProfile();
  const isAdmin = isAdminProfile(profile);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Merchant Overview</h1>
        <p className="text-gray-500">Welcome back, Alex. Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">+12.5%</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Total Revenue</div>
            <div className="text-2xl font-black text-gray-900">$128,430.00</div>
          </div>
          <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-600 w-3/4"></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-fuchsia-50 rounded-lg flex items-center justify-center text-fuchsia-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">+8.2%</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Total Orders</div>
            <div className="text-2xl font-black text-gray-900">1,842</div>
          </div>
          <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
             <div className="h-full bg-fuchsia-600 w-[60%]"></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">Stable</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Active Products</div>
            <div className="text-2xl font-black text-gray-900">432</div>
          </div>
          <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-600 w-full"></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">98%</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Team Performance</div>
            <div className="text-2xl font-black text-gray-900">Excellent</div>
          </div>
          <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
             <div className="h-full bg-blue-600 w-[95%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Main Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Sales Trends</h3>
                <p className="text-sm text-gray-500">Daily performance across all categories</p>
              </div>
              <select className="bg-gray-50 border-none text-xs font-bold text-gray-600 py-2 pl-4 pr-8 rounded-full focus:ring-0 cursor-pointer">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>This Year</option>
              </select>
            </div>
            
            <OverviewSalesChart data={data} />
          </div>

          {/* Bottom Alerts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1e1b4b] rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-end min-h-[180px]">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-luminosity"></div>
               <div className="relative z-10">
                 <div className="text-[10px] font-bold text-indigo-200 tracking-widest uppercase mb-2">System Status</div>
                 <h4 className="text-xl font-bold leading-tight">All systems operational in Asia-Pacific region.</h4>
               </div>
            </div>

            <div className="bg-[#047857] rounded-[2rem] p-8 text-white flex flex-col justify-center min-h-[180px]">
              <div className="text-[10px] font-bold text-emerald-200 tracking-widest uppercase mb-2">Inventory Alert</div>
              <h4 className="text-2xl font-bold leading-tight mb-4">4 items are reaching critical stock levels.</h4>
              <button className="flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-100 transition">
                Restock Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebars */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  <Link
                    href="/dashboard/stock/new"
                    className="w-full flex items-center justify-between p-4 bg-[#3730A3] hover:bg-[#2e2889] text-white rounded-2xl transition"
                  >
                    <span className="text-sm font-bold">Add New Product</span>
                    <Plus className="w-5 h-5 text-indigo-200" />
                  </Link>
                  <Link
                    href="/dashboard/stock/drafts"
                    className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl transition"
                  >
                    <span className="text-sm font-bold">Create New Draft</span>
                    <PenTool className="w-5 h-5 text-gray-400" />
                  </Link>
                  <Link
                    href="/dashboard/team/new"
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-2xl transition"
                  >
                    <span className="text-sm font-bold">Invite Member</span>
                    <UserPlus className="w-5 h-5 text-gray-400" />
                  </Link>
                </>
              ) : (
                <p className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  Les actions de gestion sont reservees aux administrateurs.
                </p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Recent Activity</h3>
               <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 tracking-wider uppercase">View All</button>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              <div className="relative flex items-start gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-blue-500 ring-4 ring-white shadow-sm z-10 flex-shrink-0 relative"></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">New Order #1234</div>
                  <div className="text-xs text-gray-500 mt-1">2 mins ago • $428.00</div>
                </div>
              </div>
              
              <div className="relative flex items-start gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-red-500 ring-4 ring-white shadow-sm z-10 flex-shrink-0 relative"></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Stock Low: Modern Lamp</div>
                  <div className="text-xs text-gray-500 mt-1">45 mins ago • 2 left</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm z-10 flex-shrink-0 relative"></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">New Member Joined: Sarah</div>
                  <div className="text-xs text-gray-500 mt-1">2 hours ago • Marketing</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-gray-400 ring-4 ring-white shadow-sm z-10 flex-shrink-0 relative"></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Payout Scheduled</div>
                  <div className="text-xs text-gray-500 mt-1">5 hours ago • $5,200.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Tier */}
          <div className="bg-[#4f46e5] rounded-[2rem] p-8 text-white relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl opacity-50"></div>
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=200&auto=format&fit=crop')] bg-cover rounded-xl shadow-md border border-white/10"></div>
                  <div>
                    <div className="text-[10px] font-bold text-indigo-200 tracking-widest uppercase">Growth Tier</div>
                    <div className="text-base font-bold">Top 5% Merchant</div>
                  </div>
               </div>
               <p className="text-sm text-indigo-100 leading-relaxed mb-6">
                 You've reached your monthly sales goal in record time! Keep it up to earn the "Premier Partner" badge next month.
               </p>
               <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition">
                 Review Perks
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
