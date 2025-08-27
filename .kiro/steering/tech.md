# Technology Stack

## Framework & Runtime
- **Next.js 15.3.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety and developer experience
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 3.4+** - Utility-first CSS framework
- **Custom UI Components** - Located in `src/components/ui/`
- **Responsive Design** - Mobile-first approach for all features

## Backend Services
- **Firebase** - Authentication, database, and hosting
- **Runware.ai API** - AI image-to-video generation
- **Stripe** - Payment processing for credit purchases

## Development Tools
- **ESLint** - Code linting (build errors ignored for rapid prototyping)
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundler for development

## Common Commands

### Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - Firebase credentials
  - Runware.ai API key
  - Stripe keys
  - Set `VITE_MOCK_PAYMENTS=true` for testing

## API Integration Guidelines
- All external API calls should include proper error handling
- Implement rate limiting for AI generation requests
- Use environment variables for all API keys and secrets
- Content moderation should occur before AI processing

## Performance Considerations
- Target page load times under 3 seconds
- Video generation should complete within 60 seconds
- Implement loading states and progress indicators
- Use Next.js Image optimization for artwork uploads