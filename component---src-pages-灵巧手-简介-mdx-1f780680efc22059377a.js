"use strict";(self.webpackChunkexample=self.webpackChunkexample||[]).push([[4],{2208:function(e,t,a){a.r(t),a.d(t,{_frontmatter:function(){return s},default:function(){return u}});var l=a(45),r=(a(6540),a(8619)),n=a(6236);const o=["components"],s={},i=(c="PageDescription",function(e){return console.warn("Component "+c+" was not imported, exported, or provided by MDXProvider as global scope"),(0,r.yg)("div",e)});var c;const m={_frontmatter:s},d=n.A;function u(e){let{components:t}=e,a=(0,l.A)(e,o);return(0,r.yg)(d,Object.assign({},m,a,{components:t,mdxType:"MDXLayout"}),(0,r.yg)(i,{mdxType:"PageDescription"},(0,r.yg)("p",null,"对灵巧手的简要介绍")),(0,r.yg)("h2",null,"简介"))}u.isMDXComponent=!0},6236:function(e,t,a){a.d(t,{A:function(){return w}});var l=a(6540),r=a(5474),n=a.n(r),o=a(1015),s=a(4698),i=a(5411),c=a(9634),m=a.n(c),d="PageHeader-module--dark-mode--WCeH8",u="PageHeader-module--with-tabs--vbQ-W";var p=e=>{let{title:t,theme:a,tabs:r=[]}=e;return l.createElement("div",{className:m()("PageHeader-module--page-header--NqfPe",{[u]:r.length,[d]:"dark"===a})},l.createElement("div",{className:"bx--grid"},l.createElement("div",{className:"bx--row"},l.createElement("div",{className:"bx--col-lg-12"},l.createElement("h1",{id:"page-title",className:"PageHeader-module--text--Er2EO"},t)))))};var g=e=>{let{relativePagePath:t,repository:a}=e;const{site:{siteMetadata:{repository:r}}}=(0,o.useStaticQuery)("1364590287"),{baseUrl:n,subDirectory:s,branch:i}=a||r,c=n+"/edit/"+i+s+"/src/pages"+t;return n?l.createElement("div",{className:"bx--row EditLink-module--row--BEmSX"},l.createElement("div",{className:"bx--col"},l.createElement("a",{className:"EditLink-module--link--IDrl1",href:c},"Edit this page on GitHub"))):null},b=a(6526),E=a(5540),h="PageTabs-module--selected-item--aBB0K";let v=function(e){function t(){return e.apply(this,arguments)||this}return(0,E.A)(t,e),t.prototype.render=function(){const{title:e,tabs:t,slug:a}=this.props,r=a.split("/").filter(Boolean).slice(-1)[0],s=t.map((e=>{const t=n()(e,{lower:!0,strict:!0}),s=t===r,i=new RegExp(r+"/?(#.*)?$"),c=a.replace(i,t);return l.createElement("li",{key:e,className:m()({[h]:s},"PageTabs-module--list-item--024o6")},l.createElement(o.Link,{className:"PageTabs-module--link--Kz-7R",to:""+c},e))}));return l.createElement("div",{className:"PageTabs-module--tabs-container--Cdfzw"},l.createElement("div",{className:"bx--grid"},l.createElement("div",{className:"bx--row"},l.createElement("div",{className:"bx--col-lg-12 bx--col-no-gutter"},l.createElement("nav",{"aria-label":e},l.createElement("ul",{className:"PageTabs-module--list--xLqxG"},s))))))},t}(l.Component);var f=v,y=a(7012),P=a(919),x=a(185);var N=e=>{let{date:t}=e;const a=new Date(t);return t?l.createElement(x.fI,{className:"last-modified-date-module--row--XJoYQ"},l.createElement(x.VP,null,l.createElement("div",{className:"last-modified-date-module--text--ogPQF"},"Page last updated: ",a.toLocaleDateString("en-GB",{day:"2-digit",year:"numeric",month:"long"})))):null};var w=e=>{let{pageContext:t,children:a,location:r,Title:c}=e;const{frontmatter:m={},relativePagePath:d,titleType:u}=t,{tabs:E,title:h,theme:v,description:x,keywords:w,date:T}=m,{interiorTheme:k}=(0,P.A)(),{site:{pathPrefix:D}}=(0,o.useStaticQuery)("2456312558"),A=D?r.pathname.replace(D,""):r.pathname,C=E?A.split("/").filter(Boolean).slice(-1)[0]||n()(E[0],{lower:!0}):"",B=v||k;return l.createElement(i.A,{tabs:E,homepage:!1,theme:B,pageTitle:h,pageDescription:x,pageKeywords:w,titleType:u},l.createElement(p,{title:c?l.createElement(c,null):h,label:"label",tabs:E,theme:B}),E&&l.createElement(f,{title:h,slug:A,tabs:E,currentTab:C}),l.createElement(y.A,{padded:!0},a,l.createElement(g,{relativePagePath:d}),l.createElement(N,{date:T})),l.createElement(b.A,{pageContext:t,location:r,slug:A,tabs:E,currentTab:C}),l.createElement(s.A,null))}}}]);
//# sourceMappingURL=component---src-pages-灵巧手-简介-mdx-1f780680efc22059377a.js.map