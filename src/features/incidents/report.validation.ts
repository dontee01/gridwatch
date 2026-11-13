import type { IncidentCategory } from "../../api/incidents";

interface ValidationState {
  step: number;
  category?: IncidentCategory;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
}

export function validateStep(state: ValidationState): {
  isValid: boolean;
  error: string;
} {
  const { step, category, title, description, latitude, longitude } = state;

  if (step === 0) {
    if (!category)
      return { isValid: false, error: "Please select an incident category." };
    if (!title.trim())
      return { isValid: false, error: "Please enter a title." };
    if (!description.trim())
      return { isValid: false, error: "Please describe what happened." };
  }

  if (step === 1) {
    if (latitude === undefined || longitude === undefined) {
      return {
        isValid: false,
        error: "Capture the incident location before continuing.",
      };
    }
  }

  return { isValid: true, error: "" };
}
