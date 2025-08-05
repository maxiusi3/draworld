import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              用户服务协议
            </h1>
            <p className="text-gray-600">
              最后更新日期：2025年8月2日
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">欢迎使用童画奇旅</h2>
            <p className="text-gray-700 mb-6">
              欢迎您使用童画奇旅（WhimsyBrush）服务。本协议阐述了您在使用我们的服务时应遵守的条款和条件。通过访问或使用我们的服务，您同意受本协议约束。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">服务介绍</h3>
            <p className="text-gray-700 mb-4">
              童画奇旅是一个使用人工智能技术将儿童绘画作品转换为动画视频的在线平台。我们提供以下服务：
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>图片上传和编辑功能</li>
              <li>AI驱动的图生视频服务</li>
              <li>视频下载和分享功能</li>
              <li>用户账户管理</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">用户责任</h3>
            <p className="text-gray-700 mb-4">使用我们的服务时，您同意：</p>
            <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
              <li>提供真实、准确的注册信息</li>
              <li>仅上传您拥有版权或使用权的内容</li>
              <li>不上传非法、有害、不宜或侵犯他人权利的内容</li>
              <li>不使用我们的服务进行任何非法活动</li>
              <li>不尝试干扰或破坏我们的服务</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">知识产权</h3>
            <p className="text-gray-700 mb-4">
              您上传的原始内容的版权仍属于您。通过使用我们的服务，您授予我们在提供服务所必需的范围内使用、处理和存储您的内容的权利。
            </p>
            <p className="text-gray-700 mb-6">
              我们尊重您的知识产权，也请您尊重他人的知识产权。如果您认为我们平台上的某些内容侵犯了您的权利，请联系我们。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">隐私保护</h3>
            <p className="text-gray-700 mb-6">
              我们非常重视您的隐私。有关我们如何收集、使用和保护您的个人信息的详细信息，请查看我们的隐私政策。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">服务可用性</h3>
            <p className="text-gray-700 mb-6">
              我们努力确保服务的可用性，但不能保证服务不会中断。我们可能需要定期进行维护、更新或改进服务。在可能的情况下，我们会提前通知您服务中断。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">责任限制</h3>
            <p className="text-gray-700 mb-6">
              在适用法律允许的最大范围内，我们对因使用或无法使用我们的服务而造成的任何损失不承担责任。这包括但不限于直接、间接、偶然或特殊损失。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">服务变更和终止</h3>
            <p className="text-gray-700 mb-6">
              我们保留随时修改、暂停或终止我们服务的权利。如果我们计划永久终止服务，我们将在合理时间内提前通知您。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">协议修改</h3>
            <p className="text-gray-700 mb-6">
              我们可能会不时更新本协议。如果我们做出重大更改，我们将通过适当的方式通知您。继续使用我们的服务将被视为您对修改后的协议的同意。
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">联系我们</h3>
            <p className="text-gray-700 mb-4">
              如果您对本协议有任何疑问或意见，请通过以下方式联系我们：
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>邮箱：support@whimsybrush.com</li>
              <li>官方网站：www.whimsybrush.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;