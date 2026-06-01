// src/shared/types/firefly.ts

// ── Request payload ──────────────────────────────────────────────────────────

export interface TransactionSplit {
  type: string;
  date: string;
  amount: string;
  description: string;
  source_name: string;
  destination_name: string;
}

export interface TransactionCreatePayload {
  transactions: TransactionSplit[];
}

// ── Single transaction (in create response and list items) ───────────────────

export interface TransactionJournal {
  transaction_journal_id: number;
  type: string;
  date: string;
  amount: string;
  description: string;
  source_name: string;
  destination_name: string;
}

export interface TransactionGroupAttributes {
  user: number;
  group_title: string | null;
  transactions: TransactionJournal[];
}

export interface TransactionGroupData {
  id: string;
  type: string;
  attributes: TransactionGroupAttributes;
}

// ── POST /transactions response ──────────────────────────────────────────────

export interface TransactionCreateResponse {
  data: TransactionGroupData;
}

// ── GET /transactions list response ─────────────────────────────────────────

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  current_url: string;
  next_url: string | null;
}

export interface TransactionListMeta {
  pagination: Pagination;
}

export interface TransactionListResponse {
  data: TransactionGroupData[];
  meta: TransactionListMeta;
}

// ── Error response ───────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
