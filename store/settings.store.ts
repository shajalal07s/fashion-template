"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultCommissionSettings,
  defaultCurrency,
  defaultGeneral,
  defaultSecurity,
  defaultShippingSettings,
  defaultStoreSettings,
  defaultTax,
  demoAdmins,
  demoEmailTemplates,
  demoNotifyEvents,
  demoPayments,
  type AdminUser,
  type CommissionSettings,
  type CurrencySettings,
  type EmailSettings,
  type EmailTemplate,
  type GeneralSettings,
  type NotifyEvent,
  type PaymentMethod,
  type Role,
  type SecuritySettings,
  type ShippingSettings,
  type StoreSettings,
  type TaxSettings,
} from "@/features/admin/settings";
import { demoRoles, demoActivityLogs, type ActivityLog } from "@/features/admin/settings";

interface SettingsState {
  general: GeneralSettings;
  store: StoreSettings;
  currency: CurrencySettings;
  tax: TaxSettings;
  payments: PaymentMethod[];
  shipping: ShippingSettings;
  commission: CommissionSettings;
  email: EmailSettings;
  notifications: NotifyEvent[];
  security: SecuritySettings;
  roles: Role[];
  admins: AdminUser[];
  patchGeneral: (p: Partial<GeneralSettings>) => void;
  patchStore: (p: Partial<StoreSettings>) => void;
  patchCurrency: (p: Partial<CurrencySettings>) => void;
  patchTax: (p: Partial<TaxSettings>) => void;
  patchTaxRate: (id: string, p: Partial<TaxSettings["rates"][number]>) => void;
  addTaxRate: (r: TaxSettings["rates"][number]) => void;
  removeTaxRates: (ids: string[]) => void;
  patchPayment: (id: string, p: Partial<PaymentMethod>) => void;
  setDefaultPayment: (id: string) => void;
  removePayments: (ids: string[]) => void;
  patchShipping: (p: Partial<ShippingSettings>) => void;
  patchShipMethod: (id: string, p: Partial<ShippingSettings["methods"][number]>) => void;
  addShipMethod: (m: ShippingSettings["methods"][number]) => void;
  removeShipMethods: (ids: string[]) => void;
  patchShipZone: (id: string, p: Partial<ShippingSettings["zones"][number]>) => void;
  patchCommission: (p: Partial<CommissionSettings>) => void;
  patchEmail: (p: Partial<EmailSettings>) => void;
  patchTemplate: (id: string, p: Partial<EmailTemplate>) => void;
  patchNotify: (id: string, p: Partial<NotifyEvent>) => void;
  patchSecurity: (p: Partial<SecuritySettings>) => void;
  patchRole: (id: string, p: Partial<Role>) => void;
  addRole: (r: Role) => void;
  removeRoles: (ids: string[]) => void;
  patchAdmin: (id: string, p: Partial<AdminUser>) => void;
  addAdmin: (a: AdminUser) => void;
  removeAdmins: (ids: string[]) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

const fresh = () => ({
  general: defaultGeneral,
  store: defaultStoreSettings,
  currency: defaultCurrency,
  tax: defaultTax,
  payments: demoPayments,
  shipping: defaultShippingSettings,
  commission: defaultCommissionSettings,
  email: {
    senderName: "Fashion Store",
    senderEmail: "hello@fashionstore.com.bd",
    replyTo: "support@fashionstore.com.bd",
    supportEmail: "support@fashionstore.com.bd",
    adminEmail: "admin@fashionstore.com.bd",
    provider: "smtp",
    smtpHost: "mail.fashionstore.com.bd",
    smtpPort: 587,
    encryption: "TLS",
    username: "hello@fashionstore.com.bd",
    templates: demoEmailTemplates,
  } as EmailSettings,
  notifications: demoNotifyEvents,
  security: defaultSecurity,
  roles: demoRoles,
  admins: demoAdmins,
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...fresh(),
      patchGeneral: (p) => set((s) => ({ general: { ...s.general, ...p } })),
      patchStore: (p) => set((s) => ({ store: { ...s.store, ...p } })),
      patchCurrency: (p) => set((s) => ({ currency: { ...s.currency, ...p } })),
      patchTax: (p) => set((s) => ({ tax: { ...s.tax, ...p } })),
      patchTaxRate: (id, p) =>
        set((s) => ({ tax: { ...s.tax, rates: mapPatch(s.tax.rates, id, p) } })),
      addTaxRate: (r) => set((s) => ({ tax: { ...s.tax, rates: [r, ...s.tax.rates] } })),
      removeTaxRates: (ids) =>
        set((s) => ({ tax: { ...s.tax, rates: s.tax.rates.filter((r) => !ids.includes(r.id)) } })),
      patchPayment: (id, p) => set((s) => ({ payments: mapPatch(s.payments, id, p) })),
      setDefaultPayment: (id) =>
        set((s) => ({ payments: s.payments.map((p) => ({ ...p, isDefault: p.id === id })) })),
      removePayments: (ids) => set((s) => ({ payments: s.payments.filter((p) => !ids.includes(p.id)) })),
      patchShipping: (p) => set((s) => ({ shipping: { ...s.shipping, ...p } })),
      patchShipMethod: (id, p) =>
        set((s) => ({ shipping: { ...s.shipping, methods: mapPatch(s.shipping.methods, id, p) } })),
      addShipMethod: (m) =>
        set((s) => ({ shipping: { ...s.shipping, methods: [m, ...s.shipping.methods] } })),
      removeShipMethods: (ids) =>
        set((s) => ({ shipping: { ...s.shipping, methods: s.shipping.methods.filter((m) => !ids.includes(m.id)) } })),
      patchShipZone: (id, p) =>
        set((s) => ({ shipping: { ...s.shipping, zones: mapPatch(s.shipping.zones, id, p) } })),
      patchCommission: (p) => set((s) => ({ commission: { ...s.commission, ...p } })),
      patchEmail: (p) => set((s) => ({ email: { ...s.email, ...p } })),
      patchTemplate: (id, p) =>
        set((s) => ({ email: { ...s.email, templates: mapPatch(s.email.templates, id, p) } })),
      patchNotify: (id, p) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, ...p } : n)) })),
      patchSecurity: (p) => set((s) => ({ security: { ...s.security, ...p } })),
      patchRole: (id, p) => set((s) => ({ roles: mapPatch(s.roles, id, p) })),
      addRole: (r) => set((s) => ({ roles: [r, ...s.roles] })),
      removeRoles: (ids) => set((s) => ({ roles: s.roles.filter((r) => !ids.includes(r.id)) })),
      patchAdmin: (id, p) => set((s) => ({ admins: mapPatch(s.admins, id, p) })),
      addAdmin: (a) => set((s) => ({ admins: [a, ...s.admins] })),
      removeAdmins: (ids) => set((s) => ({ admins: s.admins.filter((a) => !ids.includes(a.id)) })),
      reset: () => set(fresh()),
    }),
    { name: "settings-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useActivityLogs(): ActivityLog[] {
  return demoActivityLogs;
}
