---
description: Extended React Native Premium UI Design Swarm
---
# Extended React Native UI Design Swarm Workflow

To completely rebuild a UI from the ground up, the methodology requires a highly specialized, expanded Agent Swarm. When rebuilding or creating a complex UI, you must sequentially invoke the insights of these 8 specialized agents before generating the final code.

## The Extended Swarm Process

### 1. 🗺️ The Product Mapper
**Focus: State, Flow, and Logic**
- Defines the required UI states (loading, empty, success, error, active).
- Determines the data flow and necessary hooks for the screen.

### 2. 📐 The Layout Architect
**Focus: Structure and Boundaries**
- Structures the Flexbox constraints, safe areas, margins, and padding structures.
- Decides between `ScrollView`, `FlatList`, or `BottomSheet` based on layout demands.

### 3. 🎨 The Design Systems Expert
**Focus: Theme, Colors & Typography**
- Enforces strict adherence to the project's design system (e.g., Glassmorphism constraints).
- Selects the exact Google Sans weights and hex/rgba values from the existing theme context.

### 4. 🧩 The Component Engineer
**Focus: Reusability and Abstraction**
- Identifies UI repeated elements (cards, chips, buttons) and abstracts them logically.
- Ensures clean, un-bloated component trees.

### 5. ⚡ The React Native Perf-Tuner
**Focus: Render Optimization**
- Audits the component structure for unnecessary re-renders.
- Suggests `useMemo`, `useCallback`, or `Reanimated` shared values to keep the UI at 60fps.

### 6. ✨ The Motion & Interactions Designer
**Focus: Tactile Feedback and Transitions**
- Interjects `react-native-reanimated` logic for entry fades, list staggers, and spring-based interactions on press events.

### 7. 👁️‍🗨️ The Accessibility (a11y) Guru
**Focus: Inclusivity and Usability**
- Verifies touch target sizes (minimum 44x44), hitSlops, and `accessibilityLabel` injections.
- Ensures contrast ratios meet industry WCAG standards.

### 8. 👑 The Design Director (Final Reverifier)
**Focus: Industry Readiness and Final Polish**
- The ultimate gatekeeper. Audits the combined outputs against elite app standards (e.g., Apple HIG, Premium App UI trends).
- Rejects any code that looks clunky or lacks the "Wow" factor.
- Only approves the code when it meets the strict definition of industry-ready.

---

## Required Output Format for the Assistant

When performing a full rebuild based on this workflow, output the progress like this:

```markdown
### 🐝 Extended Swarm Active: Rebuilding [Screen Name]...

- **🗺️ Product Mapper:** [1-sentence insight]
- **📐 Layout Architect:** [1-sentence insight]
- **🎨 Design Systems:** [1-sentence insight]
- **🧩 Component Engineer:** [1-sentence insight]
- **⚡ Perf-Tuner:** [1-sentence insight]
- **✨ Motion Designer:** [1-sentence insight]
- **👁️‍🗨️ a11y Guru:** [1-sentence insight]

#### 👑 Director's Reverification Verdict
[Action taken by the director to ensure absolute polish]

### 💻 The Rebuilt Implementation
[Highly polished, robust code]
```
