'use client'

import { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

/** Editor teks kaya Quill 2 (revisi P2): tebal, miring, garis bawah, daftar, hapus format. */
export function RichEditor({
  id, initialHtml = '', placeholder, onChange, describedBy,
}: { id: string; initialHtml?: string; placeholder?: string; onChange: (html: string, text: string) => void; describedBy?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}
    ;(async () => {
      const { default: Quill } = await import('quill')
      if (disposed || !host.current) return
      host.current.innerHTML = ''
      const el = document.createElement('div')
      host.current.appendChild(el)
      const q = new Quill(el, {
        theme: 'snow',
        placeholder,
        modules: { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']] },
      })
      if (initialHtml) q.clipboard.dangerouslyPasteHTML(initialHtml)
      const root = q.root as HTMLElement
      root.id = id
      root.setAttribute('role', 'textbox')
      root.setAttribute('aria-multiline', 'true')
      if (describedBy) root.setAttribute('aria-describedby', describedBy)
      // Label tombol toolbar dalam Bahasa Indonesia.
      const labels: Record<string, string> = { 'ql-bold': 'Tebal', 'ql-italic': 'Miring', 'ql-underline': 'Garis bawah', 'ql-clean': 'Hapus format' }
      host.current.querySelectorAll('.ql-toolbar button').forEach((b) => {
        const cls = Array.from(b.classList).find((c) => labels[c])
        const val = b.getAttribute('value')
        b.setAttribute('aria-label', cls ? labels[cls] : val === 'ordered' ? 'Daftar bernomor' : val === 'bullet' ? 'Daftar butir' : 'Format')
      })
      const emit = () => cb.current(q.getSemanticHTML(), q.getText().trim())
      q.on('text-change', emit)
      emit()
      cleanup = () => q.off('text-change', emit)
    })()
    return () => {
      disposed = true
      cleanup()
    }
    // Editor dibuat sekali; nilai awal hanya dipakai saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} className="rte min-h-[190px] rounded-r border border-line-d bg-white focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20" />
}
