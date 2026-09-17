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
    policy_id: "demo-v1";
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
  policy_id: "demo-v1";
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

export function canReadRoster(role: string): boolean {
  return ROSTER_READ_ROLES.some((allowed) => allowed === role);
}

export function canAssignRoster(role: string): boolean {
  return role === "DISPATCHER" || role === "SUPERADMIN";
}
