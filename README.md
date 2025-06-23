# SCREENSHOCK.me

**If you get distracted, AI zaps you!**

Screenshock.me is a web application that helps you stay focused by monitoring your screen activity and delivering negative stimulus when you stray from your goals. Using AI-powered analysis, it can detect when you're browsing distracting websites or doing activities you want to avoid.

## Features

- 📸 **Real-time Screen Monitoring**: Captures screenshots every second while you work
- 🤖 **AI-Powered Analysis**: Uses Google's Gemini AI to analyze your activity
- ⚡ **Multiple Stimulus Options**: Supports computer beeps, Pavlok zaps, vibration, and beeps
- 🎯 **Custom Focus Goals**: Define what you want to focus on and what to avoid
- 📊 **Focus Duration Tracking**: See how long you've maintained focus
- 🔍 **Debug Mode**: View captured screenshots and AI analysis for transparency
- 🛡️ **Privacy-First**: Completely stateless backend, no data storage
- 📱 **Responsive Design**: Works on desktop and mobile devices

## How It Works

1. **Describe Your Goals**: Tell the app what you're trying to focus on and what distractions to avoid
2. **Choose Your Stimulus**: Select from computer beep, Pavlok zap, Pavlok beep, or Pavlok vibration
3. **Grant Screen Access**: Allow the browser to capture your screen (like a video call)
4. **Stay Focused**: The AI monitors your activity every second
5. **Get Zapped**: If you stray from focus, receive immediate negative stimulus

The AI is designed to be:
- **Conservative**: Better to miss a distraction than to incorrectly punish focused work
- **Context-Aware**: Understands the difference between seeing a distraction and actively engaging with it
- **Supportive**: Allows research and reference materials that support your focus goals

## Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **Lucide Icons**: Beautiful, consistent iconography
- **Screen Capture API**: Browser-native screen recording
- **CSS3 Animations**: Rainbow-themed, eclectic design

### Backend
- **Django 4.2**: Python web framework
- **BAML + Gemini AI**: AI-powered focus analysis
- **Pavlok API**: Hardware stimulus delivery
- **CORS Support**: Cross-origin requests for development

### Deployment
- **Docker**: Single container deployment
- **Django Static Files**: Serves React build files and static assets
- **Production Ready**: One container, one process, simple deployment

## Development Setup

### Prerequisites
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Install uv** (if not already installed):
```bash
# On macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

2. **Install dependencies**:
```bash
cd backend
uv sync
```

3. **Set environment variables**:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export DEBUG=True
```

4. **Generate BAML client**:
```bash
uv run python generate_baml.py
```

5. **Run Django server**:
```bash
uv run python manage.py runserver 8000
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Start development server**:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and proxy API requests to the Django backend at `http://localhost:8000`.

### Why uv?

We use [uv](https://docs.astral.sh/uv/) instead of pip/virtualenv because:
- **Faster**: 10-100x faster than pip for dependency resolution and installation
- **Reliable**: Lock files ensure reproducible builds across environments  
- **Simple**: Single tool for dependency management, virtual environments, and script execution
- **Modern**: Built in Rust with modern Python packaging standards

### Environment Variables

#### Required for AI Analysis
- `GEMINI_API_KEY`: Your Google AI API key for Gemini

#### Optional for Production
- `SECRET_KEY`: Django secret key (auto-generated if not provided)
- `DEBUG`: Set to `False` for production

#### Optional for Pavlok Integration
Users provide their Pavlok API tokens through the UI - no server-side configuration needed.

## Production Deployment

### Docker (Recommended)

1. **Build and run single container**:
```bash
# Build the Docker image
docker build -t screenshock .

# Run the container
docker run -d \
  -p 8000:8000 \
  -e GEMINI_API_KEY=your-api-key \
  -e SECRET_KEY=your-secret-key \
  --name screenshock \
  screenshock
```

2. **Or use environment file**:
```bash
# Create .env file
echo "GEMINI_API_KEY=your-api-key" > .env
echo "SECRET_KEY=your-secret-key" >> .env

# Run with environment file
docker run -d -p 8000:8000 --env-file .env --name screenshock screenshock
```

### Manual Deployment

1. **Build frontend**:
```bash
cd frontend
npm run build
```

2. **Configure Django for production**:
```bash
cd backend
export DEBUG=False
export SECRET_KEY="your-production-secret-key"
uv sync --no-dev
uv run python manage.py collectstatic --noinput
```

3. **Run production server**:
```bash
uv run gunicorn screenshock.wsgi:application --bind 0.0.0.0:8000
```

## API Endpoints

### POST `/api/monitor/`

Analyzes a screenshot for focus adherence.

**Request Body**:
```json
{
  "base64_encoded_image": "base64-string",
  "focus_description": "I'm trying to write an essay but avoid Reddit and YouTube",
  "pavlok_token": "optional-pavlok-api-token"
}
```

**Response**:
```json
{
  "negative_stimulus": false,
  "analysis": "User appears to be focused on writing in a text editor",
  "confidence": 0.95,
  "distraction_details": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Privacy & Security

- **No Data Storage**: The backend is completely stateless with no database
- **No User Accounts**: No login or authentication required
- **Local Processing**: Screenshots are analyzed in real-time and not stored
- **API Key Privacy**: Pavlok tokens are provided by users and not stored server-side
- **HTTPS Ready**: SSL/TLS configuration available for production

## Pavlok Integration

Screenshock.me supports [Pavlok](https://pavlok.com) devices for physical stimulus delivery:

1. **Get your Pavlok API token** from your Pavlok account
2. **Select a Pavlok option** in the stimulus configuration
3. **Enter your token** when prompted
4. **Receive zaps, beeps, or vibrations** when you get distracted

Supported stimulus types:
- `zap`: Electrical stimulus (intensity 1-100)
- `beep`: Audio beep through Pavlok
- `vibe`: Vibration stimulus

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Acknowledgments

- Built with [BAML](https://github.com/boundaryml/baml) for AI integration
- Powered by Google's Gemini AI
- Pavlok integration for habit formation
- Inspired by behavioral psychology and positive reinforcement techniques

---

**Remember**: The goal is to build better focus habits, not to punish yourself. Use Screenshock.me as a tool for awareness and gentle course correction on your path to better productivity.