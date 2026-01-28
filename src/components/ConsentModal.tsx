import { CheckCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

const ConsentModal = ({ onConsent }: { onConsent: () => void }) => {
    const [accepted, setAccepted] = useState(false);
    const [timer, setTimer] = useState(5);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#0F172A] border-2 border-red-600 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-red-600 p-4 flex items-center gap-3">
                    <ShieldAlert className="text-white h-8 w-8" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Strict Compliance Warning</h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-white space-y-4">
                        <p className="font-semibold text-lg text-red-400">
                            WARNING: Video Recording & Screenshots are Strictly Prohibited.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                            <li>Using any external device to record the screen is a violation of our terms.</li>
                            <li>Attempting to screenshot the interface will result in an immediate account suspension.</li>
                            <li><span className="text-red-400 font-bold">Severe Legal Action</span> will be taken against anyone found distributing session content.</li>
                            <li>All sessions are forensically watermarked with your User ID and IP Address.</li>
                        </ul>
                    </div>

                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-red-500 bg-transparent checked:bg-red-600 transition-all"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                                <CheckCircle className="pointer-events-none absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100" />
                            </div>
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                I confirm I am 18+ years old and I accept the terms. I understand that recording this session will lead to a <strong>Lifetime Ban</strong>.
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={onConsent}
                        disabled={!accepted || timer > 0}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${accepted && timer === 0
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {timer > 0 ? `Please read (${timer}s)` : 'I AGREE & PROCEED'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentModal;
