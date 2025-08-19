// 语言: TypeScript
// 说明: 支付弹窗组件，包含支付方式选择、二维码展示、状态轮询等功能

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PaymentMethod, Order, PaymentInfo } from '../../types/credits';
import { paymentService } from '../../services/paymentService';
import { useOrderTimeout } from '../../hooks/useOrderTimeout';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  paymentInfo: PaymentInfo | null;
  onPaymentSuccess: (orderId: string) => void;
}

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  paymentInfo,
  onPaymentSuccess
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.ALIPAY);
  const [isPolling, setIsPolling] = useState(false);

  // 使用订单超时Hook
  const {
    timeLeft,
    timeLeftFormatted,
    isExpired,
    isChecking,
    lastStatus,
    refreshStatus
  } = useOrderTimeout({
    orderId: order?.orderId || null,
    expiredAt: paymentInfo?.expiredAt || null,
    onTimeout: () => {
      setPaymentStatus('EXPIRED');
      setIsPolling(false);
      toast.error('订单已超时，请重新下单');
    },
    onStatusChange: (status) => {
      if (status === 'PAID') {
        setPaymentStatus('SUCCESS');
        setIsPolling(false);
        toast.success('支付成功！');
        onPaymentSuccess(order?.orderId || '');
      } else if (status === 'FAILED') {
        setPaymentStatus('FAILED');
        setIsPolling(false);
        toast.error('支付失败，请重试');
      } else if (status === 'CANCELLED') {
        setPaymentStatus('CANCELLED');
        setIsPolling(false);
        toast.error('订单已取消');
      }
    }
  });

  // 轮询支付状态
  const pollPaymentStatus = useCallback(async () => {
    if (!order?.orderId || paymentStatus !== 'PENDING') return;

    try {
      const status = await paymentService.getPaymentStatus(order.orderId);
      
      if (status.status === 'PAID') {
        setPaymentStatus('SUCCESS');
        setIsPolling(false);
        toast.success('支付成功！');
        onPaymentSuccess(order.orderId);
      } else if (status.status === 'FAILED') {
        setPaymentStatus('FAILED');
        setIsPolling(false);
        toast.error('支付失败，请重试');
      } else if (status.status === 'CANCELLED') {
        setPaymentStatus('CANCELLED');
        setIsPolling(false);
        toast.error('订单已取消');
      }
    } catch (error) {
      console.error('轮询支付状态失败:', error);
    }
  }, [order?.orderId, paymentStatus, onPaymentSuccess]);

  // 开始轮询
  useEffect(() => {
    if (isOpen && order && paymentStatus === 'PENDING') {
      setIsPolling(true);
      const pollInterval = setInterval(pollPaymentStatus, 3000); // 每3秒轮询一次

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    }
  }, [isOpen, order, paymentStatus, pollPaymentStatus]);

  // 模拟支付（用于测试）
  const handleSimulatePayment = async (result: 'SUCCESS' | 'FAILED' = 'SUCCESS') => {
    if (!order?.orderId || !paymentInfo?.paymentId) return;

    try {
      setPaymentStatus('PROCESSING');
      
      const response = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          orderId: order.orderId,
          paymentId: paymentInfo.paymentId,
          paymentMethod: selectedMethod,
          simulateResult: result,
          delaySeconds: 2
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 等待回调处理完成后再轮询状态
        setTimeout(() => {
          pollPaymentStatus();
        }, 3000);
      } else {
        setPaymentStatus('FAILED');
        toast.error('模拟支付失败');
      }
    } catch (error) {
      console.error('模拟支付失败:', error);
      setPaymentStatus('FAILED');
      toast.error('模拟支付失败');
    }
  };

  // 处理超时状态
  useEffect(() => {
    if (isExpired && paymentStatus === 'PENDING') {
      setPaymentStatus('EXPIRED');
      setIsPolling(false);
    }
  }, [isExpired, paymentStatus]);

  // 重置状态
  const resetPaymentState = () => {
    setPaymentStatus('PENDING');
    setIsPolling(false);
  };

  // 关闭弹窗
  const handleClose = () => {
    setIsPolling(false);
    onClose();
  };

  if (!isOpen || !order || !paymentInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            完成支付
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 订单信息 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">订单信息</div>
          <div className="font-semibold text-gray-900">{order.packageName}</div>
          <div className="text-sm text-gray-600">
            {order.credits + order.bonusCredits} 积分 • ¥{order.priceYuan}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            订单号：{order.orderId}
          </div>
        </div>

        {/* 支付内容 */}
        <div className="p-6">
          {paymentStatus === 'PENDING' && (
            <>
              {/* 支付方式选择 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">选择支付方式</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedMethod(PaymentMethod.ALIPAY)}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      selectedMethod === PaymentMethod.ALIPAY
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">支付宝</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod(PaymentMethod.WECHAT)}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      selectedMethod === PaymentMethod.WECHAT
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">微信支付</span>
                  </button>
                </div>
              </div>

              {/* 二维码 */}
              <div className="text-center mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  请使用{selectedMethod === PaymentMethod.ALIPAY ? '支付宝' : '微信'}扫码支付
                </div>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  {paymentInfo.qrCode ? (
                    <img 
                      src={paymentInfo.qrCode} 
                      alt="支付二维码" 
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                      <QrCodeIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* 倒计时 */}
              {timeLeft > 0 && !isExpired && (
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    <span>支付剩余时间：{timeLeftFormatted}</span>
                  </div>
                  {isChecking && (
                    <div className="text-xs text-blue-600 mt-1">
                      正在检查支付状态...
                    </div>
                  )}
                </div>
              )}

              {/* 模拟支付按钮（测试用） */}
              <div className="space-y-2">
                <button
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  模拟支付成功（测试）
                </button>
                <button
                  onClick={() => handleSimulatePayment('FAILED')}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  模拟支付失败（测试）
                </button>
              </div>
            </>
          )}

          {paymentStatus === 'PROCESSING' && (
            <div className="text-center py-8">
              <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">处理中...</div>
              <div className="text-sm text-gray-600">正在处理您的支付，请稍候</div>
            </div>
          )}

          {paymentStatus === 'SUCCESS' && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">支付成功！</div>
              <div className="text-sm text-gray-600 mb-4">
                您已获得 {order.credits + order.bonusCredits} 积分
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                完成
              </button>
            </div>
          )}

          {(paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') && (
            <div className="text-center py-8">
              <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                {paymentStatus === 'EXPIRED' ? '支付超时' : 
                 paymentStatus === 'CANCELLED' ? '订单已取消' : '支付失败'}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {paymentStatus === 'EXPIRED' ? '订单已超时，请重新下单' :
                 paymentStatus === 'CANCELLED' ? '订单已被取消' : '支付过程中出现问题，请重试'}
              </div>
              <div className="space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  关闭
                </button>
                {paymentStatus === 'FAILED' && (
                  <button
                    onClick={resetPaymentState}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重试
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
