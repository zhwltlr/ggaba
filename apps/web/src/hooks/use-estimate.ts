"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { estimateKeys } from "@/lib/query-keys";

export function useEstimateDetail(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: estimateKeys.detail(id),
    queryFn: async () => {
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .select("id, title, bad_price_score, total_price, region, size_pyeong, building_type, diagnosis_result, status, created_at")
        .eq("id", id)
        .single();

      if (estimateError) throw estimateError;

      const { data: items, error: itemsError } = await supabase
        .from("estimate_items")
        .select("id, estimate_id, category, detail, unit, unit_price, quantity, total_price, sort_order, price_rating, market_price_low, market_price_high")
        .eq("estimate_id", id)
        .order("sort_order", { ascending: true });

      if (itemsError) throw itemsError;

      return { estimate, items };
    },
    enabled: !!id,
  });
}
