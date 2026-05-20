# 🚀 Quick Start Guide - ATS Resume Screening with Python Microservice

## ⚡ Fast Setup (First Time)

### Step 1: Install Python Dependencies

```bash
cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI\ats-semantic-service
pip install -r requirements.txt
```

> **Note:** First installation downloads ~500MB SBERT model. This only happens once!

### Step 2: Start Python Microservice (Terminal 1)

```bash
cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI\ats-semantic-service
python app.py
```

**Wait for:**
```
✓ Model loaded successfully!
Starting Flask server on http://localhost:5001
```

### Step 3: Start Main Application (Terminal 2)

```bash
cd c:\ResuMindAI (2)\ResuMindAI\ResuMindAI
npm run dev
```

---

## 🧪 Testing the Feature

1. **Open the application** in your browser (check Terminal 2 for URL)

2. **Navigate to Resume Screening** page

3. **Upload a resume:**
   - Click "Upload Your Resume"
   - Select a PDF or DOCX file (max 10MB)

4. **Paste a job description:**
   - Copy a job posting
   - Paste into the "Job Description" field
   - Optionally add the job role

5. **Click "Analyze Resume"**

6. **Watch the progress:**
   - Text Extraction ✓
   - Keyword Analysis ✓
   - Semantic Analysis (SBERT) ✓
   - Generating Report ✓

7. **Explore the Dashboard:**
   - **Overview Tab:** See the final ATS score and comparison
   - **Keywords Tab:** View matched/missing keywords with heatmap
   - **Semantic Tab:** See semantic similarity analysis
   - **Recommendations Tab:** Get actionable improvement suggestions

8. **Export Results:**
   - Click "Export Report" button
   - Download JSON file with complete analysis

---

## ✅ What to Verify

### Python Service Health Check
Visit: `http://localhost:5001/health`

**Expected response:**
```json
{
  "status": "healthy",
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "ready": true
}
```

### Dual Scoring System
- **Keyword Score:** Based on TF-IDF keyword matching
- **Semantic Score:** Based on SBERT embeddings (Python service)
- **Final Score:** Weighted combination (60% keyword + 40% semantic)

### Progress Tracking
All 4 analysis phases should display in sequence:
1. Text Extraction
2. Keyword Analysis
3. Semantic Analysis (SBERT)
4. Generating Report

---

## 🐛 Troubleshooting

### Python service fails to start

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
cd ats-semantic-service
pip install -r requirements.txt
```

---

### ATS analysis shows "Fallback mode"

**Cause:** Python microservice not running

**Solution:**
1. Open a new terminal
2. `cd ats-semantic-service`
3. `python app.py`
4. Wait for "Model loaded successfully!"
5. Try analysis again

---

### Port 5001 already in use

**Error:** `Address already in use`

**Solution Option 1:** Find and kill the process using port 5001

**Solution Option 2:** Change the port in `ats-semantic-service/app.py`:
```python
# Line 143
app.run(
    host='0.0.0.0',
    port=5002,  # Change this
    ...
)
```

Then update `.env`:
```env
PYTHON_SERVICE_URL=http://localhost:5002
```

---

## 📊 Score Interpretation

| Score Range | Meaning | Color |
|------------|---------|-------|
| 80-100 | Excellent match | 🟢 Green |
| 60-79 | Good match, room for improvement | 🟡 Yellow |
| 0-59 | Low match, needs optimization | 🔴 Red |

---

## 💡 Tips for Better Results

1. **Use complete job descriptions** - More details = better analysis
2. **Upload clean resumes** - Well-formatted PDFs work best
3. **Check both scores** - Semantic analysis catches contextual matches keyword analysis might miss
4. **Review recommendations** - Focus on high-priority items first
5. **Export and compare** - Analyze against multiple JDs to find the best fit

---

## 🎯 Next Steps

- Test with different resumes and job descriptions
- Compare keyword vs semantic scores
- Explore the recommendation system
- Try the export functionality

**Need help?** Check the detailed [walkthrough.md](file:///C:/Users/Swayam/.gemini/antigravity/brain/7952bfde-3fdf-4892-80b4-20d228390729/walkthrough.md) for technical details!
