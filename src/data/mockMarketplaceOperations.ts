export type MarketplaceAssetType = 'model' | 'dataset';

export interface MarketplaceAssetMetrics {
  id: string;
  downloads: number;
  stars: number;
  rating: number;
  reviews: number;
}

export interface MarketplaceReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

type ReviewStore = Partial<Record<MarketplaceAssetType, Record<string, MarketplaceReview[]>>>;

const REVIEW_STORAGE_KEY = 'zhiyun:marketplace-reviews';

export type MarketplaceRankingMetric = 'heat' | 'downloads' | 'stars' | 'rating';

const REVIEWERS = ['王晨', '陈思颖', '赵子墨', '林晓雨', '周博文', '许宁'];

const REVIEW_COPY: Record<MarketplaceAssetType, string[]> = {
  model: [
    '生产环境运行稳定，接口兼容性和文档完整度都很不错。',
    '在目标业务语料上的效果符合预期，建议保留当前版本作为基线。',
    '推理延迟可控，批量调用场景下的吞吐表现较好。',
    '已接入评测流水线，模型输出的一致性和可解释性都值得推荐。',
  ],
  dataset: [
    '字段说明清楚，抽样复核后标注质量与描述基本一致。',
    '数据版本和变更记录完整，适合作为训练与评测的公共基线。',
    '清洗规则可追溯，样本分布对当前业务场景很有参考价值。',
    '已完成内部试用，格式规范，接入数据处理流程比较顺畅。',
  ],
};

function hash(value: string) {
  return [...value].reduce((result, character) => (result * 31 + character.charCodeAt(0)) >>> 0, 7);
}

/** 为任一资源返回稳定的完整评论 Mock 集合。 */
export function getMockMarketplaceReviews(assetId: string, assetType: MarketplaceAssetType, count = 3): MarketplaceReview[] {
  const seed = hash(`${assetType}-${assetId}`);
  return Array.from({ length: count }, (_, index) => {
    const offset = (seed + index * 5) % REVIEWERS.length;
    return {
      id: `${assetType}-${assetId}-review-${index + 1}`,
      author: REVIEWERS[offset],
      rating: index === 2 && seed % 3 === 0 ? 4 : 5,
      comment: REVIEW_COPY[assetType][(seed + index) % REVIEW_COPY[assetType].length],
      createdAt: `2025-${String(3 + ((seed + index) % 8)).padStart(2, '0')}-${String(6 + ((seed * 3 + index * 7) % 20)).padStart(2, '0')}`,
      helpful: 3 + ((seed + index * 11) % 28),
    };
  });
}

function readSubmittedReviews(): ReviewStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}') as ReviewStore;
  } catch {
    return {};
  }
}

function writeSubmittedReviews(store: ReviewStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // mock mode: ignore unavailable local storage
  }
}

/**
 * 返回与资源统计数一致的完整评论集合。
 * 用户新发布的评论优先保留，剩余数量由稳定 Mock 填充。
 */
export function getMarketplaceReviews(assetId: string, assetType: MarketplaceAssetType, totalCount = 3) {
  const submitted = readSubmittedReviews()[assetType]?.[assetId] ?? [];
  const mockCount = Math.max(0, totalCount - submitted.length);
  return [...submitted, ...getMockMarketplaceReviews(assetId, assetType, mockCount)];
}

export function appendMarketplaceReview(
  assetId: string,
  assetType: MarketplaceAssetType,
  review: Pick<MarketplaceReview, 'author' | 'rating' | 'comment'>,
) {
  const store = readSubmittedReviews();
  const entry: MarketplaceReview = {
    id: `${assetType}-${assetId}-${Date.now()}`,
    ...review,
    createdAt: new Date().toISOString().slice(0, 10),
    helpful: 0,
  };
  const assetReviews = store[assetType] ?? {};
  store[assetType] = {
    ...assetReviews,
    [assetId]: [entry, ...(assetReviews[assetId] ?? [])],
  };
  writeSubmittedReviews(store);
  return entry;
}

/** 以下载、收藏、评分和评论共同计算热度，避免单一下载量主导榜单。 */
export function getMarketplaceHeat(asset: MarketplaceAssetMetrics) {
  const downloadScore = Math.log10(asset.downloads + 1) * 30;
  const starScore = Math.log10(asset.stars + 1) * 22;
  const ratingScore = asset.rating * 12;
  const reviewScore = Math.log10(asset.reviews + 1) * 14;
  return Math.round(downloadScore + starScore + ratingScore + reviewScore);
}

export function getMarketplaceRankingValue(asset: MarketplaceAssetMetrics, metric: MarketplaceRankingMetric) {
  if (metric === 'heat') return getMarketplaceHeat(asset);
  return asset[metric];
}

export function rankMarketplaceAssets<T extends MarketplaceAssetMetrics>(assets: T[], metric: MarketplaceRankingMetric) {
  return [...assets].sort((left, right) => getMarketplaceRankingValue(right, metric) - getMarketplaceRankingValue(left, metric));
}

export function applyMarketplaceReview<T extends MarketplaceAssetMetrics>(asset: T, score: number): T {
  const reviews = asset.reviews + 1;
  return {
    ...asset,
    reviews,
    rating: Number(((asset.rating * asset.reviews + score) / reviews).toFixed(1)),
  };
}
