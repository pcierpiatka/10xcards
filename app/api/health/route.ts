import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Always run dynamically

export async function GET() {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "0.0.1",
    service: "10xCards",
  };

  return NextResponse.json(healthCheck, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
