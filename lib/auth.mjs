import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma.mjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (user) {
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (isValid) {
            return {
              id: String(user.id),
              name: user.name,
              email: user.email,
              role: user.role,
              customerId: user.customerId ? String(user.customerId) : null,
              isUserTable: true,
            }
          }
        }

        // Coba cek sebagai pelanggan (Customer)
        // Gunakan credentials.email sebagai pppoeUsername
        const customer = await prisma.customer.findUnique({
          where: { pppoeUsername: credentials.email },
        })

        if (customer && customer.pppoePassword === credentials.password) {
          return {
            id: String(customer.id),
            name: customer.name,
            email: customer.email || customer.pppoeUsername,
            role: "CUSTOMER", // Berikan role CUSTOMER untuk portal
            customerId: String(customer.id),
            isUserTable: false,
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.customerId = user.customerId
        token.isUserTable = user.isUserTable
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.customerId = token.customerId
        session.user.isUserTable = token.isUserTable
      }
      return session
    },
  },
})
