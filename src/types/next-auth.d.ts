import "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id?: string | null
            email?: string | null
            fullname?: string | null
            isAdmin?: boolean | null
            name?: string | null
            image?: string | null
        }
    }

    interface User {
        id?: string | null
        email?: string | null
        fullname?: string | null
        isAdmin?: boolean | null
    }
} 