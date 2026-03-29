# Work Simplification — Product Design Document
**Version 1.0 | Draft**

---

## 1. Product Overview

### What Is This?

Work Simplification is a web application for middle managers to map, analyze, and improve their team's operational processes. It digitizes the two core tools from the 1940s Bureau of Budget Work Simplification program:

1. **The Work Distribution Chart** — who does what, and how many hours it takes
2. **The Process Chart** — the step-by-step flow of any specific work process, annotated with operation/transportation/storage/inspection symbols

The original program lived in paper pamphlets and poster-sized worksheets. This app makes the same thinking interactive, shareable, and analytically useful — without losing the rigor of the original method.

### The Core Problem

Middle managers — especially those promoted from analytical or technical roles — tend to keep doing the tactical work they know instead of managing the operational layer. The result:

- Processes are undocumented ("it's all in Sarah's head")
- Bottlenecks are invisible until they become crises
- Work is distributed unevenly or illogically
- There's no time for process improvement because the process itself consumes all the time

Work Simplification gives managers a structured way to see their unit clearly, ask the right questions (What? Why? Where? When? Who? How?), and implement better methods.

---

## 2. Target Users

### Primary: The First-Line Supervisor / Middle Manager

- Manages a team of 3–10 people
- Likely was an analyst, engineer, or specialist before becoming a manager
- Has limited formal management training
- Is busy; will only engage with tools that are fast and legible
- Sectors: municipal government, utilities, healthcare administration, nonprofits, mid-size business ops teams

### Secondary: The Reform-Minded Director

- Manages multiple units
- Wants visibility into how their org actually works, not just what the org chart says
- Uses the app to review charts produced by their direct reports

### Anti-User (who this is NOT for)

- Large enterprise process mapping (that's Visio / Lucidchart)
- Lean Six Sigma black belts running formal improvement projects
- Software engineering teams (they have Jira, linear, etc.)

---

## 3. Core Features

### Feature 1: Work Distribution Chart (WDC)

**Purpose:** Show who does what across the unit.

**User flow:**
1. Manager creates a new WDC for their unit
2. Enters team members (name, role, FTE status)
3. Defines activities (the categories of work the unit does — e.g., "Rebate Processing," "Customer Service," "Power Supply")
4. For each team member, enters tasks under each activity, with hours/week estimates
5. The app renders the full matrix: rows = activities, columns = employees, cells = tasks + hours

**Analysis layer (auto-generated flags):**
- 🔴 **Overloaded** — employee hours exceed a configurable threshold (e.g., 40 hrs/wk)
- 🟡 **Manager doing analyst work** — manager column has high hours in non-management activities
- 🟠 **Thin coverage** — an activity has only one person who knows it (key-person risk)
- 🔵 **Fragmented effort** — an employee has tasks spread across 5+ unrelated activities
- ⚪ **Missing work** — activities with zero hours assigned (likely invisible work or unassigned responsibility)

**Export:** PDF of the full chart, CSV of the underlying data

---

### Feature 2: Process Chart

**Purpose:** Document a single work process step-by-step.

**The four symbols (faithful to the original):**
| Symbol | Name | Meaning |
|--------|------|---------|
| ⬤ (large circle) | Operation | Something is changed, created, or added to |
| ○ (small circle) | Transportation | Something moves from one place to another |
| △ | Storage | Something waits with no action taken |
| □ | Inspection | Something is checked but not changed |

**User flow:**
1. Manager names the process and defines its start and end points
2. Adds steps one at a time, selecting: symbol type, description, who does it, time in minutes (for storage), distance in feet (for transportation)
3. The app renders a vertical flow chart with connecting lines between steps, a running tally of each symbol type, total storage time, and total transportation distance
4. Manager can annotate steps with "Why" questions and proposed changes

**Analysis layer:**
- Count of each step type (surface ratio of "real work" vs. waiting vs. moving)
- Flag: high storage time relative to total process time
- Flag: multiple consecutive inspections (control stacking)
- Flag: excessive transportation distance
- Side-by-side view: "Before" vs. "After" proposed process

---

### Feature 3: The Analysis Workspace

A dedicated view per chart where the manager works through the six canonical questions:

| Question | What it prompts |
|----------|----------------|
| **What** | Is this step list complete? What does each step actually do? |
| **Why** | Is this step necessary at all? |
| **Where** | Can this be done closer to where the output is needed? |
| **When** | Is the sequence right? Can steps be combined or reordered? |
| **Who** | Is the right person doing this? |
| **How** | Is there a better method, form, or tool? |

Each question links to inline annotations on the relevant steps. Findings can be promoted to a **Proposed Changes** list that tracks before/after.

---

### Feature 4: Unit Dashboard

A homepage per unit that shows:
- All active WDCs and Process Charts, with last-updated date
- Summary stats: total documented processes, flagged issues count, open proposed changes
- A "health" indicator (simple red/yellow/green) based on flag severity
- Changelog: what changed since last review

---

### Feature 5: Sharing & Collaboration

- Charts can be shared via link (read-only or comment-enabled)
- Comments can be left on specific steps or cells
- Version history: snapshot the chart quarterly, compare diffs over time
- Export to PDF for presenting to a superior ("before and after" format, as the original pamphlet recommends)

---

## 4. Information Architecture

```
App Root
├── My Units
│   └── [Unit Name]
│       ├── Dashboard
│       ├── Work Distribution Charts
│       │   └── [WDC Name]
│       │       ├── Chart View
│       │       ├── Analysis Workspace
│       │       └── Proposed Changes
│       └── Process Charts
│           └── [Process Name]
│               ├── Chart View
│               ├── Analysis Workspace
│               └── Before / After Compare
├── Team Members (global roster)
├── Settings
└── Help / Pamphlet (the original source material, lightly annotated)
```

---

## 5. Data Models

### Unit
```
unit_id
name
description
created_by (user_id)
created_at
members: [user_id]
```

### WorkDistributionChart
```
wdc_id
unit_id
name
snapshot_date
employees: [Employee]
activities: [Activity]
cells: [Cell { employee_id, activity_id, tasks: [Task { name, hours_per_week }] }]
flags: [Flag] (auto-generated)
proposed_changes: [ProposedChange]
```

### ProcessChart
```
process_id
unit_id
name
start_point (string)
end_point (string)
steps: [Step {
  step_id
  sequence_number
  symbol: "operation" | "transportation" | "storage" | "inspection"
  description
  who (string)
  minutes (for storage)
  feet (for transportation)
  annotations: [Annotation]
}]
version_history: [Snapshot]
```

---

## 6. Visual Design Direction

### Aesthetic: **New Deal Utilitarian**

The app lives at the intersection of a 1940s government document and a modern productivity tool. Think: the confidence of a WPA poster, the legibility of a Bureau of Standards pamphlet, the precision of a ledger book — executed in a clean digital interface.

**NOT:** Rounded corners everywhere, purple gradients, generic SaaS "clean minimal." That would betray the spirit of the source material.

**YES:** 
- Monospaced or slab-serif typeface for data cells and process step labels
- A restricted palette: off-white/cream background, near-black text, one strong accent color (a WPA-era burnt orange or cobalt blue), muted yellow for flags
- Process chart symbols rendered as clean geometric SVGs, not icons from a library
- The WDC renders as an actual ledger-style table, dense and information-rich, not a card grid
- Subtle paper texture or dot-grid background on chart canvases

**Typography:**
- Display / headers: a geometric slab serif (Playfair Display, Zilla Slab, or Bitter)
- Data / labels: a monospaced font (IBM Plex Mono, Courier Prime)
- Body / UI chrome: a neutral humanist sans (Source Sans, Lato — kept minimal)

**Color palette:**
```
--bg:           #F5F0E8   /* warm off-white / aged paper */
--surface:      #FFFFFF
--ink:          #1A1A18   /* near-black */
--ink-muted:    #5C5A52
--accent:       #C94A1E   /* WPA burnt orange */
--accent-light: #F0D5CC
--flag-red:     #C94A1E
--flag-yellow:  #D4A017
--flag-blue:    #2B5EA7
--border:       #C8C3B4
```

---

## 7. Key UX Principles

1. **Document first, analyze second.** The app doesn't demand analysis. It lets you build the chart first. Insights surface naturally once the data is there.

2. **Paper-faithful fidelity.** The symbols mean exactly what the original program said they mean. The six questions appear verbatim. The method is not modernized into abstraction — it's digitized with fidelity.

3. **Legible density over sparse cards.** The WDC is a dense table. The Process Chart is a vertical stack. Don't break data into cards that require scrolling horizontally or clicking through to see the full picture.

4. **Flags, not scores.** The app does not produce a "process health score." It raises specific, labeled, dismissible flags with an explanation of why each flag was raised. Managers decide what to act on.

5. **Quarterly rhythm.** The app is not a daily tool. Its natural cadence is the periodic review — monthly at most, quarterly ideally, annually at minimum. Design for sessions, not habits.

6. **The pamphlet is part of the product.** The original Work Simplification text should be accessible in-app, section by section, contextually linked where relevant. It is the documentation. It is also a design asset.

---

## 8. MVP Scope

**In for v1:**
- [ ] Unit creation and team roster
- [ ] Work Distribution Chart: build + view
- [ ] Process Chart: build + view
- [ ] Auto-generated flags on WDC
- [ ] Step type totals and time/distance tallies on Process Chart
- [ ] PDF export for both chart types
- [ ] Read-only share link

**Out for v1:**
- [ ] Before/After Process Chart comparison
- [ ] Analysis Workspace (the six questions — v2)
- [ ] Version history / snapshots
- [ ] Commenting
- [ ] Director-level multi-unit dashboard
- [ ] Mobile-optimized editing (view on mobile is fine; building charts requires desktop)

---

## 9. Open Questions

1. **Should the WDC support importing from a spreadsheet?** Many managers already have hours data in Excel. An import path could lower onboarding friction significantly.

2. **How do we handle the "who" field in Process Charts?** Free text is flexible, but a dropdown from the team roster creates linkage to the WDC. Worth the added complexity?

3. **Is there a public/community layer?** The Substack author's use case suggests managers in similar industries (utilities, municipal government) face the same structural problems. A library of anonymized, community-shared process charts could be enormously useful. Risk: quality control, privacy.

4. **What's the business model?** This is a niche, low-frequency tool. Per-seat SaaS likely doesn't work. Options: flat annual fee per unit, one-time purchase, or a consulting/workshop bundle (like the original program's traveling workshop circuit).

---

## 10. Reference Material

- *A Supervisor's Guide to Process Charts* — Bureau of Budget Work Simplification Program, ~1942
- *The Work Distribution Chart & Ex-Analyst Syndrome* — F. Ichiro Gifford, Energy Crystals (Substack), September 2025
- State Capacitance (Substack) — Kevin Hawickhorst, for further historical management literature

---

*End of Design Document v1.0*
