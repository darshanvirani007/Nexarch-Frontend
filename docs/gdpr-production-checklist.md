# GDPR production checklist

This is an engineering and operations checklist, not a legal certification. The privacy policy must match Nexarch's real processing and must be reviewed whenever the product, providers, or data use changes.

## Required before production

- Set `NEXT_PUBLIC_PRIVACY_CONTROLLER_NAME`, `NEXT_PUBLIC_PRIVACY_EMAIL`, and `NEXT_PUBLIC_PRIVACY_ADDRESS` to the controller's real legal details in Vercel.
- Make sure the privacy mailbox is monitored and that identity-verified rights requests can normally be completed within one month.
- Apply `supabase/migrations/202608200009_gdpr_account_erasure.sql` and test export and deletion using a disposable account.
- Record the Supabase and Vercel service regions, subprocessors, data-processing agreements, and the transfer safeguard used for any processing outside the EEA.
- Define and document exact retention periods for application logs, hosting logs, authentication logs, support records, and provider backups. Configure each provider accordingly.
- Keep a processing inventory covering account/profile data, workspace content, authentication/security data, IP-derived country defaults, and encrypted device-local vault data.
- Establish an incident process for investigation, documentation, processor notification, affected-user communication, and supervisory-authority notification where legally required.
- Decide whether a Data Protection Officer or EU representative is legally required for the controller's actual organisation and processing.

## Product rules

- Collect only fields required for a defined purpose. Optional fields should remain optional.
- Do not add analytics, advertising pixels, session replay, or non-essential cookies until prior consent, rejection, withdrawal, and consent records are implemented.
- Do not log passwords, access tokens, development-key secrets, request bodies, or unnecessary personal data.
- When adding a provider or new use of data, update the processing inventory, contracts, retention schedule, and privacy policy before release.
- Test RLS and account erasure after every schema change. Account deletion must remove database rows and server-side vault secrets; provider backups follow the documented backup schedule.

## Rights-request workflow

1. Record the request date and requested right without storing unnecessary identity documents.
2. Verify identity proportionately using the signed-in account where possible.
3. Search Supabase, authentication, operational systems, and relevant processors.
4. Fulfil, explain any lawful limitation, and record the outcome within the applicable deadline.
5. Delete verification material and case records according to the documented retention schedule.
