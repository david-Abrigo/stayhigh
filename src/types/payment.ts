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
  metadata?: Record<string, unknown>;
  device_id?: string | null;
}
