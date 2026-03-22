import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Нет доступа</h2>
        <p className="text-gray-500 mb-6">Нет доступа — недостаточно прав</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          На главную
        </Link>
      </div>
    </div>
  )
}
