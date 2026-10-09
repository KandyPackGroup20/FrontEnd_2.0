export const ROSTER_READ_ROLES = ["DISPATCHER", "SUPERADMIN", "LOGISTICS_MGR"] as const;

export interface RosterSession {
  user_id: number;
  name: string;
  role: string;
  force_password_reset: boolean;
}

interface RosterMetadataBase {
  policy_confirmed: false;
  timezone: "Asia/Colombo";
}

export type RosterMetadata = RosterMetadataBase & (
  | {
    data_source: "dev-memory";
    policy_id: "kandypack-roster";
    volatile: true;
    fixture_week_start: string;
  }
  | {
    data_source: "mysql";
    policy_id: "pending-confirmation";
    volatile: false;
    fixture_week_start: null;
  }
);

export interface RosterRoute {
  route_id: number;
  station_id: string;
  route_name: string;
  max_duration_seconds: number;
}

export interface RosterTruck {
  truck_id: number;
  station_id: string | null;
  plate_number: string;
  is_active: boolean;
  capacity?: string | null;
  capacity_unit?: "KG" | null;
}

export interface StationStore {
  station_id: number;
  station_name: string;
  address: string;
}

export interface CargoItem {
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  ordered_quantity: number;
  allocated_quantity: number;
  received_quantity: number;
  wrong_destination: number;
  unit_weight_kg: string | null;
}

export interface CargoOrder {
  order_id: number;
  delivery_date: string;
  order_status: string;
  route_id: number;
  route_name: string;
  station_id: number;
  station_name: string;
  customer_name: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  assigned_roster_id: number | null;
  delivery_id: number | null;
  assigned_weight_kg: string | null;
  weight_kg: string;
  eligible: boolean;
  blocked_reasons: string[];
  items: CargoItem[];
}

export interface TruckSchedule {
  roster_id: number;
  route_id: number;
  station_id: number;
  station_name: string;
  route_name: string;
  truck_id: number;
  plate_number: string;
  capacity: string;
  capacity_unit: "KG" | null;
  is_active: boolean;
  driver_id: number;
  driver_name: string;
  assistant_id: number;
  assistant_name: string;
  start_time: string;
  end_time: string;
  status: string;
  order_count: number;
  unit_count: number;
  cargo_weight_kg: string;
}

export interface LoadingListData {
  schedule: TruckSchedule;
  orders: CargoOrder[];
  timezone: "Asia/Colombo";
}

export interface RosterStaff {
  staff_id: number;
  person_id: number;
  name: string;
  staff_type: "DRIVER" | "ASSISTANT";
}

export interface RosterCandidates {
  routes: RosterRoute[];
  trucks: RosterTruck[];
  drivers: RosterStaff[];
  assistants: RosterStaff[];
  meta: RosterMetadata;
}

export interface RosterAssignment {
  roster_id: number;
  route_id: number;
  truck_id: number;
  driver_id: number;
  assistant_id: number;
  dispatcher_id: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: "SCHEDULED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export interface RosterAssignments {
  assignments: RosterAssignment[];
  meta: RosterMetadata;
}

export interface RosterAssignmentRequest {
  route_id: number;
  truck_id: number;
  driver_id: number;
  assistant_id: number;
  start_time: string;
  end_time: string;
}

export interface RosterWriteMetadata {
  data_source: "mysql";
  policy_id: "kandypack-roster";
  policy_confirmed: false;
  timezone: "Asia/Colombo";
  volatile: false;
  fixture_week_start: null;
}

export interface RosterAssignmentCreated {
  status: "SUCCESS";
  message: string;
  result_code: "ROSTER_ASSIGNED" | "ROSTER_ASSIGNMENT_REPLAYED";
  assignment: RosterAssignment;
  meta: RosterWriteMetadata;
}

export interface RosterStaffHours {
  staff_id: number;
  staff_name?: string | null;
  staff_type: "DRIVER" | "ASSISTANT";
  scheduled_seconds: number;
  limit_seconds: number;
  remaining_seconds: number;
}

export interface RosterHours {
  week_start: string;
  week_end: string;
  hours: RosterStaffHours[];
  meta: RosterWriteMetadata;
}

export interface RosterAuditAttempt {
  audit_id: number;
  actor_id: number;
  actor_name: string | null;
  route_name?: string | null;
  station_id?: number | null;
  station_name?: string | null;
  plate_number?: string | null;
  driver_name?: string | null;
  assistant_name?: string | null;
  attempted_route_id: number;
  attempted_truck_id: number;
  attempted_driver_id: number;
  attempted_assistant_id: number;
  attempted_start_time: string;
  attempted_end_time: string;
  attempted_duration_seconds: number;
  outcome: "ACCEPTED";
  reason_code: null;
  policy_id: null;
  request_key: string;
  assignment_id: number;
  occurred_at: string;
  legacy: false;
}

export interface RosterAudit {
  attempts: RosterAuditAttempt[];
  meta: RosterWriteMetadata;
}

export function canReadRoster(role: string): boolean {
  return ROSTER_READ_ROLES.some((allowed) => allowed === role);
}

export function canAssignRoster(role: string): boolean {
  return role === "DISPATCHER" || role === "SUPERADMIN";
}
