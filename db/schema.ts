import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const encryptedKeyVaults = sqliteTable("encrypted_key_vaults", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  businessId: text("business_id").notNull(),
  ciphertext: text("ciphertext").notNull(),
  salt: text("salt").notNull(),
  iv: text("iv").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("encrypted_key_vaults_owner_business_idx").on(table.ownerEmail, table.businessId),
]);
