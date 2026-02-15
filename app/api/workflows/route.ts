import { NextResponse } from "next/server";
import { mockWorkflows } from "@/lib/mock-data";

export async function GET() {
  // Simulate slight network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json({
    success: true,
    message: "Workflows fetched successfully",
    data: mockWorkflows,
  });
}
