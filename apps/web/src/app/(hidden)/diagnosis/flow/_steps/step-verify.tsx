"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ggaba/ui";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@ggaba/lib/utils";
import { formatCurrency } from "@ggaba/lib/utils/format";
import {
  useDiagnosisStore,
  type ExtractedLineItem,
} from "@/stores/use-diagnosis-store";
import { mockOcrExtract } from "@/lib/mock-ocr";

export function StepVerify() {
  const {
    uploadedImages,
    extractedData,
    setExtractedData,
    updateLineItem,
    removeLineItem,
    addLineItem,
  } = useDiagnosisStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ExtractedLineItem>>({});

  // Mock OCR 실행 — 데이터가 없을 때만
  useEffect(() => {
    if (extractedData.length === 0 && uploadedImages.length > 0) {
      const urls = uploadedImages.map((img) => img.url);
      const items = mockOcrExtract(urls);
      setExtractedData(items);
    }
  }, [extractedData.length, uploadedImages, setExtractedData]);

  // 카테고리별 그룹핑
  const categories = extractedData.reduce<Record<string, ExtractedLineItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  const grandTotal = extractedData.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const startEdit = useCallback((item: ExtractedLineItem) => {
    setEditingId(item.id);
    setEditValues({
      detail: item.detail,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    });
  }, []);

  const saveEdit = useCallback(
    (id: string) => {
      const price = editValues.unitPrice ?? 0;
      const qty = editValues.quantity ?? 0;
      updateLineItem(id, {
        ...editValues,
        totalPrice: Math.round(price * qty),
      });
      setEditingId(null);
      setEditValues({});
    },
    [editValues, updateLineItem]
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const handleAddItem = useCallback(() => {
    const newItem: ExtractedLineItem = {
      id: crypto.randomUUID(),
      category: "기타",
      detail: "새 항목",
      unit: "식",
      unitPrice: 0,
      quantity: 1,
      totalPrice: 0,
      isEdited: true,
    };
    addLineItem(newItem);
    startEdit(newItem);
  }, [addLineItem, startEdit]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        견적서에서 추출된 항목을 확인하고, 필요시 수정해주세요.
      </p>

      {Object.entries(categories).map(([category, items]) => {
        const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{category}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">항목</TableHead>
                      <TableHead className="w-16">단위</TableHead>
                      <TableHead className="w-16 text-right">수량</TableHead>
                      <TableHead className="w-24 text-right">단가</TableHead>
                      <TableHead className="w-24 text-right">금액</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(item.isEdited && "bg-accent/30")}
                      >
                        {editingId === item.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editValues.detail ?? ""}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    detail: e.target.value,
                                  })
                                }
                                className="h-7 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editValues.unit ?? ""}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    unit: e.target.value,
                                  })
                                }
                                className="h-7 w-14 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editValues.quantity ?? 0}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    quantity: Number(e.target.value),
                                  })
                                }
                                className="h-7 w-14 text-right text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editValues.unitPrice ?? 0}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    unitPrice: Number(e.target.value),
                                  })
                                }
                                className="h-7 w-20 text-right text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(
                                (editValues.unitPrice ?? 0) *
                                  (editValues.quantity ?? 0)
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => saveEdit(item.id)}
                                  className="rounded p-1 hover:bg-muted"
                                >
                                  <Check className="h-3 w-3 text-safe" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded p-1 hover:bg-muted"
                                >
                                  <X className="h-3 w-3 text-destructive" />
                                </button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-xs">
                              {item.detail}
                            </TableCell>
                            <TableCell className="text-xs">
                              {item.unit}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="rounded p-1 hover:bg-muted"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(item.id)}
                                  className="rounded p-1 hover:bg-muted"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* 전체 합계 */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm font-semibold">전체 합계</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(grandTotal)}
          </span>
        </CardContent>
      </Card>

      {/* 행 추가 */}
      <Button variant="outline" onClick={handleAddItem} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        항목 추가
      </Button>
    </div>
  );
}
