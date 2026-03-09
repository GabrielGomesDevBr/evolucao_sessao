export type Patient = {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender?: string;
  phone: string;
  email: string;
  emergencyContact?: string;
  guardianName?: string;
  profession?: string;
  educationLevel?: string;
  intakeSource?: string;
  arrivalState?: string;
  arrivalNotes?: string;
  companionName?: string;
  previousPsychologicalCare?: string;
  demandSummary: string;
  careModality: string;
  careFrequency: string;
  treatmentGoals: string;
  allowPortalAccess?: boolean;
};

export type Appointment = {
  id: string;
  patientId?: string;
  title: string;
  patientName?: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED' | 'RESCHEDULED' | 'BLOCKED';
  colorToken: string;
  notes?: string;
};

export type Evolution = {
  id: string;
  patientId: string;
  serviceDate: string;
  sessionNumber: number;
  durationMinutes: number;
  summary: string;
  procedures: string;
  observations: string;
};

export type GeneratedDocument = {
  id: string;
  patientId: string;
  type: string;
  purpose: string;
  content: string;
  shared: boolean;
  createdAt: string;
};

export type RestrictedRecord = {
  id: string;
  patientId: string;
  category: string;
  content: string;
  sensitivity: 'NORMAL' | 'HIGH' | 'CRITICAL';
  createdAt: string;
};
