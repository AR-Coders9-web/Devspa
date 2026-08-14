import React from "react";

export default function CommandPreview({ command, onConfirm, onCancel }) {
  const name = command?.name || command?.type || "Assistant action";
  const description =
    command?.description || command?.message || "DEVSPA wants to perform an action.";

  return (
    <div className="animate-[slideUp_.22s_ease-out] rounded-2xl border border-amber-300/15 bg-[#111015]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-300/[0.06] text-amber-200">
          !
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-white/75">Confirm action</div>
          <div className="mt-0.5 text-[9px] font-medium text-amber-200/75">{name}</div>
          <p className="mt-1 text-[9px] leading-4 text-white/30">{description}</p>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-[9px] text-white/35 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/65 active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-[9px] font-semibold text-black transition-all duration-200 hover:bg-amber-50 hover:shadow-[0_0_20px_rgba(253,230,138,.1)] active:scale-95"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
