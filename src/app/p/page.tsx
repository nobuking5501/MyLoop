'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { LandingPage, LPSection } from '@/types/firestore'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PublicLPPage() {
  const params = useParams()
  const [lp, setLp] = useState<(LandingPage & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadLP = async () => {
      try {
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Dummy')) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const q = query(
          collection(db, 'landing_pages'),
          where('slug', '==', params.slug),
          where('status', '==', 'published')
        )

        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const lpData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as LandingPage & { id: string }

        setLp(lpData)

        // ビュー数をカウント
        try {
          await updateDoc(doc(db, 'landing_pages', lpData.id), {
            'stats.views': increment(1),
          })
        } catch (error) {
          console.error('Failed to increment view count:', error)
        }
      } catch (error) {
        console.error('Failed to load LP:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadLP()
  }, [params.slug])

  const renderSection = (section: LPSection) => {
    if (!section.visible) return null

    const baseClasses = 'py-16 px-4'
    const containerClasses = 'max-w-6xl mx-auto'

    switch (section.type) {
      case 'hero':
        return (
          <section key={section.id} className={`${baseClasses} bg-gradient-to-br from-primary-50 to-blue-50`}>
            <div className={`${containerClasses} text-center`}>
              {section.subtitle && (
                <p className="text-primary-600 font-semibold mb-4">{section.subtitle}</p>
              )}
              {section.title && <h1 className="text-5xl font-bold text-gray-900 mb-6">{section.title}</h1>}
              {section.body && <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">{section.body}</p>}
              {section.ctaText && (
                <Button size="lg" className="text-lg px-8 py-6">
                  {section.ctaText}
                </Button>
              )}
            </div>
          </section>
        )

      case 'problem':
        return (
          <section key={section.id} className={`${baseClasses} bg-gray-50`}>
            <div className={containerClasses}>
              {section.title && <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{section.title}</h2>}
              {section.body && <p className="text-lg text-gray-600 max-w-3xl mx-auto text-center">{section.body}</p>}
            </div>
          </section>
        )

      case 'benefit':
        return (
          <section key={section.id} className={baseClasses}>
            <div className={containerClasses}>
              {section.title && <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{section.title}</h2>}
              {section.subtitle && <p className="text-xl text-gray-600 mb-8 text-center">{section.subtitle}</p>}
              {section.items && section.items.length > 0 && (
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="text-center">
                      {item.icon && <div className="text-4xl mb-4">{item.icon}</div>}
                      {item.title && <h3 className="font-bold text-xl mb-2">{item.title}</h3>}
                      {item.description && <p className="text-gray-600">{item.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )

      case 'features':
        return (
          <section key={section.id} className={`${baseClasses} bg-gray-50`}>
            <div className={containerClasses}>
              {section.title && <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.title}</h2>}
              {section.items && section.items.length > 0 && (
                <div className="space-y-8">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                    >
                      <div className="flex-1">
                        {item.title && <h3 className="font-bold text-2xl mb-4">{item.title}</h3>}
                        {item.description && <p className="text-gray-600 text-lg">{item.description}</p>}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">画像</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )

      case 'cta':
        return (
          <section key={section.id} className={`${baseClasses} bg-primary-600 text-white`}>
            <div className={`${containerClasses} text-center`}>
              {section.title && <h2 className="text-4xl font-bold mb-6">{section.title}</h2>}
              {section.body && <p className="text-xl mb-8 max-w-2xl mx-auto">{section.body}</p>}
              {section.ctaText && (
                <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-6">
                  {section.ctaText}
                </Button>
              )}
            </div>
          </section>
        )

      case 'faq':
        return (
          <section key={section.id} className={`${baseClasses} bg-gray-50`}>
            <div className={containerClasses}>
              {section.title && <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.title}</h2>}
              {section.items && section.items.length > 0 && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                      {item.title && <h3 className="font-bold text-lg mb-2">Q. {item.title}</h3>}
                      {item.description && <p className="text-gray-600">A. {item.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )

      default:
        return (
          <section key={section.id} className={baseClasses}>
            <div className={containerClasses}>
              {section.title && <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.title}</h2>}
              {section.subtitle && <p className="text-xl text-gray-600 mb-4">{section.subtitle}</p>}
              {section.body && <p className="text-gray-600">{section.body}</p>}
            </div>
          </section>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (notFound || !lp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">ページが見つかりません</p>
          <Link href="/">
            <Button>ホームに戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* SEO Meta Tags (Next.js metadata API would be better in production) */}
      <title>{lp.seoTitle || lp.title}</title>

      {/* LP Content */}
      <main>
        {lp.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => renderSection(section))}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 {lp.title}. All rights reserved.</p>
          <p className="text-sm text-gray-500 mt-2">Powered by MyLoop</p>
        </div>
      </footer>
    </div>
  )
}
