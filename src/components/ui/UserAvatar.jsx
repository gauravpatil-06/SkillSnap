import React from 'react';

export const UserAvatar = ({ name, avatar, size = 'w-9 h-9', className = '' }) => {
    // Generate a consistent, premium background color based on the user's name
    const [imgError, setImgError] = React.useState(false);
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const variantClass = 'bg-[#47C4B7]/10 text-[#47C4B7] border-[#47C4B7]/20';

    return (
        <div className={`${size} shrink-0 rounded-full border shadow-sm overflow-hidden flex items-center justify-center ${variantClass} ${className}`}>
            {avatar && !imgError ? (
                <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="font-black text-[13px] uppercase">
                    {initial}
                </span>
            )}
        </div>
    );
};
