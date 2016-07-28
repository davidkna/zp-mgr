"use strict";function e(e){return e&&e.__esModule?e:{default:e}}function t(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var n=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),r=require("crypto"),i=e(r),u=require("path"),a=e(u),s=require("execa"),o=e(s),l=require("glob"),c=e(l),f=require("fs-jetpack"),h=e(f),d=require("lodash.includes"),g=e(d),p=require("listr"),m=e(p),z=require("mkdirp"),v=e(z),y=require("xdg-basedir"),w=e(y),k=a.default.join(w.default.data,"zsh_plugins");(0,v.default)(k);var j=["Tarrasch/zsh-colors","zsh-users/zsh-syntax-highlighting","zsh-users/zsh-history-substring-search","zsh-users/zsh-completions","mafredri/zsh-async","sindresorhus/pure"],b=function(){function e(n){t(this,e),this.name=n;var r=i.default.createHash("sha1");r.update(n),this.hash=r.digest("hex")}return n(e,[{key:"clonePath",get:function(){return a.default.join(k,this.hash)}}]),e}(),q=[],x=[],P=new m.default([{title:"Getting Paths for Cloning",task:function(){j=j.map(function(e){return new b(e)})}},{title:"Cleaning up",task:function(){var e=j.map(function(e){return e.hash});e.push("plugins.zsh");var t=h.default.list(k);t&&t.filter(function(t){return!(0,g.default)(e,t)}).forEach(function(e){return h.default.remove(a.default.join(k,e))})}},{title:"Cloning Plugins",task:function(){return new m.default(j.map(function(e){var t=e.name,n=e.clonePath;return{title:"Cloning "+t+"...",task:function(){switch(h.default.exists(a.default.join(n,".git"))){case!1:return h.default.exists(n)&&h.default.remove(n),(0,o.default)("git",["clone","--recursive","--","https://github.com/"+t+".git",n]);case"dir":return o.default.sync("git",["fetch","--all"],{cwd:n}),(0,o.default)("git",["reset","--hard","origin/master","--"],{cwd:n});default:throw new Error("Invalid clone target!")}}}}),{concurrent:!0})}},{title:"Getting zsh File ready",task:function(){return new m.default(j.map(function(e){return{title:"Getting "+e.name+" ready...",task:function(){var t=e.name.split("/")[1],n=[t+".plugin.zsh","*.plugin.zsh","init.zsh","*.zsh","*.sh"];x.push(e.clonePath);for(var r=0;r<n.length;r++){var i=c.default.sync(a.default.join(e.clonePath,n[r]));if(0!==i.length){q.push(i[0]);break}}}}}),{concurrent:!0})}},{title:"Writing "+a.default.join(k,"plugins.zsh"),task:function(){return h.default.writeAsync(a.default.join(k,"plugins.zsh"),q.map(function(e){return"source "+e}).join("\n")+"\n"+x.map(function(e){return"fpath+="+e}).join("\n"))}}]);P.run().catch(function(e){console.error(e),process.exit(1)});
