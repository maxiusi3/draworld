// 语言: TypeScript
// 说明: 积分商店页面

import React, { useState } from 'react';
import { useCreditPackages, useCreateOrder, usePaymentMethod, useOrders, useOrderManagement } from '../hooks/usePayment';
import { useCreditBalance } from '../hooks/useCredits';
import { CreditBalance } from '../components/Credits/CreditBalance';
import { paymentService, PaymentService } from '../services/paymentService';
import {
  CurrencyDollarIcon,
  SparklesIcon,
  CheckIcon,
  StarIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import type { CreditPackage } from '../types/credits';
import { PaymentMethod } from '../types/credits';

const CreditStorePage: React.FC = () => {
  const { packages, loading, error, refresh: refreshPackages } = useCreditPackages();
  const { balance } = useCreditBalance();
  const { createOrderAndPay, loading: orderLoading } = useCreateOrder();
  const { selectedMethod, setSelectedMethod, availableMethods, getMethodInfo } = usePaymentMethod();
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useOrders();
  const { cancelOrder, retryPayment, loading: managementLoading } = useOrderManagement();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const handlePurchase = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    try {
      const orderId = await createOrderAndPay(
        selectedPackage.id,
        selectedMethod,
        () => {
          setShowPaymentModal(false);
          setSelectedPackage(null);
          refreshOrders(); // 刷新订单列表
        }
      );

      if (orderId) {
        console.log('订单创建成功:', orderId);
        // 可以跳转到支付页面或显示支付二维码
      }
    } catch (error) {
      console.error('购买失败:', error);
      toast.error('购买失败，请稍后重试');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success) {
      refreshOrders();
    }
  };

  const handleRetryPayment = async (orderId: string) => {
    const success = await retryPayment(orderId);
    if (success) {
      refreshOrders();
    }
  };

  const handleRetryLoadPackages = () => {
    refreshPackages();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetryLoadPackages}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  重试中...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  重试
                </>
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="w-12 h-12 mr-3" />
            <h1 className="text-4xl font-bold">积分商店</h1>
          </div>
          <p className="text-xl opacity-90 mb-6">
            购买积分，解锁更多创作可能
          </p>
          
          {/* 当前积分余额和操作按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CurrencyDollarIcon className="w-6 h-6" />
                <span className="text-lg">当前余额:</span>
                <span className="text-2xl font-bold">
                  {balance !== null ? balance.toLocaleString() : '--'} 积分
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowOrderHistory(!showOrderHistory)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 transition-colors flex items-center space-x-2"
            >
              <span>订单历史</span>
              <span className="text-sm opacity-75">({orders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 套餐列表 */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const totalCredits = pkg.credits + pkg.bonusCredits;
            const valueRatio = PaymentService.calculateValueRatio(pkg.credits, pkg.bonusCredits, pkg.priceYuan);
            const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.priceYuan;
            const discountText = hasDiscount ? PaymentService.formatDiscount(pkg.originalPrice!, pkg.priceYuan) : '';

            return (
              <div
                key={pkg.id}
                className={`
                  relative bg-white rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl hover:scale-105
                  ${pkg.isPopular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                `}
              >
                {/* 热门标签 */}
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <StarSolidIcon className="w-4 h-4 mr-1" />
                      热门推荐
                    </div>
                  </div>
                )}

                {/* 折扣标签 */}
                {hasDiscount && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {discountText}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  {/* 套餐名称 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  
                  {/* 积分数量 */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {pkg.credits.toLocaleString()}
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <div className="text-sm text-green-600 flex items-center justify-center">
                        <GiftIcon className="w-4 h-4 mr-1" />
                        额外赠送 {pkg.bonusCredits.toLocaleString()} 积分
                      </div>
                    )}
                    <div className="text-lg font-semibold text-gray-700 mt-2">
                      总计: {totalCredits.toLocaleString()} 积分
                    </div>
                  </div>

                  {/* 价格 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-2">
                      {hasDiscount && (
                        <span className="text-gray-400 line-through text-lg">
                          ¥{pkg.originalPrice!.toFixed(2)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-gray-900">
                        ¥{pkg.priceYuan.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      性价比: {PaymentService.formatValueRatio(valueRatio)}
                    </div>
                  </div>

                  {/* 描述 */}
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                  )}

                  {/* 购买按钮 */}
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={orderLoading}
                    className={`
                      w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200
                      ${pkg.isPopular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {orderLoading ? '处理中...' : '立即购买'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 订单历史 */}
        {showOrderHistory && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">订单历史</h3>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">加载订单中...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无订单记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{order.packageName}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'PAID' ? '已支付' :
                           order.status === 'PENDING' ? '待支付' :
                           order.status === 'FAILED' ? '支付失败' :
                           order.status === 'CANCELLED' ? '已取消' : order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {order.totalCredits || order.credits} 积分 • ¥{order.priceYuan || order.amount} • {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleRetryPayment(order.id)}
                            disabled={managementLoading}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            重试支付
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={managementLoading}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                          >
                            取消
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {orders.length > 5 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">显示最近 5 条订单</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 购买说明 */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">购买说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">积分用途</h4>
              <ul className="space-y-1">
                <li>• 视频生成：60积分/个</li>
                <li>• 高级功能解锁</li>
                <li>• 专属模板使用</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">支付方式</h4>
              <ul className="space-y-1">
                <li>• 微信支付</li>
                <li>• 支付宝</li>
                <li>• 安全快捷，即时到账</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 支付确认弹窗 */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认购买</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>套餐:</span>
                <span className="font-medium">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>积分:</span>
                <span className="font-medium">
                  {(selectedPackage.credits + selectedPackage.bonusCredits).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>金额:</span>
                <span className="font-medium text-lg">¥{selectedPackage.priceYuan.toFixed(2)}</span>
              </div>
            </div>

            {/* 支付方式选择 */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">选择支付方式</h4>
              <div className="space-y-2">
                {availableMethods.map((method) => {
                  const methodInfo = getMethodInfo(method);
                  return (
                    <label
                      key={method}
                      className={`
                        flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                      `}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={selectedMethod === method}
                        onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{methodInfo.icon}</span>
                        <div>
                          <div className="font-medium">{methodInfo.name}</div>
                          <div className="text-sm text-gray-500">{methodInfo.description}</div>
                        </div>
                      </div>
                      {selectedMethod === method && (
                        <CheckIcon className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={orderLoading}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {orderLoading ? '处理中...' : '确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditStorePage;
