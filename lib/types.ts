export type CustomerStatus = 'lead' | 'customer';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  status: CustomerStatus;
  source: string | null;
  next_action_at: string | null;
  is_hot: boolean;
  note: string | null;
  created_at: string;
}
