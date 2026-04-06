export interface PricingPackage {
    name: string;
    headline: string; // New: Psychological hook
    price: number;
    duration: string;
    originalPrice?: number;
    savings?: string;
    description: string;
    features: string[];
    popular: boolean;
    gradient: string;
    borderColor: string;
    iconGradient: string;
    themeColor: string; // New: Main theme color for UI accents
}

export const shortFormPackages: PricingPackage[] = [
    {
        name: "Trial",
        headline: "Experience the Future.",
        price: 0,
        duration: "one-time",
        description: "Zero risk. Pure potential. See the difference professional editing makes.",
        features: [
            "30 Minute Consultation",
            "Free Trial Video"
        ],
        popular: false,
        gradient: "from-blue-900/40 via-[#050511] to-blue-900/20",
        borderColor: "border-blue-500/30",
        iconGradient: "from-blue-400 to-indigo-500",
        themeColor: "#3b82f6" // blue-500
    },
    {
        name: "Bronze",
        headline: "Build Your Foundation.",
        price: 390,
        duration: "month",
        description: "Consistency creates authority. Start your journey with a professional edge.",
        features: [
            "6 Videos",
            "6 Thumbnails",
            "Customized Editing Style",
            "Quick Turnarounds",
            "Unlimited Revisions"
        ],
        popular: false,
        gradient: "from-orange-900/40 via-[#050511] to-amber-900/20",
        borderColor: "border-amber-700/30",
        iconGradient: "from-amber-700 to-orange-600",
        themeColor: "#d97706" // amber-600
    },
    {
        name: "Silver",
        headline: "Accelerate Growth.",
        price: 780,
        duration: "month",
        originalPrice: 870,
        savings: "10% OFF",
        description: "Momentum is everything. Double your output, double your impact.",
        features: [
            "12 Videos",
            "12 Thumbnails",
            "Customized Editing Style",
            "Quick Turnarounds",
            "Unlimited revisions"
        ],
        popular: false,
        gradient: "from-slate-700/40 via-[#050511] to-gray-800/20",
        borderColor: "border-gray-400/30",
        iconGradient: "from-gray-300 to-slate-500",
        themeColor: "#94a3b8" // slate-400
    },
    {
        name: "Gold",
        headline: "Dominate Your Niche.",
        price: 1600,
        duration: "month",
        originalPrice: 1915,
        savings: "15% OFF",
        description: "The gold standard for serious creators. Full-scale production power.",
        features: [
            "25 Videos",
            "25 Thumbnails",
            "Customized Editing Style",
            "Quick Turnarounds",
            "Unlimited revisions",
            "Content Curation",
            "Content Repurposing",
            "Editing Style Inventory",
            "Distribution System",
            "Project Overview System"
        ],
        popular: true,
        gradient: "from-yellow-700/40 via-[#050511] to-yellow-900/20",
        borderColor: "border-yellow-500/50",
        iconGradient: "from-yellow-400 to-amber-500",
        themeColor: "#eab308" // yellow-500
    },
    {
        name: "Platinum",
        headline: "Leave a Legacy.",
        price: 2900,
        duration: "month",
        originalPrice: 3660,
        savings: "20% OFF",
        description: "Maximum scale. Maximum authority. For those who play at the highest level.",
        features: [
            "45 Videos",
            "45 Thumbnails",
            "Customized Editing Style",
            "Quick Turnarounds",
            "Unlimited Revisions",
            "Content Curation",
            "Content Repurposing",
            "Editing Style Inventory",
            "Distribution System",
            "Project Overview System"
        ],
        popular: false,
        gradient: "from-cyan-900/40 via-[#050511] to-slate-900/20",
        borderColor: "border-cyan-400/40",
        iconGradient: "from-cyan-300 to-blue-600",
        themeColor: "#22d3ee" // cyan-400
    }
];

export const longFormPackages: PricingPackage[] = [
    {
        name: "Bronze",
        headline: "Build Your Foundation.",
        price: 600,
        duration: "month",
        description: "Consistency creates authority. Start your journey with a professional edge.",
        features: [
            "4 Long Forms per month",
            "4 Thumbnails",
            "Weekly Consultation",
            "5 Revisions/video",
            "Project Overview System"
        ],
        popular: false,
        gradient: "from-orange-900/40 via-[#050511] to-amber-900/20",
        borderColor: "border-amber-700/30",
        iconGradient: "from-amber-700 to-orange-600",
        themeColor: "#d97706"
    },
    {
        name: "Silver",
        headline: "Accelerate Growth.",
        price: 1500,
        duration: "month",
        description: "Momentum is everything. Double your output, double your impact.",
        features: [
            "8 Long Forms per month",
            "8 Thumbnails",
            "Weekly Consultation",
            "5 Revisions/video",
            "Project Overview System"
        ],
        popular: false,
        gradient: "from-slate-700/40 via-[#050511] to-gray-800/20",
        borderColor: "border-gray-400/30",
        iconGradient: "from-gray-300 to-slate-500",
        themeColor: "#94a3b8"
    },
    {
        name: "Gold",
        headline: "Dominate Your Niche.",
        price: 2000,
        duration: "month",
        description: "The gold standard for serious creators. Full-scale production power.",
        features: [
            "12 Long Forms per month",
            "12 Thumbnails",
            "Weekly Consultation",
            "5 Revisions/video",
            "Optional SEO Description/Tags/Title",
            "Project Overview System",
            "Weekly Data Analysis",
            "Content Strategy"
        ],
        popular: true,
        gradient: "from-yellow-700/40 via-[#050511] to-yellow-900/20",
        borderColor: "border-yellow-500/50",
        iconGradient: "from-yellow-400 to-amber-500",
        themeColor: "#eab308"
    }
];
