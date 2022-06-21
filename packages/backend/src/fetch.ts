import fetch from 'cross-fetch';

export async function fPost(route: string, body: Record<string, any>, headers?: Record<string, any>): Promise<Record<string, any>> {
    const res = await fetch(route, {
        method: "POST",
        body: JSON.stringify(body),
        headers
    });
    return await res.json();
}

export async function fGet(route: string, headers?: Record<string, any>): Promise<Record<string, any>> {
    const res = await fetch(route, {
        headers
    });
    return await res.json();
}
