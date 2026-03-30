import { 
  Calendar,
  CreditCard,
  Download,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  Edit2
} from "lucide-react";

export default function BillingSettingsPage() {
  const invoices = [
    { date: "Sep 12, 2023", amount: "$149.00", status: "Paid", color: "text-emerald-700 bg-emerald-50" },
    { date: "Aug 12, 2023", amount: "$149.00", status: "Paid", color: "text-emerald-700 bg-emerald-50" },
    { date: "Jul 12, 2023", amount: "$149.00", status: "Paid", color: "text-emerald-700 bg-emerald-50" },
    { date: "Jun 12, 2023", amount: "$149.00", status: "Paid", color: "text-emerald-700 bg-emerald-50" },
    { date: "May 12, 2023", amount: "$149.00", status: "Paid", color: "text-emerald-700 bg-emerald-50" }
  ];

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Billing & Subscriptions</h1>
        <p className="text-gray-500 text-sm">Manage your plan, payment methods, and billing history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Col (2 slots): Current Plan */}
        <div className="lg:col-span-2">
           <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="px-3 py-1 bg-indigo-100 text-[#3730A3] text-[10px] font-extrabold tracking-widest uppercase rounded-full w-fit mb-6">Current Plan</div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Pro Plus</h2>
                    <div className="flex items-end gap-1">
                       <span className="text-2xl font-extrabold text-gray-900">$149</span>
                       <span className="text-sm font-medium text-gray-500 pb-1">/mo</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3 min-w-[200px]">
                    <button className="w-full py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-bold rounded-full transition shadow-sm">
                      Change Plan
                    </button>
                    <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-full transition">
                      Cancel Subscription
                    </button>
                 </div>
              </div>
              
              <div className="pt-6 flex items-center gap-3 text-sm text-gray-700">
                 <Calendar className="w-4 h-4 text-gray-400" />
                 Next billing date: <span className="font-bold text-gray-900">October 12, 2023</span>
              </div>
           </div>
        </div>

        {/* Right Col: Upcoming Invoice */}
        <div>
           <div className="bg-gray-50 p-8 rounded-[24px] border border-gray-200 border-dashed h-full flex flex-col justify-center relative">
              <div className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">Upcoming Invoice</div>
              <div className="text-5xl font-black text-gray-900 mb-2 tracking-tighter">$149.00</div>
              <div className="text-sm text-gray-500 mb-8">Due on Oct 12, 2023</div>
              
              <button className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-800 transition">
                View Draft Details <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Left Col: Payment Method & Plan Usage */}
         <div className="space-y-8">
            <div className="bg-white rounded-[24px]">
               <h3 className="text-lg font-extrabold text-gray-900 mb-4">Payment Method</h3>
               
               <div className="border border-gray-200 rounded-[20px] p-6 mb-4 relative hover:border-indigo-300 transition cursor-pointer shadow-sm">
                  <div className="absolute top-6 right-6 text-indigo-600"><Edit2 className="w-4 h-4" /></div>
                  <div className="flex gap-4">
                     <div className="w-12 h-8 bg-[#ff5f00] rounded overflow-hidden flex relative shadow-sm shrink-0">
                       <div className="absolute w-5 h-5 bg-red-500 rounded-full left-1.5 top-1.5 mix-blend-multiply opacity-90"></div>
                       <div className="absolute w-5 h-5 bg-yellow-400 rounded-full right-1.5 top-1.5 mix-blend-multiply opacity-90"></div>
                     </div>
                     <div>
                        <div className="font-bold text-sm text-gray-900">Mastercard ending in 4242</div>
                        <div className="text-xs text-gray-500 mt-1">Expires 12/26</div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl flex gap-3 mb-4 items-start border border-emerald-100/50">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="font-medium leading-relaxed">Your payment information is stored securely and encrypted.</p>
               </div>

               <button className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-600 font-bold text-sm rounded-[20px] hover:bg-gray-50 transition flex items-center justify-center gap-2">
                 <Plus className="w-4 h-4" /> Add New Method
               </button>
            </div>

            {/* Plan Usage block (Blue visual) */}
            <div className="bg-[#3730A3] p-6 rounded-[24px] shadow-lg relative overflow-hidden">
               <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 border border-white/10 rounded-tl-full mix-blend-overlay"></div>
               <h4 className="text-[10px] font-bold text-indigo-200 tracking-widest uppercase mb-6">Plan Usage</h4>
               
               <div className="space-y-5 relative z-10">
                  <div>
                    <div className="flex justify-between text-xs text-indigo-100 font-semibold mb-2">
                      <span>API Calls</span>
                      <span>82%</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
                      <div className="w-[82%] h-full bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-indigo-100 font-semibold mb-2">
                      <span>Seats</span>
                      <span>12/20</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
                      <div className="w-[60%] h-full bg-indigo-300 rounded-full"></div>
                    </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Col: Billing History */}
         <div className="lg:col-span-2">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex justify-between items-center">
               Billing History
               <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">
                 <Filter className="w-4 h-4" /> Filter
               </button>
            </h3>
            
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase border-b border-gray-100">
                     <tr>
                       <th className="px-6 py-5">Date</th>
                       <th className="px-6 py-5">Amount</th>
                       <th className="px-6 py-5">Status</th>
                       <th className="px-6 py-5 text-right">Invoice</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {invoices.map((invoice, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/50 transition">
                         <td className="px-6 py-5 font-semibold text-gray-900">{invoice.date}</td>
                         <td className="px-6 py-5 font-bold text-gray-600">{invoice.amount}</td>
                         <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-extrabold tracking-wider rounded-md ${invoice.color}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {invoice.status}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-right">
                            <button className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition">
                              <Download className="w-5 h-5" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                 <button className="w-full py-2.5 text-sm font-bold text-indigo-700 hover:text-indigo-800 transition text-center">
                   View all past invoices
                 </button>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-gray-50 p-6 sm:p-8 rounded-[24px] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-6 h-6 text-[#3730A3]" />
            </div>
            <div>
               <h4 className="text-lg font-extrabold text-gray-900">Questions about your billing?</h4>
               <p className="text-sm text-gray-500 mt-1">Our support team is available 24/7 to help you with any payment or subscription issues.</p>
            </div>
         </div>
         <button className="px-8 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-bold rounded-full transition shadow-sm whitespace-nowrap">
            Contact Support
         </button>
      </div>

    </div>
  );
}
