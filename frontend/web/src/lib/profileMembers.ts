export type ProfileMember = {
  name: string;
  role: string;
};

export function formatMemberLabel(member: ProfileMember) {
  const name = member.name.trim();
  const role = member.role.trim();

  if (!role) {
    return name;
  }

  return `${name} — ${role}`;
}

export function parseMemberLabel(label: string): ProfileMember {
  const trimmed = label.trim();
  const separator = trimmed.match(/\s[—–-]\s/);

  if (!separator || separator.index === undefined) {
    return { name: trimmed, role: "" };
  }

  return {
    name: trimmed.slice(0, separator.index).trim(),
    role: trimmed.slice(separator.index + separator[0].length).trim(),
  };
}

export function normalizeMembers(members: ProfileMember[]) {
  const seen = new Set<string>();
  const result: ProfileMember[] = [];

  for (const member of members) {
    const name = member.name.trim();
    const role = member.role.trim();

    if (!name) {
      continue;
    }

    const key = `${name.toLowerCase()}|${role.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({ name, role });

    if (result.length >= 20) {
      break;
    }
  }

  return result;
}

export function resolveProfileMembers(
  members: ProfileMember[] | undefined,
  memberNames: string[] | undefined,
) {
  if (members && members.length > 0) {
    return normalizeMembers(members);
  }

  return normalizeMembers((memberNames ?? []).map(parseMemberLabel));
}

export function createEmptyMember(): ProfileMember {
  return { name: "", role: "" };
}
