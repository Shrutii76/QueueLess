import { api } from "../api/axios";

export interface QRResolveResponse {
  success: boolean;
  message: string;
  data: {
    business: {
      id: string;
      name: string;
      category: string;
      address:
        | string
        | {
            street?: string;
            city?: string;
            state?: string;
            country?: string;
          };
    };
    service: {
      id: string;
      name: string;
      description?: string;
      duration?: number;
    };
    queue: {
      id: string | null;
      queueDate?: string;
      status?: string;
      estimatedServiceMinutes?: number;
      lastTokenNumber?: number;
      maxCapacity?: number;
      available: boolean;
      message?: string;
    };
  };
}

export interface JoinQueueResponse {
  success: boolean;
  message: string;
  data: {
    entry: {
      _id: string;
      tokenNumber: number;
      status: string;
      [key: string]: unknown;
    };
  };
}

export const qrService = {
  async resolve(code: string) {
    const response = await api.get<QRResolveResponse>(
      `/qr/${encodeURIComponent(code)}`,
    );

    return response.data.data;
  },

  async joinQueue(queueId: string) {
    const response = await api.post<JoinQueueResponse>(
      `/queues/${queueId}/entries`,
      {
        notes: "Joined through business QR code",
      },
    );

    return response.data.data.entry;
  },
};
