import { SiteHeader } from "./site-header";
import { BottomNav } from "./bottom-nav";

export function AppShell({
  children,
  hideHeader,
}: {
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <>
      {!hideHeader && <SiteHeader />}
      <main className="safe-bottom mx-auto min-h-screen w-full max-w-lg flex-1 px-4 pb-4">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
