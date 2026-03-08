import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'

export default function LanguageSelection() {
  const [language, setLanguage] = useState('')
  const [otherLanguage, setOtherLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedLanguage = Cookies.get('user_language')
    if (savedLanguage) {
      navigate('/classify')
    }
  }, [navigate])

  const commonLanguages = [
    'English', 'Spanish', 'Mandarin', 'Hindi', 'Arabic',
    'Portuguese', 'Bengali', 'Russian', 'Japanese', 'French'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    const selectedLanguage = language === 'Other' ? otherLanguage : language

    if (!selectedLanguage.trim() || (language === 'Other' && !otherLanguage.trim())) {
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/language', { language: selectedLanguage })
      Cookies.set('user_language', selectedLanguage, {
        expires: 30,
        secure: import.meta.env.PROD,
        sameSite: 'strict',
        path: '/'
      })
      navigate('/classify')
    } catch (error) {
      console.error('Error setting language:', error)
      alert('Failed to set language. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>Color Perception Study</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          Help us understand how people perceive and name colors across different languages and cultures.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            marginBottom: '15px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="">Select your native language</option>
          {commonLanguages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
          <option value="Other">Other</option>
        </select>

        {language === 'Other' && (
          <input
            type="text"
            value={otherLanguage}
            placeholder="Enter your language"
            onChange={(e) => setOtherLanguage(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              marginBottom: '15px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        )}

        <button
          type="submit"
          disabled={!language || (language === 'Other' && !otherLanguage.trim()) || loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '18px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (!language || (language === 'Other' && !otherLanguage.trim()) || loading) ? 0.6 : 1
          }}
        >
          {loading ? 'Starting...' : 'Begin'}
        </button>
      </form>
    </div>
  )
}
