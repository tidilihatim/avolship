"use server"

import { cookies } from "next/headers";

export async function deleteCookie(name: string) {
    const cookiesStore = await cookies();
    cookiesStore.delete(name);
    Promise.resolve();
}