"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoAccInvoices,
  demoAccounts,
  demoBanks,
  demoExpenses,
  demoJournal,
  demoTaxes,
  type AccInvoice,
  type Account,
  type BankAccount,
  type Expense,
  type JournalEntry,
  type TaxRate,
} from "@/features/admin/accounting";

interface AccountingState {
  accounts: Account[];
  journal: JournalEntry[];
  expenses: Expense[];
  banks: BankAccount[];
  taxes: TaxRate[];
  invoices: AccInvoice[];
  addAccount: (a: Account) => void;
  patchAccount: (id: string, patch: Partial<Account>) => void;
  removeAccounts: (ids: string[]) => void;
  addJournal: (j: JournalEntry) => void;
  patchJournal: (id: string, patch: Partial<JournalEntry>) => void;
  removeJournal: (ids: string[]) => void;
  addExpense: (e: Expense) => void;
  patchExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpenses: (ids: string[]) => void;
  patchBank: (id: string, patch: Partial<BankAccount>) => void;
  transfer: (fromId: string, toId: string, amount: number) => void;
  addTax: (t: TaxRate) => void;
  patchTax: (id: string, patch: Partial<TaxRate>) => void;
  removeTaxes: (ids: string[]) => void;
  patchInvoice: (id: string, patch: Partial<AccInvoice>) => void;
  removeInvoices: (ids: string[]) => void;
  reset: () => void;
}

export const useAccountingStore = create<AccountingState>()(
  persist(
    (set) => ({
      accounts: demoAccounts,
      journal: demoJournal,
      expenses: demoExpenses,
      banks: demoBanks,
      taxes: demoTaxes,
      invoices: demoAccInvoices,
      addAccount: (a) => set((s) => ({ accounts: [a, ...s.accounts] })),
      patchAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAccounts: (ids) =>
        set((s) => ({ accounts: s.accounts.filter((a) => !ids.includes(a.id)) })),
      addJournal: (j) => set((s) => ({ journal: [j, ...s.journal] })),
      patchJournal: (id, patch) =>
        set((s) => ({
          journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),
      removeJournal: (ids) =>
        set((s) => ({ journal: s.journal.filter((j) => !ids.includes(j.id)) })),
      addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
      patchExpense: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeExpenses: (ids) =>
        set((s) => ({ expenses: s.expenses.filter((e) => !ids.includes(e.id)) })),
      patchBank: (id, patch) =>
        set((s) => ({
          banks: s.banks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      transfer: (fromId, toId, amount) =>
        set((s) => ({
          banks: s.banks.map((b) => {
            if (b.id === fromId) return { ...b, balance: b.balance - amount };
            if (b.id === toId) return { ...b, balance: b.balance + amount };
            return b;
          }),
        })),
      addTax: (t) => set((s) => ({ taxes: [t, ...s.taxes] })),
      patchTax: (id, patch) =>
        set((s) => ({
          taxes: s.taxes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTaxes: (ids) => set((s) => ({ taxes: s.taxes.filter((t) => !ids.includes(t.id)) })),
      patchInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      removeInvoices: (ids) =>
        set((s) => ({ invoices: s.invoices.filter((i) => !ids.includes(i.id)) })),
      reset: () =>
        set({
          accounts: demoAccounts,
          journal: demoJournal,
          expenses: demoExpenses,
          banks: demoBanks,
          taxes: demoTaxes,
          invoices: demoAccInvoices,
        }),
    }),
    {
      name: "accounting-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useAccounts(): Account[] {
  const accounts = useAccountingStore((s) => s.accounts);
  return useMemo(() => accounts, [accounts]);
}

export function useJournalEntries(): JournalEntry[] {
  const journal = useAccountingStore((s) => s.journal);
  return useMemo(() => journal, [journal]);
}

export function useExpenses(): Expense[] {
  const expenses = useAccountingStore((s) => s.expenses);
  return useMemo(() => expenses, [expenses]);
}

export function useBankAccounts(): BankAccount[] {
  const banks = useAccountingStore((s) => s.banks);
  return useMemo(() => banks, [banks]);
}

export function useTaxRates(): TaxRate[] {
  const taxes = useAccountingStore((s) => s.taxes);
  return useMemo(() => taxes, [taxes]);
}

export function useAccInvoices(): AccInvoice[] {
  const invoices = useAccountingStore((s) => s.invoices);
  return useMemo(() => invoices, [invoices]);
}
