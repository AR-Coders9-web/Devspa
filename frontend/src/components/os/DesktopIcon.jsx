import React from "react";

const DesktopIcon = ({ icon: Icon, label, onDoubleClick }) => {
  return (
    <button
      type="button"
      onDoubleClick={onDoubleClick}
      className="
        group
        flex
        w-[88px]
        flex-col
        items-center
        gap-2
        rounded-xl
        p-2
        text-center
        transition-all
        duration-200
        hover:bg-white/[0.08]
        focus:outline-none
        focus-visible:bg-white/[0.08]
      "
    >
      {/* Icon container */}
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          border
          border-white/[0.08]
          bg-black/30
          shadow-[0_8px_30px_rgba(0,0,0,0.25)]
          backdrop-blur-md
          transition-all
          duration-200
          group-hover:border-white/[0.18]
          group-hover:bg-white/[0.08]
          group-hover:shadow-[0_8px_35px_rgba(0,0,0,0.4)]
        "
      >
        <Icon
          size={25}
          strokeWidth={1.5}
          className="text-white/80 transition-colors group-hover:text-white"
        />
      </div>

      {/* Label */}
      <span className="max-w-[80px] truncate text-[11px] font-medium text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        {label}
      </span>
    </button>
  );
};

export default DesktopIcon;