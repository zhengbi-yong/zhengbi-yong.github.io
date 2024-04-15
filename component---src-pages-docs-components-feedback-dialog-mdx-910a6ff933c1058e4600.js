"use strict";(self.webpackChunkexample=self.webpackChunkexample||[]).push([[8394],{595:function(e,n,a){a.r(n),a.d(n,{_frontmatter:function(){return l},default:function(){return g}});var t=a(45),o=(a(6540),a(5680)),i=a(4673);const r=["components"],l={},p=(s="PageDescription",function(e){return console.warn("Component "+s+" was not imported, exported, or provided by MDXProvider as global scope"),(0,o.yg)("div",e)});var s;const c={_frontmatter:l},m=i.A;function g(e){let{components:n}=e,a=(0,t.A)(e,r);return(0,o.yg)(m,Object.assign({},c,a,{components:n,mdxType:"MDXLayout"}),(0,o.yg)(p,{mdxType:"PageDescription"},(0,o.yg)("p",null,"The ",(0,o.yg)("inlineCode",{parentName:"p"},"<FeedbackDialog>")," component is a non-modal dialog that allows your users to\nprovide low-friction, anonymous feedback for a specific page.")),(0,o.yg)("h2",null,"Activating the dialog"),(0,o.yg)("p",null,"The Feedback button only becomes visible once you’ve supplied an ",(0,o.yg)("inlineCode",{parentName:"p"},"onSubmit"),"\nhandler. To do that, we’ll need to shadow the ",(0,o.yg)("inlineCode",{parentName:"p"},"FeedbackDialog")," component."),(0,o.yg)("ol",null,(0,o.yg)("li",{parentName:"ol"},(0,o.yg)("p",{parentName:"li"},"Create a new javascript file under\n",(0,o.yg)("inlineCode",{parentName:"p"},"src/gatsby-theme-carbon/components/FeedbackDialog/FeedbackDialog.js"),".\nMatching the filepath exactly is important here.")),(0,o.yg)("li",{parentName:"ol"},(0,o.yg)("p",{parentName:"li"},"Copy the following snippet into your new file"))),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-jsx"},"import React from 'react';\nimport ThemeFeedbackDialog from 'gatsby-theme-carbon/src/components/FeedbackDialog/FeedbackDialog';\n\nconst FeedbackDialog = ({ props }) => {\n  const onSubmit = (data) => {\n    console.log({ ...data });\n  };\n\n  return <ThemeFeedbackDialog {...props} onSubmit={onSubmit} />;\n};\n\nexport default FeedbackDialog;\n")),(0,o.yg)("h2",null,"Creating a handler"),(0,o.yg)("p",null,"Next, you’ll need a place to send the data. For the Carbon website, we use a\nserverless function that forwards the data to a\n",(0,o.yg)("a",{parentName:"p",href:"https://www.surveygizmo.com/"},"SurveyGizmo")," quiz. You can see that function\n",(0,o.yg)("a",{parentName:"p",href:"https://github.com/carbon-design-system/carbon-website/blob/master/api/survey.ts"},"here"),"."),(0,o.yg)("p",null,"The handler can send a fetch request off to the endpoint you create. Update the\n",(0,o.yg)("inlineCode",{parentName:"p"},"onSubmit")," handler to send the data wherever you want. This function receives\nthe following arguments:"),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},(0,o.yg)("inlineCode",{parentName:"li"},"experience"),": “Negative”, “Positive” or “Neutral”"),(0,o.yg)("li",{parentName:"ul"},(0,o.yg)("inlineCode",{parentName:"li"},"comment"),": An optional comment"),(0,o.yg)("li",{parentName:"ul"},(0,o.yg)("inlineCode",{parentName:"li"},"path"),": the window location when the survey was submitted")),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-jsx"},"const FeedbackDialog = ({ props }) => {\n  const onSubmit = data => {\n    fetch(process.env.API_ENDPOINT, {\n      method: 'POST',\n      body: JSON.stringify(data),\n  });\n\n  return <ThemeFeedbackDialog {...props} onSubmit={onSubmit} />;\n};\n")))}g.isMDXComponent=!0}}]);
//# sourceMappingURL=component---src-pages-docs-components-feedback-dialog-mdx-910a6ff933c1058e4600.js.map