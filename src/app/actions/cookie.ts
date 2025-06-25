"use server"

import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";

export async function deleteCookie(name: string) {
    const cookiesStore = await cookies();
    cookiesStore.delete(name);
    Promise.resolve();
}

export async function getAccessToken() {
    try {
        const cookiesStore = await cookies();
        const cookieName = process.env.COOKIE_NAME || "next-auth.session-token";
        const sessionToken = cookiesStore.get(cookieName);
        
        if (!sessionToken) {
            return null;
        }

        // Return the raw JWT token string (what you send to backend)
        return sessionToken.value;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
}

export async function getDecodedToken() {
    try {
        const cookiesStore = await cookies();
        const cookieName = process.env.COOKIE_NAME || "next-auth.session-token";
        const sessionToken = cookiesStore.get(cookieName);
        
        if (!sessionToken) {
            return null;
        }

        // Create a mock request object for getToken
        const req = {
            cookies: {
                get: (name: string) => sessionToken.name === name ? sessionToken : undefined,
                getAll: () => [sessionToken]
            },
            headers: new Headers()
        } as any;

        const token = await getToken({ 
            req, 
            secret: process.env.NEXTAUTH_SECRET 
        });

        return token;
    } catch (error) {
        console.error("Error getting decoded token:", error);
        return null;
    }
}