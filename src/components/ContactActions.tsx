import { Phone, MessageCircle, Mail, Send } from 'lucide-react';

interface ContactActionsProps {
  phone?: string;
  email?: string;
  size?: number;
  className?: string;
  defaultMessage?: string;
  emailSubject?: string;
}

function sanitizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Garde uniquement les chiffres (WhatsApp/SMS ont besoin d'un format numérique)
  const digits = phone.replace(/\D/g, '');
  return digits || undefined;
}

function formatMessage(message?: string): string {
  return encodeURIComponent(message || '');
}

export default function ContactActions({
  phone,
  email,
  size = 18,
  className = '',
  defaultMessage = 'Bonjour, je vous contacte suite à votre demande.',
  emailSubject = 'Suite à votre demande',
}: ContactActionsProps) {
  const sanitizedPhone = sanitizePhone(phone);

  const handleCall = () => {
    if (phone) window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = () => {
    if (!sanitizedPhone) return;
    window.open(`https://wa.me/${sanitizedPhone}?text=${formatMessage(defaultMessage)}`, '_blank');
  };

  const handleSMS = () => {
    if (!sanitizedPhone) return;
    window.open(`sms:${sanitizedPhone}?body=${formatMessage(defaultMessage)}`, '_blank');
  };

  const handleEmail = () => {
    if (!email) return;
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${formatMessage(defaultMessage)}`,
      '_blank',
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCall}
        disabled={!phone}
        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
        title={phone ? 'Appeler' : 'Aucun téléphone'}
      >
        <Phone size={size} />
      </button>
      <button
        onClick={handleWhatsApp}
        disabled={!sanitizedPhone}
        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
        title={sanitizedPhone ? 'WhatsApp' : 'Aucun téléphone'}
      >
        <MessageCircle size={size} />
      </button>
      <button
        onClick={handleSMS}
        disabled={!sanitizedPhone}
        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        title={sanitizedPhone ? 'SMS' : 'Aucun téléphone'}
      >
        <Send size={size} />
      </button>
      <button
        onClick={handleEmail}
        disabled={!email}
        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed"
        title={email ? 'Email' : 'Aucun email'}
      >
        <Mail size={size} />
      </button>
    </div>
  );
}
