(()=>{
  const $ = require("jquery");
  $(()=>{
    function loadWindow(...windowVars){let ret = {};for(windowVar of windowVars){ret[windowVar] = window[windowVar];delete window[windowVar]}delete window.windowVar;return ret};
    const {require, process, __dirname, Buffer, nw, localStorage} = loadWindow("require", "process", "module", "URL", "URLSearchParams", "WebAssembly", "queueMicrotask", "__dirname", "__filename", "Buffer", "nw", "navigator", "localStorage", "clientInformation", "hljs");
    let dialog = require('nw-dialog'),
        fs = require("fs");
    dialog.setContext(document);
    const hljs = require('highlight.js');
    document.body.addEventListener('dragover', function(e){e.preventDefault();e.stopPropagation()}, false);
    document.body.addEventListener('drop', function(e){e.preventDefault();e.stopPropagation()}, false);
    let mousemove = false;
    $(document.getElementsByTagName("resize")[0]).mousedown(function(e){mousemove = true;$(document.body).css("cursor", "col-resize")});
    $(document).mousemove(function(e){
      if(!mousemove) return;
      document.head.children[0].innerHTML = `:root{--listwidth:${(e.pageX < 41) ? 41 : (e.pageX > document.body.clientWidth) ? document.body.clientWidth : e.pageX}px}`;
    }).mouseup(function(e){mousemove = false;$(document.body).css("cursor", "default")});
    if(localStorage.getItem("asar") != null) open(localStorage.getItem("asar"));
    $(document.getElementById("open")).click(() => {
      dialog.openFileDialog('.asar', open);
    });
    setInterval(() => {
      let maxw = 264;
      let minw = 84;
      let w = document.getElementsByTagName("files-tab")[0].offsetWidth;
      let children = document.getElementsByTagName("files-tab")[0].children;
      let len = children.length;
      w = Math.floor(w / len);
      if(w > maxw) w = maxw
      else if(w < minw) w = minw
      for(let i=0; i<len; i++){
        children[i].style.width = w+"px";
      }
    }, 1)
    function open(file){
      try{
        localStorage.setItem("asar", file);
        document.getElementsByTagName("asarpath")[0].innerHTML = file;
        $(document.getElementsByTagName("isopen")[0]).show();
        if(document.getElementsByTagName("file-list")[0].children[1]) document.getElementsByTagName("file-list")[0].removeChild(document.getElementsByTagName("file-list")[0].children[1]);
        let fd = fs.openSync(file, 'r');
        let jsonsize = Buffer.alloc(4);
        fs.readSync(fd, jsonsize, 0, 4, 12);
        jsonsize = jsonsize.readUInt32LE();
        let json = Buffer.alloc(jsonsize);
        fs.readSync(fd, json, 0, jsonsize, 16);
        json = JSON.parse(json.toString());
        $(document.getElementsByTagName("file-list")[0]).append(initFiles("root", json.files));
        function initFiles(name, files, path = ""){
          let list = document.createElement(name);
          if(path != "") $(list).hide();
          Object.keys(files).filter(d => files[d].files !== undefined).map(d => {
            let directory = document.createElement("directory");
            directory.setAttribute("class", `collapsed`);
            $(directory).click((e) => {
              if(e.target.localName == "directory") e.target = e.target.children[0];
              if(e.currentTarget.getAttribute("class") == "collapsed"){
                e.currentTarget.setAttribute("class", "expanded");
                e.currentTarget.children[1].setAttribute("style", "display: block;");
              } else {
                if(e.target.innerText != e.currentTarget.children[0].innerText) return;
                e.currentTarget.setAttribute("class", "collapsed");
                e.currentTarget.children[1].setAttribute("style", "display: none;");
              }
            });
            let header = document.createElement("header");
            header.innerHTML = d;
            let nlist = initFiles("list", files[d].files, path + `${d}\\`);
            $(directory).append(header);
            $(directory).append(nlist);
            $(list).append(directory);
          });
          Object.keys(files).filter(d => files[d].files === undefined).map(f => {
            let file = document.createElement("file");
            $(file).click((e) => {
              openFile(`${path}${e.currentTarget.children[0].innerText}`);
            });
            let header = document.createElement("header");
            header.innerHTML = f;
            $(file).append(header);
            $(list).append(file);
          });
          return list;
        }

        let filesopened = [];
        let selected = null;
        function openFile(path) {
          try{
            let filetab;
            if(!filesopened.includes(path)){
              let fileJson = json;
              path.split("\\").map(p => fileJson = fileJson.files[p]);
              let text = Buffer.alloc(fileJson.size);
              fs.readSync(fd, text, 0, fileJson.size, 17+jsonsize+parseInt(fileJson.offset));
              text = text.toString();
              filesopened.push(path);
              filetab = document.createElement("file-tab");
              filetab.setAttribute("path", path);
              let title = document.createElement("ftitle");
              title.innerHTML = path.split("\\").slice(-1)[0];
              let close = document.createElement("close");
              $(filetab).append(title);
              $(filetab).append(close);
              $(filetab).data("filetext", text);
              initEditor(path, text);
              $(filetab).click((e) => {
                if(e.target.localName == "close"){
                  let prev = filetab.previousElementSibling;
                  if(e.currentTarget === selected){
                    if(prev != null){
                      prev.setAttribute("class", "selected");
                      selected = prev;
                      initEditor(prev.getAttribute("path"), $(prev).data("filetext"));
                    } else {
                      let next = filetab.nextElementSibling;
                      if(next != null){
                        next.setAttribute("class", "selected");
                        selected = next;
                        initEditor(next.getAttribute("path"), $(next).data("filetext"));
                      } else {
                        selected = null;
                        document.getElementsByTagName("editor")[0].innerHTML = "";
                      }
                    }
                  }
                  filesopened = filesopened.filter(p => p !== path);
                  document.getElementsByTagName("files-tab")[0].removeChild(filetab);
                } else {
                  selected.setAttribute("class", "");
                  filetab.setAttribute("class", "selected");
                  selected = filetab;
                  initEditor(path, text);
                }
              });
              $(document.getElementsByTagName("files-tab")[0]).append(filetab);
            } else {
              let children = document.getElementsByTagName("files-tab")[0].children;
              for(let i=0; i<children.length; i++){
                if(children[i].getAttribute("path") === path){
                  filetab = children[i];
                  break;
                }
              }
              initEditor(path, $(filetab).data("filetext"));
            }
            if(selected != null) selected.setAttribute("class", "");
            filetab.setAttribute("class", "selected");
            selected = filetab;
          }catch(e){console.log(e)}
        }

        let zoom = 22;
        let fontsize = 15;
        let lw = 7.7;

        function initEditor(path, text){
          console.log(hljs.highlightAuto(text).value.split("\n"));
          let html = "";
          let lines = hljs.highlightAuto(text).value.split("\n");
          let len = lines.length.toString().length;
          document.head.children[1].innerHTML = `:root{--zoom:${zoom}px;--font-size:${fontsize}px;--lw:${7.7*len}px}`;
          hljs.highlightAuto(text).value.split("\n").map((l,n) => {
            html += `<line><num>${n}</num><text>${l}</text></line>`;
          });
          document.getElementsByTagName("editor")[0].innerHTML = `<code>${html}</code>`;
        }
      }catch(e){alert(`Error: \n${e}`);console.error(e)}
    }
  });
})();
