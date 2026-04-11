import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Stethoscope, Activity, Pill, FlaskConical, Thermometer, Heart, Weight, Ruler, Wind, Loader2, Search, CheckCircle2, Plus, Clock, Upload, Calendar, FileText, XCircle, Edit, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const LAB_TESTS = [
  { id: 'malaria_rdt', name: 'Malaria RDT', category: 'Parasitology', description: 'Rapid diagnostic test for Plasmodium falciparum', price: 5000 },
  { id: 'malaria_bs', name: 'Malaria Blood Smear', category: 'Parasitology', description: 'Microscopic examination of blood for malaria parasites', price: 10000 },
  { 
    id: 'cbc', 
    name: 'Complete Blood Count (CBC)', 
    category: 'Hematology', 
    description: 'Measures red cells, white cells, and platelets', 
    price: 25000,
    parameters: [
      { id: 'wbc', name: 'WBC', unit: 'x10^9/L', range: '4.0 - 11.0' },
      { id: 'rbc', name: 'RBC', unit: 'x10^12/L', range: '4.5 - 5.5' },
      { id: 'hgb', name: 'Hemoglobin', unit: 'g/dL', range: '13.0 - 17.0' },
      { id: 'hct', name: 'Hematocrit', unit: '%', range: '40 - 50' },
      { id: 'mcv', name: 'MCV', unit: 'fL', range: '80 - 100' },
      { id: 'mch', name: 'MCH', unit: 'pg', range: '27 - 32' },
      { id: 'mchc', name: 'MCHC', unit: 'g/dL', range: '32 - 36' },
      { id: 'plt', name: 'Platelets', unit: 'x10^9/L', range: '150 - 450' },
    ]
  },
  { id: 'hiv_test', name: 'HIV Rapid Test', category: 'Serology', description: 'Screening for HIV-1 and HIV-2 antibodies', price: 0 },
  { id: 'urinalysis', name: 'Urinalysis', category: 'Biochemistry', description: 'Chemical and microscopic analysis of urine', price: 8000 },
  { id: 'blood_glucose', name: 'Random Blood Glucose', category: 'Biochemistry', description: 'Measures the amount of glucose in the blood', price: 5000 },
  { 
    id: 'lft', 
    name: 'Liver Function Tests (LFT)', 
    category: 'Biochemistry', 
    description: 'Group of tests to evaluate liver health', 
    price: 45000,
    parameters: [
      { id: 'alt', name: 'ALT', unit: 'U/L', range: '7 - 56' },
      { id: 'ast', name: 'AST', unit: 'U/L', range: '10 - 40' },
      { id: 'alp', name: 'ALP', unit: 'U/L', range: '44 - 147' },
      { id: 'bilirubin_total', name: 'Total Bilirubin', unit: 'mg/dL', range: '0.1 - 1.2' },
      { id: 'albumin', name: 'Albumin', unit: 'g/dL', range: '3.4 - 5.4' },
    ]
  },
  { 
    id: 'rft', 
    name: 'Renal Function Tests (RFT)', 
    category: 'Biochemistry', 
    description: 'Evaluates kidney function (Urea, Creatinine)', 
    price: 40000,
    parameters: [
      { id: 'urea', name: 'Urea', unit: 'mg/dL', range: '7 - 20' },
      { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', range: '0.6 - 1.2' },
      { id: 'sodium', name: 'Sodium', unit: 'mEq/L', range: '135 - 145' },
      { id: 'potassium', name: 'Potassium', unit: 'mEq/L', range: '3.5 - 5.0' },
    ]
  },
  { id: 'sputum_afb', name: 'Sputum for AFB (TB)', category: 'Microbiology', description: 'Test for Acid-Fast Bacilli to detect Tuberculosis', price: 0 },
  { id: 'syphilis', name: 'Syphilis (VDRL/RPR)', category: 'Serology', description: 'Nonspecific screening test for syphilis', price: 7000 },
];

const IMAGING_TESTS = [
  { id: 'ultrasound_abdomen', name: 'Ultrasound Abdomen', category: 'Ultrasound', price: 50000 },
  { id: 'ultrasound_pelvis', name: 'Ultrasound Pelvis', category: 'Ultrasound', price: 45000 },
  { id: 'ultrasound_scrotal', name: 'Scrotal Ultrasound scan', category: 'Ultrasound', price: 45000 },
  { id: 'ultrasound_obstetric', name: 'Ultrasound Obstetric', category: 'Ultrasound', price: 40000 },
  { id: 'ultrasound_thyroid', name: 'Ultrasound Thyroid', category: 'Ultrasound', price: 40000 },
  { id: 'ultrasound_breast', name: 'Ultrasound Breast', category: 'Ultrasound', price: 45000 },
  { id: 'ultrasound_doppler_limb', name: 'Doppler Ultrasound (Limb)', category: 'Ultrasound', price: 80000 },
  { id: 'xray_chest', name: 'X-Ray Chest', category: 'X-Ray', price: 30000 },
  { id: 'xray_limb', name: 'X-Ray Limb', category: 'X-Ray', price: 25000 },
  { id: 'xray_spine', name: 'X-Ray Spine', category: 'X-Ray', price: 40000 },
  { id: 'xray_skull', name: 'X-Ray Skull', category: 'X-Ray', price: 35000 },
  { id: 'xray_pelvis', name: 'X-Ray Pelvis', category: 'X-Ray', price: 35000 },
  { id: 'xray_dental', name: 'Dental X-Ray (OPG)', category: 'X-Ray', price: 50000 },
  { id: 'ct_brain', name: 'CT Scan Brain', category: 'CT-Scan', price: 250000 },
  { id: 'ct_abdomen', name: 'CT Scan Abdomen', category: 'CT-Scan', price: 350000 },
  { id: 'ct_chest', name: 'CT Scan Chest', category: 'CT-Scan', price: 300000 },
  { id: 'ct_pelvis', name: 'CT Scan Pelvis', category: 'CT-Scan', price: 300000 },
  { id: 'ct_angiography', name: 'CT Angiography', category: 'CT-Scan', price: 450000 },
  { id: 'mri_brain', name: 'MRI Brain', category: 'MRI', price: 600000 },
  { id: 'mri_spine', name: 'MRI Spine', category: 'MRI', price: 750000 },
  { id: 'mri_knee', name: 'MRI Knee', category: 'MRI', price: 650000 },
  { id: 'mri_abdomen', name: 'MRI Abdomen', category: 'MRI', price: 850000 },
  { id: 'mri_prostate', name: 'MRI Prostate', category: 'MRI', price: 900000 },
];

const ICD10_CODES = [
  { code: 'A00', name: 'Cholera' },
  { code: 'A01', name: 'Typhoid and paratyphoid fevers' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'A15', name: 'Respiratory tuberculosis' },
  { code: 'A53', name: 'Other and unspecified syphilis' },
  { code: 'B20', name: 'Human immunodeficiency virus [HIV] disease' },
  { code: 'B50', name: 'Plasmodium falciparum malaria' },
  { code: 'B54', name: 'Unspecified malaria' },
  { code: 'E11', name: 'Type 2 diabetes mellitus' },
  { code: 'I10', name: 'Essential (primary) hypertension' },
  { code: 'J06', name: 'Acute upper respiratory infections of multiple and unspecified sites' },
  { code: 'J18', name: 'Pneumonia, unspecified organism' },
  { code: 'J45', name: 'Asthma' },
  { code: 'K29', name: 'Gastritis and duodenitis' },
  { code: 'L03', name: 'Cellulitis' },
  { code: 'N39', name: 'Other disorders of urinary system (UTI)' },
  { code: 'R50', name: 'Fever of other and unknown origin' },
];

const MEDICATIONS = [
  { id: 'paracetamol', name: 'Paracetamol', dosage: '500mg', category: 'Analgesics' },
  { id: 'amoxicillin', name: 'Amoxicillin', dosage: '500mg', category: 'Antibiotics' },
  { id: 'artemether_lumefantrine', name: 'Artemether + Lumefantrine (AL)', dosage: '20/120mg', category: 'Antimalarials' },
  { id: 'metronidazole', name: 'Metronidazole', dosage: '400mg', category: 'Antibiotics' },
  { id: 'ciprofloxacin', name: 'Ciprofloxacin', dosage: '500mg', category: 'Antibiotics' },
  { id: 'salbutamol', name: 'Salbutamol', dosage: '2mg', category: 'Respiratory' },
  { id: 'omeprazole', name: 'Omeprazole', dosage: '20mg', category: 'Gastrointestinal' },
  { id: 'amlodipine', name: 'Amlodipine', dosage: '5mg', category: 'Cardiovascular' },
  { id: 'metformin', name: 'Metformin', dosage: '500mg', category: 'Antidiabetics' },
  { id: 'cetirizine', name: 'Cetirizine', dosage: '10mg', category: 'Antihistamines' },
  { id: 'catheter_14', name: 'Foley Catheter', dosage: 'Size 14', category: 'Sundries' },
  { id: 'catheter_16', name: 'Foley Catheter', dosage: 'Size 16', category: 'Sundries' },
  { id: 'gloves_latex', name: 'Surgical Gloves', dosage: 'Latex (Medium)', category: 'Supplies' },
  { id: 'gloves_nitrile', name: 'Examination Gloves', dosage: 'Nitrile (Large)', category: 'Supplies' },
  { id: 'cannula_g20', name: 'IV Cannula', dosage: 'G20 (Pink)', category: 'Supplies' },
  { id: 'cannula_g22', name: 'IV Cannula', dosage: 'G22 (Blue)', category: 'Supplies' },
  { id: 'syringe_5ml', name: 'Disposable Syringe', dosage: '5ml', category: 'Supplies' },
  { id: 'gauze_roll', name: 'Gauze Roll', dosage: '10cm x 3m', category: 'Sundries' },
];

const vitalsSchema = z.object({
  temperature: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().min(34, "Min 34°C").max(43, "Max 43°C").optional()),
  blood_pressure: z.preprocess((val) => (val === "" ? undefined : val), z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: SYS/DIA (e.g. 120/80)").optional()),
  pulse: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(30, "Min 30 bpm").max(200, "Max 200 bpm").optional()),
  spo2: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(50, "Min 50%").max(100, "Max 100%").optional()),
  weight: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().positive("Must be positive").optional()),
  height: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().positive("Must be positive").optional()),
});

const consultationVitalsSchema = z.object({
  temperature: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().min(34, "Min 34°C").max(43, "Max 43°C").optional()),
  blood_pressure: z.preprocess((val) => (val === "" ? undefined : val), z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: SYS/DIA (e.g. 120/80)").optional()),
  pulse: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(30, "Min 30 bpm").max(200, "Max 200 bpm").optional()),
  spo2: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().int().min(50, "Min 50%").max(100, "Max 100%").optional()),
  weight: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().positive("Must be positive").optional()),
  height: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().positive("Must be positive").optional()),
});

type VitalsValues = z.infer<typeof vitalsSchema>;

const VitalsForm = ({ appt, onComplete }: { appt: any, onComplete: () => void }) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<VitalsValues>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      temperature: 36.5,
      pulse: 72,
      spo2: 98,
    }
  });

  const onSubmit = async (data: VitalsValues) => {
    setLoading(true);
    try {
      await axios.post('/api/vitals', {
        ...data,
        appointment_id: Number(appt.id),
        patient_id: appt.patient_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vitals saved successfully');
      onComplete();
    } catch (err) {
      toast.error('Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form key={appt.id} onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="temperature" className={cn(errors.temperature && "text-destructive")}>
            Temperature (°C)
          </Label>
          <div className="relative">
            <Thermometer className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="temperature" 
              type="number" 
              step="0.1" 
              className={cn("pl-8", errors.temperature && "border-destructive focus-visible:ring-destructive")} 
              placeholder="36.5" 
              {...register('temperature')}
            />
          </div>
          {errors.temperature && <p className="text-[10px] font-medium text-destructive">{errors.temperature.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="blood_pressure" className={cn(errors.blood_pressure && "text-destructive")}>
            Blood Pressure (mmHg)
          </Label>
          <div className="relative">
            <Activity className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="blood_pressure" 
              className={cn("pl-8", errors.blood_pressure && "border-destructive focus-visible:ring-destructive")} 
              placeholder="120/80" 
              {...register('blood_pressure')}
            />
          </div>
          {errors.blood_pressure && <p className="text-[10px] font-medium text-destructive">{errors.blood_pressure.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pulse" className={cn(errors.pulse && "text-destructive")}>
            Pulse Rate (bpm)
          </Label>
          <div className="relative">
            <Heart className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="pulse" 
              type="number" 
              className={cn("pl-8", errors.pulse && "border-destructive focus-visible:ring-destructive")} 
              placeholder="72" 
              {...register('pulse')}
            />
          </div>
          {errors.pulse && <p className="text-[10px] font-medium text-destructive">{errors.pulse.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="spo2" className={cn(errors.spo2 && "text-destructive")}>
            Oxygen Saturation (%)
          </Label>
          <div className="relative">
            <Wind className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="spo2" 
              type="number" 
              className={cn("pl-8", errors.spo2 && "border-destructive focus-visible:ring-destructive")} 
              placeholder="98" 
              {...register('spo2')}
            />
          </div>
          {errors.spo2 && <p className="text-[10px] font-medium text-destructive">{errors.spo2.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className={cn(errors.weight && "text-destructive")}>
            Weight (kg)
          </Label>
          <div className="relative">
            <Weight className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="weight" 
              type="number" 
              step="0.1" 
              className={cn("pl-8", errors.weight && "border-destructive focus-visible:ring-destructive")} 
              placeholder="70.0" 
              {...register('weight')}
            />
          </div>
          {errors.weight && <p className="text-[10px] font-medium text-destructive">{errors.weight.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height" className={cn(errors.height && "text-destructive")}>
            Height (cm)
          </Label>
          <div className="relative">
            <Ruler className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="height" 
              type="number" 
              className={cn("pl-8", errors.height && "border-destructive focus-visible:ring-destructive")} 
              placeholder="170" 
              {...register('height')}
            />
          </div>
          {errors.height && <p className="text-[10px] font-medium text-destructive">{errors.height.message}</p>}
        </div>
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Vitals & Proceed to Consultation
      </Button>
    </form>
  );
};

const ConsultationForm = ({ appt, onComplete }: { appt: any, onComplete: () => void }) => {
  const [vitals, setVitals] = useState<any>(null);
  const [encounter, setEncounter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedImaging, setSelectedImaging] = useState<string[]>([]);
  const [selectedICD10, setSelectedICD10] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labSearch, setLabSearch] = useState('');
  const [imagingSearch, setImagingSearch] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [icdSearch, setIcdSearch] = useState('');
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);
  const [isICDModalOpen, setIsICDModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPharmacySending, setIsPharmacySending] = useState(false);
  const [isPharmacySent, setIsPharmacySent] = useState(false);
  const [selectedImagingForReport, setSelectedImagingForReport] = useState<any>(null);
  const [currentMed, setCurrentMed] = useState<any>(null);
  const [recentImaging, setRecentImaging] = useState<any[]>([]);
  const [recentLabs, setRecentLabs] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);
  const [prescValues, setPrescValues] = useState({ dose: 1, frequency: 3, duration: 5, dosage: '', instructions: '', quantity: 15, medication_name: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pastEncounters, setPastEncounters] = useState<any[]>([]);
  const [isPastEncountersModalOpen, setIsPastEncountersModalOpen] = useState(false);
  const [selectedPastEncounter, setSelectedPastEncounter] = useState<any>(null);
  const { token, user } = useAuthStore();

  const fetchRecentImaging = async () => {
    try {
      const res = await axios.get('/api/imaging/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for this patient
      const data = Array.isArray(res.data) ? res.data : [];
      setRecentImaging(data.filter((o: any) => o.patient_id === appt.patient_id));
    } catch (err) {
      console.error('Failed to fetch recent imaging', err);
    }
  };

  const fetchRecentPrescriptions = async () => {
    try {
      const res = await axios.get('/api/pharmacy/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for this patient
      const data = Array.isArray(res.data) ? res.data : [];
      setRecentPrescriptions(data.filter((p: any) => p.patient_id === appt.patient_id));
    } catch (err) {
      console.error('Failed to fetch recent prescriptions', err);
    }
  };

  const fetchPastEncounters = async () => {
    try {
      const res = await axios.get(`/api/encounters/${appt.patient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      // Filter for this patient and exclude the current appointment's encounter
      setPastEncounters(data.filter((e: any) => e.appointment_id !== appt.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error('Failed to fetch past encounters', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/pharmacy/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Vitals
        const vitalsRes = await axios.get(`/api/vitals/${appt.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (vitalsRes.data && vitalsRes.data.length > 0) {
          setVitals(vitalsRes.data[vitalsRes.data.length - 1]);
        }

        // Fetch Encounter if COMPLETED
        if (appt.status === 'COMPLETED') {
          const encounterRes = await axios.get(`/api/encounters/appointment/${appt.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (encounterRes.data) {
            const enc = encounterRes.data;
            setEncounter(enc);
            setSelectedLabs(enc.ordered_labs || []);
            setSelectedImaging((enc.ordered_imaging || []).map((img: any) => typeof img === 'string' ? img : img.id));
            setSelectedICD10(enc.icd10_codes || []);
            setPrescriptions(enc.prescriptions || []);
            setNotes(enc.notes || '');
            setDiagnosisText(enc.diagnosis || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch consultation data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchRecentImaging();
    fetchRecentLabs();
    fetchRecentPrescriptions();
    fetchInventory();
    fetchPastEncounters();
  }, [appt.id, appt.patient_id, appt.status, token]);

  const fetchRecentLabs = async () => {
    try {
      const res = await axios.get('/api/lab/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for this patient
      const data = Array.isArray(res.data) ? res.data : [];
      setRecentLabs(data.filter((o: any) => o.patient_id === appt.patient_id));
    } catch (err) {
      console.error('Failed to fetch recent labs', err);
    }
  };

  const updateImagingStatus = async (encounterId: number, status: string) => {
    try {
      await axios.patch(`/api/imaging/orders/${encounterId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Imaging status updated to ${status}`);
      fetchRecentImaging();
    } catch (err) {
      toast.error('Failed to update imaging status');
    }
  };

  const handleAttachReport = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const findingsStr = String(data.findings);
      await axios.post('/api/imaging/results', {
        ...data,
        encounter_id: selectedImagingForReport.encounter_id,
        imaging_id: selectedImagingForReport.imaging_id,
        result_text: findingsStr.substring(0, 50) + (findingsStr.length > 50 ? '...' : ''),
        file_name: 'report_' + Date.now() + '.pdf' // Simulated file upload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Also update status to REPORTED
      await axios.patch(`/api/imaging/orders/${selectedImagingForReport.encounter_id}/status`, { 
        status: 'REPORTED' 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Imaging report attached successfully');
      setIsReportModalOpen(false);
      setSelectedImagingForReport(null);
      fetchRecentImaging();
    } catch (err) {
      toast.error('Failed to attach imaging report');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validation
    const validation = consultationVitalsSchema.safeParse({
      temperature: data.temperature,
      blood_pressure: data.blood_pressure,
      pulse: data.pulse,
      spo2: data.spo2,
      weight: data.weight,
      height: data.height,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    try {
      if (encounter) {
        // Update existing encounter
        await axios.patch(`/api/encounters/${encounter.id}`, {
          ...data,
          notes,
          ordered_labs: selectedLabs,
          ordered_imaging: selectedImaging.map(id => IMAGING_TESTS.find(t => t.id === id)),
          icd10_codes: selectedICD10,
          prescriptions: prescriptions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Consultation updated successfully');
      } else {
        // Create new encounter
        await axios.post('/api/encounters', {
          ...data,
          notes,
          appointment_id: appt.id,
          patient_id: appt.patient_id,
          doctor_id: user?.id,
          ordered_labs: selectedLabs,
          ordered_imaging: selectedImaging.map(id => IMAGING_TESTS.find(t => t.id === id)),
          icd10_codes: selectedICD10,
          prescriptions: prescriptions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Consultation completed');
      }
      onComplete();
    } catch (err) {
      toast.error(encounter ? 'Failed to update consultation' : 'Failed to save consultation');
    }
  };

  const toggleLab = (testId: string) => {
    setSelectedLabs(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const toggleImaging = (testId: string) => {
    setSelectedImaging(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const toggleICD10 = (code: string) => {
    setSelectedICD10(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code) 
        : [...prev, code]
    );
  };

  const addPrescription = (e: any) => {
    e.preventDefault();
    const { dosage, instructions, quantity, medication_name } = prescValues;

    if (!medication_name && !currentMed) {
      toast.error('Please specify medication name');
      return;
    }

    if (!dosage) {
      toast.error('Please specify strength');
      return;
    }

    // Validate against inventory stock if it's an existing medication
    const medNameToCheck = currentMed?.name || medication_name;
    const inventoryItems = inventory.filter(item => item.name.toLowerCase() === medNameToCheck.toLowerCase());
    
    if (inventoryItems.length > 0) {
      const totalStock = inventoryItems.reduce((sum, item) => sum + item.stock, 0);
      if (quantity > totalStock) {
        toast.error(`Cannot prescribe ${quantity}. Only ${totalStock} ${inventoryItems[0].unit || 'units'} available in pharmacy.`);
        return;
      }
    } else {
      // If not in inventory, maybe warn but allow? Or just allow.
      // We will allow it but maybe show a warning.
      toast.warning(`"${medNameToCheck}" is not in pharmacy inventory. Patient may need to buy it externally.`);
    }
    
    const prescData = {
      dose: prescValues.dose,
      frequency: prescValues.frequency,
      duration: prescValues.duration,
      quantity: quantity,
      dosage,
      instructions,
      medication_id: currentMed?.id || 'custom_' + Date.now(),
      medication_name: medNameToCheck
    };

    setPrescriptions(prev => {
      if (editingIndex !== null) {
        const newPresc = [...prev];
        newPresc[editingIndex] = prescData;
        return newPresc;
      }
      return [...prev, prescData];
    });
    
    setIsMedModalOpen(false);
    setCurrentMed(null);
    setEditingIndex(null);
    setIsPharmacySent(false);
    toast.success(editingIndex !== null ? 'Prescription updated' : 'Medication added to prescription');
  };

  const editPrescription = (index: number) => {
    const p = prescriptions[index];
    const med = MEDICATIONS.find(m => m.id === p.medication_id);
    setCurrentMed(med || null);
    setPrescValues({
      dose: p.dose,
      frequency: p.frequency,
      duration: p.duration,
      dosage: p.dosage,
      instructions: p.instructions,
      quantity: p.quantity,
      medication_name: p.medication_name
    });
    setEditingIndex(index);
    setIsMedModalOpen(true);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
    setIsPharmacySent(false);
  };

  const sendToPharmacy = async () => {
    if (prescriptions.length === 0) {
      toast.error('No medications prescribed to send');
      return;
    }

    if (!encounter && !appt.id) {
      toast.error('Please save the consultation first');
      return;
    }
    
    setIsPharmacySending(true);
    try {
      await axios.post('/api/pharmacy/prescriptions', {
        encounter_id: encounter?.id || null,
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        items: prescriptions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Prescription sent to Pharmacy successfully');
      setIsPharmacySent(true);
    } catch (err) {
      toast.error('Failed to send prescription to Pharmacy');
    } finally {
      setIsPharmacySending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Retrieving triage data...</p>
      </div>
    );
  }

  return (
    <form key={`${appt.id}-${vitals?.id || 'no-vitals'}-${encounter?.id || 'no-encounter'}`} onSubmit={handleSubmit} className="space-y-6 py-4">
      {pastEncounters.length > 0 && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <FileText className="w-5 h-5" />
                <h3>Past Consultations</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEncounters.slice(0, 3).map((enc: any) => (
                <Card key={enc.id} className="bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => {
                  setSelectedPastEncounter(enc);
                  setIsPastEncountersModalOpen(true);
                }}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{new Date(enc.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {enc.diagnosis ? 'Diagnosed' : 'Follow-up'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {enc.symptoms || 'No symptoms recorded'}
                    </p>
                    {enc.diagnosis && (
                      <p className="text-xs font-medium line-clamp-1">
                        Dx: {enc.diagnosis}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {pastEncounters.length > 3 && (
              <Button variant="link" className="px-0 text-sm" onClick={() => setIsPastEncountersModalOpen(true)}>
                View all {pastEncounters.length} past consultations
              </Button>
            )}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Activity className="w-5 h-5" />
            <h3>Patient Vitals</h3>
          </div>
          {vitals && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Pre-populated from Triage
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-muted-foreground" />
              Temp (°C)
            </Label>
            <Input name="temperature" type="number" step="0.1" min="34" max="43" placeholder="36.5" defaultValue={encounter?.temperature || vitals?.temperature} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              BP (mmHg)
            </Label>
            <Input name="blood_pressure" placeholder="120/80" defaultValue={encounter?.blood_pressure || vitals?.blood_pressure} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Pulse (bpm)
            </Label>
            <Input name="pulse" type="number" min="30" max="200" placeholder="72" defaultValue={encounter?.pulse || vitals?.pulse} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-muted-foreground" />
              Weight (kg)
            </Label>
            <Input name="weight" type="number" step="0.1" placeholder="70.0" defaultValue={encounter?.weight || vitals?.weight} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              Height (cm)
            </Label>
            <Input name="height" type="number" placeholder="170" defaultValue={encounter?.height || vitals?.height} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-muted-foreground" />
              Oxygen Saturation (SpO2 %)
            </Label>
            <Input name="spo2" type="number" min="50" max="100" placeholder="98" defaultValue={encounter?.spo2 || vitals?.spo2} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Stethoscope className="w-5 h-5" />
          <h3>Clinical Assessment</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="font-semibold">Symptoms</Label>
            <Textarea name="symptoms" placeholder="Describe symptoms..." required className="min-h-[120px] bg-muted/20" defaultValue={encounter?.symptoms} />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Diagnosis</Label>
            <div className="space-y-3">
              <div className="relative">
                <Textarea 
                  name="diagnosis" 
                  placeholder="Enter diagnosis description or search ICD-10 (separate multiple with commas or newlines)..." 
                  required 
                  className="min-h-[80px] bg-muted/20" 
                  value={diagnosisText}
                  onChange={(e) => {
                    setDiagnosisText(e.target.value);
                    setIsDiagnosisOpen(true);
                  }}
                  onFocus={() => setIsDiagnosisOpen(true)}
                  onBlur={() => setTimeout(() => setIsDiagnosisOpen(false), 200)}
                />
                {isDiagnosisOpen && diagnosisText && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                    {(() => {
                      const lastSeparator = Math.max(diagnosisText.lastIndexOf(','), diagnosisText.lastIndexOf('\n'));
                      const searchTerm = diagnosisText.substring(lastSeparator + 1).trim().toLowerCase();
                      
                      if (!searchTerm) return null;

                      const filteredCodes = ICD10_CODES.filter(item => 
                        item.name.toLowerCase().includes(searchTerm) || 
                        item.code.toLowerCase().includes(searchTerm)
                      );

                      if (filteredCodes.length === 0) {
                        return <div className="px-3 py-2 text-sm text-muted-foreground">No matching ICD-10 codes found.</div>;
                      }

                      return filteredCodes.map(item => (
                        <div 
                          key={item.code}
                          className="px-3 py-2 cursor-pointer hover:bg-accent text-sm flex flex-col"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            const prefix = lastSeparator !== -1 ? diagnosisText.substring(0, lastSeparator + 1) + ' ' : '';
                            setDiagnosisText(prefix + `${item.code} - ${item.name}`);
                            if (!selectedICD10.includes(item.code)) {
                              setSelectedICD10([...selectedICD10, item.code]);
                            }
                            setIsDiagnosisOpen(false);
                          }}
                        >
                          <span className="font-bold text-primary">{item.code}</span>
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/10">
                {selectedICD10.length === 0 && <span className="text-xs text-muted-foreground italic">No ICD-10 codes added</span>}
                {selectedICD10.map(code => (
                  <Badge key={code} variant="secondary" className="gap-1 px-2 py-1">
                    <span className="font-bold text-primary">{code}</span>
                    <span className="max-w-[150px] truncate">{ICD10_CODES.find(i => i.code === code)?.name}</span>
                    <button type="button" onClick={() => toggleICD10(code)} className="ml-1 hover:text-destructive text-lg">×</button>
                  </Badge>
                ))}
                
                <Popover open={isICDModalOpen} onOpenChange={setIsICDModalOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] gap-1 border-dashed">
                      <Plus className="w-3 h-3" /> Add ICD-10
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search ICD-10 codes..." />
                      <CommandList>
                        <CommandEmpty>No ICD-10 codes found.</CommandEmpty>
                        <CommandGroup heading="Common ICD-10 Codes">
                          {ICD10_CODES.map((item) => (
                            <CommandItem
                              key={item.code}
                              onSelect={() => {
                                toggleICD10(item.code);
                              }}
                              className="flex items-center justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-primary">{item.code}</span>
                                <span className="text-xs text-muted-foreground">{item.name}</span>
                              </div>
                              {selectedICD10.includes(item.code) && (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">Clinical Notes</Label>
          <div className="bg-white rounded-md border">
            <ReactQuill 
              theme="snow" 
              value={notes} 
              onChange={setNotes}
              placeholder="Additional notes, history, etc..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ],
              }}
              className="min-h-[150px]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FlaskConical className="w-5 h-5" />
            <h3>Laboratory Orders</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Total Lab Fees: </span>
            <Badge variant="secondary" className="text-primary font-bold">
              {LAB_TESTS
                .filter(t => selectedLabs.includes(t.id))
                .reduce((sum, t) => sum + t.price, 0)
                .toLocaleString()} UGX
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Search & Add Lab Tests</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search CBC, Malaria, HIV, Urinalysis..."
              className="pl-8"
              value={labSearch}
              onChange={(e) => setLabSearch(e.target.value)}
            />
            {labSearch && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                {LAB_TESTS.filter(t => 
                  t.name.toLowerCase().includes(labSearch.toLowerCase()) || 
                  t.category.toLowerCase().includes(labSearch.toLowerCase())
                ).map(test => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => {
                      toggleLab(test.id);
                      setLabSearch('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{test.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{test.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {test.price === 0 ? 'FREE' : `${test.price.toLocaleString()} UGX`}
                      </span>
                      {selectedLabs.includes(test.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Select Common Tests</Label>
          <div className="flex flex-wrap gap-2">
            {LAB_TESTS.slice(0, 8).map(test => {
              const isSelected = selectedLabs.includes(test.id);
              return (
                <Badge
                  key={test.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90 transition-colors py-1.5 px-3 gap-2"
                  onClick={() => toggleLab(test.id)}
                >
                  {test.name}
                  <span className="opacity-70 text-[10px]">({test.price === 0 ? 'FREE' : `${test.price.toLocaleString()} UGX`})</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        </div>

        {selectedLabs.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="h-9 text-[11px] uppercase">Test Name</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Description</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Price</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLabs.map((labId) => {
                  const test = LAB_TESTS.find(t => t.id === labId);
                  if (!test) return null;
                  return (
                    <TableRow key={labId}>
                      <TableCell className="py-2 font-medium">
                        <div className="flex flex-col">
                          <span>{test.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{test.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground max-w-[300px] truncate" title={test.description}>
                        {test.description}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        {test.price === 0 ? 'FREE' : `${test.price.toLocaleString()} UGX`}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => toggleLab(labId)}
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="py-2">Total Lab Fees</TableCell>
                  <TableCell className="py-2 text-right text-primary">
                    {LAB_TESTS
                      .filter(t => selectedLabs.includes(t.id))
                      .reduce((sum, t) => sum + t.price, 0)
                      .toLocaleString()} UGX
                  </TableCell>
                  <TableCell className="py-2" />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
            No laboratory tests ordered yet
          </div>
        )}

        {recentLabs.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              Recent Lab Orders & Results
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 text-[11px] uppercase">Date</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase">Tests</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase">Status</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLabs.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="py-2 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {order.ordered_labs.map((labId: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {LAB_TESTS.find(t => t.id === labId)?.name || labId}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            order.status === 'COMPLETED' && "bg-green-500 hover:bg-green-600",
                            order.status === 'PENDING' && "bg-amber-500 hover:bg-amber-600 text-white"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {order.status === 'COMPLETED' ? (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1"
                            onClick={() => {
                              toast.info('Viewing results feature coming soon');
                            }}
                          >
                            <FileText className="w-3 h-3" /> Results
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Awaiting results</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Search className="w-5 h-5" />
            <h3>Imaging Orders</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Total Imaging: </span>
            <Badge variant="secondary" className="text-primary font-bold">
              {IMAGING_TESTS
                .filter(t => selectedImaging.includes(t.id))
                .reduce((sum, t) => sum + t.price, 0)
                .toLocaleString()} UGX
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Search & Add Investigations</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ultrasound, xray, ct, mri..."
              className="pl-8"
              value={imagingSearch}
              onChange={(e) => setImagingSearch(e.target.value)}
            />
            {imagingSearch && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                {IMAGING_TESTS.filter(t => 
                  t.name.toLowerCase().includes(imagingSearch.toLowerCase()) || 
                  t.category.toLowerCase().includes(imagingSearch.toLowerCase())
                ).map(test => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => {
                      toggleImaging(test.id);
                      setImagingSearch('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{test.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{test.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {test.price.toLocaleString()} UGX
                      </span>
                      {selectedImaging.includes(test.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Select Common Investigations</Label>
          <div className="flex flex-wrap gap-2">
            {IMAGING_TESTS.slice(0, 8).map(test => {
              const isSelected = selectedImaging.includes(test.id);
              return (
                <Badge
                  key={test.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90 transition-colors py-1.5 px-3 gap-2"
                  onClick={() => toggleImaging(test.id)}
                >
                  {test.name}
                  <span className="opacity-70 text-[10px]">({test.price.toLocaleString()} UGX)</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        </div>

        {selectedImaging.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="h-9 text-[11px] uppercase">Investigation</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Category</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Price</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedImaging.map((imgId) => {
                  const test = IMAGING_TESTS.find(t => t.id === imgId);
                  if (!test) return null;
                  return (
                    <TableRow key={imgId}>
                      <TableCell className="py-2 font-medium">
                        {test.name}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {test.category}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        {test.price.toLocaleString()} UGX
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => toggleImaging(imgId)}
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="py-2">Total Imaging Fees</TableCell>
                  <TableCell className="py-2 text-right text-primary">
                    {IMAGING_TESTS
                      .filter(t => selectedImaging.includes(t.id))
                      .reduce((sum, t) => sum + t.price, 0)
                      .toLocaleString()} UGX
                  </TableCell>
                  <TableCell className="py-2" />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
            No imaging investigations requested yet
          </div>
        )}

        {recentImaging.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              Recent Imaging Orders & Results
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 text-[11px] uppercase">Date</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase">Investigation</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase">Status</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentImaging.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="py-2 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {order.ordered_imaging.map((img: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {img.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={
                          order.status === 'COMPLETED' ? 'default' : 
                          order.status === 'REPORTED' ? 'outline' :
                          order.status === 'IN PROGRESS' ? 'secondary' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-2">
                          {order.results && order.results.length > 0 && (
                            <Dialog>
                              <DialogTrigger render={
                                <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary">
                                  <FileText className="w-3 h-3" /> View Result
                                </Button>
                              } />
                              <DialogContent className="max-w-5xl">
                                <DialogHeader>
                                  <DialogTitle>Imaging Result</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  {order.results.map((res: any, rIdx: number) => (
                                    <div key={rIdx} className="space-y-2 p-3 border rounded bg-muted/30">
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>By {res.radiologist_name}</span>
                                        <span>{new Date(res.report_date).toLocaleDateString()}</span>
                                      </div>
                                      <div>
                                        <Label className="text-[10px] uppercase text-muted-foreground">Findings</Label>
                                        <p className="text-sm whitespace-pre-wrap">{res.findings}</p>
                                      </div>
                                      <div>
                                        <Label className="text-[10px] uppercase text-muted-foreground">Impression</Label>
                                        <p className="text-sm font-semibold">{res.result_text}</p>
                                      </div>
                                      {res.file_name && (
                                        <div className="flex items-center gap-2 text-primary text-xs font-medium bg-primary/5 p-2 rounded border border-primary/10">
                                          <FileText className="w-3 h-3" />
                                          <span>{res.file_name}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {order.status === 'COMPLETED' && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px] gap-1"
                              onClick={() => {
                                setSelectedImagingForReport({
                                  encounter_id: order.encounter_id,
                                  imaging_id: order.ordered_imaging[0]?.id, // Simplification for demo
                                  patient_name: order.patient_name
                                });
                                setIsReportModalOpen(true);
                              }}
                            >
                              <Upload className="w-3 h-3" /> Attach Report
                            </Button>
                          )}
                          {order.status === 'COMPLETED' && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px]"
                              onClick={() => updateImagingStatus(order.encounter_id, 'REPORTED')}
                            >
                              Mark Reported
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Attach Imaging Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAttachReport} className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="radiologist_name">Radiologist Name</Label>
                  <Input id="radiologist_name" name="radiologist_name" placeholder="Dr. John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report_date">Report Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="report_date" name="report_date" type="date" className="pl-8" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="findings">Findings & Impression</Label>
                  <Textarea id="findings" name="findings" placeholder="Enter radiological findings..." className="min-h-[120px]" required />
                </div>
                <div className="space-y-2">
                  <Label>Upload PDF Report (Simulated)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Click or drag to upload imaging report (PDF/JPG)</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save & Attach Report</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Pill className="w-5 h-5" />
            <h3>Prescriptions</h3>
          </div>
          <div className="flex gap-2">
            {prescriptions.length > 0 && (
              <Button 
                type="button" 
                variant={isPharmacySent ? "secondary" : "default"}
                size="sm" 
                className="gap-2"
                onClick={sendToPharmacy}
                disabled={isPharmacySending || isPharmacySent}
              >
                {isPharmacySending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPharmacySent ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isPharmacySent ? 'Sent to Pharmacy' : 'Send to Pharmacy'}
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-2 relative"
              onClick={() => {
                setCurrentMed(null);
                setEditingIndex(null);
                setMedSearch('');
                setIsMedModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Prescribe Medication
              {prescriptions.length > 0 && (
                <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                  {prescriptions.length}
                </Badge>
              )}
            </Button>
            <Dialog open={isMedModalOpen} onOpenChange={(open) => {
              setIsMedModalOpen(open);
              if (!open) {
                setCurrentMed(null);
                setEditingIndex(null);
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingIndex !== null ? 'Edit Prescription' : 'Prescribe Medication'}</DialogTitle>
                </DialogHeader>
                
                {!currentMed ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search medications..."
                        className="pl-8"
                        value={medSearch}
                        onChange={(e) => setMedSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Quick Select</Label>
                      <div className="flex flex-wrap gap-2">
                        {MEDICATIONS.slice(0, 8).map(med => (
                          <Badge
                            key={med.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground transition-colors py-1.5 px-3 gap-2"
                            onClick={() => {
                              setCurrentMed(med);
                              setPrescValues({ dose: 1, frequency: 3, duration: 5, dosage: med.dosage, instructions: '', quantity: 15, medication_name: med.name });
                            }}
                          >
                            {med.name}
                            <span className="opacity-70 text-[10px]">({med.dosage})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2 py-4 max-h-[300px] overflow-y-auto">
                      {MEDICATIONS.filter(m => 
                        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
                        m.category.toLowerCase().includes(medSearch.toLowerCase())
                      ).length === 0 && medSearch && (
                        <div 
                          className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer border border-dashed border-primary/50 transition-colors"
                          onClick={() => {
                            setCurrentMed(null);
                            setPrescValues({ dose: 1, frequency: 3, duration: 5, dosage: '', instructions: '', quantity: 15, medication_name: medSearch });
                          }}
                        >
                          <div>
                            <p className="font-medium text-primary">Add Custom: "{medSearch}"</p>
                            <p className="text-xs text-muted-foreground">Click to specify details for this medication</p>
                          </div>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      {MEDICATIONS.filter(m => 
                        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
                        m.category.toLowerCase().includes(medSearch.toLowerCase())
                      ).map(med => (
                        <div 
                          key={med.id} 
                          className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer border transition-colors"
                          onClick={() => {
                            setCurrentMed(med);
                            setPrescValues({ dose: 1, frequency: 3, duration: 5, dosage: med.dosage, instructions: '', quantity: 15, medication_name: med.name });
                          }}
                        >
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">{med.category} • {med.dosage}</p>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsMedModalOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                      <p className="text-sm font-semibold text-primary">{currentMed?.name || prescValues.medication_name}</p>
                      <p className="text-xs text-muted-foreground">{currentMed?.category || 'Custom Medication'}</p>
                    </div>
                    
                    <div className="grid gap-4">
                      {!currentMed && (
                        <div className="space-y-2">
                          <Label htmlFor="medication_name">Medication Name</Label>
                          <Input 
                            id="medication_name" 
                            name="medication_name" 
                            value={prescValues.medication_name} 
                            onChange={(e) => setPrescValues(prev => ({ ...prev, medication_name: e.target.value }))}
                            required 
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dose">Dose (Units)</Label>
                          <Input 
                            id="dose" 
                            name="dose" 
                            type="number" 
                            value={prescValues.dose} 
                            onChange={(e) => {
                              const dose = Number(e.target.value);
                              setPrescValues(prev => ({ 
                                ...prev, 
                                dose, 
                                quantity: dose * prev.frequency * prev.duration 
                              }));
                            }}
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dosage">Strength</Label>
                          <Input 
                            id="dosage" 
                            name="dosage" 
                            value={prescValues.dosage} 
                            onChange={(e) => setPrescValues(prev => ({ ...prev, dosage: e.target.value }))}
                            required 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Frequency (times/day)</Label>
                          <Input 
                            id="frequency" 
                            name="frequency" 
                            type="number" 
                            value={prescValues.frequency} 
                            onChange={(e) => {
                              const frequency = Number(e.target.value);
                              setPrescValues(prev => ({ 
                                ...prev, 
                                frequency, 
                                quantity: prev.dose * frequency * prev.duration 
                              }));
                            }}
                            placeholder="e.g. 3" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (days)</Label>
                          <Input 
                            id="duration" 
                            name="duration" 
                            type="number" 
                            value={prescValues.duration} 
                            onChange={(e) => {
                              const duration = Number(e.target.value);
                              setPrescValues(prev => ({ 
                                ...prev, 
                                duration, 
                                quantity: prev.dose * prev.frequency * duration 
                              }));
                            }}
                            placeholder="e.g. 5" 
                            required 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Total Quantity</Label>
                          <Input 
                            id="quantity" 
                            name="quantity" 
                            type="number" 
                            value={prescValues.quantity} 
                            onChange={(e) => setPrescValues(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            className="font-bold text-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instructions">Instructions</Label>
                          <Input 
                            id="instructions" 
                            name="instructions" 
                            value={prescValues.instructions} 
                            onChange={(e) => setPrescValues(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="e.g. After meals" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => {
                        if (editingIndex !== null) {
                          setIsMedModalOpen(false);
                        } else {
                          setCurrentMed(null);
                        }
                      }}>
                        {editingIndex !== null ? 'Cancel' : 'Back'}
                      </Button>
                      <Button type="button" className="flex-1" onClick={addPrescription}>
                        {editingIndex !== null ? 'Update Prescription' : 'Add to List'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          {/* Removed redundant search and quick select to focus on modal action */}
        </div>

        {prescriptions.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="h-9 text-[11px] uppercase">Medication</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Dose</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Freq</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Dur</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Qty</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="py-2 font-medium">
                      <div>{p.medication_name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.dosage}</div>
                    </TableCell>
                    <TableCell className="py-2 text-xs">{p.dose}</TableCell>
                    <TableCell className="py-2 text-xs">{p.frequency}x</TableCell>
                    <TableCell className="py-2 text-xs">{p.duration}d</TableCell>
                    <TableCell className="py-2 font-bold text-xs">{p.quantity}</TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-primary"
                          onClick={() => editPrescription(idx)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => removePrescription(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
            No medications prescribed yet
          </div>
        )}

        {recentPrescriptions.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Recent Prescriptions</Label>
              <Badge variant="secondary" className="text-[10px]">{recentPrescriptions.length} Records</Badge>
            </div>
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-8 text-[10px] uppercase">Date</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase">Medications</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPrescriptions.slice(0, 3).map((p, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="py-2 text-[11px] whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {p.items.map((item: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px] py-0 px-1 font-normal">
                              {item.medication_name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant={p.status === 'DISPENSED' ? 'default' : 'secondary'} 
                          className="text-[9px] py-0 px-1 h-4"
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-4 pt-6">
        <Button type="submit" className="flex-1 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
          {encounter ? 'Update Consultation' : 'Complete & Save Consultation'}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="gap-2 h-11 relative" onClick={() => setIsLabModalOpen(true)}>
            <FlaskConical className="w-4 h-4" /> Order Lab
            {selectedLabs.length > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                {selectedLabs.length}
              </Badge>
            )}
          </Button>
          <Dialog open={isLabModalOpen} onOpenChange={setIsLabModalOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Order Laboratory Tests</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests or categories..."
                    className="pl-8"
                    value={labSearch}
                    onChange={(e) => setLabSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {Array.from(new Set(LAB_TESTS
                    .filter(t => 
                      t.name.toLowerCase().includes(labSearch.toLowerCase()) || 
                      t.category.toLowerCase().includes(labSearch.toLowerCase())
                    )
                    .map(t => t.category))).map(category => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
                      <div className="grid gap-2">
                        {LAB_TESTS
                          .filter(t => t.category === category)
                          .filter(t => 
                            t.name.toLowerCase().includes(labSearch.toLowerCase()) || 
                            t.category.toLowerCase().includes(labSearch.toLowerCase())
                          )
                          .map(test => (
                          <div key={test.id} className="flex items-start space-x-3 p-2 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border">
                            <Checkbox 
                              id={test.id} 
                              checked={selectedLabs.includes(test.id)}
                              onCheckedChange={() => toggleLab(test.id)}
                              className="mt-1"
                            />
                            <Label 
                              htmlFor={test.id}
                              className="flex-1 space-y-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">{test.name}</span>
                                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {test.price === 0 ? 'FREE' : `${test.price.toLocaleString()} UGX`}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {test.description}
                              </p>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {LAB_TESTS.filter(t => 
                    t.name.toLowerCase().includes(labSearch.toLowerCase()) || 
                    t.category.toLowerCase().includes(labSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No matching lab tests found
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-primary">
                    {LAB_TESTS
                      .filter(t => selectedLabs.includes(t.id))
                      .reduce((sum, t) => sum + t.price, 0)
                      .toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsLabModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setIsLabModalOpen(false);
                    if (selectedLabs.length > 0) {
                      toast.success(`${selectedLabs.length} lab tests selected`);
                    }
                  }}>
                    Confirm Order ({selectedLabs.length})
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button type="button" variant="outline" className="gap-2 h-11 relative" onClick={() => setIsImagingModalOpen(true)}>
            <Search className="w-4 h-4" /> Request Imaging
            {selectedImaging.length > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                {selectedImaging.length}
              </Badge>
            )}
          </Button>
          <Dialog open={isImagingModalOpen} onOpenChange={setIsImagingModalOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Request Imaging Investigations</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search investigations or categories..."
                    className="pl-8"
                    value={imagingSearch}
                    onChange={(e) => setImagingSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {Array.from(new Set(IMAGING_TESTS
                    .filter(t => 
                      t.name.toLowerCase().includes(imagingSearch.toLowerCase()) || 
                      t.category.toLowerCase().includes(imagingSearch.toLowerCase())
                    )
                    .map(t => t.category))).map(category => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
                      <div className="grid gap-2">
                        {IMAGING_TESTS
                          .filter(t => t.category === category)
                          .filter(t => 
                            t.name.toLowerCase().includes(imagingSearch.toLowerCase()) || 
                            t.category.toLowerCase().includes(imagingSearch.toLowerCase())
                          )
                          .map(test => (
                          <div key={test.id} className="flex items-start space-x-3 p-2 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border">
                            <Checkbox 
                              id={test.id} 
                              checked={selectedImaging.includes(test.id)}
                              onCheckedChange={() => toggleImaging(test.id)}
                              className="mt-1"
                            />
                            <Label 
                              htmlFor={test.id}
                              className="flex-1 space-y-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">{test.name}</span>
                                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {test.price.toLocaleString()} UGX
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button">Done</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isPastEncountersModalOpen} onOpenChange={setIsPastEncountersModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Past Consultations</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-6">
                {selectedPastEncounter ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Encounter Details</h3>
                        <p className="text-sm text-muted-foreground">{new Date(selectedPastEncounter.created_at).toLocaleString()}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPastEncounter(null)}>
                        Back to List
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Symptoms</h4>
                          <p className="text-sm bg-muted/20 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                            {selectedPastEncounter.symptoms || 'None recorded'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Diagnosis</h4>
                          <p className="text-sm bg-muted/20 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                            {selectedPastEncounter.diagnosis || 'None recorded'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Clinical Notes</h4>
                          <div 
                            className="text-sm bg-muted/20 p-3 rounded-md min-h-[100px] prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedPastEncounter.notes || 'None recorded' }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Vitals</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-3 rounded-md">
                            <div><span className="text-muted-foreground">Temp:</span> {selectedPastEncounter.temperature || '--'} °C</div>
                            <div><span className="text-muted-foreground">BP:</span> {selectedPastEncounter.blood_pressure || '--'}</div>
                            <div><span className="text-muted-foreground">Pulse:</span> {selectedPastEncounter.pulse || '--'} bpm</div>
                            <div><span className="text-muted-foreground">SpO2:</span> {selectedPastEncounter.spo2 || '--'} %</div>
                            <div><span className="text-muted-foreground">Weight:</span> {selectedPastEncounter.weight || '--'} kg</div>
                            <div><span className="text-muted-foreground">Height:</span> {selectedPastEncounter.height || '--'} cm</div>
                          </div>
                        </div>
                        
                        {selectedPastEncounter.prescriptions && selectedPastEncounter.prescriptions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Prescriptions</h4>
                            <div className="space-y-2">
                              {selectedPastEncounter.prescriptions.map((p: any, i: number) => (
                                <div key={i} className="text-sm bg-muted/20 p-2 rounded-md border">
                                  <div className="font-medium">{p.medication_name} {p.dosage}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {p.instructions} • Qty: {p.quantity}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedPastEncounter.ordered_labs && selectedPastEncounter.ordered_labs.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Ordered Labs</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedPastEncounter.ordered_labs.map((labId: string) => {
                                const lab = LAB_TESTS.find(t => t.id === labId);
                                return (
                                  <Badge key={labId} variant="secondary" className="text-xs">
                                    {lab?.name || labId}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastEncounters.map((enc: any) => (
                      <Card key={enc.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedPastEncounter(enc)}>
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{new Date(enc.created_at).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">{new Date(enc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              <span className="font-medium text-foreground">Dx:</span> {enc.diagnosis || 'None'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              <span className="font-medium text-foreground">Sx:</span> {enc.symptoms || 'None'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1 sm:justify-end max-w-[200px]">
                            {enc.prescriptions?.length > 0 && <Badge variant="outline" className="text-[10px]">Rx ({enc.prescriptions.length})</Badge>}
                            {enc.ordered_labs?.length > 0 && <Badge variant="outline" className="text-[10px]">Labs ({enc.ordered_labs.length})</Badge>}
                            {enc.ordered_imaging?.length > 0 && <Badge variant="outline" className="text-[10px]">Imaging ({enc.ordered_imaging.length})</Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </form>
  );
};

export const Clinical = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVitalsAppt, setActiveVitalsAppt] = useState<any>(null);
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<any>(null);
  const { token, user } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptRes, patientRes] = await Promise.all([
        axios.get('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/patients', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointments(apptRes.data);
      setPatients(patientRes.data);
    } catch (err) {
      toast.error('Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPatientInfo = (patientId: number) => {
    return patients.find(p => p.id === patientId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string }> = {
      'WAITING': { 
        label: 'Waiting', 
        className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' 
      },
      'TRIAGE': { 
        label: 'Triage', 
        className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100' 
      },
      'CONSULTATION': { 
        label: 'Consultation', 
        className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' 
      },
      'COMPLETED': { 
        label: 'Completed', 
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
      },
      'CANCELLED': { 
        label: 'Cancelled', 
        className: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100' 
      }
    };

    const config = statusMap[status] || { label: status, className: 'bg-secondary text-secondary-foreground' };

    return (
      <Badge 
        variant="outline" 
        className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
          config.className
        )}
      >
        {config.label}
      </Badge>
    );
  };

  const handleCancelAppointment = async (apptId: number) => {
    try {
      await axios.patch(`/api/appointments/${apptId}/status`, { status: 'CANCELLED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment cancelled successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to cancel appointment');
    }
  };

  const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(appt => {
    const patient = getPatientInfo(appt.patient_id);
    const searchLower = searchTerm.toLowerCase();
    const patientName = patient ? String(`${patient.first_name} ${patient.last_name}`).toLowerCase() : '';
    const patientIdStr = patient ? String(patient.patient_id || '').toLowerCase() : '';
    const reason = appt.reason?.toLowerCase() || '';

    return patientName.includes(searchLower) || 
           patientIdStr.includes(searchLower) || 
           reason.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clinical Queue</h2>
        <p className="text-muted-foreground">Manage active consultations and triage</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Active Queue</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Name, ID or Reason..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'No matching patients found' : 'No patients in queue'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appt) => {
                  const patient = getPatientInfo(appt.patient_id);
                  return (
                    <TableRow key={appt.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${appt.patient_id}`}</span>
                        <span className="text-xs text-muted-foreground">{patient?.patient_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(appt.status)}
                    </TableCell>
                    <TableCell>{appt.reason}</TableCell>
                    <TableCell>{new Date(appt.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      {appt.status === 'WAITING' && (user?.role === 'NURSE' || user?.role === 'DOCTOR') && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => setActiveVitalsAppt(appt)}
                        >
                          {user?.role === 'DOCTOR' ? <Stethoscope className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                          {user?.role === 'DOCTOR' ? 'Start Consultation' : 'Triage'}
                        </Button>
                      )}
                      {appt.status === 'CONSULTATION' && user?.role === 'DOCTOR' && (
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => setActiveConsultationAppt(appt)}
                        >
                          <Stethoscope className="w-4 h-4" /> Continue Consultation
                        </Button>
                      )}
                      {appt.status === 'COMPLETED' && user?.role === 'DOCTOR' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2 border-primary text-primary hover:bg-primary/5"
                          onClick={() => setActiveConsultationAppt(appt)}
                        >
                          <FileText className="w-4 h-4" /> Edit Consultation
                        </Button>
                      )}
                      {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (user?.role === 'NURSE' || user?.role === 'DOCTOR') && (
                        <Dialog>
                          <DialogTrigger render={
                            <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 ml-2">
                              <XCircle className="w-4 h-4" /> Cancel
                            </Button>
                          } />
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Cancel Appointment</DialogTitle>
                            </DialogHeader>
                            <div className="py-6">
                              <p className="text-muted-foreground">
                                Are you sure you want to cancel this appointment? This action cannot be undone.
                              </p>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                              <DialogClose render={<Button variant="outline">Cancel</Button>} />
                              <Button 
                                variant="destructive" 
                                onClick={() => handleCancelAppointment(appt.id)}
                              >
                                Confirm
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full-screen Overlays */}
      {activeVitalsAppt && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Patient Vitals</h3>
                <p className="text-sm text-muted-foreground">
                  {getPatientInfo(activeVitalsAppt.patient_id) ? 
                    `${getPatientInfo(activeVitalsAppt.patient_id).first_name} ${getPatientInfo(activeVitalsAppt.patient_id).last_name} (${getPatientInfo(activeVitalsAppt.patient_id).patient_id})` : 
                    `Patient #${activeVitalsAppt.patient_id}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setActiveVitalsAppt(null)}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <VitalsForm 
                appt={activeVitalsAppt} 
                onComplete={() => {
                  fetchData();
                  setActiveVitalsAppt(null);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {activeConsultationAppt && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold">
                  {activeConsultationAppt.status === 'COMPLETED' ? 'Edit Consultation' : 'Consultation'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getPatientInfo(activeConsultationAppt.patient_id) ? 
                    `${getPatientInfo(activeConsultationAppt.patient_id).first_name} ${getPatientInfo(activeConsultationAppt.patient_id).last_name} (${getPatientInfo(activeConsultationAppt.patient_id).patient_id})` : 
                    `Patient #${activeConsultationAppt.patient_id}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setActiveConsultationAppt(null)}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <ConsultationForm 
                appt={activeConsultationAppt} 
                onComplete={() => {
                  fetchData();
                  setActiveConsultationAppt(null);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

