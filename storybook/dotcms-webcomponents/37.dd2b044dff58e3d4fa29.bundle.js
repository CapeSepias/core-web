(window.webpackJsonp=window.webpackJsonp||[]).push([[37],{743:function(module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,"dot_state_icon",(function(){return DotStateIcon}));__webpack_require__(14),__webpack_require__(37),__webpack_require__(25),__webpack_require__(43);var _index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__(138);function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,"value"in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}}var DotStateIcon=function(){function DotStateIcon(hostRef){!function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError("Cannot call a class as a function")}(this,DotStateIcon),Object(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.g)(this,hostRef),this.state=null,this.size="16px",this.labels={archived:"Archived",published:"Published",revision:"Revision",draft:"Draft"}}return function _createClass(Constructor,protoProps,staticProps){return protoProps&&_defineProperties(Constructor.prototype,protoProps),staticProps&&_defineProperties(Constructor,staticProps),Constructor}(DotStateIcon,[{key:"render",value:function render(){var state=this.state?this.getType(this.state):"",name=this.labels[state];return Object(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.e)(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.a,{"aria-label":name,style:{"--size":this.size}},Object(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.e)("span",null,Object(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.e)("div",{class:state,id:"icon"}),Object(_index_92e7b8df_js__WEBPACK_IMPORTED_MODULE_4__.e)("dot-tooltip",{content:name,for:"icon"})))}},{key:"getType",value:function getType(_ref){var live=_ref.live,working=_ref.working,deleted=_ref.deleted,hasLiveVersion=_ref.hasLiveVersion;if(this.isTrue(deleted))return"archived";if("true"===live.toString()){if(this.isTrue(hasLiveVersion)&&this.isTrue(working))return"published"}else if(this.isTrue(hasLiveVersion))return"revision";return"draft"}},{key:"isTrue",value:function isTrue(value){return!!value&&"true"===value.toString()}}]),DotStateIcon}();DotStateIcon.style=':host{--sucess-color:#27b970;position:relative;display:inline-block}div{border-radius:50%;border:solid 2px;box-sizing:border-box;height:var(--size);width:var(--size)}.published,.revision:after{background-color:var(--sucess-color)}.archived,.revision{position:relative}.archived:before,.revision:before{box-sizing:border-box;background-color:currentColor;content:"";height:2px;position:absolute;top:50%;transform:translateY(-50%);width:calc(var(--size) - 2px);z-index:1}.revision{transform:rotate(90deg)}.revision:after{border-bottom-left-radius:var(--size);border-top-left-radius:var(--size);bottom:25%;content:"";height:100%;left:25%;position:absolute;transform:rotate(90deg);width:50%}'}}]);
//# sourceMappingURL=37.dd2b044dff58e3d4fa29.bundle.js.map