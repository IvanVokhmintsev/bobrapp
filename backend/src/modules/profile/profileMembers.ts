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

export function membersToNames(members: ProfileMember[]) {
  return normalizeMembers(members).map(formatMemberLabel);
}

export function parseMembersJson(value: unknown, fallbackNames: string[] = []) {
  if (Array.isArray(value) && value.length > 0) {
    const parsed = value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        role: typeof item.role === "string" ? item.role : "",
      }));
    const normalized = normalizeMembers(parsed);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return fallbackNames.map(parseMemberLabel);
}
