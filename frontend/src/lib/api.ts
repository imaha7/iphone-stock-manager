import { IPhoneUnit, Purchase, Sale, AdditionalCost, DashboardSummary, ProfitPerUnit, AuthUser } from './types';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const iphones = {
  getAll(params?: Record<string, string>): Promise<IPhoneUnit[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<IPhoneUnit[]>(`/api/iphones${query}`);
  },

  getById(id: number): Promise<IPhoneUnit> {
    return fetchApi<IPhoneUnit>(`/api/iphones/${id}`);
  },

  create(data: Partial<IPhoneUnit>): Promise<IPhoneUnit> {
    return fetchApi<IPhoneUnit>('/api/iphones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<IPhoneUnit>): Promise<IPhoneUnit> {
    return fetchApi<IPhoneUnit>(`/api/iphones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return fetchApi<void>(`/api/iphones/${id}`, {
      method: 'DELETE',
    });
  },
};

export const purchases = {
  getAll(params?: Record<string, string>): Promise<Purchase[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Purchase[]>(`/api/purchases${query}`);
  },

  getById(id: number): Promise<Purchase> {
    return fetchApi<Purchase>(`/api/purchases/${id}`);
  },

  create(data: Record<string, unknown>): Promise<Purchase> {
    return fetchApi<Purchase>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Record<string, unknown>): Promise<Purchase> {
    return fetchApi<Purchase>(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return fetchApi<void>(`/api/purchases/${id}`, {
      method: 'DELETE',
    });
  },
};

export const sales = {
  getAll(params?: Record<string, string>): Promise<Sale[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Sale[]>(`/api/sales${query}`);
  },

  getById(id: number): Promise<Sale> {
    return fetchApi<Sale>(`/api/sales/${id}`);
  },

  create(data: Record<string, unknown>): Promise<Sale> {
    return fetchApi<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return fetchApi<void>(`/api/sales/${id}`, {
      method: 'DELETE',
    });
  },
};

export const costs = {
  getAll(params?: Record<string, string>): Promise<AdditionalCost[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<AdditionalCost[]>(`/api/costs${query}`);
  },

  create(data: Record<string, unknown>): Promise<AdditionalCost> {
    return fetchApi<AdditionalCost>('/api/costs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return fetchApi<void>(`/api/costs/${id}`, {
      method: 'DELETE',
    });
  },
};

export const dashboard = {
  getSummary(params?: Record<string, string>): Promise<DashboardSummary> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<DashboardSummary>(`/api/dashboard/summary${query}`);
  },

  getProfitPerUnit(params?: Record<string, string>): Promise<ProfitPerUnit[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<ProfitPerUnit[]>(`/api/dashboard/profit-per-unit${query}`);
  },
};

export const auth = {
  register(data: { name: string; email: string; password: string }): Promise<{ message: string; user: AuthUser }> {
    return fetchApi<{ message: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }): Promise<{ message: string; user: AuthUser }> {
    return fetchApi<{ message: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  me(): Promise<AuthUser> {
    return fetchApi<AuthUser>('/api/auth/me');
  },

  updateProfile(data: { name: string }): Promise<AuthUser> {
    return fetchApi<AuthUser>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout(): Promise<{ message: string }> {
    return fetchApi<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};
