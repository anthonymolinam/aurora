// Cliente de Auth para Email/Password
"use client";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";

export function listenAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export async function signOut() {
  return fbSignOut(auth);
}
