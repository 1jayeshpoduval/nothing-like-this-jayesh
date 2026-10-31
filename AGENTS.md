# CRITICAL RULES - MUST FOLLOW

## Responses

- Keep respones concise and to the point - unless the user asks otherwise.

## Planning Mode

- Always ask clarifying questions
- Never assume design, tech stack or features
- Select the most appropriate libraries and tech stack based on the project requirements. Prefer well-maintained, widely adopted solutions over custom implementations. Justify any new dependency before introducing it.
- Use sub-agents to assist with research
- Use sub-agents to review the different aspects of your plan before presenting it to the user

## Change / Edit Mode

- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently

## Project Stack

React ^19.x.x, Vite ^8.x.x, Tailwind CSS ^4.x

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint --fix`

## Code Style

- Use `const` by default. Only use `let` when reassignment is required. Never use `var`.
- Use named exports only. Never use default exports.
- Keep components small, composable, and focused on a single responsibility.

## UI Components

- Always use shadcn/ui components when an equivalent component exists.
- Do not build custom UI components from scratch unless the required component does not exist in shadcn/ui.
- Prefer composing existing shadcn/ui components over extending or replacing them.
- Keep styling consistent with the existing design system and Tailwind CSS utilities.

## Error Handling

- Allow errors to propagate unless there is a clear recovery strategy.
- Avoid unnecessary `try/catch` blocks.
- Handle errors at the appropriate application boundary.

## Boundaries

- Never modify files in `/generated/`.
- Never commit `.env` files or any file containing secrets.
- Keep business logic in `src/lib`, not inside page components.
- Keep components presentational whenever possible.

## Git

- Never merge to main branch.
- Push the working branch and open a pull request instead of merging. Add concise descriptions to the PR.
- Do not delete branches unless explicitly instructed.
- Conventional commits: feat:, fix:, chore:, docs:.
- Branch format: type/short-description (e.g., feat/user-auth).
