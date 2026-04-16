import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CertificateModal from './CertificateModal.jsx'
import { useCollectibles } from '../context/CollectiblesContext.jsx'

export default function MapHud() {
  const { t } = useTranslation()
  const { collectedCount, totalCount } = useCollectibles()

  return (
    <div className="pointer-events-auto absolute right-3 top-[4.5rem] z-[1120] flex max-w-[min(100%,280px)] flex-col items-end gap-2 md:top-24">
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F4EBD0]/90 px-3 py-2 text-[11px] font-[Merriweather] text-slate-800 shadow-sm backdrop-blur">
        <FileText className="h-3.5 w-3.5 text-[#005F73]" />
        <span>
          {t('collectibles.progress', {
            found: collectedCount,
            total: totalCount,
          })}
        </span>
      </div>
      <CertificateModal />
    </div>
  )
}
