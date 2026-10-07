export interface TeamMember {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dni: string;
  plateNumber: string;
  route: string;
  latitude: number;
  longitude: number;
}

const member = (
  id: number, firstName: string, lastName: string,
  plateNumber: string, route: string, latitude: number, longitude: number,
): TeamMember => ({
  id,
  employeeCode: `EMP-${String(id).padStart(3, '0')}`,
  firstName,
  lastName,
  fullName: `${firstName} ${lastName}`,
  dni: `0000000${id}`,
  plateNumber,
  route,
  latitude,
  longitude,
});

export const TEAM_MEMBERS: TeamMember[] = [
  member(1, 'Carlos Franco', 'Blancas Chavez', 'MNO-7890', 'R-33', -12.03, -77.01),
  member(2, 'Rodrigo Jesus', 'Miraval Pomalaya', 'DEF-5678', 'R-15', -12.06, -77.03),
  member(3, 'Waldo Alonso', 'Portal Inga', 'GHI-9012', 'R-07', -12.07, -77.05),
  member(4, 'Joaquin Leonardo', 'Reyes Muñoz', 'JKL-3456', 'R-22', -12.09, -77.06),
  member(5, 'Edson Diego', 'Llamozas Diaz', 'ABC-1234', 'R-42', -12.0464, -77.0428),
];

export const VALID_EMPLOYEE_CODES = TEAM_MEMBERS.map(m => m.employeeCode);

/** "  emp-001 " -> "EMP-001"  |  "QR-EMP-001" -> "EMP-001" */
export function normalizeEmployeeCode(raw: string): string {
  return (raw ?? '').trim().toUpperCase().replace(/^QR-/, '');
}

/** Avatar con iniciales (no depende de internet). */
export function avatarFor(m: Pick<TeamMember, 'firstName' | 'lastName'>): string {
  const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">` +
    `<rect width="80" height="80" fill="#1a1a1a"/>` +
    `<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" ` +
    `font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#C3F400">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
