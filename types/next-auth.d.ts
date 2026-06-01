import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      nickname: string;
      avatarUrl: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    nickname: string;
    avatarUrl: string;
  }
}
