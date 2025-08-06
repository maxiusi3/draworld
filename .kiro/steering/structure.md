# Project Structure & Organization

## Root Directory Structure
```
whimsy-brush/
├── src/                     # Frontend source code
├── functions/               # Firebase Cloud Functions
├── public/                  # Static assets
├── e2e/                     # End-to-end tests
├── coverage/                # Test coverage reports
├── dist/                    # Production build output
└── scripts/                 # Deployment and utility scripts
```

## Frontend Structure (`src/`)
```
src/
├── components/              # Reusable UI components
│   ├── ErrorBoundary.tsx   # Error handling wrapper
│   ├── ImageEditor/        # Image cropping/editing
│   ├── ImageUploader/      # File upload component
│   └── Layout/             # App layout components
├── pages/                   # Route-level page components
│   ├── HomePage.tsx        # Landing page
│   ├── CreatePage.tsx      # Image upload & generation
│   ├── ResultPage.tsx      # Video playback & sharing
│   ├── DashboardPage.tsx   # User dashboard
│   ├── LoginPage.tsx       # Authentication
│   ├── RegisterPage.tsx    # User registration
│   ├── SettingsPage.tsx    # User settings
│   ├── TermsPage.tsx       # Legal pages
│   └── PrivacyPage.tsx
├── hooks/                   # Custom React hooks
│   ├── useAuth.tsx         # Authentication state
│   └── use-mobile.tsx      # Mobile detection
├── services/                # API and external services
│   ├── storageService.ts   # Firebase Storage operations
│   └── videoService.ts     # Video-related API calls
├── config/                  # Configuration files
│   └── firebase.ts         # Firebase initialization
├── lib/                     # Utility functions
│   └── utils.ts            # Common utilities (cn function)
├── __tests__/              # Component tests
└── utils/__tests__/        # Utility function tests
```

## Backend Structure (`functions/`)
```
functions/
├── src/
│   ├── index.ts            # Main Cloud Functions exports
│   └── services/
│       └── dreamina.ts     # Dreamina AI API integration
├── lib/                    # Compiled JavaScript output
└── package.json            # Functions dependencies
```

## Component Organization Patterns

### Page Components
- Located in `src/pages/`
- Named with `Page` suffix (e.g., `HomePage.tsx`)
- Handle route-level logic and layout
- Import and compose smaller components

### Reusable Components
- Located in `src/components/`
- Organized in folders when they have multiple files
- Export from index files when applicable
- Follow single responsibility principle

### Custom Hooks
- Located in `src/hooks/`
- Named with `use` prefix
- Handle stateful logic that can be shared across components
- Include corresponding test files in `__tests__/` subdirectories

### Services
- Located in `src/services/`
- Handle external API calls and data operations
- Abstract Firebase operations from components
- Return promises for async operations

## File Naming Conventions
- **Components**: PascalCase (e.g., `ImageEditor.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Services**: camelCase with `Service` suffix (e.g., `storageService.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Pages**: PascalCase with `Page` suffix (e.g., `HomePage.tsx`)

## Import Patterns
- Use path aliases: `@/components/...` instead of `../../../components/...`
- Group imports: external libraries first, then internal modules
- Use named exports for utilities, default exports for components

## Testing Structure
- Unit tests alongside source files in `__tests__/` directories
- E2E tests in dedicated `e2e/` directory
- Test files follow `.test.tsx` or `.spec.ts` naming
- Coverage reports generated in `coverage/` directory

## Configuration Files
- **TypeScript**: Multiple tsconfig files for different contexts (app, node, test)
- **Build**: Vite configuration in `vite.config.ts`
- **Styling**: Tailwind config with custom theme
- **Firebase**: `firebase.json` for service configuration
- **Security**: Firestore and Storage rules in separate files