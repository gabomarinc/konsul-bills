import AuthenticatedLayout from "@/components/konsul/AuthenticatedLayout"

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}



