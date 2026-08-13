type ProfileIdentity = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function readableValue(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function profileFirstName(user: ProfileIdentity | null | undefined) {
  if (!user) return "there";
  const metadata = user.user_metadata ?? {};
  const fullName = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    metadata.first_name,
  ].map(readableValue).find(Boolean);

  if (fullName) return fullName.split(" ")[0];

  const emailName = readableValue(user.email).split("@")[0]
    ?.split(/[._-]+/)[0]
    ?.replace(/[^a-zA-Z0-9']/g, "");
  if (!emailName) return "there";
  return `${emailName.charAt(0).toUpperCase()}${emailName.slice(1)}`;
}
