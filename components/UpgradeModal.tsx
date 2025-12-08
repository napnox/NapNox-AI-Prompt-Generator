
import React from 'react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all scale-100 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Free Limit Reached</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    You've used all 3 free generations. To continue creating professional prompts without limits, please upgrade your plan.
                </p>
                <div className="space-y-4">
                    <a 
                        href="mailto:contact@napnox.com?subject=Upgrade%20NapNox%20Plan" 
                        className="flex items-center justify-center w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        Contact NapNox to Upgrade
                    </a>
                    <button 
                        onClick={onClose} 
                        className="block w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 font-semibold rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};
