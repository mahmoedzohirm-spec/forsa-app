export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_admin: boolean;
  is_banned?: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  number: number;
  status: "available" | "pending" | "sold";
  user_name?: string;
  user_phone?: string;
  contact_phone?: string;
  payment_method?: string;
  notes?: string;
  updated_at: string;
  user_id?: number;
  receipt_image?: string;
  booking_id?: number; // ✅ جديد
}

export interface PaymentMethod {
  id: number;
  name: string;
  iban?: string;
  bank_name?: string;
  account_holder?: string;
}

export interface Prize {
  id: number;
  tier: number;
  title: string;
  description?: string;
  image?: string;
}

export interface DrawTicket {
  number: number;
  user_name?: string;
  contact_phone?: string;
}

export interface DrawHistory {
  id: number;
  prize: string;
  ticket_number: number;
  winner_name?: string;
  winner_phone?: string;
  drawn_at: string;
}

export interface TicketCounts {
  total: string;
  available: string;
  pending: string;
  sold: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'winner' | 'status_change' | 'draw_announcement';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface AppSettings {
  site_name?: string;
  currency?: string;
  ticket_price?: string;
  max_tickets?: string;
}
