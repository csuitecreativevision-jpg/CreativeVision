import CareersSection from '../components/CareersSection';

interface JoinPageProps {
    onBack: () => void;
}

export default function JoinPage({ onBack }: JoinPageProps) {

    return (
        <div className="min-h-screen bg-[#050511] text-white relative flex flex-col">
            {/* Floating Back Button */}
            <button
                onClick={onBack}
                className="fixed top-8 left-8 z-50 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md uppercase text-sm tracking-widest font-bold flex items-center gap-2"
            >
                <span>←</span> BACK
            </button>

            {/* Background Glows - Full Screen Coverage */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-custom-purple/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-custom-blue/10 rounded-full blur-[150px]" />
            </div>

            <main className="flex-grow relative w-full h-full min-h-screen z-10 flex items-center justify-center">
                <CareersSection className="w-full" />
            </main>
        </div>
    );
}
