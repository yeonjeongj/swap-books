import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.nickname = user.name ?? "";
        token.avatarUrl = user.image ?? "";
      }
      if (trigger === "update" && session) {
        if (session.nickname != null) token.nickname = session.nickname;
        if (session.avatarUrl != null) token.avatarUrl = session.avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.nickname = (token.nickname as string) ?? "";
      session.user.avatarUrl = (token.avatarUrl as string) ?? "";
      return session;
    },
  },
});
