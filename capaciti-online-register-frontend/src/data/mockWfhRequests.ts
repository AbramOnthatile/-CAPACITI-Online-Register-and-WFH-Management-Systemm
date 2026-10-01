import { WfhRequest } from "@/types/wfh";

export const mockWfhRequests: WfhRequest[] = [
  {
    id: "w1",
    candidateId: "u1",
    requestDate: "2026-10-05",
    reason: "Power outage in my area",
    supportingInfo: "Municipal outage schedule attached",
    status: "PENDING",
  },
];