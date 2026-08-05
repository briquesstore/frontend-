import { apiClient } from '@/lib/api-client';

export interface CriticalActionListItem {
  id: string;
  userId: string;
  userPhone: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  actionType: string;
  targetId: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  processedAt: string | null;
  metadata: Record<string, any> | null;
}

export interface CancelActionRequest {
  notes: string;
}

class CriticalActionsApiService {
  async getCriticalActions(params?: { status?: string; pageSize?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    const query = queryParams.toString();
    const endpoint = `/admin/critical-actions${query ? `?${query}` : ''}`;
    return apiClient.get<CriticalActionListItem[]>(endpoint);
  }

  async getCriticalActionDetail(id: string) {
    return apiClient.get<CriticalActionListItem>(`/admin/critical-actions/${id}`);
  }

  async cancelCriticalAction(id: string, data: CancelActionRequest) {
    return apiClient.post<{ message: string }>(`/admin/critical-actions/${id}/cancel`, data);
  }
}

export const criticalActionsApiService = new CriticalActionsApiService();
