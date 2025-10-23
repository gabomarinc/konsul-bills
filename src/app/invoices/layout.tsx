import AuthenticatedLayout from "@/components/konsul/AuthenticatedLayout"

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}





