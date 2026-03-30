import Link from "next/link";
import { 
  Package, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Maximize2,
  ChevronDown,
  Filter,
  MoreHorizontal
} from "lucide-react";

export default function DeliveryPage() {
  const carriers = [
    { id: 1, acronym: "FX", bg: "bg-indigo-100 text-indigo-700", name: "FastX Logistics", subtitle: "GLOBAL PARTNER", score: "98.4%", color: "bg-emerald-600" },
    { id: 2, acronym: "SD", bg: "bg-fuchsia-100 text-fuchsia-700", name: "Swift Dash", subtitle: "LOCAL EXPRESS", score: "96.2%", color: "bg-emerald-600" },
    { id: 3, acronym: "UE", bg: "bg-blue-100 text-blue-700", name: "Urban Express", subtitle: "SAME DAY", score: "89.1%", color: "bg-amber-500" },
    { id: 4, acronym: "NT", bg: "bg-gray-100 text-gray-700", name: "Night Train", subtitle: "BULK FREIGHT", score: "94.8%", color: "bg-emerald-600" }
  ];

  const shipments = [
    {
      id: "#ORD-9921",
      customer: "Jane Doe",
      initials: "JD",
      initialBg: "bg-indigo-100 text-indigo-700",
      destination: "Seattle, WA",
      status: "IN TRANSIT",
      statusColor: "bg-indigo-100 text-indigo-700",
      arrival: "Today, 4:00 PM"
    },
    {
      id: "#ORD-9844",
      customer: "Michael Smith",
      initials: "MS",
      initialBg: "bg-fuchsia-100 text-fuchsia-700",
      destination: "Austin, TX",
      status: "OUT FOR DELIVERY",
      statusColor: "bg-purple-100 text-purple-700",
      arrival: "Pending"
    },
    {
      id: "#ORD-9721",
      customer: "Robert King",
      initials: "RK",
      initialBg: "bg-gray-100 text-gray-700",
      destination: "Miami, FL",
      status: "PENDING",
      statusColor: "bg-gray-100 text-gray-700",
      arrival: "Tomorrow"
    },
    {
      id: "#ORD-9610",
      customer: "Laura Chen",
      initials: "LC",
      initialBg: "bg-emerald-100 text-emerald-700",
      destination: "New York, NY",
      status: "DELIVERED",
      statusColor: "bg-emerald-100 text-emerald-700",
      arrival: "Completed"
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Delivery Management</h1>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Deliveries */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Package className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1">
              <span className="text-[10px]">↗</span> 12%
            </span>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Active Deliveries</div>
            <div className="text-4xl font-black text-gray-900">1,284</div>
          </div>
        </div>

        {/* Pending Pickup */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-fuchsia-50 rounded-2xl flex items-center justify-center text-fuchsia-600">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1">
              <span className="text-[10px]">↘</span> 4%
            </span>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Pending Pickup</div>
            <div className="text-4xl font-black text-gray-900">42</div>
          </div>
        </div>

        {/* Avg Delivery Time */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-900 rounded-2xl flex items-center justify-center text-emerald-100 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-500">Avg vs Last Week</span>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Avg Delivery Time</div>
            <div className="text-4xl font-black text-gray-900 flex items-baseline gap-1">
              2.4 <span className="text-xl font-bold text-gray-400">hrs</span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="w-10 h-2 bg-emerald-700 rounded-full mt-2"></div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Success Rate</div>
            <div className="text-4xl font-black text-gray-900 flex items-baseline gap-1">
              99.2 <span className="text-xl font-bold text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Live Tracking Map Component */}
        <div className="lg:col-span-2 bg-gray-900 rounded-[24px] shadow-lg border border-gray-800 overflow-hidden relative flex flex-col">
          {/* Header Map */}
          <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <h2 className="text-xl font-extrabold text-white">Live Tracking</h2>
              <p className="text-sm font-medium text-gray-300">Order #FL-9920 • En Route to Chicago, IL</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-xs font-bold rounded-full shadow-lg hover:scale-105 transition transform">
              <Maximize2 className="w-4 h-4" /> Expand Map
            </button>
          </div>
          
          {/* Map Image Mock */}
          <div className="flex-1 w-full bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&h=400&auto=format&fit=crop')] bg-cover bg-center min-h-[300px] relative">
            <div className="absolute inset-0 bg-[#0f172a]/60 mix-blend-multiply"></div>
            {/* Mock pins */}
            <div className="absolute top-[30%] right-[30%] w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-pulse"></div>
            <div className="absolute bottom-[40%] left-[20%] w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]"></div>
            {/* SVG curved path mock */}
            <svg className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0px 0px 4px rgba(59,130,246,0.8))" }}>
               <path d="M 20% 60% Q 40% 80% 60% 50% T 70% 30%" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_20s_linear_infinite]" />
            </svg>
          </div>
        </div>

        {/* Carrier Performance */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full">
          <h2 className="text-lg font-extrabold text-gray-900 mb-6">Carrier Performance</h2>
          
          <div className="space-y-6 flex-1">
            {carriers.map(carrier => (
              <div key={carrier.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${carrier.bg}`}>
                      {carrier.acronym}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm leading-tight">{carrier.name}</div>
                      <div className="text-[9px] font-extrabold text-gray-400 tracking-widest uppercase mt-0.5">{carrier.subtitle}</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-emerald-600 text-sm">{carrier.score}</div>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden flex justify-end">
                  <div className={`h-full ${carrier.color}`} style={{ width: carrier.score }}></div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 bg-white border border-indigo-100 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition">
            View Full Analytics
          </button>
        </div>
      </div>

      {/* Active Shipments Section */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Table Header Action Row */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-gray-900">Active Shipments</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-full transition">
              All Statuses <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-full transition">
              All Carriers <ChevronDown className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Order ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Customer Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Destination</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Est. Arrival</th>
                <th className="px-6 py-4 rounded-tr-xl text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shipments.map((shipment, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-6">
                    <Link href="#" className="font-bold text-indigo-700 hover:underline">{shipment.id}</Link>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${shipment.initialBg}`}>
                        {shipment.initials}
                      </div>
                      <span className="font-bold text-gray-900">{shipment.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-gray-600 font-medium">
                    {shipment.destination}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 text-[9px] font-extrabold tracking-widest uppercase rounded-full ${shipment.statusColor}`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-semibold text-gray-900">
                    {shipment.arrival}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="text-gray-400 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info & Pagination */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">
            Showing <span className="font-bold text-gray-900">4</span> of <span className="font-bold text-gray-900">1,284</span> deliveries
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 shadow-sm transition">
              &lsaquo;
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 shadow-sm transition">
              &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
