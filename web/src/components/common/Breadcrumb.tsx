import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string; // 省略则为当前页，不可点
}

/**
 * 面包屑导航。用于深层子页面（会话/日志/设备详情）显示所处层级并可回溯。
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="面包屑" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-foreground' : undefined}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
