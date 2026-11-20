# Autonomous Merchant KYC & Document Verification Copilot

> Production-grade, multi-stage KYC verification copilot designed for Indian FinTech onboarding (PAN Card + GST Certificate + Cancelled Cheque cross-verification). Built with **FastAPI**, **OpenCV**, **Google Gemini 2.5 Flash**, **SQLite/SQLAlchemy**, **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Key Architecture & Multi-Stage Pipeline

```
  [ Upload PAN + GSTIN + Cheque ]
                 │
                 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ STAGE 1: Deterministic OpenCV Quality Gate (Zero AI Cost)│
 │ • Blur Check: cv2.Laplacian variance (< 100.0 rejects)  │
 │ • Glare Check: HSV (V > 248 & S < 25 > 15% rejects)     │
 │ • Framing Check: Document bounding box touching outer 2%│
 └─────────────────────────┬───────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
        [ REJECTED ]                 [ PASSED ]
      (Early Exit $0.00)                 │
             │                           ▼
             │         ┌──────────────────────────────────────┐
             │         │ STAGE 2: Gemini 2.5 Flash Extraction  │
             │         │ • Strict Pydantic JSON Schema        │
             │         │ • High-Confidence Field Parsing      │
             │         │ • Zero-Config Mock/Fallback Engine   │
             │         └──────────────────┬───────────────────┘
             │                            │
             │                            ▼
             │         ┌──────────────────────────────────────┐
             │         │ STAGE 3: Deterministic Rules Engine  │
             │         │ • PAN format: ^[A-Z]{5}[0-9]{4}[A-Z]$│
             │         │ • 4th char: 'P' (Indiv), 'C'/'F' (Co)│
             │         │ • GSTIN format: 15-char structure    │
             │         │ • Cross-Check: GSTIN[2:12] === PAN   │
             │         │ • Fuzzy Legal Name Match (≥ 80.0%)   │
             │         └──────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
  [ USER RETRY NUDGE ]            [ AUTO-APPROVED ]
  Actionable step-by-step        Merchant Account Created
  guidance for merchant          Saved ~15 min Ops Underwriting
```

---

## 🎯 Dual-View Experience

### 1. Merchant Onboarding Simulator (User View)
- **1-Click Test Presets**: Test edge cases without needing real personal IDs:
  - 🟢 **Load Valid Sample**: Crisp Company PAN + Matching GSTIN (`27AACCA1234F1Z5`) + Cheque $\rightarrow$ **AUTO_APPROVED**
  - 🟡 **Load Blurry PAN Sample**: Gaussian blurred PAN $\rightarrow$ Fails Stage 1 OpenCV Blur ($< 100.0$), exits early with zero AI API cost!
  - 🔴 **Load PAN-GST Mismatch Sample**: Valid images pass Stage 1 & 2 $\rightarrow$ Stage 3 catches PAN mismatch (`AACCA1234F` vs `XYZAB9876K`), generates instant User Nudge!
  - 🟣 **Load Individual Flow**: Proprietor PAN (4th char `'P'`) + matching GSTIN $\rightarrow$ **AUTO_APPROVED**
- **Real-Time Visual Pipeline Tracker**: Live millisecond latency breakdown for Stage 1, Stage 2, and Stage 3.
- **Actionable User Retry Nudge**: Empathetic, clear, step-by-step instructions showing the user what went wrong and how to fix it.
- **Bypass Quality Gate Toggle**: Option to benchmark downstream multimodal AI extraction even on low-quality samples.

### 2. Ops Command Center (Internal Risk & Audit View)
- **Top Executive KPIs**:
  - Total Submissions volume
  - Straight-Through Processing (STP) Auto-Approval Rate (%)
  - Average Verification Time (ms)
  - Estimated Underwriting Hours Saved (~15 mins per auto-approved KYC)
- **Filterable & Searchable Audit Table**: Filter by status, applicant type (`company` or `individual`), or search by ID, Merchant Name, PAN, or GSTIN.
- **Slide-Over Inspection Drawer**:
  - Side-by-side document image preview
  - Exact OpenCV scores (Laplacian score, glare %, framing boundaries)
  - Extracted JSON fields & confidence scores
  - Compliance check results matrix (Expected vs Actual)
  - **Human-in-the-Loop Override**: One-click manual Approve / Reject with reviewer notes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn, OpenCV (`opencv-python-headless`), Pydantic v2, Google GenAI SDK (`google-genai` using `gemini-2.5-flash`), SQLAlchemy, SQLite |
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Document Synthesis** | Pillow (`PIL`), OpenCV for generating synthetic Indian PAN, GST, and Cheque images |

---

## 📦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Clone & Setup Environment Variables
```bash
cp .env.example .env
```
*(Note: If `GEMINI_API_KEY` is not provided, the copilot automatically runs in a high-fidelity Mock Fallback Mode, enabling full out-of-the-box functionality).*

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Generate synthetic document samples (valid, blurry, mismatch)
python scripts/generate_samples.py

# Start FastAPI server on port 8000
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verify-kyc` | Multi-stage KYC verification pipeline (multipart upload) |
| `GET` | `/api/submissions` | List all verification audit submissions (filterable) |
| `GET` | `/api/submissions/{id}` | Detailed submission view with stage diagnostics |
| `POST` | `/api/submissions/{id}/override` | Ops reviewer manual override (APPROVE/REJECT + notes) |
| `GET` | `/api/stats` | Executive KPI summary statistics |
| `GET` | `/api/sample-docs` | Catalog of synthetic sample document presets |
| `GET` | `/api/sample-docs/{filename}` | Download synthetic document image file |

---

## ⚖️ Indian FinTech Compliance Rules Implemented

1. **PAN Format**: Matches `^[A-Z]{5}[0-9]{4}[A-Z]$`.
2. **PAN 4th Character**:
   - `individual`: 4th character must be `'P'`.
   - `company`: 4th character must be `'C'` (Company) or `'F'` (Firm/LLP).
3. **GSTIN Format**: Matches `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
4. **GSTIN-to-PAN Strict Cross-Check**: Characters 3 to 12 (`gstin[2:12]`) must strictly equal the 10-character PAN.
5. **Entity Name Fuzzy Matching**: Legal name similarity between PAN and GST must be $\ge 80\%$.
yea