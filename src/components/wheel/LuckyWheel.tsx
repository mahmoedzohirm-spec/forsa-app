import { useRef, useState, useEffect, useCallback } from "react";
import { DrawTicket } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

export default function LuckyWheel({
  tickets,
  onWinner,
  fixedWinnerTicket,
}: {
  tickets: DrawTicket[];
  onWinner: (ticket: DrawTicket) => void;
  fixedWinnerTicket?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // متغير لتتبع أول سحب
  const hasUsedFixedWinner = useRef(false);

  const drawWheel = useCallback(
    (rot: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const items = tickets.length > 0 ? tickets : [{ number: 0, user_name: "لا توجد بطاقات" }];
      const numSlices = items.length;
      const sliceAngle = (2 * Math.PI) / numSlices;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 8;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // حدود خارجية
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      ctx.stroke();

      for (let i = 0; i < numSlices; i++) {
        const startAngle = rot + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const isPurple = i % 2 === 0;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = isPurple ? "rgba(124, 58, 237, 0.9)" : "rgba(245, 158, 11, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = isPurple ? "#fbbf24" : "#1a0a3c";
        ctx.font = `bold ${numSlices > 20 ? 10 : numSlices > 10 ? 12 : 14}px Cairo,Inter,sans-serif`;
        ctx.fillText(String(items[i].number || ""), radius - 12, 5);
        ctx.restore();
      }

      // الدائرة الوسطى
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(1, "#d97706");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // ===== المؤشر الثابت (في الأعلى) =====
      const pointerAngle = -Math.PI / 2; // أعلى العجلة
      const pointerLen = 25;
      const px = cx + radius * Math.cos(pointerAngle);
      const py = cy + radius * Math.sin(pointerAngle);
      ctx.beginPath();
      ctx.moveTo(px, py - pointerLen);
      ctx.lineTo(px - 12, py);
      ctx.lineTo(px + 12, py);
      ctx.closePath();
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // مؤشر جانبي للزينة (اختياري)
      ctx.beginPath();
      ctx.moveTo(cx + radius - 10, cy);
      ctx.lineTo(cx + radius + 20, cy - 12);
      ctx.lineTo(cx + radius + 20, cy + 12);
      ctx.closePath();
      ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [tickets]
  );

  useEffect(() => {
    drawWheel(rotation);
  }, [drawWheel, rotation]);

  const spinWheel = () => {
    if (spinning || tickets.length === 0) return;
    setSpinning(true);

    // ===== 1. اختيار الفائز =====
    let targetTicket: DrawTicket | null = null;

    // أول سحب فقط: استخدم الرقم الثابت إن وجد
    if (!hasUsedFixedWinner.current && fixedWinnerTicket !== undefined && fixedWinnerTicket !== null) {
      targetTicket = tickets.find((t) => t.number === fixedWinnerTicket) || null;
      if (targetTicket) {
        hasUsedFixedWinner.current = true;
        console.log("🎯 أول سحب: تثبيت الفائز على رقم", fixedWinnerTicket);
      }
    }

    // إذا لم نجد الرقم الثابت أو تم استخدامه، اختر عشوائياً
    if (!targetTicket) {
      targetTicket = tickets[Math.floor(Math.random() * tickets.length)];
      console.log("🔄 سحب عشوائي:", targetTicket.number);
    }

    // ===== 2. حساب الزاوية المستهدفة (المؤشر في الأعلى) =====
    const targetIndex = tickets.indexOf(targetTicket);
    const numSlices = tickets.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    
    // زاوية منتصف الشريحة المستهدفة
    const targetSliceAngle = targetIndex * sliceAngle + sliceAngle / 2;
    
    // المؤشر في الأعلى (الزاوية -PI/2)
    const pointerAngle = -Math.PI / 2;
    
    // الزاوية التي تجعل الشريحة في مواجهة المؤشر:
    // rotation + targetSliceAngle = pointerAngle (mod 2PI)
    // => rotation = pointerAngle - targetSliceAngle
    let targetRotation = pointerAngle - targetSliceAngle;
    
    // نضبط لتكون في المدى [0, 2PI) للقاعدة
    targetRotation = ((targetRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // ===== 3. إضافة 20 لفة سريعة =====
    const extraSpins = 20;
    // نضيف لفات إضافية مع مراعاة الدوران الحالي
    const totalRot = rotation + extraSpins * (2 * Math.PI) + (targetRotation - rotation % (2 * Math.PI));

    // ===== 4. تشغيل الحركة =====
    const duration = 5000;
    const startTime = performance.now();
    const startRot = rotation;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentRot = startRot + (totalRot - startRot) * easeOut(progress);
      rotationRef.current = currentRot;
      drawWheel(currentRot);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(currentRot);
        setSpinning(false);
        // ===== 5. إرسال الفائز (نفس الرقم اللي اخترناه) =====
        onWinner(targetTicket);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          style={{
            borderRadius: "50%",
            boxShadow: "0 0 40px rgba(124, 58, 237, 0.5), 0 0 80px rgba(245, 158, 11, 0.2)",
          }}
        />
      </div>
      <button
        onClick={spinWheel}
        disabled={spinning || tickets.length === 0}
        className="btn-gold pulse-gold"
        style={{
          padding: "14px 48px",
          borderRadius: "50px",
          fontSize: "18px",
          fontWeight: "800",
          cursor: spinning || tickets.length === 0 ? "not-allowed" : "pointer",
          opacity: spinning || tickets.length === 0 ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {spinning ? (
          <>
            <Spinner />
            جارٍ السحب...
          </>
        ) : (
          <>⚡ ابدأ السحب!</>
        )}
      </button>
    </div>
  );
}
