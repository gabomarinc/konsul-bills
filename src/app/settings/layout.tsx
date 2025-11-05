import AuthenticatedLayout from "@/components/konsul/AuthenticatedLayout"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}







