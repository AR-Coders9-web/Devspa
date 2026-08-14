import React from "react";
import {
  Code2,
  Folder,
  Terminal,
  Bug,
  Bot,
} from "lucide-react";

import DesktopIcon from "./DesktopIcon";

const Desktop = ({ onOpenWindow }) => {
  return (
    <div className="absolute inset-0 z-10">

      <div className="absolute left-5 top-5 flex flex-col items-center gap-3">

        <DesktopIcon
          icon={Code2}
          label="Code Editor"
          onDoubleClick={() =>
            onOpenWindow("editor")
          }
        />

        <DesktopIcon
          icon={Folder}
          label="Explorer"
          onDoubleClick={() =>
            onOpenWindow("explorer")
          }
        />

     

        <DesktopIcon
          icon={Bug}
          label="Debugger"
          onDoubleClick={() =>
            onOpenWindow("debugger")
          }
        />

        <DesktopIcon
          icon={Bot}
          label="AI Assistant"
          onDoubleClick={() =>
            onOpenWindow("ai")
          }
        />

      </div>
    </div>
  );
};

export default Desktop;