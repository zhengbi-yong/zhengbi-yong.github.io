"use strict";(self.webpackChunkexample=self.webpackChunkexample||[]).push([[8394],{595:function(e,t,a){a.r(t),a.d(t,{_frontmatter:function(){return i},default:function(){return p}});var n=a(45),l=(a(6540),a(8619)),o=a(6236);const r=["components"],i={},s=(c="PageDescription",function(e){return console.warn("Component "+c+" was not imported, exported, or provided by MDXProvider as global scope"),(0,l.yg)("div",e)});var c;const m={_frontmatter:i},d=o.A;function p(e){let{components:t}=e,a=(0,n.A)(e,r);return(0,l.yg)(d,Object.assign({},m,a,{components:t,mdxType:"MDXLayout"}),(0,l.yg)(s,{mdxType:"PageDescription"},(0,l.yg)("p",null,"The ",(0,l.yg)("inlineCode",{parentName:"p"},"<FeedbackDialog>")," component is a non-modal dialog that allows your users to\nprovide low-friction, anonymous feedback for a specific page.")),(0,l.yg)("h2",null,"Activating the dialog"),(0,l.yg)("p",null,"The Feedback button only becomes visible once you’ve supplied an ",(0,l.yg)("inlineCode",{parentName:"p"},"onSubmit"),"\nhandler. To do that, we’ll need to shadow the ",(0,l.yg)("inlineCode",{parentName:"p"},"FeedbackDialog")," component."),(0,l.yg)("ol",null,(0,l.yg)("li",{parentName:"ol"},(0,l.yg)("p",{parentName:"li"},"Create a new javascript file under\n",(0,l.yg)("inlineCode",{parentName:"p"},"src/gatsby-theme-carbon/components/FeedbackDialog/FeedbackDialog.js"),".\nMatching the filepath exactly is important here.")),(0,l.yg)("li",{parentName:"ol"},(0,l.yg)("p",{parentName:"li"},"Copy the following snippet into your new file"))),(0,l.yg)("pre",null,(0,l.yg)("code",{parentName:"pre",className:"language-jsx"},"import React from 'react';\nimport ThemeFeedbackDialog from 'gatsby-theme-carbon/src/components/FeedbackDialog/FeedbackDialog';\n\nconst FeedbackDialog = ({ props }) => {\n  const onSubmit = (data) => {\n    console.log({ ...data });\n  };\n\n  return <ThemeFeedbackDialog {...props} onSubmit={onSubmit} />;\n};\n\nexport default FeedbackDialog;\n")),(0,l.yg)("h2",null,"Creating a handler"),(0,l.yg)("p",null,"Next, you’ll need a place to send the data. For the Carbon website, we use a\nserverless function that forwards the data to a\n",(0,l.yg)("a",{parentName:"p",href:"https://www.surveygizmo.com/"},"SurveyGizmo")," quiz. You can see that function\n",(0,l.yg)("a",{parentName:"p",href:"https://github.com/carbon-design-system/carbon-website/blob/master/api/survey.ts"},"here"),"."),(0,l.yg)("p",null,"The handler can send a fetch request off to the endpoint you create. Update the\n",(0,l.yg)("inlineCode",{parentName:"p"},"onSubmit")," handler to send the data wherever you want. This function receives\nthe following arguments:"),(0,l.yg)("ul",null,(0,l.yg)("li",{parentName:"ul"},(0,l.yg)("inlineCode",{parentName:"li"},"experience"),": “Negative”, “Positive” or “Neutral”"),(0,l.yg)("li",{parentName:"ul"},(0,l.yg)("inlineCode",{parentName:"li"},"comment"),": An optional comment"),(0,l.yg)("li",{parentName:"ul"},(0,l.yg)("inlineCode",{parentName:"li"},"path"),": the window location when the survey was submitted")),(0,l.yg)("pre",null,(0,l.yg)("code",{parentName:"pre",className:"language-jsx"},"const FeedbackDialog = ({ props }) => {\n  const onSubmit = data => {\n    fetch(process.env.API_ENDPOINT, {\n      method: 'POST',\n      body: JSON.stringify(data),\n  });\n\n  return <ThemeFeedbackDialog {...props} onSubmit={onSubmit} />;\n};\n")))}p.isMDXComponent=!0},6236:function(e,t,a){a.d(t,{A:function(){return k}});var n=a(6540),l=a(5474),o=a.n(l),r=a(1015),i=a(4698),s=a(5411),c=a(9634),m=a.n(c),d="PageHeader-module--dark-mode--WCeH8",p="PageHeader-module--with-tabs--vbQ-W";var u=e=>{let{title:t,theme:a,tabs:l=[]}=e;return n.createElement("div",{className:m()("PageHeader-module--page-header--NqfPe",{[p]:l.length,[d]:"dark"===a})},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12"},n.createElement("h1",{id:"page-title",className:"PageHeader-module--text--Er2EO"},t)))))};var g=e=>{let{relativePagePath:t,repository:a}=e;const{site:{siteMetadata:{repository:l}}}=(0,r.useStaticQuery)("1364590287"),{baseUrl:o,subDirectory:i,branch:s}=a||l,c=o+"/edit/"+s+i+"/src/pages"+t;return o?n.createElement("div",{className:"bx--row EditLink-module--row--BEmSX"},n.createElement("div",{className:"bx--col"},n.createElement("a",{className:"EditLink-module--link--IDrl1",href:c},"Edit this page on GitHub"))):null},b=a(6526),h=a(5540),y="PageTabs-module--selected-item--aBB0K";let f=function(e){function t(){return e.apply(this,arguments)||this}return(0,h.A)(t,e),t.prototype.render=function(){const{title:e,tabs:t,slug:a}=this.props,l=a.split("/").filter(Boolean).slice(-1)[0],i=t.map((e=>{const t=o()(e,{lower:!0,strict:!0}),i=t===l,s=new RegExp(l+"/?(#.*)?$"),c=a.replace(s,t);return n.createElement("li",{key:e,className:m()({[y]:i},"PageTabs-module--list-item--024o6")},n.createElement(r.Link,{className:"PageTabs-module--link--Kz-7R",to:""+c},e))}));return n.createElement("div",{className:"PageTabs-module--tabs-container--Cdfzw"},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12 bx--col-no-gutter"},n.createElement("nav",{"aria-label":e},n.createElement("ul",{className:"PageTabs-module--list--xLqxG"},i))))))},t}(n.Component);var N=f,v=a(7012),w=a(919),E=a(185);var x=e=>{let{date:t}=e;const a=new Date(t);return t?n.createElement(E.fI,{className:"last-modified-date-module--row--XJoYQ"},n.createElement(E.VP,null,n.createElement("div",{className:"last-modified-date-module--text--ogPQF"},"Page last updated: ",a.toLocaleDateString("en-GB",{day:"2-digit",year:"numeric",month:"long"})))):null};var k=e=>{let{pageContext:t,children:a,location:l,Title:c}=e;const{frontmatter:m={},relativePagePath:d,titleType:p}=t,{tabs:h,title:y,theme:f,description:E,keywords:k,date:P}=m,{interiorTheme:T}=(0,w.A)(),{site:{pathPrefix:D}}=(0,r.useStaticQuery)("2456312558"),C=D?l.pathname.replace(D,""):l.pathname,F=h?C.split("/").filter(Boolean).slice(-1)[0]||o()(h[0],{lower:!0}):"",S=f||T;return n.createElement(s.A,{tabs:h,homepage:!1,theme:S,pageTitle:y,pageDescription:E,pageKeywords:k,titleType:p},n.createElement(u,{title:c?n.createElement(c,null):y,label:"label",tabs:h,theme:S}),h&&n.createElement(N,{title:y,slug:C,tabs:h,currentTab:F}),n.createElement(v.A,{padded:!0},a,n.createElement(g,{relativePagePath:d}),n.createElement(x,{date:P})),n.createElement(b.A,{pageContext:t,location:l,slug:C,tabs:h,currentTab:F}),n.createElement(i.A,null))}}}]);
//# sourceMappingURL=component---src-pages-docs-components-feedback-dialog-mdx-6f347d76cae9218061ba.js.map