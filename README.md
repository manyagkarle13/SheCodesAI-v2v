# SakhiPause – Your AI Companion Through Menopause

**The Idea:**
Women's health technology has almost entirely overlooked menopause and perimenopause — every mainstream app targets 18–25 year olds and regular period tracking. SakhiPause is built specifically for women navigating menopause (typically ages 40–55), addressing three real gaps: the difficulty of explaining symptoms clearly to doctors, the lack of accessible plain-language health information, and the awkwardness of asking a workplace for reasonable accommodations. SakhiPause tracks symptoms using the **Menopause Rating Scale (MRS)** — the same clinically validated scale doctors use worldwide — and turns that data into doctor-ready reports and AI-drafted workplace support letters.

## Important Links

- **Live Deployment Link:** https://sakhipause.netlify.app
- **Demo Video Link:** https://drive.google.com/file/d/1pUrgvgdzE4pQwEOnJRjQ8HyNHMSFeYo1/view?usp=sharing
- **Backend API:** https://sakhipause-backend.onrender.com

## Features

- **Clinical Symptom Logging** — Daily symptom tracker covering all 11 official MRS categories (hot flashes, sleep problems, mood, anxiety, physical exhaustion, joint/muscle pain, bladder problems, dryness, sexual problems, heart discomfort) rated on a validated 0–4 severity scale.
- **Real-Time MRS Scoring** — Automatically calculates a clinically recognized Menopause Rating Scale score (None/Mild/Moderate/Severe), the same scale used in medical research and practice — not an invented metric.
- **Trends Dashboard** — Visualizes MRS score and individual symptom severity over time, helping users spot patterns and track whether their symptoms are improving or worsening.
- **Ask Sakhi AI** — A conversational health assistant that answers menopause-related questions in plain, supportive language, always encouraging users to consult a real healthcare provider for diagnosis or treatment decisions.
- **Doctor Visit Summary Generator** — Compiles 30 days of logged symptom data into a clean, clinical-style report a user can bring to their doctor, removing the burden of remembering and explaining symptoms from memory under time pressure.
- **Workplace Accommodation Letter Generator** — Auto-drafts a respectful, professional email requesting reasonable workplace accommodations (e.g. flexible hours, temperature control) based on the user's actual logged symptom data — a feature that does not exist in any comparable app.
- **History for Doctor Summaries & Workplace Letters** — Past generated reports and letters are saved and retrievable, so users can revisit or reuse previous documentation.

## Tech Stack & Tools

- **Frontend:** React + Vite, TailwindCSS
- **Backend:** Django REST Framework
- **Database:** PostgreSQL (hosted on Neon)
- **Authentication:** JWT-based auth (djangorestframework-simplejwt)
- **AI:** Groq API (LLM) for the Ask Sakhi AI assistant, Doctor Summary generation, and Workplace Letter generation
- **Deployment:** Render (backend), Netlify (frontend)
- **AI-Assisted Development:** Claude and Antigravity IDE .

## Documentation

### How It Works

SakhiPause follows a simple, repeatable loop designed around daily use:

1. **Log** — The user logs today's symptoms via sliders mapped to the 11 official MRS categories.
2. **Score** — The backend calculates a total MRS score (sum of all 11 category severities) and classifies it into a standard severity band (None–Little / Mild / Moderate / Severe), following the real clinical scoring thresholds used by the Menopause Rating Scale.
3. **Visualize** — Logged entries are aggregated over time and rendered as trend charts, showing both overall score progression and per-symptom breakdowns.
4. **Support** — Using the accumulated symptom data, the user can:
   - Ask the AI assistant plain-language questions about what they're experiencing
   - Generate a doctor-ready summary report for their next appointment
   - Generate a professional workplace accommodation request letter

### AI Coordination

We used three separate LLM-powered features, each with a tightly scoped system prompt to keep outputs safe, relevant, and non-diagnostic:

- **Ask Sakhi AI** uses a supportive-assistant system prompt instructing the model to explain concepts simply, avoid medical jargon, never diagnose, and consistently direct the user toward professional care for serious concerns.
- **Doctor Summary** pulls the user's last 30 days of logged data, calculates aggregate MRS statistics server-side (not by the LLM, to ensure accuracy), and only passes the LLM the final structured data to generate the narrative summary paragraph — keeping the clinical scoring deterministic and rule-based while using AI purely for natural-language formatting.
- **Workplace Letter** follows the same pattern: real logged symptom data plus optional user-provided context (job role, specific concerns) is passed to the LLM with a prompt constrained to produce a respectful, professional, non-medical-sounding accommodation request.

### API Reference

The backend is a Django REST Framework API deployed separately from the frontend at `https://sakhipause-backend.onrender.com`. Visiting the bare backend URL directly will show a JSON status message confirming the API is running — this is expected, since the backend has no visual interface of its own and is only meant to be consumed by the frontend application.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health/` | GET | Health check — confirms the API is live |
| `/api/auth/register/` | POST | Create a new user account |
| `/api/auth/login/` | POST | Authenticate and receive JWT tokens |
| `/api/symptoms/log/` | POST | Submit a daily symptom log entry |
| `/api/symptoms/history/` | GET | Retrieve the logged-in user's symptom history |
| `/api/symptoms/mrs-score/` | GET | Get the current MRS score and severity classification |
| `/api/symptoms/trends/` | GET | Get aggregated weekly trend data for charting |
| `/api/chat/ask/` | POST | Send a question to the Ask Sakhi AI assistant |
| `/api/summary/doctor-report/` | GET | Generate a doctor-ready clinical summary |
| `/api/workplace/generate-letter/` | POST | Generate a workplace accommodation request letter |

All endpoints except registration and login require a valid JWT token in the `Authorization` header. The complete, always up-to-date list of registered routes can be found in `Backend/sakhipause_backend/urls.py`.

### Why This Matters

Menopause affects essentially all women who live long enough to experience it, yet it remains one of the least addressed life stages in health technology. By grounding the app in a real clinical instrument (MRS) rather than an invented tracking system, SakhiPause aims to produce output that is genuinely useful in real medical and workplace contexts — not just a personal journal.

---

*Built for IEEE SHE Aspire 3.0 — Vibe2Vision Hackathon 2026 (Track 2: HerWellness)*
