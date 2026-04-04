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
      paid_amount: 0,
      status: 'UNPAID',
      date: '2024-06-01',
      items: [
        { description: 'Consultation Fee', amount: 20000 },
        { description: 'Imaging: X-Ray Chest', amount: 30000 }
      ],
      payments: []
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
      ],
      payments: [
        { method: 'Cash', amount: 30000, reference_number: 'CASH-001', date: '2024-06-02T10:00:00Z' }
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
    // Sundries and Supplies
    { id: 'catheter_14', name: 'Foley Catheter', dosage: 'Size 14', stock: 50, maxStock: 100, reorderLevel: 20, unit: 'Pieces', category: 'Sundries', expiry_date: '2028-12-31', price_per_unit: 5000 },
    { id: 'catheter_16', name: 'Foley Catheter', dosage: 'Size 16', stock: 45, maxStock: 100, reorderLevel: 20, unit: 'Pieces', category: 'Sundries', expiry_date: '2028-12-31', price_per_unit: 5000 },
    { id: 'gloves_latex', name: 'Surgical Gloves', dosage: 'Latex (Medium)', stock: 200, maxStock: 500, reorderLevel: 100, unit: 'Pairs', category: 'Supplies', expiry_date: '2029-01-01', price_per_unit: 2000 },
    { id: 'gloves_nitrile', name: 'Examination Gloves', dosage: 'Nitrile (Large)', stock: 500, maxStock: 1000, reorderLevel: 200, unit: 'Pairs', category: 'Supplies', expiry_date: '2029-01-01', price_per_unit: 1000 },
    { id: 'cannula_g20', name: 'IV Cannula', dosage: 'G20 (Pink)', stock: 150, maxStock: 300, reorderLevel: 50, unit: 'Pieces', category: 'Supplies', expiry_date: '2027-06-30', price_per_unit: 3500 },
    { id: 'cannula_g22', name: 'IV Cannula', dosage: 'G22 (Blue)', stock: 120, maxStock: 300, reorderLevel: 50, unit: 'Pieces', category: 'Supplies', expiry_date: '2027-06-30', price_per_unit: 3500 },
    { id: 'syringe_5ml', name: 'Disposable Syringe', dosage: '5ml', stock: 1000, maxStock: 2000, reorderLevel: 500, unit: 'Pieces', category: 'Supplies', expiry_date: '2030-01-01', price_per_unit: 500 },
    { id: 'gauze_roll', name: 'Gauze Roll', dosage: '10cm x 3m', stock: 80, maxStock: 200, reorderLevel: 40, unit: 'Rolls', category: 'Sundries', expiry_date: '2030-01-01', price_per_unit: 2500 },
  ],
  pharmacy_prescriptions: [],
  stock_history: [
    { id: 1, inventory_id: 'paracetamol_1', type: 'ADD', quantity: 1200, reason: 'Initial stock', user_name: 'System Admin', created_at: new Date().toISOString() },
    { id: 2, inventory_id: 'amoxicillin', type: 'ADD', quantity: 450, reason: 'Initial stock', user_name: 'System Admin', created_at: new Date().toISOString() },
  ],
  billable_services: [
    { id: 'theater_fee', name: 'Theater Fee', category: 'Service', amount: 500000 },
    { id: 'nursing_fee', name: 'Nursing Fee', category: 'Service', amount: 50000 },
    { id: 'consultation_general', name: 'General Consultation', category: 'Consultation', amount: 20000 },
    { id: 'consultation_specialist', name: 'Specialist Consultation', category: 'Consultation', amount: 50000 },
    { id: 'accommodation_general', name: 'General Ward (Per Day)', category: 'Accommodation', amount: 30000 },
    { id: 'accommodation_private', name: 'Private Room (Per Day)', category: 'Accommodation', amount: 100000 },
    { id: 'ambulance_local', name: 'Ambulance (Local)', category: 'Transport', amount: 50000 },
    { id: 'lab_fee_general', name: 'Laboratory Fee (General)', category: 'Lab', amount: 15000 },
    { id: 'imaging_fee_general', name: 'Imaging Fee (General)', category: 'Imaging', amount: 30000 },
    { id: 'emergency_fee', name: 'Emergency Fee', category: 'Service', amount: 40000 },
    { id: 'medical_report', name: 'Medical Report Fee', category: 'Admin', amount: 10000 },
    { id: 'pharmacy_fee', name: 'Dispensing Fee', category: 'Pharmacy', amount: 5000 },
    { id: 'dressing_fee', name: 'Dressing Fee', category: 'Nursing', amount: 15000 },
    { id: 'injection_fee', name: 'Injection Fee', category: 'Nursing', amount: 5000 },
  ],
  audit_logs: [
    { id: 1, user_id: 1, user_name: 'System Admin', action: 'SYSTEM_STARTUP', details: 'EMR System initialized', created_at: new Date().toISOString() }
  ],
  expenses: [
    { id: 1, category: 'Staff Salaries', amount: 5000000, description: 'Staff salaries for June', date: '2024-06-28', payment_method: 'Bank Transfer' },
    { id: 2, category: 'Utility Expenses', amount: 200000, description: 'Electricity bill', date: '2024-06-15', payment_method: 'Mobile Money' },
    { id: 3, category: 'Medical Supplies', amount: 1500000, description: 'Medical supplies restock', date: '2024-06-10', payment_method: 'Cash' },
  ],
  accounts: [
    { id: '1000', name: 'Cash on Hand', type: 'ASSET' },
    { id: '1010', name: 'Bank Account', type: 'ASSET' },
    { id: '4000', name: 'Medical Service Income', type: 'INCOME' },
    { id: '4010', name: 'Pharmacy Income', type: 'INCOME' },
    { id: '5000', name: 'Staff Salaries', type: 'EXPENSE' },
    { id: '5010', name: 'Utility Expenses', type: 'EXPENSE' },
    { id: '5020', name: 'Medical Supplies', type: 'EXPENSE' },
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

  // --- Laboratory Reporting Routes ---
  app.get('/api/lab/reports/summary', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;
    let encounters = mockDb.encounters.filter((e: any) => e.ordered_labs && e.ordered_labs.length > 0);

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      encounters = encounters.filter((e: any) => {
        const date = new Date(e.created_at);
        return date >= start && date <= end;
      });
    }

    const testFrequency: { [key: string]: number } = {};
    let totalTests = 0;
    let completedTests = 0;

    encounters.forEach((e: any) => {
      e.ordered_labs.forEach((testId: string) => {
        testFrequency[testId] = (testFrequency[testId] || 0) + 1;
        totalTests++;
      });
      if (e.lab_status === 'COMPLETED') {
        completedTests++;
      }
    });

    const frequencyData = Object.entries(testFrequency).map(([id, count]) => ({
      id,
      count
    })).sort((a, b) => b.count - a.count);

    res.json({
      totalOrders: encounters.length,
      totalTests,
      completedOrders: completedTests,
      testFrequency: frequencyData,
      statusDistribution: {
        PENDING: encounters.filter((e: any) => !e.lab_status || e.lab_status === 'PENDING').length,
        PARTIAL: encounters.filter((e: any) => e.lab_status === 'PARTIAL').length,
        COMPLETED: completedTests
      }
    });
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

  // --- Imaging Reporting Routes ---
  app.get('/api/imaging/reports/summary', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;
    let encounters = mockDb.encounters.filter((e: any) => e.ordered_imaging && e.ordered_imaging.length > 0);

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      encounters = encounters.filter((e: any) => {
        const date = new Date(e.created_at);
        return date >= start && date <= end;
      });
    }

    const modalityFrequency: { [key: string]: number } = {};
    const bodyPartFrequency: { [key: string]: number } = {};
    let totalRequests = 0;

    encounters.forEach((e: any) => {
      e.ordered_imaging.forEach((img: any) => {
        modalityFrequency[img.category] = (modalityFrequency[img.category] || 0) + 1;
        bodyPartFrequency[img.bodyPart] = (bodyPartFrequency[img.bodyPart] || 0) + 1;
        totalRequests++;
      });
    });

    const modalityData = Object.entries(modalityFrequency).map(([name, count]) => ({ name, count }));
    const bodyPartData = Object.entries(bodyPartFrequency).map(([name, count]) => ({ name, count }));

    res.json({
      totalOrders: encounters.length,
      totalRequests,
      modalityFrequency: modalityData,
      bodyPartFrequency: bodyPartData,
      statusDistribution: {
        REQUESTED: encounters.filter((e: any) => !e.imaging_status || e.imaging_status === 'REQUESTED').length,
        'IN PROGRESS': encounters.filter((e: any) => e.imaging_status === 'IN PROGRESS').length,
        COMPLETED: encounters.filter((e: any) => e.imaging_status === 'COMPLETED').length,
        REPORTED: encounters.filter((e: any) => e.imaging_status === 'REPORTED').length
      }
    });
  });

  // --- Billing Routes ---
  app.get('/api/billing/invoices', authenticateToken, (req, res) => {
    res.json(mockDb.invoices);
  });

  app.get('/api/billing/services', authenticateToken, (req, res) => {
    res.json(mockDb.billable_services);
  });

  app.post('/api/billing/invoices', authenticateToken, (req, res) => {
    const { patient_id, name, items, amount } = req.body;
    const newInvoice = {
      id: mockDb.invoices.length + 1,
      encounter_id: null,
      patient_id,
      name,
      amount: Number(amount),
      paid_amount: 0,
      payments: [],
      status: 'UNPAID',
      date: new Date().toISOString().split('T')[0],
      items: items || []
    };
    mockDb.invoices.push(newInvoice as never);
    logAction((req as any).user, 'INVOICE_CREATED', `Created new invoice for ${name} (ID: ${newInvoice.id})`);
    res.status(201).json(newInvoice);
  });

  app.patch('/api/billing/invoices/:id', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const { items, amount, name, patient_id } = req.body;
    const invoice = mockDb.invoices.find((inv: any) => inv.id === id);
    if (invoice) {
      if (items) (invoice as any).items = items;
      if (amount !== undefined) (invoice as any).amount = Number(amount);
      if (name) (invoice as any).name = name;
      if (patient_id) (invoice as any).patient_id = patient_id;
      
      // Recalculate status if amount changed
      if ((invoice as any).paid_amount >= (invoice as any).amount) {
        (invoice as any).status = 'PAID';
      } else if ((invoice as any).paid_amount > 0) {
        (invoice as any).status = 'PARTIALLY PAID';
      } else {
        (invoice as any).status = 'UNPAID';
      }

      logAction((req as any).user, 'INVOICE_UPDATED', `Updated invoice ID ${id}`);
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  });

  app.delete('/api/billing/invoices/:id', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const invoice = mockDb.invoices.find((inv: any) => inv.id === id);
    if (invoice) {
      (invoice as any).status = 'CANCELLED';
      logAction((req as any).user, 'INVOICE_CANCELLED', `Cancelled invoice ID ${id}`);
      res.json({ message: 'Invoice cancelled' });
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  });

  app.patch('/api/billing/invoices/:id/pay', authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const { method, reference_number, amount } = req.body;
    const invoice = mockDb.invoices.find((inv: any) => inv.id === id);
    if (invoice) {
      const payAmount = amount ? Number(amount) : (invoice as any).amount - ((invoice as any).paid_amount || 0);
      (invoice as any).paid_amount = ((invoice as any).paid_amount || 0) + payAmount;
      
      if (! (invoice as any).payments) {
        (invoice as any).payments = [];
      }

      (invoice as any).payments.push({
        method,
        amount: payAmount,
        reference_number: reference_number || null,
        date: new Date().toISOString()
      });

      if ((invoice as any).paid_amount >= (invoice as any).amount) {
        (invoice as any).status = 'PAID';
      } else {
        (invoice as any).status = 'PARTIALLY PAID';
      }

      (invoice as any).payment_method = method;
      (invoice as any).reference_number = reference_number || null;
      logAction((req as any).user, 'PAYMENT_RECORDED', `Processed payment of ${payAmount} for invoice ID ${id} using ${method}`);
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
            
            const historyEntry = {
              id: mockDb.stock_history.length + 1,
              inventory_id: batch.id,
              type: 'REMOVE',
              quantity: dispenseFromBatch,
              reason: `Prescription Dispensed (ID: ${id})`,
              user_name: (req as any).user.fullName || (req as any).user.username,
              created_at: new Date().toISOString()
            };
            mockDb.stock_history.push(historyEntry as never);

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
          paid_amount: 0,
          payments: [],
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
      const change = type === 'ADD' ? Number(adjustment) : -Number(adjustment);
      item.stock += change;
      
      const historyEntry = {
        id: mockDb.stock_history.length + 1,
        inventory_id: id,
        type,
        quantity: Number(adjustment),
        reason,
        user_name: (req as any).user.fullName || (req as any).user.username,
        created_at: new Date().toISOString()
      };
      mockDb.stock_history.push(historyEntry as never);

      logAction((req as any).user, 'STOCK_ADJUSTMENT', 
        `Stock adjusted for ${item.name} (${item.dosage}). Type: ${type}, Quantity: ${adjustment}, New Stock: ${item.stock} ${item.unit}. Reason: ${reason}`);
      
      res.json(item);
    } else {
      res.status(404).json({ message: 'Medication not found' });
    }
  });

  app.get('/api/pharmacy/inventory/:id/history', authenticateToken, (req, res) => {
    const { id } = req.params;
    const history = mockDb.stock_history.filter((h: any) => h.inventory_id === id);
    res.json(history);
  });

  app.post('/api/pharmacy/inventory', authenticateToken, (req, res) => {
    const { name, dosage, stock, maxStock, reorderLevel, unit, category, expiry_date, price_per_unit } = req.body;
    
    const newMedication = {
      id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      name,
      dosage,
      stock: Number(stock),
      maxStock: Number(maxStock),
      reorderLevel: Number(reorderLevel),
      unit,
      category,
      expiry_date,
      price_per_unit: Number(price_per_unit)
    };
    
    mockDb.inventory.push(newMedication as never);

    const historyEntry = {
      id: mockDb.stock_history.length + 1,
      inventory_id: newMedication.id,
      type: 'ADD',
      quantity: Number(stock),
      reason: 'Initial stock on creation',
      user_name: (req as any).user.fullName || (req as any).user.username,
      created_at: new Date().toISOString()
    };
    mockDb.stock_history.push(historyEntry as never);

    logAction((req as any).user, 'MEDICATION_ADDED', `Added new medication: ${name} (${dosage})`);
    res.status(201).json(newMedication);
  });

  app.patch('/api/pharmacy/inventory/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const index = mockDb.inventory.findIndex((item: any) => item.id === id);
    
    if (index !== -1) {
      const updatedMedication = {
        ...mockDb.inventory[index],
        ...req.body,
        id // Ensure ID doesn't change
      };
      
      // Ensure numeric fields are numbers
      if (req.body.stock !== undefined) updatedMedication.stock = Number(req.body.stock);
      if (req.body.maxStock !== undefined) updatedMedication.maxStock = Number(req.body.maxStock);
      if (req.body.reorderLevel !== undefined) updatedMedication.reorderLevel = Number(req.body.reorderLevel);
      if (req.body.price_per_unit !== undefined) updatedMedication.price_per_unit = Number(req.body.price_per_unit);

      mockDb.inventory[index] = updatedMedication as never;
      logAction((req as any).user, 'MEDICATION_UPDATED', `Updated medication: ${updatedMedication.name} (${updatedMedication.dosage})`);
      res.json(updatedMedication);
    } else {
      res.status(404).json({ message: 'Medication not found' });
    }
  });

  // --- General Reporting Routes ---
  app.get('/api/reports/financial', authenticateToken, (req, res) => {
    const invoices = mockDb.invoices;
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const totalCollected = invoices.reduce((sum: number, inv: any) => sum + (inv.paid_amount || 0), 0);
    const totalPending = totalRevenue - totalCollected;

    // Collections by payment method
    const collectionsByMethod: any = {};
    invoices.forEach((inv: any) => {
      if (inv.payments) {
        inv.payments.forEach((p: any) => {
          collectionsByMethod[p.method] = (collectionsByMethod[p.method] || 0) + p.amount;
        });
      }
    });

    // Daily revenue (last 30 days)
    const dailyRevenue: any = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    invoices.forEach((inv: any) => {
      const date = inv.date;
      if (new Date(date) >= thirtyDaysAgo) {
        dailyRevenue[date] = (dailyRevenue[date] || 0) + inv.amount;
      }
    });

    const dailyRevenueData = Object.keys(dailyRevenue).sort().map(date => ({
      date,
      amount: dailyRevenue[date]
    }));

    res.json({
      summary: { totalRevenue, totalCollected, totalPending },
      collectionsByMethod,
      dailyRevenue: dailyRevenueData
    });
  });

  app.get('/api/reports/patients', authenticateToken, (req, res) => {
    const patients = mockDb.patients;
    const totalPatients = patients.length;

    const genderDistribution = {
      MALE: patients.filter((p: any) => p.gender === 'MALE').length,
      FEMALE: patients.filter((p: any) => p.gender === 'FEMALE').length,
      OTHER: patients.filter((p: any) => p.gender === 'OTHER').length
    };

    const ageGroups = {
      '0-12': patients.filter((p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        return age <= 12;
      }).length,
      '13-19': patients.filter((p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        return age > 12 && age <= 19;
      }).length,
      '20-45': patients.filter((p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        return age > 19 && age <= 45;
      }).length,
      '46-65': patients.filter((p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        return age > 45 && age <= 65;
      }).length,
      '65+': patients.filter((p: any) => {
        const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
        return age > 65;
      }).length
    };

    res.json({
      totalPatients,
      genderDistribution,
      ageGroups
    });
  });

  app.get('/api/reports/clinical', authenticateToken, (req, res) => {
    const encounters = mockDb.encounters;
    const totalEncounters = encounters.length;

    const diagnosisCounts: any = {};
    encounters.forEach((e: any) => {
      if (e.diagnosis) {
        diagnosisCounts[e.diagnosis] = (diagnosisCounts[e.diagnosis] || 0) + 1;
      }
    });

    const topDiagnoses = Object.keys(diagnosisCounts)
      .map(name => ({ name, count: diagnosisCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      totalEncounters,
      topDiagnoses
    });
  });

  app.get('/api/reports/daily-summary', authenticateToken, (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Total patients seen today (encounters today)
    const patientsSeenToday = mockDb.encounters.filter(e => {
      const encounterDate = new Date(e.created_at);
      return encounterDate >= startOfToday && encounterDate <= endOfToday;
    }).length;

    // 2. Number of new registrations today
    const newRegistrationsToday = mockDb.patients.filter(p => {
      const registrationDate = new Date(p.created_at);
      return registrationDate >= startOfToday && registrationDate <= endOfToday;
    }).length;

    // 3. Total revenue collected today (sum of all payments made today)
    let revenueCollectedToday = 0;
    mockDb.invoices.forEach(inv => {
      if (inv.payments) {
        inv.payments.forEach(p => {
          const paymentDate = new Date(p.date);
          if (paymentDate >= startOfToday && paymentDate <= endOfToday) {
            revenueCollectedToday += p.amount;
          }
        });
      }
    });

    // 4. Total prescriptions dispensed today
    const prescriptionsDispensedToday = mockDb.pharmacy_prescriptions.filter(p => {
      if (p.status === 'DISPENSED' && p.dispensed_at) {
        const dispensedDate = new Date(p.dispensed_at);
        return dispensedDate >= startOfToday && dispensedDate <= endOfToday;
      }
      return false;
    }).length;

    res.json({
      date: today,
      metrics: {
        patientsSeen: patientsSeenToday,
        newRegistrations: newRegistrationsToday,
        revenueCollected: revenueCollectedToday,
        prescriptionsDispensed: prescriptionsDispensedToday
      }
    });
  });

  // --- Finance & Accounting Routes ---
  app.get('/api/finance/expenses', authenticateToken, (req, res) => {
    res.json(mockDb.expenses);
  });

  app.post('/api/finance/expenses', authenticateToken, (req, res) => {
    const expense = {
      ...req.body,
      id: mockDb.expenses.length + 1,
      created_at: new Date().toISOString()
    };
    mockDb.expenses.push(expense as never);
    logAction((req as any).user, 'EXPENSE_RECORDED', `Recorded expense: ${expense.category} - ${expense.amount} UGX`);
    res.status(201).json(expense);
  });

  app.get('/api/finance/cashbook', authenticateToken, (req, res) => {
    // Cashbook is a combination of all payments (inflow) and expenses (outflow)
    const inflows = mockDb.invoices.flatMap((inv: any) => 
      (inv.payments || []).map((p: any) => ({
        date: p.date,
        description: `Payment for INV-${inv.id.toString().padStart(5, '0')} (${inv.name})`,
        type: 'INFLOW',
        amount: p.amount,
        method: p.method,
        reference: p.reference_number
      }))
    );

    const outflows = mockDb.expenses.map((exp: any) => ({
      date: exp.date,
      description: exp.description,
      type: 'OUTFLOW',
      amount: exp.amount,
      method: exp.payment_method,
      reference: `EXP-${exp.id.toString().padStart(3, '0')}`
    }));

    const cashbook = [...inflows, ...outflows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(cashbook);
  });

  app.get('/api/finance/pl-statement', authenticateToken, (req, res) => {
    // Group income by category (from invoices)
    const incomeByCategory: any = {};
    mockDb.invoices.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        // Simple mapping: if description contains 'Medication' or 'Amoxicillin' etc, it's Pharmacy Income
        const category = item.description.toLowerCase().includes('medication') ? 'Pharmacy Income' : 'Medical Service Income';
        incomeByCategory[category] = (incomeByCategory[category] || 0) + item.amount;
      });
    });

    // Group expenses by category
    const expenseByCategory: any = {};
    mockDb.expenses.forEach((exp: any) => {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
    });

    const totalIncome: number = (Object.values(incomeByCategory) as number[]).reduce((a: number, b: number) => a + b, 0);
    const totalExpenses: number = (Object.values(expenseByCategory) as number[]).reduce((a: number, b: number) => a + b, 0);

    res.json({
      income: incomeByCategory,
      expenses: expenseByCategory,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    });
  });

  app.get('/api/finance/accounts', authenticateToken, (req, res) => {
    res.json(mockDb.accounts);
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
