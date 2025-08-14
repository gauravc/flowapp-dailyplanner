import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Authorization attempt:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          console.log('👤 User lookup result:', { found: !!user, hasPassword: !!user?.password })

          if (!user || !user.password) {
            console.log('❌ User not found or no password')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔑 Password validation:', { isValid: isPasswordValid })

          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
          }
          
          console.log('✅ Authorization successful:', userData)
          return userData
        } catch (error) {
          console.error('❌ Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('🔄 JWT callback:', { hasUser: !!user, tokenId: token.id })
      if (user) {
        token.id = user.id
        console.log('✅ JWT token updated with user ID:', token.id)
      }
      return token
    },
    async session({ session, token }: any) {
      console.log('🔄 Session callback:', { hasToken: !!token, tokenId: token?.id })
      if (token) {
        session.user.id = token.id as string
        console.log('✅ Session updated with user ID:', session.user.id)
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
