import { useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { User } from "@/types";
import { XIcon, EyeIcon, AlertIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";

export default function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: User) => void }) {
  // 👇 استخدم 'AuthModal' كـ namespace
  const t = useTranslations('AuthModal');
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { setError(t('errors.fill_fields')); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (data.success) { onLogin(data.user); onClose(); } else setError(data.error || t('errors.login_failed'));
    } catch { setError(t('errors.server_error')); } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPass) { setError(t('errors.fill_fields')); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPass }),
      });
      const data = await res.json();
      if (data.success) { onLogin(data.user); onClose(); } else setError(data.error || t('errors.register_failed'));
    } catch { setError(t('errors.server_error')); } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(15, 10, 28, 0.8)",
    border: "1px solid rgba(124, 58, 237, 0.3)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "Cairo, Inter, sans-serif",
    transition: "border-color 0.2s",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1a0f35 0%, #0f0a1c 100%)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "440px",
          padding: "32px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#f59e0b" }}>
            {tab === "login" ? t('login_title') : t('register_title')}
          </h2>
          <button onClick={onClose} style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
            <XIcon />
          </button>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "4px" }}>
          {(["login", "register"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setError(""); }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                fontFamily: "Cairo, Inter, sans-serif",
                transition: "all 0.2s",
                background: tab === tabKey ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "transparent",
                color: tab === tabKey ? "#fff" : "#9ca3af",
              }}
            >
              {tabKey === "login" ? t('login_tab') : t('register_tab')}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
            color: "#fca5a5",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}>
            <AlertIcon /> {error}
          </div>
        )}

        {tab === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
              onClick={() => {
                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
                const redirectUri = window.location.origin + "/api/auth/callback/google";
                const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
                  redirectUri
                )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
                window.location.href = googleUrl;
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                color: "#333",
                fontWeight: "700",
                fontSize: "14px",
                fontFamily: "Cairo, Inter, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('google_button')}
            </button>
            <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px" }}>{t('or')}</div>
            <input style={inputStyle} type="email" placeholder={t('email_placeholder')} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingLeft: "44px" }}
                type={showPass ? "text" : "password"}
                placeholder={t('password_placeholder')}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-purple"
              style={{ padding: "14px", borderRadius: "10px", fontSize: "15px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {loading ? <Spinner /> : null}
              {loading ? t('logging_in') : t('login_button')}
            </button>
            <Link
              href="/auth/forgot-password"
              onClick={() => onClose()}
              style={{
                color: "#9ca3af",
                fontSize: "13px",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
                marginTop: "4px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              {t('forgot_password')}
            </Link>
          </div>
        )}

        {tab === "register" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input style={inputStyle} type="text" placeholder={t('name_placeholder')} value={regName} onChange={(e) => setRegName(e.target.value)} />
            <input style={inputStyle} type="email" placeholder={t('email_placeholder')} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            <input style={inputStyle} type="tel" placeholder={t('phone_placeholder')} value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingLeft: "44px" }}
                type={showPass ? "text" : "password"}
                placeholder={t('password_placeholder')}
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn-purple"
              style={{ padding: "14px", borderRadius: "10px", fontSize: "15px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {loading ? <Spinner /> : null}
              {loading ? t('registering') : t('register_button')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}