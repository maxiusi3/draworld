# Project Structure

## Root Directory Organization
```
prototype/                    # Main application code
├── src/
│   ├── app/                 # Next.js App Router pages
│   └── components/          # Reusable React components
├── public/                  # Static assets
└── package.json            # Dependencies and scripts

.kiro/                       # Kiro AI assistant configuration
├── specs/                   # Feature specifications
└── steering/               # Project guidance documents

.claude/                     # Claude AI agent configurations
├── agents/                  # Agent specifications
├── settings/               # Agent settings
└── system-prompts/         # System prompt templates
```

## App Router Structure (src/app/)
Following Next.js 13+ App Router conventions:

```
src/app/
├── layout.tsx              # Root layout with global styles
├── page.tsx               # Homepage (/)
├── globals.css            # Global CSS with Tailwind
├── 404/                   # Custom 404 page
├── login/                 # Authentication pages
├── signup/
├── forgot-password/
├── reset-password/
├── create/                # Core creation flow
├── gallery/               # Public gallery
├── pricing/               # Credit packages
├── account/               # User account management
│   ├── profile/
│   ├── creations/         # Personal gallery
│   ├── billing/           # Credit history
│   └── referrals/         # Referral system
├── terms-of-service/      # Legal pages
└── privacy-policy/
```

## Component Organization (src/components/)
```
src/components/
├── ui/                    # Base UI components
│   ├── Button.tsx         # Primary button component
│   └── [other-ui-components]
├── layout/                # Layout-specific components
│   ├── Header.tsx         # Global navigation
│   ├── Footer.tsx         # Global footer
│   └── UserMenu.tsx       # User dropdown menu
├── creation/              # Creation flow components
├── gallery/               # Gallery-related components
└── auth/                  # Authentication components
```

## Naming Conventions
- **Files**: PascalCase for components (`Button.tsx`), kebab-case for pages
- **Components**: PascalCase (`UserMenu`, `CreationFlow`)
- **Props**: camelCase with descriptive names
- **CSS Classes**: Tailwind utilities, custom classes in camelCase

## Route Patterns
- `/` - Homepage with value proposition
- `/create` - Multi-step creation wizard
- `/gallery` - Public community gallery
- `/pricing` - Credit packages
- `/account/*` - User account management
- `/creation/{id}/result` - Shareable creation pages

## State Management
- React hooks for local component state
- Context API for global state (user, credits)
- Server state managed through Next.js data fetching

## File Import Conventions
- Use `@/` alias for src directory imports
- Group imports: React, Next.js, external libraries, internal components
- Prefer named exports for components
- Use default exports for pages (App Router requirement)

## Asset Organization
```
public/
├── images/               # Static images
├── icons/               # SVG icons
└── onlook-preload-script.js  # Onlook integration
```

## Environment Configuration
- `.env.example` - Template with all required variables
- `.env` - Local development (gitignored)
- `.env.production` - Production overrides