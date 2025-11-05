import AuthenticatedLayout from "@/components/konsul/AuthenticatedLayout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}







