import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export async function register(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) throw error;

  if (data.user) {
    try {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        username,
      });

      if (profileError) {
        console.error('Profile creation warning:', profileError);
      }
    } catch (e) {
      console.error('Profile creation error:', e);
    }
  }

  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
