export type AuctionStatus =
  | "open"
  | "bidding"
  | "selected"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface AuctionItem {
  id: string;
  title: string;
  region: string;
  size_pyeong: number;
  budget_min: number | null;
  budget_max: number | null;
  schedule: string | null;
  status: AuctionStatus;
  bid_count: number;
  deadline_at: string | null;
  created_at: string;
}

export interface BidItem {
  id: string;
  auction_id: string;
  contractor_id: string | null;
  total_price: number;
  message: string | null;
  status: "submitted" | "selected" | "rejected";
  created_at: string;
}

export interface AuctionDetail {
  id: string;
  user_id: string;
  title: string;
  region: string;
  size_pyeong: number;
  budget_min: number | null;
  budget_max: number | null;
  schedule: string | null;
  description: string | null;
  status: AuctionStatus;
  bid_count: number;
  deadline_at: string | null;
  created_at: string;
  updated_at: string;
  bids: BidItem[];
}
