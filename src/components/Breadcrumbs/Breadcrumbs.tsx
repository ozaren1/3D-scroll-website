import Link from "next/link";
import { breadcrumbList, jsonLd, type Crumb } from "@/lib/seo";
import styles from "./Breadcrumbs.module.scss";

// Visible trail plus its BreadcrumbList markup; the last crumb is the current page.
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ name: "Главная", path: "/" }, ...items];
  return (
    <nav className={`${styles.crumbs} hud`} aria-label="Хлебные крошки">
      <ol>
        {trail.map((c, i) => (
          <li key={c.path}>
            {i < trail.length - 1 ? (
              <Link href={c.path}>{c.name}</Link>
            ) : (
              <span aria-current="page">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbList(trail)) }} />
    </nav>
  );
}
