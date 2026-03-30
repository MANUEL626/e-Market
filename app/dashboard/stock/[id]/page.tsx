import Link from "next/link";
import { 
  ChevronRight, 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Minus,
  Plus,
  Eye,
  Store,
  X
} from "lucide-react";

export default function ProductInfoEditPage() {
  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/stock" className="hover:text-gray-900 transition">Stock</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Minimalist Watch</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Minimalist Watch</h1>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">● Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/stock" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm">
            Cancel
          </Link>
          <button className="px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-semibold rounded-full transition shadow-sm">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Product Title</label>
                <input 
                  type="text" 
                  defaultValue="Minimalist Watch"
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <div className="bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl overflow-hidden transition">
                  {/* Mock Toolbar */}
                  <div className="flex items-center gap-1 border-b border-gray-100 p-2 bg-white">
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"><Bold className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"><Italic className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"><List className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"><LinkIcon className="w-4 h-4" /></button>
                  </div>
                  <textarea 
                    rows={5} 
                    defaultValue="Elegant minimalist wristwatch with a matte black finish and genuine leather strap. Designed for those who value simplicity and precision."
                    className="w-full bg-transparent border-none py-3 px-4 text-sm focus:outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Media</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">Add via URL</button>
            </div>
            
            <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
              {/* Product Images */}
              <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group">
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&h=200&auto=format&fit=crop" alt="Watch 1" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                   <button className="text-white bg-black/50 p-2 rounded-full hover:bg-black transition"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group">
                <img src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=200&h=200&auto=format&fit=crop" alt="Watch 2" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                   <button className="text-white bg-black/50 p-2 rounded-full hover:bg-black transition"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Add Button */}
              <button className="w-32 h-32 flex-shrink-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Add File</span>
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Inventory</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Track quantity</span>
                <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div>
                  <label className="block text-sm text-gray-700 mb-2">SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    defaultValue="MW-BLK-2024"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
               </div>
               <div>
                  <label className="block text-sm text-gray-700 mb-2">Barcode (ISBN, UPC, GTIN)</label>
                  <input 
                    type="text" 
                    defaultValue="9780123456789"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
               </div>
            </div>

            <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4">Quantity Available</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
               <span className="text-sm font-medium text-gray-900">Central Warehouse</span>
               <div className="flex items-center gap-4">
                 <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-gray-900 rounded-lg shadow-sm">
                   <Minus className="w-3 h-3" />
                 </button>
                 <span className="w-8 text-center font-bold text-gray-900">42</span>
                 <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-gray-900 rounded-lg shadow-sm">
                   <Plus className="w-3 h-3" />
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Pricing */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Pricing</h2>
            
            <div className="space-y-6">
              <div>
                 <label className="block text-sm text-gray-700 mb-2">Price</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                   <input 
                     type="text" 
                     defaultValue="120.00"
                     className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                   />
                 </div>
              </div>
              
              <div>
                 <label className="block text-sm text-gray-700 mb-2">Compare at price</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                   <input 
                     type="text" 
                     defaultValue="150.00"
                     className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-8 pr-4 text-sm font-medium text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition italic"
                   />
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Cost per item</span>
                    <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">$45.00</a>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                       <div className="text-[10px] font-bold text-emerald-800 tracking-widest uppercase mb-1">Margin</div>
                       <div className="font-extrabold text-emerald-900">62.5%</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                       <div className="text-[10px] font-bold text-emerald-800 tracking-widest uppercase mb-1">Profit</div>
                       <div className="font-extrabold text-emerald-900">$75.00</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Organization</h2>
            
            <div className="space-y-6">
               <div>
                  <label className="block text-sm text-gray-700 mb-2">Category</label>
                  <select className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer appearance-none">
                     <option value="watches">Watches</option>
                     <option value="electronics">Electronics</option>
                     <option value="clothing">Clothing</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-sm text-gray-700 mb-2">Vendor</label>
                  <input 
                    type="text" 
                    defaultValue="Indigo Premium Goods"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
               </div>

               <div>
                  <label className="block text-sm text-gray-700 mb-2">Collections</label>
                  <input 
                    type="text" 
                    placeholder="Search collections..."
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-3"
                  />
                  {/* Mock Collection Tag */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                    Summer 2024 Collection <button className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                  </div>
               </div>

               <div>
                  <label className="block text-sm text-gray-700 mb-2">Tags</label>
                  <input 
                    type="text" 
                    placeholder="Add tags separated by comma"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-3"
                  />
                  {/* Mock Tags */}
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">minimalist</div>
                    <div className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">watch</div>
                    <div className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">leather</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Product Availability */}
          <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 border-dashed">
             <h3 className="text-xs font-bold text-gray-900 mb-4">Product Availability</h3>
             
             <div className="space-y-4">
                <div className="flex gap-4 items-start">
                   <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0 mt-1">
                     <Eye className="w-4 h-4" />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-gray-900">Online Store</div>
                     <div className="text-xs text-gray-500">Visible to all customers</div>
                   </div>
                </div>
                
                <div className="flex gap-4 items-start">
                   <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0 mt-1">
                     <Store className="w-4 h-4" />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-gray-900 line-through text-opacity-50">Point of Sale</div>
                     <div className="text-xs text-gray-400">Unavailable in physical stores</div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
