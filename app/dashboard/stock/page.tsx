import Link from "next/link";
import { 
  Package, 
  AlertTriangle, 
  Truck, 
  Banknote, 
  Download, 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileEdit,
  Info
} from "lucide-react";

export default function StockManagementPage() {
  const products = [
    {
      id: "PROD-9821",
      name: "Minimalist Watch",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=100&h=100&auto=format&fit=crop",
      category: "Electronics",
      price: "$129.00",
      quantity: 42,
      maxQuantity: 100,
      status: "IN STOCK",
      statusColor: "bg-emerald-100 text-emerald-700"
    },
    {
      id: "PROD-7724",
      name: "Urban Sneaker Red",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100&h=100&auto=format&fit=crop",
      category: "Footwear",
      price: "$89.50",
      quantity: 8,
      maxQuantity: 100,
      status: "LOW STOCK",
      statusColor: "bg-rose-100 text-rose-700"
    },
    {
      id: "PROD-1102",
      name: "Studio Pro X1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&h=100&auto=format&fit=crop",
      category: "Audio",
      price: "$299.00",
      quantity: 124,
      maxQuantity: 200,
      status: "IN STOCK",
      statusColor: "bg-emerald-100 text-emerald-700"
    },
    {
      id: "PROD-4432",
      name: "Retro Lens 35mm",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=100&h=100&auto=format&fit=crop",
      category: "Photography",
      price: "$450.00",
      quantity: 0,
      maxQuantity: 50,
      status: "OUT OF STOCK",
      statusColor: "bg-gray-100 text-gray-600"
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="text-[10px] font-bold text-indigo-700 tracking-widest uppercase mb-1">
            Inventory Control
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Stock Management</h1>
          <p className="text-gray-500 max-w-xl text-base">
            Monitor real-time product levels, manage pricing, and handle supply chain replenishment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/stock/drafts"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm"
          >
            <FileEdit className="w-4 h-4" /> View Drafts
          </Link>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link 
            href="/dashboard/stock/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-semibold rounded-full transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">+12%</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Total Products</div>
            <div className="text-3xl font-extrabold text-gray-900">2,481</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">Low Stock</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Out of Stock</div>
            <div className="text-3xl font-extrabold text-gray-900">14</div>
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-fuchsia-50 rounded-xl flex items-center justify-center text-fuchsia-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">In Transit</div>
            <div className="text-3xl font-extrabold text-gray-900">156</div>
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Stock Value</div>
            <div className="text-3xl font-extrabold text-gray-900">$142,500</div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Filter by category or status..." 
              className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
            <button className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition shadow-sm bg-white">
              <List className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-gray-500 tracking-wider uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-5 rounded-tl-xl">Product</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Price</th>
                <th className="px-6 py-5">Quantity</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{product.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{product.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 w-6">{product.quantity}</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.quantity > 20 ? 'bg-indigo-600' : product.quantity > 0 ? 'bg-rose-500' : 'bg-gray-300'}`}
                          style={{ width: `${Math.min((product.quantity / product.maxQuantity) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full tracking-wider ${product.statusColor}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/stock/${product.id}`}
                      className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition"
                      title="View & Edit Product"
                    >
                      <Info className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-900">1-4</span> of <span className="font-bold text-gray-900">2,481</span> products
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              1
            </button>
            <button className="w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 font-bold text-xs flex items-center justify-center transition">
              2
            </button>
            <button className="w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 font-bold text-xs flex items-center justify-center transition">
              3
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-900 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
