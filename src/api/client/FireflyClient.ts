import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { RegionConfig } from '../../../config/region';
import type { TransactionCreatePayload } from '../../shared/types/firefly';

export class FireflyClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(
    private readonly request: APIRequestContext,
    config: RegionConfig,
  ) {
    this.baseUrl = config.apiBaseUrl;
    this.headers = {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.api+json',
    };
  }

  async createTransaction(payload: TransactionCreatePayload): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/transactions`, {
      headers: this.headers,
      data: payload,
    });
  }

  async getTransactions(params: { type?: string; limit?: number } = {}): Promise<APIResponse> {
    const qs = new URLSearchParams();
    if (params.type !== undefined) qs.set('type', params.type);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request.get(`${this.baseUrl}/transactions${query}`, {
      headers: this.headers,
    });
  }

  async deleteTransaction(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/transactions/${id}`, {
      headers: this.headers,
    });
  }
}
