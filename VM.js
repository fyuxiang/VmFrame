function Observer (obj){
  this.data = obj;
  this.iterator(obj);
 }
 Observer.prototype={
  constructor:Observer,
  iterator:function(obj){
   if (!obj || typeof obj !== 'object') {
    return;
   }
   var self = this;
   Object.keys(obj).forEach(function(key) {
    self.defineOwnProperties(obj, key, obj[key]);
   });
   },
  defineOwnProperties:function(data,key,pro){
   observe(pro);
   var publisher = new Dep();
   Object.defineProperty(data,key,{
    enumerable:true,
    configurable:true,
    get:function(){
     if(Dep.target){
      publisher.add(Dep.target);
     }
     return pro;
    },
    set:function(value){
     if(value==pro){
      debugger
      return
     }
     pro = value;
     console.log("此属性已经被监听！",value);
     publisher.publish();
    }
   });
  }
 }
 function observe(value, vm) {
  if (!value || typeof value !== 'object') {
   return;
  }
  return new Observer(value);
 };
 function Dep(){
  this.deps=[];
 }
 Dep.prototype={
  constructor:Dep,
  add:function(watcher){
   this.deps.push(watcher);
   return this;
  },
  publish:function(){
   this.deps.forEach(function(watcher) {
            watcher.update();
        });
  }
 }
 Dep.target = null;
 function Watcher(vm,tag,calback){
  this.vm=vm;
  this.tag = tag;
  this.calback =calback;
  this.value = this.rejist();
 }
 Watcher.prototype={
  constructor:Watcher,
  update:function(){
   var value = this.vm.data[this.tag];
   if(value!==this.value){
    this.value = value;
    this.calback.call(this.vm, value);
   }
  },
  rejist:function(){
   Dep.target=this;
   var value = this.vm.data[this.tag];
   Dep.target=null;
   return value;
  }
 }
 function VmFrame(options){
  var that = this;
  this.data = options.data;
  this.methods = options.methods;
  Object.keys(this.data).forEach(function(key){
   that.proxyKeys(key);
  });
  observe(this.data);
  new Compiler(this,options.el);
  options.mounted.call(this);
 }
 VmFrame.prototype={
  proxyKeys:function(key){
   var that = this;
   Object.defineProperty(this,key,{
    enumerable:false,
    configurable:true,
    get:function Getter(){
     return that.data[key];
    },
    set:function Setter(value){
     that.data[key] = value;
    }
   });
  }
 }
 function Compiler(vm,el){
  if(el.indexOf("#")==0){
   this.el = document.querySelector(el);
  }
  this.el = document.getElementById(el);
  this.vm = vm;
  this.fragment = null;
  this.init();
 }
 Compiler.prototype={
  constructor:Compiler,
  init:function(){
   if(!this.el){
   throw new Error("dom节点解析错误！");
    return;
   }
   this.fragment = this.moveDomToFragment(this.el);
   this.compileDom(this.fragment);
   this.el.appendChild(this.fragment);
  },
  moveDomToFragment:function(el){
   var frag = document.createDocumentFragment();
   for(var i=0;i<el.childNodes.length;){
    frag.appendChild(el.childNodes[0]);
   }
   return frag;
  },
  compileDom:function(dom){
   var childs = dom.childNodes,self = this;
   var reg = /^\{\{(.*)\}\}$/;
   [].slice.call(childs).forEach(function(childnode){
    if(self.isElement(childnode)){
     self.complieNode(childnode);
    }
    if(self.isText(childnode) && reg.test(childnode.textContent)){
     self.complieText(childnode,reg.exec(childnode.textContent)[1]);
    }
    if(childnode.childNodes && childnode.childNodes.length){
     self.compileDom(childnode);
    }
   });
  },
  complieNode:function(node){
   var attrs = node.attributes,self = this;;
   [].forEach.call(attrs,function(attribute){
    var tag = attribute.value,dir = attribute.name.slice(2);
    if(self.isDirective(attribute.name)){
     if(self.isEventDirective(dir)){
      self.compileDirective(node,self.vm,tag,dir);
     }
     if(self.isModel(dir)){
      self.compileModel(node,self.vm,tag,dir);
     }
     if(self.isBind(dir)){//just支持class
      self.compileBind(node,self.vm,tag,dir);
     }
     node.removeAttribute(attribute.name);
    }
   });
  },
  compileBind:function(node,vm,tag,dir){
   var slef = this,data = this.vm[tag],attribute = (node.getAttribute("class")||"")+" ";
   attribute +=(slef[tag] = slef.trans(data));
   node.setAttribute("class",attribute.trim());
   //node.setClass
   new Watcher(this.vm,tag,function(value){
    slef.updateClass(node,tag,value);
   })
  },
  complieText:function(childnode,reg){
   var slef = this;
   var data = this.vm[reg];
   slef.updateText(childnode,data);
   new Watcher(this.vm,reg,function(value){
    slef.updateText(childnode,value);
   })
  },
  compileDirective:function(dom,vm,tag,dir){
   var event_type = dir.split(":")[1],calback = vm.methods&&vm.methods[tag];
   if(calback){
    dom.addEventListener(event_type, calback.bind(vm), false);
   }
  },
  compileModel:function(dom,vm,tag,dir){
   var self =this,value = this.vm[tag];
   self.updateValue(dom,value);
   new Watcher(vm,tag,function(value){
    self.updateValue(dom,value);
   });
   dom.addEventListener("input",function(e){
    var target = (e||window.e).target||(e||window.e).srcElement;
    var new_value = target.value;
    if(value ===new_value){
     return ;
    }
    self.vm[tag] = new_value;
    value = new_value;
   },false);
  },
  trans:function(data){
   var result;
    try{
     result = eval(data);
    }catch(e){
     result = data;
    }
    return result;
  },
  updateClass:function(node,tag,value){
   var attribute = (node.getAttribute("class")||"")+" ";
   attribute = attribute.replace(this[tag],this.trans(value))
   node.setAttribute("class",attribute.trim());
   this[tag] = this.trans(value);
  },
  updateText:function (node,value){
   node['innerText' in node ?"innerText":"textContent" ] = typeof value != undefined ?value:"";
  },
  updateValue:function(node,value){
   node.value = typeof value != undefined ?value:"";
  },
  isDirective:function(directive){
   return directive.indexOf("v-")==0;
  },
  isEventDirective:function(eventDiret){
   return eventDiret.indexOf("on:")===0;
  },
  isModel:function(model){
   return model.indexOf("model")===0;
  },
  isElement:function(ele){
   return ele.nodeType==1;
  },
  isText:function(text){
   return text.nodeType == 3;
  },
  isBind:function(bindAttr){
   return bindAttr.indexOf("bind:")===0;
  },
 }
