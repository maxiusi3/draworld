import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConsumeCredits } from '../hooks/useCredits';
import { videoService, CreateVideoTaskParams } from '../services/videoService';
import { storageServiceOSS as storageService } from '../services/storageService.oss';
import ImageUploader from '../components/ImageUploader/ImageUploader';
import ImageEditor from '../components/ImageEditor/ImageEditor';
import { CreditBalance, InsufficientCreditsAlert } from '../components/Credits/CreditBalance';
import { CREDIT_RULES } from '../types/credits';
import {
  SparklesIcon,
  PencilSquareIcon,
  MusicalNoteIcon,
  RectangleStackIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type MusicStyle = 'Joyful' | 'Warm' | 'Epic' | 'Mysterious' | 'Calm';
type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21';

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const CreatePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { consumeCreditsForVideo, hasSufficientCredits, loading: creditsLoading } = useConsumeCredits();
  const navigate = useNavigate();
  
  // 状态管理
  const [currentStep, setCurrentStep] = useState(1);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [editedImageUrl, setEditedImageUrl] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // 生成参数
  const [prompt, setPrompt] = useState('');
  const [musicStyle, setMusicStyle] = useState<MusicStyle>('Joyful');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  const steps: Step[] = [
    {
      id: 1,
      title: '上传图片',
      description: '选择孩子的绘画作品',
      completed: !!originalFile
    },
    {
      id: 2,
      title: '编辑调整',
      description: '裁切和旋转图片（可选）',
      completed: !!editedImageUrl || (!!originalFile && !showEditor)
    },
    {
      id: 3,
      title: '设置参数',
      description: '添加描述和选择音乐风格',
      completed: prompt.trim().length > 0
    },
    {
      id: 4,
      title: '生成视频',
      description: 'AI创作神奇动画',
      completed: false
    }
  ];
  
  const musicStyles: { value: MusicStyle; label: string; description: string }[] = [
    { value: 'Joyful', label: '欢快', description: '活泼明快的音乐风格' },
    { value: 'Warm', label: '温馨', description: '温柔暖心的音乐风格' },
    { value: 'Epic', label: '史诗', description: '宏伟壮观的音乐风格' },
    { value: 'Mysterious', label: '神秘', description: '神秘幽静的音乐风格' },
    { value: 'Calm', label: '宁静', description: '平静放松的音乐风格' }
  ];
  
  const aspectRatios: { value: AspectRatio; label: string; description: string }[] = [
    { value: '16:9', label: '16:9', description: '横屏视频（推荐）' },
    { value: '1:1', label: '1:1', description: '正方形（社交媒体）' },
    { value: '9:16', label: '9:16', description: '竖屏视频（手机）' },
    { value: '4:3', label: '4:3', description: '传统比例' },
    { value: '3:4', label: '3:4', description: '竖向传统比例' },
    { value: '21:9', label: '21:9', description: '电影宽屏' },
    { value: '9:21', label: '9:21', description: '竖向宽屏' }
  ];
  
  const promptTemplates = [
    '让这幅画作慢慢活起来，展现出孩子的想象力',
    '这是一个充满魔法的世界，让一切都动起来',
    '展现这幅作品中的故事，让角色们有生命力',
    '这是一个童话世界，所有的东西都充满生机',
    '让这幅画变成一个快乐的动画故事'
  ];

  const handleImageSelected = (file: File, preview: string) => {
    setOriginalFile(file);
    setPreviewUrl(preview);
    setEditedImageUrl('');
    setCurrentStep(2);
  };

  const handleEditImage = () => {
    setShowEditor(true);
  };

  const handleEditorSave = (editedUrl: string) => {
    setEditedImageUrl(editedUrl);
    setShowEditor(false);
    setCurrentStep(3);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  const handleSkipEdit = () => {
    setCurrentStep(3);
  };

  const handlePromptTemplate = (template: string) => {
    setPrompt(template);
  };

  const handleGenerate = async () => {
    if (!currentUser || !originalFile) {
      toast.error('请先登录并上传图片');
      return;
    }

    if (!prompt.trim()) {
      toast.error('请输入描述文字');
      return;
    }

    // 检查积分余额
    if (!hasSufficientCredits(CREDIT_RULES.VIDEO_GENERATION_COST)) {
      toast.error(`积分余额不足，需要 ${CREDIT_RULES.VIDEO_GENERATION_COST} 积分`);
      return;
    }

    setUploading(true);
    setGenerating(true);

    try {
      // 首先上传图片到OSS Storage
      let fileToUpload = originalFile;

      // 如果有编辑过的图片，使用编辑后的版本
      if (editedImageUrl) {
        // 将DataURL转换为Blob
        const response = await fetch(editedImageUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], originalFile.name, { type: 'image/jpeg' });
      }

      const imageUrl = await storageService.uploadUserImage(fileToUpload, currentUser.uid);
      setUploading(false);

      // 创建视频生成任务
      const params: CreateVideoTaskParams = {
        imageUrl,
        prompt: prompt.trim(),
        musicStyle,
        aspectRatio
      };

      const taskId = await videoService.createVideoTask(params);

      // 消费积分
      const consumeResult = await consumeCreditsForVideo(taskId);
      if (!consumeResult) {
        toast.error('积分消费失败，请重试');
        setGenerating(false);
        return;
      }

      // 跳转到结果页面
      navigate(`/result/${taskId}`);

    } catch (error) {
      console.error('生成视频失败:', error);
      toast.error('生成视频失败，请重试');
      setGenerating(false);
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能使用创作功能</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  if (showEditor && previewUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ImageEditor
            imageUrl={previewUrl}
            onSave={handleEditorSave}
            onCancel={handleEditorCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            创作神奇动画
          </h1>
          <p className="text-gray-600">
            让孩子的绘画作品成为生动的动画视频
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-200 ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.completed ? '✓' : step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    step.completed || currentStep === step.id ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-4 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 步骤1: 上传图片 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <SparklesIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  上传孩子的绘画作品
                </h2>
                <p className="text-gray-600">
                  选择一幅清晰、光线良好的作品照片
                </p>
              </div>
              
              <ImageUploader
                onImageSelected={handleImageSelected}
                loading={uploading}
              />
            </div>
          )}

          {/* 步骤2: 编辑调整 */}
          {currentStep === 2 && previewUrl && (
            <div className="space-y-6">
              <div className="text-center">
                <PencilSquareIcon className="mx-auto h-12 w-12 text-purple-500 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  编辑图片（可选）
                </h2>
                <p className="text-gray-600">
                  您可以裁切和旋转图片，或者直接进入下一步
                </p>
              </div>
              
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="预览图片"
                  className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleEditImage}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                  <span>编辑图片</span>
                </button>
                <button
                  onClick={handleSkipEdit}
                  className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                >
                  跳过编辑
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 设置参数 */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <MusicalNoteIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  设置生成参数
                </h2>
                <p className="text-gray-600">
                  添加描述文字和选择音乐风格，让AI更好地理解您的需求
                </p>
              </div>

              {/* 积分余额显示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">
                        视频生成消费
                      </h3>
                      <p className="text-sm text-blue-600">
                        每个视频需要消费 {CREDIT_RULES.VIDEO_GENERATION_COST} 积分
                      </p>
                    </div>
                  </div>
                  <CreditBalance
                    size="medium"
                    showRechargeButton={true}
                    onRechargeClick={() => toast('充值功能即将上线', { icon: 'ℹ️' })}
                  />
                </div>
              </div>

              {/* 积分不足提示 */}
              <InsufficientCreditsAlert
                requiredCredits={CREDIT_RULES.VIDEO_GENERATION_COST}
                onRechargeClick={() => toast('充值功能即将上线', { icon: 'ℹ️' })}
              />
              
              {/* 描述文字 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  描述文字 *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请描述您希望看到的动画效果..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  maxLength={150}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {prompt.length}/150 字符
                  </p>
                </div>
                
                {/* 描述模板 */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">快速模板：</p>
                  <div className="flex flex-wrap gap-2">
                    {promptTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptTemplate(template)}
                        className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors duration-200"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 音乐风格 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  音乐风格
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {musicStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setMusicStyle(style.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        musicStyle === style.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-xs mt-1 opacity-75">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 宽高比 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  视频宽高比
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        aspectRatio === ratio.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{ratio.label}</div>
                      <div className="text-xs mt-1 opacity-75">{ratio.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 生成按钮 */}
              <div className="text-center pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={
                    !prompt.trim() ||
                    generating ||
                    uploading ||
                    creditsLoading ||
                    !hasSufficientCredits(CREDIT_RULES.VIDEO_GENERATION_COST)
                  }
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 mx-auto"
                >
                  <SparklesIcon className="w-6 h-6" />
                  <span>
                    {uploading ? '上传中...' :
                     generating ? '生成中...' :
                     creditsLoading ? '检查积分中...' :
                     !hasSufficientCredits(CREDIT_RULES.VIDEO_GENERATION_COST) ? '积分不足' :
                     '生成神奇动画'}
                  </span>
                </button>
                
                {(uploading || generating) && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">
                      {uploading ? '正在上传图片...' : '正在创作您的专属动画...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;