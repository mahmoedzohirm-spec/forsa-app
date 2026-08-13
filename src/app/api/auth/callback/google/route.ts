import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=google_auth_failed`
    );
  }

  if (!code) {
    console.error("Missing code from Google");
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=missing_code`
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=google_token_failed`
      );
    }

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      console.error("No email from Google:", userInfo);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=google_email_missing`
      );
    }

    const client = await pool.connect();
    try {
      const existingUser = await client.query(
        "SELECT id, name, email, phone, is_admin, is_banned, created_at FROM users WHERE email = $1",
        [userInfo.email]
      );

      let userData;
      if (existingUser.rows.length === 0) {
        const newUser = await client.query(
          `INSERT INTO users (name, email, password, is_admin) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, name, email, phone, is_admin, is_banned, created_at`,
          [userInfo.name || userInfo.email.split("@")[0], userInfo.email, "", false]
        );
        userData = newUser.rows[0];
        console.log("✅ New user created:", userData.email);
      } else {
        userData = existingUser.rows[0];
        if (userData.is_banned) {
          console.log("User is banned:", userData.email);
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/?error=account_banned`
          );
        }
        console.log("✅ Existing user found:", userData.email);
      }

      // تخزين بيانات المستخدم في كوكي
      const cookieStore = cookies();
      cookieStore.set("user", JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);
    } catch (dbError) {
      console.error("Database error during Google login:", dbError);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=google_db_failed`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=google_auth_failed`
    );
  }
}
