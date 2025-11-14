export class BillingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:3001";
  }

  private getAuthHeaders() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async createCheckoutSession(
    tier: "PRO" | "PREMIUM",
    context: "onboarding" | "settings" = "settings"
  ) {
    const res = await fetch(
      `${this.baseUrl}/api/billing/create-checkout-session`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ tier, context }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data?.url as string;
  }

  async createPortalSession() {
    const res = await fetch(
      `${this.baseUrl}/api/billing/create-portal-session`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data?.url as string;
  }

  async getSubscription() {
    const res = await fetch(`${this.baseUrl}/api/billing/subscription`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data as Subscription | null;
  }

  async cleanupDuplicateSubscriptions() {
    const res = await fetch(`${this.baseUrl}/api/billing/cleanup-duplicates`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  async scheduleDowngrade() {
    const res = await fetch(`${this.baseUrl}/api/billing/downgrade`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data as {
      cancelAt: string | null;
      currentPeriodEnd: string | null;
      stripeStatus: string;
    };
  }

  async cancelScheduledDowngrade() {
    const res = await fetch(
      `${this.baseUrl}/api/billing/downgrade/cancel`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data as {
      cancelAt: string | null;
      stripeStatus: string;
      currentPeriodEnd?: string | null;
    };
  }
}

export interface Subscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  organizationId: string;
  productType: string;
  tier: string;
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "UNPAID" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const billingService = new BillingService();
