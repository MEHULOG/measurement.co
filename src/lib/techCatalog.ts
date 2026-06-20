import type { Option } from '@/components/ui/MultiSelect'

export const FRONTEND_OPTIONS: Option[] = [
  { value: 'react', label: 'React', description: 'UI library' },
  { value: 'nextjs', label: 'Next.js', description: 'React framework' },
  { value: 'vue', label: 'Vue', description: 'Progressive framework' },
  { value: 'nuxt', label: 'Nuxt', description: 'Vue framework' },
  { value: 'svelte', label: 'Svelte', description: 'Compiled UI' },
  { value: 'sveltekit', label: 'SvelteKit', description: 'Svelte framework' },
  { value: 'angular', label: 'Angular', description: 'Full framework' },
  { value: 'solid', label: 'SolidJS', description: 'Fine-grained reactivity' },
  { value: 'astro', label: 'Astro', description: 'Content + islands' },
  { value: 'remix', label: 'Remix', description: 'Full-stack React' },
  { value: 'react-native', label: 'React Native' },
  { value: 'expo', label: 'Expo', description: 'React Native toolkit' },
  { value: 'flutter', label: 'Flutter', description: 'Dart UI toolkit' },
  { value: 'swiftui', label: 'SwiftUI', description: 'iOS / macOS' },
  { value: 'jetpack-compose', label: 'Jetpack Compose', description: 'Android' },
  { value: 'electron', label: 'Electron', description: 'Desktop apps' },
  { value: 'tauri', label: 'Tauri', description: 'Lightweight desktop' },
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'shadcn', label: 'shadcn/ui' },
  { value: 'mui', label: 'Material UI' },
  { value: 'chakra', label: 'Chakra UI' },
]

export const BACKEND_OPTIONS: Option[] = [
  { value: 'nodejs', label: 'Node.js' },
  { value: 'express', label: 'Express' },
  { value: 'fastify', label: 'Fastify' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'hono', label: 'Hono', description: 'Edge-first' },
  { value: 'convex', label: 'Convex', description: 'Realtime backend' },
  { value: 'supabase', label: 'Supabase Edge Functions' },
  { value: 'firebase', label: 'Firebase Functions' },
  { value: 'cloudflare-workers', label: 'Cloudflare Workers' },
  { value: 'aws-lambda', label: 'AWS Lambda' },
  { value: 'vercel-functions', label: 'Vercel Functions' },
  { value: 'django', label: 'Django' },
  { value: 'fastapi', label: 'FastAPI' },
  { value: 'flask', label: 'Flask' },
  { value: 'rails', label: 'Ruby on Rails' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'go', label: 'Go', description: 'net/http or chi' },
  { value: 'rust-axum', label: 'Rust (Axum)' },
  { value: 'dotnet', label: '.NET / ASP.NET Core' },
  { value: 'spring-boot', label: 'Spring Boot' },
]

export const DATABASE_OPTIONS: Option[] = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'convex-db', label: 'Convex DB' },
  { value: 'supabase-db', label: 'Supabase (Postgres)' },
  { value: 'firestore', label: 'Firestore' },
  { value: 'planetscale', label: 'PlanetScale' },
  { value: 'neon', label: 'Neon' },
  { value: 'turso', label: 'Turso', description: 'SQLite at the edge' },
  { value: 'cockroach', label: 'CockroachDB' },
  { value: 'dynamodb', label: 'DynamoDB' },
  { value: 'mssql', label: 'SQL Server' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'prisma', label: 'Prisma', description: 'ORM' },
  { value: 'drizzle', label: 'Drizzle', description: 'ORM' },
]

export const AUTH_OPTIONS: Option[] = [
  { value: 'clerk', label: 'Clerk' },
  { value: 'auth0', label: 'Auth0' },
  { value: 'firebase-auth', label: 'Firebase Auth' },
  { value: 'supabase-auth', label: 'Supabase Auth' },
  { value: 'cognito', label: 'AWS Cognito' },
  { value: 'next-auth', label: 'Auth.js / NextAuth' },
  { value: 'lucia', label: 'Lucia' },
  { value: 'workos', label: 'WorkOS' },
  { value: 'okta', label: 'Okta' },
  { value: 'keycloak', label: 'Keycloak' },
  { value: 'magic', label: 'Magic.link' },
  { value: 'custom-jwt', label: 'Custom JWT' },
  { value: 'sessions', label: 'Session cookies' },
  { value: 'oauth-google', label: 'Google OAuth' },
  { value: 'oauth-github', label: 'GitHub OAuth' },
]

export const APIS_OPTIONS: Option[] = [
  { value: 'rest', label: 'REST' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'trpc', label: 'tRPC' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'websockets', label: 'WebSockets' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'openai', label: 'OpenAI', description: 'GPT, embeddings, vision' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'google-gemini', label: 'Google Gemini' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'huggingface', label: 'Hugging Face' },
  { value: 'replicate', label: 'Replicate' },
  { value: 'pinecone', label: 'Pinecone', description: 'Vector DB' },
  { value: 'weaviate', label: 'Weaviate', description: 'Vector DB' },
  { value: 'langchain', label: 'LangChain' },
  { value: 'llamaindex', label: 'LlamaIndex' },
  { value: 'stripe', label: 'Stripe', description: 'Payments' },
  { value: 'twilio', label: 'Twilio', description: 'SMS / Voice' },
  { value: 'sendgrid', label: 'SendGrid', description: 'Email' },
  { value: 'resend', label: 'Resend', description: 'Email' },
  { value: 'mapbox', label: 'Mapbox' },
  { value: 'google-maps', label: 'Google Maps' },
  { value: 'algolia', label: 'Algolia', description: 'Search' },
]

export interface StackSelection {
  frontend: string[]
  backend: string[]
  database: string[]
  auth: string[]
  apis: string[]
}

export const EMPTY_STACK: StackSelection = {
  frontend: [],
  backend: [],
  database: [],
  auth: [],
  apis: [],
}

export const STACK_FIELDS: Array<{
  key: keyof StackSelection
  label: string
  options: Option[]
  description: string
}> = [
  {
    key: 'frontend',
    label: 'Frontend',
    options: FRONTEND_OPTIONS,
    description: 'UI frameworks, mobile or desktop shells, styling.',
  },
  {
    key: 'backend',
    label: 'Backend',
    options: BACKEND_OPTIONS,
    description: 'Servers, edge runtimes, language frameworks.',
  },
  {
    key: 'database',
    label: 'Database',
    options: DATABASE_OPTIONS,
    description: 'Where your data lives, plus ORMs.',
  },
  {
    key: 'auth',
    label: 'Authentication',
    options: AUTH_OPTIONS,
    description: 'How users sign in.',
  },
  {
    key: 'apis',
    label: 'APIs / AI services',
    options: APIS_OPTIONS,
    description:
      'Outbound integrations: LLMs, payments, email, search, etc.',
  },
]

export function labelFor(options: Option[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value
}
