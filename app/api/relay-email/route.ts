import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and content (html or text)" },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER || "sachinigunasekara2004@gmail.com";
    const smtpPass = process.env.SMTP_PASSWORD || "jwlojstktcdpaehw";

    // Create transport with SSL port 465 (or STARTTLS port 587)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"KandyPack Logistics" <${smtpUser}>`,
      to: to.trim(),
      subject: subject.trim(),
      html: html || undefined,
      text: text || undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      recipient: to.trim(),
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error during email dispatch";
    console.error("[Email Relay Error]", errMessage);
    return NextResponse.json(
      { error: "Failed to dispatch email", details: errMessage },
      { status: 500 }
    );
  }
}
