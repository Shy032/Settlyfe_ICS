"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'An error occurred during authentication.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border border-gray-300 bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">
            The verification link may be invalid or expired. Please try signing up again.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/signup" 
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition-colors"
          >
            Try Signing Up Again
          </Link>
          
          <Link 
            href="/login" 
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}