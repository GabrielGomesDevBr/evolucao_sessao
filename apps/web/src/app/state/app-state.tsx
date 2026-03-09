import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Appointment, Evolution, GeneratedDocument, Patient, RestrictedRecord } from '../../lib/app-types';
import { apiRequest } from '../../lib/api';
import { useAuth } from './auth-state';

type ProfessionalProfile = {
  licenseCode: string;
  specialty?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  signatureAsset?: {
    id: string;
    fileName: string;
    storageKey: string;
  } | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type AssistantReply = {
  threadId: string;
  response: string;
};

type AppState = {
  patients: Patient[];
  appointments: Appointment[];
  evolutions: Evolution[];
  documents: GeneratedDocument[];
  restrictedRecords: RestrictedRecord[];
  professional: ProfessionalProfile | null;
  selectedPatientId: string;
  selectedPatient?: Patient;
  loading: boolean;
  pinVerified: boolean;
  setSelectedPatientId: (patientId: string) => void;
  refresh: () => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  addPatient: (patient: PatientInput) => Promise<void>;
  updatePatient: (id: string, patient: PatientInput) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addAppointment: (appointment: AppointmentInput) => Promise<void>;
  updateAppointment: (id: string, appointment: AppointmentInput) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addEvolution: (evolution: EvolutionInput) => Promise<void>;
  updateEvolution: (id: string, evolution: EvolutionInput) => Promise<void>;
  deleteEvolution: (id: string) => Promise<void>;
  addDocument: (document: DocumentInput) => Promise<void>;
  updateDocument: (id: string, document: DocumentInput) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addRestrictedRecord: (record: RestrictedRecordInput) => Promise<void>;
  updateRestrictedRecord: (id: string, record: RestrictedRecordInput) => Promise<void>;
  deleteRestrictedRecord: (id: string) => Promise<void>;
  updateProfessional: (input: ProfessionalInput) => Promise<void>;
  attachSignatureAsset: (file: File) => Promise<void>;
  sendAssistantMessage: (message: string, threadId?: string) => Promise<AssistantReply>;
};

type PatientInput = Omit<Patient, 'id'>;
type AppointmentInput = Omit<Appointment, 'id' | 'patientName'>;
type EvolutionInput = Omit<Evolution, 'id'>;
type DocumentInput = Omit<GeneratedDocument, 'id' | 'createdAt'>;
type RestrictedRecordInput = Omit<RestrictedRecord, 'id' | 'createdAt'>;
type ProfessionalInput = {
  licenseCode: string;
  specialty?: string;
  city?: string;
  state?: string;
  phone?: string;
};

type ApiPatient = {
  id: string;
  fullName: string;
  socialName?: string | null;
  cpf: string;
  birthDate: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyContact?: string | null;
  guardianName?: string | null;
  profession?: string | null;
  educationLevel?: string | null;
  intakeSource?: string | null;
  arrivalState?: string | null;
  arrivalNotes?: string | null;
  companionName?: string | null;
  previousPsychologicalCare?: string | null;
  demandSummary: string;
  careModality?: string | null;
  careFrequency?: string | null;
  treatmentGoals?: string | null;
  allowPortalAccess?: boolean | null;
};

type ApiAppointment = {
  id: string;
  patientId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  status: Appointment['status'];
  colorToken?: string | null;
  internalNotes?: string | null;
  patient?: { fullName: string } | null;
};

type ApiEvolution = {
  id: string;
  patientId: string;
  serviceDate: string;
  sessionNumber?: number | null;
  durationMinutes?: number | null;
  summary: string;
  procedures?: string | null;
  observations?: string | null;
};

type ApiDocument = {
  id: string;
  patientId: string;
  type: string;
  purpose: string;
  content: string;
  shareWithPortal: boolean;
  createdAt: string;
};

type ApiRestrictedRecord = {
  id: string;
  patientId: string;
  category?: string | null;
  content: string;
  sensitivity: RestrictedRecord['sensitivity'];
  recordDate: string;
};

const AppStateContext = createContext<AppState | null>(null);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

const normalizePatient = (patient: ApiPatient): Patient => ({
  id: patient.id,
  fullName: patient.fullName,
  socialName: patient.socialName ?? '',
  cpf: patient.cpf,
  birthDate: patient.birthDate,
  gender: patient.gender ?? '',
  phone: patient.phone ?? '',
  email: patient.email ?? '',
  emergencyContact: patient.emergencyContact ?? '',
  guardianName: patient.guardianName ?? '',
  profession: patient.profession ?? '',
  educationLevel: patient.educationLevel ?? '',
  intakeSource: patient.intakeSource ?? '',
  arrivalState: patient.arrivalState ?? '',
  arrivalNotes: patient.arrivalNotes ?? '',
  companionName: patient.companionName ?? '',
  previousPsychologicalCare: patient.previousPsychologicalCare ?? '',
  demandSummary: patient.demandSummary,
  careModality: patient.careModality ?? '',
  careFrequency: patient.careFrequency ?? '',
  treatmentGoals: patient.treatmentGoals ?? '',
  allowPortalAccess: patient.allowPortalAccess ?? false,
});

const normalizeAppointment = (appointment: ApiAppointment): Appointment => ({
  id: appointment.id,
  patientId: appointment.patientId ?? undefined,
  title: appointment.title,
  patientName: appointment.patient?.fullName ?? '',
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
  status: appointment.status,
  colorToken: appointment.colorToken ? `bg-${appointment.colorToken}` : 'bg-lagoon',
  notes: appointment.internalNotes ?? '',
});

const normalizeEvolution = (evolution: ApiEvolution): Evolution => ({
  id: evolution.id,
  patientId: evolution.patientId,
  serviceDate: evolution.serviceDate,
  sessionNumber: evolution.sessionNumber ?? 0,
  durationMinutes: evolution.durationMinutes ?? 50,
  summary: evolution.summary,
  procedures: evolution.procedures ?? '',
  observations: evolution.observations ?? '',
});

const normalizeDocument = (document: ApiDocument): GeneratedDocument => ({
  id: document.id,
  patientId: document.patientId,
  type: document.type,
  purpose: document.purpose,
  content: document.content,
  shared: document.shareWithPortal,
  createdAt: document.createdAt,
});

const normalizeRestrictedRecord = (record: ApiRestrictedRecord): RestrictedRecord => ({
  id: record.id,
  patientId: record.patientId,
  category: record.category ?? 'Sem categoria',
  content: record.content,
  sensitivity: record.sensitivity,
  createdAt: record.recordDate,
});

export function AppStateProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, token, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [restrictedRecords, setRestrictedRecords] = useState<RestrictedRecord[]>([]);
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinToken, setPinToken] = useState<string | null>(null);
  const pinVerified = Boolean(pinToken);

  const refresh = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [patientsData, appointmentsData, evolutionsData, documentsData, professionalData] = await Promise.all([
        apiRequest<ApiPatient[]>('/patients', {}, token),
        apiRequest<ApiAppointment[]>('/calendar', {}, token),
        apiRequest<ApiEvolution[]>('/sessions', {}, token),
        apiRequest<ApiDocument[]>('/documents', {}, token),
        apiRequest<ProfessionalProfile | null>('/professional/me', {}, token),
      ]);

      setPatients(patientsData.map(normalizePatient));
      setAppointments(appointmentsData.map(normalizeAppointment));
      setEvolutions(evolutionsData.map(normalizeEvolution));
      setDocuments(documentsData.map(normalizeDocument));
      setProfessional(professionalData);
      setSelectedPatientId((current) => current || patientsData[0]?.id || '');

      if (pinToken) {
        try {
          const restrictedRecordsData = await apiRequest<ApiRestrictedRecord[]>('/records', {}, token, pinToken);
          setRestrictedRecords(restrictedRecordsData.map(normalizeRestrictedRecord));
        } catch (error) {
          if ((error as { status?: number }).status === 423) {
            setPinToken(null);
            setRestrictedRecords([]);
          } else {
            throw error;
          }
        }
      } else {
        setRestrictedRecords([]);
      }
    } catch (error) {
      if (error instanceof Error && /401|403/.test(String((error as { status?: number }).status))) logout();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logout, pinToken, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPatients([]);
      setAppointments([]);
      setEvolutions([]);
      setDocuments([]);
      setRestrictedRecords([]);
      setProfessional(null);
      setSelectedPatientId('');
      setPinToken(null);
      return;
    }

    void refresh();
  }, [isAuthenticated, refresh]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? patients[0],
    [patients, selectedPatientId],
  );

  const value = useMemo<AppState>(
    () => ({
      patients,
      appointments,
      evolutions,
      documents,
      restrictedRecords,
      professional,
      selectedPatientId,
      selectedPatient,
      loading,
      pinVerified,
      setSelectedPatientId,
      refresh,
      verifyPin: async (pin: string) => {
        if (!token) return;
        const result = await apiRequest<{ pinToken: string }>('/auth/pin', { method: 'POST', body: JSON.stringify({ pin }) }, token);
        setPinToken(result.pinToken);
        const records = await apiRequest<ApiRestrictedRecord[]>('/records', {}, token, result.pinToken);
        setRestrictedRecords(records.map(normalizeRestrictedRecord));
      },
      clearPin: () => {
        setPinToken(null);
        setRestrictedRecords([]);
      },
      addPatient: async (patient) => {
        if (!token) return;
        const created = await apiRequest<ApiPatient>('/patients', {
          method: 'POST',
          body: JSON.stringify({
            fullName: patient.fullName,
            socialName: patient.socialName,
            birthDate: patient.birthDate,
            cpf: patient.cpf.replace(/\D/g, ''),
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            emergencyContact: patient.emergencyContact,
            guardianName: patient.guardianName,
            profession: patient.profession,
            educationLevel: patient.educationLevel,
            intakeSource: patient.intakeSource,
            arrivalState: patient.arrivalState,
            arrivalNotes: patient.arrivalNotes,
            companionName: patient.companionName,
            previousPsychologicalCare: patient.previousPsychologicalCare,
            demandSummary: patient.demandSummary,
            careModality: patient.careModality,
            careFrequency: patient.careFrequency,
            treatmentGoals: patient.treatmentGoals,
            allowPortalAccess: patient.allowPortalAccess,
          }),
        }, token);
        const normalized = normalizePatient(created);
        setPatients((current) => [normalized, ...current]);
        setSelectedPatientId(normalized.id);
      },
      updatePatient: async (id, patient) => {
        if (!token) return;
        const updated = await apiRequest<ApiPatient>(`/patients/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            fullName: patient.fullName,
            socialName: patient.socialName,
            birthDate: patient.birthDate,
            cpf: patient.cpf.replace(/\D/g, ''),
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            emergencyContact: patient.emergencyContact,
            guardianName: patient.guardianName,
            profession: patient.profession,
            educationLevel: patient.educationLevel,
            intakeSource: patient.intakeSource,
            arrivalState: patient.arrivalState,
            arrivalNotes: patient.arrivalNotes,
            companionName: patient.companionName,
            previousPsychologicalCare: patient.previousPsychologicalCare,
            demandSummary: patient.demandSummary,
            careModality: patient.careModality,
            careFrequency: patient.careFrequency,
            treatmentGoals: patient.treatmentGoals,
            allowPortalAccess: patient.allowPortalAccess,
          }),
        }, token);
        const normalized = normalizePatient(updated);
        setPatients((current) => current.map((item) => (item.id === id ? normalized : item)));
      },
      deletePatient: async (id) => {
        if (!token) return;
        await apiRequest(`/patients/${id}`, { method: 'DELETE' }, token);
        setPatients((current) => current.filter((item) => item.id !== id));
        setSelectedPatientId((current) => (current === id ? '' : current));
      },
      addAppointment: async (appointment) => {
        if (!token) return;
        const created = await apiRequest<ApiAppointment>('/calendar', {
          method: 'POST',
          body: JSON.stringify({
            patientId: appointment.patientId,
            title: appointment.title,
            startsAt: appointment.startsAt,
            endsAt: appointment.endsAt,
            status: appointment.status,
            colorToken: appointment.colorToken.replace('bg-', ''),
            internalNotes: appointment.notes,
          }),
        }, token);
        setAppointments((current) => [normalizeAppointment(created), ...current]);
      },
      updateAppointment: async (id, appointment) => {
        if (!token) return;
        const updated = await apiRequest<ApiAppointment>(`/calendar/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            patientId: appointment.patientId,
            title: appointment.title,
            startsAt: appointment.startsAt,
            endsAt: appointment.endsAt,
            status: appointment.status,
            colorToken: appointment.colorToken.replace('bg-', ''),
            internalNotes: appointment.notes,
          }),
        }, token);
        setAppointments((current) => current.map((item) => (item.id === id ? normalizeAppointment(updated) : item)));
      },
      deleteAppointment: async (id) => {
        if (!token) return;
        await apiRequest(`/calendar/${id}`, { method: 'DELETE' }, token);
        setAppointments((current) => current.filter((item) => item.id !== id));
      },
      addEvolution: async (evolution) => {
        if (!token) return;
        const created = await apiRequest<ApiEvolution>('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            patientId: evolution.patientId,
            serviceDate: evolution.serviceDate,
            sessionNumber: evolution.sessionNumber,
            durationMinutes: evolution.durationMinutes,
            summary: evolution.summary,
            procedures: evolution.procedures,
            observations: evolution.observations,
            format: 'IN_PERSON',
          }),
        }, token);
        setEvolutions((current) => [normalizeEvolution(created), ...current]);
      },
      updateEvolution: async (id, evolution) => {
        if (!token) return;
        const updated = await apiRequest<ApiEvolution>(`/sessions/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            patientId: evolution.patientId,
            serviceDate: evolution.serviceDate,
            sessionNumber: evolution.sessionNumber,
            durationMinutes: evolution.durationMinutes,
            summary: evolution.summary,
            procedures: evolution.procedures,
            observations: evolution.observations,
            format: 'IN_PERSON',
          }),
        }, token);
        setEvolutions((current) => current.map((item) => (item.id === id ? normalizeEvolution(updated) : item)));
      },
      deleteEvolution: async (id) => {
        if (!token) return;
        await apiRequest(`/sessions/${id}`, { method: 'DELETE' }, token);
        setEvolutions((current) => current.filter((item) => item.id !== id));
      },
      addDocument: async (document) => {
        if (!token) return;
        const created = await apiRequest<ApiDocument>('/documents', {
          method: 'POST',
          body: JSON.stringify({
            patientId: document.patientId,
            type: document.type,
            purpose: document.purpose,
            content: document.content,
            shareWithPortal: document.shared,
          }),
        }, token);
        setDocuments((current) => [normalizeDocument(created), ...current]);
      },
      updateDocument: async (id, document) => {
        if (!token) return;
        const updated = await apiRequest<ApiDocument>(`/documents/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            patientId: document.patientId,
            type: document.type,
            purpose: document.purpose,
            content: document.content,
            shareWithPortal: document.shared,
          }),
        }, token);
        setDocuments((current) => current.map((item) => (item.id === id ? normalizeDocument(updated) : item)));
      },
      deleteDocument: async (id) => {
        if (!token) return;
        await apiRequest(`/documents/${id}`, { method: 'DELETE' }, token);
        setDocuments((current) => current.filter((item) => item.id !== id));
      },
      addRestrictedRecord: async (record) => {
        if (!token || !pinToken) return;
        const created = await apiRequest<ApiRestrictedRecord>('/records', {
          method: 'POST',
          body: JSON.stringify({
            patientId: record.patientId,
            category: record.category,
            content: record.content,
            recordDate: new Date().toISOString(),
            sensitivity: record.sensitivity,
          }),
        }, token, pinToken);
        setRestrictedRecords((current) => [normalizeRestrictedRecord(created), ...current]);
      },
      updateRestrictedRecord: async (id, record) => {
        if (!token || !pinToken) return;
        const updated = await apiRequest<ApiRestrictedRecord>(`/records/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            patientId: record.patientId,
            category: record.category,
            content: record.content,
            recordDate: new Date().toISOString(),
            sensitivity: record.sensitivity,
          }),
        }, token, pinToken);
        setRestrictedRecords((current) => current.map((item) => (item.id === id ? normalizeRestrictedRecord(updated) : item)));
      },
      deleteRestrictedRecord: async (id) => {
        if (!token || !pinToken) return;
        await apiRequest(`/records/${id}`, { method: 'DELETE' }, token, pinToken);
        setRestrictedRecords((current) => current.filter((item) => item.id !== id));
      },
      updateProfessional: async (input) => {
        if (!token) return;
        const updated = await apiRequest<ProfessionalProfile>('/professional/me', {
          method: 'PUT',
          body: JSON.stringify(input),
        }, token);
        setProfessional(updated);
      },
      attachSignatureAsset: async (file) => {
        if (!token) return;
        const base64Data = await readFileAsDataUrl(file);
        const metadata = await apiRequest<{ id: string }>('/uploads/signature', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
          }),
        }, token);
        const updated = await apiRequest<ProfessionalProfile>('/professional/me/signature', {
          method: 'PUT',
          body: JSON.stringify({ signatureAssetId: metadata.id }),
        }, token);
        setProfessional(updated);
      },
      sendAssistantMessage: async (message, threadId) => {
        if (!token) throw new Error('Autenticação obrigatória.');
        return apiRequest<AssistantReply>('/assistant/chat', {
          method: 'POST',
          body: JSON.stringify({ message, threadId }),
        }, token);
      },
    }),
    [appointments, documents, evolutions, loading, patients, pinToken, pinVerified, professional, refresh, restrictedRecords, selectedPatient, selectedPatientId, token],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
