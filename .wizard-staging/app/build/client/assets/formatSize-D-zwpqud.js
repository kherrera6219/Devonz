function o(i){const n=["B","KB","MB","GB","TB"];let t=i,e=0;for(;t>=1024&&e<n.length-1;)t/=1024,e++;return`${t.toFixed(1)} ${n[e]}`}export{o as f};
