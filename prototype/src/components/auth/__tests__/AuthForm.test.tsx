import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthForm } from '../AuthForm'

// Mock the useAuth hook
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignInWithGoogle = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('AuthForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Mode', () => {
    it('renders login form correctly', () => {
      render(<AuthForm mode="login" />)
      
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles successful login', async () => {
      const mockOnSuccess = jest.fn()
      mockSignIn.mockResolvedValue(undefined)
      
      render(<AuthForm mode="login" onSuccess={mockOnSuccess} />)
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('displays error on login failure', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
      
      render(<AuthForm mode="login" />)
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      render(<AuthForm mode="login" />)
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Signup Mode', () => {
    it('renders signup form correctly', () => {
      render(<AuthForm mode="signup" />)
      
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('handles successful signup', async () => {
      const mockOnSuccess = jest.fn()
      mockSignUp.mockResolvedValue(undefined)
      
      render(<AuthForm mode="signup" onSuccess={mockOnSuccess} />)
      
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'Password123!' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'Password123!',
          'Test User',
          undefined
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('validates password strength', async () => {
      render(<AuthForm mode="signup" />)
      
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'weak' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'weak' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('validates password confirmation', async () => {
      render(<AuthForm mode="signup" />)
      
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'Password123!' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'DifferentPassword123!' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('shows referral bonus message when referral code is provided', () => {
      render(<AuthForm mode="signup" referralCode="ABC123" />)
      
      expect(screen.getByText(/you've been invited/i)).toBeInTheDocument()
      expect(screen.getByText(/50 bonus credits/i)).toBeInTheDocument()
    })

    it('passes referral code to signup function', async () => {
      const mockOnSuccess = jest.fn()
      mockSignUp.mockResolvedValue(undefined)
      
      render(<AuthForm mode="signup" referralCode="ABC123" onSuccess={mockOnSuccess} />)
      
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'Password123!' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'Password123!',
          'Test User',
          'ABC123'
        )
      })
    })
  })

  describe('Google Sign In', () => {
    it('handles Google sign in', async () => {
      const mockOnSuccess = jest.fn()
      mockSignInWithGoogle.mockResolvedValue(undefined)
      
      render(<AuthForm mode="login" onSuccess={mockOnSuccess} />)
      
      fireEvent.click(screen.getByText(/continue with google/i))
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith(undefined)
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('passes referral code to Google sign in', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined)
      
      render(<AuthForm mode="signup" referralCode="ABC123" />)
      
      fireEvent.click(screen.getByText(/continue with google/i))
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith('ABC123')
      })
    })

    it('displays error on Google sign in failure', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Google sign in failed'))
      
      render(<AuthForm mode="login" />)
      
      fireEvent.click(screen.getByText(/continue with google/i))
      
      await waitFor(() => {
        expect(screen.getByText(/google sign in failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<AuthForm mode="login" />)
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      expect(screen.getByText(/please wait/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled()
    })

    it('disables form during Google sign in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<AuthForm mode="login" />)
      
      fireEvent.click(screen.getByText(/continue with google/i))
      
      expect(screen.getByText(/continue with google/i)).toBeDisabled()
    })
  })
})