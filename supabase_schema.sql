-- Blind Model Voting Database Schema for Supabase
-- This schema stores OpenRouter conversations and enables blind voting

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Conversations table - metadata about each imported conversation
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    source_file TEXT, -- original filename if from markdown
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- additional data like export date, etc.
);

-- Turns table - each user prompt in the conversation
CREATE TABLE turns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    user_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, turn_number)
);

-- Model responses - stores the actual responses with model identity
CREATE TABLE responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turn_id UUID REFERENCES turns(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL, -- 'gemini-2.5-pro', 'claude-sonnet-4.5', 'gpt-4.1', 'gpt-5'
    response_text TEXT NOT NULL,
    response_order INTEGER NOT NULL, -- 1-4, order in original markdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turn_id, model_name),
    UNIQUE(turn_id, response_order)
);

-- Response positions - randomized A/B/C/D mapping per turn
CREATE TABLE response_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turn_id UUID REFERENCES turns(id) ON DELETE CASCADE,
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    position CHAR(1) NOT NULL CHECK (position IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turn_id, response_id),
    UNIQUE(turn_id, position)
);

-- Votes table - user votes on responses
CREATE TABLE votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turn_id UUID REFERENCES turns(id) ON DELETE CASCADE,
    position CHAR(1) NOT NULL CHECK (position IN ('A', 'B', 'C', 'D')),
    voter_session TEXT, -- simple session tracking
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    -- Prevent duplicate votes from same session on same turn
    UNIQUE(turn_id, voter_session)
);

-- Create indexes for better query performance
CREATE INDEX idx_turns_conversation ON turns(conversation_id);
CREATE INDEX idx_responses_turn ON responses(turn_id);
CREATE INDEX idx_response_positions_turn ON response_positions(turn_id);
CREATE INDEX idx_votes_turn ON votes(turn_id);
CREATE INDEX idx_votes_position ON votes(turn_id, position);

-- View to get voting results with model identity
CREATE VIEW vote_results AS
SELECT
    c.title as conversation_title,
    t.turn_number,
    t.user_prompt,
    r.model_name,
    rp.position,
    COUNT(v.id) as vote_count,
    r.response_text
FROM conversations c
JOIN turns t ON c.id = t.conversation_id
JOIN responses r ON t.id = r.turn_id
JOIN response_positions rp ON r.id = rp.response_id
LEFT JOIN votes v ON t.id = v.turn_id AND rp.position = v.position
GROUP BY c.id, c.title, t.turn_number, t.user_prompt, r.model_name, rp.position, r.response_text
ORDER BY c.title, t.turn_number, rp.position;

-- View for anonymous voting interface (no model names exposed)
CREATE VIEW voting_interface AS
SELECT
    c.id as conversation_id,
    c.title as conversation_title,
    t.id as turn_id,
    t.turn_number,
    t.user_prompt,
    rp.position,
    r.response_text,
    COUNT(v.id) as current_votes
FROM conversations c
JOIN turns t ON c.id = t.conversation_id
JOIN response_positions rp ON t.id = rp.turn_id
JOIN responses r ON rp.response_id = r.id
LEFT JOIN votes v ON t.id = v.turn_id AND rp.position = v.position
GROUP BY c.id, c.title, t.id, t.turn_number, t.user_prompt, rp.position, r.response_text
ORDER BY c.title, t.turn_number, rp.position;

-- Enable RLS policies (optional - for basic security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all operations for now - adjust as needed)
CREATE POLICY "Allow all operations on conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on turns" ON turns FOR ALL USING (true);
CREATE POLICY "Allow all operations on responses" ON responses FOR ALL USING (true);
CREATE POLICY "Allow all operations on response_positions" ON response_positions FOR ALL USING (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true);