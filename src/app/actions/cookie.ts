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
        // Fetch JWT token from our API endpoint
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/token`, {
            method: 'GET',
            headers: {
                'Cookie': (await cookies()).toString()
            }
        });
        
        if (!response.ok) {
            console.log("Failed to get JWT token");
            return null;
        }
        
        const { token } = await response.json();
        return token;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
}

export async function getDecodedToken() {
    try {
        const cookiesStore = await cookies();
        // Use the same logic as getAccessToken
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieName = isProduction 
            ? "next-auth.session-token" 
            : "__Secure-next-auth.session-token";
        
        let sessionToken = cookiesStore.get(cookieName);
        
        // Fallback to the other cookie name if not found
        if (!sessionToken) {
            const alternateCookieName = isProduction 
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token";
            sessionToken = cookiesStore.get(alternateCookieName);
        }
        
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