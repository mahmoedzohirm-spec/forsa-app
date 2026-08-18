import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const { ticketNumber } = await params;

    if (!ticketNumber) {
      return NextResponse.json(
        { success: false, error: "رقم البطاقة مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          number, status, user_name, user_phone, contact_phone, 
          payment_method, receipt_image, notes, updated_at
         FROM tickets 
         WHERE number = $1`,
        [parseInt(ticketNumber)]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "البطاقة غير موجودة" },
          { status: 404 }
        );
      }

      const ticket = result.rows[0];

      // ===== إنشاء ملف PDF =====
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // عنوان رئيسي
      page.drawText("Receipt - Ticket Booking", {
        x: 50,
        y: height - 50,
        size: 24,
        font: fontBold,
        color: rgb(0.96, 0.62, 0.04),
      });

      page.drawLine({
        start: { x: 50, y: height - 70 },
        end: { x: width - 50, y: height - 70 },
        thickness: 2,
        color: rgb(0.96, 0.62, 0.04),
      });

      // ===== بيانات البطاقة =====
      let yPos = height - 100;
      const fontSize = 14;

      let statusText = "Available";
      if (ticket.status === "pending") statusText = "Pending Review";
      else if (ticket.status === "sold") statusText = "Sold";

      const fields = [
        { label: "Ticket Number:", value: `#${ticket.number}` },
        { label: "Status:", value: statusText },
        { label: "User Name:", value: ticket.user_name || "Not specified" },
        { label: "Transfer Phone:", value: ticket.user_phone || "Not specified" },
        { label: "Contact Phone:", value: ticket.contact_phone || "Not specified" },
        { label: "Payment Method:", value: ticket.payment_method || "Not specified" },
        { label: "Date:", value: new Date(ticket.updated_at).toLocaleString("en-US") },
      ];

      for (const field of fields) {
        page.drawText(`${field.label} ${field.value}`, {
          x: 50,
          y: yPos,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
      }

      // ===== إضافة صورة الإيصال (مع تحسين التحقق) =====
      const hasReceiptImage = ticket.receipt_image && 
                              ticket.receipt_image.trim() !== '' && 
                              ticket.receipt_image !== 'null';

      if (hasReceiptImage) {
        try {
          // استخراج البيانات من Base64
          let base64Data = ticket.receipt_image;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }
          
          // التحقق من أن البيانات ليست فارغة
          if (!base64Data || base64Data.length < 10) {
            throw new Error('بيانات الصورة قصيرة جداً أو فارغة');
          }
          
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // التحقق من حجم الصورة (لا تتجاوز 5 ميجابايت)
          if (imageBuffer.length > 5 * 1024 * 1024) {
            throw new Error('الصورة كبيرة جداً (الحد الأقصى 5 ميجابايت)');
          }
          
          // محاولة تضمين الصورة كـ PNG
          try {
            const image = await pdfDoc.embedPng(imageBuffer);
            const imageWidth = 400;
            const imageHeight = (image.width / imageWidth) * image.height;

            yPos -= 30;
            page.drawImage(image, {
              x: (width - imageWidth) / 2,
              y: yPos - imageHeight,
              width: imageWidth,
              height: imageHeight,
            });

            yPos -= imageHeight + 30;
          } catch (embedError) {
            // إذا فشلت كـ PNG، حاول كـ JPG
            console.error('❌ Failed as PNG, trying JPG...', embedError);
            try {
              const image = await pdfDoc.embedJpg(imageBuffer);
              const imageWidth = 400;
              const imageHeight = (image.width / imageWidth) * image.height;

              yPos -= 30;
              page.drawImage(image, {
                x: (width - imageWidth) / 2,
                y: yPos - imageHeight,
                width: imageWidth,
                height: imageHeight,
              });

              yPos -= imageHeight + 30;
            } catch (jpgError) {
              console.error('❌ Failed as JPG too:', jpgError);
              page.drawText("⚠️ صيغة الصورة غير مدعومة", {
                x: 50,
                y: yPos - 30,
                size: 14,
                font,
                color: rgb(1, 0, 0),
              });
              yPos -= 60;
            }
          }
        } catch (imageError) {
          // ✅ ✅ ✅ التعديل النهائي: معالجة خطأ TypeScript ✅ ✅ ✅
          console.error("❌ Error processing image:", imageError);
          const errorMessage = imageError instanceof Error ? imageError.message : 'الصورة غير متاحة';
          page.drawText(`⚠️ ${errorMessage}`, {
            x: 50,
            y: yPos - 30,
            size: 14,
            font,
            color: rgb(1, 0, 0),
          });
          yPos -= 60;
        }
      } else {
        page.drawText("📷 لا توجد صورة إيصال مرفقة", {
          x: 50,
          y: yPos - 30,
          size: 14,
          font,
          color: rgb(0.6, 0.6, 0.6),
        });
        yPos -= 60;
      }

      // ===== ملاحظات =====
      if (ticket.notes) {
        page.drawText(`ملاحظات: ${ticket.notes}`, {
          x: 50,
          y: yPos - 20,
          size: 12,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // ===== تذييل الصفحة =====
      page.drawText(`تم الإنشاء في: ${new Date().toLocaleString("ar-SA")}`, {
        x: 50,
        y: 30,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      page.drawText("© فرصة العمر - جميع الحقوق محفوظة", {
        x: 50,
        y: 15,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=receipt-${ticket.number}.pdf`,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
