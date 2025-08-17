import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function usePaymentTest() {
  const [isLoading, setIsLoading] = useState(false);

  const simulatePayment = async (orderId: string, action: 'pay' | 'fail' = 'pay') => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, action }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        return {
          success: true,
          notificationData: result.notificationData,
          notifyResult: result.notifyResult,
        };
      } else {
        toast.error(result.message || '模拟支付失败');
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('模拟支付失败:', error);
      toast.error('模拟支付失败');
      return {
        success: false,
        message: '网络错误',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePaymentSuccess = (orderId: string) => simulatePayment(orderId, 'pay');
  const simulatePaymentFailure = (orderId: string) => simulatePayment(orderId, 'fail');

  return {
    isLoading,
    simulatePayment,
    simulatePaymentSuccess,
    simulatePaymentFailure,
  };
}
