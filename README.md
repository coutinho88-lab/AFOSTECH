# AFOSTECH — Association of Food Science and Technology Students

The official collegiate web platform for the **Association of Food Science and Technology Students (AFOSTECH)**.

This platform bridges the gap between academic research, food manufacturing, and community nutrition by providing a unified hub where food science and human nutrition students across multiple universities showcase their innovative laboratory prototypes, peer-review formulations, and engage in constructive inter-university competition.

---

## 🌟 Core Features

### 1. Consortium Dashboard & Organization Introduction
- **Consortium Mission & Vision**: Showcasing AFOSTECH's mission to combat micronutrient deficiencies, eradicate post-harvest losses, and pioneer climate-resilient food systems.
- **Four Strategic Pillars**:
  1. *Nutritional Biotechnology & R&D* (biofortification of indigenous crops).
  2. *Inter-University Peer Competition* (annual innovation cups & blind sensory panels).
  3. *Food Safety & Quality Assurance* (HACCP, Codex Alimentarius, microbiology protocols).
  4. *Circular Economy & Agro-Waste Upcycling* (biodegradable biopolymers and waste fractioning).
- **Consortium Statistics**: Real-time counter of partner campuses, student researchers, lab prototypes, and patents filed.
- **Best Project Previews**: Curated showcase of top-rated student innovations across universities.

### 2. Multi-University Student Product Showcase
- **Rich Product Profiles**:
  - Detailed scientific abstracts and unit operations flows.
  - Interactive **Nutrition Facts Panel** with analytical data per 100g.
  - **Sensory Evaluation Breakdown** (taste, aroma volatiles, texture crunch, visual appeal, and overall organoleptic acceptability).
  - Raw ingredients list and sourcing details.
  - Student research team credentials (degree, academic year, campus chapter).
- **Search & Filter Engine**:
  - Instant live keyword search.
  - Category filters: *Functional Foods & Beverages*, *Biofortification & Clinical Nutrition*, *Eco-Packaging & Waste Upcycling*, *Fermentation & Probiotics*, *Alternative Proteins & Future Foods*.
  - University chapter filtering.
  - Sorting by peer upvotes, sensory index, sustainability score, or alphabetical.

### 3. Positive Peer Competition & Campus Leaderboard
- **Dynamic Scoring Index**:
  - **100 Pts**: For every verified student prototype published.
  - **20x Multiplier**: Based on hedonic sensory panel scores (out of 10).
  - **5 Pts**: Per peer endorsement / upvote.
- **Olympic-Style Podium**: Visual top 3 campus ranking (Gold, Silver, Bronze) with direct drill-down into each university's projects.
- **Campus League Table**: Comprehensive ranking with chapter leads, total points, and core academic strengths.

### 4. Interactive Student Submission & Peer Review Portal
- **"Submit Innovation" Modal**: Food science students from any university can submit new prototypes with ingredients, nutritional values, and abstracts, which instantly appear in the showcase and boost their university's leaderboard score.
- **Peer Critique System**: Students from peer universities can submit constructive academic critiques and inquiries on formulation steps and shelf-life studies.
- **LocalStorage Persistence**: Student submissions and peer endorsements are preserved across sessions.

---

## 📁 Project Structure

```
AFOSTECH/
├── index.html              # Main HTML5 application structure
├── css/
│   └── styles.css          # Design system, responsive layout & micro-animations
├── js/
│   ├── data.js             # Initial dataset of student projects, universities, & pillars
│   └── app.js              # Application logic, state management, filters, & modals
├── assets/
│   ├── logo.svg            # Official AFOSTECH organization seal
│   ├── spirocracker.svg    # SpiroCracker™ Wafer (JKUAT)
│   ├── mobiyog.svg         # MobiYog Synbiotic Camel Ferment (UoN)
│   ├── biochitowrap.svg    # BioChitoWrap™ Active Film (Makerere)
│   ├── progrub.svg         # ProGrub Meat Analog (KNUST)
│   ├── enzibrew.svg        # EnziBrew Low-GI Tonic (Egerton)
│   ├── moringavita.svg     # MoringaVita Iron Cube (UI Ibadan)
│   ├── aquacrisp.svg       # AquaCrisp Marine Collagen (Stellenbosch)
│   └── pulsegel.svg        # PulseGel Legume Stabilizer (KNUST)
└── README.md               # Documentation and usage guide
```

---

## 🚀 How to Open and Run

### Option 1: Direct Browser Launch
Simply double-click or open `index.html` in any web browser:
```
c:\Users\user\Downloads\AFOSTECH\index.html
```

### Option 2: Local HTTP Server (Python)
From the project folder:
```powershell
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.
