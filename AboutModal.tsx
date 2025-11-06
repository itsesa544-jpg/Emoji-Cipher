// src/AboutModal.tsx
import React from 'react';

type AboutModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gradient-to-b from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)] text-[var(--text-primary)] rounded-2xl shadow-2xl shadow-black/50 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-[var(--input-border)] relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-2xl"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <div className="prose prose-invert prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] max-w-none">
                    <h1 className="text-3xl font-bold text-center mb-4">🌐 IM Softworks</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg text-[var(--accent-from)]">বাংলা:</h3>
                            <p>IM Softworks একটি উদীয়মান সফটওয়্যার কোম্পানি, যা ভবিষ্যতমুখী প্রযুক্তি ও সৃজনশীল সমাধানের মাধ্যমে ক্লায়েন্টদের ব্যবসায়িক সাফল্যে সহায়তা করে। আমরা বিশ্বাস করি— আমাদের উন্নতি তখনই সম্ভব, যখন আমাদের ক্লায়েন্ট লাভবান হবেন।</p>
                            <p className="font-semibold">আমরা শুধু সফটওয়্যার তৈরি করি না — আমরা সম্ভাবনা গড়ে তুলি।</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[var(--accent-from)]">English:</h3>
                            <p>IM Softworks is an emerging software company that empowers clients’ business success through futuristic technology and innovative solutions. We believe that our growth is only possible when our clients benefit.</p>
                             <p className="font-semibold">We don’t just build software — We build possibilities.</p>
                        </div>
                    </div>

                    <hr className="border-[var(--input-border)] my-6" />

                    <div className="text-center">
                        <h2 className="text-2xl font-bold">🎯 আমাদের লক্ষ্য (Our Mission)</h2>
                        <blockquote className="border-l-4 border-[var(--accent-from)] pl-4 italic my-4 inline-block">
                            <p className="text-lg font-semibold text-[var(--text-primary)]">“Your profit is our success.”</p>
                            <p className="text-sm">“আপনার লাভই আমাদের সফলতা।”</p>
                        </blockquote>
                    </div>

                    <hr className="border-[var(--input-border)] my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <img src="https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg" alt="Mohammad Esa Ali" className="w-32 h-32 rounded-full object-cover border-4 border-[var(--accent-from)] mb-4" />
                            <h2 className="text-xl font-bold">👋 About Me</h2>
                            <p>Hello, I am Mohammad Esa Ali, a passionate and creative tech enthusiast. I specialize in Software Development, Web Solutions, and Creative Design.</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">🔧 আমাদের সার্ভিসসমূহ (Our Services)</h2>
                            <ul className="list-disc list-inside space-y-1 mt-2">
                                <li>Custom Software Development</li>
                                <li>Web Applications</li>
                                <li>Mobile Apps</li>
                                <li>Cloud Solutions</li>
                                <li>API Development</li>
                                <li>UI/UX Design</li>
                            </ul>
                        </div>
                    </div>
                    
                    <hr className="border-[var(--input-border)] my-6" />

                    <div>
                        <h2 className="text-2xl font-bold text-center">Connect with us</h2>
                        <p className="text-center">সরাসরি কথা বলতে পারেন</p>
                        <div className="flex justify-center items-center gap-4 mt-4 text-center text-lg font-semibold">
                            <a href="mailto:im.softwark.team@gmail.com" className="text-[var(--accent-from)] hover:underline">im.softwark.team@gmail.com</a>
                            <span className="text-[var(--text-secondary)]">|</span>
                            <a href="tel:01792157184" className="text-[var(--accent-from)] hover:underline">01792157184</a>
                        </div>
                    </div>

                </div>
                
                <footer className="text-center text-xs text-[var(--text-secondary)] pt-8 mt-auto">
                    Copyright © IM Softwark
                </footer>
            </div>
        </div>
    );
};

export default AboutModal;
