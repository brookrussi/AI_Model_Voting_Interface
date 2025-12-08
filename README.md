# OpenRouter Blind Voting System

A web-based tool for conducting blind comparisons of AI model responses to eliminate evaluation bias. Import conversations from OpenRouter, randomize response positions, and let users vote on the best responses without knowing which model generated them.

## 🎯 Features

- **Blind Voting**: Response positions are randomized per turn to prevent model bias
- **Multi-Model Support**: Compares Gemini 2.5 Pro, Claude Sonnet 4.5, GPT-4.1, and GPT-5
- **Analytics Dashboard**: Comprehensive performance metrics and visualizations
- **Easy Import**: Parse OpenRouter markdown exports automatically
- **Secure Storage**: Uses Supabase for reliable data persistence
- **Mobile Friendly**: Responsive design works on all devices
- **GitHub Pages Ready**: Deploy easily with static hosting

## 🚀 Quick Start

### 1. Database Setup

Create a new Supabase project and run the schema:

```sql
-- Copy and paste the contents of supabase_schema.sql in your Supabase SQL editor
```

### 2. Configuration

Update the Supabase credentials in both HTML files:

```javascript
// Replace in voting_interface.html and analytics_dashboard.html
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key_here';
```

### 3. Import Data

Install Python dependencies and run the parser:

```bash
pip install -r requirements.txt

# Parse a single file
python parse_openrouter_md.py "path/to/chat.md" --supabase-key YOUR_KEY

# Parse a directory of files
python parse_openrouter_md.py "path/to/exports/" --supabase-key YOUR_KEY
```

### 4. Deploy

Deploy to GitHub Pages or any static hosting:

```bash
git add .
git commit -m "Deploy blind voting system"
git push origin main
```

Then enable GitHub Pages in your repository settings.

## 📁 File Structure

```
├── index.html                  # Landing page
├── voting_interface.html       # Blind voting interface
├── analytics_dashboard.html    # Performance analytics
├── parse_openrouter_md.py     # Python parser script
├── supabase_schema.sql        # Database schema
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🗃️ Database Schema

The system uses 5 main tables:

- **conversations**: Conversation metadata
- **turns**: User prompts for each turn
- **responses**: Model responses with true identity
- **response_positions**: Randomized A/B/C/D mappings
- **votes**: User votes on responses

## 📊 Model Mapping

The parser expects responses in this exact order from OpenRouter exports:

1. **Position 1**: `google/gemini-2.5-pro`
2. **Position 2**: `anthropic/claude-sonnet-4.5`
3. **Position 3**: `openai/gpt-4.1`
4. **Position 4**: `openai/gpt-5`

## 🔧 Usage

### Importing Conversations

```bash
# Set environment variable for convenience
export SUPABASE_KEY="your_supabase_key"

# Import single conversation
python parse_openrouter_md.py "OpenRouter Chat Wed Dec 03 2025.md"

# Import all conversations in directory
python parse_openrouter_md.py "./exports/"
```

### Voting Process

1. Users select a conversation from the dropdown
2. Each turn shows 4 responses labeled A, B, C, D
3. Users click to select their preferred response
4. Votes are recorded with session tracking
5. Position mapping is randomized per turn

### Analytics

The dashboard provides:

- Overall vote distribution
- Win rates by model
- Performance trends over time
- Conversation-specific breakdowns
- Detailed statistics tables

## 🎛️ Environment Variables

For the Python parser:

```bash
export SUPABASE_KEY="your_supabase_anon_key"
export SUPABASE_URL="https://your-project.supabase.co"  # Optional, uses default
```

## 📱 Responsive Design

The interface adapts to different screen sizes:

- **Desktop**: 4-column grid for responses
- **Tablet**: 2-column grid
- **Mobile**: Single column layout

## 🔒 Security Notes

- Uses Supabase Row Level Security (RLS)
- Anonymous voting with session tracking
- No authentication required for voting
- Admin access needed for data import

## 🐛 Troubleshooting

### Common Issues

**Parser fails to find responses:**
- Check that markdown has exact format: `**User - --**` and `**Assistant - --**`
- Ensure exactly 4 assistant responses per user prompt
- Verify file encoding is UTF-8

**Voting interface won't load:**
- Verify Supabase credentials are correct
- Check browser console for API errors
- Ensure database schema is properly created

**No data in analytics:**
- Confirm conversations were imported successfully
- Check that votes have been cast
- Verify database views are created properly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com/) for backend
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Designed for [OpenRouter](https://openrouter.ai/) exports