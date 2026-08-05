import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // W idealnym świecie tutaj byłby check na secret token między botem a API
  // const authHeader = req.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.BOT_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = await prisma.botConfig.findFirst();
    return NextResponse.json(config || {});
  } catch (error) {
    console.error("Failed to fetch bot config", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
