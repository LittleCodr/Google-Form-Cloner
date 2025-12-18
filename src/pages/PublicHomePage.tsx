import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FormTile } from '../components/FormTile'
import { fetchForms } from '../services/forms'
import type { FormDefinition } from '../types/forms'

const highlights = [
  {
    icon: '⚡',
    title: 'बिना इंतज़ार के लॉन्च',
    description: 'स्थानीय डेटा स्टोर से फ़ॉर्म तुरंत खुले और प्रतिक्रियाएँ जमा होते ही दिखें।',
  },
  {
    icon: '🛡️',
    title: 'फेल-सेफ़ जवाब संग्रह',
    description: 'फ़ायरबेस उपलब्ध न होने पर भी सबमिशन आपके ब्राउज़र में सुरक्षित रहते हैं।',
  },
  {
    icon: '🎨',
    title: 'ब्रांड-फ़र्स्ट डिज़ाइन',
    description: 'हिंदी-प्रथम कॉपी, रंगीन विज़ुअल्स और मोबाइल-फ़र्स्ट लेआउट से भरोसा बढ़ाएँ।',
  },
]

export function PublicHomePage() {
  const [forms, setForms] = useState<FormDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const primaryForm = useMemo(() => (forms.length > 0 ? forms[0] : null), [forms])
  const liveFormCount = useMemo(() => (loading ? '—' : forms.length.toString()), [forms.length, loading])

  useEffect(() => {
    let isMounted = true

    fetchForms()
      .then((data) => {
        if (isMounted) {
          setForms(data)
        }
      })
      .catch((fetchError) => {
        console.error('Failed to load forms from Firestore', fetchError)
        if (isMounted) {
          setError('फ़ॉर्म लोड नहीं हो पा रहे हैं। बाद में फिर कोशिश करें।')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page page--home">
      <section className="hero">
        <span className="hero__eyebrow">Balkishan Agrawal द्वारा संचालित डिजिटल फ़ॉर्म प्लेटफ़ॉर्म</span>
        <h1 className="hero__title">हर सबमिशन के लिए तेज़, भरोसेमंद और खूबसूरत अनुभव</h1>
        <p className="hero__description">
          स्कूल, कार्यक्रम और क्विज़ के लिए तैयार किया गया यह पोर्टल हिंदी-प्रथम इंटरफ़ेस, स्मार्ट वैलिडेशन और
          ऑफ़लाइन बैकअप के साथ प्रतिक्रियाओं को सुरक्षित रखता है।
        </p>
        <div className="hero__actions">
          {primaryForm ? (
            <Link className="button" to={`/form/${primaryForm.id}`}>
              फ़ॉर्म भरना शुरू करें
            </Link>
          ) : (
            <Link className="button" to="/admin">
              एडमिन डैशबोर्ड खोलें
            </Link>
          )}
          <Link className="button button--secondary" to="/admin">
            एडमिन लॉगिन
          </Link>
        </div>
        <div className="hero__meta">
          <div className="hero__stat">
            <span className="hero__stat-label">लाइव फ़ॉर्म</span>
            <span className="hero__stat-value">{liveFormCount}</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-label">डेटा सुरक्षा</span>
            <span className="hero__stat-value">दोहरी</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-label">यूआई रिफ्रेश</span>
            <span className="hero__stat-value">2025</span>
          </div>
        </div>
      </section>

      <section className="section section--forms">
        <div className="section__header">
          <h2 className="section__title">लाइव फ़ॉर्म सूची</h2>
          <p className="section__subtitle">
            सुरक्षित ब्राउज़र स्टोरेज और फॉलबैक कलेक्शन के साथ प्रतिक्रियाएँ हमेशा उपलब्ध रहती हैं। नीचे से इच्छित फ़ॉर्म
            चुनें और अपने प्रतिभागियों से उत्तर एकत्र करें।
          </p>
        </div>

        {loading ? <p className="message">लोड हो रहा है…</p> : null}
        {error ? <p className="message message--error">{error}</p> : null}

        {!loading && !error ? (
          forms.length > 0 ? (
            <div className="grid">
              {forms.map((form) => (
                <FormTile
                  key={form.id}
                  title={form.title}
                  description={form.description}
                  to={`/form/${form.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="message">अभी कोई फ़ॉर्म उपलब्ध नहीं है।</p>
          )
        ) : null}
      </section>

      <section className="section section--highlights">
        <div className="section__header">
          <h2 className="section__title">क्यों यह प्लेटफ़ॉर्म अलग है</h2>
          <p className="section__subtitle">
            प्रतिक्रियाएँ खोने की चिंता के बिना बेहतर रूपांतरण, बेहतर प्रदर्शन और बेहतर प्रबंधन।
          </p>
        </div>

        <div className="highlights">
          {highlights.map((item) => (
            <article key={item.title} className="highlight-card">
              <div className="highlight-card__icon" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="highlight-card__title">{item.title}</h3>
              <p className="highlight-card__description">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
