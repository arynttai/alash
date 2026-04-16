import { AnimatePresence, motion } from 'framer-motion'
import { Award, Download } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { jsPDF } from 'jspdf'
import { useCollectibles } from '../context/CollectiblesContext.jsx'

export default function CertificateModal() {
  const { t } = useTranslation()
  const { allFound } = useCollectibles()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const download = useCallback(() => {
    const holder = name.trim() || t('certificate.guest')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.setFontSize(22)
    doc.text(t('certificate.pdfTitle'), 40, 72)
    doc.setFontSize(13)
    doc.text(t('certificate.pdfLine1'), 40, 110)
    doc.setFontSize(16)
    doc.text(holder, 40, 140)
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(t('certificate.pdfBody'), 515)
    doc.text(lines, 40, 175)
    doc.save('alash-orda-certificate.pdf')
  }, [name, t])

  if (!allFound) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-[#005F73]/30 bg-[#005F73]/10 px-3 py-2 text-[11px] font-[Merriweather] leading-tight text-[#005F73] active:bg-[#005F73]/20 md:min-h-0 md:py-1.5 md:hover:bg-[#005F73]/20"
      >
        <Award className="h-3.5 w-3.5" />
        {t('certificate.cta')}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/35 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="max-w-md rounded-2xl border border-black/10 bg-[#F4EBD0] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-[Playfair_Display] text-lg text-[#005F73]">
                {t('certificate.modalTitle')}
              </div>
              <p className="mt-2 text-sm font-[Merriweather] text-slate-700">
                {t('certificate.modalHint')}
              </p>
              <input
                className="mt-3 w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm font-[Merriweather] outline-none focus:ring-2 focus:ring-[#005F73]/25"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('certificate.namePlaceholder')}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#005F73] px-4 py-2.5 text-sm font-[Merriweather] text-[#F4EBD0]"
                >
                  <Download className="h-4 w-4" />
                  {t('certificate.download')}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-[Merriweather]"
                >
                  {t('common.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
