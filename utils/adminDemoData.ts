import type { JoinRequest } from '~/types/request'

/** Placeholder inbox rows for client demos / when Supabase is offline. */
export function createDemoRequests(): JoinRequest[] {
  const ago = (hours: number) =>
    new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'demo-1',
      name: 'Sofia Marchetti',
      email: 'sofia.marchetti@example.com',
      note: 'Friend of the host — arriving with Marco.',
      status: 'PENDING',
      created_at: ago(2),
    },
    {
      id: 'demo-2',
      name: 'James Whitfield',
      email: 'j.whitfield@example.com',
      note: 'Vegetarian if catering — otherwise thrilled to be invited.',
      status: 'PENDING',
      created_at: ago(5),
    },
    {
      id: 'demo-3',
      name: 'Amara Okonkwo',
      email: 'amara.o@example.com',
      note: null,
      status: 'PENDING',
      created_at: ago(9),
    },
    {
      id: 'demo-4',
      name: 'Luca Bernardi',
      email: 'luca.bernardi@example.com',
      note: 'Can I bring a +1? Happy to keep it intimate if not.',
      status: 'PENDING',
      created_at: ago(14),
    },
    {
      id: 'demo-5',
      name: 'Elena Vasquez',
      email: 'elena.v@example.com',
      note: 'Poolside sunset sounds perfect.',
      status: 'APPROVED',
      created_at: ago(28),
    },
    {
      id: 'demo-6',
      name: 'Tomás Herrera',
      email: 'tomas.h@example.com',
      note: 'Referred by Dani — thank you for considering me.',
      status: 'APPROVED',
      created_at: ago(36),
    },
    {
      id: 'demo-7',
      name: 'Priya Shah',
      email: 'priya.shah@example.com',
      note: null,
      status: 'APPROVED',
      created_at: ago(48),
    },
    {
      id: 'demo-8',
      name: 'Unknown Guest',
      email: 'plusone.random@example.com',
      note: 'Heard about the party online.',
      status: 'REJECTED',
      created_at: ago(52),
    },
    {
      id: 'demo-9',
      name: 'Chris Dalton',
      email: 'c.dalton@example.com',
      note: 'Wrong weekend — asked to defer to next event.',
      status: 'REJECTED',
      created_at: ago(72),
    },
  ]
}
