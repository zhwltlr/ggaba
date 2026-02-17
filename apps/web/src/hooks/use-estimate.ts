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
        .select("*")
        .eq("id", id)
        .single();

      if (estimateError) throw estimateError;

      const { data: items, error: itemsError } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", id)
        .order("sort_order", { ascending: true });

      if (itemsError) throw itemsError;

      return { estimate, items };
    },
    enabled: !!id,
  });
}
