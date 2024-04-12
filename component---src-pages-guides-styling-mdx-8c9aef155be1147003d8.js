"use strict";(self.webpackChunkexample=self.webpackChunkexample||[]).push([[2213],{7961:function(e,t,a){a.r(t),a.d(t,{_frontmatter:function(){return s},default:function(){return p}});var n=a(45),l=(a(6540),a(8619)),o=a(6236);const r=["components"],s={},i=e=>function(t){return console.warn("Component "+e+" was not imported, exported, or provided by MDXProvider as global scope"),(0,l.yg)("div",t)},c=i("PageDescription"),m=i("InlineNotification"),u={_frontmatter:s},d=o.A;function p(e){let{components:t}=e,a=(0,n.A)(e,r);return(0,l.yg)(d,Object.assign({},u,a,{components:t,mdxType:"MDXLayout"}),(0,l.yg)(c,{mdxType:"PageDescription"},(0,l.yg)("p",null,"The carbon theme uses Sass to take advantage of the carbon-components styles and\nvariables while authoring novel components. In addition, we use css modules to\nensure we don’t collide with devs and make sure our components are portable and\nshadowable.")),(0,l.yg)("h2",null,"Local Styles"),(0,l.yg)("p",null,"For your application’s local styles, you can just import your style sheet\n",(0,l.yg)("a",{parentName:"p",href:"https://www.gatsbyjs.org/docs/global-css/#adding-global-styles-without-a-layout-component"},"directly into a ",(0,l.yg)("inlineCode",{parentName:"a"},"gatsby-browser.js")),"\nfile at the root of your project."),(0,l.yg)("p",null,"You can also use sass modules like we do in the theme, this would make it easier\nfor you to share your component with other theme consumers down the line."),(0,l.yg)("p",null,"Every Sass file in your project automatically has access to the the following\ncarbon resources:"),(0,l.yg)("ul",null,(0,l.yg)("li",{parentName:"ul"},"colors – ",(0,l.yg)("inlineCode",{parentName:"li"},"background: carbon--gray-10;")),(0,l.yg)("li",{parentName:"ul"},"spacing - ",(0,l.yg)("inlineCode",{parentName:"li"},"margin: $spacing-05;")),(0,l.yg)("li",{parentName:"ul"},"theme-tokens - ",(0,l.yg)("inlineCode",{parentName:"li"},"color: $text-01;")),(0,l.yg)("li",{parentName:"ul"},"motion -\n",(0,l.yg)("inlineCode",{parentName:"li"},"transition: all $duration--moderate-01 motion(entrance, productive);")),(0,l.yg)("li",{parentName:"ul"},"typography - ",(0,l.yg)("inlineCode",{parentName:"li"},"@include carbon--type-style('body-long-01');"))),(0,l.yg)("h2",null,"Targeting theme components"),(0,l.yg)(m,{mdxType:"InlineNotification"},(0,l.yg)("p",null,"We reserve the right to change classes between major releases. Use this strategy\nat your own risk.")),(0,l.yg)("p",null,"Theme component classes have a hash of their styles tacked on to the end. This\nis both to prevent collisions, and also to prevent sneaky breaking changes to\nyour styles if we update the class underneath you and you were relying on our\nstyles."),(0,l.yg)("p",null,"However, you can target the classes without the hash by using a\n",(0,l.yg)("a",{parentName:"p",href:"https://css-tricks.com/almanac/selectors/a/attribute/"},"partial selector"),":"),(0,l.yg)("pre",null,(0,l.yg)("code",{parentName:"pre",className:"language-scss"},"[class*='Banner-module--column'] {\n  color: $text-04;\n}\n")),(0,l.yg)("p",null,"This will match the class that starts with ",(0,l.yg)("inlineCode",{parentName:"p"},"Banner-module--column")," and would be\nimmune to any changes to the hash. We may at some point remove the hash if this\nbecomes an issue."))}p.isMDXComponent=!0},6236:function(e,t,a){a.d(t,{A:function(){return k}});var n=a(6540),l=a(5474),o=a.n(l),r=a(1015),s=a(4698),i=a(5411),c=a(9634),m=a.n(c),u="PageHeader-module--dark-mode--WCeH8",d="PageHeader-module--with-tabs--vbQ-W";var p=e=>{let{title:t,theme:a,tabs:l=[]}=e;return n.createElement("div",{className:m()("PageHeader-module--page-header--NqfPe",{[d]:l.length,[u]:"dark"===a})},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12"},n.createElement("h1",{id:"page-title",className:"PageHeader-module--text--Er2EO"},t)))))};var g=e=>{let{relativePagePath:t,repository:a}=e;const{site:{siteMetadata:{repository:l}}}=(0,r.useStaticQuery)("1364590287"),{baseUrl:o,subDirectory:s,branch:i}=a||l,c=o+"/edit/"+i+s+"/src/pages"+t;return o?n.createElement("div",{className:"bx--row EditLink-module--row--BEmSX"},n.createElement("div",{className:"bx--col"},n.createElement("a",{className:"EditLink-module--link--IDrl1",href:c},"Edit this page on GitHub"))):null},h=a(6526),y=a(5540),b="PageTabs-module--selected-item--aBB0K";let w=function(e){function t(){return e.apply(this,arguments)||this}return(0,y.A)(t,e),t.prototype.render=function(){const{title:e,tabs:t,slug:a}=this.props,l=a.split("/").filter(Boolean).slice(-1)[0],s=t.map((e=>{const t=o()(e,{lower:!0,strict:!0}),s=t===l,i=new RegExp(l+"/?(#.*)?$"),c=a.replace(i,t);return n.createElement("li",{key:e,className:m()({[b]:s},"PageTabs-module--list-item--024o6")},n.createElement(r.Link,{className:"PageTabs-module--link--Kz-7R",to:""+c},e))}));return n.createElement("div",{className:"PageTabs-module--tabs-container--Cdfzw"},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12 bx--col-no-gutter"},n.createElement("nav",{"aria-label":e},n.createElement("ul",{className:"PageTabs-module--list--xLqxG"},s))))))},t}(n.Component);var f=w,v=a(7012),E=a(919),N=a(185);var x=e=>{let{date:t}=e;const a=new Date(t);return t?n.createElement(N.fI,{className:"last-modified-date-module--row--XJoYQ"},n.createElement(N.VP,null,n.createElement("div",{className:"last-modified-date-module--text--ogPQF"},"Page last updated: ",a.toLocaleDateString("en-GB",{day:"2-digit",year:"numeric",month:"long"})))):null};var k=e=>{let{pageContext:t,children:a,location:l,Title:c}=e;const{frontmatter:m={},relativePagePath:u,titleType:d}=t,{tabs:y,title:b,theme:w,description:N,keywords:k,date:P}=m,{interiorTheme:T}=(0,E.A)(),{site:{pathPrefix:C}}=(0,r.useStaticQuery)("2456312558"),D=C?l.pathname.replace(C,""):l.pathname,A=y?D.split("/").filter(Boolean).slice(-1)[0]||o()(y[0],{lower:!0}):"",B=w||T;return n.createElement(i.A,{tabs:y,homepage:!1,theme:B,pageTitle:b,pageDescription:N,pageKeywords:k,titleType:d},n.createElement(p,{title:c?n.createElement(c,null):b,label:"label",tabs:y,theme:B}),y&&n.createElement(f,{title:b,slug:D,tabs:y,currentTab:A}),n.createElement(v.A,{padded:!0},a,n.createElement(g,{relativePagePath:u}),n.createElement(x,{date:P})),n.createElement(h.A,{pageContext:t,location:l,slug:D,tabs:y,currentTab:A}),n.createElement(s.A,null))}}}]);
//# sourceMappingURL=component---src-pages-guides-styling-mdx-8c9aef155be1147003d8.js.map