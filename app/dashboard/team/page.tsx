import Link from "next/link";
import { 
  Plus, 
  Trash2, 
  ShieldAlert, 
  User, 
  MoreHorizontal
} from "lucide-react";

export default function TeamPage() {
  const teamMembers = [
    {
      id: "usr_1",
      name: "Sarah Jenkins",
      email: "sarah.j@indigomarket.com",
      role: "ADMIN",
      roleColor: "bg-indigo-100 text-indigo-700",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop"
    },
    {
      id: "usr_2",
      name: "Marcus Thorne",
      email: "m.thorne@indigomarket.com",
      role: "EMPLOYEE",
      roleColor: "bg-gray-200 text-gray-700",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&h=150&auto=format&fit=crop"
    },
    {
      id: "usr_3",
      name: "Elena Rodriguez",
      email: "e.rodriguez@indigomarket.com",
      role: "EMPLOYEE",
      roleColor: "bg-gray-200 text-gray-700",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&h=150&auto=format&fit=crop"
    }
  ];

  const deliveries = [
    {
      id: "#ORD-88219",
      desc: "Premium Hardware Kit",
      status: "Delivered",
      statusColor: "bg-emerald-500",
      arrival: "Oct 24, 02:30 PM",
      assignee: "Sarah Jenkins",
      initials: "SJ",
      initialColor: "bg-indigo-100 text-indigo-700"
    },
    {
      id: "#ORD-88224",
      desc: "Organic Textiles Bulk",
      status: "In Transit",
      statusColor: "bg-blue-500",
      arrival: "Today, 06:15 PM",
      assignee: "Marcus Thorne",
      initials: "MT",
      initialColor: "bg-gray-100 text-gray-700"
    },
    {
      id: "#ORD-88301",
      desc: "Industrial Electronics",
      status: "Processing",
      statusColor: "bg-gray-400",
      arrival: "Oct 26, 09:00 AM",
      assignee: "Elena Rodriguez",
      initials: "ER",
      initialColor: "bg-gray-100 text-gray-700"
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header section as seen in the mockup (though in mockup it uses "Team & Delivery" as a master title) */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Team & Delivery</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Core Team</h2>
          <p className="text-sm text-gray-500 mt-1">Manage organization members and their access levels.</p>
        </div>
        <Link 
          href="/dashboard/team/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </Link>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {teamMembers.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-50 shadow-sm">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <span className={`px-2.5 py-1 text-[9px] font-extrabold tracking-widest uppercase rounded-full ${member.roleColor}`}>
                {member.role}
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500 italic mt-0.5">{member.email}</p>
            </div>

            <div className="mt-auto flex gap-3">
              <Link 
                href={`/dashboard/team/${member.id}`}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-bold rounded-xl text-center transition"
              >
                Edit
              </Link>
              <button className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Delivery Tracking */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Live Delivery Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time status of outgoing marketplace shipments.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-[11px] font-bold text-gray-900 bg-gray-200 rounded-full tracking-wider transition">
            All Orders
          </button>
          <button className="px-4 py-2 text-[11px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full tracking-wider transition">
            In Transit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase bg-gray-50/50">
               <tr>
                 <th className="px-6 py-5 rounded-tl-xl whitespace-nowrap">Order ID</th>
                 <th className="px-6 py-5">Status</th>
                 <th className="px-6 py-5 whitespace-nowrap">Estimated Arrival</th>
                 <th className="px-6 py-5">Assignee</th>
                 <th className="px-6 py-5 rounded-tr-xl text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {deliveries.map(delivery => (
                 <tr key={delivery.id} className="hover:bg-gray-50/50 transition">
                   <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{delivery.id}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{delivery.desc}</div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${delivery.statusColor}`}></div>
                         <span className="font-semibold text-gray-700">{delivery.status}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 font-medium text-gray-900">{delivery.arrival}</td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${delivery.initialColor}`}>
                            {delivery.initials}
                         </div>
                         <span className="text-xs font-semibold text-gray-700">{delivery.assignee}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <button className="text-xs font-bold text-indigo-700 hover:text-indigo-800 transition">
                         Track Link
                      </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
