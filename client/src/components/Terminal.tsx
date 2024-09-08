import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import socket from "../socket";

import "@xterm/xterm/css/xterm.css"

const Terminal = ({rows,cols}:{rows:number,cols:number}) => {
  const termRef = useRef<HTMLDivElement | null>(null);
  const isRendered = useRef<boolean>(false);

  useEffect(() => {
    if(isRendered.current) return;
    isRendered.current = true;
    const terminal = new XTerminal({
        rows,
        cols
    });
    if (termRef.current) {
      terminal.open(termRef.current);

      terminal.onData((data) => {
        console.log(data);
        socket.emit('terminal:write',data);
      });

      socket.on('terminal:data',data=>{
        console.log(data)
        terminal.write(data);
      })
    }
  }, []);
  return (
    <div ref={termRef} id="terminal">
    </div>
  );
};

export default Terminal;
