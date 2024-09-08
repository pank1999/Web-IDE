import React from "react";
import { FaFolder, FaFile } from "react-icons/fa";

//@ts-ignore
const FileTreeNode = ({ fileName, nodes,onSelect, path }) => {
  const isDirectory = !!nodes;
  const handleClick = () => {
    console.log("clicked");
    if(isDirectory){
      return ;
    }
    onSelect(path);
  }
  return (
    <div onClick={handleClick} className="w-full h-full bg-gray-900">
      <div
        className={
          isDirectory
            ? "flex gap-2 items-center  text-gray-400 p-1"
            : "text-gray-300 flex gap-2 items-center hover:bg-gray-300 hover:text-gray-900 p-1"
        }
      >
        {isDirectory ? <FaFolder className="text-gray-500" /> : <FaFile />}
        <p>{fileName}</p>
      </div>
      {nodes && fileName !== "node_modules" && (
        <ul>
          {Object.keys(nodes).map((key) => {
            return (
              <li className="ml-3 cursor-pointer" key={key}>
                <FileTreeNode onSelect={onSelect} path={path + '/'+ key} fileName={key} nodes={nodes[key]} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
//@ts-ignore
function FileTree({ tree ,onSelect}) {
  return <FileTreeNode onSelect={onSelect} path="" fileName="root" nodes={tree} />;
}

export default FileTree;
