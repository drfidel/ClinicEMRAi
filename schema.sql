-- Database Schema for Uganda Clinic EMR

-- Users & Roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST', 'RECEPTIONIST');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    patient_id TEXT UNIQUE NOT NULL, -- e.g., UGN-2024-0001
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    phone_number TEXT,
    address TEXT,
    next_of_kin_name TEXT,
    next_of_kin_relationship TEXT,
    next_of_kin_phone TEXT,
    insurance_provider TEXT,
    insurance_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments & Triage
CREATE TYPE appointment_status AS ENUM ('WAITING', 'TRIAGE', 'CONSULTATION', 'LAB', 'PHARMACY', 'BILLING', 'COMPLETED', 'CANCELLED');

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    status appointment_status DEFAULT 'WAITING',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vitals (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    patient_id INTEGER REFERENCES patients(id),
    nurse_id INTEGER REFERENCES users(id),
    temperature DECIMAL(4,2), -- Celsius
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    oxygen_saturation INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinical Encounters
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    symptoms TEXT,
    diagnosis TEXT,
    notes TEXT,
    icd10_codes TEXT[], -- Array of codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacy
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    stock_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    reorder_level INTEGER DEFAULT 10
);

CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    medication_id INTEGER REFERENCES medications(id),
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    is_dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab
CREATE TABLE lab_tests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE lab_orders (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id),
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    test_id INTEGER REFERENCES lab_tests(id),
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_results (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES lab_orders(id),
    tech_id INTEGER REFERENCES users(id),
    result_data TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing
CREATE TYPE payment_method AS ENUM ('CASH', 'MTN_MOMO', 'AIRTEL_MONEY', 'INSURANCE');

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id),
    patient_id INTEGER REFERENCES patients(id),
    total_amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    method payment_method NOT NULL,
    transaction_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
