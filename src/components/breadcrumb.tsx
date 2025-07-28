
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { APP_MODULES } from '@/lib/constants';
import { ChevronRight } from 'lucide-react';
import React from 'react';

type BreadcrumbItem = {
    name: string;
    path?: string;
};

const findPath = (pathname: string): BreadcrumbItem[] => {
    const pathItems: BreadcrumbItem[] = [];

    for (const module of APP_MODULES) {
        if (module.path === pathname) {
            pathItems.push({ name: module.name, path: module.path });
            return pathItems;
        }
        if (module.subModules) {
            for (const subModule of module.subModules) {
                if (subModule.path === pathname) {
                    pathItems.push({ name: module.name }); // Parent, no link
                    pathItems.push({ name: subModule.name, path: subModule.path });
                    return pathItems;
                }
            }
        }
    }
    // Fallback for root or unknown paths
    if (pathname === '/dashboard') return [{ name: 'Dashboard', path: '/dashboard' }];
    return [];
};


export function Breadcrumb() {
    const pathname = usePathname();
    const items = findPath(pathname);

    if (items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
                {items.map((item, index) => (
                    <React.Fragment key={item.name}>
                        <li>
                            {item.path && index < items.length - 1 ? (
                                <Link href={item.path} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="text-sm font-medium text-foreground">
                                    {item.name}
                                </span>
                            )}
                        </li>
                        {index < items.length - 1 && (
                            <li aria-hidden="true">
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </li>
                        )}
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
}
