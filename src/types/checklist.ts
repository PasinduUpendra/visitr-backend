// src/types/checklist.ts

export interface ChecklistItem {
  label: string;
  optional: boolean;
  notes?: string;
}

export interface VisaChecklistResponse {
  title: string;
  description?: string;
  items: ChecklistItem[];
}
