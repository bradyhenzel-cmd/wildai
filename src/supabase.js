import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isProd = window.location.hostname === 'wildai.app'

export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: async (url, options = {}) => {
            try {
                const headers = new Headers(options.headers)
                if (isProd) {
                    const clerkToken = await window.Clerk?.session?.getToken({ template: 'supabase' })
                    if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`)
                }
                return fetch(url, { ...options, headers })
            } catch {
                return fetch(url, options)
            }
        }
    },
    realtime: {
        params: {
            apikey: supabaseKey
        }
    }
})