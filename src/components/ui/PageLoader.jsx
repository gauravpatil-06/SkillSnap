// Reusable full-page centered loading spinner used by all pages
export const PageLoader = () => (
    <div className="flex h-[80dvh] w-full items-center justify-center animate-in fade-in duration-[400ms]">
        <div className="flex flex-col items-center gap-5">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-[#47C4B7]/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#47C4B7] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-[0.2em] animate-pulse">
                Loading..
            </p>
        </div>
    </div>
);
