import { Ionicons } from "@expo/vector-icons";
import type { IncidentCategory, IncidentSeverity } from "../../api/incidents";

export const CATEGORIES: {
  value: IncidentCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "THEFT", label: "Theft", icon: "lock-open-outline" },
  { value: "ROADBLOCK", label: "Roadblock", icon: "remove-circle-outline" },
  { value: "TRAFFIC", label: "Traffic", icon: "car-outline" },
  { value: "RTA", label: "Accident", icon: "warning-outline" },
  { value: "FIRE", label: "Fire", icon: "flame-outline" },
  { value: "UTILITY_OUTAGE", label: "Utility", icon: "flash-outline" },
  { value: "OTHER_COMMUNITY", label: "Other", icon: "ellipsis-horizontal" },
];

export const SEVERITIES: {
  value: IncidentSeverity;
  label: string;
  description: string;
}[] = [
  { value: "LOW", label: "Low", description: "Minor situation" },
  { value: "MEDIUM", label: "Medium", description: "Needs attention" },
  { value: "HIGH", label: "High", description: "Significant danger" },
  { value: "CRITICAL", label: "Critical", description: "Immediate danger" },
];

export const STEPS = [
  { title: "Incident details", subtitle: "What happened?" },
  { title: "Location", subtitle: "Where did it happen?" },
  { title: "Evidence", subtitle: "Add photos or videos" },
  { title: "Review", subtitle: "Check before submitting" },
];
