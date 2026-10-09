"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultContact,
  defaultFooter,
  defaultSeo,
  demoBlogCategories,
  demoCmsActivity,
  demoCmsBanners,
  demoCmsPages,
  demoFaqs,
  demoMedia,
  demoMenus,
  demoPosts,
  demoSections,
  type BlogCategory,
  type BlogPost,
  type CmsActivity,
  type CmsBanner,
  type CmsPage,
  type ContactInfo,
  type FaqItem,
  type FooterColumn,
  type FooterSettings,
  type HomepageSection,
  type MediaFile,
  type SeoSettings,
  type SiteMenu,
  type SocialLink,
} from "@/features/admin/cms";

interface CmsState {
  sections: HomepageSection[];
  banners: CmsBanner[];
  pages: CmsPage[];
  posts: BlogPost[];
  categories: BlogCategory[];
  menus: SiteMenu[];
  footer: FooterSettings;
  faqs: FaqItem[];
  contact: ContactInfo;
  seo: SeoSettings;
  media: MediaFile[];
  patchSection: (id: string, patch: Partial<HomepageSection>) => void;
  reorderSections: (ids: string[]) => void;
  patchBanner: (id: string, patch: Partial<CmsBanner>) => void;
  addBanner: (b: CmsBanner) => void;
  removeBanners: (ids: string[]) => void;
  patchPage: (id: string, patch: Partial<CmsPage>) => void;
  addPage: (p: CmsPage) => void;
  removePages: (ids: string[]) => void;
  patchPost: (id: string, patch: Partial<BlogPost>) => void;
  addPost: (p: BlogPost) => void;
  removePosts: (ids: string[]) => void;
  patchCategory: (id: string, patch: Partial<BlogCategory>) => void;
  addCategory: (c: BlogCategory) => void;
  removeCategories: (ids: string[]) => void;
  saveMenu: (menu: SiteMenu) => void;
  patchFooter: (patch: Partial<FooterSettings>) => void;
  patchColumn: (id: string, patch: Partial<FooterColumn>) => void;
  patchSocial: (id: string, patch: Partial<SocialLink>) => void;
  patchFaq: (id: string, patch: Partial<FaqItem>) => void;
  addFaq: (f: FaqItem) => void;
  removeFaqs: (ids: string[]) => void;
  patchContact: (patch: Partial<ContactInfo>) => void;
  patchSeo: (patch: Partial<SeoSettings>) => void;
  patchMedia: (id: string, patch: Partial<MediaFile>) => void;
  addMedia: (files: MediaFile[]) => void;
  removeMedia: (ids: string[]) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useCmsStore = create<CmsState>()(
  persist(
    (set) => ({
      sections: demoSections,
      banners: demoCmsBanners,
      pages: demoCmsPages,
      posts: demoPosts,
      categories: demoBlogCategories,
      menus: demoMenus,
      footer: defaultFooter,
      faqs: demoFaqs,
      contact: defaultContact,
      seo: defaultSeo,
      media: demoMedia,
      patchSection: (id, patch) => set((s) => ({ sections: mapPatch(s.sections, id, patch) })),
      reorderSections: (ids) =>
        set((s) => ({
          sections: ids
            .map((id, i) => {
              const found = s.sections.find((x) => x.id === id);
              return found ? { ...found, order: i + 1 } : null;
            })
            .filter((x): x is HomepageSection => x !== null),
        })),
      patchBanner: (id, patch) => set((s) => ({ banners: mapPatch(s.banners, id, patch) })),
      addBanner: (b) => set((s) => ({ banners: [b, ...s.banners] })),
      removeBanners: (ids) => set((s) => ({ banners: s.banners.filter((b) => !ids.includes(b.id)) })),
      patchPage: (id, patch) => set((s) => ({ pages: mapPatch(s.pages, id, patch) })),
      addPage: (p) => set((s) => ({ pages: [p, ...s.pages] })),
      removePages: (ids) => set((s) => ({ pages: s.pages.filter((p) => !ids.includes(p.id)) })),
      patchPost: (id, patch) => set((s) => ({ posts: mapPatch(s.posts, id, patch) })),
      addPost: (p) => set((s) => ({ posts: [p, ...s.posts] })),
      removePosts: (ids) => set((s) => ({ posts: s.posts.filter((p) => !ids.includes(p.id)) })),
      patchCategory: (id, patch) => set((s) => ({ categories: mapPatch(s.categories, id, patch) })),
      addCategory: (c) => set((s) => ({ categories: [...s.categories, c] })),
      removeCategories: (ids) => set((s) => ({ categories: s.categories.filter((c) => !ids.includes(c.id)) })),
      saveMenu: (menu) => set((s) => ({ menus: s.menus.map((m) => (m.id === menu.id ? menu : m)) })),
      patchFooter: (patch) => set((s) => ({ footer: { ...s.footer, ...patch } })),
      patchColumn: (id, patch) =>
        set((s) => ({ footer: { ...s.footer, columns: mapPatch(s.footer.columns, id, patch) } })),
      patchSocial: (id, patch) =>
        set((s) => ({ footer: { ...s.footer, socials: mapPatch(s.footer.socials, id, patch) } })),
      patchFaq: (id, patch) => set((s) => ({ faqs: mapPatch(s.faqs, id, patch) })),
      addFaq: (f) => set((s) => ({ faqs: [...s.faqs, f] })),
      removeFaqs: (ids) => set((s) => ({ faqs: s.faqs.filter((f) => !ids.includes(f.id)) })),
      patchContact: (patch) => set((s) => ({ contact: { ...s.contact, ...patch } })),
      patchSeo: (patch) => set((s) => ({ seo: { ...s.seo, ...patch } })),
      patchMedia: (id, patch) => set((s) => ({ media: mapPatch(s.media, id, patch) })),
      addMedia: (files) => set((s) => ({ media: [...files, ...s.media] })),
      removeMedia: (ids) => set((s) => ({ media: s.media.filter((m) => !ids.includes(m.id)) })),
      reset: () =>
        set({
          sections: demoSections,
          banners: demoCmsBanners,
          pages: demoCmsPages,
          posts: demoPosts,
          categories: demoBlogCategories,
          menus: demoMenus,
          footer: defaultFooter,
          faqs: demoFaqs,
          contact: defaultContact,
          seo: defaultSeo,
          media: demoMedia,
        }),
    }),
    { name: "cms-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useCmsSections(): HomepageSection[] {
  const sections = useCmsStore((s) => s.sections);
  return useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);
}
export function useCmsBanners(): CmsBanner[] {
  const banners = useCmsStore((s) => s.banners);
  return useMemo(() => banners, [banners]);
}
export function useCmsPages(): CmsPage[] {
  const pages = useCmsStore((s) => s.pages);
  return useMemo(() => pages, [pages]);
}
export function useCmsPosts(): BlogPost[] {
  const posts = useCmsStore((s) => s.posts);
  return useMemo(() => posts, [posts]);
}
export function useCmsCategories(): BlogCategory[] {
  const categories = useCmsStore((s) => s.categories);
  return useMemo(() => categories, [categories]);
}
export function useCmsMenus(): SiteMenu[] {
  const menus = useCmsStore((s) => s.menus);
  return useMemo(() => menus, [menus]);
}
export function useCmsFaqs(): FaqItem[] {
  const faqs = useCmsStore((s) => s.faqs);
  return useMemo(() => [...faqs].sort((a, b) => a.order - b.order), [faqs]);
}
export function useCmsMedia(): MediaFile[] {
  const media = useCmsStore((s) => s.media);
  return useMemo(() => media, [media]);
}
export function useCmsActivity(): CmsActivity[] {
  return useMemo(() => demoCmsActivity, []);
}
