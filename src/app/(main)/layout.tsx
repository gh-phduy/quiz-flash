import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className="sticky top-0 z-50 shrink-0">
        <Header />
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
