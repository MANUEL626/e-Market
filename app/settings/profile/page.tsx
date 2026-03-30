import { 
  Edit2, 
  Shield, 
  Bell, 
  ChevronRight, 
  Key, 
  Copy, 
  Trash2 
} from "lucide-react";

export default function ProfileSettingsPage() {
  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Settings</h1>
        <p className="text-gray-500 text-sm">Update your personal information and manage your organization details.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase px-4">User Settings</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Col: Profile & Store details */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-6 mb-8">
               <div className="relative">
                 <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm border-4 border-white">
                   <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                 </div>
                 <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#3730A3] hover:bg-[#2e2889] text-white rounded-full flex items-center justify-center border-2 border-white transition shadow-sm">
                   <Edit2 className="w-3 h-3" />
                 </button>
               </div>
               <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-500 mt-1">Update your avatar and personal details</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Alexander Hamilton"
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="alex@fluidmarketplace.com"
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Bio</label>
              <textarea 
                rows={3}
                defaultValue="Digital entrepreneur focused on streamlining global supply chains through the Fluid Marketplace ecosystem."
                className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-50 mt-6">
              <button className="px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm">
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Security & Notifications */}
        <div className="space-y-6">
            
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold">Security</h3>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-xl transition">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Change Password</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Last changed 3 months ago</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                   <div>
                      <div className="text-[11px] font-extrabold text-emerald-800 tracking-widest uppercase">2FA Status</div>
                      <div className="text-xs text-emerald-600 mt-1">Enabled via Authenticator App</div>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold">Notifications</h3>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  <div className="w-10 h-6 bg-[#3730A3] rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer shadow-inner transition">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>
             </div>
          </div>
          
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase px-4">Organization Settings</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
              <h2 className="text-xl font-extrabold mb-6 text-gray-900">General Store Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue="Indigo Collective"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Website</label>
                  <input 
                    type="text" 
                    defaultValue="https://indigocollective.io"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition"
                  />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
                 <select className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 transition appearance-none cursor-pointer">
                    <option>Art & Creative Studio</option>
                    <option>Software Development</option>
                    <option>E-commerce Retail</option>
                 </select>
              </div>
            </div>
         </div>

         <div>
           <div className="bg-white p-6 rounded-[24px] border-l-4 border-[#3730A3] border-gray-100 border-r-0 border-t-0 border-b-0 shadow-lg relative overflow-hidden h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-extrabold text-gray-900">Current Plan</h3>
                 <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold tracking-widest uppercase rounded-md border border-indigo-100">Pro Plus</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                 <div className="text-4xl font-black text-gray-900">$149</div>
                 <div className="text-sm font-medium text-gray-500 pb-1">/mo</div>
              </div>
              <p className="text-[11px] text-gray-500 mb-6">Next billing date: Oct 24, 2023</p>
              
              <div className="flex gap-2 items-center text-sm font-medium text-gray-700 bg-gray-50 py-2 px-3 rounded-xl w-fit mb-6">
                 <div className="w-6 h-4 bg-[#0a2540] rounded flex items-center justify-center relative overflow-hidden text-white italic text-[8px] font-bold">vis</div>
                 <span className="text-gray-400">••••</span> 4242
              </div>
              
              <button className="w-full py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-full transition shadow-sm">
                 Manage Payment
              </button>
           </div>
         </div>

         {/* API Kyes part integrated inside profile mock visually */}
         <div className="lg:col-span-3 mt-4">
            <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative">
                <div className="flex items-center justify-between mb-6">
                   <div>
                      <h2 className="text-xl font-extrabold text-gray-900">API Keys</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage credentials for developer integrations</p>
                   </div>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-bold rounded-full transition shadow-sm">
                      <span className="text-lg leading-none">+</span> Create Key
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center text-gray-400">
                           <Key className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-gray-900">Production_Live_Key</div>
                            <code className="text-[11px] text-gray-400 font-mono mt-0.5 block">pk_live_*************************8e2</code>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Copy className="w-4 h-4" /></button>
                         <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>

                   <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center text-gray-400">
                           <Key className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-gray-900">Staging_Secret_Key</div>
                            <code className="text-[11px] text-gray-400 font-mono mt-0.5 block">sk_test_*************************v4a</code>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Copy className="w-4 h-4" /></button>
                         <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                </div>
            </div>
         </div>

      </div>
    </div>
  );
}
