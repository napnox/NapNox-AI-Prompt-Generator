
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Generators</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li><a href="#" className="hover:text-gray-900">Image Prompts</a></li>
                            <li><a href="#" className="hover:text-gray-900">Writing Prompts</a></li>
                            <li><a href="#" className="hover:text-gray-900">Code Prompts</a></li>
                            <li><a href="#" className="hover:text-gray-900">Video Prompts</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Company</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li><a href="#" className="hover:text-gray-900">About Us</a></li>
                            <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                            <li><a href="#" className="hover:text-gray-900">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Resources</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li><a href="#" className="hover:text-gray-900">FAQ</a></li>
                            <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
                            <li><a href="#" className="hover:text-gray-900">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Legal</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} NapNox. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
