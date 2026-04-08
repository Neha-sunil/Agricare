# AgriCare AI Backend (FastAPI)

Complete backend system with AI-powered Pre-Care and Voice Assistant.

## Features
- **AI Planner**: Farm profile creation and crop recommendation.
- **AI Tracker**: Step-by-step pre-care plans and weekly task manager.
- **AI Voice Assistant**: Context-aware queries and intent detection.
- **Scalable Structure**: Modular services and AI-ready placeholders.

## Technology Stack
- **Python** (FastAPI)
- **MongoDB** (Async with Motor)
- **Pydantic** (Models & Validation)

## Getting Started

### 1. Prerequisites
- Python 3.10+
- MongoDB (Running locally or on Atlas)

### 2. Setup Environment
```bash
# Navigate to backend directory
cd backend_fastapi

# Create virtual environment
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python main.py
```
Or use uvicorn directly:
```bash
uvicorn backend_fastapi.main:app --reload
```

## API Endpoints

### AI Planner
- `POST /api/precare/profile`: Save farm details.
- `POST /api/precare/recommend`: Get crop recommendations.
- `POST /api/precare/select-crop`: Select a crop.

### AI Tracker
- `POST /api/precare/generate-plan`: Create fertilization/irrigation plans.
- `POST /api/precare/generate-tasks`: Break down plan into weeks.
- `GET /api/dashboard/{profile_id}`: Comprehensive dashboard with progress.
- `PATCH /api/precare/task/{task_id}`: Mark tasks complete.

### Voice Assistant
- `POST /api/assistant/query`: Send queries from voice input.

## Project Structure
- `config/`: Configuration & DB connection.
- `models/`: Pydantic & MongoDB models.
- `routes/`: FastAPI routers.
- `services/`: AI logic and specialized services.
- `ai_models/`: Vision and ML model placeholders.
- `utils/`: Utility functions.
