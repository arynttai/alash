import CertificateModal from './CertificateModal.jsx'

export default function MapHud() {
  return (
    <div className="pointer-events-auto absolute left-2 right-2 top-[max(5.5rem,env(safe-area-inset-top,0px)+4.5rem)] z-[1120] flex max-w-[min(100%,320px)] flex-col items-start gap-2 md:left-auto md:right-3 md:top-24 md:items-end">
      <CertificateModal />
    </div>
  )
}
