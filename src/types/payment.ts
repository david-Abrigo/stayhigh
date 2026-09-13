export type PrechargeStatus = 'WAITING' | 'MATCHED' | 'EXPIRED' | 'CANCELLED' | 'AMBIGUOUS';

export interface Precharge {
  id: string;
  public_id: string;
  expected_name: string;
  expected_amount: number;
  currency: string;
  description?: string | null;
  status: PrechargeStatus;
  created_at: string;
  expires_at?: string | null;
  matched_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreatePrechargeDTO {
  expected_name: string;
  expected_amount: number;
  currency?: string;
  description?: string;
}
