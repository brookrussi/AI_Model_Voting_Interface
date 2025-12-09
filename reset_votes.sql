-- Reset Script for Testing
-- Run this in Supabase SQL Editor to clear test votes
-- WARNING: This will delete ALL votes and keep conversations

-- Delete all votes (but keep conversations and responses)
DELETE FROM votes;

-- Optional: Reset auto-increment if needed
-- ALTER SEQUENCE votes_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT
    (SELECT COUNT(*) FROM conversations) as conversations_count,
    (SELECT COUNT(*) FROM turns) as turns_count,
    (SELECT COUNT(*) FROM responses) as responses_count,
    (SELECT COUNT(*) FROM votes) as votes_count;

-- Result should show: conversations/turns/responses intact, votes = 0