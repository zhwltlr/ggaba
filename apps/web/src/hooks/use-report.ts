"use client";

import { useMutation } from "@tanstack/react-query";
import { submitReport } from "@/app/_actions/reports";

export function useSubmitReport() {
  return useMutation({
    mutationFn: submitReport,
  });
}
