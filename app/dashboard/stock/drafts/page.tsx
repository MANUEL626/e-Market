"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Archive, 
  Timer, 
  CheckCircle2, 
  LayoutGrid, 
  List, 
  PenTool, 
  CheckCircle, 
  Trash2,
  FileBox,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { AdminRequired } from "@/components/dashboard/admin-required";
import { isAdminProfile } from "@/lib/authz";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";

export default function DraftsPage() {
  const { profile, loading } = useMemberProfile();
  const isAdmin = isAdminProfile(profile);
  const drafts = [
    {
      id: "DRF-001",
      name: "Modern Desk Lamp",
      category: "OFFICE",
      modified: "Last modified Oct 12, 2023",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=300&h=300&auto=format&fit=crop",
      integrity: 85,
    },
    {
      id: "DRF-002",
      name: "Ergonomic Office Chair",
      category: "FURNITURE",
      modified: "Last modified Oct 14, 2023",
      image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=300&h=300&auto=format&fit=crop",
      integrity: 60,
    },
    {
      id: "DRF-003",
      name: "Instant Camera Bundle",
      category: "ELECTRONICS",
      modified: "Last modified Oct 15, 2023",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=300&h=300&auto=format&fit=crop",
      integrity: 95,
    },
    {
      id: "DRF-004",
      name: "Athletic Running Shoes",
      category: "APPAREL",
      modified: "Last modified Oct 16, 2023",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&h=300&auto=format&fit=crop",
      integrity: 30,
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Verification des droits...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminRequired description="Seul un administrateur peut acceder aux brouillons d'articles." />
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition text-gray-500 hover:text-gray-900 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Drafts Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Review and complete your product listings before publishing.</p>
          </div>
        </div>
        <div>
          <button className="px-6 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-bold rounded-full transition shadow-sm">
            Publish All
          </button>
        </div>
      </div>

      {/* Draft KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
           <div>
             <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Total Drafts</div>
             <div className="text-4xl font-black text-gray-900">12</div>
           </div>
           <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
             <Archive className="w-6 h-6" />
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
           <div>
             <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Expiring Soon</div>
             <div className="text-4xl font-black text-rose-600">2</div>
           </div>
           <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
             <Timer className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between">
           <div>
             <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Ready to Publish</div>
             <div className="text-4xl font-black text-emerald-600">5</div>
           </div>
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
             <CheckCircle2 className="w-6 h-6" />
           </div>
        </div>
      </div>

      {/* Drafts Section */}
      <div className="flex items-center justify-between mb-6">
         <h2 className="text-xl font-bold text-gray-900">Current Drafts</h2>
         <div className="flex gap-2">
            <button className="p-2.5 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition">
               <List className="w-4 h-4" />
            </button>
            <button className="p-2.5 bg-gray-100 text-gray-900 rounded-xl transition">
               <LayoutGrid className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">
         {drafts.map(draft => (
           <div key={draft.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition">
             {/* Image */}
             <div className="w-32 h-32 rounded-2xl overflow-hidden relative flex-shrink-0 border border-gray-100 shadow-inner">
               <Image
                 src={draft.image}
                 alt={draft.name}
                 fill
                 className="object-cover"
                 sizes="128px"
               />
               <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[9px] font-bold text-white tracking-wider">
                 {draft.category}
               </div>
             </div>

             {/* Content */}
             <div className="flex-1 flex flex-col justify-between">
                <div>
                   <div className="flex items-start justify-between mb-1">
                     <h3 className="font-bold text-gray-900 text-lg leading-tight">{draft.name}</h3>
                     <div className="flex items-center gap-1.5 flex-shrink-0">
                       <button className="w-7 h-7 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition">
                         <PenTool className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition">
                         <CheckCircle className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-7 h-7 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 transition">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   </div>
                   <div className="text-xs text-gray-500">{draft.modified}</div>
                </div>

                <div className="mt-4">
                   <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                     <span className="text-gray-500">Draft Integrity</span>
                     <span className="text-indigo-700">{draft.integrity}%</span>
                   </div>
                   <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                       style={{ width: `${draft.integrity}%` }}
                     ></div>
                   </div>
                </div>
             </div>
           </div>
         ))}
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col items-center mt-20 text-center">
         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-inner">
            <FileBox className="w-8 h-8" />
         </div>
         <h4 className="text-xl font-bold text-gray-900 mb-2">Showing 4 of 12 Drafts</h4>
         <p className="text-gray-500 text-sm max-w-sm mb-8">
           Refine your search or create a new listing to populate your marketplace stock.
         </p>
         <div className="flex gap-4">
           <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition">
             Previous
           </button>
           <button className="px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-xl shadow-sm transition">
             Next Page
           </button>
         </div>
      </div>
    </div>
  );
}
