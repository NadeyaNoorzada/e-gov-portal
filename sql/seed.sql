INSERT INTO departments (name) VALUES 
('Interior'), ('Commerce'), ('Housing') 
ON CONFLICT DO NOTHING; 
-- Sample services 
INSERT INTO services (department_id, name, fee_cents)  
SELECT d.id, s.name, s.fee 
FROM (VALUES 
('Interior','Passport Renewal',5000), 
('Interior','National ID Update',0), 
('Commerce','Business License',20000), 
('Housing','Land Registration',15000) 
) AS s(dep, name, fee) 
JOIN departments d ON d.name = s.dep 
ON CONFLICT DO NOTHING; 
-- Admin user (password: admin123) 
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@egov.local', 
'$2b$10$ftoXZMx0nZ494pcJkNrPqen5GPKRyZ8loF1HUNl8E/2lCXuwVp2Wa', 'Super 
Admin', 'ADMIN') 
ON CONFLICT DO NOTHING;

-- Officer user (password: officer123)
INSERT INTO users (email, password_hash, full_name, role, department_id)
VALUES (
  'officer@egov.local',
  '$2b$10$hu1Ay3grCiXilPQXRcXJT.nKrmwk/7uZPKb8TfZwTIOJsW7mZy3h2', 
  'Default Officer',
  'OFFICER',
  NULL 
)
ON CONFLICT DO NOTHING;
