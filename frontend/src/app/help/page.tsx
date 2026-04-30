'use client'

import { useState } from 'react'
import styles from '../../styles/auth.module.css'

const faqItems = [
  {
    question: 'How do I add a credit card?',
    answer:
      'Go to the Cards page from the navigation bar and click Add Card. Fill out the card details, and your new card will appear on your dashboard.',
  },
  {
    question: 'Can I edit or delete a card later?',
    answer:
      'Yes. Use the three-dot menu on the top-right corner of each card to edit or delete it whenever you need.',
  },
  {
    question: 'Why is something not loading correctly?',
    answer:
      'Try refreshing the page first. If the issue continues, submit a bug report through the support form so it can be reviewed.',
  },
  {
    question: 'Where do support requests go?',
    answer:
      'When you submit the form, your email client opens with the support message pre-filled and addressed to mlaykg@umsystem.edu.',
  },
]

type HelperTopic = 'bug' | 'feature' | 'general' | null

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [activeHelper, setActiveHelper] = useState<HelperTopic>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: 'Bug Report',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const openHelper = (topic: HelperTopic) => {
    setActiveHelper(topic)

    if (topic === 'bug') {
      setFormData((prev) => ({
        ...prev,
        issueType: 'Bug Report',
        message:
          prev.message ||
          'I found a bug in CreditMaxxing. Here is what happened: ',
      }))
    }

    if (topic === 'feature') {
      setFormData((prev) => ({
        ...prev,
        issueType: 'Feature Request',
        message:
          prev.message ||
          'I would like to suggest a new feature for CreditMaxxing: ',
      }))
    }

    if (topic === 'general') {
      setFormData((prev) => ({
        ...prev,
        issueType: 'General Question',
        message:
          prev.message ||
          'I need help with using CreditMaxxing. My question is: ',
      }))
    }
  }

  const closeHelper = () => {
    setActiveHelper(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const subject = encodeURIComponent(`CreditMaxxing ${formData.issueType}`)
    const body = encodeURIComponent(
`Name: ${formData.name}
Email: ${formData.email}
Issue Type: ${formData.issueType}

Message:
${formData.message}`
    )

    window.location.href = `mailto:mlaykg@umsystem.edu?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (

    <div className={styles.PageContainer}>
       <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Help Center</h1>
        <p className={styles.PageSubtitle}>
          Find answers, learn how to use CreditMaxxing, and get support for managing your cards and rewards.
         </p>
       </div>

      <div className={styles.PageContainer}>
        <section className={styles.SupportHero}>
          <div className={styles.helpHeroBadge}>Support Center</div>
          <h1 className={styles.helpTitle}>How can we help you today?</h1>
          <p className={styles.helpSubtitle}>
            Find quick answers, report issues, and get support for anything in
            CreditMaxxing.
          </p>
        </section>

        <section className={styles.helpAiSection}>
          <div className={styles.helpAiCard}>
            <div className={styles.helpAiGlow}></div>
            <div className={styles.helpAiBadge}>AI Support</div>
            <h2>Uh-oh, need some extra help?</h2>
            <p>
              Choose a help topic below and get quick guidance before submitting
              a support request.
            </p>

            <div className={styles.helpAiHighlights}>
              <button
                type="button"
                className={styles.helpAiChip}
                onClick={() => openHelper('bug')}
              >
                Bug Reports
              </button>

              <button
                type="button"
                className={styles.helpAiChip}
                onClick={() => openHelper('feature')}
              >
                Feature Requests
              </button>

              <button
                type="button"
                className={styles.helpAiChip}
                onClick={() => openHelper('general')}
              >
                General Help
              </button>
            </div>

            {activeHelper && (
              <div className={styles.helpChatBox}>
                <div className={styles.helpChatHeader}>
                  <span className={styles.helpChatTitle}>CreditMaxxing Helper</span>
                  <button
                    type="button"
                    className={styles.helpChatClose}
                    onClick={closeHelper}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.helpChatMessages}>
                  <div className={styles.helpBotMessage}>
                    Hi! I can help point you in the right direction.
                  </div>

                  {activeHelper === 'general' && (
                    <>
                      <div className={styles.helpUserMessage}>I need general help.</div>
                      <div className={styles.helpBotMessage}>
                        No problem — for general help, you can start by checking the
                        FAQ section below for common questions about adding cards,
                        editing cards, or fixing loading issues.
                      </div>
                      <div className={styles.helpBotMessage}>
                        If you still need help, scroll down to the support form and
                        choose <strong>General Question</strong> as your issue type.
                      </div>
                    </>
                  )}

                  {activeHelper === 'bug' && (
                    <>
                      <div className={styles.helpUserMessage}>I found a bug.</div>
                      <div className={styles.helpBotMessage}>
                        Thanks for reporting it. Try to include what page you were on,
                        what button or action caused the issue, and what you expected
                        to happen instead.
                      </div>
                      <div className={styles.helpBotMessage}>
                        I already set the form below to <strong>Bug Report</strong> to
                        make reporting faster.
                      </div>
                    </>
                  )}

                  {activeHelper === 'feature' && (
                    <>
                      <div className={styles.helpUserMessage}>
                        I want to request a feature.
                      </div>
                      <div className={styles.helpBotMessage}>
                        Great idea. When submitting a feature request, explain what
                        you want added, why it would be useful, and how it would improve
                        the CreditMaxxing experience.
                      </div>
                      <div className={styles.helpBotMessage}>
                        I already set the form below to <strong>Feature Request</strong>.
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.Section}>
          <div>
            <h2 className={styles.SectionTitle}>Frequently Asked Questions</h2>
            <p>Click a question below to expand the answer.</p>
          </div>

          <div className={styles.helpFaqAccordion}>
            {faqItems.map((item, index) => (
              <div key={index} className={styles.helpFaqItem}>
                <button
                  className={styles.helpFaqQuestion}
                  onClick={() => toggleFaq(index)}
                  type="button"
                >
                  <span>{item.question}</span>
                  <span
                    className={`${styles.helpFaqIcon} ${
                      openIndex === index ? styles.helpFaqIconOpen : ''
                    }`}
                  >
                    +
                  </span>
                </button>

                {openIndex === index && (
                  <div className={styles.helpFaqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.Section}>
          <div className={styles.helpFormCard}>
            <div>
              <h2 className={styles.SectionTitle}>Contact Support</h2>
              <p> Report a bug, ask a question, or let us know what needs attention.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.helpForm}>
              <div className={styles.helpFormRow}>
                <div className={styles.helpInputGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className={styles.helpInputGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className={styles.helpInputGroup}>
                <label htmlFor="issueType">Issue Type</label>
                <select
                  id="issueType"
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                >
                  <option>Bug Report</option>
                  <option>Account Help</option>
                  <option>Feature Request</option>
                  <option>General Question</option>
                </select>
              </div>

              <div className={styles.helpInputGroup}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe the issue, what happened, and what you expected."
                  rows={6}
                  required
                />
              </div>

              <div className={styles.buttonRow}>
                <button type="submit" className={styles.ModalButton}>
                  Send Support Request
                </button>
              </div>

              {submitted && (
                <p className={styles.helpSuccessMessage}>
                  Your email client should open with your message ready to send.
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
