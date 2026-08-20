import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { PublicFooter } from "@/components/public-footer";

const controller = process.env.NEXT_PUBLIC_PRIVACY_CONTROLLER_NAME || "Nexarch";
const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "privacy@nexarchapp.com";
const controllerAddress = process.env.NEXT_PUBLIC_PRIVACY_ADDRESS || "Ireland";

export default function PrivacyPage() {
  return <main className="min-h-screen px-6 py-10 sm:px-12">
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="mb-12 flex items-center gap-3"><BrandMark /><span className="font-semibold">Nexarch</span></Link>
      <p className="muted text-xs font-semibold uppercase tracking-[.16em]">Effective 20 August 2026</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="muted mt-4 leading-relaxed">This notice explains how {controller}, {controllerAddress}, handles personal data when you use Nexarch. Contact <a className="text-foreground underline" href={`mailto:${privacyEmail}`}>{privacyEmail}</a> about privacy or data-protection requests.</p>

      <div className="mt-10 space-y-9 text-sm leading-7">
        <section><h2 className="text-xl font-semibold">Data we process</h2><p className="muted mt-2">Account and profile details such as email, name, country, mobile number and timezone; workspace information you choose to enter, including businesses, links, notes, tasks, goals, learning and job applications; security and service data such as authentication records, IP-derived country, website-check results and limited operational logs; and appearance preferences or encrypted development-key vaults stored on your device.</p></section>
        <section><h2 className="text-xl font-semibold">Why and legal basis</h2><p className="muted mt-2">We process account and workspace data to provide the service you request and perform our contract with you. We process limited security, fraud-prevention, reliability and diagnostic information for our legitimate interests in operating and protecting Nexarch. We use consent only where a genuinely optional feature legally requires it. Nexarch does not currently use personal data for behavioural advertising or automated decisions with legal or similarly significant effects.</p></section>
        <section><h2 className="text-xl font-semibold">Recipients and international transfers</h2><p className="muted mt-2">Service providers may process data only to operate Nexarch, including Supabase for authentication and database hosting, Vercel for frontend hosting, and Render for the Laravel API. Their hosting location and support operations may involve transfers outside the EEA. Appropriate safeguards, such as adequacy decisions or approved contractual protections, must apply under the relevant processor agreement.</p></section>
        <section><h2 className="text-xl font-semibold">Cookies and local device storage</h2><p className="muted mt-2">Nexarch uses authentication cookies and local storage needed for login, security, appearance preferences and encrypted local vaults. These are necessary to provide features you request. We do not currently set advertising or analytics cookies. If optional tracking is introduced, it will remain disabled until valid consent is obtained.</p></section>
        <section><h2 className="text-xl font-semibold">Retention</h2><p className="muted mt-2">Workspace data is retained while your account is active or until you delete it. Account deletion removes active account and workspace records, subject to limited processor backup cycles and records that must be retained to meet legal obligations or establish legal claims. Security and operational logs are retained only for the shortest period needed for security and service reliability under documented provider schedules.</p></section>
        <section><h2 className="text-xl font-semibold">Your rights</h2><p className="muted mt-2">Depending on the circumstances, you may request access, correction, deletion, restriction, portability, or object to processing. You can export or delete your account from Settings. You may also contact us, and we normally respond within one month after verifying identity. You can complain to Ireland’s Data Protection Commission at <a className="text-foreground underline" href="https://www.dataprotection.ie" target="_blank" rel="noreferrer">dataprotection.ie</a>.</p></section>
        <section><h2 className="text-xl font-semibold">Security and children</h2><p className="muted mt-2">We use access controls, row-level database security, encryption in transit, secure authentication, input validation and monitoring. No system can guarantee absolute security. Nexarch is not intended for children under 16, and we do not knowingly collect their data.</p></section>
        <section><h2 className="text-xl font-semibold">Changes</h2><p className="muted mt-2">We will update this notice when processing changes materially and provide appropriate notice before using personal data for a new incompatible purpose.</p></section>
      </div>
      <div className="mt-12"><PublicFooter /></div>
    </article>
  </main>;
}
