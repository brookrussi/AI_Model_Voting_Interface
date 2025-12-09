-- Complete Test Data Cleanup Script
-- Run this in Supabase SQL Editor to clear all test votes and start fresh
-- WARNING: This will delete ALL votes but keep conversations and responses

-- First, let's see what we're about to delete
SELECT
    'BEFORE CLEANUP:' as status,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(DISTINCT voter_session) FROM votes) as unique_sessions,
    (SELECT COUNT(*) FROM conversations) as conversations,
    (SELECT COUNT(*) FROM turns) as turns,
    (SELECT COUNT(*) FROM responses) as responses;

-- Show sample of votes to be deleted
SELECT
    'Sample votes to delete:' as info,
    v.voter_session,
    t.turn_number,
    c.title,
    v.position,
    v.voted_at,
    CASE WHEN v.notes IS NOT NULL AND v.notes != '' THEN 'Has notes' ELSE 'No notes' END as notes_status
FROM votes v
JOIN turns t ON v.turn_id = t.id
JOIN conversations c ON t.conversation_id = c.id
ORDER BY v.voted_at DESC
LIMIT 10;

-- Delete all test votes (this preserves conversations, turns, responses)
DELETE FROM votes;

-- Verify cleanup completed
SELECT
    'AFTER CLEANUP:' as status,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(*) FROM conversations) as conversations_kept,
    (SELECT COUNT(*) FROM turns) as turns_kept,
    (SELECT COUNT(*) FROM responses) as responses_kept;

-- Success message
SELECT 'Cleanup complete! All test votes removed, conversation data preserved.' as result;