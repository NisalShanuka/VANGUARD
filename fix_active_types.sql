-- Run this in phpMyAdmin → test1 database → SQL tab
-- This will activate all application types that were supposed to be active

-- First, see current state:
SELECT id, name, is_active FROM application_types ORDER BY name;

-- Then activate the main ones:
UPDATE application_types SET is_active = 1 
WHERE slug IN ('whitelist', 'police', 'medical', 'mechanic', 'fbi', 'government', 'gang', 'business', 'unban');

-- OR activate ALL:
-- UPDATE application_types SET is_active = 1;
