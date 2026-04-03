import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock database for demo purposes (since we don't have a real Postgres running here)
// In a real app, you'd use 'pg' pool
const mockDb = {
  users: [
    { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'ADMIN', fullName: 'System Admin' },
    { id: 2, username: 'doctor', passwordHash: bcrypt.hashSync('doctor123', 10), role: 'DOCTOR', fullName: 'Dr. Musoke John' },
    { id: 3, username: 'nurse', passwordHash: bcrypt.hashSync('nurse123', 10), role: 'NURSE', fullName: 'Nurse Namono Sarah' },
    { id: 4, username: 'labtech', passwordHash: bcrypt.hashSync('lab123', 10), role: 'LAB_TECH', fullName: 'Lab Tech Kato James' },
    { id: 5, username: 'pharmacist', passwordHash: bcrypt.hashSync('pharm123', 10), role: 'PHARMACIST', fullName: 'Pharm. Okello Joseph' },
  ],
  patients: [
    { 
      id: 1, 
      patient_id: 'UGN-2026-0001', 
      fullName: 'John Doe', 
      first_name: 'John',
      last_name: 'Doe',
      gender: 'MALE', 
      dateOfBirth: '1990-01-01', 
      phone: '0700000000', 
      address: 'Kampala, Central', 
      next_of_kin_name: 'Jane Smith',
      next_of_kin_relationship: 'Spouse',
      next_of_kin_phone: '0701112223',
      insurance_provider: 'Jubilee Insurance',
      insurance_number: 'JUB-998877',
      photo_url: 'https://picsum.photos/seed/john/200',
      created_at: new Date().toISOString() 
    },
    { 
      id: 2, 
      patient_id: 'UGN-2026-0002', 
      fullName: 'Sarah Namono', 
      first_name: 'Sarah',
      last_name: 'Namono',
      gender: 'FEMALE', 
      dateOfBirth: '1985-05-12', 
      phone: '0772123456', 
      address: 'Entebbe, Wakiso', 
      next_of_kin_name: 'Peter Namono',
      next_of_kin_relationship: 'Brother',
      next_of_kin_phone: '0772987654',
      insurance_provider: 'UAP Old Mutual',
      insurance_number: 'UAP-445566',
      photo_url: 'https://picsum.photos/seed/sarah/200',
      created_at: new Date().toISOString() 
    },
    { 
      id: 3, 
      patient_id: 'UGN-2026-0003', 
      fullName: 'James Kato', 
      first_name: 'James',
      last_name: 'Kato',
      gender: 'MALE', 
      dateOfBirth: '1995-11-20', 
      phone: '0755333444', 
      address: 'Jinja, Eastern', 
      next_of_kin_name: 'Mary Kato',
      next_of_kin_relationship: 'Mother',
      next_of_kin_phone: '0755999888',
      insurance_provider: 'Prudential',
      insurance_number: 'PRU-112233',
      photo_url: 'https://picsum.photos/seed/james/200',
      created_at: new Date().toISOString() 
    },
    { 
      id: 4, 
      patient_id: 'UGN-2026-0004', 
      fullName: 'Mary Akiteng', 
      first_name: 'Mary',
      last_name: 'Akiteng',
      gender: 'FEMALE', 
      dateOfBirth: '1978-03-08', 
      phone: '0788111222', 
      address: 'Gulu, Northern', 
      next_of_kin_name: 'Joseph Okello',
      next_of_kin_relationship: 'Husband',
      next_of_kin_phone: '0788666555',
      insurance_provider: 'Liberty Health',
      insurance_number: 'LIB-776655',
      photo_url: 'https://picsum.photos/seed/mary/200',
      created_at: new Date().toISOString() 
    }
  ],
  appointments: [
    { id: 1, patient_id: 1, appointment_date: '2024-06-01', appointment_time: '10:00', reason: 'Chest Pain', status: 'COMPLETED', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  vitals: [
    { id: 1, appointment_id: 1, patient_id: 'UGN-2026-0001', temperature: 36.5, blood_pressure: '120/80', pulse: 72, weight: 70, height: 175, spo2: 98, created_at: new Date().toISOString() }
  ],
  encounters: [
    { 
      id: 1, 
      appointment_id: 1, 
      patient_id: 'UGN-2026-0001', 
      vitals_id: 1, 
      diagnosis: 'Chest Pain, R/O Pneumonia', 
      notes: 'Patient complains of chest pain for 2 days.', 
      ordered_imaging: [{ id: 'xray_chest', name: 'X-Ray Chest', category: 'X-Ray', price: 30000, bodyPart: 'Chest', clinicalIndication: 'Chest Pain' }],
      imaging_status: 'REPORTED',
      created_at: '2024-06-01T10:30:00Z' 
    }
  ],
  lab_results: [],
  imaging_results: [
    {
      id: 1,
      encounter_id: 1,
      imaging_id: 'xray_chest',
      result_text: 'Normal Chest X-Ray',
      findings: 'Clear lung fields, no active consolidation or pleural effusion observed.',
      radiologist_name: 'Dr. Akiteng',
      report_date: '2024-06-01',
      file_name: 'report_xray_chest_1.pdf',
      technician_id: 4,
      created_at: '2024-06-01T11:00:00Z'
    }
  ],
  invoices: [
    {
      id: 1,
      encounter_id: 1,
      patient_id: 'UGN-2026-0001',
      name: 'John Doe',
      amount: 50000,
      status: 'UNPAID',
      date: '2024-06-01',
      items: [
        { description: 'Consultation Fee', amount: 20000 },
        { description: 'Imaging: X-Ray Chest', amount: 30000 }
      ]
    },
    {
      id: 2,
      encounter_id: null,
      patient_id: 'UGN-2026-0002',
      name: 'Sarah Namono',
      amount: 75000,
      paid_amount: 30000,
      status: 'PARTIALLY PAID',
      date: '2024-06-02',
      items: [
        { description: 'Lab Test: Malaria RDT', amount: 15000 },
        { description: 'Medication: Amoxicillin', amount: 60000 }
      ]
    }
  ],
  inventory: [
    { id: 'paracetamol_1', name: 'Paracetamol', dosage: '500mg', stock: 1200, maxStock: 2000, reorderLevel: 500, unit: 'Tablets', category: 'Analgesics', expiry_date: '2027-12-31', price_per_unit: 100 },
    { id: 'paracetamol_2', name: 'Paracetamol', dosage: '500mg', stock: 500, maxStock: 2000, reorderLevel: 500, unit: 'Tablets', category: 'Analgesics', expiry_date: '2026-06-15', price_per_unit: 100 },
    { id: 'amoxicillin', name: 'Amoxicillin', dosage: '500mg', stock: 450, maxStock: 1000, reorderLevel: 300, unit: 'Capsules', category: 'Antibiotics', expiry_date: '2026-05-15', price_per_unit: 500 },
    { id: 'artemether_lumefantrine', name: 'Artemether + Lumefantrine (AL)', dosage: '20/120mg', stock: 300, maxStock: 500, reorderLevel: 150, unit: 'Doses', category: 'Antimalarials', expiry_date: '2026-06-20', price_per_unit: 5000 },
    { id: 'metronidazole', name: 'Metronidazole', dosage: '400mg', stock: 600, maxStock: 1000, reorderLevel: 400, unit: 'Tablets', category: 'Antibiotics', expiry_date: '2026-11-10', price_per_unit: 200 },
    { id: 'ciprofloxacin', name: 'Ciprofloxacin', dosage: '500mg', stock: 250, maxStock: 1500, reorderLevel: 400, unit: 'Tablets', category: 'Antibiotics', expiry_date: '2026-04-25', price_per_unit: 800 },
    { id: 'salbutamol', name: 'Salbutamol', dosage: '2mg', stock: 150, maxStock: 1000, reorderLevel: 250, unit: 'Inhalers', category: 'Respiratory', expiry_date: '2027-01-15', price_per_unit: 15000 },
    { id: 'omeprazole', name: 'Omeprazole', dosage: '20mg', stock: 800, maxStock: 1200, reorderLevel: 300, unit: 'Capsules', category: 'Gastrointestinal', expiry_date: '2026-08-30', price_per_unit: 400 },
    { id: 'amlodipine', name: 'Amlodipine', dosage: '5mg', stock: 1000, maxStock: 1500, reorderLevel: 400, unit: 'Tablets', category: 'Cardiovascular', expiry_date: '2027-03-05', price_per_unit: 300 },
    { id: 'metformin', name: 'Metformin', dosage: '500mg', stock: 1500, maxStock: 2000, reorderLevel: 600, unit: 'Tablets', category: 'Antidiabetics', expiry_date: '2026-12-20', price_per_unit: 150 },
    { id: 'cetirizine', name: 'Cetirizine', dosage: '10mg', stock: 500, maxStock: 1000, reorderLevel: 250, unit: 'Tablets', category: 'Antihistamines', expiry_date: '2026-05-01', price_per_unit: 300 },
  ],
  pharmacy_prescriptions: [],
  audit_logs: [
    { id: 1, user_id: 1, user_name: 'System Admin', action: 'SYSTEM_STARTUP', details: 'EMR System initialized', created_at: new Date().toISOString() }
  ],
};

const JWT_SECRET = process.env.JWT_SECRET || 'uganda-emr-secret-key';

const logAction = (user: any, action: string, details: string) => {
  const log = {
    id: mockDb.audit_logs.length + 1,
    user_id: user.id,
    user_name: user.fullName || user.username,
    action,
    details,
    created_at: new Date().toISOString()
  };
  mockDb.audit_logs.push(log as never);
  console.log(`[AUDIT LOG] ${log.user_name}: ${action} - ${details}`);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Middleware ---
  const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = mockDb.users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      logAction(user, 'LOGIN', `User ${user.username} logged in`);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // --- Patient Routes ---
  app.get('/api/patients', authenticateToken, (req, res) => {
    res.json(mockDb.patients);
  });

  app.post('/api/patients', authenticateToken, (req, res) => {
    const patient = {
      ...req.body,
      id: mockDb.patients.length + 1,
      patient_id: `UGN-2026-${(mockDb.patients.length + 1).toString().padStart(4, '0')}`,
      created_at: new Date().toISOString()
    };
    mockDb.patients.push(patient as never);
    logAction((req as any).user, 'PATIENT_REGISTRATION', `Registered patient ${(patient as any).first_name} ${(patient as any).last_name} (${patient.patient_id})`);
    res.status(201).json(patient);
  });

  app.delete('/api/patients/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockDb.patients.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      const patient = mockDb.patients[index];
      mockDb.patients.splice(index, 1);
      logAction((req as any).user, 'PATIENT_DELETION', `Deleted patient record for ${(patient as any).first_name || (patient as any).fullName} (${patient.patient_id})`);
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  });

  app.patch('/api/patients/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockDb.patients.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      mockDb.patients[index] = {
        ...mockDb.patients[index],
        ...req.body,
        id, // Ensure ID doesn't change
        updated_at: new Date().toISOString()
      };
      const patient = mockDb.patients[index];
      logAction((req as any).user, 'PATIENT_UPDATE', `Updated profile for ${(patient as any).first_name || (patient as any).fullName} (${patient.patient_id})`);
      res.json(mockDb.patients[index]);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  });

  // --- Appointment Routes ---
  app.get('/api/appointments', authenticateToken, (req, res) => {
    res.json(mockDb.appointments);
  });

  app.post('/api/appointments', authenticateToken, (req, res) => {
    const appointment = {
      ...req.body,
      id: mockDb.appointments.length + 1,
      status: 'WAITING',
      created_at: new Date().toISOString()
    };
    mockDb.appointments.push(appointment as never);
    logAction((req as any).user, 'APPOINTMENT_BOOKING', `Booked appointment for patient ID ${appointment.patient_id} on ${appointment.appointment_date}`);
    res.status(201).json(appointment);
  });

  app.patch('/api/appointments/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockDb.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      mockDb.appointments[index] = {
        ...mockDb.appointments[index],
        ...req.body,
        id,
        updated_at: new Date().toISOString()
      };
      logAction((req as any).user, 'APPOINTMENT_UPDATE', `Updated appointment ID ${id}`);
      res.json(mockDb.appointments[index]);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  });

  app.patch('/api/appointments/:id/status', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const index = mockDb.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      mockDb.appointments[index].status = status;
      mockDb.appointments[index].updated_at = new Date().toISOString();
      logAction((req as any).user, 'APPOINTMENT_STATUS_UPDATE', `Updated appointment ID ${id} status to ${status}`);
      res.json(mockDb.appointments[index]);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  });

  // --- Triage (Vitals) ---
  app.get('/api/vitals/:appointment_id', authenticateToken, (req, res) => {
    const vitals = mockDb.vitals.filter((v: any) => v.appointment_id === parseInt(req.params.appointment_id));
    res.json(vitals);
  });

  app.post('/api/vitals', authenticateToken, (req, res) => {
    const vitals = {
      ...req.body,
      id: mockDb.vitals.length + 1,
      created_at: new Date().toISOString()
    };
    mockDb.vitals.push(vitals as never);
    
    // Update appointment status to CONSULTATION
    const appt = mockDb.appointments.find((a: any) => a.id === req.body.appointment_id);
    if (appt) (appt as any).status = 'CONSULTATION';

    logAction((req as any).user, 'TRIAGE_RECORDED', `Recorded vitals for appointment ID ${req.body.appointment_id}`);
    res.status(201).json(vitals);
  });

  // --- Clinical Encounters ---
  app.post('/api/encounters', authenticateToken, (req, res) => {
    const { 
      appointment_id, 
      patient_id, 
      temperature, 
      blood_pressure, 
      pulse, 
      weight, 
      height, 
      spo2,
      ...encounterData 
    } = req.body;

    // Create vitals record if any vitals are provided (check for non-empty values)
    let vitalsId = null;
    const hasVitals = [temperature, blood_pressure, pulse, weight, height, spo2].some(v => v !== undefined && v !== null && v !== '');
    
    if (hasVitals) {
      const vitalsRecord = {
        appointment_id: Number(appointment_id),
        patient_id,
        temperature,
        blood_pressure,
        pulse,
        weight,
        height,
        spo2,
        id: mockDb.vitals.length + 1,
        created_at: new Date().toISOString()
      };
      mockDb.vitals.push(vitalsRecord as never);
      vitalsId = vitalsRecord.id;
      logAction((req as any).user, 'VITALS_RECORDED', `Recorded vitals for patient ${patient_id} during consultation`);
    }

    const encounter = {
      ...encounterData,
      appointment_id: Number(appointment_id),
      patient_id,
      vitals_id: vitalsId, // Link to vitals record
      id: mockDb.encounters.length + 1,
      created_at: new Date().toISOString()
    };
    mockDb.encounters.push(encounter as never);

    // --- Billing Integration ---
    // Create an initial invoice for the consultation
    const patient = mockDb.patients.find((p: any) => p.patient_id === patient_id);
    const consultationFee = 20000; // Standard consultation fee
    let totalAmount = consultationFee;

    // Add lab costs
    if (encounterData.ordered_labs) {
      // In a real app, you'd look up prices from a master list
      // For now, we assume standard prices or just a flat rate for demo
      totalAmount += encounterData.ordered_labs.length * 10000; 
    }

    // Add imaging costs
    if (encounterData.ordered_imaging) {
      encounterData.ordered_imaging.forEach((img: any) => {
        totalAmount += img.price || 0;
      });
    }

    const invoice = {
      id: mockDb.invoices.length + 1,
      encounter_id: encounter.id,
      patient_id,
      name: (patient as any)?.fullName || 'Unknown Patient',
      amount: totalAmount,
      status: 'UNPAID',
      date: new Date().toISOString().split('T')[0],
      items: [
        { description: 'Consultation Fee', amount: consultationFee },
        ...(encounterData.ordered_labs || []).map((l: string) => ({ description: `Lab: ${l}`, amount: 10000 })),
        ...(encounterData.ordered_imaging || []).map((i: any) => ({ description: `Imaging: ${i.name}`, amount: i.price }))
      ]
    };
    mockDb.invoices.push(invoice as never);

    // Update appointment status to COMPLETED (or LAB/PHARMACY if needed)
    const appt = mockDb.appointments.find((a: any) => a.id === Number(appointment_id));
    if (appt) (appt as any).status = 'COMPLETED';

    logAction((req as any).user, 'CONSULTATION_COMPLETED', `Completed consultation for patient ${patient_id} (Appt ID: ${appointment_id})`);
    res.status(201).json(encounter);
  });

  // --- Patient Encounters ---
  app.get('/api/encounters/:patient_id', authenticateToken, (req, res) => {
    const encounters = mockDb.encounters.filter((e: any) => e.patient_id === req.params.patient_id);
    // Join with vitals
    const joinedEncounters = encounters.map((e: any) => ({
      ...e,
      vitals: mockDb.vitals.find((v: any) => v.id === e.vitals_id),
      lab_results: mockDb.lab_results.filter((r: any) => r.encounter_id === e.id),
      imaging_results: mockDb.imaging_results.filter((r: any) => r.encounter_id === e.id)
    }));
    res.json(joinedEncounters);
  });

  app.get('/api/encounters/appointment/:appointment_id', authenticateToken, (req, res) => {
    const appointmentId = Number(req.params.appointment_id);
    const encounter = mockDb.encounters.find((e: any) => e.appointment_id === appointmentId);
    if (encounter) {
      res.json({
        ...encounter,
        vitals: mockDb.vitals.find((v: any) => v.id === (encounter as any).vitals_id),
        lab_results: mockDb.lab_results.filter((r: any) => r.encounter_id === (encounter as any).id),
        imaging_results: mockDb.imaging_results.filter((r: any) => r.encounter_id === (encounter as any).id)
      });
    } else {
      res.status(404).json({ message: 'Encounter not found' });
    }
  });

  app.patch('/api/encounters/:id', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const encounterIndex = mockDb.encounters.findIndex((e: any) => e.id === id);
    
    if (encounterIndex !== -1) {
      const existingEncounter = mockDb.encounters[encounterIndex];
      const updatedEncounter = {
        ...existingEncounter,
        ...req.body,
        id, // Ensure ID doesn't change
        updated_at: new Date().toISOString()
      };
      mockDb.encounters[encounterIndex] = updatedEncounter as never;

      // Check if vitals were updated
      const vitalsFields = ['temperature', 'blood_pressure', 'pulse', 'weight', 'height', 'spo2'];
      const vitalsUpdated = vitalsFields.some(field => req.body[field] !== undefined);
      
      if (vitalsUpdated) {
        logAction((req as any).user, 'VITALS_UPDATED', `Updated patient vitals for encounter ID ${id}`);
        
        // Also update the linked vitals record if it exists
        if (existingEncounter.vitals_id) {
          const vitalsIndex = mockDb.vitals.findIndex((v: any) => v.id === existingEncounter.vitals_id);
          if (vitalsIndex !== -1) {
            mockDb.vitals[vitalsIndex] = {
              ...mockDb.vitals[vitalsIndex],
              ...vitalsFields.reduce((acc: any, field) => {
                if (req.body[field] !== undefined) acc[field] = req.body[field];
                return acc;
              }, {}),
              updated_at: new Date().toISOString()
            };
          }
        }
      }

      logAction((req as any).user, 'CONSULTATION_UPDATE', `Updated consultation record for encounter ID ${id}`);
      res.json(updatedEncounter);
    } else {
      res.status(404).json({ message: 'Encounter not found' });
    }
  });

  // --- Laboratory Routes ---
  app.get('/api/lab/orders', authenticateToken, (req, res) => {
    // Orders are derived from encounters that have ordered_labs
    const orders = mockDb.encounters
      .filter((e: any) => e.ordered_labs && e.ordered_labs.length > 0)
      .map((e: any) => {
        const patient = mockDb.patients.find((p: any) => p.patient_id === e.patient_id);
        const results = mockDb.lab_results.filter((r: any) => r.encounter_id === e.id);
        
        // Determine status based on results
        let status = 'PENDING';
        if (results.length > 0) {
          if (results.length === e.ordered_labs.length) {
            status = 'COMPLETED';
          } else {
            status = 'PARTIAL';
          }
        }

        return {
          id: e.id,
          encounter_id: e.id,
          patient_id: e.patient_id,
          patient_name: (patient as any)?.fullName || 'Unknown Patient',
          ordered_labs: e.ordered_labs,
          created_at: e.created_at,
          status: e.lab_status || status,
          results
        };
      });
    res.json(orders);
  });

  app.post('/api/lab/results', authenticateToken, (req, res) => {
    const { encounter_id, test_id, value, units, normal_range, notes, is_multi_parameter } = req.body;
    
    const result = {
      id: mockDb.lab_results.length + 1,
      encounter_id: Number(encounter_id),
      test_id,
      value,
      units: units || null,
      normal_range: normal_range || null,
      notes,
      is_multi_parameter: !!is_multi_parameter,
      technician_id: (req as any).user.id,
      created_at: new Date().toISOString()
    };
    
    mockDb.lab_results.push(result as never);
    logAction((req as any).user, 'LAB_RESULT_RECORDED', `Recorded lab result for ${test_id} (Encounter ID: ${encounter_id})`);
    res.status(201).json(result);
  });

  app.patch('/api/lab/orders/:encounter_id/status', authenticateToken, (req, res) => {
    const encounterId = Number(req.params.encounter_id);
    const { status } = req.body;
    
    const encounter = mockDb.encounters.find((e: any) => e.id === encounterId);
    if (encounter) {
      (encounter as any).lab_status = status;
      res.json({ message: 'Status updated', status });
    } else {
      res.status(404).json({ message: 'Encounter not found' });
    }
  });

  // --- Imaging Routes ---
  app.get('/api/imaging/orders', authenticateToken, (req, res) => {
    const orders = mockDb.encounters
      .filter((e: any) => e.ordered_imaging && e.ordered_imaging.length > 0)
      .map((e: any) => {
        const patient = mockDb.patients.find((p: any) => p.patient_id === e.patient_id);
        const results = mockDb.imaging_results.filter((r: any) => r.encounter_id === e.id);
        
        return {
          id: e.id,
          encounter_id: e.id,
          patient_id: e.patient_id,
          patient_name: (patient as any)?.fullName || 'Unknown Patient',
          ordered_imaging: e.ordered_imaging,
          created_at: e.created_at,
          status: e.imaging_status || (results.length === e.ordered_imaging.length ? 'COMPLETED' : 'REQUESTED'),
          results
        };
      });
    res.json(orders);
  });

  app.post('/api/imaging/results', authenticateToken, (req, res) => {
    const { encounter_id, imaging_id, result_text, findings, radiologist_name, report_date, file_name } = req.body;
    
    const result = {
      id: mockDb.imaging_results.length + 1,
      encounter_id: Number(encounter_id),
      imaging_id,
      result_text,
      findings,
      radiologist_name: radiologist_name || (req as any).user.name,
      report_date: report_date || new Date().toISOString(),
      file_name: file_name || null,
      technician_id: (req as any).user.id,
      created_at: new Date().toISOString()
    };
    
    mockDb.imaging_results.push(result as never);
    logAction((req as any).user, 'IMAGING_RESULT_RECORDED', `Recorded imaging result for ${imaging_id} (Encounter ID: ${encounter_id})`);

    // Check if all imaging is done and update status
    const encounter = mockDb.encounters.find((e: any) => e.id === Number(encounter_id));
    if (encounter) {
      const results = mockDb.imaging_results.filter((r: any) => r.encounter_id === Number(encounter_id));
      if (results.length === (encounter as any).ordered_imaging.length) {
        (encounter as any).imaging_status = 'COMPLETED';
      }
    }

    res.status(201).json(result);
  });

  app.patch('/api/imaging/orders/:encounter_id/status', authenticateToken, (req, res) => {
    const encounterId = Number(req.params.encounter_id);
    const { status } = req.body;
    
    const encounter = mockDb.encounters.find((e: any) => e.id === encounterId);
    if (encounter) {
      (encounter as any).imaging_status = status;
      res.json({ message: 'Imaging status updated', status });
    } else {
      res.status(404).json({ message: 'Encounter not found' });
    }
  });

  // --- Billing Routes ---
  app.get('/api/billing/invoices', authenticateToken, (req, res) => {
    res.json(mockDb.invoices);
  });

  app.patch('/api/billing/invoices/:id/pay', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const { method, reference_number } = req.body;
    const invoice = mockDb.invoices.find((inv: any) => inv.id === id);
    if (invoice) {
      (invoice as any).status = 'PAID';
      (invoice as any).payment_method = method;
      (invoice as any).reference_number = reference_number || null;
      logAction((req as any).user, 'PAYMENT_RECORDED', `Processed payment for invoice ID ${id} using ${method}`);
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  });

  // --- Pharmacy Routes ---
  app.get('/api/pharmacy/prescriptions', authenticateToken, (req, res) => {
    const prescriptionsWithPatient = mockDb.pharmacy_prescriptions.map((p: any) => {
      const patient = mockDb.patients.find((pat: any) => pat.patient_id === p.patient_id);
      return {
        ...p,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'
      };
    });
    res.json(prescriptionsWithPatient);
  });

  app.post('/api/pharmacy/prescriptions', authenticateToken, (req, res) => {
    const { encounter_id, patient_id, items } = req.body;
    
    const newPrescription = {
      id: mockDb.pharmacy_prescriptions.length + 1,
      encounter_id,
      patient_id,
      items, // Array of { medication_id, medication_name, dosage, frequency, duration, instructions }
      status: 'PENDING',
      prescribed_by: (req as any).user.id,
      created_at: new Date().toISOString()
    };
    
    mockDb.pharmacy_prescriptions.push(newPrescription as never);
    logAction((req as any).user, 'PRESCRIPTION_SUBMITTED', `Submitted prescription for patient ${patient_id} (Encounter ID: ${encounter_id})`);
    res.status(201).json(newPrescription);
  });

  app.patch('/api/pharmacy/prescriptions/:id/status', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    const index = mockDb.pharmacy_prescriptions.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      const prescription = mockDb.pharmacy_prescriptions[index];
      
      if (status === 'DISPENSED' && prescription.status !== 'DISPENSED') {
        let totalPrice = 0;
        const invoiceItems: any[] = [];

        // Logic to decrement stock from nearest expiry batches
        prescription.items.forEach((item: any) => {
          let remainingToDispense = Number(item.quantity || 1);
          const medicationName = item.medication_name;
          
          const batches = mockDb.inventory
            .filter((i: any) => i.name === medicationName && i.stock > 0)
            .sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
          
          let itemTotalPrice = 0;
          
          for (const batch of batches) {
            if (remainingToDispense <= 0) break;
            
            const dispenseFromBatch = Math.min(batch.stock, remainingToDispense);
            batch.stock -= dispenseFromBatch;
            remainingToDispense -= dispenseFromBatch;
            
            const batchPrice = (batch.price_per_unit || 0) * dispenseFromBatch;
            itemTotalPrice += batchPrice;
            
            logAction((req as any).user, 'STOCK_ADJUSTMENT', 
              `Stock reduced for ${medicationName} (${item.dosage}) from batch ${batch.id}. Quantity: ${dispenseFromBatch}, Remaining Stock in batch: ${batch.stock}. Reason: Prescription Dispensed (ID: ${id})`);
          }
          
          totalPrice += itemTotalPrice;
          invoiceItems.push({
            description: `${medicationName} (${item.dosage})`,
            amount: itemTotalPrice,
            quantity: Number(item.quantity || 1),
            unit_price: batches.length > 0 ? batches[0].price_per_unit : 0
          });
        });

        // Create an invoice for the dispensed medications
        const patient = mockDb.patients.find((p: any) => p.patient_id === prescription.patient_id);
        const newInvoice = {
          id: mockDb.invoices.length + 1,
          encounter_id: prescription.encounter_id || null,
          patient_id: prescription.patient_id,
          name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
          amount: totalPrice,
          status: 'UNPAID',
          date: new Date().toISOString().split('T')[0],
          items: invoiceItems,
          type: 'PHARMACY'
        };
        mockDb.invoices.push(newInvoice as never);
        logAction((req as any).user, 'INVOICE_GENERATED', `Generated pharmacy invoice ID ${newInvoice.id} for patient ${prescription.patient_id}`);
      }

      mockDb.pharmacy_prescriptions[index] = {
        ...prescription,
        status,
        dispensed_at: status === 'DISPENSED' ? new Date().toISOString() : null,
        dispensed_by: status === 'DISPENSED' ? (req as any).user.id : null
      };
      logAction((req as any).user, 'PRESCRIPTION_STATUS_UPDATE', `Updated prescription ID ${id} status to ${status}`);
      res.json(mockDb.pharmacy_prescriptions[index]);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  });

  app.get('/api/pharmacy/inventory', authenticateToken, (req, res) => {
    res.json(mockDb.inventory);
  });

  // --- Pharmacy Reporting Routes ---
  app.get('/api/pharmacy/reports/inventory', authenticateToken, (req, res) => {
    const lowStock = mockDb.inventory.filter((item: any) => item.stock <= item.reorderLevel);
    const stockLevels = mockDb.inventory.map((item: any) => ({
      name: item.name,
      dosage: item.dosage,
      stock: item.stock,
      maxStock: item.maxStock,
      reorderLevel: item.reorderLevel,
      category: item.category
    }));
    res.json({ stockLevels, lowStock });
  });

  app.get('/api/pharmacy/reports/expiring', authenticateToken, (req, res) => {
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    const expiringSoon = mockDb.inventory.filter((item: any) => {
      const expiry = new Date(item.expiry_date);
      return expiry <= threeMonthsFromNow && expiry >= today;
    });

    const expired = mockDb.inventory.filter((item: any) => {
      const expiry = new Date(item.expiry_date);
      return expiry < today;
    });

    res.json({ expiringSoon, expired });
  });

  app.get('/api/pharmacy/reports/dispensed', authenticateToken, (req, res) => {
    const { startDate, endDate, medicationName, dispensedBy, sortBy, sortOrder } = req.query;
    
    let dispensed = mockDb.pharmacy_prescriptions.filter((p: any) => p.status === 'DISPENSED');
    
    // Filter by Date Range
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // End of day

      dispensed = dispensed.filter((p: any) => {
        const dispensedAt = new Date(p.dispensed_at);
        return dispensedAt >= start && dispensedAt <= end;
      });
    }

    // Filter by Dispensing User
    if (dispensedBy) {
      dispensed = dispensed.filter((p: any) => {
        const user = mockDb.users.find(u => u.id === p.dispensed_by);
        const userName = user ? user.fullName.toLowerCase() : 'unknown';
        return userName.includes((dispensedBy as string).toLowerCase());
      });
    }

    // Filter by Medication Name (for individual prescriptions)
    if (medicationName) {
      dispensed = dispensed.filter((p: any) => 
        p.items.some((item: any) => item.medication_name.toLowerCase().includes((medicationName as string).toLowerCase()))
      );
    }

    // Aggregate dispensed items
    const itemSummary: { [key: string]: any } = {};
    dispensed.forEach((p: any) => {
      p.items.forEach((item: any) => {
        // Apply medication name filter to summary as well if present
        if (medicationName && !item.medication_name.toLowerCase().includes((medicationName as string).toLowerCase())) {
          return;
        }

        const key = `${item.medication_name}_${item.dosage || ''}`;
        if (!itemSummary[key]) {
          itemSummary[key] = {
            name: item.medication_name,
            dosage: item.dosage,
            totalDispensed: 0,
            prescriptions: 0,
            totalPrice: 0
          };
        }
        const qty = Number(item.quantity || 1);
        const invItem = mockDb.inventory.find((i: any) => i.name === item.medication_name);
        const unitPrice = invItem?.price_per_unit || 0;
        
        itemSummary[key].totalDispensed += qty;
        itemSummary[key].prescriptions += 1;
        itemSummary[key].totalPrice += (unitPrice * qty);
      });
    });

    let summary = Object.values(itemSummary);
    let prescriptions = dispensed.map((p: any) => {
      const patient = mockDb.patients.find((pat: any) => pat.patient_id === p.patient_id);
      const user = mockDb.users.find(u => u.id === p.dispensed_by);
      return {
        ...p,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
        dispensed_by_name: user ? user.fullName : 'Unknown User'
      };
    });

    // Sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'date') {
        prescriptions.sort((a, b) => (new Date(a.dispensed_at).getTime() - new Date(b.dispensed_at).getTime()) * order);
      } else if (sortBy === 'medication') {
        summary.sort((a: any, b: any) => a.name.localeCompare(b.name) * order);
        prescriptions.sort((a, b) => a.items[0].medication_name.localeCompare(b.items[0].medication_name) * order);
      } else if (sortBy === 'user') {
        prescriptions.sort((a, b) => a.dispensed_by_name.localeCompare(b.dispensed_by_name) * order);
      } else if (sortBy === 'revenue') {
        summary.sort((a: any, b: any) => (a.totalPrice - b.totalPrice) * order);
      }
    }

    res.json({ 
      summary,
      prescriptions
    });
  });

  app.patch('/api/pharmacy/inventory/:id/adjust', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { adjustment, reason, type } = req.body; // type: 'ADD' or 'REMOVE'
    
    const index = mockDb.inventory.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      const item = mockDb.inventory[index];
      const oldStock = item.stock;
      const change = type === 'ADD' ? Number(adjustment) : -Number(adjustment);
      item.stock += change;
      
      logAction((req as any).user, 'STOCK_ADJUSTMENT', 
        `Stock adjusted for ${item.name} (${item.dosage}). Type: ${type}, Quantity: ${adjustment}, New Stock: ${item.stock} ${item.unit}. Reason: ${reason}`);
      
      res.json(item);
    } else {
      res.status(404).json({ message: 'Medication not found' });
    }
  });

  // --- Audit Log Routes ---
  app.get('/api/audit_logs', authenticateToken, (req, res) => {
    // Only admins can view audit logs
    if ((req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    res.json(mockDb.audit_logs);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EMR Server running on http://localhost:${PORT}`);
  });
}

startServer();
