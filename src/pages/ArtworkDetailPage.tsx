import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Eye, User, Share2, Flag } from 'lucide-react';
import { useArtwork, useLike, useComments } from '../hooks/useCommunity';
import { communityService } from '../services/communityService';
import { toast } from 'react-hot-toast';

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { artwork, loading: artworkLoading, error } = useArtwork(id!);
  const { liked, likeCount, loading: likeLoading, toggleLike } = useLike(id!);
  const { comments, loading: commentsLoading, submitting, addComment, refresh: refreshComments } = useComments(id!);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const success = await addComment(commentText.trim());
    if (success) {
      setCommentText('');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork?.title,
          text: artwork?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消或失败');
      }
    } else {
      // 降级到复制链接
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      } catch (error) {
        toast.error('复制失败');
      }
    }
  };

  const handleReport = async (reason: string, description?: string) => {
    try {
      await communityService.submitReport('artwork', id!, reason, description);
      toast.success('举报已提交，我们会尽快处理');
      setShowReportDialog(false);
    } catch (error) {
      toast.error('举报提交失败');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (artworkLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载作品详情...</p>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">作品不存在</h2>
          <p className="text-gray-600 mb-4">该作品可能已被删除或设为私密</p>
          <button
            onClick={() => navigate('/community')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回创意广场
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/community')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回创意广场</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
              
              <button
                onClick={() => setShowReportDialog(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>举报</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 视频播放区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* 视频播放器 */}
              <div className="aspect-video bg-black">
                <video
                  src={artwork.video_url}
                  poster={artwork.thumbnail_url}
                  controls
                  className="w-full h-full"
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
              
              {/* 作品信息 */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {artwork.title}
                </h1>
                
                {artwork.description && (
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {artwork.description}
                  </p>
                )}
                
                {/* 创作者和时间 */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>用户 {artwork.user_id.slice(-8)}</span>
                  </div>
                  <span>{formatDate(artwork.created_at)}</span>
                </div>
                
                {/* 互动按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* 点赞 */}
                    <button
                      onClick={toggleLike}
                      disabled={likeLoading}
                      className={`flex items-center space-x-2 transition-colors ${
                        liked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-500 hover:text-red-500'
                      } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart 
                        className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} 
                      />
                      <span>{formatCount(likeCount || artwork.likes_count)}</span>
                    </button>
                    
                    {/* 评论 */}
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>{formatCount(comments.length)}</span>
                    </div>
                    
                    {/* 浏览 */}
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Eye className="w-5 h-5" />
                      <span>{formatCount(artwork.views_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 评论区域 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">
                  评论 ({comments.length})
                </h3>
              </div>
              
              {/* 发表评论 */}
              <div className="p-4 border-b">
                <form onSubmit={handleSubmitComment}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="发表你的看法..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {commentText.length}/500
                    </span>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? '发表中...' : '发表评论'}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* 评论列表 */}
              <div className="max-h-96 overflow-y-auto">
                {commentsLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">加载评论中...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>还没有评论，来发表第一条评论吧！</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                用户 {comment.user_id.slice(-8)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 举报对话框 */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">举报作品</h3>
            <div className="space-y-2 mb-4">
              {['不当内容', '垃圾信息', '侵权内容', '其他'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReportDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetailPage;
