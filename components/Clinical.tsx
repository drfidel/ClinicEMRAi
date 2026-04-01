import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Stethoscope, Activity, Pill, FlaskConical, Thermometer, Heart, Weight, Ruler, Wind, Loader2, Search, CheckCircle2, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

const LAB_TESTS = [
  { id: 'malaria_rdt', name: 'Malaria RDT', category: 'Parasitology', description: 'Rapid diagnostic test for Plasmodium falciparum', price: 5000 },
  { id: 'malaria_bs', name: 'Malaria Blood Smear', category: 'Parasitology', description: 'Microscopic examination of blood for malaria parasites', price: 10000 },
  { id: 'cbc', name: 'Complete Blood Count (CBC)', category: 'Hematology', description: 'Measures red cells, white cells, and platelets', price: 25000 },
  { id: 'hiv_test', name: 'HIV Rapid Test', category: 'Serology', description: 'Screening for HIV-1 and HIV-2 antibodies', price: 0 },
  { id: 'urinalysis', name: 'Urinalysis', category: 'Biochemistry', description: 'Chemical and microscopic analysis of urine', price: 8000 },
  { id: 'blood_glucose', name: 'Random Blood Glucose', category: 'Biochemistry', description: 'Measures the amount of glucose in the blood', price: 5000 },
  { id: 'lft', name: 'Liver Function Tests (LFT)', category: 'Biochemistry', description: 'Group of tests to evaluate liver health', price: 45000 },
  { id: 'rft', name: 'Renal Function Tests (RFT)', category: 'Biochemistry', description: 'Evaluates kidney function (Urea, Creatinine)', price: 40000 },
  { id: 'sputum_afb', name: 'Sputum for AFB (TB)', category: 'Microbiology', description: 'Test for Acid-Fast Bacilli to detect Tuberculosis', price: 0 },
  { id: 'syphilis', name: 'Syphilis (VDRL/RPR)', category: 'Serology', description: 'Nonspecific screening test for syphilis', price: 7000 },
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
];

const VitalsForm = ({ appt, onComplete }: { appt: any, onComplete: () => void }) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    // Validation
    const temp = parseFloat(data.temperature as string);
    const pulse = parseInt(data.pulse as string);
    const spo2 = parseInt(data.spo2 as string);

    if (temp < 34 || temp > 43) {
      toast.error('Temperature must be between 34°C and 43°C');
      return;
    }
    if (pulse < 30 || pulse > 200) {
      toast.error('Pulse rate must be between 30 and 200 bpm');
      return;
    }
    if (spo2 < 50 || spo2 > 100) {
      toast.error('Oxygen saturation must be between 50% and 100%');
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature (°C)</Label>
          <div className="relative">
            <Thermometer className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="temperature" name="temperature" type="number" step="0.1" min="34" max="43" className="pl-8" placeholder="36.5" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="blood_pressure">Blood Pressure (mmHg)</Label>
          <div className="relative">
            <Activity className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="blood_pressure" name="blood_pressure" className="pl-8" placeholder="120/80" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pulse">Pulse Rate (bpm)</Label>
          <div className="relative">
            <Heart className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="pulse" name="pulse" type="number" min="30" max="200" className="pl-8" placeholder="72" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
          <div className="relative">
            <Wind className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="spo2" name="spo2" type="number" min="50" max="100" className="pl-8" placeholder="98" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <div className="relative">
            <Weight className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="weight" name="weight" type="number" step="0.1" className="pl-8" placeholder="70.0" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <div className="relative">
            <Ruler className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="height" name="height" type="number" className="pl-8" placeholder="170" required />
          </div>
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
  const [loading, setLoading] = useState(true);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedICD10, setSelectedICD10] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labSearch, setLabSearch] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [icdSearch, setIcdSearch] = useState('');
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isICDModalOpen, setIsICDModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [currentMed, setCurrentMed] = useState<any>(null);
  const { token, user } = useAuthStore();

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await axios.get(`/api/vitals/${appt.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          // Get the most recent vitals for this appointment
          setVitals(res.data[res.data.length - 1]);
        }
      } catch (err) {
        console.error('Failed to fetch vitals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, [appt.id, token]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validation
    const temp = parseFloat(data.temperature as string);
    const pulse = parseInt(data.pulse as string);
    const spo2 = parseInt(data.spo2 as string);

    if (temp && (temp < 34 || temp > 43)) {
      toast.error('Temperature must be between 34°C and 43°C');
      return;
    }
    if (pulse && (pulse < 30 || pulse > 200)) {
      toast.error('Pulse rate must be between 30 and 200 bpm');
      return;
    }
    if (spo2 && (spo2 < 50 || spo2 > 100)) {
      toast.error('Oxygen saturation must be between 50% and 100%');
      return;
    }

    try {
      await axios.post('/api/encounters', {
        ...data,
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        doctor_id: user?.id,
        ordered_labs: selectedLabs,
        icd10_codes: selectedICD10,
        prescriptions: prescriptions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Consultation completed');
      onComplete();
    } catch (err) {
      toast.error('Failed to save consultation');
    }
  };

  const toggleLab = (testId: string) => {
    setSelectedLabs(prev => 
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
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    setPrescriptions(prev => [...prev, {
      ...data,
      medication_id: currentMed.id,
      medication_name: currentMed.name
    }]);
    
    setIsMedModalOpen(false);
    setCurrentMed(null);
    toast.success('Medication added to prescription');
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
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
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
            <Input name="temperature" type="number" step="0.1" min="34" max="43" placeholder="36.5" defaultValue={vitals?.temperature} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              BP (mmHg)
            </Label>
            <Input name="blood_pressure" placeholder="120/80" defaultValue={vitals?.blood_pressure} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Pulse (bpm)
            </Label>
            <Input name="pulse" type="number" min="30" max="200" placeholder="72" defaultValue={vitals?.pulse} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-muted-foreground" />
              Weight (kg)
            </Label>
            <Input name="weight" type="number" step="0.1" placeholder="70.0" defaultValue={vitals?.weight} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              Height (cm)
            </Label>
            <Input name="height" type="number" placeholder="170" defaultValue={vitals?.height} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-muted-foreground" />
              Oxygen Saturation (SpO2 %)
            </Label>
            <Input name="spo2" type="number" min="50" max="100" placeholder="98" defaultValue={vitals?.spo2} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Stethoscope className="w-5 h-5" />
          <h3>Clinical Assessment</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Symptoms</Label>
            <Textarea name="symptoms" placeholder="Describe symptoms..." required className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Diagnosis</Label>
            <div className="space-y-2">
              <Textarea name="diagnosis" placeholder="Enter diagnosis description..." required className="min-h-[80px]" />
              <div className="flex flex-wrap gap-2">
                {selectedICD10.map(code => (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {code} - {ICD10_CODES.find(i => i.code === code)?.name}
                    <button type="button" onClick={() => toggleICD10(code)} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                ))}
                <Dialog open={isICDModalOpen} onOpenChange={setIsICDModalOpen}>
                  <DialogTrigger render={
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                      <Plus className="w-3 h-3" /> Add ICD-10
                    </Button>
                  } />
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Select ICD-10 Codes</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by code or name..."
                          className="pl-8"
                          value={icdSearch}
                          onChange={(e) => setIcdSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 py-4 max-h-[400px] overflow-y-auto">
                      {ICD10_CODES.filter(item => 
                        item.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
                        item.name.toLowerCase().includes(icdSearch.toLowerCase())
                      ).map(item => (
                        <div key={item.code} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md">
                          <Checkbox 
                            id={`icd-${item.code}`} 
                            checked={selectedICD10.includes(item.code)}
                            onCheckedChange={() => toggleICD10(item.code)}
                          />
                          <Label 
                            htmlFor={`icd-${item.code}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            <span className="font-bold text-primary mr-2">{item.code}</span>
                            {item.name}
                          </Label>
                        </div>
                      ))}
                      {ICD10_CODES.filter(item => 
                        item.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
                        item.name.toLowerCase().includes(icdSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          No matching ICD-10 codes found
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => setIsICDModalOpen(false)}>Done</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Clinical Notes</Label>
          <Textarea name="notes" placeholder="Additional notes, history, etc..." className="min-h-[100px]" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FlaskConical className="w-5 h-5" />
            <h3>Laboratory Orders</h3>
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
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Pill className="w-5 h-5" />
            <h3>Prescriptions</h3>
          </div>
          <Dialog open={isMedModalOpen} onOpenChange={setIsMedModalOpen}>
            <DialogTrigger render={
              <Button type="button" variant="outline" size="sm" className="gap-2 relative">
                <Plus className="w-4 h-4" /> Prescribe Medication
                {prescriptions.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                    {prescriptions.length}
                  </Badge>
                )}
              </Button>
            } />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Prescribe Medication</DialogTitle>
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
                  <div className="grid gap-2 py-4 max-h-[300px] overflow-y-auto">
                    {MEDICATIONS.filter(m => 
                      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
                      m.category.toLowerCase().includes(medSearch.toLowerCase())
                    ).map(med => (
                      <div 
                        key={med.id} 
                        className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer border transition-colors"
                        onClick={() => setCurrentMed(med)}
                      >
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.category} • {med.dosage}</p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={addPrescription} className="space-y-4 py-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                    <p className="text-sm font-semibold text-primary">{currentMed.name}</p>
                    <p className="text-xs text-muted-foreground">{currentMed.category}</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input id="dosage" name="dosage" defaultValue={currentMed.dosage} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Input id="frequency" name="frequency" placeholder="e.g. 1x3" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input id="duration" name="duration" placeholder="e.g. 5 days" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Input id="instructions" name="instructions" placeholder="e.g. After meals" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentMed(null)}>Back</Button>
                    <Button type="submit" className="flex-1">Add to List</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {prescriptions.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="h-9 text-[11px] uppercase">Medication</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Dosage</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Frequency</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase">Duration</TableHead>
                  <TableHead className="h-9 text-[11px] uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="py-2 font-medium">{p.medication_name}</TableCell>
                    <TableCell className="py-2">{p.dosage}</TableCell>
                    <TableCell className="py-2">{p.frequency}</TableCell>
                    <TableCell className="py-2">{p.duration}</TableCell>
                    <TableCell className="py-2 text-right">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => removePrescription(idx)}
                      >
                        ×
                      </Button>
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
      </div>

      <Separator />

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 h-11">Complete & Save Consultation</Button>
        <div className="flex gap-2">
          <Dialog open={isLabModalOpen} onOpenChange={setIsLabModalOpen}>
            <DialogTrigger render={
              <Button type="button" variant="outline" className="gap-2 h-11 relative">
                <FlaskConical className="w-4 h-4" /> Order Lab
                {selectedLabs.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
                    {selectedLabs.length}
                  </Badge>
                )}
              </Button>
            } />
            <DialogContent className="max-w-md">
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

  const filteredAppointments = appointments.filter(appt => {
    const patient = getPatientInfo(appt.patient_id);
    const searchLower = searchTerm.toLowerCase();
    const patientName = patient ? `${patient.first_name} ${patient.last_name}`.toLowerCase() : '';
    const patientIdStr = patient ? patient.patient_id.toLowerCase() : '';
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
                      <Badge variant={appt.status === 'WAITING' ? 'outline' : 'default'}>
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{appt.reason}</TableCell>
                    <TableCell>{new Date(appt.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      {appt.status === 'WAITING' && (user?.role === 'NURSE' || user?.role === 'DOCTOR') && (
                        <Dialog>
                          <DialogTrigger render={
                            <Button size="sm" variant="outline" className="gap-2">
                              {user?.role === 'DOCTOR' ? <Stethoscope className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                              {user?.role === 'DOCTOR' ? 'Start Consultation' : 'Triage'}
                            </Button>
                          } />
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Patient Vitals: {patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${appt.patient_id}`}</DialogTitle>
                            </DialogHeader>
                            <VitalsForm appt={appt} onComplete={fetchData} />
                          </DialogContent>
                        </Dialog>
                      )}
                      {appt.status === 'CONSULTATION' && user?.role === 'DOCTOR' && (
                        <Dialog>
                          <DialogTrigger render={
                            <Button size="sm" className="gap-2">
                              <Stethoscope className="w-4 h-4" /> Continue Consultation
                            </Button>
                          } />
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Consultation: {patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${appt.patient_id}`}</DialogTitle>
                            </DialogHeader>
                            <ConsultationForm appt={appt} onComplete={fetchData} />
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
    </div>
  );
};

