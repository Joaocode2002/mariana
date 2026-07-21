import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hubnkrdewlhoqgaujgeo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3rgNb4KzZ3td4fR7aJs6AA_uKOvwKJ3";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
