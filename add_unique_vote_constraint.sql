-- Migration to prevent duplicate votes per session per turn
-- Run this in your Supabase SQL Editor

-- Add unique constraint to prevent duplicate votes from same session on same turn
ALTER TABLE votes
ADD CONSTRAINT unique_vote_per_session_per_turn
UNIQUE (turn_id, voter_session);

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'votes'::regclass
AND contype = 'u';