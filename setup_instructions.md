# Setup Instructions for OpenRouter Blind Voting System

## Quick Setup Checklist

### 1. 📊 Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually 2-3 minutes)
3. Go to the SQL Editor in your Supabase dashboard
4. Copy and paste the contents of `supabase_schema.sql` and run it
5. Go to Settings → API to find your project URL and anon key

### 2. 🔑 Update API Keys

Edit these two files and replace the placeholder keys:

**In `voting_interface.html` (line 182):**
```javascript
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

**In `analytics_dashboard.html` (line 159):**
```javascript
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

### 3. 📦 Install Python Dependencies

```bash
pip install supabase==2.8.0 python-dotenv==1.0.0
```

### 4. 📥 Import Your Data

```bash
# Set your Supabase key as environment variable
export SUPABASE_KEY="your_supabase_anon_key_here"

# Import a single conversation file
python parse_openrouter_md.py "path/to/OpenRouter Chat.md"

# Or import all .md files in a directory
python parse_openrouter_md.py "path/to/exports/"
```

### 5. 🚀 Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages in your GitHub repository
4. Select "Deploy from a branch" and choose "main"
5. Your site will be available at `https://your-username.github.io/your-repo-name`

## File Structure After Setup

```
your-repo/
├── index.html                    # Landing page ✅
├── voting_interface.html         # Main voting interface ✅
├── analytics_dashboard.html      # Results analytics ✅
├── parse_openrouter_md.py       # Data import script ✅
├── supabase_schema.sql          # Database schema ✅
├── requirements.txt             # Python dependencies ✅
├── README.md                    # Documentation ✅
└── .env.example                 # Environment variables example ✅
```

## Testing Your Setup

1. **Test the parser**: `python test_parser.py`
2. **Import sample data**: `python parse_openrouter_md.py "sample.md"`
3. **Open voting interface**: Open `voting_interface.html` in your browser
4. **Verify data loads**: Select a conversation from the dropdown
5. **Cast test votes**: Vote on a few responses
6. **Check analytics**: Open `analytics_dashboard.html` to see results

## Troubleshooting

### Parser Issues
- **"No valid turns found"**: Check that your markdown has `**User - --**` and `**Assistant - --**` markers
- **"Expected 4 responses"**: Ensure each user prompt has exactly 4 assistant responses

### Database Issues
- **"Failed to load conversations"**: Check your Supabase URL and API key
- **"Table doesn't exist"**: Make sure you ran the SQL schema script
- **"RLS policy error"**: The schema includes permissive policies for testing

### Interface Issues
- **"Loading conversations..."**: Check browser console for API errors
- **Votes not saving**: Verify Supabase credentials and database schema
- **Analytics not loading**: Ensure votes exist in the database

## Model Order Reference

Your OpenRouter exports should have responses in this exact order:

1. **Position 1** → `google/gemini-2.5-pro`
2. **Position 2** → `anthropic/claude-sonnet-4.5`
3. **Position 3** → `openai/gpt-4.1`
4. **Position 4** → `openai/gpt-5`

The system will automatically randomize these positions in the voting interface.

## Next Steps

1. Import your conversation data
2. Share the voting link with colleagues
3. Collect votes over time
4. Analyze results in the dashboard
5. Use insights to inform your AI tool decisions

## Support

If you run into issues:
1. Check the browser console for JavaScript errors
2. Verify all Supabase credentials are correct
3. Test the parser with `python test_parser.py`
4. Check that database tables were created properly

Your blind voting system is now ready! 🎉