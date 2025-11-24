import QuoteForm from "@/components/konsul/QuoteForm"
import { useTranslation } from "@/contexts/LanguageContext"

export default function NewQuotePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t.quotes.newQuote}</h2>
      <QuoteForm />
    </div>
  )
}
