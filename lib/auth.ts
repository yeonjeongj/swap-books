import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "dev-credentials",
            name: "개발자 로그인 (Dev Only)",
            credentials: {
              nickname: { label: "닉네임", type: "text", placeholder: "로그인할 유저의 닉네임" },
            },
            async authorize(credentials) {
              if (!credentials?.nickname || typeof credentials.nickname !== "string") return null;
              const { data } = await supabase
                .from("users")
                .select("id, nickname, avatar_url")
                .eq("nickname", credentials.nickname)
                .maybeSingle();
              if (!data) return null;
              return { id: data.id, name: data.nickname, image: data.avatar_url ?? undefined };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // On sign-in, check DB for existing profile to avoid resetting a saved nickname
        const { data } = await supabase
          .from("users")
          .select("nickname, avatar_url")
          .eq("id", token.sub!)
          .maybeSingle();

        token.nickname = data?.nickname ?? user.name ?? "";
        token.avatarUrl = data?.avatar_url ?? user.image ?? "";
        token.hasCompletedOnboarding = !!data?.nickname;
      }
      if (trigger === "update" && session) {
        if (session.nickname != null) token.nickname = session.nickname;
        if (session.avatarUrl != null) token.avatarUrl = session.avatarUrl;
        if (session.hasCompletedOnboarding != null) token.hasCompletedOnboarding = session.hasCompletedOnboarding;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.nickname = (token.nickname as string) ?? "";
      session.user.avatarUrl = (token.avatarUrl as string) ?? "";
      session.user.hasCompletedOnboarding = (token.hasCompletedOnboarding as boolean) ?? false;
      return session;
    },
  },
});
