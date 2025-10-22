import { Header } from '@/components/navigation/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  )
}
