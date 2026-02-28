# AI Style Transfer App --- Master Development Prompt

## Product Goal

Build an AI web application that performs **user-defined image style
transfer** using the latest Gemini Image model.

Users teach the system a visual style by uploading multiple images.\
The system learns shared visual characteristics and stores them as
persistent **Style Memory**.\
Users can then apply that learned style to new reference images with
consistent results.

Core idea: **Teach a style once → reuse it forever.**

------------------------------------------------------------------------

## Key Rules

-   No predefined styles.
-   Style comes ONLY from user-uploaded images.
-   Style must persist across sessions.
-   Every render reconstructs style context automatically.
-   Consistency is more important than randomness.
-   Users should not need prompt engineering.

------------------------------------------------------------------------

## MVP DEVELOPMENT CONSTRAINT (VERY IMPORTANT)

This is an idea‑validation phase.

For the initial MVP:

-   DO NOT implement authentication.
-   DO NOT set up any backend database.
-   DO NOT build cloud persistence yet.

All data must be stored locally using **browser localStorage** (or
equivalent client-side storage).

Store locally: - Style Projects - Uploaded style images (as local
references/base64) - Style memory metadata - Render history - Generated
outputs

Goal: Validate product behavior and workflow before introducing backend
complexity.

Architecture must remain easily upgradeable later to database storage.

------------------------------------------------------------------------

## User Workflow

### Phase 1 --- Create Style

1.  Create Style Project (name + optional description).
2.  Upload minimum 3 style images.
3.  System analyzes images.
4.  Style Memory is created and stored locally.

### Phase 2 --- Apply Style

1.  Select Style Project.
2.  Upload reference image.
3.  Optional short instruction text.
4.  System applies stored style.
5.  Gemini generates styled output.
6.  User downloads result.
7.  Render history saved locally.

------------------------------------------------------------------------

## Style Memory (Core System)

When style images are uploaded:

-   Extract image embeddings.
-   Aggregate embeddings into a unified style vector.
-   Generate internal structured style descriptor.
-   Store embeddings + metadata locally.

Style Memory contains: - Image embeddings - Aggregated style vector -
Internal style descriptor - Project metadata

------------------------------------------------------------------------

## Context Reconstruction (Critical)

AI models are stateless. Style must be rebuilt every render.

Rendering pipeline:

User request → Fetch Style Memory → Aggregate embeddings →\
Build structured generation input → Attach reference image →\
Attach style anchor images → Gemini generation → Store output locally →
Return result.

Priority: **Style preservation \> variation.**

------------------------------------------------------------------------

## Data Structures (Local MVP Models)

**Style Project** - id - name - description - created_at -
style_descriptor - style_vector

**Style Image** - id - project_id - image_data - embedding - metadata

**Render Job** - id - project_id - reference_image - user_instruction -
output_image - created_at

------------------------------------------------------------------------

## UI / UX Direction

### Dashboard

-   Dark theme by default
-   Clean and minimal UI
-   Strong spacing and hierarchy
-   Creator-tool aesthetic
-   Minimal visual clutter

### Core Screens

1.  Dashboard (projects list)
2.  Style Creation flow
3.  Render Studio
4.  Output Gallery

UX goals: - Linear workflow - Minimal decisions - Clear processing
feedback - Fast iteration experience

------------------------------------------------------------------------

## MVP Scope

Build: - Style project creation - Multi-image upload - Local style
memory generation - Reference image styling - Rendering pipeline -
Download output - Render history - Dark themed dashboard - LocalStorage
persistence

Do NOT build yet: - Authentication - Backend database - Cloud storage -
Style sliders - Marketplace/sharing - Collaboration - Batch rendering

------------------------------------------------------------------------

## Success Criteria

-   Outputs remain visually consistent across renders.
-   Users reuse styles without re-uploading images.
-   Minimal prompt adjustments required.
-   Style identity remains stable over time.

------------------------------------------------------------------------

## Development Priority

1.  Persistent Style Memory logic (local first)
2.  Reliable rendering pipeline
3.  Clean dark UI dashboard
4.  Smooth upload + processing experience
5.  Consistent outputs

Design architecture so localStorage can later be replaced by backend
storage with minimal refactoring.

Begin development aligned strictly with these principles.
