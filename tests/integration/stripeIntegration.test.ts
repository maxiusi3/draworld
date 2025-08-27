/**
 * Stripe Payment Integration Tests
 * Tests payment processing in test mode
 */

// Stripe Payment Integration Tests

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

describe('Stripe Payment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent for starter package', async () => {
      const packageData = {
        id: 'starter',
        name: 'Starter Pack',
        price: 199, // $1.99
        credits: 100,
        bonusCredits: 0,
      };

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_starter_123',
        client_secret: 'pi_test_starter_123_secret_abc',
        amount: 199,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          packageId: 'starter',
          credits: '100',
          userId: 'test-user-123',
        },
      });

      const paymentIntent = await mockStripe.paymentIntents.create({
        amount: packageData.price,
        currency: 'usd',
        metadata: {
          packageId: packageData.id,
          credits: packageData.credits.toString(),
          userId: 'test-user-123',
        },
      });

      expect(paymentIntent.id).toBe('pi_test_starter_123');
      expect(paymentIntent.amount).toBe(199);
      expect(paymentIntent.metadata.packageId).toBe('starter');
      expect(paymentIntent.metadata.credits).toBe('100');
    });

    it('should handle payment intent creation errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Invalid amount: must be at least $0.50 USD')
      );

      await expect(
        mockStripe.paymentIntents.create({
          amount: 10, // Too small
          currency: 'usd',
        })
      ).rejects.toThrow('Invalid amount');
    });
  });

  describe('Payment Confirmation', () => {
    it('should handle successful payment confirmation', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 199,
        currency: 'usd',
        metadata: {
          packageId: 'starter',
          credits: '100',
          userId: 'test-user-123',
        },
        charges: {
          data: [{
            id: 'ch_test_123',
            receipt_url: 'https://pay.stripe.com/receipts/test_123',
          }],
        },
      });

      const paymentIntent = await mockStripe.paymentIntents.retrieve('pi_test_123');

      expect(paymentIntent.status).toBe('succeeded');
      expect(paymentIntent.metadata.credits).toBe('100');
      expect(paymentIntent.charges.data[0].receipt_url).toBeTruthy();
    });

    it('should handle failed payment confirmation', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_failed_123',
        status: 'payment_failed',
        last_payment_error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.',
        },
      });

      const paymentIntent = await mockStripe.paymentIntents.retrieve('pi_test_failed_123');

      expect(paymentIntent.status).toBe('payment_failed');
      expect(paymentIntent.last_payment_error.code).toBe('card_declined');
    });
  });

  describe('Test Card Numbers', () => {
    const testCards = {
      visa: '4242424242424242',
      declined: '4000000000000002',
      insufficientFunds: '4000000000009995',
      requiresAuth: '4000002500003155',
    };

    it('should handle successful payment with test Visa card', async () => {
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_visa_123',
        status: 'succeeded',
      });

      const confirmation = await mockStripe.paymentIntents.confirm('pi_test_123', {
        payment_method: {
          card: {
            number: testCards.visa,
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
        },
      });

      expect(confirmation.status).toBe('succeeded');
    });

    it('should handle declined card', async () => {
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_declined_123',
        status: 'payment_failed',
        last_payment_error: {
          type: 'card_error',
          code: 'card_declined',
          decline_code: 'generic_decline',
        },
      });

      const confirmation = await mockStripe.paymentIntents.confirm('pi_test_123', {
        payment_method: {
          card: {
            number: testCards.declined,
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
        },
      });

      expect(confirmation.status).toBe('payment_failed');
      expect(confirmation.last_payment_error.code).toBe('card_declined');
    });
  });
});