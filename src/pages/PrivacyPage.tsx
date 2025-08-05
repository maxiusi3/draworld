import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              隐私政策
            </h1>
            <p className="text-gray-600">
              最后更新日期：2025年8月2日
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">概述</h2>
            <p className="text-gray-700 mb-6">
              童画奇旅（WhimsyBrush）高度重视您的隐私权。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。使用我们的服务即表示您同意本隐私政策中描述的做法。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">我们收集的信息</h3>
            <p className="text-gray-700 mb-4">我们可能收集以下类型的信息：</p>
            
            <h4 className="text-base font-semibold text-gray-800 mb-2">您提供的信息</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>注册信息（姓名、邮箱地址）</li>
              <li>您上传的图片和创作的内容</li>
              <li>您输入的文字描述和设置</li>
              <li>与我们联系时提供的信息</li>
            </ul>
            
            <h4 className="text-base font-semibold text-gray-800 mb-2">自动收集的信息</h4>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>访问日志（IP地址、浏览器类型、访问时间）</li>
              <li>设备信息（设备类型、操作系统）</li>
              <li>使用统计数据（功能使用情况、错误报告）</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">信息使用目的</h3>
            <p className="text-gray-700 mb-4">我们使用收集的信息用于：</p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>提供和维护我们的服务</li>
              <li>处理您的视频生成请求</li>
              <li>改进和优化用户体验</li>
              <li>发送服务相关的通知</li>
              <li>防止欺诈和滥用行为</li>
              <li>遵守法律法规要求</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">信息存储和安全</h3>
            <p className="text-gray-700 mb-4">
              我们采用业界标准的安全措施来保护您的个人信息：
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>数据传输加密（SSL/TLS）</li>
              <li>数据存储加密</li>
              <li>访问控制和身份验证</li>
              <li>定期安全审计和更新</li>
              <li>员工安全培训和访问权限控制</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">信息共享</h3>
            <p className="text-gray-700 mb-4">
              我们不会向第三方出售、出租或交易您的个人信息。我们只在以下情况下共享信息：
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>获得您的明确同意</li>
              <li>与信赖的服务提供商（如云存储、AI服务）共享以提供服务</li>
              <li>遵守法律要求或保护我们的合法权益</li>
              <li>在紧急情况下保护人身安全</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">您的权利</h3>
            <p className="text-gray-700 mb-4">根据适用法律，您可能拥有以下权利：</p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>访问权：请求获取我们持有的您的个人信息</li>
              <li>更正权：请求更正不准确或不完整的信息</li>
              <li>删除权：请求删除您的个人信息</li>
              <li>限制处理权：请求限制我们处理您的信息</li>
              <li>数据可携带权：请求获取您的数据副本</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">数据保留</h3>
            <p className="text-gray-700 mb-6">
              我们只在必要时保留您的个人信息。如果您删除账户，我们将在合理时间内删除您的个人信息，但可能保留一些信息以遵守法律要求。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">儿童隐私</h3>
            <p className="text-gray-700 mb-6">
              我们的服务面向成年人用户。我们不会有意收集13岁以下儿童的个人信息。如果我们发现意外收集了儿童的信息，我们将立即删除。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">跨境数据传输</h3>
            <p className="text-gray-700 mb-6">
              您的信息可能会被传输到中国境外的服务器进行处理。我们会采取适当的保护措施，确保您的信息在传输和处理过程中得到充分保护。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">政策更新</h3>
            <p className="text-gray-700 mb-6">
              我们可能会不时更新本隐私政策。如果我们做出重大更改，我们将通过邮件或在网站上发布通知来告知您。继续使用我们的服务将被视为您对更新后的隐私政策的同意。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">联系我们</h3>
            <p className="text-gray-700 mb-4">
              如果您对本隐私政策有任何疑问或意见，或希望行使您的数据权利，请通过以下方式联系我们：
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>邮箱：privacy@whimsybrush.com</li>
              <li>官方网站：www.whimsybrush.com</li>
              <li>地址：[公司地址]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;