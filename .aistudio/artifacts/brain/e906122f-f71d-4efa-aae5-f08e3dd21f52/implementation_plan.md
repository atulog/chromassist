# ChromAssist: Human-Centered Engineering Redesign Plan

A comprehensive UI/UX redesign transforming ChromAssist from a flashy AI template into an understated, clean, practical accessibility utility built for a college engineering project at TSDCEM.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The redesign strictly follows the confirmed direction:
> - **Visual Tone**: Clean light background (`#F8FAFC` / `#FFFFFF`), dark navy/charcoal typography (`#0F172A`), and a single muted slate blue accent (`#2563EB`) with neutral charcoal hairline borders (`#E2E8F0` / `#1E293B`).
> - **Zero AI Clichés**: Elimination of heavy gradients, glassmorphism, glowing borders, pill badges, and decorative blobs.
> - **Focused Workbench Layout**: Immediate focus on the Color Detection Tool with clean image/camera controls, prominent canvas, and readable text labels for all detected colors.
> - **Feature Preservation**: 100% preservation of all existing algorithms (CVD simulation, CIELAB Delta-E name matching, WCAG contrast calculation, camera capture, speech synthesis, and academic report/viva views).

---

### 1. Overview & Core Concept

**ChromAssist** is an assistive tool engineered to help users with color vision deficiencies (Protanopia, Deuteranopia, Tritanopia) perceive and identify colors with confidence.

The redesign shifts the aesthetic away from an AI landing page and toward an **engineering-grade accessibility tool**:
- **Utilitarian & Trustworthy**: Look and feel of an authentic laboratory/clinical utility designed by engineering students.
- **Immediate Utility**: The user lands directly on the functional color-detection workbench, not marketing fluff.
- **Text-First Color Communication**: Every visual swatch is coupled with an unequivocal human-readable color label (e.g., `"Crimson Red"`, `"Cobalt Blue"`), verified RGB/HEX values, and algorithmic contrast ratios.

---

### 2. User Experience & Visual Design

#### A. Header & Navigation (Top Bar Contract)
- **Brand**: Clean, unadorned wordmark `"ChromAssist"` accompanied by a simple monochrome lens mark and quiet academic attribution (`"TSDCEM • ECS Dept"`).
- **Navigation**: Clean text links with subtle active states (`Color Analyzer`, `How It Works`, `Bioscience`, `Project Report`, `Slides`, `Viva Prep`, `Testing`).
- **Utility Actions**: High Contrast toggle, Text Size adjustment, Speech toggle, and Dark/Light theme toggle styled as quiet, accessible utility buttons.

#### B. Workbench Architecture & Homepage Structure
- **Concise Header**:
  - Heading: **"Color Vision Assistant"** (28px–32px, bold charcoal).
  - Subtitle: *"An assistive accessibility tool that identifies colors and suggests high-distinguishability alternatives for color vision deficiency."*
- **Compact Toolbar**:
  - `Take Photo` (Camera with live viewfinder).
  - `Upload Image` (Clean system file picker).
  - `Engineering Test Samples` (Subtle 1-click test cards: Transit Map, Resistor, Fashion, Ishihara).
  - `Reset / Clear`.
- **Canvas Stage**:
  - Contained, distraction-free stage with 1px hairline border.
  - High-precision crosshair cursor and optional 8× digital loupe for sub-pixel accuracy.
  - View mode selector: `Original`, `CVD Simulation`, `Assisted Preview`.
  - Aperture selector (`1×1`, `3×3`, `5×5`) for noisy digital photos.
- **Results & Inspection Panel**:
  - Dominant color prominently displayed in large bold text (e.g. **"Crimson Red"**).
  - Side-by-side swatch with detected color and suggested CVD alternative.
  - Clean monospace tabular readouts for `HEX`, `RGB`, and `HSV`.
  - WCAG 2.1 relative luminance contrast rating against background (`AAA`, `AA`).
  - Text-to-speech button for auditory accessibility.

#### C. Typography & Spacing System
- **Font**: System Sans-Serif (`Inter`, `Segoe UI`, `Roboto`) paired with `JetBrains Mono` for data and coordinates.
- **Radii**: Restrained `rounded-lg` (8px) and `rounded-md` (6px) instead of bloated 24px/32px capsules.
- **Borders & Shadows**: Subtle 1px borders (`border-slate-200 dark:border-slate-800`) and flat or subtle elevation (`shadow-xs`).
- **Zero Pill Badges**: Metadata rendered as clean, unboxed text separated by subtle typographic dots (`·`).

---

### 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Trade-Off |
| :--- | :--- | :--- |
| **Workbench vs Landing Page** | Direct tool-first workbench on homepage | Eliminates AI template fluff; examiners and users immediately see the functioning engineering system. |
| **Color System** | Pure Slate neutral canvas (`#FFFFFF` / `#F8FAFC`) + Slate Blue (`#2563EB`) | Conforms strictly to the 60-30-10 rule and avoids visual distraction from user-uploaded images. |
| **Component Preservation** | Refactor styling of existing components in place | Avoids breaking existing event listeners, state flows, camera hooks, and canvas pixel transformers. |
| **Dark Mode Balance** | Subtle dark slate (`#0B0F19`) with high-contrast borders | Prevents glare in dark environments while maintaining WCAG AA contrast for text and swatches. |

---

### 4. Technical Architecture & File Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│   - ChromAssist wordmark · TSDCEM ECS Dept attribution                 │
│   - Minimal tab navigation · Contrast, Text Size, Theme controls       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Color Vision Assistant                           │
│   - Clean, direct page title and 1-line accessibility purpose note     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Compact Workbench Toolbar                         │
│   [📷 Use Camera]  [📁 Upload Image]  [Test Samples]  [Clear]         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                       Workbench Stage (Split Grid)                     │
│  ┌──────────────────────────────────┐┌───────────────────────────────┐ │
│  │       Interactive Canvas         ││       Results Inspector       │ │
│  │ - 1px hairline border stage      ││ - Large text: "Crimson Red"   │ │
│  │ - Original / CVD / Assisted mode ││ - Detected vs Assisted swatch │ │
│  │ - 8× precision loupe & crosshair ││ - HEX, RGB, WCAG contrast     │ │
│  │ - Aperture selector (1x1, 3x3)   ││ - Speech synthesis button     │ │
│  └──────────────────────────────────┘└───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Planned Modifications:
1. **`Navbar.tsx`**: Replace gradient icon and pill badges with a clean, professional header; compact accessibility buttons.
2. **`ImageUploadArea.tsx`**: Convert large marketing dropzone into a compact, functional workbench toolbar.
3. **`InteractiveCanvas.tsx`**: Refine canvas borders, toolbars, and loupe HUD into a sleek, clinical scientific viewport.
4. **`ResultsPanel.tsx`**: Clean up cards, lead with large human-readable color text, eliminate excessive badges.
5. **`App.tsx`**: Update page title section to "Color Vision Assistant" with clear, concise utility description.
6. **Academic & Documentation Views (`AboutProjectView`, `HowItWorksSection`, `BioscienceSection`)**: Restyle with clean editorial typography, zero blobs, and understated cards.
7. **`index.css`**: Verify clean baseline styling and font rules.
8. **Verification**: Run `compile_applet` and verify zero visual regressions or broken handlers.
