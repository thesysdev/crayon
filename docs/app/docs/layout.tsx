import { source } from '@/lib/source';
import { DocsRouteLayout } from '@/components/docs-route-layout';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return <DocsRouteLayout tree={source.getPageTree()}>{children}</DocsRouteLayout>;
}
