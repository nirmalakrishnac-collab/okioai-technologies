import React, {useEffect, useRef, useState} from 'react';
import {CheckCircle2, Mail, MapPin, Phone, Send} from 'lucide-react';
import {useSite} from '../context/SiteContext.tsx';
import {useSeo} from '../hooks/useSeo.ts';
import {Breadcrumbs} from '../components/SharedUi.tsx';

type InquiryType = 'general' | 'business' | 'app' | 'partnership';

type EmailDeliveryState = {
  type: 'pending' | 'sent' | 'needs_activation' | 'error';
  text: string;
  recipientEmail: string;
};

type SubmittedLeadSnapshot = {
  inquiryType: InquiryType;
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail: string;
};

export function ContactPage() {
  const {settings} = useSite();

  const [inquiryType, setInquiryType] = useState<InquiryType>('business');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(''); // Honeypot trap

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailDeliveryState | null>(null);
  const [lastLead, setLastLead] = useState<SubmittedLeadSnapshot | null>(null);
  const [fsFrameLoaded, setFsFrameLoaded] = useState(false);

  const autoFormRef = useRef<HTMLFormElement | null>(null);
  const dispatchedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!submittedId || !lastLead) return;
    if (dispatchedIdRef.current === submittedId) return;
    const formEl = autoFormRef.current;
    if (!formEl) return;

    dispatchedIdRef.current = submittedId;
    setFsFrameLoaded(false);
    formEl.submit();

    const timeout = window.setTimeout(() => {
      setEmailStatus((prev) =>
        prev?.type === 'sent'
          ? prev
          : {
              type: 'error',
              text: `FormSubmit.co is still loading or blocked in the preview frame for ${lastLead.recipientEmail}. Check the FormSubmit frame below or click "Open FormSubmit in New Tab".`,
              recipientEmail: lastLead.recipientEmail,
            },
      );
    }, 9000);

    return () => window.clearTimeout(timeout);
  }, [submittedId, lastLead]);

  useSeo({
    title: 'Contact OKIOAI Technologies | Enquiries & Partnerships',
    description:
      'Contact OKIOAI Technologies for business enquiries, mobile application feedback, or partnership discussions.',
    canonicalPath: '/contact',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedId(null);
    setEmailStatus(null);
    setLastLead(null);
    setFsFrameLoaded(false);
    dispatchedIdRef.current = null;

    if (name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 3) {
      setError('Please provide a clear subject.');
      return;
    }
    if (message.trim().length < 15) {
      setError('Please include a message of at least 15 characters.');
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          inquiry_type: inquiryType,
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
          website_url: websiteUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to submit your enquiry right now.');
        return;
      }

      // Show confirmation immediately (<1s), then dispatch email notifications in background
      const recipientEmail =
        typeof data.formsubmitEmail === 'string' && data.formsubmitEmail ? data.formsubmitEmail : '';
      const web3Key =
        typeof data.web3formsAccessKey === 'string' && data.web3formsAccessKey
          ? data.web3formsAccessKey
          : '';

      setSubmittedId(data.id ?? 1);
      if (recipientEmail) {
        setLastLead({
          inquiryType,
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
          recipientEmail,
        });
      }
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');

      if (web3Key) {
        setEmailStatus({
          type: 'pending',
          text: 'Sending instant email notification via Web3Forms...',
          recipientEmail: recipientEmail || 'configured inbox',
        });
        const w3Controller = new AbortController();
        const w3Timer = window.setTimeout(() => w3Controller.abort(), 8000);
        void fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: web3Key,
            from_name: 'OKIOAI Technologies',
            name: cleanName,
            email: cleanEmail,
            replyto: cleanEmail,
            subject: `[OKIOAI ${inquiryType.toUpperCase()} Lead] ${cleanSubject}`,
            inquiry_type: inquiryType,
            message: cleanMessage,
          }),
          signal: w3Controller.signal,
        })
          .then(async (w3Res) => {
            const w3Data = (await w3Res.json().catch(() => null)) as {
              success?: boolean;
              message?: string;
            } | null;
            if (w3Res.ok && w3Data?.success) {
              setEmailStatus({
                type: 'sent',
                text: `Lead email delivered via Web3Forms to ${recipientEmail || 'your inbox'}.`,
                recipientEmail: recipientEmail || 'configured inbox',
              });
            } else {
              setEmailStatus((prev) =>
                prev?.type === 'sent'
                  ? prev
                  : {
                      type: 'error',
                      text: w3Data?.message || 'Web3Forms returned an error. Check your Access Key in Admin CMS.',
                      recipientEmail: recipientEmail || 'configured inbox',
                    },
              );
            }
          })
          .catch(() => {
            setEmailStatus((prev) =>
              prev?.type === 'sent'
                ? prev
                : {
                    type: 'error',
                    text: 'Web3Forms request timed out or was blocked.',
                    recipientEmail: recipientEmail || 'configured inbox',
                  },
            );
          })
          .finally(() => {
            window.clearTimeout(w3Timer);
          });
      }

      if (recipientEmail && !web3Key) {
        setEmailStatus({
          type: 'pending',
          text: `Submitting directly to FormSubmit.co (${recipientEmail})...`,
          recipientEmail,
        });
      }
    } catch {
      setError('Network error while submitting your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={[{label: 'Home', to: '/'}, {label: 'Contact'}]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs font-medium tracking-wider text-[#06B6D4] uppercase">
            Direct Communication
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Contact OKIOAI Technologies
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Whether you are writing regarding an OKIOAI mobile application, business collaboration, or strategic partnership, your message is validated and stored securely for our team to review.
          </p>

          <div className="pt-4 space-y-4 border-t border-white/[0.08]">
            <h2 className="text-sm font-semibold text-white">Company Contact Details</h2>
            {settings?.contact_email || settings?.contact_phone || settings?.office_address ? (
              <div className="space-y-3 text-sm text-slate-300">
                {settings.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#1D6FFF] shrink-0" />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-white">
                      {settings.contact_email}
                    </a>
                  </div>
                )}
                {settings.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#1D6FFF] shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </div>
                )}
                {settings.office_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#1D6FFF] mt-0.5 shrink-0" />
                    <span>{settings.office_address}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct email, phone, and office address details can be configured anytime in the Admin CMS under Website Settings. Use the verified enquiry form here to reach our team immediately.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#0B0F17]">
            {submittedId ? (
              <div className="py-8 space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <h2 className="text-xl font-semibold text-white">Enquiry Received</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Thank you for contacting OKIOAI Technologies. Your enquiry (Reference{' '}
                  <span className="font-mono tabular-nums text-white">#{submittedId}</span>) has been recorded in our protected Admin Enquiries inbox.
                </p>
                {emailStatus && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      emailStatus.type === 'sent'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : emailStatus.type === 'pending'
                          ? 'border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4]'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {emailStatus.text}
                  </div>
                )}
                {lastLead && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        FormSubmit Live Response ({lastLead.recipientEmail})
                      </span>
                      {fsFrameLoaded && (
                        <span className="text-emerald-400">Loaded</span>
                      )}
                    </div>
                    <form
                      ref={autoFormRef}
                      action={`https://formsubmit.co/${lastLead.recipientEmail}`}
                      method="POST"
                      target="okioai-fs-frame"
                      className="hidden"
                    >
                      <input type="hidden" name="name" value={lastLead.name} />
                      <input type="hidden" name="email" value={lastLead.email} />
                      <input type="hidden" name="_replyto" value={lastLead.email} />
                      <input type="hidden" name="inquiry_type" value={lastLead.inquiryType} />
                      <input type="hidden" name="subject" value={lastLead.subject} />
                      <input
                        type="hidden"
                        name="_subject"
                        value={`[OKIOAI ${lastLead.inquiryType.toUpperCase()} Lead] ${lastLead.subject}`}
                      />
                      <input type="hidden" name="message" value={lastLead.message} />
                      <input type="hidden" name="_template" value="table" />
                      <input type="hidden" name="_captcha" value="false" />
                    </form>
                    <iframe
                      name="okioai-fs-frame"
                      title="FormSubmit delivery status"
                      onLoad={() => {
                        setFsFrameLoaded(true);
                        if (lastLead) {
                          setEmailStatus((prev) =>
                            prev?.type === 'sent'
                              ? prev
                              : {
                                  type: 'sent',
                                  text: `FormSubmit responded for ${lastLead.recipientEmail}. Verify confirmation or complete any captcha shown in the frame below.`,
                                  recipientEmail: lastLead.recipientEmail,
                                },
                          );
                        }
                      }}
                      className="w-full h-44 rounded-lg border border-white/[0.12] bg-white"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedId(null);
                      setEmailStatus(null);
                      setLastLead(null);
                      setFsFrameLoaded(false);
                      dispatchedIdRef.current = null;
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] rounded-lg transition-colors"
                  >
                    Send Another Enquiry
                  </button>
                  {lastLead && (
                    <form
                      action={`https://formsubmit.co/${lastLead.recipientEmail}`}
                      method="POST"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <input type="hidden" name="name" value={lastLead.name} />
                      <input type="hidden" name="email" value={lastLead.email} />
                      <input type="hidden" name="_replyto" value={lastLead.email} />
                      <input type="hidden" name="inquiry_type" value={lastLead.inquiryType} />
                      <input type="hidden" name="subject" value={lastLead.subject} />
                      <input
                        type="hidden"
                        name="_subject"
                        value={`[OKIOAI ${lastLead.inquiryType.toUpperCase()} Lead] ${lastLead.subject}`}
                      />
                      <input type="hidden" name="message" value={lastLead.message} />
                      <input type="hidden" name="_template" value="table" />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-slate-200 border border-white/[0.14] hover:border-white/[0.3] bg-[#05070B] rounded-lg transition-colors"
                      >
                        Open FormSubmit in New Tab
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Honeypot anti-spam field */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website_url">Website</label>
                  <input
                    id="website_url"
                    name="website_url"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Enquiry Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        {key: 'business', label: 'Business'},
                        {key: 'app', label: 'App Support'},
                        {key: 'partnership', label: 'Partnership'},
                        {key: 'general', label: 'General'},
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setInquiryType(opt.key)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                          inquiryType === opt.key
                            ? 'bg-[#1D6FFF] border-[#1D6FFF] text-white'
                            : 'bg-[#05070B] border-white/[0.1] text-slate-300 hover:border-white/[0.25]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1D6FFF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1D6FFF]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your enquiry"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1D6FFF]"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question, feedback, or partnership proposal..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#05070B] border border-white/[0.12] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#1D6FFF]"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300"
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-500">
                    Protected by server-side validation and spam filtering.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1D6FFF] hover:bg-[#155AE0] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
