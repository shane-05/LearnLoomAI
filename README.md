# LearnLoom AI 🎓

### Your Learning. Your Direction. Your Future.

**LearnLoom AI** is an AI-powered personalized learning and career guidance platform designed to help students discover suitable career paths, understand their current skills, identify skill gaps, and follow personalized learning roadmaps.

The platform combines artificial intelligence, skill analysis, career recommendations, and progress tracking to create a more structured and personalized learning experience.

---

## 🌟 Project Overview

Many students struggle to decide which career to pursue, understand the skills required for their desired profession, and find the right resources to improve.

LearnLoom AI aims to solve these problems through a unified learning companion.

With LearnLoom AI, students can:

- Discover career paths based on their interests and skills.
- Compare different career opportunities.
- Identify strengths and skill gaps.
- Understand the skills required for their target career.
- Generate personalized learning roadmaps.
- Take skill-based assessments.
- Interact with an AI Mentor.
- Track learning progress and career readiness.
- Discover internships, hackathons, and other opportunities.

## 🎯 Main Objectives

1. Make career exploration easier for students.
2. Provide personalized skill-gap analysis.
3. Create structured learning paths.
4. Use AI to support learning and career decisions.
5. Track skill development and learning progress.
6. Connect students with relevant learning and career opportunities.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Framework | Next.js App Router |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Database Security | Supabase Row Level Security (RLS) |
| AI Integration | Google Gemini API |
| Version Control | Git and GitHub |
| Development Environment | Visual Studio Code, Node.js, npm |

---

## ✨ Key Features

### 1. Career Explorer
Explore career paths and understand the skills, knowledge, and learning requirements associated with different professions.

Initial career options include:

- Full Stack Developer
- Frontend Developer
- Backend Developer
- Data Analyst
- UI/UX Designer
- VLSI Design Engineer

### 2. Career Comparison
Compare multiple career paths based on required skills, proficiency levels, and career-readiness indicators.

### 3. Skill Gap Analysis
Compare existing skills against the requirements of a selected career.

Skill proficiency uses a scale from 0 to 5.

Skill statuses include:

- Meets requirement
- Needs improvement
- Priority to learn
- Not added

The platform distinguishes between self-reported skills and assessment-verified skills.

### 4. Personalized Learning Roadmap
Create a structured learning journey based on a student's career goals, existing skills, skill gaps, assessment results, and available learning time.

Example roadmap stages:

1. Fundamentals
2. Core Skills
3. Intermediate Concepts
4. Practical Projects
5. Advanced Skills
6. Portfolio and Career Preparation

### 5. AI Mentor
An AI-powered learning assistant designed to:

- Explain difficult concepts.
- Answer learning questions.
- Suggest practical exercises.
- Provide career guidance.
- Explain assessment mistakes.
- Recommend learning activities.

### 6. Assessments and Quizzes
Support skill-based assessments, multiple-choice questions, automatic scoring, answer explanations, and performance tracking.

### 7. Learning Resources
Organize learning materials such as courses, documentation, videos, and practice resources.

### 8. Progress Analytics
Visualize learning progress through charts and indicators, including:

- Skill development.
- Assessment performance.
- Roadmap completion.
- Learning activity.
- Career skill coverage.

### 9. Internship and Hackathon Finder
Discover relevant opportunities, including:

- Internships
- Hackathons
- Student competitions
- Workshops
- Scholarships
- Technical events

### 10. Admin Dashboard
Provide administrative capabilities for managing users, career catalogues, skills, and learning resources, with appropriate access controls.

---

## 🤖 AI Multi-Agent Architecture

LearnLoom AI is designed around six specialist AI modules coordinated by an Agent Orchestrator.

| AI Agent | Responsibility |
|---|---|
| Skill Analyzer | Evaluates skills and identifies improvement areas |
| Career Matcher | Matches learner profiles with career requirements |
| Roadmap Planner | Creates personalized learning roadmaps |
| Resource Finder | Recommends relevant learning resources |
| Progress Evaluator | Evaluates learning progress |
| AI Mentor | Provides conversational learning and career guidance |
| Agent Orchestrator | Coordinates specialist agents and combines their outputs |

**Architecture flow:**

```text
             Learner Input
                  |
                  v
           Agent Orchestrator
                  |
       +----------+----------+
       |          |          |
       v          v          v
   Skill       Career     Roadmap
  Analyzer     Matcher    Planner
       |          |          |
       +----------+----------+
                  |
       +----------+----------+
       |                     |
       v                     v
 Resource Finder       Progress Evaluator
       |
       v
    AI Mentor
       |
       v
   Output Validation
       |
       v
  Supabase Database
       |
       v
  LearnLoom AI Dashboard
```

AI-powered capabilities use the Google Gemini API. Actual implementation and agent orchestration depend on the configured application modules.

---

## 🗄️ Database Architecture

Supabase PostgreSQL serves as the primary database.

The planned database includes:

| Table | Purpose |
|---|---|
| profiles | Student profile information |
| skills | Skills catalogue |
| user_skills | Student skill records |
| career_roles | Available career paths |
| career_requirements | Skills required for careers |
| learning_roadmaps | Personalized roadmaps |
| roadmap_tasks | Individual learning tasks |
| assessment_attempts | Assessment results |
| learning_resources | Learning materials |
| mentor_conversations | AI Mentor conversations |
| mentor_messages | AI Mentor messages |
| progress_logs | Learning activity records |

### Security

- Supabase Authentication for user accounts.
- Row Level Security (RLS) for database access control.
- Role-based authorization for students and administrators.
- Server-side handling of Gemini API credentials.
- Environment variables for sensitive configuration.

---

## 📁 Project Structure

The intended project structure is:

```text
LearnLoomAI/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── skills/
│   │   ├── careers/
│   │   ├── skill-gap/
│   │   ├── roadmap/
│   │   ├── assessments/
│   │   ├── opportunities/
│   │   ├── mentor/
│   │   └── api/
│   │
│   ├── components/
│   ├── hooks/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── gemini/
│   │   └── utils/
│   │
│   ├── agents/
│   │   ├── skill-analyzer/
│   │   ├── career-matcher/
│   │   ├── roadmap-planner/
│   │   ├── resource-finder/
│   │   ├── progress-evaluator/
│   │   ├── mentor/
│   │   └── orchestrator/
│   │
│   ├── services/
│   ├── types/
│   └── middleware.ts
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

*The actual repository structure may differ as development progresses.*

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Install the following tools:

- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account
- A [Google AI Studio](https://aistudio.google.com/) API key

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd LearnLoomAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory.

Add the following configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with your actual credentials.

**Important:**
- Never upload `.env.local` to GitHub.
- Never expose your Gemini API key in frontend code.
- Never expose your Supabase service-role key in client-side code.

### 4. Configure Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Execute the project's SQL migration scripts.
4. Configure authentication settings.
5. Enable and verify Row Level Security policies.
6. Configure the required database tables.

### 5. Start the development server

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

**Note:** These instructions assume the corresponding project scripts, environment variables, and database migrations have been implemented. Check the repository's actual `package.json` and `.env.example` before running the application.

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase public/anonymous key |
| GEMINI_API_KEY | Google Gemini API key (server-side only) |

Do not commit real credentials or secret keys to the repository.

---

## 🗺️ Development Roadmap

LearnLoom AI is organized into 12 development milestones.

- [ ] Milestone 1 — Frontend Foundation
- [ ] Milestone 2 — Backend Foundation
- [ ] Milestone 3 — Authentication
- [ ] Milestone 4 — Learner Profile and Skills
- [ ] Milestone 5 — AI Multi-Agent Pipeline
- [ ] Milestone 6 — Career Discovery and Skill Gap Analysis
- [ ] Milestone 7 — Personalized Learning Roadmaps
- [ ] Milestone 8 — Assessments
- [ ] Milestone 9 — AI Mentor
- [ ] Milestone 10 — Internship and Hackathon Finder
- [ ] Milestone 11 — Admin Dashboard
- [ ] Milestone 12 — Testing and Final Integration

*Update these checkboxes as each milestone is actually completed and tested.*

---

## 🧪 Testing

The project aims to include testing for:

- Frontend components.
- Backend API routes.
- Database operations.
- Authentication.
- Row Level Security policies.
- AI responses.
- Responsive layouts.
- Error handling.
- Application performance.

Only verified test results should be reported as completed.

---

## 🔮 Future Enhancements

Potential future improvements include:

- More personalized career recommendations.
- Advanced learning analytics.
- Adaptive learning roadmaps.
- Additional career categories.
- Improved AI Mentor capabilities.
- More learning resource integrations.
- Personalized internship recommendations.
- Enhanced student performance insights.

---

## 👨‍💻 Development Philosophy

LearnLoom AI is being developed with an emphasis on:

- Actual working functionality rather than UI-only demonstrations.
- Secure database architecture.
- Responsible AI integration.
- Personalized student experiences.
- Modular and maintainable code.
- Responsive design.
- Transparent skill and career-readiness calculations.

---

## 🤝 Contributions

Contributions, suggestions, and feedback are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

---

## 📄 License

A license has not yet been selected.

Until a license is added to this repository, all rights are reserved by the project owner. Please contact the owner before redistributing or reusing the project.

---

## 💜 LearnLoom AI

**Your Learning. Your Direction. Your Future.**

*Helping students turn their skills, interests, and ambitions into a clear learning journey.*

