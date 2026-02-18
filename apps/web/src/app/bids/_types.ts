import type { AuctionStatus } from "@/app/auction/_types";

export type BidStatus = "submitted" | "selected" | "rejected";

/** 시공사에게 보이는 경매 정보 (user_id/address/phone 제외 — 블라인드) */
export interface OpenAuctionItem {
  id: string;
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
  /** 내가 이미 입찰했으면 bid status, 아니면 null */
  my_bid_status: BidStatus | null;
}

/** 입찰 항목 입력 타입 */
export interface BidItemInput {
  category: string;
  detail: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

/** 내 입찰 내역 타입 */
export interface MyBidItem {
  id: string;
  auction_id: string;
  total_price: number;
  message: string | null;
  status: BidStatus;
  created_at: string;
  auction: {
    title: string;
    region: string;
    size_pyeong: number;
    status: AuctionStatus;
  };
}
