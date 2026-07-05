import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://jmimieqvhrdpdvovorhx.supabase.co";
const SUPABASE_KEY = "sb_publishable_23gcxoA6juzOJOQga7ZihQ_3kdW4wIc";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function getAppUser(){
  const rawAppUser = sessionStorage.getItem("appUser");
  if(!rawAppUser) return null;

  try{
    return JSON.parse(rawAppUser);
  }catch(error){
    console.error(error);
    sessionStorage.removeItem("appUser");
    return null;
  }
}

export function setAppUser(appUser){
  sessionStorage.setItem("appUser", JSON.stringify(appUser));
}

export async function requireLogin(){
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if(sessionError){
    console.error(sessionError);
    sessionStorage.removeItem("appUser");
    location.href = "login.html";
    return null;
  }

  const authUser = sessionData?.session?.user;
  if(!authUser){
    sessionStorage.removeItem("appUser");
    location.href = "login.html";
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("app_users")
    .select("id,auth_user_id,username,email,display_name,role,is_active")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if(profileError){
    console.error(profileError);
    sessionStorage.removeItem("appUser");
    location.href = "login.html";
    return null;
  }

  if(!profile){
    sessionStorage.removeItem("appUser");
    await supabase.auth.signOut();
    location.href = "login.html";
    return null;
  }

  if(profile.is_active === false){
    sessionStorage.removeItem("appUser");
    await supabase.auth.signOut();
    location.href = "login.html";
    return null;
  }

  const appUser = {
    id: profile.id,
    user_id: profile.id,
    auth_user_id: profile.auth_user_id,
    username: profile.username,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role,
    is_active: profile.is_active
  };
  setAppUser(appUser);
  return appUser;
}

export function isAdmin(appUser){
  return appUser?.role === "admin";
}

export async function logout(){
  sessionStorage.removeItem("appUser");
  try{
    await supabase.auth.signOut();
  }catch(error){
    console.error(error);
  }
  location.href = "login.html";
}
