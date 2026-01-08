import QueryProvider from '@/components/ui/providers/query-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
}