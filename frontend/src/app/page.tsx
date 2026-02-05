import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Welcome</h1>
        <div className="space-x-4">
          <Link href="/login">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Login
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
