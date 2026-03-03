export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="w-64 bg-[#0D2240] text-white flex flex-col p-4 overflow-y-auto">
        <div className="text-xl font-bold text-[#E6A817] mb-8 font-display">
          ▲ Bar da Carmen
        </div>
        <a href="/dashboard" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          📊 Dashboard
        </a>
        <a href="/pedidos" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          📦 Pedidos
        </a>
        <a href="/estoque" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          📋 Estoque
        </a>
        <a href="/caixa" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          💰 Caixa
        </a>
        <a href="/fiado" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          📝 Fiado
        </a>
        <a href="/ocr" className="py-2 px-3 rounded hover:bg-[#1A3A6B] mb-1 block">
          📷 Scanner OCR
        </a>
      </nav>
      <div className="flex-1 overflow-auto p-8">{children}</div>
    </div>
  )
}
