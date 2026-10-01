export type WfhStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface WfhRequest {
  id: string;
  candidateId: string;
  requestDate: string;
  reason: string;
  supportingInfo: string;
  status: WfhStatus;
  reviewComment?: string;
}