# ATS Semantic Analysis Microservice

Python Flask microservice that provides SBERT (Sentence-BERT) embeddings for semantic similarity analysis in the ResuMind AI ATS feature.

## Requirements

- Python 3.8 or higher
- pip (Python package manager)

## Installation

### 1. Navigate to the service directory

```bash
cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI\ats-semantic-service
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

**Note:** On first installation, the `sentence-transformers` package will download the SBERT model (~500MB). Ensure you have a stable internet connection.

## Running the Service

### Start the microservice

```bash
python app.py
```

The service will start on **http://localhost:5001**

You should see output like:
```
============================================================
ATS Semantic Analysis Microservice
============================================================
Loading SBERT model: sentence-transformers/all-MiniLM-L6-v2
This may take a few minutes on first run (downloading ~500MB)...
✓ Model loaded successfully!
Starting Flask server on http://localhost:5001
Press CTRL+C to stop the server
============================================================
```

### Verify the service is running

Open a browser and navigate to:
- **Health check:** http://localhost:5001/health
- **Service info:** http://localhost:5001/

You should see JSON responses indicating the service is ready.

## API Endpoints

### GET /health

Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "healthy",
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "ready": true
}
```

### POST /embeddings

Generate SBERT embeddings for input texts.

**Request:**
```json
{
  "inputs": ["Resume text here", "Job description here"]
}
```

**Response:**
```json
[
  [0.123, 0.456, ...],  // 384-dimensional embedding for text 1
  [0.789, 0.012, ...]   // 384-dimensional embedding for text 2
]
```

### GET /

Service information endpoint.

## Usage with ResuMind AI

1. **Start this microservice first:**
   ```bash
   cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI\ats-semantic-service
   python app.py
   ```

2. **Then start the main Node.js application:**
   ```bash
   cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI
   npm run dev
   ```

3. **Use the Resume Screening feature:**
   - Navigate to the Resume Screening page
   - Upload a resume and paste a job description
   - Click "Analyze Resume"
   - The system will use this microservice for semantic analysis

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'flask'`

**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

### Issue: Model download fails

**Solution:** 
- Ensure you have a stable internet connection
- Check if you have ~500MB of free disk space
- Try running again - the download will resume if interrupted

### Issue: Port 5001 already in use

**Solution:** 
- Stop any other service using port 5001
- Or modify the port in `app.py` (line 143) and update the `.env` file in the main application

### Issue: Service returns 503 (Service Unavailable)

**Solution:** 
- The model failed to load
- Check the console output for error messages
- Restart the service

## Technical Details

- **Model:** `sentence-transformers/all-MiniLM-L6-v2`
- **Embedding Dimension:** 384
- **Framework:** Flask with CORS enabled
- **Inference:** CPU-based (GPU optional, will auto-detect if available)

## Stopping the Service

Press `CTRL+C` in the terminal where the service is running.
