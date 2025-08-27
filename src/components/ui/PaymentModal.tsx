'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { CREDIT_PACKAGES } from '@/lib/stripe';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId?: string;
}

interface PaymentFormProps {
  packageId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ packageId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);

  useEffect(() => {
    if (packageId) {
      createPaymentIntent();
    }
  }, [packageId]);

  const createPaymentIntent = async () => {
    try {
      const result = await PaymentService.createPaymentIntent(packageId);
      setClientSecret(result.clientSecret);
    } catch (error: any) {
      onError(error.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.displayName || 'Customer',
            email: user?.email || '',
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!creditPackage) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Invalid package selected</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Package Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">{creditPackage.name}</h3>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Base Credits:</span>
          <span className="font-medium">{creditPackage.credits.toLocaleString()}</span>
        </div>
        {creditPackage.bonusCredits > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bonus Credits:</span>
            <span className="font-medium text-green-600">+{creditPackage.bonusCredits.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-blue-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Credits:</span>
            <span className="font-bold text-blue-600">
              {(creditPackage.credits + creditPackage.bonusCredits).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-semibold text-gray-900">Price:</span>
            <span className="font-bold text-gray-900">
              ${(creditPackage.price / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <span>💳</span>
            Pay ${(creditPackage.price / 100).toFixed(2)}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
}

export function PaymentModal({ isOpen, onClose, packageId = 'popular' }: PaymentModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError('');
      setSuccess(false);
    }, 200);
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-2xl max-w-md w-full p-6 transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Credits</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600">
              Your credits have been added to your account.
            </p>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <PaymentForm
              packageId={packageId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}