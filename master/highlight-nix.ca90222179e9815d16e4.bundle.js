(window.webpackJsonp=window.webpackJsonp||[]).push([[86],{1783:function(module,exports){module.exports=function nix(hljs){const NIX_KEYWORDS={keyword:"rec with let in inherit assert if else then",literal:"true false or and null",built_in:"import abort baseNameOf dirOf isNull builtins map removeAttrs throw toString derivation"},ANTIQUOTE={className:"subst",begin:/\$\{/,end:/\}/,keywords:NIX_KEYWORDS},STRING={className:"string",contains:[ANTIQUOTE],variants:[{begin:"''",end:"''"},{begin:'"',end:'"'}]},EXPRESSIONS=[hljs.NUMBER_MODE,hljs.HASH_COMMENT_MODE,hljs.C_BLOCK_COMMENT_MODE,STRING,{begin:/[a-zA-Z0-9-_]+(\s*=)/,returnBegin:!0,relevance:0,contains:[{className:"attr",begin:/\S+/}]}];return ANTIQUOTE.contains=EXPRESSIONS,{name:"Nix",aliases:["nixos"],keywords:NIX_KEYWORDS,contains:EXPRESSIONS}}}}]);
//# sourceMappingURL=highlight-nix.ca90222179e9815d16e4.bundle.js.map