export type PrechargeStatus = 'WAITING' | 'MATCHED' | 'EXPIRED' | 'CANCELLED' | 'AMBIGUOUS';

export interface PrechargeMetadata {
  seller_message?: string | null;
  confirmation_message?: string | null;
  buyer_note?: string | null;
  [key: string]: unknown;
}

export interface Precharge {
  id: string;
  public_id: string;
  expected_name: string;
  expected_amount: number;
  currency: string;
  description?: string | null;
  seller_message?: string | null;
  confirmation_message?: string | null;
  concept?: string | null;
  payment_link_id?: string | null;
  status: PrechargeStatus;
  created_at: string;
  expires_at?: string | null;
  matched_at?: string | null;
  metadata?: PrechargeMetadata | null;
  device_id?: string | null;
}

export interface CreatePrechargeDTO {
  expected_name: string;
  expected_amount: number;
  currency?: string;
  description?: string;
  seller_message?: string;
  confirmation_message?: string;
  concept?: string;
  payment_link_id?: string | null;
  metadata?: Record<string, unknown>;
  device_id?: string | null;
}

export interface PaymentLink {
  id: string;
  code: string;
  device_id?: string | null;
  amount?: number | null;
  currency: string;
  concept?: string | null;
  seller_message?: string | null;
  confirmation_message?: string | null;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  is_single_use: boolean;
  views_count: number;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

