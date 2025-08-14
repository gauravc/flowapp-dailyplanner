'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // For now, we'll simulate a password reset
      // In a real app, this would send an email with a reset link
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('If an account with that email exists, you will receive password reset instructions shortly.')
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-600">Enter your email to receive reset instructions</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending instructions...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Send reset instructions
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-4 text-center">
            <div className="text-sm">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                Sign up here
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 FlowApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
