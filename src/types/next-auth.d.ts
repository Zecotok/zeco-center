import "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            fullname: string
            isAdmin: boolean
            name?: string | null
            image?: string | null
        }
    }

    interface User {
        id: string
        email: string
        fullname: string
        isAdmin: boolean
    }
} 