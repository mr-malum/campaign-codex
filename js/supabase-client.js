const SUPABASE_URL = "https://tbwofemvjbrcpsnqlsyd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cHCVOmZ4axLZhKMjcCedBw_MOQeEq33";

const campaignSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

window.campaignSupabase = campaignSupabase;
