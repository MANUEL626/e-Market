import Link from "next/link";
import { 
  ChevronRight, 
  Camera, 
  ShieldAlert, 
  LayoutGrid, 
  Package, 
  ClipboardList,
  Check,
  User
} from "lucide-react";

export default function EditTeamMemberPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">
            <Link href="/dashboard/team" className="hover:text-gray-900 transition">Members</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{isNew ? "Add Member" : "Edit Member"}</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-[#3730A3] tracking-tight">Fluid Marketplace</h1>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">{isNew ? "New Profile" : "Edit Member Profile"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
             <div className="relative mb-6">
               <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                 <img src={isNew ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop" : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop"} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 transition">
                 <Camera className="w-4 h-4" />
               </button>
             </div>
             
             <h2 className="text-2xl font-extrabold text-gray-900">
               {isNew ? "New User" : "Sarah Jenkins"}
             </h2>
             <p className="text-sm text-gray-500 mb-4">
               {isNew ? "user@fluidmarketplace.com" : "sarah.jenkins@fluidmarketplace.com"}
             </p>
             
             <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-extrabold tracking-widest uppercase rounded-full mb-8">
               ● Admin Access
             </div>

             <div className="w-full border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Joined</div>
                  <div className="text-sm font-bold text-gray-900">{isNew ? "Today" : "Mar 2023"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase mb-1">Status</div>
                  <div className="text-sm font-bold text-emerald-600">Active</div>
                </div>
             </div>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100/50">
             <div className="flex items-center gap-2 text-indigo-700 font-bold mb-3">
                <ShieldAlert className="w-5 h-5" /> Pro Tip
             </div>
             <p className="text-sm text-gray-600 leading-relaxed">
               Admins have full visibility of financial analytics and inventory logs. Ensure the role matches the member's operational requirements.
             </p>
          </div>
        </div>

        {/* Right Column: Editing Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Information */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-extrabold text-gray-900">General Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  defaultValue={isNew ? "" : "Sarah Jenkins"}
                  placeholder="e.g. John Doe" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={isNew ? "" : "sarah.jenkins@fluidmarketplace.com"}
                  placeholder="name@company.com" 
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-extrabold text-gray-900">Role Selection</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Admin Option - Selected */}
               <div className="relative border-2 border-indigo-600 bg-indigo-50/20 p-6 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition flex flex-col items-start text-left">
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl mb-4 flex items-center justify-center shadow-md">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-extrabold text-gray-900 mb-2">Admin</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Full access to all modules, financial data, and team management.
                  </p>
               </div>

               {/* Employee Option - Unselected */}
               <div className="relative border-2 border-transparent bg-gray-50 p-6 rounded-2xl cursor-pointer hover:bg-gray-100 transition flex flex-col items-start text-left">
                  <div className="w-12 h-12 bg-white text-gray-400 border border-gray-200 rounded-xl mb-4 flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-extrabold text-gray-900 mb-2">Employee</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Limited access. Can manage inventory and process orders only.
                  </p>
               </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-extrabold text-gray-900">Permissions</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Granular access control for this specific member.</p>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <LayoutGrid className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-gray-900 text-sm">View Analytics</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <Package className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-gray-900 text-sm">Manage Inventory</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <div className="flex items-center gap-4">
                  <ClipboardList className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-gray-900 text-sm">Handle Orders</span>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 text-right">
             <Link href="/dashboard/team" className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition">
               Cancel
             </Link>
             <button className="px-8 py-3 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm">
               {isNew ? "Create Member" : "Save Changes"}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
