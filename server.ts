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
  ],
  patients: [],
  appointments: [],
  vitals: [],
  encounters: [],
};

const JWT_SECRET = process.env.JWT_SECRET || 'uganda-emr-secret-key';

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
    res.status(201).json(patient);
  });

  app.delete('/api/patients/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockDb.patients.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      mockDb.patients.splice(index, 1);
      res.sendStatus(204);
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
    res.status(201).json(appointment);
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

    // Update appointment status to COMPLETED (or LAB/PHARMACY if needed)
    const appt = mockDb.appointments.find((a: any) => a.id === Number(appointment_id));
    if (appt) (appt as any).status = 'COMPLETED';

    res.status(201).json(encounter);
  });

  // --- Patient Encounters ---
  app.get('/api/encounters/:patient_id', authenticateToken, (req, res) => {
    const encounters = mockDb.encounters.filter((e: any) => e.patient_id === req.params.patient_id);
    // Join with vitals
    const joinedEncounters = encounters.map((e: any) => ({
      ...e,
      vitals: mockDb.vitals.find((v: any) => v.id === e.vitals_id)
    }));
    res.json(joinedEncounters);
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
