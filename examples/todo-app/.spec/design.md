# Design Document

> **Phase:** 2 - Design 🟡 IN PROGRESS
> **Agent:** Architect
> **Prerequisites:** requirements.md ✅ COMPLETE

---

## Overview

**Project:** Todo App
**Architecture Pattern:** Component-based SPA with local state management
**Key Decisions:** React + TypeScript, localStorage persistence, minimal dependencies

---

## Requirements Mapping

| Requirement | Design Component | Implementation |
|-------------|------------------|----------------|
| FR-1 | TodoInput, TodoService | Form component + service method |
| FR-2 | TodoItem, TodoService | Checkbox toggle + state update |
| FR-3 | TodoItem, TodoService | Delete button + confirmation |
| FR-4 | FilterBar, TodoList | Filter state + filtered rendering |
| NFR-1 | All | Optimized React, lazy loading |
| NFR-2 | TodoService | Input sanitization |
| NFR-3 | All | ARIA labels, keyboard nav |

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                   App Component                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │   │
│  │  │  TodoInput  │  │  FilterBar  │  │ Counter │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────┘  │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │              TodoList                      │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │   │
│  │  │  │ TodoItem │ │ TodoItem │ │ TodoItem │  │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘  │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────┴───────────────────────┐    │
│  │              TodoService (State)               │    │
│  │  ┌─────────────┐  ┌─────────────────────────┐ │    │
│  │  │   useTodos  │  │  StorageAdapter         │ │    │
│  │  │   (Hook)    │  │  (localStorage)         │ │    │
│  │  └─────────────┘  └─────────────────────────┘ │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Components

| Component | Responsibility | Technology | Requirements |
|-----------|---------------|------------|--------------|
| App | Root container, layout | React | All |
| TodoInput | Task creation form | React | FR-1 |
| TodoList | Render filtered tasks | React | FR-4 |
| TodoItem | Single task display | React | FR-2, FR-3 |
| FilterBar | Filter controls | React | FR-4 |
| Counter | Task counts | React | FR-4 |

### Component Details

#### TodoInput
**Purpose:** Capture new task input (FR-1)
**Responsibilities:**
- Render input field and submit button
- Validate input (required, max length)
- Call TodoService.addTodo on submit
- Clear input after successful add
**Interfaces:**
- Input: onAdd callback
- Output: New todo data
**NFR Considerations:**
- Performance: Debounced input
- Accessibility: Label, focus management

#### TodoItem
**Purpose:** Display and interact with single task (FR-2, FR-3)
**Responsibilities:**
- Display task title and completion status
- Toggle completion on checkbox click
- Show delete button on hover
- Confirm before delete
**Interfaces:**
- Input: Todo object, callbacks
- Output: User actions
**NFR Considerations:**
- Accessibility: Checkbox ARIA, keyboard delete

---

## Data Model

### Entities

#### Entity: Todo
**Source Requirement:** FR-1, FR-2, FR-3

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | string | Unique identifier | UUID, required |
| title | string | Task title | 1-200 chars, required |
| description | string | Task details | 0-1000 chars, optional |
| completed | boolean | Completion status | default: false |
| createdAt | string | Creation timestamp | ISO 8601 |

### TypeScript Interface

```typescript
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'active' | 'completed';

interface TodoState {
  todos: Todo[];
  filter: FilterType;
}
```

---

## Technology Stack

### Selections

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Framework | React | 18.x | Component model, hooks, ecosystem |
| Language | TypeScript | 5.x | Type safety (NFR-2) |
| Build | Vite | 5.x | Fast dev, optimized build (NFR-1) |
| Styling | CSS Modules | - | Scoped styles, no runtime |
| Testing | Vitest | 1.x | Fast, Vite-native |
| E2E | Playwright | 1.x | Cross-browser (constraint) |

### Alternatives Considered

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Framework | React | Vue, Svelte | Team familiarity, ecosystem |
| State | useState | Redux, Zustand | Simplicity for MVP scope |
| Storage | localStorage | IndexedDB | Simpler API, sufficient for MVP |
| Build | Vite | Webpack, Parcel | Faster DX, modern defaults |

---

## Security Considerations

### Input Validation
- **Measure:** Sanitize all user inputs before storage
- **Mitigation:** DOMPurify for HTML, length limits enforced

### Data Protection
- **Measure:** No sensitive data stored
- **Mitigation:** Todos are non-sensitive, localStorage acceptable

---

## Testing Strategy

| Type | Scope | Tools | Coverage Target |
|------|-------|-------|-----------------|
| Unit | Components, hooks | Vitest, RTL | 80% |
| Integration | User flows | Vitest, RTL | Critical paths |
| E2E | Full app | Playwright | Happy paths |
| Accessibility | All components | axe-core | 0 violations |

---

## Validation Checklist
- [x] Architecture diagram present
- [x] All FR-X mapped to components
- [x] All NFR-X addressed in design
- [x] Data model entities defined
- [ ] API endpoints documented (N/A - no backend)
- [x] Technology stack specified
- [ ] No unaddressed requirements

## Phase Gate: CHECKPOINT_DESIGN_COMPLETE
**Status:** 🟡 In Progress
