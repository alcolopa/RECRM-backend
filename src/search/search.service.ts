import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchAll(query: string, organizationId: string) {
    const searchTerm = query.trim();
    if (!searchTerm) return [];

    const [leads, contacts, properties, tasks] = await Promise.all([
      // 1. Search Leads
      this.prisma.lead.findMany({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // 2. Search Contacts
      this.prisma.contact.findMany({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // 3. Search Properties
      this.prisma.property.findMany({
        where: {
          organizationId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),

      // 4. Search Tasks
      this.prisma.task.findMany({
        where: {
          organizationId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    // Format and combine results
    return [
      ...leads.map(l => ({ id: l.id, type: 'LEAD', title: `${l.firstName} ${l.lastName}`, subtitle: l.email || 'Lead', link: '/leads' })),
      ...contacts.map(c => ({ id: c.id, type: 'CONTACT', title: `${c.firstName} ${c.lastName}`, subtitle: c.email || 'Contact', link: '/contacts' })),
      ...properties.map(p => ({ id: p.id, type: 'PROPERTY', title: p.title, subtitle: p.address, link: '/properties' })),
      ...tasks.map(t => ({ id: t.id, type: 'TASK', title: t.title, subtitle: `Due: ${t.dueDate?.toLocaleDateString() || 'No date'}`, link: '/tasks' })),
    ];
  }
}
