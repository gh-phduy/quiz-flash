import { Suspense } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

function HeaderFallback() {
  return (
    <header className="flex h-[56px] items-center justify-between px-4 bg-background border-b border-border shrink-0 z-50 relative">
      <div className="flex items-center gap-5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-card animate-pulse"></div>
        <div className="h-6 w-28 bg-card rounded-lg animate-pulse"></div>
      </div>
      <div className="hidden md:flex w-full max-w-xl px-4">
        <div className="h-10 w-full bg-card rounded-full animate-pulse"></div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 rounded-full bg-card animate-pulse"></div>
        <div className="w-8 h-8 rounded-full bg-card animate-pulse"></div>
      </div>
    </header>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className="sticky top-0 z-50 shrink-0">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
      </div>
      <div className="flex flex-1 items-stretch">
        <div className="sticky top-[56px] h-[calc(100vh-56px)] shrink-0 z-40 hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
