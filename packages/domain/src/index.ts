export type CardVariant = {
  id: string;
  name: string;
  setName: string;
  collectorNumber: string;
  language: string;
  variant: "normal" | "holo" | "reverse" | "ex" | "other";
};

export type PriceSnapshot = {
  provider: "cardmarket" | "ebay";
  fetchedAt: string;
  currency: "EUR";
  lowPrice?: number;
  trendPrice?: number;
  lastSoldPrice?: number;
};

export type ScanStatus = "queued" | "processing" | "needs_confirmation" | "complete" | "failed";
