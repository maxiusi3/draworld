"use client";

import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { useReferrals } from "@/hooks/useReferrals";
import { useSocialTasks } from "@/hooks/useSocialTasks";
import { SocialTaskService } from "@/services/socialTaskService";
import { ReferralService } from "@/services/referralService";
import { formatRelativeTime } from "@/lib/utils";


export default function ReferralsPage() {
  const { stats, loading, error, loadStats, refresh } = useReferrals();
  const { tasks, loading: _, submitTask, loadTasks } = useSocialTasks();
  const [socialPostLink, setSocialPostLink] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [copied, setCopied] = useState(false);

  // Load referral stats and social tasks on component mount
  useEffect(() => {
    loadStats();
    loadTasks();
  }, [loadStats, loadTasks]);

  const referralLink = stats ? ReferralService.generateReferralUrl(stats.referralCode) : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(
      "Check out Draworld! Turn your child's drawings into magical animated videos with AI. It's amazing! 🎨✨"
    );
    const url = encodeURIComponent(referralLink);

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=Check out Draworld!&body=${text}%0A%0A${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const handleSocialPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitTask({
        type: `${selectedPlatform}_share` as 'instagram_share' | 'tiktok_share' | 'twitter_share' | 'facebook_share',
        platform: selectedPlatform,
        postUrl: socialPostLink || undefined,
        hashtags: ['#draworld'],
      });
      
      alert(
        "Thank you! We'll review your post and add credits to your account within 24 hours."
      );
      setSocialPostLink("");
    } catch (err) {
      console.error("Failed to submit post. Please try again.", err);
      alert("Failed to submit post. Please try again.");
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown date';
    
    // Handle Firestore Timestamp
    const hasToDate = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp;
    const date = hasToDate ? (timestamp as { toDate: () => Date }).toDate() : new Date(timestamp as string | number);
    return formatRelativeTime(date);
  };

  if (loading && !stats) {
    return (
      <AccountLayout title="Invite Friends, Earn Free Credits!">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-400">Loading referral stats...</span>
        </div>
      </AccountLayout>
    );
  }

  if (error && !stats) {
    return (
      <AccountLayout title="Invite Friends, Earn Free Credits!">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Failed to load referral data</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={refresh} variant="primary">
            Try Again
          </Button>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title="Invite Friends, Earn Free Credits!"
      data-oid="lfj4rwj">

      <div className="space-y-8" data-oid="losjfm-">
        {/* Explanation */}
        <div
          className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-6 border border-pink-500/20"
          data-oid=".ixq_0z">

          <h3 className="text-lg font-semibold mb-3" data-oid="qbq2mhm">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm" data-oid="45nr91g">
            <div className="text-center" data-oid="pwwy.fn">
              <div
                className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2"
                data-oid="_xrjpk8">

                <span className="text-xl" data-oid="1sj9g34">
                  👥
                </span>
              </div>
              <div className="font-medium mb-1" data-oid="ayu0tec">
                Share Your Link
              </div>
              <div className="text-gray-400" data-oid="s:9o2-i">
                Invite friends to join Draworld
              </div>
            </div>
            <div className="text-center" data-oid="br0mt-0">
              <div
                className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2"
                data-oid="3drn92c">

                <span className="text-xl" data-oid="zylj:vr">
                  🎁
                </span>
              </div>
              <div className="font-medium mb-1" data-oid="u_wv7at">
                They Get Bonus
              </div>
              <div className="text-gray-400" data-oid="my_l4ux">
                +50 credits on top of 150 signup bonus
              </div>
            </div>
            <div className="text-center" data-oid="83:.z4n">
              <div
                className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2"
                data-oid="ch37q-b">

                <span className="text-xl" data-oid="6-tablz">
                  💰
                </span>
              </div>
              <div className="font-medium mb-1" data-oid="5qcxzng">
                You Earn Credits
              </div>
              <div className="text-gray-400" data-oid="mh_993u">
                30 credits + 70 more when they create
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {stats?.totalReferrals || 0}
            </div>
            <div className="text-gray-400">Friends Joined</div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats?.totalEarnings || 0}
            </div>
            <div className="text-gray-400">Credits Earned</div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {stats ? stats.totalReferrals - stats.completedReferrals : 0}
            </div>
            <div className="text-gray-400">Pending Rewards</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-zinc-800 rounded-xl p-6" data-oid="r5ue-8p">
          <h3 className="text-lg font-semibold mb-4" data-oid=":ruyqu6">
            Your Referral Link
          </h3>
          <div className="flex gap-3 mb-4" data-oid="jlsa0mf">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white font-mono text-sm"
              data-oid="xg-43wq" />


            <Button
              onClick={handleCopyLink}
              variant="primary"
              data-oid="s96rh32">

              {copied ? "✓ Copied!" : "Copy Link"}
            </Button>
          </div>

          {/* Share Buttons */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            data-oid="3znt7:3">

            <button
              onClick={() => handleSocialShare("email")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              data-oid="ye5oxzl">

              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="-ta:fvo">

                <path
                  d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  data-oid="i6x:8j5" />

              </svg>
              Email
            </button>
            <button
              onClick={() => handleSocialShare("facebook")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
              data-oid="23g:hen">

              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="1nxjmrg">

                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  data-oid="1fwb1z:" />

              </svg>
              Facebook
            </button>
            <button
              onClick={() => handleSocialShare("whatsapp")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors"
              data-oid="u68z9xl">

              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="zx7ox92">

                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                  data-oid="svjzyqk" />

              </svg>
              WhatsApp
            </button>
            <button
              onClick={() => handleSocialShare("twitter")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 rounded-lg text-white transition-colors"
              data-oid="tia_b3a">

              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="fmanaln">

                <path
                  d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                  data-oid="-n3u5b9" />

              </svg>
              Twitter
            </button>
          </div>
        </div>

        {/* Social Media Reward */}
        <div className="bg-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Get Credits for Sharing on Social Media
          </h3>
          <p className="text-gray-400 mb-4">
            Share your Draworld creations on social media with the hashtag{" "}
            <span className="text-pink-400 font-semibold">
              #draworld
            </span>
            {" "}and earn credits!
          </p>

          {/* Platform Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Choose Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'instagram', name: 'Instagram', reward: 100, icon: '📷' },
                { id: 'tiktok', name: 'TikTok', reward: 100, icon: '🎵' },
                { id: 'twitter', name: 'Twitter/X', reward: 50, icon: '🐦' },
                { id: 'facebook', name: 'Facebook', reward: 50, icon: '👥' },
              ].map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedPlatform === platform.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{platform.icon}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{platform.name}</div>
                      <div className="text-xs text-green-400">+{platform.reward} credits</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSocialPostSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Post URL (optional but recommended for faster review)
              </label>
              <input
                type="url"
                value={socialPostLink}
                onChange={(e) => setSocialPostLink(e.target.value)}
                placeholder={`https://${selectedPlatform}.com/...`}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <Button variant="primary">
              Submit for Review
            </Button>
          </form>

          {/* Social Tasks History */}
          {tasks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-700">
              <h4 className="font-medium mb-3">Recent Submissions</h4>
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task) => {
                  const statusInfo = SocialTaskService.getTaskStatusInfo(task.status);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="capitalize">{task.platform}</span>
                        <span className={`text-sm ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-green-400">
                        +{SocialTaskService.getTaskReward(task.type)} credits
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Referral History */}
        <div className="bg-zinc-800 rounded-xl p-6" data-oid="prauxsn">
          <h3 className="text-lg font-semibold mb-4" data-oid="hx7tr.a">
            Referral History
          </h3>

          {stats?.referrals && stats.referrals.length > 0 ? (
            <div className="space-y-3">
              {stats.referrals.map((referral) => {
                const signupBonus = 30;
                const firstVideoBonus = referral.firstVideoBonusAwarded ? 70 : 0;
                const totalEarned = signupBonus + firstVideoBonus;
                
                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        👤
                      </div>
                      <div>
                        <div className="font-medium">Friend</div>
                        <div className="text-sm text-gray-400">
                          Joined {formatDate(referral.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-green-400">
                        +{totalEarned} credits
                      </div>
                      <div
                        className={`text-sm ${
                          referral.firstVideoBonusAwarded
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {referral.firstVideoBonusAwarded
                          ? "Completed"
                          : "Pending first video"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) :

          <div className="text-center py-8" data-oid=":u7.k78">
              <div
              className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4"
              data-oid="p1ockq_">

                <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-oid="a_e9x.y">

                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  data-oid="88hpz5n" />

                </svg>
              </div>
              <p className="text-gray-400" data-oid="s:ucwah">
                No referrals yet. Start sharing your link!
              </p>
            </div>
          }
        </div>
      </div>
    </AccountLayout>);

}