import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    let template = await prisma.formTemplate.findFirst();
    
    // Create default if none exists
    if (!template) {
      const defaultFields = [
        { id: "nickname", label: "Name / Nickname", type: "short", required: true },
        { id: "age", label: "Age", type: "number", required: true },
        { id: "hours", label: "Unturned Hours (Approx)", type: "number", required: true },
        { id: "role", label: "Preferred Role", type: "select", options: "PvP,Builder,Farmer,Pilot", required: true },
        { id: "mic", label: "Do you have a working microphone?", type: "select", options: "Yes,No", required: true },
        { id: "reason", label: "Why do you want to join?", type: "long", required: true }
      ];

      template = await prisma.formTemplate.create({
        data: {
          title: "Default Unturned Application",
          category: "unturned",
          fields: JSON.stringify(defaultFields)
        }
      });
    }

    return NextResponse.json({ success: true, fields: JSON.parse(template.fields) });
  } catch (error) {
    console.error("Fetch template error:", error);
    return NextResponse.json({ error: "Failed to fetch template." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fields } = await req.json();

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Fields must be an array" }, { status: 400 });
    }

    let template = await prisma.formTemplate.findFirst();
    if (template) {
      await prisma.formTemplate.update({
        where: { id: template.id },
        data: { fields: JSON.stringify(fields) }
      });
    } else {
      await prisma.formTemplate.create({
        data: {
          title: "Default Unturned Application",
          category: "unturned",
          fields: JSON.stringify(fields)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Failed to update template." }, { status: 500 });
  }
}
