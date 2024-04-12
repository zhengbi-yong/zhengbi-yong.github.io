"use strict";(self.webpackChunkexample=self.webpackChunkexample||[]).push([[7220],{6449:function(e,t,a){a.r(t),a.d(t,{_frontmatter:function(){return d},default:function(){return y}});var n=a(45),r=(a(6540),a(8619)),l=a(6236),o=a(3229);const i=["components"],d={},g=e=>function(t){return console.warn("Component "+e+" was not imported, exported, or provided by MDXProvider as global scope"),(0,r.yg)("div",t)},m=g("PageDescription"),s=g("Row"),p=g("SquareCard"),c={_frontmatter:d},u=l.A;function y(e){let{components:t}=e,a=(0,n.A)(e,i);return(0,r.yg)(u,Object.assign({},c,a,{components:t,mdxType:"MDXLayout"}),(0,r.yg)(m,{mdxType:"PageDescription"},(0,r.yg)("p",null,"The ",(0,r.yg)("inlineCode",{parentName:"p"},"<SquareCard>")," component should generally be used inside of a\n",(0,r.yg)("inlineCode",{parentName:"p"},'<Row className="square-card-group">')," component. This allows us to\nproperly space the columns components when they wrap on mobile.")),(0,r.yg)("h2",null,"Example"),(0,r.yg)(s,{className:"square-card-group",mdxType:"Row"},(0,r.yg)(p,{title:"A small sentence can go here in conjunction with a pictogram",href:"/",mdxType:"SquareCard"},(0,r.yg)(o.S0q,{"aria-label":"Tools",className:"my-custom-class",mdxType:"Tools"})),(0,r.yg)(p,{title:"A small sentence can go here with no pictogram",href:"/",helperText:"(Optional text)",mdxType:"SquareCard"}),(0,r.yg)(p,{title:"Short title",href:"/",bodyText:"A short body paragraph describing the card could go here.",mdxType:"SquareCard"}),(0,r.yg)(p,{title:"Small title here",smallTitle:!0,href:"/",bodyText:"A short body paragraph describing the card could go here.",disabled:!0,mdxType:"SquareCard"},(0,r.yg)(o.S0q,{"aria-label":"Tools",className:"my-custom-class",mdxType:"Tools"})),(0,r.yg)(p,{title:"Small title here",smallTitle:!0,href:"/",bodyText:"A short body paragraph describing the card could go here.",helperText:"(Optional text)",disabled:!0,mdxType:"SquareCard"})),(0,r.yg)("h2",null,"Code"),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-mdx",metastring:"path=components/SquareCard/SquareCard.js src=https://github.com/carbon-design-system/gatsby-theme-carbon/tree/main/packages/gatsby-theme-carbon/src/components/SquareCard",path:"components/SquareCard/SquareCard.js",src:"https://github.com/carbon-design-system/gatsby-theme-carbon/tree/main/packages/gatsby-theme-carbon/src/components/SquareCard"},'import { Tools } from \'@carbon/pictograms-react\';\n\n<Row className="square-card-group">\n  <SquareCard\n    title="A small sentence can go here in conjunction with a pictogram"\n    href="/"\n    >\n    <Tools aria-label="Tools" className="my-custom-class" />\n  </SquareCard>\n\n  <SquareCard\n    title="A small sentence can go here with no pictogram"\n    href="/"\n    helperText="(Optional text)"\n    />\n\n  <SquareCard\n    title="Short title"\n    href="/"\n    bodyText="A short body paragraph describing the card could go here."\n    />\n\n  <SquareCard\n    title="Small title here"\n    smallTitle\n    href="/"\n    bodyText="A short body paragraph describing the card could go here."\n    disabled\n    >\n    <Tools aria-label="Tools" className="my-custom-class" />\n  </SquareCard>\n\n  <SquareCard\n    title="Small title here"\n    smallTitle\n    href="/"\n    bodyText="A short body paragraph describing the card could go here."\n    helperText="(Optional text)"\n    disabled\n    />\n</Row>\n')),(0,r.yg)("h3",null,"Props"),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},"property"),(0,r.yg)("th",{parentName:"tr",align:null},"propType"),(0,r.yg)("th",{parentName:"tr",align:null},"required"),(0,r.yg)("th",{parentName:"tr",align:null},"default"),(0,r.yg)("th",{parentName:"tr",align:null},"description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"children"),(0,r.yg)("td",{parentName:"tr",align:null},"node"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Optional pictogram icon to add to bottom left corner cannot be combined with ‘helperText’")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"href"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Set url for card")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"smallTitle"),(0,r.yg)("td",{parentName:"tr",align:null},"bool"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"false")),(0,r.yg)("td",{parentName:"tr",align:null},"Set to true to display smaller title")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"title"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Card title - default is ",(0,r.yg)("inlineCode",{parentName:"td"},"large"))),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"actionIcon"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"ArrowRight")),(0,r.yg)("td",{parentName:"tr",align:null},"Action icon, default is no ‘ArrowRight’, options are ",(0,r.yg)("inlineCode",{parentName:"td"},"Launch"),", ",(0,r.yg)("inlineCode",{parentName:"td"},"ArrowRight"),", ",(0,r.yg)("inlineCode",{parentName:"td"},"Download"),", ",(0,r.yg)("inlineCode",{parentName:"td"},"Disabled"),", ",(0,r.yg)("inlineCode",{parentName:"td"},"Email"))),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"disabled"),(0,r.yg)("td",{parentName:"tr",align:null},"bool"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"false")),(0,r.yg)("td",{parentName:"tr",align:null},"Set for disabled card")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"className"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Add custom class name")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"helperText"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Optional helper text that appears at the bottom left corner cannot be combined with ‘children’ text. This is only meant for a date or a category name")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"bodyText"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},"Optional body text for card description")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},"color"),(0,r.yg)("td",{parentName:"tr",align:null},"string"),(0,r.yg)("td",{parentName:"tr",align:null}),(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"light")),(0,r.yg)("td",{parentName:"tr",align:null},"Set to ",(0,r.yg)("inlineCode",{parentName:"td"},"dark")," for dark background")))))}y.isMDXComponent=!0},6236:function(e,t,a){a.d(t,{A:function(){return S}});var n=a(6540),r=a(5474),l=a.n(r),o=a(1015),i=a(4698),d=a(5411),g=a(9634),m=a.n(g),s="PageHeader-module--dark-mode--WCeH8",p="PageHeader-module--with-tabs--vbQ-W";var c=e=>{let{title:t,theme:a,tabs:r=[]}=e;return n.createElement("div",{className:m()("PageHeader-module--page-header--NqfPe",{[p]:r.length,[s]:"dark"===a})},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12"},n.createElement("h1",{id:"page-title",className:"PageHeader-module--text--Er2EO"},t)))))};var u=e=>{let{relativePagePath:t,repository:a}=e;const{site:{siteMetadata:{repository:r}}}=(0,o.useStaticQuery)("1364590287"),{baseUrl:l,subDirectory:i,branch:d}=a||r,g=l+"/edit/"+d+i+"/src/pages"+t;return l?n.createElement("div",{className:"bx--row EditLink-module--row--BEmSX"},n.createElement("div",{className:"bx--col"},n.createElement("a",{className:"EditLink-module--link--IDrl1",href:g},"Edit this page on GitHub"))):null},y=a(6526),h=a(5540),N="PageTabs-module--selected-item--aBB0K";let b=function(e){function t(){return e.apply(this,arguments)||this}return(0,h.A)(t,e),t.prototype.render=function(){const{title:e,tabs:t,slug:a}=this.props,r=a.split("/").filter(Boolean).slice(-1)[0],i=t.map((e=>{const t=l()(e,{lower:!0,strict:!0}),i=t===r,d=new RegExp(r+"/?(#.*)?$"),g=a.replace(d,t);return n.createElement("li",{key:e,className:m()({[N]:i},"PageTabs-module--list-item--024o6")},n.createElement(o.Link,{className:"PageTabs-module--link--Kz-7R",to:""+g},e))}));return n.createElement("div",{className:"PageTabs-module--tabs-container--Cdfzw"},n.createElement("div",{className:"bx--grid"},n.createElement("div",{className:"bx--row"},n.createElement("div",{className:"bx--col-lg-12 bx--col-no-gutter"},n.createElement("nav",{"aria-label":e},n.createElement("ul",{className:"PageTabs-module--list--xLqxG"},i))))))},t}(n.Component);var T=b,x=a(7012),f=a(919),C=a(185);var E=e=>{let{date:t}=e;const a=new Date(t);return t?n.createElement(C.fI,{className:"last-modified-date-module--row--XJoYQ"},n.createElement(C.VP,null,n.createElement("div",{className:"last-modified-date-module--text--ogPQF"},"Page last updated: ",a.toLocaleDateString("en-GB",{day:"2-digit",year:"numeric",month:"long"})))):null};var S=e=>{let{pageContext:t,children:a,location:r,Title:g}=e;const{frontmatter:m={},relativePagePath:s,titleType:p}=t,{tabs:h,title:N,theme:b,description:C,keywords:S,date:w}=m,{interiorTheme:q}=(0,f.A)(),{site:{pathPrefix:v}}=(0,o.useStaticQuery)("2456312558"),A=v?r.pathname.replace(v,""):r.pathname,P=h?A.split("/").filter(Boolean).slice(-1)[0]||l()(h[0],{lower:!0}):"",k=b||q;return n.createElement(d.A,{tabs:h,homepage:!1,theme:k,pageTitle:N,pageDescription:C,pageKeywords:S,titleType:p},n.createElement(c,{title:g?n.createElement(g,null):N,label:"label",tabs:h,theme:k}),h&&n.createElement(T,{title:N,slug:A,tabs:h,currentTab:P}),n.createElement(x.A,{padded:!0},a,n.createElement(u,{relativePagePath:s}),n.createElement(E,{date:w})),n.createElement(y.A,{pageContext:t,location:r,slug:A,tabs:h,currentTab:P}),n.createElement(i.A,null))}}}]);
//# sourceMappingURL=component---src-pages-components-square-card-mdx-2861678cf21714a3e2ed.js.map