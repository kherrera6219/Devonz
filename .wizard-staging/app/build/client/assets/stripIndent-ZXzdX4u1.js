function o(t,...n){if(typeof t!="string"){const i=t.reduce((r,s,p)=>(r+=s+(n[p]??""),r),"");return e(i)}return e(t)}function e(t){return t.split(`
`).map(n=>n.trim()).join(`
`).trimStart().replace(/[\r\n]$/,"")}export{o as s};
