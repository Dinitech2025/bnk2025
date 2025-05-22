import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cybercafe/reports
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json({ error: "Mois et année requis" }, { status: 400 });
    }

    // Récupérer les rapports du mois
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        ticketUsages: {
          include: {
            ticket: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculer le total du mois
    const monthlyTotal = reports.reduce((sum, report) => sum + report.totalRevenue, 0);

    return NextResponse.json({
      reports,
      monthlyTotal
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des rapports" }, { status: 500 });
  }
}

// POST /api/cybercafe/reports
export async function POST(req: Request) {
  try {
    const { date, ticketUsages, totalRevenue } = await req.json();

    const report = await prisma.dailyReport.create({
      data: {
        date: new Date(date),
        totalRevenue,
        ticketUsages: {
          create: ticketUsages.map((usage: any) => ({
            ticketId: usage.ticketId,
            quantity: usage.quantity
          }))
        }
      },
      include: {
        ticketUsages: true
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du rapport" }, { status: 500 });
  }
} 
 