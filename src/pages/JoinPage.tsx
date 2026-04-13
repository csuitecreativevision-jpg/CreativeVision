import CareersSection from '../components/CareersSection';

interface JoinPageProps {
    onBack: () => void;
}

export default function JoinPage({ onBack }: JoinPageProps) {
    return <CareersSection onBack={onBack} />;
}
