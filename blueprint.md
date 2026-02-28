# AI Style Transfer App - Blueprint

## 1. Overview and Capabilities
The AI Style Transfer App allows users to teach the system a visual style by uploading multiple images, storing this "Style Memory," and subsequently applying that learned style to new reference images. 

**Core Capabilities & Rules:**
- **No Predefined Styles:** All styles are extracted from user-uploaded images.
- **Style Persistence:** Styles persist across sessions (locally for the MVP).
- **Stateless Reconstruction:** Every render reconstructs style context automatically without user prompt engineering.
- **Local Data Storage:** The MVP validation phase enforces strict client-side storage (LocalStorage). No authentication, backend database, or cloud persistence is used during this phase.

## 2. Current Project State
The project is currently in the initial design and scope validation phase. The core architecture is defined in `ai-studio-scope.md` focusing on a purely frontend-driven Minimum Viable Product using Next.js (App Router). 

- **UI Direction:** Dark theme by default, clean and minimal UI, strong spacing and hierarchy, creator-tool aesthetic.
- **Storage:** LocalStorage-based architecture for Projects, Images, and Render Jobs, designed to be easily upgradeable to a backend database later.

## 3. MVP Implementation Plan and Steps

### Phase 1: Core Setup & Shared Infrastructure
- [x] **Step 1:** Initialize Next.js project with App Router, TypeScript, and Tailwind CSS.
- [x] **Step 2:** Configure global styles for the default Dark Theme with minimal visual clutter.
- [x] **Step 3:** Implement LocalStorage adapter utility functions for scalable frontend data management (CRUD for Projects, Images, Render Jobs).
- [x] **Step 4:** Define strictly typed Typescript interfaces/models for `StyleProject`, `StyleImage`, and `RenderJob`.

### Phase 2: Dashboard & Project Management
- [x] **Step 5:** Build the Dashboard Page (`/`) to list existing Style Projects.
- [x] **Step 6:** Create the "New Project" modal/flow to input project name and optional description.

### Phase 3: Style Creation Flow (Teach System)
- [x] **Step 7:** Build the multi-image upload component.
- [x] **Step 8:** Implement the Style Memory generation logic (handling uploaded images, base64 conversion, simulating/integrating embeddings extraction).
- [x] **Step 9:** Save generated Style Memory securely in LocalStorage linked to the Project ID.

### Phase 4: Render Studio (Apply Style)
- [x] **Step 10:** Build the Render Studio workspace UI (selected project context, reference image upload zone).
- [x] **Step 11:** Implement optional text instruction input.
- [x] **Step 12:** Build the Context Reconstruction pipeline: User request → Fetch Style Memory → Aggregate embeddings → Build structured generation input → Attach reference image + style anchors.
- [x] **Step 13:** Integrate the latest Gemini Image model API call to generate the styled output.

### Phase 5: Output & Render History
- [x] **Step 14:** Implement the local saving of the new Render Job (reference image + user instruction + output image).
- [x] **Step 15:** Build the Output Gallery UI to display previous generation history for the project.
- [x] **Step 16:** Add functionality to allow users to download their generated images.
