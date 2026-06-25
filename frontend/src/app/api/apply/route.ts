import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "You must be logged in to apply." }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Szukamy domyślnego szablonu (lub tworzymy jakikolwiek jako fallback)
    let template = await prisma.formTemplate.findFirst();
    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          title: "Default Unturned Application",
          category: "unturned",
          fields: "[]"
        }
      });
    }

    // @ts-ignore
    const userId = session.user.id;

    const submission = await prisma.submission.create({
      data: {
        userId: userId,
        formTemplateId: template.id,
        answers: JSON.stringify(data),
      }
    });

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }
}
