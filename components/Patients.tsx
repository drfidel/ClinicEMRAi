import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, RefreshCcw, History, Activity, Thermometer, Heart, Weight, Ruler, Wind, Stethoscope, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

const EncounterHistory = ({ patientId, token }: { patientId: string, token: string | null }) => {
  const [encounters, setEncounters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/encounters/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEncounters(res.data);
      } catch (err) {
        toast.error('Failed to fetch patient history');
      } finally {
        setLoading(true);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patientId, token]);

  if (loading) return <div className="py-10 text-center">Loading history...</div>;
  if (encounters.length === 0) return <div className="py-10 text-center text-muted-foreground">No clinical history found for this patient.</div>;

  return (
    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
      {encounters.map((enc) => (
        <div key={enc.id} className="border rounded-lg p-4 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Stethoscope className="w-4 h-4" />
              <span>Encounter on {new Date(enc.created_at).toLocaleDateString()}</span>
            </div>
            <Badge variant="outline">{new Date(enc.created_at).toLocaleTimeString()}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Symptoms</Label>
              <p className="text-sm">{enc.symptoms}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Diagnosis</Label>
              <p className="text-sm font-medium">{enc.diagnosis}</p>
              {enc.icd10_codes && enc.icd10_codes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {enc.icd10_codes.map((code: string) => (
                    <Badge key={code} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {enc.notes && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Clinical Notes</Label>
              <p className="text-sm italic text-muted-foreground">{enc.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {enc.ordered_labs && enc.ordered_labs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lab Orders</Label>
                <div className="flex flex-wrap gap-1">
                  {enc.ordered_labs.map((lab: string) => (
                    <Badge key={lab} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      {lab.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {enc.ordered_imaging && enc.ordered_imaging.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Imaging Requests</Label>
                <div className="space-y-1">
                  {enc.ordered_imaging.map((img: any, idx: number) => (
                    <div key={idx} className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1">
                      <div className="flex justify-between">
                        <span className="font-bold">{img.name}</span>
                        <span className="text-[9px] uppercase opacity-70">{img.category}</span>
                      </div>
                      {img.bodyPart && <div className="text-[10px] mt-0.5">Part: <span className="font-medium">{img.bodyPart}</span></div>}
                      {img.clinicalIndication && <div className="text-[10px] italic mt-0.5">Indication: {img.clinicalIndication}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enc.prescriptions && enc.prescriptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Prescriptions</Label>
                <div className="space-y-1">
                  {enc.prescriptions.map((p: any, idx: number) => (
                    <div key={idx} className="text-[11px] bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1">
                      <span className="font-bold">{p.medication_name}</span> {p.dosage} - {p.frequency} ({p.duration})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {enc.vitals && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Activity className="w-3 h-3" />
                  Linked Vitals
                </div>
                <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Thermometer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="font-medium">{enc.vitals.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Heart className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">BP:</span>
                    <span className="font-medium">{enc.vitals.blood_pressure}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Pulse:</span>
                    <span className="font-medium">{enc.vitals.pulse} bpm</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Weight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{enc.vitals.weight} kg</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Ruler className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{enc.vitals.height} cm</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Wind className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">SpO2:</span>
                    <span className="font-medium">{enc.vitals.spo2}%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const token = useAuthStore(state => state.token);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(res.data);
    } catch (err) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await axios.post('/api/patients', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Patient registered successfully');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to register patient');
    }
  };

  const handleDeletePatient = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Patient record deleted');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to delete patient record');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
          <p className="text-muted-foreground">Register and manage patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPatients} disabled={loading}>
            <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger render={<Button />}>
              <UserPlus className="w-4 h-4 mr-2" />
              Register Patient
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Patient Registration</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input name="first_name" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input name="last_name" required />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input name="date_of_birth" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select name="gender" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input name="phone_number" placeholder="+256..." />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input name="address" />
                </div>
                <div className="col-span-2 pt-4">
                  <Button type="submit" className="w-full">Register Patient</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono font-medium">{patient.patient_id}</TableCell>
                    <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.date_of_birth}</TableCell>
                    <TableCell>{patient.phone_number}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="outline" size="sm" className="gap-2">
                            <History className="w-4 h-4" /> History
                          </Button>
                        } />
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Clinical History: {patient.first_name} {patient.last_name}</DialogTitle>
                          </DialogHeader>
                          <EncounterHistory patientId={patient.patient_id} token={token} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm">View Profile</Button>
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        } />
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                          </DialogHeader>
                          <div className="py-6">
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to delete the record for <span className="font-semibold text-foreground">{patient.first_name} {patient.last_name}</span>? 
                              This action cannot be undone and all clinical history will be lost.
                            </p>
                          </div>
                          <DialogFooter>
                            <DialogClose render={
                              <Button variant="outline" disabled={deletingId === patient.id}>Cancel</Button>
                            } />
                            <DialogClose render={
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDeletePatient(patient.id)}
                                disabled={deletingId === patient.id}
                              >
                                {deletingId === patient.id ? (
                                  <>
                                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete Record'
                                )}
                              </Button>
                            } />
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

import { cn } from '@/lib/utils';
