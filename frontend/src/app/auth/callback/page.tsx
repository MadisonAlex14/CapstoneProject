'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    
    if (accessToken) {
      // Store the token in localStorage
      localStorage.setItem('accessToken', accessToken)
      // Redirect to dashboard with the token in URL for initial verification
      router.push(`/dashboard?access_token=${accessToken}`)
    } else {
      // No token found, redirect to login
      router.push('/login')
    }
  }, [searchParams, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-gray-600">Verifying your email...</p>
    </div>
  )
}
