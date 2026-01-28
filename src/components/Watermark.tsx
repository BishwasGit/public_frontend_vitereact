import { useAuth } from '../auth/useAuth';

const Watermark = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[100] flex flex-wrap content-between justify-between overflow-hidden opacity-[0.03]">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex min-w-[30%] -rotate-12 select-none flex-col items-center justify-center p-8 text-center">
                    <span className="text-2xl font-black uppercase text-black">CONFIDENTIAL</span>
                    <span className="text-lg font-bold">{user.alias}</span>
                    <span className="text-sm">{user.id}</span>
                    <span className="text-xs">{new Date().toLocaleDateString()}</span>
                </div>
            ))}
        </div>
    );
};

export default Watermark;
