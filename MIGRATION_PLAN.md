# Database Migration Plan (If Proceeding)

## Option 2: Hybrid Approach (Recommended if migrating)

### Keep Supabase For:
- Authentication (`supabase.auth.*`)
- Session management
- OAuth flows
- Middleware auth

### Replace with Neon + Prisma:
- Database operations only
- Table queries
- Data persistence

### Required Changes:

1. **Add Prisma:**
```bash
npm install prisma @prisma/client
npm install -D prisma
```

2. **Environment Variables:**
```env
# Keep existing Supabase auth
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Add Neon database
DATABASE_URL=your_neon_connection_string
```

3. **Database Schema (Prisma):**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Profile {
  id                String   @id @default(uuid())
  email             String
  openrouter_api_key String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  conversations     Conversation[]
}

model Conversation {
  id         String    @id @default(uuid())
  user_id    String
  title      String
  model      String
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  messages   Message[]
  profile    Profile   @relation(fields: [user_id], references: [id])
}

model Message {
  id              String       @id @default(uuid())
  conversation_id String
  role            String
  content         String
  created_at      DateTime     @default(now())
  conversation    Conversation @relation(fields: [conversation_id], references: [id])
  attachments     Attachment[]
}

model Attachment {
  id         String   @id @default(uuid())
  message_id String
  filename   String
  file_type  String
  file_size  BigInt
  file_url   String
  created_at DateTime @default(now())
  message    Message  @relation(fields: [message_id], references: [id])
}
```

4. **Update API Routes:**
Replace Supabase database calls with Prisma:
```typescript
// Before
const { data: conversations } = await supabase
  .from('conversations')
  .select('*')
  .eq('user_id', user.id)

// After  
const conversations = await prisma.conversation.findMany({
  where: { user_id: user.id }
})
```

### Migration Steps:
1. Set up Neon database
2. Add Prisma to project
3. Create database schema
4. Replace database calls (keep auth)
5. Test thoroughly
6. Deploy

### Estimated Time: 1-2 weeks
