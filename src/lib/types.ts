export type UserRole = "comerciante" | "transportista" | "admin";
export type ApprovalStatus = "pendiente" | "aprobado" | "rechazado";
export type BookingStatus = "confirmado" | "cancelado";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  doc_number: string | null;
  business_name: string | null;
  business_type: string | null;
  status: ApprovalStatus;
  rejection_reason: string | null;
  created_at: string;
};

export type TimeSlot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  dock: number;
  capacity: number;
};

/** Fila devuelta por la función get_slot_availability. */
export type SlotAvailability = Omit<TimeSlot, "id"> & {
  slot_id: string;
  booked: number;
  available: number;
};

export type Booking = {
  id: string;
  slot_id: string;
  profile_id: string;
  plate: string;
  status: BookingStatus;
  created_at: string;
};
