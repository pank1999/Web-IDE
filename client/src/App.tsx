import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Terminal from "./components/Terminal";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import FileTree from "./components/Tree";
import { Button } from "./components/ui/button";
import { FaGithub } from "react-icons/fa";
import AceEditor from "react-ace";
import * as _ from "lodash" ;

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import socket from "./socket";
import { Badge } from "./components/ui/badge";


function App() {
  //@ts-ignore
  const [fileTree, setFileTree] = useState([]);
  const [terminalSize, setTerminalSize] = useState<{
    cols: number;
    rows: number;
  }>({ cols: 106, rows: 9 });
  const [selectedFile,setSelectedFile] = useState<string>('root');
  const [selectedFileContent,setSelectedFileContent] = useState<string>();
  const [code,setCode] = useState<string>();
  const [isSaved,setIsSaved] = useState<boolean>(true);

  useEffect(()=>{
    setIsSaved(_.isEqual(code,selectedFileContent));
  } ,[code,selectedFileContent]);

  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    const data = await response.json();
    setFileTree(data.tree);
  };

  const getFileContent = useCallback(async (path:string)=>{
    if(!selectedFile) return;
    const response = await fetch(`http://localhost:9000/files/content?path=${path}`);
    const res = await response.json();
    console.log({res})
    setSelectedFileContent(res.content);
  },[selectedFile]);

  useEffect(()=>{
    if(selectedFile){
      getFileContent(selectedFile);
    }
  },[selectedFile,getFileContent])



  useEffect(() => {
    socket.on('file:refresh',
      getFileTree)
    return ()=>{
      socket.off('file:refresh',getFileTree);
    }
  }, []);


  useEffect(() => {
    getFileTree();
  }, []);

  useEffect(()=>{
    setCode('');
  },[selectedFile,setCode])


  useEffect(()=>{
      setCode(selectedFileContent);
  },[selectedFile, selectedFileContent])

  const handleResize = (e: number) => {
    console.log(e);
    setTerminalSize({
      ...terminalSize,
      rows: Math.abs(e / 10),
    });
  };

  const onChangeEditorContent = (code: string) => {
    setCode(code);
  };

  useEffect(()=>{
    console.log("i came here",isSaved);
   if(code && !isSaved){
    const timer  = setTimeout(()=>{
        console.log(code);  
        socket.emit('file:change',{
          path:selectedFile,
          content:code
        })
        setIsSaved(true);
    },3000);
    return ()=> clearTimeout(timer);
  }
  },[code,selectedFile,isSaved]);

  const onFileSelect = (path:string) => {
    console.log({path});
    setSelectedFile(path);
  }

  const getFileBreadCum = ()=>{
    return selectedFile.replace(new RegExp('/','g'),'>');
  }

  return (
    <div className="w-full flex flex-col">
      <div className=" bg-gray-900 flex items-center justify-between p-2">
        <span className="text-white font-bold">X-CODE 99</span>
        <div className="flex items-center gap-2">
          <FaGithub size="30" color="white" className="cursor-pointer" />
          <Button variant="secondary">Download</Button>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-[100vh] rounded-lg border md:min-w-[200px]"
      >
        <ResizablePanel defaultSize={25}>
          <div className="flex flex-col h-[100vh] items-start bg-gray-800 justify-start">
            <h2 className="text-white font-bold p-1 ">File Explorer</h2>
            <hr className="w-full border border-gray-600" />
            <FileTree onSelect={(path:string)=>onFileSelect(path)} tree={fileTree}></FileTree>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70}>
                <p>{selectedFile && getFileBreadCum()} <Badge variant={isSaved ?'default' : 'secondary'}>{isSaved ? 'Saved' : 'Unsaved'}</Badge> </p>
                <AceEditor
                 className="w-full flex bg-gray-700 h-full items-center justify-center p-6"
                  mode="javascript"
                  theme="github"
                  onChange={onChangeEditorContent}
                  name="UNIQUE_ID_OF_DIV"
                  width="100%"
                  value={code}
                  editorProps={{ $blockScrolling: true }}
                />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} onResize={(e) => handleResize(e)}>
              <div className="w-full flex flex-col h-full items-center justify-center p-6">
                <p className="text-start">Terminal</p>
                <Terminal
                  cols={terminalSize.cols}
                  rows={terminalSize.rows}
                ></Terminal>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
