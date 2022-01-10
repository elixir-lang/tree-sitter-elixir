var Module = typeof Module !== "undefined" ? Module : {};

var TreeSitter = function() {
 var initPromise;
 var document = typeof window == "object" ? {
  currentScript: window.document.currentScript
 } : null;
 class Parser {
  constructor() {
   this.initialize();
  }
  initialize() {
   throw new Error("cannot construct a Parser before calling `init()`");
  }
  static init(moduleOptions) {
   if (initPromise) return initPromise;
   Module = Object.assign({}, Module, moduleOptions);
   return initPromise = new Promise(resolveInitPromise => {
    var moduleOverrides = {};
    var key;
    for (key in Module) {
     if (Module.hasOwnProperty(key)) {
      moduleOverrides[key] = Module[key];
     }
    }
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = function(status, toThrow) {
     throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = typeof window === "object";
    var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
    var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    if (Module["ENVIRONMENT"]) {
     throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)");
    }
    var scriptDirectory = "";
    function locateFile(path) {
     if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
     }
     return scriptDirectory + path;
    }
    var read_, readAsync, readBinary, setWindowTitle;
    var nodeFS;
    var nodePath;
    if (ENVIRONMENT_IS_NODE) {
     if (!(typeof process === "object" && typeof require === "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
     if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = require("path").dirname(scriptDirectory) + "/";
     } else {
      scriptDirectory = __dirname + "/";
     }
     read_ = function shell_read(filename, binary) {
      if (!nodeFS) nodeFS = require("fs");
      if (!nodePath) nodePath = require("path");
      filename = nodePath["normalize"](filename);
      return nodeFS["readFileSync"](filename, binary ? null : "utf8");
     };
     readBinary = function readBinary(filename) {
      var ret = read_(filename, true);
      if (!ret.buffer) {
       ret = new Uint8Array(ret);
      }
      assert(ret.buffer);
      return ret;
     };
     readAsync = function readAsync(filename, onload, onerror) {
      if (!nodeFS) nodeFS = require("fs");
      if (!nodePath) nodePath = require("path");
      filename = nodePath["normalize"](filename);
      nodeFS["readFile"](filename, function(err, data) {
       if (err) onerror(err); else onload(data.buffer);
      });
     };
     if (process["argv"].length > 1) {
      thisProgram = process["argv"][1].replace(/\\/g, "/");
     }
     arguments_ = process["argv"].slice(2);
     if (typeof module !== "undefined") {
      module["exports"] = Module;
     }
     quit_ = function(status, toThrow) {
      if (keepRuntimeAlive()) {
       process["exitCode"] = status;
       throw toThrow;
      }
      process["exit"](status);
     };
     Module["inspect"] = function() {
      return "[Emscripten Module object]";
     };
    } else if (ENVIRONMENT_IS_SHELL) {
     if (typeof process === "object" && typeof require === "function" || typeof window === "object" || typeof importScripts === "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
     if (typeof read != "undefined") {
      read_ = function shell_read(f) {
       return read(f);
      };
     }
     readBinary = function readBinary(f) {
      var data;
      if (typeof readbuffer === "function") {
       return new Uint8Array(readbuffer(f));
      }
      data = read(f, "binary");
      assert(typeof data === "object");
      return data;
     };
     readAsync = function readAsync(f, onload, onerror) {
      setTimeout(function() {
       onload(readBinary(f));
      }, 0);
     };
     if (typeof scriptArgs != "undefined") {
      arguments_ = scriptArgs;
     } else if (typeof arguments != "undefined") {
      arguments_ = arguments;
     }
     if (typeof quit === "function") {
      quit_ = function(status) {
       quit(status);
      };
     }
     if (typeof print !== "undefined") {
      if (typeof console === "undefined") console = {};
      console.log = print;
      console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
     }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
     if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = self.location.href;
     } else if (typeof document !== "undefined" && document.currentScript) {
      scriptDirectory = document.currentScript.src;
     }
     if (scriptDirectory.indexOf("blob:") !== 0) {
      scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
     } else {
      scriptDirectory = "";
     }
     if (!(typeof window === "object" || typeof importScripts === "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
     {
      read_ = function(url) {
       var xhr = new XMLHttpRequest();
       xhr.open("GET", url, false);
       xhr.send(null);
       return xhr.responseText;
      };
      if (ENVIRONMENT_IS_WORKER) {
       readBinary = function(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
       };
      }
      readAsync = function(url, onload, onerror) {
       var xhr = new XMLHttpRequest();
       xhr.open("GET", url, true);
       xhr.responseType = "arraybuffer";
       xhr.onload = function() {
        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
         onload(xhr.response);
         return;
        }
        onerror();
       };
       xhr.onerror = onerror;
       xhr.send(null);
      };
     }
     setWindowTitle = function(title) {
      document.title = title;
     };
    } else {
     throw new Error("environment detection error");
    }
    var out = Module["print"] || console.log.bind(console);
    var err = Module["printErr"] || console.warn.bind(console);
    for (key in moduleOverrides) {
     if (moduleOverrides.hasOwnProperty(key)) {
      Module[key] = moduleOverrides[key];
     }
    }
    moduleOverrides = null;
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (!Object.getOwnPropertyDescriptor(Module, "arguments")) {
     Object.defineProperty(Module, "arguments", {
      configurable: true,
      get: function() {
       abort("Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (!Object.getOwnPropertyDescriptor(Module, "thisProgram")) {
     Object.defineProperty(Module, "thisProgram", {
      configurable: true,
      get: function() {
       abort("Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (Module["quit"]) quit_ = Module["quit"];
    if (!Object.getOwnPropertyDescriptor(Module, "quit")) {
     Object.defineProperty(Module, "quit", {
      configurable: true,
      get: function() {
       abort("Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["read"] === "undefined", "Module.read option was removed (modify read_ in JS)");
    assert(typeof Module["readAsync"] === "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
    assert(typeof Module["readBinary"] === "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
    assert(typeof Module["setWindowTitle"] === "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");
    assert(typeof Module["TOTAL_MEMORY"] === "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
    if (!Object.getOwnPropertyDescriptor(Module, "read")) {
     Object.defineProperty(Module, "read", {
      configurable: true,
      get: function() {
       abort("Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (!Object.getOwnPropertyDescriptor(Module, "readAsync")) {
     Object.defineProperty(Module, "readAsync", {
      configurable: true,
      get: function() {
       abort("Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (!Object.getOwnPropertyDescriptor(Module, "readBinary")) {
     Object.defineProperty(Module, "readBinary", {
      configurable: true,
      get: function() {
       abort("Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (!Object.getOwnPropertyDescriptor(Module, "setWindowTitle")) {
     Object.defineProperty(Module, "setWindowTitle", {
      configurable: true,
      get: function() {
       abort("Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";
    var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";
    var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";
    var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";
    assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-s ENVIRONMENT` to enable.");
    var STACK_ALIGN = 16;
    function getNativeTypeSize(type) {
     switch (type) {
     case "i1":
     case "i8":
      return 1;

     case "i16":
      return 2;

     case "i32":
      return 4;

     case "i64":
      return 8;

     case "float":
      return 4;

     case "double":
      return 8;

     default:
      {
       if (type[type.length - 1] === "*") {
        return 4;
       } else if (type[0] === "i") {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
        return bits / 8;
       } else {
        return 0;
       }
      }
     }
    }
    function warnOnce(text) {
     if (!warnOnce.shown) warnOnce.shown = {};
     if (!warnOnce.shown[text]) {
      warnOnce.shown[text] = 1;
      err(text);
     }
    }
    function convertJsFunctionToWasm(func, sig) {
     if (typeof WebAssembly.Function === "function") {
      var typeNames = {
       "i": "i32",
       "j": "i64",
       "f": "f32",
       "d": "f64"
      };
      var type = {
       parameters: [],
       results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
      };
      for (var i = 1; i < sig.length; ++i) {
       type.parameters.push(typeNames[sig[i]]);
      }
      return new WebAssembly.Function(type, func);
     }
     var typeSection = [ 1, 0, 1, 96 ];
     var sigRet = sig.slice(0, 1);
     var sigParam = sig.slice(1);
     var typeCodes = {
      "i": 127,
      "j": 126,
      "f": 125,
      "d": 124
     };
     typeSection.push(sigParam.length);
     for (var i = 0; i < sigParam.length; ++i) {
      typeSection.push(typeCodes[sigParam[i]]);
     }
     if (sigRet == "v") {
      typeSection.push(0);
     } else {
      typeSection = typeSection.concat([ 1, typeCodes[sigRet] ]);
     }
     typeSection[1] = typeSection.length - 2;
     var bytes = new Uint8Array([ 0, 97, 115, 109, 1, 0, 0, 0 ].concat(typeSection, [ 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0 ]));
     var module = new WebAssembly.Module(bytes);
     var instance = new WebAssembly.Instance(module, {
      "e": {
       "f": func
      }
     });
     var wrappedFunc = instance.exports["f"];
     return wrappedFunc;
    }
    var freeTableIndexes = [];
    var functionsInTableMap;
    function getEmptyTableSlot() {
     if (freeTableIndexes.length) {
      return freeTableIndexes.pop();
     }
     try {
      wasmTable.grow(1);
     } catch (err) {
      if (!(err instanceof RangeError)) {
       throw err;
      }
      throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
     }
     return wasmTable.length - 1;
    }
    function addFunctionWasm(func, sig) {
     if (!functionsInTableMap) {
      functionsInTableMap = new WeakMap();
      for (var i = 0; i < wasmTable.length; i++) {
       var item = wasmTable.get(i);
       if (item) {
        functionsInTableMap.set(item, i);
       }
      }
     }
     if (functionsInTableMap.has(func)) {
      return functionsInTableMap.get(func);
     }
     var ret = getEmptyTableSlot();
     try {
      wasmTable.set(ret, func);
     } catch (err) {
      if (!(err instanceof TypeError)) {
       throw err;
      }
      assert(typeof sig !== "undefined", "Missing signature argument to addFunction: " + func);
      var wrapped = convertJsFunctionToWasm(func, sig);
      wasmTable.set(ret, wrapped);
     }
     functionsInTableMap.set(func, ret);
     return ret;
    }
    function removeFunction(index) {
     functionsInTableMap.delete(wasmTable.get(index));
     freeTableIndexes.push(index);
    }
    function addFunction(func, sig) {
     assert(typeof func !== "undefined");
     return addFunctionWasm(func, sig);
    }
    var tempRet0 = 0;
    var setTempRet0 = function(value) {
     tempRet0 = value;
    };
    var getTempRet0 = function() {
     return tempRet0;
    };
    var dynamicLibraries = Module["dynamicLibraries"] || [];
    var wasmBinary;
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    if (!Object.getOwnPropertyDescriptor(Module, "wasmBinary")) {
     Object.defineProperty(Module, "wasmBinary", {
      configurable: true,
      get: function() {
       abort("Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    var noExitRuntime = Module["noExitRuntime"] || true;
    if (!Object.getOwnPropertyDescriptor(Module, "noExitRuntime")) {
     Object.defineProperty(Module, "noExitRuntime", {
      configurable: true,
      get: function() {
       abort("Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    if (typeof WebAssembly !== "object") {
     abort("no native wasm support detected");
    }
    function setValue(ptr, value, type, noSafe) {
     type = type || "i8";
     if (type.charAt(type.length - 1) === "*") type = "i32";
     if (noSafe) {
      switch (type) {
      case "i1":
       HEAP8[ptr >> 0] = value;
       break;

      case "i8":
       HEAP8[ptr >> 0] = value;
       break;

      case "i16":
       HEAP16[ptr >> 1] = value;
       break;

      case "i32":
       HEAP32[ptr >> 2] = value;
       break;

      case "i64":
       tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
       HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
       break;

      case "float":
       HEAPF32[ptr >> 2] = value;
       break;

      case "double":
       HEAPF64[ptr >> 3] = value;
       break;

      default:
       abort("invalid type for setValue: " + type);
      }
     } else {
      switch (type) {
      case "i1":
       SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
       break;

      case "i8":
       SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
       break;

      case "i16":
       SAFE_HEAP_STORE(ptr | 0, value | 0, 2);
       break;

      case "i32":
       SAFE_HEAP_STORE(ptr | 0, value | 0, 4);
       break;

      case "i64":
       tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
       SAFE_HEAP_STORE(ptr | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(ptr + 4 | 0, tempI64[1] | 0, 4);
       break;

      case "float":
       SAFE_HEAP_STORE_D(ptr | 0, Math.fround(value), 4);
       break;

      case "double":
       SAFE_HEAP_STORE_D(ptr | 0, +value, 8);
       break;

      default:
       abort("invalid type for setValue: " + type);
      }
     }
    }
    function getValue(ptr, type, noSafe) {
     type = type || "i8";
     if (type.charAt(type.length - 1) === "*") type = "i32";
     if (noSafe) {
      switch (type) {
      case "i1":
       return HEAP8[ptr >> 0];

      case "i8":
       return HEAP8[ptr >> 0];

      case "i16":
       return HEAP16[ptr >> 1];

      case "i32":
       return HEAP32[ptr >> 2];

      case "i64":
       return HEAP32[ptr >> 2];

      case "float":
       return HEAPF32[ptr >> 2];

      case "double":
       return HEAPF64[ptr >> 3];

      default:
       abort("invalid type for getValue: " + type);
      }
     } else {
      switch (type) {
      case "i1":
       return SAFE_HEAP_LOAD(ptr | 0, 1, 0) | 0;

      case "i8":
       return SAFE_HEAP_LOAD(ptr | 0, 1, 0) | 0;

      case "i16":
       return SAFE_HEAP_LOAD(ptr | 0, 2, 0) | 0;

      case "i32":
       return SAFE_HEAP_LOAD(ptr | 0, 4, 0) | 0;

      case "i64":
       return SAFE_HEAP_LOAD(ptr | 0, 8, 0) | 0;

      case "float":
       return Math.fround(SAFE_HEAP_LOAD_D(ptr | 0, 4, 0));

      case "double":
       return +SAFE_HEAP_LOAD_D(ptr | 0, 8, 0);

      default:
       abort("invalid type for getValue: " + type);
      }
     }
     return null;
    }
    function getSafeHeapType(bytes, isFloat) {
     switch (bytes) {
     case 1:
      return "i8";

     case 2:
      return "i16";

     case 4:
      return isFloat ? "float" : "i32";

     case 8:
      return "double";

     default:
      assert(0);
     }
    }
    function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
     if (dest <= 0) abort("segmentation fault storing " + bytes + " bytes to address " + dest);
     if (dest % bytes !== 0) abort("alignment error storing to address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
     if (runtimeInitialized) {
      var brk = _sbrk() >>> 0;
      if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when storing " + bytes + " bytes to address " + dest + ". DYNAMICTOP=" + brk);
      assert(brk >= _emscripten_stack_get_base());
      assert(brk <= HEAP8.length);
     }
     setValue(dest, value, getSafeHeapType(bytes, isFloat), 1);
     return value;
    }
    function SAFE_HEAP_STORE_D(dest, value, bytes) {
     return SAFE_HEAP_STORE(dest, value, bytes, true);
    }
    function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
     if (dest <= 0) abort("segmentation fault loading " + bytes + " bytes from address " + dest);
     if (dest % bytes !== 0) abort("alignment error loading from address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
     if (runtimeInitialized) {
      var brk = _sbrk() >>> 0;
      if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when loading " + bytes + " bytes from address " + dest + ". DYNAMICTOP=" + brk);
      assert(brk >= _emscripten_stack_get_base());
      assert(brk <= HEAP8.length);
     }
     var type = getSafeHeapType(bytes, isFloat);
     var ret = getValue(dest, type, 1);
     if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
     return ret;
    }
    function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
     return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
    }
    function SAFE_FT_MASK(value, mask) {
     var ret = value & mask;
     if (ret !== value) {
      abort("Function table mask error: function pointer is " + value + " which is masked by " + mask + ", the likely cause of this is that the function pointer is being called by the wrong type.");
     }
     return ret;
    }
    function segfault() {
     abort("segmentation fault");
    }
    function alignfault() {
     abort("alignment fault");
    }
    function ftfault() {
     abort("Function table mask error");
    }
    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;
    function assert(condition, text) {
     if (!condition) {
      abort("Assertion failed: " + text);
     }
    }
    function getCFunc(ident) {
     var func = Module["_" + ident];
     assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
     return func;
    }
    function ccall(ident, returnType, argTypes, args, opts) {
     var toC = {
      "string": function(str) {
       var ret = 0;
       if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
       }
       return ret;
      },
      "array": function(arr) {
       var ret = stackAlloc(arr.length);
       writeArrayToMemory(arr, ret);
       return ret;
      }
     };
     function convertReturnValue(ret) {
      if (returnType === "string") return UTF8ToString(ret);
      if (returnType === "boolean") return Boolean(ret);
      return ret;
     }
     var func = getCFunc(ident);
     var cArgs = [];
     var stack = 0;
     assert(returnType !== "array", 'Return type should not be "array".');
     if (args) {
      for (var i = 0; i < args.length; i++) {
       var converter = toC[argTypes[i]];
       if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
       } else {
        cArgs[i] = args[i];
       }
      }
     }
     var ret = func.apply(null, cArgs);
     function onDone(ret) {
      if (stack !== 0) stackRestore(stack);
      return convertReturnValue(ret);
     }
     ret = onDone(ret);
     return ret;
    }
    function cwrap(ident, returnType, argTypes, opts) {
     return function() {
      return ccall(ident, returnType, argTypes, arguments, opts);
     };
    }
    var ALLOC_NORMAL = 0;
    var ALLOC_STACK = 1;
    function allocate(slab, allocator) {
     var ret;
     assert(typeof allocator === "number", "allocate no longer takes a type argument");
     assert(typeof slab !== "number", "allocate no longer takes a number as arg0");
     if (allocator == ALLOC_STACK) {
      ret = stackAlloc(slab.length);
     } else {
      ret = _malloc(slab.length);
     }
     if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
     } else {
      HEAPU8.set(new Uint8Array(slab), ret);
     }
     return ret;
    }
    var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
     var endIdx = idx + maxBytesToRead;
     var endPtr = idx;
     while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
     if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(heap.subarray(idx, endPtr));
     } else {
      var str = "";
      while (idx < endPtr) {
       var u0 = heap[idx++];
       if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
       }
       var u1 = heap[idx++] & 63;
       if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
       }
       var u2 = heap[idx++] & 63;
       if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
       } else {
        if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
       }
       if (u0 < 65536) {
        str += String.fromCharCode(u0);
       } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
       }
      }
     }
     return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
     return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }
    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
     if (!(maxBytesToWrite > 0)) return 0;
     var startIdx = outIdx;
     var endIdx = outIdx + maxBytesToWrite - 1;
     for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) {
       var u1 = str.charCodeAt(++i);
       u = 65536 + ((u & 1023) << 10) | u1 & 1023;
      }
      if (u <= 127) {
       if (outIdx >= endIdx) break;
       heap[outIdx++] = u;
      } else if (u <= 2047) {
       if (outIdx + 1 >= endIdx) break;
       heap[outIdx++] = 192 | u >> 6;
       heap[outIdx++] = 128 | u & 63;
      } else if (u <= 65535) {
       if (outIdx + 2 >= endIdx) break;
       heap[outIdx++] = 224 | u >> 12;
       heap[outIdx++] = 128 | u >> 6 & 63;
       heap[outIdx++] = 128 | u & 63;
      } else {
       if (outIdx + 3 >= endIdx) break;
       if (u >= 2097152) warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x1FFFFF).");
       heap[outIdx++] = 240 | u >> 18;
       heap[outIdx++] = 128 | u >> 12 & 63;
       heap[outIdx++] = 128 | u >> 6 & 63;
       heap[outIdx++] = 128 | u & 63;
      }
     }
     heap[outIdx] = 0;
     return outIdx - startIdx;
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
     assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
     return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    function lengthBytesUTF8(str) {
     var len = 0;
     for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
      if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
     }
     return len;
    }
    function AsciiToString(ptr) {
     var str = "";
     while (1) {
      var ch = SAFE_HEAP_LOAD(ptr++ | 0, 1, 1) >>> 0;
      if (!ch) return str;
      str += String.fromCharCode(ch);
     }
    }
    function stringToAscii(str, outPtr) {
     return writeAsciiToMemory(str, outPtr, false);
    }
    var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
    function UTF16ToString(ptr, maxBytesToRead) {
     assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
     var endPtr = ptr;
     var idx = endPtr >> 1;
     var maxIdx = idx + maxBytesToRead / 2;
     while (!(idx >= maxIdx) && SAFE_HEAP_LOAD(idx * 2, 2, 1)) ++idx;
     endPtr = idx << 1;
     if (endPtr - ptr > 32 && UTF16Decoder) {
      return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
     } else {
      var str = "";
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
       var codeUnit = SAFE_HEAP_LOAD(ptr + i * 2 | 0, 2, 0) | 0;
       if (codeUnit == 0) break;
       str += String.fromCharCode(codeUnit);
      }
      return str;
     }
    }
    function stringToUTF16(str, outPtr, maxBytesToWrite) {
     assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
     assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
     if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 2147483647;
     }
     if (maxBytesToWrite < 2) return 0;
     maxBytesToWrite -= 2;
     var startPtr = outPtr;
     var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
     for (var i = 0; i < numCharsToWrite; ++i) {
      var codeUnit = str.charCodeAt(i);
      SAFE_HEAP_STORE(outPtr | 0, codeUnit | 0, 2);
      outPtr += 2;
     }
     SAFE_HEAP_STORE(outPtr | 0, 0 | 0, 2);
     return outPtr - startPtr;
    }
    function lengthBytesUTF16(str) {
     return str.length * 2;
    }
    function UTF32ToString(ptr, maxBytesToRead) {
     assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
     var i = 0;
     var str = "";
     while (!(i >= maxBytesToRead / 4)) {
      var utf32 = SAFE_HEAP_LOAD(ptr + i * 4 | 0, 4, 0) | 0;
      if (utf32 == 0) break;
      ++i;
      if (utf32 >= 65536) {
       var ch = utf32 - 65536;
       str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      } else {
       str += String.fromCharCode(utf32);
      }
     }
     return str;
    }
    function stringToUTF32(str, outPtr, maxBytesToWrite) {
     assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
     assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
     if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 2147483647;
     }
     if (maxBytesToWrite < 4) return 0;
     var startPtr = outPtr;
     var endPtr = startPtr + maxBytesToWrite - 4;
     for (var i = 0; i < str.length; ++i) {
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 55296 && codeUnit <= 57343) {
       var trailSurrogate = str.charCodeAt(++i);
       codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
      }
      SAFE_HEAP_STORE(outPtr | 0, codeUnit | 0, 4);
      outPtr += 4;
      if (outPtr + 4 > endPtr) break;
     }
     SAFE_HEAP_STORE(outPtr | 0, 0 | 0, 4);
     return outPtr - startPtr;
    }
    function lengthBytesUTF32(str) {
     var len = 0;
     for (var i = 0; i < str.length; ++i) {
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
      len += 4;
     }
     return len;
    }
    function allocateUTF8(str) {
     var size = lengthBytesUTF8(str) + 1;
     var ret = _malloc(size);
     if (ret) stringToUTF8Array(str, HEAP8, ret, size);
     return ret;
    }
    function allocateUTF8OnStack(str) {
     var size = lengthBytesUTF8(str) + 1;
     var ret = stackAlloc(size);
     stringToUTF8Array(str, HEAP8, ret, size);
     return ret;
    }
    function writeStringToMemory(string, buffer, dontAddNull) {
     warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
     var lastChar, end;
     if (dontAddNull) {
      end = buffer + lengthBytesUTF8(string);
      lastChar = SAFE_HEAP_LOAD(end, 1, 0);
     }
     stringToUTF8(string, buffer, Infinity);
     if (dontAddNull) SAFE_HEAP_STORE(end, lastChar, 1);
    }
    function writeArrayToMemory(array, buffer) {
     assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
     HEAP8.set(array, buffer);
    }
    function writeAsciiToMemory(str, buffer, dontAddNull) {
     for (var i = 0; i < str.length; ++i) {
      assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
      SAFE_HEAP_STORE(buffer++ | 0, str.charCodeAt(i) | 0, 1);
     }
     if (!dontAddNull) SAFE_HEAP_STORE(buffer | 0, 0 | 0, 1);
    }
    function alignUp(x, multiple) {
     if (x % multiple > 0) {
      x += multiple - x % multiple;
     }
     return x;
    }
    var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateGlobalBufferAndViews(buf) {
     buffer = buf;
     Module["HEAP8"] = HEAP8 = new Int8Array(buf);
     Module["HEAP16"] = HEAP16 = new Int16Array(buf);
     Module["HEAP32"] = HEAP32 = new Int32Array(buf);
     Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
     Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
     Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
     Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
     Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }
    var TOTAL_STACK = 5242880;
    if (Module["TOTAL_STACK"]) assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");
    var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
    if (!Object.getOwnPropertyDescriptor(Module, "INITIAL_MEMORY")) {
     Object.defineProperty(Module, "INITIAL_MEMORY", {
      configurable: true,
      get: function() {
       abort("Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
      }
     });
    }
    assert(INITIAL_MEMORY >= TOTAL_STACK, "INITIAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
    assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, "JS engine does not provide full typed array support");
    if (Module["wasmMemory"]) {
     wasmMemory = Module["wasmMemory"];
    } else {
     wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      "maximum": 2147483648 / 65536
     });
    }
    if (wasmMemory) {
     buffer = wasmMemory.buffer;
    }
    INITIAL_MEMORY = buffer.byteLength;
    assert(INITIAL_MEMORY % 65536 === 0);
    updateGlobalBufferAndViews(buffer);
    var wasmTable = new WebAssembly.Table({
     "initial": 21,
     "element": "anyfunc"
    });
    function writeStackCookie() {
     var max = _emscripten_stack_get_end();
     assert((max & 3) == 0);
     SAFE_HEAP_STORE(((max >> 2) + 1) * 4, 34821223, 4);
     SAFE_HEAP_STORE(((max >> 2) + 2) * 4, 2310721022, 4);
    }
    function checkStackCookie() {
     if (ABORT) return;
     var max = _emscripten_stack_get_end();
     var cookie1 = SAFE_HEAP_LOAD(((max >> 2) + 1) * 4, 4, 1);
     var cookie2 = SAFE_HEAP_LOAD(((max >> 2) + 2) * 4, 4, 1);
     if (cookie1 != 34821223 || cookie2 != 2310721022) {
      abort("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x" + cookie2.toString(16) + " " + cookie1.toString(16));
     }
    }
    (function() {
     var h16 = new Int16Array(1);
     var h8 = new Int8Array(h16.buffer);
     h16[0] = 25459;
     if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -s SUPPORT_BIG_ENDIAN=1 to bypass)";
    })();
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATEXIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;
    var runtimeKeepaliveCounter = 0;
    function keepRuntimeAlive() {
     return noExitRuntime || runtimeKeepaliveCounter > 0;
    }
    function preRun() {
     if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
      while (Module["preRun"].length) {
       addOnPreRun(Module["preRun"].shift());
      }
     }
     callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
     checkStackCookie();
     assert(!runtimeInitialized);
     runtimeInitialized = true;
     callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
     checkStackCookie();
     callRuntimeCallbacks(__ATMAIN__);
    }
    function exitRuntime() {
     checkStackCookie();
     runtimeExited = true;
    }
    function postRun() {
     checkStackCookie();
     if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
      while (Module["postRun"].length) {
       addOnPostRun(Module["postRun"].shift());
      }
     }
     callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
     __ATPRERUN__.unshift(cb);
    }
    function addOnInit(cb) {
     __ATINIT__.unshift(cb);
    }
    function addOnPreMain(cb) {
     __ATMAIN__.unshift(cb);
    }
    function addOnExit(cb) {}
    function addOnPostRun(cb) {
     __ATPOSTRUN__.unshift(cb);
    }
    assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    var runDependencyTracking = {};
    function getUniqueRunDependency(id) {
     var orig = id;
     while (1) {
      if (!runDependencyTracking[id]) return id;
      id = orig + Math.random();
     }
    }
    function addRunDependency(id) {
     runDependencies++;
     if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies);
     }
     if (id) {
      assert(!runDependencyTracking[id]);
      runDependencyTracking[id] = 1;
      if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
       runDependencyWatcher = setInterval(function() {
        if (ABORT) {
         clearInterval(runDependencyWatcher);
         runDependencyWatcher = null;
         return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
         if (!shown) {
          shown = true;
          err("still waiting on run dependencies:");
         }
         err("dependency: " + dep);
        }
        if (shown) {
         err("(end of list)");
        }
       }, 1e4);
      }
     } else {
      err("warning: run dependency added without ID");
     }
    }
    function removeRunDependency(id) {
     runDependencies--;
     if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies);
     }
     if (id) {
      assert(runDependencyTracking[id]);
      delete runDependencyTracking[id];
     } else {
      err("warning: run dependency removed without ID");
     }
     if (runDependencies == 0) {
      if (runDependencyWatcher !== null) {
       clearInterval(runDependencyWatcher);
       runDependencyWatcher = null;
      }
      if (dependenciesFulfilled) {
       var callback = dependenciesFulfilled;
       dependenciesFulfilled = null;
       callback();
      }
     }
    }
    Module["preloadedImages"] = {};
    Module["preloadedAudios"] = {};
    Module["preloadedWasm"] = {};
    function abort(what) {
     if (Module["onAbort"]) {
      Module["onAbort"](what);
     }
     what += "";
     err(what);
     ABORT = true;
     EXITSTATUS = 1;
     var output = "abort(" + what + ") at " + stackTrace();
     what = output;
     var e = new WebAssembly.RuntimeError(what);
     throw e;
    }
    var FS = {
     error: function() {
      abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1");
     },
     init: function() {
      FS.error();
     },
     createDataFile: function() {
      FS.error();
     },
     createPreloadedFile: function() {
      FS.error();
     },
     createLazyFile: function() {
      FS.error();
     },
     open: function() {
      FS.error();
     },
     mkdev: function() {
      FS.error();
     },
     registerDevice: function() {
      FS.error();
     },
     analyzePath: function() {
      FS.error();
     },
     loadFilesFromDB: function() {
      FS.error();
     },
     ErrnoError: function ErrnoError() {
      FS.error();
     }
    };
    Module["FS_createDataFile"] = FS.createDataFile;
    Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
     return filename.startsWith(dataURIPrefix);
    }
    function isFileURI(filename) {
     return filename.startsWith("file://");
    }
    function createExportWrapper(name, fixedasm) {
     return function() {
      var displayName = name;
      var asm = fixedasm;
      if (!fixedasm) {
       asm = Module["asm"];
      }
      assert(runtimeInitialized, "native function `" + displayName + "` called before runtime initialization");
      assert(!runtimeExited, "native function `" + displayName + "` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
      if (!asm[name]) {
       assert(asm[name], "exported native function `" + displayName + "` not found");
      }
      return asm[name].apply(null, arguments);
     };
    }
    var wasmBinaryFile;
    wasmBinaryFile = "tree-sitter.wasm";
    if (!isDataURI(wasmBinaryFile)) {
     wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary(file) {
     try {
      if (file == wasmBinaryFile && wasmBinary) {
       return new Uint8Array(wasmBinary);
      }
      if (readBinary) {
       return readBinary(file);
      } else {
       throw "both async and sync fetching of the wasm failed";
      }
     } catch (err) {
      abort(err);
     }
    }
    function getBinaryPromise() {
     if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
      if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
       return fetch(wasmBinaryFile, {
        credentials: "same-origin"
       }).then(function(response) {
        if (!response["ok"]) {
         throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response["arrayBuffer"]();
       }).catch(function() {
        return getBinary(wasmBinaryFile);
       });
      } else {
       if (readAsync) {
        return new Promise(function(resolve, reject) {
         readAsync(wasmBinaryFile, function(response) {
          resolve(new Uint8Array(response));
         }, reject);
        });
       }
      }
     }
     return Promise.resolve().then(function() {
      return getBinary(wasmBinaryFile);
     });
    }
    function createWasm() {
     var info = {
      "env": asmLibraryArg,
      "wasi_snapshot_preview1": asmLibraryArg,
      "GOT.mem": new Proxy(asmLibraryArg, GOTHandler),
      "GOT.func": new Proxy(asmLibraryArg, GOTHandler)
     };
     function receiveInstance(instance, module) {
      var exports = instance.exports;
      exports = relocateExports(exports, 1024);
      Module["asm"] = exports;
      var metadata = getDylinkMetadata(module);
      if (metadata.neededDynlibs) {
       dynamicLibraries = metadata.neededDynlibs.concat(dynamicLibraries);
      }
      mergeLibSymbols(exports, "main");
      addOnInit(Module["asm"]["__wasm_call_ctors"]);
      removeRunDependency("wasm-instantiate");
     }
     addRunDependency("wasm-instantiate");
     var trueModule = Module;
     function receiveInstantiationResult(result) {
      assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
      trueModule = null;
      receiveInstance(result["instance"], result["module"]);
     }
     function instantiateArrayBuffer(receiver) {
      return getBinaryPromise().then(function(binary) {
       return WebAssembly.instantiate(binary, info);
      }).then(function(instance) {
       return instance;
      }).then(receiver, function(reason) {
       err("failed to asynchronously prepare wasm: " + reason);
       if (isFileURI(wasmBinaryFile)) {
        err("warning: Loading from a file URI (" + wasmBinaryFile + ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing");
       }
       abort(reason);
      });
     }
     function instantiateAsync() {
      if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
       return fetch(wasmBinaryFile, {
        credentials: "same-origin"
       }).then(function(response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiationResult, function(reason) {
         err("wasm streaming compile failed: " + reason);
         err("falling back to ArrayBuffer instantiation");
         return instantiateArrayBuffer(receiveInstantiationResult);
        });
       });
      } else {
       return instantiateArrayBuffer(receiveInstantiationResult);
      }
     }
     if (Module["instantiateWasm"]) {
      try {
       var exports = Module["instantiateWasm"](info, receiveInstance);
       return exports;
      } catch (e) {
       err("Module.instantiateWasm callback failed with error: " + e);
       return false;
      }
     }
     instantiateAsync();
     return {};
    }
    var tempDouble;
    var tempI64;
    var ASM_CONSTS = {};
    var GOT = {};
    var GOTHandler = {
     get: function(obj, symName) {
      if (!GOT[symName]) {
       GOT[symName] = new WebAssembly.Global({
        "value": "i32",
        "mutable": true
       });
      }
      return GOT[symName];
     }
    };
    function callRuntimeCallbacks(callbacks) {
     while (callbacks.length > 0) {
      var callback = callbacks.shift();
      if (typeof callback == "function") {
       callback(Module);
       continue;
      }
      var func = callback.func;
      if (typeof func === "number") {
       if (callback.arg === undefined) {
        wasmTable.get(func)();
       } else {
        wasmTable.get(func)(callback.arg);
       }
      } else {
       func(callback.arg === undefined ? null : callback.arg);
      }
     }
    }
    function demangle(func) {
     warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
     return func;
    }
    function demangleAll(text) {
     var regex = /\b_Z[\w\d_]+/g;
     return text.replace(regex, function(x) {
      var y = demangle(x);
      return x === y ? x : y + " [" + x + "]";
     });
    }
    function getDylinkMetadata(binary) {
     var next = 0;
     function getLEB() {
      var ret = 0;
      var mul = 1;
      while (1) {
       var byte = binary[next++];
       ret += (byte & 127) * mul;
       mul *= 128;
       if (!(byte & 128)) break;
      }
      return ret;
     }
     if (binary instanceof WebAssembly.Module) {
      var dylinkSection = WebAssembly.Module.customSections(binary, "dylink");
      assert(dylinkSection.length != 0, "need dylink section");
      binary = new Int8Array(dylinkSection[0]);
     } else {
      var int32View = new Uint32Array(new Uint8Array(binary.subarray(0, 24)).buffer);
      assert(int32View[0] == 1836278016, "need to see wasm magic number");
      assert(binary[8] === 0, "need the dylink section to be first");
      next = 9;
      getLEB();
      assert(binary[next] === 6);
      next++;
      assert(binary[next] === "d".charCodeAt(0));
      next++;
      assert(binary[next] === "y".charCodeAt(0));
      next++;
      assert(binary[next] === "l".charCodeAt(0));
      next++;
      assert(binary[next] === "i".charCodeAt(0));
      next++;
      assert(binary[next] === "n".charCodeAt(0));
      next++;
      assert(binary[next] === "k".charCodeAt(0));
      next++;
     }
     var customSection = {};
     customSection.memorySize = getLEB();
     customSection.memoryAlign = getLEB();
     customSection.tableSize = getLEB();
     customSection.tableAlign = getLEB();
     var tableAlign = Math.pow(2, customSection.tableAlign);
     assert(tableAlign === 1, "invalid tableAlign " + tableAlign);
     var neededDynlibsCount = getLEB();
     customSection.neededDynlibs = [];
     for (var i = 0; i < neededDynlibsCount; ++i) {
      var nameLen = getLEB();
      var nameUTF8 = binary.subarray(next, next + nameLen);
      next += nameLen;
      var name = UTF8ArrayToString(nameUTF8, 0);
      customSection.neededDynlibs.push(name);
     }
     return customSection;
    }
    function jsStackTrace() {
     var error = new Error();
     if (!error.stack) {
      try {
       throw new Error();
      } catch (e) {
       error = e;
      }
      if (!error.stack) {
       return "(no stack trace available)";
      }
     }
     return error.stack.toString();
    }
    function asmjsMangle(x) {
     var unmangledSymbols = [ "stackAlloc", "stackSave", "stackRestore" ];
     return x.indexOf("dynCall_") == 0 || unmangledSymbols.includes(x) ? x : "_" + x;
    }
    function mergeLibSymbols(exports, libName) {
     for (var sym in exports) {
      if (!exports.hasOwnProperty(sym)) {
       continue;
      }
      if (!asmLibraryArg.hasOwnProperty(sym)) {
       asmLibraryArg[sym] = exports[sym];
      }
      var module_sym = asmjsMangle(sym);
      if (!Module.hasOwnProperty(module_sym)) {
       Module[module_sym] = exports[sym];
      }
     }
    }
    var LDSO = {
     nextHandle: 1,
     loadedLibs: {},
     loadedLibNames: {}
    };
    function dynCallLegacy(sig, ptr, args) {
     assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
     if (args && args.length) {
      assert(args.length === sig.substring(1).replace(/j/g, "--").length);
     } else {
      assert(sig.length == 1);
     }
     var f = Module["dynCall_" + sig];
     return args && args.length ? f.apply(null, [ ptr ].concat(args)) : f.call(null, ptr);
    }
    function dynCall(sig, ptr, args) {
     if (sig.includes("j")) {
      return dynCallLegacy(sig, ptr, args);
     }
     assert(wasmTable.get(ptr), "missing table entry in dynCall: " + ptr);
     return wasmTable.get(ptr).apply(null, args);
    }
    function createInvokeFunction(sig) {
     return function() {
      var sp = stackSave();
      try {
       return dynCall(sig, arguments[0], Array.prototype.slice.call(arguments, 1));
      } catch (e) {
       stackRestore(sp);
       if (e !== e + 0 && e !== "longjmp") throw e;
       _setThrew(1, 0);
      }
     };
    }
    var ___heap_base = 5251008;
    Module["___heap_base"] = ___heap_base;
    function getMemory(size) {
     if (runtimeInitialized) return _malloc(size);
     var ret = ___heap_base;
     var end = ret + size + 15 & -16;
     assert(end <= HEAP8.length, "failure to getMemory - memory growth etc. is not supported there, call malloc/sbrk directly or increase INITIAL_MEMORY");
     ___heap_base = end;
     GOT["__heap_base"].value = end;
     return ret;
    }
    function isInternalSym(symName) {
     return [ "__cpp_exception", "__wasm_apply_data_relocs", "__dso_handle", "__set_stack_limits" ].includes(symName);
    }
    function updateGOT(exports) {
     for (var symName in exports) {
      if (isInternalSym(symName)) {
       continue;
      }
      var replace = false;
      var value = exports[symName];
      if (symName.startsWith("orig$")) {
       symName = symName.split("$")[1];
       replace = true;
      }
      if (!GOT[symName]) {
       GOT[symName] = new WebAssembly.Global({
        "value": "i32",
        "mutable": true
       });
      }
      if (replace || GOT[symName].value == 0) {
       if (typeof value === "function") {
        GOT[symName].value = addFunctionWasm(value);
       } else if (typeof value === "number") {
        GOT[symName].value = value;
       } else {
        err("unhandled export type for `" + symName + "`: " + typeof value);
       }
      }
     }
    }
    function relocateExports(exports, memoryBase) {
     var relocated = {};
     for (var e in exports) {
      var value = exports[e];
      if (typeof value === "object") {
       value = value.value;
      }
      if (typeof value === "number") {
       value += memoryBase;
      }
      relocated[e] = value;
     }
     updateGOT(relocated);
     return relocated;
    }
    function resolveGlobalSymbol(symName, direct) {
     var sym;
     if (direct) {
      sym = asmLibraryArg["orig$" + symName];
     }
     if (!sym) {
      sym = asmLibraryArg[symName];
     }
     if (!sym) {
      sym = Module[asmjsMangle(symName)];
     }
     if (!sym && symName.startsWith("invoke_")) {
      sym = createInvokeFunction(symName.split("_")[1]);
     }
     return sym;
    }
    function alignMemory(size, alignment) {
     assert(alignment, "alignment argument is required");
     return Math.ceil(size / alignment) * alignment;
    }
    function loadWebAssemblyModule(binary, flags) {
     var metadata = getDylinkMetadata(binary);
     var originalTable = wasmTable;
     function loadModule() {
      var memAlign = Math.pow(2, metadata.memoryAlign);
      memAlign = Math.max(memAlign, STACK_ALIGN);
      var memoryBase = alignMemory(getMemory(metadata.memorySize + memAlign), memAlign);
      var tableBase = wasmTable.length;
      wasmTable.grow(metadata.tableSize);
      for (var i = memoryBase; i < memoryBase + metadata.memorySize; i++) {
       SAFE_HEAP_STORE(i, 0, 1);
      }
      for (var i = tableBase; i < tableBase + metadata.tableSize; i++) {
       wasmTable.set(i, null);
      }
      var moduleExports;
      function resolveSymbol(sym) {
       var resolved = resolveGlobalSymbol(sym, false);
       if (!resolved) {
        resolved = moduleExports[sym];
       }
       assert(resolved, "undefined symbol `" + sym + "`. perhaps a side module was not linked in? if this global was expected to arrive from a system library, try to build the MAIN_MODULE with EMCC_FORCE_STDLIBS=1 in the environment");
       return resolved;
      }
      var proxyHandler = {
       "get": function(stubs, prop) {
        switch (prop) {
        case "__memory_base":
         return memoryBase;

        case "__table_base":
         return tableBase;
        }
        if (prop in asmLibraryArg) {
         return asmLibraryArg[prop];
        }
        if (!(prop in stubs)) {
         var resolved;
         stubs[prop] = function() {
          if (!resolved) resolved = resolveSymbol(prop, true);
          return resolved.apply(null, arguments);
         };
        }
        return stubs[prop];
       }
      };
      var proxy = new Proxy({}, proxyHandler);
      var info = {
       "GOT.mem": new Proxy({}, GOTHandler),
       "GOT.func": new Proxy({}, GOTHandler),
       "env": proxy,
       wasi_snapshot_preview1: proxy
      };
      function postInstantiation(instance) {
       assert(wasmTable === originalTable);
       for (var i = 0; i < metadata.tableSize; i++) {
        var item = wasmTable.get(tableBase + i);
        assert(item !== undefined, "table entry was not filled in");
        if (item) {
         functionsInTableMap.set(item, tableBase + i);
        }
       }
       moduleExports = relocateExports(instance.exports, memoryBase);
       if (!flags.allowUndefined) {
        reportUndefinedSymbols();
       }
       var init = moduleExports["__wasm_call_ctors"];
       if (!init) {
        init = moduleExports["__post_instantiate"];
       }
       if (init) {
        if (runtimeInitialized) {
         init();
        } else {
         __ATINIT__.push(init);
        }
       }
       return moduleExports;
      }
      if (flags.loadAsync) {
       if (binary instanceof WebAssembly.Module) {
        var instance = new WebAssembly.Instance(binary, info);
        return Promise.resolve(postInstantiation(instance));
       }
       return WebAssembly.instantiate(binary, info).then(function(result) {
        return postInstantiation(result.instance);
       });
      }
      var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
      var instance = new WebAssembly.Instance(module, info);
      return postInstantiation(instance);
     }
     if (flags.loadAsync) {
      return metadata.neededDynlibs.reduce(function(chain, dynNeeded) {
       return chain.then(function() {
        return loadDynamicLibrary(dynNeeded, flags);
       });
      }, Promise.resolve()).then(function() {
       return loadModule();
      });
     }
     metadata.neededDynlibs.forEach(function(dynNeeded) {
      loadDynamicLibrary(dynNeeded, flags);
     });
     return loadModule();
    }
    function loadDynamicLibrary(lib, flags) {
     if (lib == "__main__" && !LDSO.loadedLibNames[lib]) {
      LDSO.loadedLibs[-1] = {
       refcount: Infinity,
       name: "__main__",
       module: Module["asm"],
       global: true
      };
      LDSO.loadedLibNames["__main__"] = -1;
     }
     flags = flags || {
      global: true,
      nodelete: true
     };
     var handle = LDSO.loadedLibNames[lib];
     var dso;
     if (handle) {
      dso = LDSO.loadedLibs[handle];
      if (flags.global && !dso.global) {
       dso.global = true;
       if (dso.module !== "loading") {
        mergeLibSymbols(dso.module, lib);
       }
      }
      if (flags.nodelete && dso.refcount !== Infinity) {
       dso.refcount = Infinity;
      }
      dso.refcount++;
      return flags.loadAsync ? Promise.resolve(handle) : handle;
     }
     handle = LDSO.nextHandle++;
     dso = {
      refcount: flags.nodelete ? Infinity : 1,
      name: lib,
      module: "loading",
      global: flags.global
     };
     LDSO.loadedLibNames[lib] = handle;
     LDSO.loadedLibs[handle] = dso;
     function loadLibData(libFile) {
      if (flags.fs && flags.fs.findObject(libFile)) {
       var libData = flags.fs.readFile(libFile, {
        encoding: "binary"
       });
       if (!(libData instanceof Uint8Array)) {
        libData = new Uint8Array(libData);
       }
       return flags.loadAsync ? Promise.resolve(libData) : libData;
      }
      if (flags.loadAsync) {
       return new Promise(function(resolve, reject) {
        readAsync(libFile, function(data) {
         resolve(new Uint8Array(data));
        }, reject);
       });
      }
      if (!readBinary) {
       throw new Error(libFile + ": file not found, and synchronous loading of external files is not available");
      }
      return readBinary(libFile);
     }
     function getLibModule() {
      if (Module["preloadedWasm"] !== undefined && Module["preloadedWasm"][lib] !== undefined) {
       var libModule = Module["preloadedWasm"][lib];
       return flags.loadAsync ? Promise.resolve(libModule) : libModule;
      }
      if (flags.loadAsync) {
       return loadLibData(lib).then(function(libData) {
        return loadWebAssemblyModule(libData, flags);
       });
      }
      return loadWebAssemblyModule(loadLibData(lib), flags);
     }
     function moduleLoaded(libModule) {
      if (dso.global) {
       mergeLibSymbols(libModule, lib);
      }
      dso.module = libModule;
     }
     if (flags.loadAsync) {
      return getLibModule().then(function(libModule) {
       moduleLoaded(libModule);
       return handle;
      });
     }
     moduleLoaded(getLibModule());
     return handle;
    }
    function reportUndefinedSymbols() {
     for (var symName in GOT) {
      if (GOT[symName].value == 0) {
       var value = resolveGlobalSymbol(symName, true);
       assert(value, "undefined symbol `" + symName + "`. perhaps a side module was not linked in? if this global was expected to arrive from a system library, try to build the MAIN_MODULE with EMCC_FORCE_STDLIBS=1 in the environment");
       if (typeof value === "function") {
        GOT[symName].value = addFunctionWasm(value, value.sig);
       } else if (typeof value === "number") {
        GOT[symName].value = value;
       } else {
        assert(false, "bad export type for `" + symName + "`: " + typeof value);
       }
      }
     }
    }
    function preloadDylibs() {
     if (!dynamicLibraries.length) {
      reportUndefinedSymbols();
      return;
     }
     addRunDependency("preloadDylibs");
     dynamicLibraries.reduce(function(chain, lib) {
      return chain.then(function() {
       return loadDynamicLibrary(lib, {
        loadAsync: true,
        global: true,
        nodelete: true,
        allowUndefined: true
       });
      });
     }, Promise.resolve()).then(function() {
      reportUndefinedSymbols();
      removeRunDependency("preloadDylibs");
     });
    }
    function stackTrace() {
     var js = jsStackTrace();
     if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
     return demangleAll(js);
    }
    function unSign(value, bits) {
     if (value >= 0) {
      return value;
     }
     return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
    }
    var ___stack_pointer = new WebAssembly.Global({
     "value": "i32",
     "mutable": true
    }, 5251008);
    function _abort() {
     abort();
    }
    Module["_abort"] = _abort;
    _abort.sig = "v";
    var _emscripten_get_now;
    if (ENVIRONMENT_IS_NODE) {
     _emscripten_get_now = function() {
      var t = process["hrtime"]();
      return t[0] * 1e3 + t[1] / 1e6;
     };
    } else _emscripten_get_now = function() {
     return performance.now();
    };
    var _emscripten_get_now_is_monotonic = true;
    function setErrNo(value) {
     SAFE_HEAP_STORE(___errno_location() | 0, value | 0, 4);
     return value;
    }
    function _clock_gettime(clk_id, tp) {
     var now;
     if (clk_id === 0) {
      now = Date.now();
     } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
      now = _emscripten_get_now();
     } else {
      setErrNo(28);
      return -1;
     }
     SAFE_HEAP_STORE(tp | 0, now / 1e3 | 0 | 0, 4);
     SAFE_HEAP_STORE(tp + 4 | 0, now % 1e3 * 1e3 * 1e3 | 0 | 0, 4);
     return 0;
    }
    _clock_gettime.sig = "iii";
    function _emscripten_memcpy_big(dest, src, num) {
     HEAPU8.copyWithin(dest, src, src + num);
    }
    function emscripten_realloc_buffer(size) {
     try {
      wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
      updateGlobalBufferAndViews(wasmMemory.buffer);
      return 1;
     } catch (e) {
      err("emscripten_realloc_buffer: Attempted to grow heap from " + buffer.byteLength + " bytes to " + size + " bytes, but got error: " + e);
     }
    }
    function _emscripten_resize_heap(requestedSize) {
     var oldSize = HEAPU8.length;
     requestedSize = requestedSize >>> 0;
     assert(requestedSize > oldSize);
     var maxHeapSize = 2147483648;
     if (requestedSize > maxHeapSize) {
      err("Cannot enlarge memory, asked to go up to " + requestedSize + " bytes, but the limit is " + maxHeapSize + " bytes!");
      return false;
     }
     for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = emscripten_realloc_buffer(newSize);
      if (replacement) {
       return true;
      }
     }
     err("Failed to grow the heap from " + oldSize + " bytes to " + newSize + " bytes, not enough memory!");
     return false;
    }
    function _exit(status) {
     exit(status);
    }
    _exit.sig = "vi";
    var SYSCALLS = {
     mappings: {},
     DEFAULT_POLLMASK: 5,
     umask: 511,
     calculateAt: function(dirfd, path, allowEmpty) {
      if (path[0] === "/") {
       return path;
      }
      var dir;
      if (dirfd === -100) {
       dir = FS.cwd();
      } else {
       var dirstream = FS.getStream(dirfd);
       if (!dirstream) throw new FS.ErrnoError(8);
       dir = dirstream.path;
      }
      if (path.length == 0) {
       if (!allowEmpty) {
        throw new FS.ErrnoError(44);
       }
       return dir;
      }
      return PATH.join2(dir, path);
     },
     doStat: function(func, path, buf) {
      try {
       var stat = func(path);
      } catch (e) {
       if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
        return -54;
       }
       throw e;
      }
      SAFE_HEAP_STORE(buf | 0, stat.dev | 0, 4);
      SAFE_HEAP_STORE(buf + 4 | 0, 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 8 | 0, stat.ino | 0, 4);
      SAFE_HEAP_STORE(buf + 12 | 0, stat.mode | 0, 4);
      SAFE_HEAP_STORE(buf + 16 | 0, stat.nlink | 0, 4);
      SAFE_HEAP_STORE(buf + 20 | 0, stat.uid | 0, 4);
      SAFE_HEAP_STORE(buf + 24 | 0, stat.gid | 0, 4);
      SAFE_HEAP_STORE(buf + 28 | 0, stat.rdev | 0, 4);
      SAFE_HEAP_STORE(buf + 32 | 0, 0 | 0, 4);
      tempI64 = [ stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
      SAFE_HEAP_STORE(buf + 40 | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(buf + 44 | 0, tempI64[1] | 0, 4);
      SAFE_HEAP_STORE(buf + 48 | 0, 4096 | 0, 4);
      SAFE_HEAP_STORE(buf + 52 | 0, stat.blocks | 0, 4);
      SAFE_HEAP_STORE(buf + 56 | 0, stat.atime.getTime() / 1e3 | 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 60 | 0, 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 64 | 0, stat.mtime.getTime() / 1e3 | 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 68 | 0, 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 72 | 0, stat.ctime.getTime() / 1e3 | 0 | 0, 4);
      SAFE_HEAP_STORE(buf + 76 | 0, 0 | 0, 4);
      tempI64 = [ stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
      SAFE_HEAP_STORE(buf + 80 | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(buf + 84 | 0, tempI64[1] | 0, 4);
      return 0;
     },
     doMsync: function(addr, stream, len, flags, offset) {
      var buffer = HEAPU8.slice(addr, addr + len);
      FS.msync(stream, buffer, offset, len, flags);
     },
     doMkdir: function(path, mode) {
      path = PATH.normalize(path);
      if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
      FS.mkdir(path, mode, 0);
      return 0;
     },
     doMknod: function(path, mode, dev) {
      switch (mode & 61440) {
      case 32768:
      case 8192:
      case 24576:
      case 4096:
      case 49152:
       break;

      default:
       return -28;
      }
      FS.mknod(path, mode, dev);
      return 0;
     },
     doReadlink: function(path, buf, bufsize) {
      if (bufsize <= 0) return -28;
      var ret = FS.readlink(path);
      var len = Math.min(bufsize, lengthBytesUTF8(ret));
      var endChar = SAFE_HEAP_LOAD(buf + len, 1, 0);
      stringToUTF8(ret, buf, bufsize + 1);
      SAFE_HEAP_STORE(buf + len, endChar, 1);
      return len;
     },
     doAccess: function(path, amode) {
      if (amode & ~7) {
       return -28;
      }
      var node;
      var lookup = FS.lookupPath(path, {
       follow: true
      });
      node = lookup.node;
      if (!node) {
       return -44;
      }
      var perms = "";
      if (amode & 4) perms += "r";
      if (amode & 2) perms += "w";
      if (amode & 1) perms += "x";
      if (perms && FS.nodePermissions(node, perms)) {
       return -2;
      }
      return 0;
     },
     doDup: function(path, flags, suggestFD) {
      var suggest = FS.getStream(suggestFD);
      if (suggest) FS.close(suggest);
      return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
     },
     doReadv: function(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
       var ptr = SAFE_HEAP_LOAD(iov + i * 8 | 0, 4, 0) | 0;
       var len = SAFE_HEAP_LOAD(iov + (i * 8 + 4) | 0, 4, 0) | 0;
       var curr = FS.read(stream, HEAP8, ptr, len, offset);
       if (curr < 0) return -1;
       ret += curr;
       if (curr < len) break;
      }
      return ret;
     },
     doWritev: function(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
       var ptr = SAFE_HEAP_LOAD(iov + i * 8 | 0, 4, 0) | 0;
       var len = SAFE_HEAP_LOAD(iov + (i * 8 + 4) | 0, 4, 0) | 0;
       var curr = FS.write(stream, HEAP8, ptr, len, offset);
       if (curr < 0) return -1;
       ret += curr;
      }
      return ret;
     },
     varargs: undefined,
     get: function() {
      assert(SYSCALLS.varargs != undefined);
      SYSCALLS.varargs += 4;
      var ret = SAFE_HEAP_LOAD(SYSCALLS.varargs - 4 | 0, 4, 0) | 0;
      return ret;
     },
     getStr: function(ptr) {
      var ret = UTF8ToString(ptr);
      return ret;
     },
     getStreamFromFD: function(fd) {
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(8);
      return stream;
     },
     get64: function(low, high) {
      if (low >= 0) assert(high === 0); else assert(high === -1);
      return low;
     }
    };
    function _fd_close(fd) {
     try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
     } catch (e) {
      if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
      return e.errno;
     }
    }
    _fd_close.sig = "ii";
    function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
     try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 4294967296;
      var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
      var DOUBLE_LIMIT = 9007199254740992;
      if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
       return -61;
      }
      FS.llseek(stream, offset, whence);
      tempI64 = [ stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
      SAFE_HEAP_STORE(newOffset | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(newOffset + 4 | 0, tempI64[1] | 0, 4);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
      return 0;
     } catch (e) {
      if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
      return e.errno;
     }
    }
    function _fd_write(fd, iov, iovcnt, pnum) {
     try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(stream, iov, iovcnt);
      SAFE_HEAP_STORE(pnum | 0, num | 0, 4);
      return 0;
     } catch (e) {
      if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
      return e.errno;
     }
    }
    _fd_write.sig = "iiiii";
    function _setTempRet0(val) {
     setTempRet0(val);
    }
    _setTempRet0.sig = "vi";
    function _tree_sitter_log_callback(isLexMessage, messageAddress) {
     if (currentLogCallback) {
      const message = UTF8ToString(messageAddress);
      currentLogCallback(message, isLexMessage !== 0);
     }
    }
    function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
     var INPUT_BUFFER_SIZE = 10 * 1024;
     var string = currentParseCallback(index, {
      row: row,
      column: column
     });
     if (typeof string === "string") {
      setValue(lengthAddress, string.length, "i32");
      stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE);
     } else {
      setValue(lengthAddress, 0, "i32");
     }
    }
    var ___memory_base = 1024;
    var ___table_base = 1;
    var ASSERTIONS = true;
    function intArrayFromString(stringy, dontAddNull, length) {
     var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
     var u8array = new Array(len);
     var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
     if (dontAddNull) u8array.length = numBytesWritten;
     return u8array;
    }
    function intArrayToString(array) {
     var ret = [];
     for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 255) {
       if (ASSERTIONS) {
        assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
       }
       chr &= 255;
      }
      ret.push(String.fromCharCode(chr));
     }
     return ret.join("");
    }
    var asmLibraryArg = {
     "__heap_base": ___heap_base,
     "__indirect_function_table": wasmTable,
     "__memory_base": ___memory_base,
     "__stack_pointer": ___stack_pointer,
     "__table_base": ___table_base,
     "abort": _abort,
     "alignfault": alignfault,
     "clock_gettime": _clock_gettime,
     "emscripten_memcpy_big": _emscripten_memcpy_big,
     "emscripten_resize_heap": _emscripten_resize_heap,
     "exit": _exit,
     "fd_close": _fd_close,
     "fd_seek": _fd_seek,
     "fd_write": _fd_write,
     "memory": wasmMemory,
     "segfault": segfault,
     "setTempRet0": _setTempRet0,
     "tree_sitter_log_callback": _tree_sitter_log_callback,
     "tree_sitter_parse_callback": _tree_sitter_parse_callback
    };
    var asm = createWasm();
    var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");
    var _ts_language_symbol_count = Module["_ts_language_symbol_count"] = createExportWrapper("ts_language_symbol_count");
    var _ts_language_version = Module["_ts_language_version"] = createExportWrapper("ts_language_version");
    var _ts_language_field_count = Module["_ts_language_field_count"] = createExportWrapper("ts_language_field_count");
    var _ts_language_symbol_name = Module["_ts_language_symbol_name"] = createExportWrapper("ts_language_symbol_name");
    var _ts_language_symbol_for_name = Module["_ts_language_symbol_for_name"] = createExportWrapper("ts_language_symbol_for_name");
    var _ts_language_symbol_type = Module["_ts_language_symbol_type"] = createExportWrapper("ts_language_symbol_type");
    var _ts_language_field_name_for_id = Module["_ts_language_field_name_for_id"] = createExportWrapper("ts_language_field_name_for_id");
    var _memcpy = Module["_memcpy"] = createExportWrapper("memcpy");
    var _free = Module["_free"] = createExportWrapper("free");
    var _calloc = Module["_calloc"] = createExportWrapper("calloc");
    var _ts_parser_delete = Module["_ts_parser_delete"] = createExportWrapper("ts_parser_delete");
    var _ts_parser_set_language = Module["_ts_parser_set_language"] = createExportWrapper("ts_parser_set_language");
    var _ts_parser_reset = Module["_ts_parser_reset"] = createExportWrapper("ts_parser_reset");
    var _ts_parser_timeout_micros = Module["_ts_parser_timeout_micros"] = createExportWrapper("ts_parser_timeout_micros");
    var _ts_parser_set_timeout_micros = Module["_ts_parser_set_timeout_micros"] = createExportWrapper("ts_parser_set_timeout_micros");
    var _ts_query_new = Module["_ts_query_new"] = createExportWrapper("ts_query_new");
    var _ts_query_delete = Module["_ts_query_delete"] = createExportWrapper("ts_query_delete");
    var _malloc = Module["_malloc"] = createExportWrapper("malloc");
    var _iswspace = Module["_iswspace"] = createExportWrapper("iswspace");
    var _ts_query_pattern_count = Module["_ts_query_pattern_count"] = createExportWrapper("ts_query_pattern_count");
    var _ts_query_capture_count = Module["_ts_query_capture_count"] = createExportWrapper("ts_query_capture_count");
    var _ts_query_string_count = Module["_ts_query_string_count"] = createExportWrapper("ts_query_string_count");
    var _ts_query_capture_name_for_id = Module["_ts_query_capture_name_for_id"] = createExportWrapper("ts_query_capture_name_for_id");
    var _ts_query_string_value_for_id = Module["_ts_query_string_value_for_id"] = createExportWrapper("ts_query_string_value_for_id");
    var _ts_query_predicates_for_pattern = Module["_ts_query_predicates_for_pattern"] = createExportWrapper("ts_query_predicates_for_pattern");
    var _memmove = Module["_memmove"] = createExportWrapper("memmove");
    var _memcmp = Module["_memcmp"] = createExportWrapper("memcmp");
    var _ts_tree_copy = Module["_ts_tree_copy"] = createExportWrapper("ts_tree_copy");
    var _ts_tree_delete = Module["_ts_tree_delete"] = createExportWrapper("ts_tree_delete");
    var _iswalnum = Module["_iswalnum"] = createExportWrapper("iswalnum");
    var _ts_init = Module["_ts_init"] = createExportWrapper("ts_init");
    var _ts_parser_new_wasm = Module["_ts_parser_new_wasm"] = createExportWrapper("ts_parser_new_wasm");
    var _ts_parser_enable_logger_wasm = Module["_ts_parser_enable_logger_wasm"] = createExportWrapper("ts_parser_enable_logger_wasm");
    var _ts_parser_parse_wasm = Module["_ts_parser_parse_wasm"] = createExportWrapper("ts_parser_parse_wasm");
    var _ts_language_type_is_named_wasm = Module["_ts_language_type_is_named_wasm"] = createExportWrapper("ts_language_type_is_named_wasm");
    var _ts_language_type_is_visible_wasm = Module["_ts_language_type_is_visible_wasm"] = createExportWrapper("ts_language_type_is_visible_wasm");
    var _ts_tree_root_node_wasm = Module["_ts_tree_root_node_wasm"] = createExportWrapper("ts_tree_root_node_wasm");
    var _ts_tree_edit_wasm = Module["_ts_tree_edit_wasm"] = createExportWrapper("ts_tree_edit_wasm");
    var _ts_tree_get_changed_ranges_wasm = Module["_ts_tree_get_changed_ranges_wasm"] = createExportWrapper("ts_tree_get_changed_ranges_wasm");
    var _ts_tree_cursor_new_wasm = Module["_ts_tree_cursor_new_wasm"] = createExportWrapper("ts_tree_cursor_new_wasm");
    var _ts_tree_cursor_delete_wasm = Module["_ts_tree_cursor_delete_wasm"] = createExportWrapper("ts_tree_cursor_delete_wasm");
    var _ts_tree_cursor_reset_wasm = Module["_ts_tree_cursor_reset_wasm"] = createExportWrapper("ts_tree_cursor_reset_wasm");
    var _ts_tree_cursor_goto_first_child_wasm = Module["_ts_tree_cursor_goto_first_child_wasm"] = createExportWrapper("ts_tree_cursor_goto_first_child_wasm");
    var _ts_tree_cursor_goto_next_sibling_wasm = Module["_ts_tree_cursor_goto_next_sibling_wasm"] = createExportWrapper("ts_tree_cursor_goto_next_sibling_wasm");
    var _ts_tree_cursor_goto_parent_wasm = Module["_ts_tree_cursor_goto_parent_wasm"] = createExportWrapper("ts_tree_cursor_goto_parent_wasm");
    var _ts_tree_cursor_current_node_type_id_wasm = Module["_ts_tree_cursor_current_node_type_id_wasm"] = createExportWrapper("ts_tree_cursor_current_node_type_id_wasm");
    var _ts_tree_cursor_current_node_is_named_wasm = Module["_ts_tree_cursor_current_node_is_named_wasm"] = createExportWrapper("ts_tree_cursor_current_node_is_named_wasm");
    var _ts_tree_cursor_current_node_is_missing_wasm = Module["_ts_tree_cursor_current_node_is_missing_wasm"] = createExportWrapper("ts_tree_cursor_current_node_is_missing_wasm");
    var _ts_tree_cursor_current_node_id_wasm = Module["_ts_tree_cursor_current_node_id_wasm"] = createExportWrapper("ts_tree_cursor_current_node_id_wasm");
    var _ts_tree_cursor_start_position_wasm = Module["_ts_tree_cursor_start_position_wasm"] = createExportWrapper("ts_tree_cursor_start_position_wasm");
    var _ts_tree_cursor_end_position_wasm = Module["_ts_tree_cursor_end_position_wasm"] = createExportWrapper("ts_tree_cursor_end_position_wasm");
    var _ts_tree_cursor_start_index_wasm = Module["_ts_tree_cursor_start_index_wasm"] = createExportWrapper("ts_tree_cursor_start_index_wasm");
    var _ts_tree_cursor_end_index_wasm = Module["_ts_tree_cursor_end_index_wasm"] = createExportWrapper("ts_tree_cursor_end_index_wasm");
    var _ts_tree_cursor_current_field_id_wasm = Module["_ts_tree_cursor_current_field_id_wasm"] = createExportWrapper("ts_tree_cursor_current_field_id_wasm");
    var _ts_tree_cursor_current_node_wasm = Module["_ts_tree_cursor_current_node_wasm"] = createExportWrapper("ts_tree_cursor_current_node_wasm");
    var _ts_node_symbol_wasm = Module["_ts_node_symbol_wasm"] = createExportWrapper("ts_node_symbol_wasm");
    var _ts_node_child_count_wasm = Module["_ts_node_child_count_wasm"] = createExportWrapper("ts_node_child_count_wasm");
    var _ts_node_named_child_count_wasm = Module["_ts_node_named_child_count_wasm"] = createExportWrapper("ts_node_named_child_count_wasm");
    var _ts_node_child_wasm = Module["_ts_node_child_wasm"] = createExportWrapper("ts_node_child_wasm");
    var _ts_node_named_child_wasm = Module["_ts_node_named_child_wasm"] = createExportWrapper("ts_node_named_child_wasm");
    var _ts_node_child_by_field_id_wasm = Module["_ts_node_child_by_field_id_wasm"] = createExportWrapper("ts_node_child_by_field_id_wasm");
    var _ts_node_next_sibling_wasm = Module["_ts_node_next_sibling_wasm"] = createExportWrapper("ts_node_next_sibling_wasm");
    var _ts_node_prev_sibling_wasm = Module["_ts_node_prev_sibling_wasm"] = createExportWrapper("ts_node_prev_sibling_wasm");
    var _ts_node_next_named_sibling_wasm = Module["_ts_node_next_named_sibling_wasm"] = createExportWrapper("ts_node_next_named_sibling_wasm");
    var _ts_node_prev_named_sibling_wasm = Module["_ts_node_prev_named_sibling_wasm"] = createExportWrapper("ts_node_prev_named_sibling_wasm");
    var _ts_node_parent_wasm = Module["_ts_node_parent_wasm"] = createExportWrapper("ts_node_parent_wasm");
    var _ts_node_descendant_for_index_wasm = Module["_ts_node_descendant_for_index_wasm"] = createExportWrapper("ts_node_descendant_for_index_wasm");
    var _ts_node_named_descendant_for_index_wasm = Module["_ts_node_named_descendant_for_index_wasm"] = createExportWrapper("ts_node_named_descendant_for_index_wasm");
    var _ts_node_descendant_for_position_wasm = Module["_ts_node_descendant_for_position_wasm"] = createExportWrapper("ts_node_descendant_for_position_wasm");
    var _ts_node_named_descendant_for_position_wasm = Module["_ts_node_named_descendant_for_position_wasm"] = createExportWrapper("ts_node_named_descendant_for_position_wasm");
    var _ts_node_start_point_wasm = Module["_ts_node_start_point_wasm"] = createExportWrapper("ts_node_start_point_wasm");
    var _ts_node_end_point_wasm = Module["_ts_node_end_point_wasm"] = createExportWrapper("ts_node_end_point_wasm");
    var _ts_node_start_index_wasm = Module["_ts_node_start_index_wasm"] = createExportWrapper("ts_node_start_index_wasm");
    var _ts_node_end_index_wasm = Module["_ts_node_end_index_wasm"] = createExportWrapper("ts_node_end_index_wasm");
    var _ts_node_to_string_wasm = Module["_ts_node_to_string_wasm"] = createExportWrapper("ts_node_to_string_wasm");
    var _ts_node_children_wasm = Module["_ts_node_children_wasm"] = createExportWrapper("ts_node_children_wasm");
    var _ts_node_named_children_wasm = Module["_ts_node_named_children_wasm"] = createExportWrapper("ts_node_named_children_wasm");
    var _ts_node_descendants_of_type_wasm = Module["_ts_node_descendants_of_type_wasm"] = createExportWrapper("ts_node_descendants_of_type_wasm");
    var _ts_node_is_named_wasm = Module["_ts_node_is_named_wasm"] = createExportWrapper("ts_node_is_named_wasm");
    var _ts_node_has_changes_wasm = Module["_ts_node_has_changes_wasm"] = createExportWrapper("ts_node_has_changes_wasm");
    var _ts_node_has_error_wasm = Module["_ts_node_has_error_wasm"] = createExportWrapper("ts_node_has_error_wasm");
    var _ts_node_is_missing_wasm = Module["_ts_node_is_missing_wasm"] = createExportWrapper("ts_node_is_missing_wasm");
    var _ts_query_matches_wasm = Module["_ts_query_matches_wasm"] = createExportWrapper("ts_query_matches_wasm");
    var _ts_query_captures_wasm = Module["_ts_query_captures_wasm"] = createExportWrapper("ts_query_captures_wasm");
    var _iswalpha = Module["_iswalpha"] = createExportWrapper("iswalpha");
    var _towupper = Module["_towupper"] = createExportWrapper("towupper");
    var _iswdigit = Module["_iswdigit"] = createExportWrapper("iswdigit");
    var _iswlower = Module["_iswlower"] = createExportWrapper("iswlower");
    var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");
    var _memchr = Module["_memchr"] = createExportWrapper("memchr");
    var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
     return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
    };
    var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
     return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
    };
    var _strlen = Module["_strlen"] = createExportWrapper("strlen");
    var stackSave = Module["stackSave"] = createExportWrapper("stackSave");
    var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");
    var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");
    var _emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = function() {
     return (_emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = Module["asm"]["emscripten_stack_set_limits"]).apply(null, arguments);
    };
    var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
     return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
    };
    var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew");
    var __ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv = Module["__ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv"] = createExportWrapper("_ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv");
    var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev"] = createExportWrapper("_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev");
    var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm"] = createExportWrapper("_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm");
    var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm"] = createExportWrapper("_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm");
    var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm"] = createExportWrapper("_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm");
    var __ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module["__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm"] = createExportWrapper("_ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm");
    var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc"] = createExportWrapper("_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc");
    var __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev"] = createExportWrapper("_ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev");
    var __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw"] = createExportWrapper("_ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw");
    var __Znwm = Module["__Znwm"] = createExportWrapper("_Znwm");
    var __ZdlPv = Module["__ZdlPv"] = createExportWrapper("_ZdlPv");
    var _sbrk = Module["_sbrk"] = createExportWrapper("sbrk");
    var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = createExportWrapper("emscripten_get_sbrk_ptr");
    var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");
    var _orig$ts_parser_timeout_micros = Module["_orig$ts_parser_timeout_micros"] = createExportWrapper("orig$ts_parser_timeout_micros");
    var _orig$ts_parser_set_timeout_micros = Module["_orig$ts_parser_set_timeout_micros"] = createExportWrapper("orig$ts_parser_set_timeout_micros");
    var _stderr = Module["_stderr"] = 7456;
    var _TRANSFER_BUFFER = Module["_TRANSFER_BUFFER"] = 7472;
    var ___data_end = Module["___data_end"] = 8124;
    var ___THREW__ = Module["___THREW__"] = 8116;
    var ___threwValue = Module["___threwValue"] = 8120;
    var ___cxa_new_handler = Module["___cxa_new_handler"] = 8112;
    if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() {
     abort("'intArrayFromString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() {
     abort("'intArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() {
     abort("'ccall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function() {
     abort("'cwrap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function() {
     abort("'setValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function() {
     abort("'getValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    Module["allocate"] = allocate;
    if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() {
     abort("'UTF8ArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() {
     abort("'UTF8ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() {
     abort("'stringToUTF8Array' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() {
     abort("'stringToUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() {
     abort("'lengthBytesUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() {
     abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() {
     abort("'addOnPreRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() {
     abort("'addOnInit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() {
     abort("'addOnPreMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() {
     abort("'addOnExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() {
     abort("'addOnPostRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() {
     abort("'writeStringToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() {
     abort("'writeArrayToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() {
     abort("'writeAsciiToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() {
     abort("'addRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() {
     abort("'removeRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() {
     abort("'FS_createFolder' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() {
     abort("'FS_createPath' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() {
     abort("'FS_createDataFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() {
     abort("'FS_createPreloadedFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() {
     abort("'FS_createLazyFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() {
     abort("'FS_createLink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() {
     abort("'FS_createDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() {
     abort("'FS_unlink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() {
     abort("'getLEB' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() {
     abort("'getFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() {
     abort("'alignFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() {
     abort("'registerFunctions' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() {
     abort("'addFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() {
     abort("'removeFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() {
     abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() {
     abort("'prettyPrint' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() {
     abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() {
     abort("'getCompilerSetting' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() {
     abort("'print' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() {
     abort("'printErr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() {
     abort("'getTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() {
     abort("'setTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() {
     abort("'callMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() {
     abort("'abort' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "keepRuntimeAlive")) Module["keepRuntimeAlive"] = function() {
     abort("'keepRuntimeAlive' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "zeroMemory")) Module["zeroMemory"] = function() {
     abort("'zeroMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function() {
     abort("'stringToNewUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setFileTime")) Module["setFileTime"] = function() {
     abort("'setFileTime' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function() {
     abort("'emscripten_realloc_buffer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() {
     abort("'ENV' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function() {
     abort("'ERRNO_CODES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function() {
     abort("'ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function() {
     abort("'setErrNo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "inetPton4")) Module["inetPton4"] = function() {
     abort("'inetPton4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "inetNtop4")) Module["inetNtop4"] = function() {
     abort("'inetNtop4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "inetPton6")) Module["inetPton6"] = function() {
     abort("'inetPton6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "inetNtop6")) Module["inetNtop6"] = function() {
     abort("'inetNtop6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = function() {
     abort("'readSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = function() {
     abort("'writeSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function() {
     abort("'DNS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = function() {
     abort("'getHostByName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function() {
     abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function() {
     abort("'Protocols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function() {
     abort("'Sockets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = function() {
     abort("'getRandomDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = function() {
     abort("'traverseStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function() {
     abort("'UNWIND_CACHE' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "withBuiltinMalloc")) Module["withBuiltinMalloc"] = function() {
     abort("'withBuiltinMalloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = function() {
     abort("'readAsmConstArgsArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function() {
     abort("'readAsmConstArgs' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = function() {
     abort("'mainThreadEM_ASM' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function() {
     abort("'jstoi_q' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function() {
     abort("'jstoi_s' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = function() {
     abort("'getExecutableName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function() {
     abort("'listenOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function() {
     abort("'autoResumeAudioContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = function() {
     abort("'dynCallLegacy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = function() {
     abort("'getDynCaller' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() {
     abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = function() {
     abort("'callRuntimeCallbacks' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "handleException")) Module["handleException"] = function() {
     abort("'handleException' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePush")) Module["runtimeKeepalivePush"] = function() {
     abort("'runtimeKeepalivePush' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePop")) Module["runtimeKeepalivePop"] = function() {
     abort("'runtimeKeepalivePop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "callUserCallback")) Module["callUserCallback"] = function() {
     abort("'callUserCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "maybeExit")) Module["maybeExit"] = function() {
     abort("'maybeExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "safeSetTimeout")) Module["safeSetTimeout"] = function() {
     abort("'safeSetTimeout' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "asmjsMangle")) Module["asmjsMangle"] = function() {
     abort("'asmjsMangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "asyncLoad")) Module["asyncLoad"] = function() {
     abort("'asyncLoad' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "alignMemory")) Module["alignMemory"] = function() {
     abort("'alignMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = function() {
     abort("'mmapAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function() {
     abort("'reallyNegative' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = function() {
     abort("'unSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = function() {
     abort("'reSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function() {
     abort("'formatString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function() {
     abort("'PATH' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function() {
     abort("'PATH_FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function() {
     abort("'SYSCALLS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function() {
     abort("'syscallMmap2' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function() {
     abort("'syscallMunmap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = function() {
     abort("'getSocketFromFD' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = function() {
     abort("'getSocketAddress' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function() {
     abort("'JSEvents' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = function() {
     abort("'registerKeyEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function() {
     abort("'specialHTMLTargets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = function() {
     abort("'maybeCStringToJsString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = function() {
     abort("'findEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = function() {
     abort("'findCanvasEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = function() {
     abort("'getBoundingClientRect' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = function() {
     abort("'fillMouseEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = function() {
     abort("'registerMouseEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = function() {
     abort("'registerWheelEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = function() {
     abort("'registerUiEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = function() {
     abort("'registerFocusEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = function() {
     abort("'fillDeviceOrientationEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = function() {
     abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = function() {
     abort("'fillDeviceMotionEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = function() {
     abort("'registerDeviceMotionEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = function() {
     abort("'screenOrientation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = function() {
     abort("'fillOrientationChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = function() {
     abort("'registerOrientationChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = function() {
     abort("'fillFullscreenChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = function() {
     abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = function() {
     abort("'registerRestoreOldStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = function() {
     abort("'hideEverythingExceptGivenElement' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = function() {
     abort("'restoreHiddenElements' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = function() {
     abort("'setLetterbox' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = function() {
     abort("'currentFullscreenStrategy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = function() {
     abort("'restoreOldWindowedStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = function() {
     abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = function() {
     abort("'doRequestFullscreen' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = function() {
     abort("'fillPointerlockChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = function() {
     abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = function() {
     abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = function() {
     abort("'requestPointerLock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = function() {
     abort("'fillVisibilityChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = function() {
     abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = function() {
     abort("'registerTouchEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = function() {
     abort("'fillGamepadEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = function() {
     abort("'registerGamepadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = function() {
     abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = function() {
     abort("'fillBatteryEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = function() {
     abort("'battery' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = function() {
     abort("'registerBatteryEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = function() {
     abort("'setCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = function() {
     abort("'getCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = function() {
     abort("'polyfillSetImmediate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function() {
     abort("'demangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function() {
     abort("'demangleAll' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function() {
     abort("'jsStackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() {
     abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function() {
     abort("'getEnvStrings' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function() {
     abort("'checkWasiClock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function() {
     abort("'writeI53ToI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function() {
     abort("'writeI53ToI64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function() {
     abort("'writeI53ToI64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function() {
     abort("'writeI53ToU64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function() {
     abort("'writeI53ToU64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function() {
     abort("'readI53FromI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function() {
     abort("'readI53FromU64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function() {
     abort("'convertI32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function() {
     abort("'convertU32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "resolveGlobalSymbol")) Module["resolveGlobalSymbol"] = function() {
     abort("'resolveGlobalSymbol' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GOT")) Module["GOT"] = function() {
     abort("'GOT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GOTHandler")) Module["GOTHandler"] = function() {
     abort("'GOTHandler' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "isInternalSym")) Module["isInternalSym"] = function() {
     abort("'isInternalSym' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "updateGOT")) Module["updateGOT"] = function() {
     abort("'updateGOT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "relocateExports")) Module["relocateExports"] = function() {
     abort("'relocateExports' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "reportUndefinedSymbols")) Module["reportUndefinedSymbols"] = function() {
     abort("'reportUndefinedSymbols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "DLFCN")) Module["DLFCN"] = function() {
     abort("'DLFCN' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "LDSO")) Module["LDSO"] = function() {
     abort("'LDSO' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "createInvokeFunction")) Module["createInvokeFunction"] = function() {
     abort("'createInvokeFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getMemory")) Module["getMemory"] = function() {
     abort("'getMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getDylinkMetadata")) Module["getDylinkMetadata"] = function() {
     abort("'getDylinkMetadata' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "mergeLibSymbols")) Module["mergeLibSymbols"] = function() {
     abort("'mergeLibSymbols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule")) Module["loadWebAssemblyModule"] = function() {
     abort("'loadWebAssemblyModule' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary")) Module["loadDynamicLibrary"] = function() {
     abort("'loadDynamicLibrary' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "preloadDylibs")) Module["preloadDylibs"] = function() {
     abort("'preloadDylibs' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "dlopenInternal")) Module["dlopenInternal"] = function() {
     abort("'dlopenInternal' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = function() {
     abort("'uncaughtExceptionCount' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = function() {
     abort("'exceptionLast' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = function() {
     abort("'exceptionCaught' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = function() {
     abort("'ExceptionInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = function() {
     abort("'CatchInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = function() {
     abort("'exception_addRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = function() {
     abort("'exception_decRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function() {
     abort("'Browser' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = function() {
     abort("'funcWrappers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() {
     abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = function() {
     abort("'setMainLoop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "wget")) Module["wget"] = function() {
     abort("'wget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray")) Module["tempFixedLengthArray"] = function() {
     abort("'tempFixedLengthArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers")) Module["miniTempWebGLFloatBuffers"] = function() {
     abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType")) Module["heapObjectForWebGLType"] = function() {
     abort("'heapObjectForWebGLType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap")) Module["heapAccessShiftForWebGLHeap"] = function() {
     abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() {
     abort("'GL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = function() {
     abort("'emscriptenWebGLGet' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize")) Module["computeUnpackAlignedImageSize"] = function() {
     abort("'computeUnpackAlignedImageSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = function() {
     abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = function() {
     abort("'emscriptenWebGLGetUniform' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "webglGetUniformLocation")) Module["webglGetUniformLocation"] = function() {
     abort("'webglGetUniformLocation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "webglPrepareUniformLocationsBeforeFirstUse")) Module["webglPrepareUniformLocationsBeforeFirstUse"] = function() {
     abort("'webglPrepareUniformLocationsBeforeFirstUse' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "webglGetLeftBracePos")) Module["webglGetLeftBracePos"] = function() {
     abort("'webglGetLeftBracePos' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = function() {
     abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = function() {
     abort("'writeGLArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = function() {
     abort("'AL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function() {
     abort("'SDL_unicode' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function() {
     abort("'SDL_ttfContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function() {
     abort("'SDL_audio' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function() {
     abort("'SDL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function() {
     abort("'SDL_gfx' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = function() {
     abort("'GLUT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = function() {
     abort("'EGL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = function() {
     abort("'GLFW_Window' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = function() {
     abort("'GLFW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = function() {
     abort("'GLEW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = function() {
     abort("'IDBStore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = function() {
     abort("'runAndAbortIfError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() {
     abort("'warnOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() {
     abort("'stackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() {
     abort("'stackRestore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() {
     abort("'stackAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() {
     abort("'AsciiToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() {
     abort("'stringToAscii' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() {
     abort("'UTF16ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() {
     abort("'stringToUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() {
     abort("'lengthBytesUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() {
     abort("'UTF32ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() {
     abort("'stringToUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() {
     abort("'lengthBytesUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() {
     abort("'allocateUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() {
     abort("'allocateUTF8OnStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
    };
    Module["writeStackCookie"] = writeStackCookie;
    Module["checkStackCookie"] = checkStackCookie;
    if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", {
     configurable: true,
     get: function() {
      abort("'ALLOC_NORMAL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
     }
    });
    if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", {
     configurable: true,
     get: function() {
      abort("'ALLOC_STACK' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
     }
    });
    var calledRun;
    function ExitStatus(status) {
     this.name = "ExitStatus";
     this.message = "Program terminated with exit(" + status + ")";
     this.status = status;
    }
    var calledMain = false;
    dependenciesFulfilled = function runCaller() {
     if (!calledRun) run();
     if (!calledRun) dependenciesFulfilled = runCaller;
    };
    function callMain(args) {
     assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
     assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
     var entryFunction = Module["_main"];
     if (!entryFunction) return;
     args = args || [];
     var argc = args.length + 1;
     var argv = stackAlloc((argc + 1) * 4);
     SAFE_HEAP_STORE((argv >> 2) * 4, allocateUTF8OnStack(thisProgram), 4);
     for (var i = 1; i < argc; i++) {
      SAFE_HEAP_STORE(((argv >> 2) + i) * 4, allocateUTF8OnStack(args[i - 1]), 4);
     }
     SAFE_HEAP_STORE(((argv >> 2) + argc) * 4, 0, 4);
     try {
      var ret = entryFunction(argc, argv);
      exit(ret, true);
     } catch (e) {
      if (e instanceof ExitStatus || e == "unwind") {
       return;
      }
      var toLog = e;
      if (e && typeof e === "object" && e.stack) {
       toLog = [ e, e.stack ];
      }
      err("exception thrown: " + toLog);
      quit_(1, e);
     } finally {
      calledMain = true;
     }
    }
    function stackCheckInit() {
     _emscripten_stack_set_limits(5251008, 8128);
     writeStackCookie();
    }
    var dylibsLoaded = false;
    function run(args) {
     args = args || arguments_;
     if (runDependencies > 0) {
      return;
     }
     stackCheckInit();
     if (!dylibsLoaded) {
      preloadDylibs();
      dylibsLoaded = true;
      if (runDependencies > 0) {
       return;
      }
     }
     preRun();
     if (runDependencies > 0) {
      return;
     }
     function doRun() {
      if (calledRun) return;
      calledRun = true;
      Module["calledRun"] = true;
      if (ABORT) return;
      initRuntime();
      preMain();
      if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
      if (shouldRunNow) callMain(args);
      postRun();
     }
     if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(function() {
       setTimeout(function() {
        Module["setStatus"]("");
       }, 1);
       doRun();
      }, 1);
     } else {
      doRun();
     }
     checkStackCookie();
    }
    Module["run"] = run;
    function checkUnflushedContent() {
     var oldOut = out;
     var oldErr = err;
     var has = false;
     out = err = function(x) {
      has = true;
     };
     try {
      var flush = Module["_fflush"];
      if (flush) flush(0);
     } catch (e) {}
     out = oldOut;
     err = oldErr;
     if (has) {
      warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
      warnOnce("(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)");
     }
    }
    function exit(status, implicit) {
     EXITSTATUS = status;
     checkUnflushedContent();
     if (keepRuntimeAlive()) {
      if (!implicit) {
       var msg = "program exited (with status: " + status + "), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)";
       err(msg);
      }
     } else {
      exitRuntime();
     }
     procExit(status);
    }
    function procExit(code) {
     EXITSTATUS = code;
     if (!keepRuntimeAlive()) {
      if (Module["onExit"]) Module["onExit"](code);
      ABORT = true;
     }
     quit_(code, new ExitStatus(code));
    }
    if (Module["preInit"]) {
     if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
     while (Module["preInit"].length > 0) {
      Module["preInit"].pop()();
     }
    }
    var shouldRunNow = true;
    if (Module["noInitialRun"]) shouldRunNow = false;
    run();
    const C = Module;
    const INTERNAL = {};
    const SIZE_OF_INT = 4;
    const SIZE_OF_NODE = 5 * SIZE_OF_INT;
    const SIZE_OF_POINT = 2 * SIZE_OF_INT;
    const SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
    const ZERO_POINT = {
     row: 0,
     column: 0
    };
    const QUERY_WORD_REGEX = /[\w-.]*/g;
    const PREDICATE_STEP_TYPE_CAPTURE = 1;
    const PREDICATE_STEP_TYPE_STRING = 2;
    const LANGUAGE_FUNCTION_REGEX = /^_?tree_sitter_\w+/;
    var VERSION;
    var MIN_COMPATIBLE_VERSION;
    var TRANSFER_BUFFER;
    var currentParseCallback;
    var currentLogCallback;
    class ParserImpl {
     static init() {
      TRANSFER_BUFFER = C._ts_init();
      VERSION = getValue(TRANSFER_BUFFER, "i32");
      MIN_COMPATIBLE_VERSION = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
     }
     initialize() {
      C._ts_parser_new_wasm();
      this[0] = getValue(TRANSFER_BUFFER, "i32");
      this[1] = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
     }
     delete() {
      C._ts_parser_delete(this[0]);
      C._free(this[1]);
      this[0] = 0;
      this[1] = 0;
     }
     setLanguage(language) {
      let address;
      if (!language) {
       address = 0;
       language = null;
      } else if (language.constructor === Language) {
       address = language[0];
       const version = C._ts_language_version(address);
       if (version < MIN_COMPATIBLE_VERSION || VERSION < version) {
        throw new Error(`Incompatible language version ${version}. ` + `Compatibility range ${MIN_COMPATIBLE_VERSION} through ${VERSION}.`);
       }
      } else {
       throw new Error("Argument must be a Language");
      }
      this.language = language;
      C._ts_parser_set_language(this[0], address);
      return this;
     }
     getLanguage() {
      return this.language;
     }
     parse(callback, oldTree, options) {
      if (typeof callback === "string") {
       currentParseCallback = ((index, _, endIndex) => callback.slice(index, endIndex));
      } else if (typeof callback === "function") {
       currentParseCallback = callback;
      } else {
       throw new Error("Argument must be a string or a function");
      }
      if (this.logCallback) {
       currentLogCallback = this.logCallback;
       C._ts_parser_enable_logger_wasm(this[0], 1);
      } else {
       currentLogCallback = null;
       C._ts_parser_enable_logger_wasm(this[0], 0);
      }
      let rangeCount = 0;
      let rangeAddress = 0;
      if (options && options.includedRanges) {
       rangeCount = options.includedRanges.length;
       rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
       let address = rangeAddress;
       for (let i = 0; i < rangeCount; i++) {
        marshalRange(address, options.includedRanges[i]);
        address += SIZE_OF_RANGE;
       }
      }
      const treeAddress = C._ts_parser_parse_wasm(this[0], this[1], oldTree ? oldTree[0] : 0, rangeAddress, rangeCount);
      if (!treeAddress) {
       currentParseCallback = null;
       currentLogCallback = null;
       throw new Error("Parsing failed");
      }
      const result = new Tree(INTERNAL, treeAddress, this.language, currentParseCallback);
      currentParseCallback = null;
      currentLogCallback = null;
      return result;
     }
     reset() {
      C._ts_parser_reset(this[0]);
     }
     setTimeoutMicros(timeout) {
      C._ts_parser_set_timeout_micros(this[0], timeout);
     }
     getTimeoutMicros() {
      return C._ts_parser_timeout_micros(this[0]);
     }
     setLogger(callback) {
      if (!callback) {
       callback = null;
      } else if (typeof callback !== "function") {
       throw new Error("Logger callback must be a function");
      }
      this.logCallback = callback;
      return this;
     }
     getLogger() {
      return this.logCallback;
     }
    }
    class Tree {
     constructor(internal, address, language, textCallback) {
      assertInternal(internal);
      this[0] = address;
      this.language = language;
      this.textCallback = textCallback;
     }
     copy() {
      const address = C._ts_tree_copy(this[0]);
      return new Tree(INTERNAL, address, this.language, this.textCallback);
     }
     delete() {
      C._ts_tree_delete(this[0]);
      this[0] = 0;
     }
     edit(edit) {
      marshalEdit(edit);
      C._ts_tree_edit_wasm(this[0]);
     }
     get rootNode() {
      C._ts_tree_root_node_wasm(this[0]);
      return unmarshalNode(this);
     }
     getLanguage() {
      return this.language;
     }
     walk() {
      return this.rootNode.walk();
     }
     getChangedRanges(other) {
      if (other.constructor !== Tree) {
       throw new TypeError("Argument must be a Tree");
      }
      C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
      const count = getValue(TRANSFER_BUFFER, "i32");
      const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
       let address = buffer;
       for (let i = 0; i < count; i++) {
        result[i] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
       }
       C._free(buffer);
      }
      return result;
     }
    }
    class Node {
     constructor(internal, tree) {
      assertInternal(internal);
      this.tree = tree;
     }
     get typeId() {
      marshalNode(this);
      return C._ts_node_symbol_wasm(this.tree[0]);
     }
     get type() {
      return this.tree.language.types[this.typeId] || "ERROR";
     }
     get endPosition() {
      marshalNode(this);
      C._ts_node_end_point_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
     }
     get endIndex() {
      marshalNode(this);
      return C._ts_node_end_index_wasm(this.tree[0]);
     }
     get text() {
      return getText(this.tree, this.startIndex, this.endIndex);
     }
     isNamed() {
      marshalNode(this);
      return C._ts_node_is_named_wasm(this.tree[0]) === 1;
     }
     hasError() {
      marshalNode(this);
      return C._ts_node_has_error_wasm(this.tree[0]) === 1;
     }
     hasChanges() {
      marshalNode(this);
      return C._ts_node_has_changes_wasm(this.tree[0]) === 1;
     }
     isMissing() {
      marshalNode(this);
      return C._ts_node_is_missing_wasm(this.tree[0]) === 1;
     }
     equals(other) {
      return this.id === other.id;
     }
     child(index) {
      marshalNode(this);
      C._ts_node_child_wasm(this.tree[0], index);
      return unmarshalNode(this.tree);
     }
     namedChild(index) {
      marshalNode(this);
      C._ts_node_named_child_wasm(this.tree[0], index);
      return unmarshalNode(this.tree);
     }
     childForFieldId(fieldId) {
      marshalNode(this);
      C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
      return unmarshalNode(this.tree);
     }
     childForFieldName(fieldName) {
      const fieldId = this.tree.language.fields.indexOf(fieldName);
      if (fieldId !== -1) return this.childForFieldId(fieldId);
     }
     get childCount() {
      marshalNode(this);
      return C._ts_node_child_count_wasm(this.tree[0]);
     }
     get namedChildCount() {
      marshalNode(this);
      return C._ts_node_named_child_count_wasm(this.tree[0]);
     }
     get firstChild() {
      return this.child(0);
     }
     get firstNamedChild() {
      return this.namedChild(0);
     }
     get lastChild() {
      return this.child(this.childCount - 1);
     }
     get lastNamedChild() {
      return this.namedChild(this.namedChildCount - 1);
     }
     get children() {
      if (!this._children) {
       marshalNode(this);
       C._ts_node_children_wasm(this.tree[0]);
       const count = getValue(TRANSFER_BUFFER, "i32");
       const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
       this._children = new Array(count);
       if (count > 0) {
        let address = buffer;
        for (let i = 0; i < count; i++) {
         this._children[i] = unmarshalNode(this.tree, address);
         address += SIZE_OF_NODE;
        }
        C._free(buffer);
       }
      }
      return this._children;
     }
     get namedChildren() {
      if (!this._namedChildren) {
       marshalNode(this);
       C._ts_node_named_children_wasm(this.tree[0]);
       const count = getValue(TRANSFER_BUFFER, "i32");
       const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
       this._namedChildren = new Array(count);
       if (count > 0) {
        let address = buffer;
        for (let i = 0; i < count; i++) {
         this._namedChildren[i] = unmarshalNode(this.tree, address);
         address += SIZE_OF_NODE;
        }
        C._free(buffer);
       }
      }
      return this._namedChildren;
     }
     descendantsOfType(types, startPosition, endPosition) {
      if (!Array.isArray(types)) types = [ types ];
      if (!startPosition) startPosition = ZERO_POINT;
      if (!endPosition) endPosition = ZERO_POINT;
      const symbols = [];
      const typesBySymbol = this.tree.language.types;
      for (let i = 0, n = typesBySymbol.length; i < n; i++) {
       if (types.includes(typesBySymbol[i])) {
        symbols.push(i);
       }
      }
      const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
      for (let i = 0, n = symbols.length; i < n; i++) {
       setValue(symbolsAddress + i * SIZE_OF_INT, symbols[i], "i32");
      }
      marshalNode(this);
      C._ts_node_descendants_of_type_wasm(this.tree[0], symbolsAddress, symbols.length, startPosition.row, startPosition.column, endPosition.row, endPosition.column);
      const descendantCount = getValue(TRANSFER_BUFFER, "i32");
      const descendantAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(descendantCount);
      if (descendantCount > 0) {
       let address = descendantAddress;
       for (let i = 0; i < descendantCount; i++) {
        result[i] = unmarshalNode(this.tree, address);
        address += SIZE_OF_NODE;
       }
      }
      C._free(descendantAddress);
      C._free(symbolsAddress);
      return result;
     }
     get nextSibling() {
      marshalNode(this);
      C._ts_node_next_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     get previousSibling() {
      marshalNode(this);
      C._ts_node_prev_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     get nextNamedSibling() {
      marshalNode(this);
      C._ts_node_next_named_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     get previousNamedSibling() {
      marshalNode(this);
      C._ts_node_prev_named_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     get parent() {
      marshalNode(this);
      C._ts_node_parent_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     descendantForIndex(start, end = start) {
      if (typeof start !== "number" || typeof end !== "number") {
       throw new Error("Arguments must be numbers");
      }
      marshalNode(this);
      let address = TRANSFER_BUFFER + SIZE_OF_NODE;
      setValue(address, start, "i32");
      setValue(address + SIZE_OF_INT, end, "i32");
      C._ts_node_descendant_for_index_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     namedDescendantForIndex(start, end = start) {
      if (typeof start !== "number" || typeof end !== "number") {
       throw new Error("Arguments must be numbers");
      }
      marshalNode(this);
      let address = TRANSFER_BUFFER + SIZE_OF_NODE;
      setValue(address, start, "i32");
      setValue(address + SIZE_OF_INT, end, "i32");
      C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     descendantForPosition(start, end = start) {
      if (!isPoint(start) || !isPoint(end)) {
       throw new Error("Arguments must be {row, column} objects");
      }
      marshalNode(this);
      let address = TRANSFER_BUFFER + SIZE_OF_NODE;
      marshalPoint(address, start);
      marshalPoint(address + SIZE_OF_POINT, end);
      C._ts_node_descendant_for_position_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     namedDescendantForPosition(start, end = start) {
      if (!isPoint(start) || !isPoint(end)) {
       throw new Error("Arguments must be {row, column} objects");
      }
      marshalNode(this);
      let address = TRANSFER_BUFFER + SIZE_OF_NODE;
      marshalPoint(address, start);
      marshalPoint(address + SIZE_OF_POINT, end);
      C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     walk() {
      marshalNode(this);
      C._ts_tree_cursor_new_wasm(this.tree[0]);
      return new TreeCursor(INTERNAL, this.tree);
     }
     toString() {
      marshalNode(this);
      const address = C._ts_node_to_string_wasm(this.tree[0]);
      const result = AsciiToString(address);
      C._free(address);
      return result;
     }
    }
    class TreeCursor {
     constructor(internal, tree) {
      assertInternal(internal);
      this.tree = tree;
      unmarshalTreeCursor(this);
     }
     delete() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_delete_wasm(this.tree[0]);
      this[0] = this[1] = this[2] = 0;
     }
     reset(node) {
      marshalNode(node);
      marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
      C._ts_tree_cursor_reset_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
     }
     get nodeType() {
      return this.tree.language.types[this.nodeTypeId] || "ERROR";
     }
     get nodeTypeId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
     }
     get nodeId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
     }
     get nodeIsNamed() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1;
     }
     get nodeIsMissing() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1;
     }
     get nodeText() {
      marshalTreeCursor(this);
      const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
      const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
      return getText(this.tree, startIndex, endIndex);
     }
     get startPosition() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_start_position_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
     }
     get endPosition() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_end_position_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
     }
     get startIndex() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_start_index_wasm(this.tree[0]);
     }
     get endIndex() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_end_index_wasm(this.tree[0]);
     }
     currentNode() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_current_node_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
     }
     currentFieldId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
     }
     currentFieldName() {
      return this.tree.language.fields[this.currentFieldId()];
     }
     gotoFirstChild() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
     }
     gotoNextSibling() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
     }
     gotoParent() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
     }
    }
    class Language {
     constructor(internal, address) {
      assertInternal(internal);
      this[0] = address;
      this.types = new Array(C._ts_language_symbol_count(this[0]));
      for (let i = 0, n = this.types.length; i < n; i++) {
       if (C._ts_language_symbol_type(this[0], i) < 2) {
        this.types[i] = UTF8ToString(C._ts_language_symbol_name(this[0], i));
       }
      }
      this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
      for (let i = 0, n = this.fields.length; i < n; i++) {
       const fieldName = C._ts_language_field_name_for_id(this[0], i);
       if (fieldName !== 0) {
        this.fields[i] = UTF8ToString(fieldName);
       } else {
        this.fields[i] = null;
       }
      }
     }
     get version() {
      return C._ts_language_version(this[0]);
     }
     get fieldCount() {
      return this.fields.length - 1;
     }
     fieldIdForName(fieldName) {
      const result = this.fields.indexOf(fieldName);
      if (result !== -1) {
       return result;
      } else {
       return null;
      }
     }
     fieldNameForId(fieldId) {
      return this.fields[fieldId] || null;
     }
     idForNodeType(type, named) {
      const typeLength = lengthBytesUTF8(type);
      const typeAddress = C._malloc(typeLength + 1);
      stringToUTF8(type, typeAddress, typeLength + 1);
      const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named);
      C._free(typeAddress);
      return result || null;
     }
     get nodeTypeCount() {
      return C._ts_language_symbol_count(this[0]);
     }
     nodeTypeForId(typeId) {
      const name = C._ts_language_symbol_name(this[0], typeId);
      return name ? UTF8ToString(name) : null;
     }
     nodeTypeIsNamed(typeId) {
      return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false;
     }
     nodeTypeIsVisible(typeId) {
      return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false;
     }
     query(source) {
      const sourceLength = lengthBytesUTF8(source);
      const sourceAddress = C._malloc(sourceLength + 1);
      stringToUTF8(source, sourceAddress, sourceLength + 1);
      const address = C._ts_query_new(this[0], sourceAddress, sourceLength, TRANSFER_BUFFER, TRANSFER_BUFFER + SIZE_OF_INT);
      if (!address) {
       const errorId = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
       const errorByte = getValue(TRANSFER_BUFFER, "i32");
       const errorIndex = UTF8ToString(sourceAddress, errorByte).length;
       const suffix = source.substr(errorIndex, 100).split("\n")[0];
       let word = suffix.match(QUERY_WORD_REGEX)[0];
       let error;
       switch (errorId) {
       case 2:
        error = new RangeError(`Bad node name '${word}'`);
        break;

       case 3:
        error = new RangeError(`Bad field name '${word}'`);
        break;

       case 4:
        error = new RangeError(`Bad capture name @${word}`);
        break;

       case 5:
        error = new TypeError(`Bad pattern structure at offset ${errorIndex}: '${suffix}'...`);
        word = "";
        break;

       default:
        error = new SyntaxError(`Bad syntax at offset ${errorIndex}: '${suffix}'...`);
        word = "";
        break;
       }
       error.index = errorIndex;
       error.length = word.length;
       C._free(sourceAddress);
       throw error;
      }
      const stringCount = C._ts_query_string_count(address);
      const captureCount = C._ts_query_capture_count(address);
      const patternCount = C._ts_query_pattern_count(address);
      const captureNames = new Array(captureCount);
      const stringValues = new Array(stringCount);
      for (let i = 0; i < captureCount; i++) {
       const nameAddress = C._ts_query_capture_name_for_id(address, i, TRANSFER_BUFFER);
       const nameLength = getValue(TRANSFER_BUFFER, "i32");
       captureNames[i] = UTF8ToString(nameAddress, nameLength);
      }
      for (let i = 0; i < stringCount; i++) {
       const valueAddress = C._ts_query_string_value_for_id(address, i, TRANSFER_BUFFER);
       const nameLength = getValue(TRANSFER_BUFFER, "i32");
       stringValues[i] = UTF8ToString(valueAddress, nameLength);
      }
      const setProperties = new Array(patternCount);
      const assertedProperties = new Array(patternCount);
      const refutedProperties = new Array(patternCount);
      const predicates = new Array(patternCount);
      const textPredicates = new Array(patternCount);
      for (let i = 0; i < patternCount; i++) {
       const predicatesAddress = C._ts_query_predicates_for_pattern(address, i, TRANSFER_BUFFER);
       const stepCount = getValue(TRANSFER_BUFFER, "i32");
       predicates[i] = [];
       textPredicates[i] = [];
       const steps = [];
       let stepAddress = predicatesAddress;
       for (let j = 0; j < stepCount; j++) {
        const stepType = getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        const stepValueId = getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
         steps.push({
          type: "capture",
          name: captureNames[stepValueId]
         });
        } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
         steps.push({
          type: "string",
          value: stringValues[stepValueId]
         });
        } else if (steps.length > 0) {
         if (steps[0].type !== "string") {
          throw new Error("Predicates must begin with a literal value");
         }
         const operator = steps[0].value;
         let isPositive = true;
         switch (operator) {
         case "not-eq?":
          isPositive = false;

         case "eq?":
          if (steps.length !== 3) throw new Error(`Wrong number of arguments to \`#eq?\` predicate. Expected 2, got ${steps.length - 1}`);
          if (steps[1].type !== "capture") throw new Error(`First argument of \`#eq?\` predicate must be a capture. Got "${steps[1].value}"`);
          if (steps[2].type === "capture") {
           const captureName1 = steps[1].name;
           const captureName2 = steps[2].name;
           textPredicates[i].push(function(captures) {
            let node1, node2;
            for (const c of captures) {
             if (c.name === captureName1) node1 = c.node;
             if (c.name === captureName2) node2 = c.node;
            }
            if (node1 === undefined || node2 === undefined) return true;
            return node1.text === node2.text === isPositive;
           });
          } else {
           const captureName = steps[1].name;
           const stringValue = steps[2].value;
           textPredicates[i].push(function(captures) {
            for (const c of captures) {
             if (c.name === captureName) {
              return c.node.text === stringValue === isPositive;
             }
            }
            return true;
           });
          }
          break;

         case "not-match?":
          isPositive = false;

         case "match?":
          if (steps.length !== 3) throw new Error(`Wrong number of arguments to \`#match?\` predicate. Expected 2, got ${steps.length - 1}.`);
          if (steps[1].type !== "capture") throw new Error(`First argument of \`#match?\` predicate must be a capture. Got "${steps[1].value}".`);
          if (steps[2].type !== "string") throw new Error(`Second argument of \`#match?\` predicate must be a string. Got @${steps[2].value}.`);
          const captureName = steps[1].name;
          const regex = new RegExp(steps[2].value);
          textPredicates[i].push(function(captures) {
           for (const c of captures) {
            if (c.name === captureName) return regex.test(c.node.text) === isPositive;
           }
           return true;
          });
          break;

         case "set!":
          if (steps.length < 2 || steps.length > 3) throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
          if (steps.some(s => s.type !== "string")) throw new Error(`Arguments to \`#set!\` predicate must be a strings.".`);
          if (!setProperties[i]) setProperties[i] = {};
          setProperties[i][steps[1].value] = steps[2] ? steps[2].value : null;
          break;

         case "is?":
         case "is-not?":
          if (steps.length < 2 || steps.length > 3) throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
          if (steps.some(s => s.type !== "string")) throw new Error(`Arguments to \`#${operator}\` predicate must be a strings.".`);
          const properties = operator === "is?" ? assertedProperties : refutedProperties;
          if (!properties[i]) properties[i] = {};
          properties[i][steps[1].value] = steps[2] ? steps[2].value : null;
          break;

         default:
          predicates[i].push({
           operator: operator,
           operands: steps.slice(1)
          });
         }
         steps.length = 0;
        }
       }
       Object.freeze(setProperties[i]);
       Object.freeze(assertedProperties[i]);
       Object.freeze(refutedProperties[i]);
      }
      C._free(sourceAddress);
      return new Query(INTERNAL, address, captureNames, textPredicates, predicates, Object.freeze(setProperties), Object.freeze(assertedProperties), Object.freeze(refutedProperties));
     }
     static load(input) {
      let bytes;
      if (input instanceof Uint8Array) {
       bytes = Promise.resolve(input);
      } else {
       const url = input;
       if (typeof process !== "undefined" && process.versions && process.versions.node) {
        const fs = require("fs");
        bytes = Promise.resolve(fs.readFileSync(url));
       } else {
        bytes = fetch(url).then(response => response.arrayBuffer().then(buffer => {
         if (response.ok) {
          return new Uint8Array(buffer);
         } else {
          const body = new TextDecoder("utf-8").decode(buffer);
          throw new Error(`Language.load failed with status ${response.status}.\n\n${body}`);
         }
        }));
       }
      }
      const loadModule = typeof loadSideModule === "function" ? loadSideModule : loadWebAssemblyModule;
      return bytes.then(bytes => loadModule(bytes, {
       loadAsync: true
      })).then(mod => {
       const symbolNames = Object.keys(mod);
       const functionName = symbolNames.find(key => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
       if (!functionName) {
        console.log(`Couldn't find language function in WASM file. Symbols:\n${JSON.stringify(symbolNames, null, 2)}`);
       }
       const languageAddress = mod[functionName]();
       return new Language(INTERNAL, languageAddress);
      });
     }
    }
    class Query {
     constructor(internal, address, captureNames, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
      assertInternal(internal);
      this[0] = address;
      this.captureNames = captureNames;
      this.textPredicates = textPredicates;
      this.predicates = predicates;
      this.setProperties = setProperties;
      this.assertedProperties = assertedProperties;
      this.refutedProperties = refutedProperties;
      this.exceededMatchLimit = false;
     }
     delete() {
      C._ts_query_delete(this[0]);
      this[0] = 0;
     }
     matches(node, startPosition, endPosition, options) {
      if (!startPosition) startPosition = ZERO_POINT;
      if (!endPosition) endPosition = ZERO_POINT;
      if (!options) options = {};
      let matchLimit = options.matchLimit;
      if (typeof matchLimit === "undefined") {
       matchLimit = 0;
      } else if (typeof matchLimit !== "number") {
       throw new Error("Arguments must be numbers");
      }
      marshalNode(node);
      C._ts_query_matches_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, matchLimit);
      const rawCount = getValue(TRANSFER_BUFFER, "i32");
      const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
      const result = new Array(rawCount);
      this.exceededMatchLimit = !!didExceedMatchLimit;
      let filteredCount = 0;
      let address = startAddress;
      for (let i = 0; i < rawCount; i++) {
       const pattern = getValue(address, "i32");
       address += SIZE_OF_INT;
       const captureCount = getValue(address, "i32");
       address += SIZE_OF_INT;
       const captures = new Array(captureCount);
       address = unmarshalCaptures(this, node.tree, address, captures);
       if (this.textPredicates[pattern].every(p => p(captures))) {
        result[filteredCount++] = {
         pattern: pattern,
         captures: captures
        };
        const setProperties = this.setProperties[pattern];
        if (setProperties) result[i].setProperties = setProperties;
        const assertedProperties = this.assertedProperties[pattern];
        if (assertedProperties) result[i].assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[pattern];
        if (refutedProperties) result[i].refutedProperties = refutedProperties;
       }
      }
      result.length = filteredCount;
      C._free(startAddress);
      return result;
     }
     captures(node, startPosition, endPosition, options) {
      if (!startPosition) startPosition = ZERO_POINT;
      if (!endPosition) endPosition = ZERO_POINT;
      if (!options) options = {};
      let matchLimit = options.matchLimit;
      if (typeof matchLimit === "undefined") {
       matchLimit = 0;
      } else if (typeof matchLimit !== "number") {
       throw new Error("Arguments must be numbers");
      }
      marshalNode(node);
      C._ts_query_captures_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, matchLimit);
      const count = getValue(TRANSFER_BUFFER, "i32");
      const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
      const result = [];
      this.exceededMatchLimit = !!didExceedMatchLimit;
      const captures = [];
      let address = startAddress;
      for (let i = 0; i < count; i++) {
       const pattern = getValue(address, "i32");
       address += SIZE_OF_INT;
       const captureCount = getValue(address, "i32");
       address += SIZE_OF_INT;
       const captureIndex = getValue(address, "i32");
       address += SIZE_OF_INT;
       captures.length = captureCount;
       address = unmarshalCaptures(this, node.tree, address, captures);
       if (this.textPredicates[pattern].every(p => p(captures))) {
        const capture = captures[captureIndex];
        const setProperties = this.setProperties[pattern];
        if (setProperties) capture.setProperties = setProperties;
        const assertedProperties = this.assertedProperties[pattern];
        if (assertedProperties) capture.assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[pattern];
        if (refutedProperties) capture.refutedProperties = refutedProperties;
        result.push(capture);
       }
      }
      C._free(startAddress);
      return result;
     }
     predicatesForPattern(patternIndex) {
      return this.predicates[patternIndex];
     }
     didExceedMatchLimit() {
      return this.exceededMatchLimit;
     }
    }
    function getText(tree, startIndex, endIndex) {
     const length = endIndex - startIndex;
     let result = tree.textCallback(startIndex, null, endIndex);
     startIndex += result.length;
     while (startIndex < endIndex) {
      const string = tree.textCallback(startIndex, null, endIndex);
      if (string && string.length > 0) {
       startIndex += string.length;
       result += string;
      } else {
       break;
      }
     }
     if (startIndex > endIndex) {
      result = result.slice(0, length);
     }
     return result;
    }
    function unmarshalCaptures(query, tree, address, result) {
     for (let i = 0, n = result.length; i < n; i++) {
      const captureIndex = getValue(address, "i32");
      address += SIZE_OF_INT;
      const node = unmarshalNode(tree, address);
      address += SIZE_OF_NODE;
      result[i] = {
       name: query.captureNames[captureIndex],
       node: node
      };
     }
     return address;
    }
    function assertInternal(x) {
     if (x !== INTERNAL) throw new Error("Illegal constructor");
    }
    function isPoint(point) {
     return point && typeof point.row === "number" && typeof point.column === "number";
    }
    function marshalNode(node) {
     let address = TRANSFER_BUFFER;
     setValue(address, node.id, "i32");
     address += SIZE_OF_INT;
     setValue(address, node.startIndex, "i32");
     address += SIZE_OF_INT;
     setValue(address, node.startPosition.row, "i32");
     address += SIZE_OF_INT;
     setValue(address, node.startPosition.column, "i32");
     address += SIZE_OF_INT;
     setValue(address, node[0], "i32");
    }
    function unmarshalNode(tree, address = TRANSFER_BUFFER) {
     const id = getValue(address, "i32");
     address += SIZE_OF_INT;
     if (id === 0) return null;
     const index = getValue(address, "i32");
     address += SIZE_OF_INT;
     const row = getValue(address, "i32");
     address += SIZE_OF_INT;
     const column = getValue(address, "i32");
     address += SIZE_OF_INT;
     const other = getValue(address, "i32");
     const result = new Node(INTERNAL, tree);
     result.id = id;
     result.startIndex = index;
     result.startPosition = {
      row: row,
      column: column
     };
     result[0] = other;
     return result;
    }
    function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
     setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32"), setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32"), 
     setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32");
    }
    function unmarshalTreeCursor(cursor) {
     cursor[0] = getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32"), cursor[1] = getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32"), 
     cursor[2] = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    }
    function marshalPoint(address, point) {
     setValue(address, point.row, "i32");
     setValue(address + SIZE_OF_INT, point.column, "i32");
    }
    function unmarshalPoint(address) {
     return {
      row: getValue(address, "i32"),
      column: getValue(address + SIZE_OF_INT, "i32")
     };
    }
    function marshalRange(address, range) {
     marshalPoint(address, range.startPosition);
     address += SIZE_OF_POINT;
     marshalPoint(address, range.endPosition);
     address += SIZE_OF_POINT;
     setValue(address, range.startIndex, "i32");
     address += SIZE_OF_INT;
     setValue(address, range.endIndex, "i32");
     address += SIZE_OF_INT;
    }
    function unmarshalRange(address) {
     const result = {};
     result.startPosition = unmarshalPoint(address);
     address += SIZE_OF_POINT;
     result.endPosition = unmarshalPoint(address);
     address += SIZE_OF_POINT;
     result.startIndex = getValue(address, "i32");
     address += SIZE_OF_INT;
     result.endIndex = getValue(address, "i32");
     return result;
    }
    function marshalEdit(edit) {
     let address = TRANSFER_BUFFER;
     marshalPoint(address, edit.startPosition);
     address += SIZE_OF_POINT;
     marshalPoint(address, edit.oldEndPosition);
     address += SIZE_OF_POINT;
     marshalPoint(address, edit.newEndPosition);
     address += SIZE_OF_POINT;
     setValue(address, edit.startIndex, "i32");
     address += SIZE_OF_INT;
     setValue(address, edit.oldEndIndex, "i32");
     address += SIZE_OF_INT;
     setValue(address, edit.newEndIndex, "i32");
     address += SIZE_OF_INT;
    }
    for (const name of Object.getOwnPropertyNames(ParserImpl.prototype)) {
     Object.defineProperty(Parser.prototype, name, {
      value: ParserImpl.prototype[name],
      enumerable: false,
      writable: false
     });
    }
    Parser.Language = Language;
    Module.onRuntimeInitialized = (() => {
     ParserImpl.init();
     resolveInitPromise();
    });
   });
  }
 }
 return Parser;
}();

if (typeof exports === "object") {
 module.exports = TreeSitter;
}
