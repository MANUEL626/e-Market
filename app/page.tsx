import Link from "next/link";
import { Bell, Settings, PackageOpen, Banknote, Truck, Users, ArrowRight, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Indigo Marketplace
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
            <Link href="/" className="text-indigo-600 border-b-2 border-indigo-600 pb-1">Marketplace</Link>
            <Link href="/" className="hover:text-gray-900">Solutions</Link>
            <Link href="/" className="hover:text-gray-900">Pricing</Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-gray-600">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="relative px-8 pt-20 pb-32 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <div className="inline-flex px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-indigo-700 uppercase bg-indigo-100 rounded-full">
              Transform your business
            </div>
            <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Manage your <br />
              <span className="text-indigo-600">online store</span> <br />
              easily
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Indigo Marketplace provides the unified infrastructure for modern merchants. From stock management to global delivery, scale your retail empire with a single click.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#3730A3] hover:bg-indigo-800 rounded-full transition">
                Create a store <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition">
                Log in
              </Link>
            </div>
          </div>
          
          <div className="relative relative w-full aspect-[4/3] bg-gradient-to-br from-teal-400 to-indigo-500 rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center p-8">
             <div className="w-full h-full bg-[#1e293b]/90 rounded-t-xl rounded-b relative shadow-lg ring-1 ring-white/20 flex flex-col overflow-hidden">
                <div className="h-6 w-full bg-slate-800/80 border-b border-white/10 flex items-center px-4 gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 p-4 grid grid-cols-4 gap-4">
                   <div className="col-span-1 border-r border-white/10 pr-4 space-y-3">
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      <div className="h-4 bg-white/10 rounded w-full"></div>
                      <div className="h-4 bg-white/10 rounded w-4/5"></div>
                   </div>
                   <div className="col-span-3 space-y-4">
                      <div className="h-8 bg-indigo-500/20 rounded-lg w-1/3"></div>
                      <div className="grid grid-cols-3 gap-3">
                         <div className="h-20 bg-white/5 rounded-lg"></div>
                         <div className="h-20 bg-white/5 rounded-lg"></div>
                         <div className="h-20 bg-white/5 rounded-lg"></div>
                      </div>
                      <div className="h-32 bg-white/5 rounded-lg w-full"></div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-4 w-full h-8 bg-[#cbd5e1] rounded-b-xl shadow-md z-10 mx-[-20px] left-0 right-0"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#f8fafc] py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Everything you need to grow</h2>
              <p className="text-lg text-gray-500">
                Unified tools designed to replace your fragmented spreadsheets and manual processes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden relative">
                <div className="mb-8 z-10 max-w-md">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                    <PackageOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-time Stock</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Never miss a sale with automated inventory tracking and low-stock alerts across all your warehouse locations.
                  </p>
                </div>
                <div className="h-40 w-full bg-[url('https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center rounded-xl bg-gray-200"></div>
              </div>

              {/* Feature 2 */}
              <div className="col-span-1 bg-[#4f46e5] rounded-3xl p-8 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
                 <div className="mb-8 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Instant Sales</h3>
                  <p className="text-sm text-indigo-100 leading-relaxed">
                    Comprehensive revenue tracking and transaction history with deep-dive customer insights.
                  </p>
                </div>
                <div className="bg-[#3730A3] p-6 rounded-2xl relative z-10">
                   <div className="text-xs font-semibold text-indigo-200 mb-1 flex justify-between items-center">
                     Today's Revenue <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">+12.5%</span>
                   </div>
                   <div className="text-3xl font-bold">$42,390.00</div>
                </div>
                 {/* Decorative background shapes */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
              </div>

              {/* Feature 3 */}
              <div className="col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-fuchsia-50 rounded-lg flex items-center justify-center mb-6 text-fuchsia-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Global Delivery</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    End-to-end logistics from label printing to door-step tracking with 20+ carrier integrations.
                  </p>
                </div>
                <div className="flex mt-8 -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white"></div>
                   <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-white"></div>
                   <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white"></div>
                   <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600">+60x</div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="max-w-sm">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-6 text-emerald-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Team Personnel</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Role-based access control and payroll automation for teams of 5 to 5,000.
                  </p>
                </div>
                <div className="hidden sm:flex flex-col gap-3 w-64">
                   <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-indigo-100"></div>
                         <div className="w-20 h-2 bg-gray-200 rounded"></div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">Admin</span>
                   </div>
                   <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-fuchsia-100"></div>
                         <div className="w-16 h-2 bg-gray-200 rounded"></div>
                      </div>
                      <span className="text-xs font-medium text-blue-600">Editor</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-8 bg-white">
           <div className="max-w-4xl mx-auto bg-gray-50 rounded-3xl p-16 text-center">
             <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Ready to scale your business?</h2>
             <p className="text-lg text-gray-500 mb-10">
               Join over 15,000 merchants who built their future on Indigo.
             </p>
             <div className="flex items-center justify-center gap-4">
               <Link href="/register" className="px-8 py-3 text-base font-semibold text-white bg-gray-900 hover:bg-black rounded-full transition">
                 Get Started Now
               </Link>
               <button className="px-8 py-3 text-base font-semibold text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-100 rounded-full transition">
                 Talk to Sales
               </button>
             </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <div className="font-bold text-gray-900 text-sm mb-1">Indigo Marketplace</div>
           <div className="text-xs text-gray-400">© 2024 Indigo Marketplace. All rights reserved.</div>
        </div>
        <div className="flex gap-6 text-xs font-medium text-gray-500">
          <Link href="#" className="hover:text-gray-900">Privacy Policy</Link>
          <Link href="#" className="hover:text-gray-900">Terms of Service</Link>
          <Link href="#" className="hover:text-gray-900">Contact Support</Link>
          <Link href="#" className="hover:text-gray-900">Status</Link>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
           <Globe className="w-4 h-4" />
        </div>
      </footer>
    </div>
  );
}
