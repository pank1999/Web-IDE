const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const pty = require("node-pty");
const os = require("os");
const fs = require("fs/promises");
const path = require("path");
const app = express();
const cors = require("cors");

const server = http.createServer(app);

app.use(cors());

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// create an ptyProcess instance
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD + "/user",
  env: process.env,
});

// when we write any thing on terminal we will emit the response data
ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
  io.emit('file:refresh',generateFilesTree('./user'))
});

const io = new SocketServer({
  cors: "*",
});

io.attach(server);

io.on("connection", (socket) => {
  console.log("socket connection successful", socket.id);
  socket.on("terminal:write", (data) => {
    ptyProcess.write(data);
  });

  socket.on("file:change", async (data) => {
    console.log("file change event");
    const { path, content } = data;
    await fs.writeFile("./user" + path, content);
  });
});

app.get("/files", async (req, res) => {
  console.log("files request");
  const filesTree = await generateFilesTree("./user");
  return res.json({ tree: filesTree });
});

app.get("/files/content", async (req, res) => {
  const { path } = req.query;
   console.log(path)
   if(path=== 'root')return ;
  const content = await fs.readFile("./user" + path, "utf-8");
  return res.json({ content });
});

server.listen(9000, () => {
  console.log("Docker server is running on port: 9000 ");
});

async function generateFilesTree(directory) {
  const tree = {};
  async function buildTree(dir, tree) {
    const files = await fs.readdir(dir);
    console.log(files);
    for (const file of files) {
      const filePath = path.join(dir, file);
      console.log(filePath);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        tree[file] = {};
        await buildTree(filePath, tree[file]);
      } else {
        tree[file] = null;
      }
    }
  }
  await buildTree(directory, tree);
  return tree;
}
