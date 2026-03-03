import Link from 'next/link'

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">🚫</p>
        <h1 className="text-2xl font-bold text-[#0D2240] mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#0D2240] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1A3A6B] transition"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
