import { useState } from 'react';
import { MessageSquare, RefreshCw, Star, ThumbsUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import {
  appendMarketplaceReview,
  getMarketplaceReviews,
  type MarketplaceAssetType,
  type MarketplaceReview,
} from '../../data/mockMarketplaceOperations';

interface ReviewAsset {
  id: string;
  name: string;
  rating: number;
  reviews: number;
}

interface MarketplaceReviewsPanelProps {
  asset: ReviewAsset;
  assetType: MarketplaceAssetType;
  currentUser: string;
  onSubmit: (review: Pick<MarketplaceReview, 'rating' | 'comment'>) => void;
}

const REVIEW_PAGE_SIZE = 5;

function StarRating({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} 分`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={size} className={index < Math.round(value) ? 'text-warning fill-warning' : 'text-text-muted'} />
      ))}
    </span>
  );
}

export function MarketplaceReviewsPanel({ asset, assetType, currentUser, onSubmit }: MarketplaceReviewsPanelProps) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<MarketplaceReview[]>(() => getMarketplaceReviews(asset.id, assetType, asset.reviews));
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState('刚刚');
  const [reviewPage, setReviewPage] = useState(1);
  const assetLabel = assetType === 'model' ? '模型' : '数据集';
  const visibleReviews = reviews.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);

  const refreshReviews = (totalCount = asset.reviews) => {
    setRefreshing(true);
    window.setTimeout(() => {
      setReviews(getMarketplaceReviews(asset.id, assetType, totalCount));
      setLastRefreshedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setRefreshing(false);
    }, 450);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 4) return;
    appendMarketplaceReview(asset.id, assetType, {
      author: currentUser,
      rating: score,
      comment: comment.trim(),
    });
    const nextTotal = asset.reviews + 1;
    setReviews(getMarketplaceReviews(asset.id, assetType, nextTotal));
    setReviewPage(1);
    onSubmit({ rating: score, comment: comment.trim() });
    setScore(5);
    setComment('');
    refreshReviews(nextTotal);
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5">
          <p className="text-xs text-text-muted">{assetLabel}综合评分</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-4xl font-semibold text-text-primary">{asset.rating.toFixed(1)}</span>
            <span className="mb-1 text-sm text-text-muted">/ 5.0</span>
          </div>
          <div className="mt-2"><StarRating value={asset.rating} size={16} /></div>
          <p className="mt-3 text-xs text-text-muted">已有 {reviews.length.toLocaleString()} 条评分 · 评论集合与统计数一致</p>
        </div>

        <CardReviewForm score={score} setScore={setScore} comment={comment} setComment={setComment} onSubmit={handleSubmit} />
      </div>

      <div className="rounded-xl border border-border bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">社区评论</h3>
          </div>
          <span className={`flex items-center gap-1 text-xs ${refreshing ? 'text-primary' : 'text-text-muted'}`}>
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '评论发布成功，正在自动刷新…' : `已自动刷新 · ${lastRefreshedAt}`}
          </span>
        </div>
        <div className="divide-y divide-border">
          {visibleReviews.map(review => (
            <div key={review.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary">{review.author.slice(0, 1)}</span>
                  <span className="text-sm font-medium text-text-primary">{review.author}</span>
                  <StarRating value={review.rating} size={11} />
                </div>
                <span className="text-xs text-text-muted">{review.createdAt}</span>
              </div>
              <p className="mt-2 pl-9 text-sm leading-6 text-text-secondary">{review.comment}</p>
              <div className="mt-2 flex justify-end">
                <span className="flex items-center gap-1 text-xs text-text-muted"><ThumbsUp size={11} />有帮助 {review.helpful}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3">
          <Pagination page={reviewPage} total={reviews.length} pageSize={REVIEW_PAGE_SIZE} onChange={setReviewPage} />
        </div>
      </div>
    </div>
  );
}

function CardReviewForm({
  score,
  setScore,
  comment,
  setComment,
  onSubmit,
}: {
  score: number;
  setScore: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium text-text-primary">发布评价</p>
      <p className="mt-1 text-xs text-text-muted">请基于真实的使用和接入体验评分。</p>
      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(value => (
          <button key={value} type="button" onClick={() => setScore(value)} aria-label={`${value} 分`}>
            <Star size={21} className={value <= score ? 'fill-warning text-warning' : 'text-border'} />
          </button>
        ))}
        <span className="ml-1 text-xs text-text-muted">{score} / 5</span>
      </div>
      <textarea
        value={comment}
        onChange={event => setComment(event.target.value)}
        placeholder="分享数据质量、效果、性能或接入体验（至少 4 个字）"
        rows={4}
        required
        minLength={4}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-base px-3 py-2 text-sm text-text-primary focus:border-primary/60 focus:outline-none"
      />
      <Button type="submit" size="sm" className="mt-3 w-full" leftIcon={<MessageSquare size={13} />}>发布评论</Button>
    </form>
  );
}
