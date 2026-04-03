import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Search, RefreshCcw, History, Activity, Thermometer, Heart, Weight, Ruler, Wind, Stethoscope, Trash2, FileText, UserCircle, Save, Edit2, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAB_TESTS } from './Clinical';

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
              <div 
                className="text-sm italic text-muted-foreground bg-white/30 p-2 rounded border border-dashed" 
                dangerouslySetInnerHTML={{ __html: enc.notes }} 
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {enc.ordered_labs && enc.ordered_labs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lab Orders & Results</Label>
                <div className="space-y-1">
                  {enc.ordered_labs.map((lab: string) => {
                    const result = enc.lab_results?.find((r: any) => r.test_id === lab);
                    return (
                      <div key={lab} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{lab.replace(/_/g, ' ')}</span>
                          {result ? (
                            <span className="text-[10px] font-mono bg-blue-100 px-1 rounded">{result.value} {result.units}</span>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase opacity-70">Pending</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {enc.ordered_imaging && enc.ordered_imaging.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Imaging Requests</Label>
                <div className="space-y-1">
                  {enc.ordered_imaging.map((img: any, idx: number) => {
                    const result = enc.imaging_results?.find((r: any) => r.imaging_id === img.id);
                    return (
                      <div key={idx} className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{img.name}</span>
                          {result ? (
                            <Badge className="text-[9px] h-4 px-1 uppercase bg-purple-600">Reported</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase opacity-70">Pending</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {enc.vitals && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Vitals Recorded</Label>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-100 p-1 rounded flex justify-between">
                    <span className="text-muted-foreground">BP:</span>
                    <span className="font-bold">{enc.vitals.bp_sys}/{enc.vitals.bp_dia}</span>
                  </div>
                  <div className="bg-slate-100 p-1 rounded flex justify-between">
                    <span className="text-muted-foreground">Pulse:</span>
                    <span className="font-bold">{enc.vitals.pulse}</span>
                  </div>
                  <div className="bg-slate-100 p-1 rounded flex justify-between">
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="font-bold">{enc.vitals.temp}°C</span>
                  </div>
                  <div className="bg-slate-100 p-1 rounded flex justify-between">
                    <span className="text-muted-foreground">SpO2:</span>
                    <span className="font-bold">{enc.vitals.spo2}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const PatientChart = ({ patient, token }: { patient: any, token: string | null }) => {
  const [encounters, setEncounters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/encounters/${patient.patient_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEncounters(res.data);
      } catch (err) {
        toast.error('Failed to fetch patient history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patient.patient_id, token]);

  if (loading) return <div className="flex items-center justify-center h-[500px]"><RefreshCcw className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">Medical History</TabsTrigger>
        <TabsTrigger value="labs">Lab Results</TabsTrigger>
        <TabsTrigger value="imaging">Imaging</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border">
                {patient.photo_url ? (
                  <img src={patient.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle className="w-10 h-10" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-primary" />
                  Demographics
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Full Name</Label>
                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Patient ID</Label>
                <p className="font-mono font-medium">{patient.patient_id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Gender</Label>
                <p className="font-medium">{patient.gender}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Date of Birth</Label>
                <p className="font-medium">{patient.date_of_birth}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Phone Number</Label>
                <p className="font-medium flex items-center gap-2"><Phone className="w-3 h-3" /> {patient.phone_number}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Insurance</Label>
                <p className="font-medium">{patient.insurance_provider || 'N/A'} ({patient.insurance_number || 'N/A'})</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {encounters.length > 0 && encounters[0].vitals ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-[10px] text-red-600 uppercase font-bold">BP</p>
                    <p className="text-lg font-bold text-red-700">{encounters[0].vitals.bp_sys}/{encounters[0].vitals.bp_dia}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-600 uppercase font-bold">Pulse</p>
                    <p className="text-lg font-bold text-blue-700">{encounters[0].vitals.pulse} bpm</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-[10px] text-orange-600 uppercase font-bold">Temp</p>
                    <p className="text-lg font-bold text-orange-700">{encounters[0].vitals.temp}°C</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-[10px] text-green-600 uppercase font-bold">SpO2</p>
                    <p className="text-lg font-bold text-green-700">{encounters[0].vitals.spo2}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">No vitals recorded recently</div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <ScrollArea className="h-[500px] pr-4">
          <EncounterHistory patientId={patient.patient_id} token={token} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="labs">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {encounters.some(enc => enc.ordered_labs?.length > 0) ? (
              encounters.filter(enc => enc.ordered_labs?.length > 0).map(enc => (
                <Card key={enc.id}>
                  <CardHeader className="py-3 bg-muted/30">
                    <CardTitle className="text-sm font-bold flex justify-between">
                      <span>Encounter on {new Date(enc.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline">{enc.ordered_labs.length} Tests</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {enc.ordered_labs.map((lab: string) => {
                        const result = enc.lab_results?.find((r: any) => r.test_id === lab);
                        const testDef = LAB_TESTS.find(t => t.id === lab);
                        
                        return (
                          <div key={lab} className="p-3 border rounded-lg bg-blue-50/30">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm">{testDef?.name || lab.replace(/_/g, ' ')}</span>
                              {result ? (
                                result.is_multi_parameter ? (
                                  <Badge className="bg-blue-600">Multi-parameter</Badge>
                                ) : (
                                  <Badge className="bg-blue-600">{result.value} {result.units}</Badge>
                                )
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </div>
                            
                            {result && result.is_multi_parameter && (
                              <div className="mt-2 text-[10px] space-y-1">
                                {(() => {
                                  try {
                                    const params = JSON.parse(result.value);
                                    return params.map((p: any) => (
                                      <div key={p.id} className="flex justify-between border-b border-blue-100/50 pb-0.5">
                                        <span className="text-muted-foreground">{p.name}:</span>
                                        <span className="font-bold">{p.value} {p.unit}</span>
                                      </div>
                                    ));
                                  } catch (e) {
                                    return <p className="text-destructive">Error parsing results</p>;
                                  }
                                })()}
                              </div>
                            )}
                            
                            {result?.notes && <p className="text-xs italic text-muted-foreground mt-1">Note: {result.notes}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                No laboratory results found for this patient.
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="imaging">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {encounters.some(enc => enc.ordered_imaging?.length > 0) ? (
              encounters.filter(enc => enc.ordered_imaging?.length > 0).map(enc => (
                <Card key={enc.id}>
                  <CardHeader className="py-3 bg-muted/30">
                    <CardTitle className="text-sm font-bold flex justify-between">
                      <span>Encounter on {new Date(enc.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline">{enc.ordered_imaging.length} Requests</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-4 space-y-4">
                    {enc.ordered_imaging.map((img: any, idx: number) => {
                      const result = enc.imaging_results?.find((r: any) => r.imaging_id === img.id);
                      return (
                        <div key={idx} className="p-4 border rounded-lg bg-purple-50/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{img.name} - {img.bodyPart}</span>
                            <Badge variant={result ? "default" : "outline"}>{result ? "Reported" : "Pending"}</Badge>
                          </div>
                          {result ? (
                            <div className="bg-white p-3 rounded border text-sm space-y-2">
                              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                <span>Impression</span>
                                <span>Radiologist: {result.radiologist_name}</span>
                              </div>
                              <p className="leading-relaxed">{result.result_text}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Clinical Indication: {img.clinicalIndication}</p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                No imaging reports found for this patient.
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

const PatientProfile = ({ patient, token, onUpdate }: { patient: any, token: string | null, onUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(patient.photo_url || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (photoPreview) {
      data.photo_url = photoPreview;
    }
    
    try {
      await axios.patch(`/api/patients/${patient.id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Patient profile updated');
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update patient profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-primary/20">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle className="w-12 h-12" />
              )}
            </div>
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Edit2 className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{patient.patient_id}</p>
          </div>
        </div>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>}
        </Button>
      </div>

      <Separator />

      <form key={patient.id} onSubmit={handleUpdate} className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input name="first_name" defaultValue={patient.first_name} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input name="last_name" defaultValue={patient.last_name} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input name="date_of_birth" type="date" defaultValue={patient.date_of_birth} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          {isEditing ? (
            <Select name="gender" defaultValue={patient.gender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input defaultValue={patient.gender} readOnly className="bg-muted/50" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input name="phone_number" defaultValue={patient.phone_number} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input name="address" defaultValue={patient.address} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Insurance Provider</Label>
          <Input name="insurance_provider" defaultValue={patient.insurance_provider} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Insurance Number</Label>
          <Input name="insurance_number" defaultValue={patient.insurance_number} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>

        <div className="col-span-2 mt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
            <Phone className="w-4 h-4" /> Emergency Contact Details
          </h4>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-dashed">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input name="next_of_kin_name" defaultValue={patient.next_of_kin_name} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input name="next_of_kin_relationship" defaultValue={patient.next_of_kin_relationship} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="next_of_kin_phone" defaultValue={patient.next_of_kin_phone} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="col-span-2 pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </form>

      {!isEditing && (
        <div className="pt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Recent Activity
          </h4>
          <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
            View clinical history tab for detailed medical records.
          </div>
        </div>
      )}
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

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPatient = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (photoPreview) {
      data.photo_url = photoPreview;
    }
    
    try {
      await axios.post('/api/patients', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Patient registered successfully');
      setPhotoPreview(null);
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

  const seedPatients = async () => {
    setLoading(true);
    const samples = [
      { first_name: 'John', last_name: 'Doe', gender: 'MALE', date_of_birth: '1990-01-01', phone_number: '0700000000', address: 'Kampala', insurance_provider: 'Jubilee', insurance_number: 'JUB-123', photo_url: 'https://picsum.photos/seed/john/200' },
      { first_name: 'Sarah', last_name: 'Namono', gender: 'FEMALE', date_of_birth: '1985-05-12', phone_number: '0772123456', address: 'Entebbe', insurance_provider: 'UAP', insurance_number: 'UAP-456', photo_url: 'https://picsum.photos/seed/sarah/200' },
      { first_name: 'James', last_name: 'Kato', gender: 'MALE', date_of_birth: '1995-11-20', phone_number: '0755333444', address: 'Jinja', insurance_provider: 'Prudential', insurance_number: 'PRU-789', photo_url: 'https://picsum.photos/seed/james/200' }
    ];

    try {
      for (const p of samples) {
        await axios.post('/api/patients', p, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success('Sample patients seeded');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to seed sample patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    String(p.patient_id || '').toLowerCase().includes(search.toLowerCase())
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
                <div className="col-span-2 flex justify-center mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-dashed border-primary/30">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <UserCircle className="w-10 h-10" />
                          <span className="text-[10px] mt-1">Add Photo</span>
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Edit2 className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                </div>
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
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input name="insurance_provider" placeholder="e.g. Jubilee, UAP, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Number</Label>
                  <Input name="insurance_number" placeholder="e.g. INS-123456" />
                </div>
                
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Phone className="w-4 h-4" /> Emergency Contact Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-dashed">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input name="next_of_kin_name" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input name="next_of_kin_relationship" placeholder="e.g. Spouse, Parent, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input name="next_of_kin_phone" placeholder="+256..." />
                    </div>
                  </div>
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
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <p>No patients found</p>
                      <Button variant="outline" onClick={seedPatients} disabled={loading}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Seed Sample Patients
                      </Button>
                    </div>
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
                          <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                            <FileText className="w-4 h-4" /> View Chart
                          </Button>
                        } />
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader className="px-6 pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <DialogTitle className="text-2xl font-bold">Patient Medical Chart</DialogTitle>
                                <p className="text-sm text-muted-foreground">Comprehensive clinical record for {patient.first_name} {patient.last_name}</p>
                              </div>
                              <Badge className="text-lg px-4 py-1">{patient.patient_id}</Badge>
                            </div>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto px-6 py-4">
                            <PatientChart patient={patient} token={token} />
                          </div>
                        </DialogContent>
                      </Dialog>
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
                      <Dialog>
                        <DialogTrigger render={
                          <Button variant="ghost" size="sm" className="gap-2">
                            <UserCircle className="w-4 h-4" /> View Profile
                          </Button>
                        } />
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Patient Profile</DialogTitle>
                          </DialogHeader>
                          <PatientProfile patient={patient} token={token} onUpdate={fetchPatients} />
                        </DialogContent>
                      </Dialog>
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
