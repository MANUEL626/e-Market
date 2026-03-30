import { 
  Search, 
  Phone, 
  Video, 
  Info, 
  Plus, 
  Image as ImageIcon, 
  Send,
  Smile,
  Mic
} from "lucide-react";

export default function MessagesPage() {
  const conversations = [
    {
      id: 1,
      name: "Elena Rodriguez",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&h=150&auto=format&fit=crop",
      preview: "The delivery looks perfect! Can you ...",
      time: "JUST NOW",
      unread: false,
      active: true,
      online: true
    },
    {
      id: 2,
      name: "Marcus Chen",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&h=150&auto=format&fit=crop",
      preview: "I'll check the inventory and let you know.",
      time: "2H AGO",
      unread: false,
      active: false,
      online: false
    },
    {
      id: 3,
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop",
      preview: "Thanks for the quick response on the p...",
      time: "YESTERDAY",
      unread: false,
      active: false,
      online: true
    },
    {
      id: 4,
      name: "David Miller",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&h=150&auto=format&fit=crop",
      preview: "The contract is signed and uploaded.",
      time: "JAN 12",
      unread: false,
      active: false,
      online: false
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-144px)] min-h-[600px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex overflow-hidden">
      
      {/* Left Sidebar (Conversations List) */}
      <div className="w-[380px] border-r border-gray-100 flex flex-col flex-shrink-0 bg-white">
        {/* Header */}
        <div className="p-6 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Messages</h1>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-gray-50 border border-transparent rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto mt-2">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`relative flex items-center gap-4 p-4 cursor-pointer transition ${conv.active ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
            >
              {conv.active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-indigo-600 rounded-r-full"></div>
              )}
              
              <div className="relative ml-2">
                 <div className="w-12 h-12 rounded-full overflow-hidden">
                   <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                 </div>
                 {/* Online Status Indicator */}
                 <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${conv.online ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{conv.name}</h3>
                  <span className={`text-[9px] font-extrabold tracking-widest uppercase ${conv.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {conv.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                  {conv.preview}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content (Chat Area) */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        
        {/* Chat Header */}
        <div className="h-20 px-8 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                <img src={conversations[0].avatar} alt={conversations[0].name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-gray-900 leading-tight">{conversations[0].name}</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 tracking-widest uppercase mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active Now
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full">
              <Phone className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full">
              <Video className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex justify-center mb-8">
            <span className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-extrabold text-gray-400 tracking-widest uppercase shadow-sm">
              January 14, 2024
            </span>
          </div>

          {/* Incoming Message */}
          <div className="flex items-end gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
               <img src={conversations[0].avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-bl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-gray-700 text-sm leading-relaxed mb-1 relative">
                Hi! I've just reviewed the final proposal for the Indigo Marketplace integration. Everything looks great, but I had a quick question about the API rate limits.
              </div>
              <span className="text-[10px] font-bold text-gray-400 ml-1">10:42 AM</span>
            </div>
          </div>

          {/* Outgoing Message */}
          <div className="flex items-end gap-3 max-w-[80%] ml-auto justify-end">
            <div>
              <div className="bg-[#3730A3] text-white p-5 rounded-2xl rounded-br-sm shadow-md text-sm leading-relaxed mb-1 relative">
                Hey Elena! Glad to hear you're happy with the proposal. For your tier, the rate limit is 5,000 requests per hour. Does that meet your project's current needs?
              </div>
              <span className="text-[10px] font-bold text-gray-400 block text-right mr-1">10:45 AM</span>
            </div>
          </div>

          {/* Incoming Message 2 */}
          <div className="flex items-end gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
               <img src={conversations[0].avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-bl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-gray-700 text-sm leading-relaxed mb-1 relative">
                That's plenty for now. The delivery looks perfect! Can you send over the final contract for my team to sign off on? We're ready to get started.
              </div>
              <span className="text-[10px] font-bold text-gray-400 ml-1">10:48 AM</span>
            </div>
          </div>
          
          <div className="text-xs italic text-gray-400 text-center mt-8">
            Elena is typing...
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="bg-gray-50 border border-gray-100 rounded-full p-2 flex items-center transition focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-sm">
            <div className="flex items-center gap-1 pl-2 pr-3 border-r border-gray-200">
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
                <Plus className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none placeholder-gray-400 text-gray-700"
            />
            
            <button className="w-10 h-10 bg-[#3730A3] hover:bg-[#2e2889] text-white rounded-full flex items-center justify-center shadow-md transition transform hover:scale-105 mr-1 flex-shrink-0">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-3 px-4">
             <span className="text-[10px] font-semibold text-gray-400">
               Press Enter to send, Shift + Enter for new line
             </span>
             <div className="flex gap-3 text-gray-300">
               <button className="hover:text-gray-500 transition"><Smile className="w-4 h-4" /></button>
               <button className="hover:text-gray-500 transition"><Mic className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
