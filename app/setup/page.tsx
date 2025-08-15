'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🚀 Database Setup
        </h1>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Click the button below to set up your database tables and create the initial test user.
          </p>
          
          <Button
            onClick={handleSetup}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Setting up...' : 'Setup Database'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm">
                <strong>Success!</strong> {result.message}
              </p>
              <p className="text-green-700 text-xs mt-2">
                Users in database: {result.userCount}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
