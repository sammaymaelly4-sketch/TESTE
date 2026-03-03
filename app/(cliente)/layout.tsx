export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {children}
    </main>
  )
}
