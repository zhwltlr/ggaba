export interface PortfolioItem {
  id: string;
  contractor_id: string;
  title: string;
  description: string | null;
  region: string | null;
  size_pyeong: number | null;
  duration_days: number | null;
  total_cost: number | null;
  before_image_urls: string[];
  after_image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioInput {
  title: string;
  description?: string;
  region?: string;
  sizePyeong?: number;
  durationDays?: number;
  totalCost?: number;
  beforeImageUrls?: string[];
  afterImageUrls?: string[];
}
