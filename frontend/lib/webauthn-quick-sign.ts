"use client";

const STORAGE_PREFIX = "stellarstream.quickSignCredential";

export interface StoredQuickSignCredential {
  credentialId: string;
  walletAddress: string;
  createdAt: string;
}

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

export function getQuickSignStorageKey(walletAddress: string): string {
  return `${STORAGE_PREFIX}.${walletAddress.toLowerCase()}`;
}

export function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";

  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function createWebAuthnChallenge(): ArrayBuffer {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return bytesToArrayBuffer(challenge);
}

export function loadQuickSignCredential(walletAddress: string): StoredQuickSignCredential | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(getQuickSignStorageKey(walletAddress));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredQuickSignCredential;
    return parsed.walletAddress.toLowerCase() === walletAddress.toLowerCase() && parsed.credentialId
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function storeQuickSignCredential(credential: StoredQuickSignCredential): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getQuickSignStorageKey(credential.walletAddress), JSON.stringify(credential));
}

export async function registerQuickSignCredential(walletAddress: string): Promise<StoredQuickSignCredential> {
  if (!isWebAuthnAvailable()) {
    throw new Error("Device biometrics are not available in this browser.");
  }

  const existing = loadQuickSignCredential(walletAddress);
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: createWebAuthnChallenge(),
      rp: {
        name: "StellarStream",
        id: window.location.hostname,
      },
      user: {
        id: bytesToArrayBuffer(new TextEncoder().encode(walletAddress)),
        name: walletAddress,
        displayName: "StellarStream wallet signer",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "required",
      },
      excludeCredentials: existing
        ? [
            {
              id: bytesToArrayBuffer(base64UrlToBytes(existing.credentialId)),
              type: "public-key",
              transports: ["internal"],
            },
          ]
        : [],
      timeout: 60_000,
      attestation: "none",
    },
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("Quick-Sign setup was cancelled.");
  }

  const stored = {
    credentialId: bytesToBase64Url(credential.rawId),
    walletAddress,
    createdAt: new Date().toISOString(),
  };

  storeQuickSignCredential(stored);
  return stored;
}

export async function verifyQuickSignCredential(walletAddress: string): Promise<StoredQuickSignCredential> {
  if (!isWebAuthnAvailable()) {
    throw new Error("Device biometrics are not available in this browser.");
  }

  const credential = loadQuickSignCredential(walletAddress);
  if (!credential) {
    throw new Error("Set up Quick-Sign before signing.");
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: createWebAuthnChallenge(),
      allowCredentials: [
        {
          id: bytesToArrayBuffer(base64UrlToBytes(credential.credentialId)),
          type: "public-key",
          transports: ["internal"],
        },
      ],
      timeout: 60_000,
      userVerification: "required",
    },
  });

  if (!(assertion instanceof PublicKeyCredential)) {
    throw new Error("Biometric verification was cancelled.");
  }

  return credential;
}
