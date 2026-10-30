import Shell from "@/components/Shell/Shell";
import { loadContent } from "@/lib/api";

// The public site: navigation, footer and the shared player around every page.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile, categories } = await loadContent();
  return (
    <Shell profile={profile} categories={categories}>
      {children}
    </Shell>
  );
}
