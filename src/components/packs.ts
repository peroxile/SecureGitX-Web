import client from './api';
import { fetchCsrf } from './api';

//  Types 

export interface RulePackOut {
  id:            string;
  name:          string;
  description:   string;
  stack:         string;
  version:       string;
  rule_count:    number;
  price_cents:   number;
  price_display: string;
  tags:          string[];
  is_free:       boolean;
  is_active:     boolean;
}

export interface LicenseOut {
  id:           string;
  pack_id:      string;
  pack_version: string;
  purchased_at: string;
  expires_at:   string | null;
  is_active:    boolean;
}

export interface DashboardStats {
  installed_packs: number;
  total_rules:     number;
  account_email:   string;
  member_since:    string;
}

export interface PurchaseResponse {
  license:       LicenseOut;
  license_token: string;
  message:       string;
}

//  API calls

export async function listPacks(stack?: string): Promise<RulePackOut[]> {
  const params = stack ? { stack } : {};
  const res = await client.get<{ packs: RulePackOut[] }>('/packs', { params });
  return res.data.packs;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await client.get<DashboardStats>('/dashboard/stats');
  return res.data;
}

export async function getMyLicenses(): Promise<LicenseOut[]> {
  const res = await client.get<LicenseOut[]>('/packs/my/licenses');
  return res.data;
}

export async function purchasePack(packId: string): Promise<PurchaseResponse> {
  await fetchCsrf();
  const res = await client.post<PurchaseResponse>(`/packs/${packId}/purchase`);
  return res.data;
}
