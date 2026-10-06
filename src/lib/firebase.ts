// ============================================================================
// REVA (reva.in) — Firebase Phone Authentication Client (10,000 Free SMS/Month)
// Supports Real SMS Delivery with Invisible reCAPTCHA Verification
// Gracefully falls back to simulated mode when API keys are not yet configured
// ============================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim().length > 5
  );
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;

  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    if (!app) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
    if (!auth && app) {
      auth = getAuth(app);
      auth.useDeviceLanguage();
    }
    return auth;
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    return null;
  }
}

/**
 * Initializes reCAPTCHA verifier for Firebase Phone Auth
 */
export function setupRecaptcha(
  containerId: string = 'recaptcha-container',
  callback?: () => void
): RecaptchaVerifier | null {
  const authInstance = getFirebaseAuth();
  if (!authInstance || typeof window === 'undefined') return null;

  try {
    // Clear any existing verifier on window if re-rendering
    if ((window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier) {
      try {
        (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier?.clear();
      } catch {
        // ignore
      }
    }

    let containerEl = document.getElementById(containerId);
    if (!containerEl) {
      containerEl = document.createElement('div');
      containerEl.id = containerId;
      document.body.appendChild(containerEl);
    }

    const verifier = new RecaptchaVerifier(authInstance, containerEl, {
      size: 'invisible',
      callback: () => {
        if (callback) callback();
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please try again.');
      },
    });

    (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.error('Failed to initialize Firebase RecaptchaVerifier:', err);
    return null;
  }
}

/**
 * Sends a real SMS OTP via Firebase Auth
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase Auth is not configured. Please add Firebase keys to .env.local');
  }

  // Format phone number to E.164 (e.g. +919876543210)
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const formatted = clean.startsWith('+') ? clean : `+91${clean.slice(-10)}`;

  return await signInWithPhoneNumber(authInstance, formatted, verifier);
}

/**
 * Confirms Firebase SMS OTP Code
 */
export async function confirmFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> {
  return await confirmationResult.confirm(otpCode.trim());
}

/**
 * 1-Click Google Sign-In via Firebase
 */
export async function signInWithGoogleClient(): Promise<UserCredential> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase Auth is not configured.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(authInstance, provider);
}
