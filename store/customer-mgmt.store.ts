"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  BlockInfo,
  CustomerAddress,
  CustomerStatus,
  ReviewStatus,
  WalletTx,
} from "@/features/admin/customer-mgmt";

interface CustomerMgmtState {
  statusOverrides: Record<string, CustomerStatus>;
  blockInfo: Record<string, BlockInfo>;
  verifiedOverrides: Record<string, boolean>;
  reviewStatus: Record<string, ReviewStatus>;
  reviewResponses: Record<string, string>;
  deletedReviews: string[];
  walletExtra: Record<string, WalletTx[]>;
  addressOverrides: Record<string, CustomerAddress[]>;
  setStatus: (email: string, status: CustomerStatus, info?: BlockInfo) => void;
  toggleVerified: (email: string, current: boolean) => void;
  setReviewStatus: (id: string, status: ReviewStatus) => void;
  setReviewResponse: (id: string, response: string) => void;
  deleteReview: (id: string) => void;
  adjustWallet: (email: string, tx: WalletTx) => void;
  saveAddresses: (email: string, addresses: CustomerAddress[]) => void;
  reset: () => void;
}

const key = (email: string) => email.toLowerCase();

export const useCustomerMgmtStore = create<CustomerMgmtState>()(
  persist(
    (set) => ({
      statusOverrides: {},
      blockInfo: {},
      verifiedOverrides: {},
      reviewStatus: {},
      reviewResponses: {},
      deletedReviews: [],
      walletExtra: {},
      addressOverrides: {},
      setStatus: (email, status, info) =>
        set((s) => ({
          statusOverrides: { ...s.statusOverrides, [key(email)]: status },
          blockInfo:
            status === "blocked" && info
              ? { ...s.blockInfo, [key(email)]: info }
              : s.blockInfo,
        })),
      toggleVerified: (email, current) =>
        set((s) => ({ verifiedOverrides: { ...s.verifiedOverrides, [key(email)]: !current } })),
      setReviewStatus: (id, status) =>
        set((s) => ({ reviewStatus: { ...s.reviewStatus, [id]: status } })),
      setReviewResponse: (id, response) =>
        set((s) => ({ reviewResponses: { ...s.reviewResponses, [id]: response } })),
      deleteReview: (id) => set((s) => ({ deletedReviews: [...s.deletedReviews, id] })),
      adjustWallet: (email, tx) =>
        set((s) => ({
          walletExtra: { ...s.walletExtra, [key(email)]: [tx, ...(s.walletExtra[key(email)] ?? [])] },
        })),
      saveAddresses: (email, addresses) =>
        set((s) => ({ addressOverrides: { ...s.addressOverrides, [key(email)]: addresses } })),
      reset: () =>
        set({
          statusOverrides: {},
          blockInfo: {},
          verifiedOverrides: {},
          reviewStatus: {},
          reviewResponses: {},
          deletedReviews: [],
          walletExtra: {},
          addressOverrides: {},
        }),
    }),
    { name: "customer-mgmt-store", storage: createJSONStorage(() => localStorage) }
  )
);
