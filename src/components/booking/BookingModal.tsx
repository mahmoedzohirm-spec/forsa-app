import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { Ticket, User, PaymentMethod } from "@/types";
import { XIcon, CheckIcon, AlertIcon, UploadIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";

export default function BookingModal({
  ticket,
  user,
  ticketPrice,
  currency,
  onClose,
  onSuccess,
}: {
  ticket: Ticket;
  user: User | null;
  ticketPrice: string;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('BookingModal');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedMethodData, setSelectedMethodData] = useState<PaymentMethod | null>(null);
  const [userName, setUserName] = useState(user?.name || "");
  const [userPhone, setUserPhone] = useState(user?.phone || "");
  const [contactPhone, setContactPhone] = useState("");
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPaymentMethods(d.methods);
      })
      .catch(() => setError(t('errors.load_methods')));
  }, [t]);

  const handleMethodChange = (val: string) => {
    setSelectedMethod(val);
    const m = paymentMethods.find((pm) => pm.name === val);
    setSelectedMethodData(m || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError(t('errors.file_too_large')); return; }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userName || !userPhone || !contactPhone || !selectedMethod || !receiptImage) {
      setError(t('errors.fill_all_fields'));
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tickets/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: ticket.number,
          userId: user?.id || null,
          userName,
          userPhone,
          contactPhone,
          paymentMethod: selectedMethod,
          receiptImage,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); } else setError(data.error || t('errors.booking_failed'));
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
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#c4b5fd",
    marginBottom: "6px",
    display: "block",
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
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#f59e0b" }}>{t('title')}</h2>
            <div
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                borderRadius: "8px",
                padding: "4px 16px",
                fontSize: "28px",
                fontWeight: "900",
                color: "#fbbf24",
                marginTop: "4px",
              }}
            >
              #{ticket.number}
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
            <XIcon />
          </button>
        </div>

        {error && (
          <div
            style={{
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
            }}
          >
            <AlertIcon /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={labelStyle}>{t('fields.name')}</label>
            <input style={inputStyle} type="text" placeholder={t('placeholders.name')} value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{t('fields.transfer_phone')}</label>
            <input style={inputStyle} type="tel" placeholder={t('placeholders.transfer_phone')} value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#f9a8d4" }}>{t('fields.contact_phone')}</label>
            <input
              style={{ ...inputStyle, border: "1px solid rgba(249, 168, 212, 0.4)" }}
              type="tel"
              placeholder={t('placeholders.contact_phone')}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>{t('fields.payment_method')}</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={selectedMethod}
              onChange={(e) => handleMethodChange(e.target.value)}
            >
              <option value="">{t('select_method')}</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.name} style={{ background: "#0f0a1c" }}>
                  {pm.name}
                </option>
              ))}
            </select>
            {selectedMethodData && (
              <div
                style={{
                  marginTop: "12px",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#fbbf24", marginBottom: "10px" }}>
                  {t('details.title', { name: selectedMethodData.name })}
                </p>
                {selectedMethodData.iban && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>{t('details.iban')}</span>
                    <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", fontFamily: "Inter, monospace", direction: "ltr", textAlign: "right" }}>
                      {selectedMethodData.iban}
                    </p>
                  </div>
                )}
                {selectedMethodData.bank_name && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>{t('details.bank')}</span>
                    <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>{selectedMethodData.bank_name}</p>
                  </div>
                )}
                {selectedMethodData.account_holder && (
                  <div>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>{t('details.account_holder')}</span>
                    <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600" }}>{selectedMethodData.account_holder}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>{t('fields.receipt')}</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: receiptImage ? "2px solid #10b981" : "2px dashed rgba(124, 58, 237, 0.4)",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                background: receiptImage ? "rgba(16, 185, 129, 0.1)" : "rgba(15, 10, 28, 0.5)",
                transition: "all 0.2s",
              }}
            >
              {receiptImage ? (
                <div style={{ color: "#10b981" }}>
                  <CheckIcon />
                  <p style={{ marginTop: "8px", fontWeight: "600", fontSize: "14px" }}>{t('uploaded')}</p>
                  <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>{receiptFileName}</p>
                </div>
              ) : (
                <div style={{ color: "#9ca3af" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <UploadIcon />
                  </div>
                  <p style={{ marginTop: "8px", fontWeight: "600", fontSize: "14px" }}>{t('upload_prompt')}</p>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>{t('upload_hint')}</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFileChange} />
          </div>
          <div>
            <label style={labelStyle}>{t('fields.notes')}</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              placeholder={t('placeholders.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-gold pulse-gold"
            style={{
              padding: "18px",
              borderRadius: "14px",
              fontSize: "18px",
              fontWeight: "800",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontFamily: "Cairo, Inter, sans-serif",
            }}
          >
            {loading ? <Spinner /> : "🎟️"}
            {loading ? t('booking') : t('book_button', { price: ticketPrice, currency })}
          </button>
        </div>
      </div>
    </div>
  );
}