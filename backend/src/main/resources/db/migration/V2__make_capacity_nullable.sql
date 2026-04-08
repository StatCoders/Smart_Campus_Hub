-- Make capacity column nullable for EQUIPMENT type facilities
ALTER TABLE resources ALTER COLUMN capacity DROP NOT NULL;
