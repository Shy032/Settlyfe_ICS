import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  console.log('Email confirmation route accessed')
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Confirmation params:', { token_hash: !!token_hash, type, next })

  if (token_hash && type) {
    try {
      const supabase = await createClient()

      console.log('Attempting to verify OTP...')
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (!error && data.user) {
        console.log('Email confirmation successful for user:', data.user.id)
        // Redirect to dashboard after successful confirmation
        redirect('/dashboard')
      } else {
        console.error('Email confirmation failed:', error)
        // Redirect to login with error
        redirect('/login?error=confirmation_failed&message=' + encodeURIComponent(error?.message || 'Confirmation failed'))
      }
    } catch (err) {
      console.error('Unexpected error during confirmation:', err)
      redirect('/login?error=server_error&message=' + encodeURIComponent('Unexpected error during confirmation'))
    }
  } else {
    console.error('Missing token_hash or type in confirmation URL')
    redirect('/login?error=invalid_link&message=' + encodeURIComponent('Invalid confirmation link'))
  }
}