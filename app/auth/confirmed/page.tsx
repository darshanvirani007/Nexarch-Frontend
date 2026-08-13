import { AuthConfirmation, type ConfirmationStatus } from "@/components/auth-confirmation";
import { safeInternalPath } from "@/lib/auth-redirect";

type ConfirmationPageProps = {
  searchParams: Promise<{ status?: string | string[]; next?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmedPage({ searchParams }: ConfirmationPageProps) {
  const parameters = await searchParams;
  const status: ConfirmationStatus = firstValue(parameters.status) === "error" ? "error" : "success";
  const nextPath = safeInternalPath(firstValue(parameters.next));
  return <AuthConfirmation status={status} nextPath={nextPath} />;
}
