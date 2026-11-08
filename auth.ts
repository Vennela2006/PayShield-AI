import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, hash] = storedHash.split(":");
  const iterations = Number(iterationsText);

  if (
    algorithm !== "pbkdf2" ||
    !Number.isInteger(iterations) ||
    iterations < 100000 ||
    !salt ||
    !/^[a-f0-9]{64}$/i.test(hash ?? "")
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations,
      hash: "SHA-256",
    },
    key,
    256
  );

  const actual = new Uint8Array(derived);
  const expected = new Uint8Array(
    (hash.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16))
  );

  let difference = actual.length ^ expected.length;

  for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
    difference |= actual[i] ^ expected[i];
  }

  return difference === 0;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Credentials({
      id: "demo",
      name: "Demo Login",
      credentials: {
        email: { label: "Demo email", type: "email" },
        password: { label: "Demo password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
        const storedHash = process.env.DEMO_PASSWORD_HASH;

        if (!email || !password || !demoEmail || !storedHash) {
          return null;
        }

        if (email !== demoEmail) {
          return null;
        }

        if (!(await verifyPassword(password, storedHash))) {
          return null;
        }

        return {
          id: "payshield-demo",
          name: "PayShield Demo",
          email: demoEmail,
        };
      },
    }),
  ],

  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});
