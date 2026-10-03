import React, { useEffect } from 'react';
import type { Session, Usage } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: Usage | null;
  contact: Session['contact'];
}

const whatsappHref = (number: string): string =>
  `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    "Hi NapNox, I'd like unlimited prompt generations.",
  )}`;

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, usage, contact }) => {
  // Close on Escape, and don't let the page behind scroll.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const limit = usage?.limit ?? 10;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="napnox-upgrade-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <h3 id="napnox-upgrade-title" className="text-2xl font-bold text-gray-900 mb-3">
          You've used all {limit} free generations
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {contact.message || 'Get in touch to unlock unlimited prompt generation on your account.'}
        </p>

        <div className="space-y-3">
          {contact.whatsapp && (
            <a
              href={whatsappHref(contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1da851] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.993 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.889 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Message us on WhatsApp
            </a>
          )}

          {contact.email && (
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent('Unlimited NapNox prompt generations')}`}
              className="flex items-center justify-center w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Email us to upgrade
            </a>
          )}

          <button
            onClick={onClose}
            className="block w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 font-semibold rounded-xl transition-colors border border-transparent hover:border-gray-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
