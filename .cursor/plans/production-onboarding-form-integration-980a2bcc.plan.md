<!-- 980a2bcc-890d-4e78-b630-709b7b36e898 691ae6aa-35d2-48e8-955e-a7c55a53b2e8 -->
# Production Onboarding Form Integration Plan

## Overview

Transform the demo AI form into a production-ready multi-step onboarding form with database persistence. Remove runtime form builder, add step navigation, and implement backend persistence.

## Key Changes Required

### 1. Remove Form Builder UI

- Remove `FormBuilder` component and related UI from `page.tsx`
- Remove form builder state management (`isFormBuilderOpen`)
- Remove `form-builder/` directory components (or keep for admin use only)
- Remove localStorage-based form definition persistence

### 2. Predefined Form Schema

- Create a static form schema file (e.g., `src/lib/onboarding-schema.ts`)
- Define multi-step structure: `steps: Array<{ id: string, title: string, fields: string[] }>`
- Update `FormDefinition` type to support step grouping
- Load schema from code/config instead of localStorage

### 3. Database Integration

- Create API routes for form data persistence:
- `POST /api/onboarding/save` - Save partial form data
- `GET /api/onboarding/load` - Load existing form data
- `POST /api/onboarding/submit` - Final form submission
- Implement debounced auto-save (every 2-3 seconds after changes)
- Handle user session/identification (session token or user ID)
- Store form state: `{ sessionId: string, step: number, data: Record<string, unknown>, updatedAt: Date }`

### 4. Multi-Step Navigation

- Add step navigation component (`StepIndicator`, `StepNavigation`)
- Update `FormPreview` to show only current step fields
- Add step validation before allowing next step
- Persist current step to database
- Add progress indicator showing completion percentage

### 5. API Route Updates

- Update `/api/chat/route.ts` to:
- Accept predefined schema instead of dynamic formDefinition
- Include step context in system prompt
- Support step-aware field updates
- Add session management to chat route

### 6. Client-Side Updates

- Replace `handleFormUpdate` with step navigation handlers
- Add auto-save hook (`useAutoSave`) that debounces form changes
- Update `useFormTools` to trigger auto-save on field updates
- Add step progress state management
- Handle form resumption (load existing data on mount)

### 7. Component Refactoring

- Create `OnboardingForm` wrapper component
- Extract step logic into `useOnboardingSteps` hook
- Update `FormPreview` to accept `currentStep` prop
- Add loading states for data fetching

## Implementation Files

**New Files:**

- `src/lib/onboarding-schema.ts` - Predefined form schema with steps
- `src/app/api/onboarding/save/route.ts` - Save partial form data
- `src/app/api/onboarding/load/route.ts` - Load form data
- `src/app/api/onboarding/submit/route.ts` - Final submission
- `src/components/onboarding/step-indicator.tsx` - Step navigation UI
- `src/components/onboarding/step-navigation.tsx` - Next/Previous buttons
- `src/hooks/use-auto-save.ts` - Debounced auto-save logic
- `src/hooks/use-onboarding-steps.ts` - Step management logic

**Modified Files:**

- `src/app/page.tsx` - Remove builder, add steps, integrate DB persistence
- `src/app/api/chat/route.ts` - Use predefined schema, add step context
- `src/lib/utils/form-definition.ts` - Add step support to FormDefinition type
- `src/app/form/form-preview.tsx` - Filter fields by current step
- `src/hooks/use-form-tools.ts` - Trigger auto-save on updates

## Technical Considerations

- **Session Management**: Use cookies or headers for session identification
- **Auto-save Strategy**: Debounce 2-3 seconds, save on blur, save on step change
- **Error Handling**: Handle network failures gracefully, retry logic
- **Optimistic Updates**: Update UI immediately, sync in background
- **Step Validation**: Validate current step before allowing progression
- **Data Migration**: Ensure backward compatibility if users have partial data

## Questions to Resolve

1. Database choice and ORM (needed for implementation)
2. User identification method (session tokens, user IDs, anonymous)
3. Step UI preference (horizontal tabs, vertical sidebar, or wizard-style)
4. Auto-save frequency and triggers
5. Chat UI visibility (always visible, toggleable, or contextual)

### To-dos

- [ ] Remove FormBuilder UI and related state from page.tsx
- [ ] Create predefined onboarding schema with multi-step structure
- [ ] Set up database schema and ORM for form data persistence
- [ ] Create API route for saving partial form data with auto-save support
- [ ] Create API route for loading existing form data
- [ ] Create API route for final form submission
- [ ] Create step navigation components (StepIndicator, StepNavigation)
- [ ] Implement useAutoSave hook with debouncing
- [ ] Create useOnboardingSteps hook for step management
- [ ] Update FormPreview to filter fields by current step
- [ ] Update chat API route to use predefined schema and step context
- [ ] Refactor page.tsx to integrate steps, auto-save, and remove builder
- [ ] Update useFormTools to trigger auto-save on field updates