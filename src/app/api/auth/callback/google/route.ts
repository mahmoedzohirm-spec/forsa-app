import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { generateToken } from "@/lib/auth"; // استيراد دالة إنشاء التوكن

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
    // 1. الحصول على access_token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=google_token_failed`
      );
    }

    // 2. جلب بيانات المستخدم
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      console.error("No email from Google:", userInfo);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=google_email_missing`
      );
    }

    // 3. البحث عن المستخدم أو إنشاؤه
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
          console.log("🚫 User is banned:", userData.email);
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/?error=account_banned`
          );
        }
        console.log("✅ Existing user found:", userData.email);
      }

      // ============================================================
      // 4. ✅ إنشاء التوكن (JWT) ووضعه في الكوكي (بدلاً من كوكي user)
      // ============================================================
      const token = generateToken(userData); // إنشاء التوكن

      // إنشاء الرد وإعادة التوجيه
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);

      // ✅ وضع التوكن في كوكي httpOnly (للمصادقة)
      response.cookies.set({
        name: "token", // نفس الاسم الذي يبحث عنه الـ middleware
        value: token,
        httpOnly: true, // مهم للأمان
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 يوم
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      // (اختياري) يمكنك الاحتفاظ بكوكي user للواجهة إذا أردت
      // response.cookies.set({
      //   name: "user",
      //   value: JSON.stringify(userData),
      //   httpOnly: false,
      //   path: "/",
      //   maxAge: 60 * 60 * 24 * 7,
      //   sameSite: "lax",
      //   secure: process.env.NODE_ENV === "production",
      // });

      console.log("🍪 JWT Token set for user:", userData.email);
      return response;

    } catch (dbError) {
      console.error("Database error during Google login:", dbError);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=database_error`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=google_auth_failed`
    );
  }
}
