function createElementDom(obj,tag){
  let rootEle = document.createElement(tag);
  for(let x in obj){
    if(obj[x] instanceof Array){
      var child_arr = obj[x];
      child_arr.forEach(function(dom){
        rootEle.appendChild(createElementDom.bind({},dom,x)());
      });
    }
    if("string" == typeof obj[x]||"number" == typeof obj[x]){
      if(x=="classes"){
        rootEle.setAttribute("class",obj[x]);
        continue;
      }
      if(x=="innerHTML"||x=="innerText"){
        rootEle.innerHTML = obj[x];
        continue
      }
      rootEle.setAttribute(x,obj[x]);
    }
    if("boolean"==typeof obj[x]){
      rootEle[x] = obj[x];
    }
  }
  if("function" == typeof obj.callback&&obj.callback instanceof Function){
    rootEle = obj.callback.call(obj)||rootEle;
  }
  return rootEle;
}
