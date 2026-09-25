import { supabase } from "../lib/supabase";

export async function registerWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName
      },
      emailRedirectTo: window.location.origin
    }
  });
}

export async function loginWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function resendSignupVerification(email: string) {
  return supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
}
