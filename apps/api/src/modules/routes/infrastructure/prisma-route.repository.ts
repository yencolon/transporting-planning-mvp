import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Route, RouteSummary } from '../domain/route';
import {
  NewRoute,
  RouteChanges,
  RouteRepository,
} from '../domain/route.repository';

type RouteRow = {
  id: string;
  name: string;
  points: { sequence: number; lat: number; lng: number; name: string | null }[];
};

const withOrderedPoints = {
  points: { orderBy: { sequence: 'asc' } },
} as const;

@Injectable()
export class PrismaRouteRepository implements RouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(route: NewRoute): Promise<Route> {
    const created = await this.prisma.route.create({
      data: { name: route.name, points: { create: route.points } },
      include: withOrderedPoints,
    });
    return this.toDomain(created);
  }

  async update(id: string, changes: RouteChanges): Promise<Route> {
    return this.prisma.$transaction(async (tx) => {
      if (changes.points) {
        await tx.routePoint.deleteMany({ where: { routeId: id } });
      }

      const updated = await tx.route.update({
        where: { id },
        data: {
          name: changes.name,
          ...(changes.points ? { points: { create: changes.points } } : {}),
        },
        include: withOrderedPoints,
      });
      return this.toDomain(updated);
    });
  }

  async findById(id: string): Promise<Route | null> {
    const row = await this.prisma.route.findUnique({
      where: { id },
      include: withOrderedPoints,
    });
    return row ? this.toDomain(row) : null;
  }

  async list(): Promise<RouteSummary[]> {
    const rows = await this.prisma.route.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { points: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      pointCount: row._count.points,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.route.delete({ where: { id } });
  }

  private toDomain(row: RouteRow): Route {
    return {
      id: row.id,
      name: row.name,
      points: row.points.map((point) => ({
        sequence: point.sequence,
        lat: point.lat,
        lng: point.lng,
        name: point.name,
      })),
    };
  }
}
