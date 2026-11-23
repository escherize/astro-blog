// main.js
import * as THREE from "three";

// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array, tail) {
    return toList(array, tail);
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  let t = tail || List$Empty$const;
  for (let i = elements.length - 1; i >= 0; --i) {
    t = new NonEmpty(elements[i], t);
  }
  return t;
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var List$Empty$const = new Empty();
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index2) {
    if (index2 < 0 || index2 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index2);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {number}
   */
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index2) {
  if (bitOffset === 0) {
    return buffer[index2] ?? 0;
  } else {
    const a = buffer[index2] << bitOffset & 255;
    const b = buffer[index2 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var Result = class _Result extends CustomType {
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
};
var Result$Ok = (value) => new Ok(value);
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
};
var Result$Error = (detail) => new Error(detail);
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys3, get2] = getters(a);
    const ka = keys3(a);
    const kb = keys3(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      values3.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object) {
  if (object instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function remainderInt(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a % b;
  }
}
function divideInt(a, b) {
  return Math.trunc(divideFloat(a, b));
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v2) => {
      h = h + getHash(v2) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v2, k) => {
      h = h + hashMerge(getHash(v2), getHash(k)) | 0;
    });
  } else {
    const keys3 = Object.keys(o);
    for (let i = 0; i < keys3.length; i++) {
      const k = keys3[i];
      const v2 = o[k];
      h = h + hashMerge(getHash(v2), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var Dict = class {
  constructor(size4, root) {
    this.size = size4;
    this.root = root;
  }
};
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = Symbol();
var Node = class _Node {
  constructor(generation, datamap, nodemap, data) {
    this.datamap = datamap;
    this.nodemap = nodemap;
    this.data = data;
    this.generation = generation;
  }
  equals(other) {
    if (this === other) return true;
    if (!(other instanceof _Node)) return false;
    if (this.datamap !== other.datamap || this.nodemap !== other.nodemap) {
      return false;
    }
    const leftData = this.data;
    const rightData = other.data;
    if (leftData.length !== rightData.length) return false;
    if (this.datamap === 0 && this.nodemap === 0) {
      return this.#equalsOverflowEntries(rightData);
    }
    const edgesStart = leftData.length - popcount(this.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      if (!isEqual(leftData[i], rightData[i]) || !isEqual(leftData[i + 1], rightData[i + 1])) {
        return false;
      }
    }
    for (let i = edgesStart; i < leftData.length; ++i) {
      if (!leftData[i].equals(rightData[i])) return false;
    }
    return true;
  }
  #equalsOverflowEntries(otherData) {
    const data = this.data;
    entries: for (let i = 0; i < data.length; i += 2) {
      for (let j = 0; j < otherData.length; j += 2) {
        if (isEqual(data[i], otherData[j])) {
          if (!isEqual(data[i + 1], otherData[j + 1])) return false;
          continue entries;
        }
      }
      return false;
    }
    return true;
  }
  hashCode() {
    const data = this.data;
    const edgesStart = data.length - popcount(this.nodemap);
    let hash = 0;
    for (let i = 0; i < edgesStart; i += 2) {
      hash = hash + hashMerge(getHash(data[i + 1]), getHash(data[i])) | 0;
    }
    for (let i = edgesStart; i < data.length; ++i) {
      hash = hash + data[i].hashCode() | 0;
    }
    return hash;
  }
};
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
var errorNil = /* @__PURE__ */ Result$Error(void 0);
function newNode(generation) {
  return new Node(generation, 0, 0, []);
}
function copyNode(node, generation) {
  if (node.generation === generation) {
    return node;
  }
  const newData = node.data.slice(0);
  return new Node(generation, node.datamap, node.nodemap, newData);
}
function copyAndSet(node, generation, idx, val) {
  if (node.data[idx] === val) {
    return node;
  }
  node = copyNode(node, generation);
  node.data[idx] = val;
  return node;
}
function copyAndInsertPair(node, generation, bit, idx, key2, val) {
  const data = node.data;
  const length3 = data.length;
  const newData = new Array(length3 + 2);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < idx) newData[writeIndex++] = data[readIndex++];
  newData[writeIndex++] = key2;
  newData[writeIndex++] = val;
  while (readIndex < length3) newData[writeIndex++] = data[readIndex++];
  return new Node(generation, node.datamap | bit, node.nodemap, newData);
}
function make() {
  return emptyDict;
}
function get(dict, key2) {
  const result = lookup(dict.root, key2, getHash(key2));
  return result !== noElementMarker ? Result$Ok(result) : errorNil;
}
function has(dict, key2) {
  return lookup(dict.root, key2, getHash(key2)) !== noElementMarker;
}
function lookup(node, key2, hash) {
  for (let shift = 0; shift < 32; shift += bits) {
    const data = node.data;
    const bit = hashbit(hash, shift);
    if (node.nodemap & bit) {
      node = data[data.length - 1 - index(node.nodemap, bit)];
    } else if (node.datamap & bit) {
      const dataidx = Math.imul(index(node.datamap, bit), 2);
      return isEqual(key2, data[dataidx]) ? data[dataidx + 1] : noElementMarker;
    } else {
      return noElementMarker;
    }
  }
  const overflow = node.data;
  for (let i = 0; i < overflow.length; i += 2) {
    if (isEqual(key2, overflow[i])) {
      return overflow[i + 1];
    }
  }
  return noElementMarker;
}
function toTransient(dict) {
  return {
    generation: nextGeneration(dict),
    root: dict.root,
    size: dict.size,
    dict
  };
}
function fromTransient(transient) {
  if (transient.root === transient.dict.root) {
    return transient.dict;
  }
  return new Dict(transient.size, transient.root);
}
function nextGeneration(dict) {
  const root = dict.root;
  if (root.generation < Number.MAX_SAFE_INTEGER) {
    return root.generation + 1;
  }
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    node.generation = 0;
    const nodeStart = node.data.length - popcount(node.nodemap);
    for (let i = nodeStart; i < node.data.length; ++i) {
      queue.push(node.data[i]);
    }
  }
  return 1;
}
var globalTransient = /* @__PURE__ */ toTransient(emptyDict);
function insert(dict, key2, value) {
  globalTransient.generation = nextGeneration(dict);
  globalTransient.size = dict.size;
  const hash = getHash(key2);
  const root = insertIntoNode(globalTransient, dict.root, key2, value, hash, 0);
  if (root === dict.root) {
    return dict;
  }
  return new Dict(globalTransient.size, root);
}
function destructiveTransientInsert(key2, value, transient) {
  const hash = getHash(key2);
  transient.root = insertIntoNode(transient, transient.root, key2, value, hash, 0);
  return transient;
}
function insertIntoNode(transient, node, key2, value, hash, shift) {
  const data = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0; i < data.length; i += 2) {
      if (isEqual(key2, data[i])) {
        return copyAndSet(node, generation, i + 1, value);
      }
    }
    transient.size += 1;
    return copyAndInsertPair(node, generation, 0, data.length, key2, value);
  }
  const bit = hashbit(hash, shift);
  if (node.nodemap & bit) {
    const nodeidx2 = data.length - 1 - index(node.nodemap, bit);
    let child2 = data[nodeidx2];
    child2 = insertIntoNode(transient, child2, key2, value, hash, shift + bits);
    return copyAndSet(node, generation, nodeidx2, child2);
  }
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.datamap & bit) === 0) {
    transient.size += 1;
    return copyAndInsertPair(node, generation, bit, dataidx, key2, value);
  }
  if (isEqual(key2, data[dataidx])) {
    return copyAndSet(node, generation, dataidx + 1, value);
  }
  const childShift = shift + bits;
  let child = emptyNode;
  child = insertIntoNode(transient, child, key2, value, hash, childShift);
  const key22 = data[dataidx];
  const value2 = data[dataidx + 1];
  const hash2 = getHash(key22);
  child = insertIntoNode(transient, child, key22, value2, hash2, childShift);
  transient.size -= 1;
  const length3 = data.length;
  const nodeidx = length3 - 1 - index(node.nodemap, bit);
  const newData = new Array(length3 - 1);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < dataidx) newData[writeIndex++] = data[readIndex++];
  readIndex += 2;
  while (readIndex <= nodeidx) newData[writeIndex++] = data[readIndex++];
  newData[writeIndex++] = child;
  while (readIndex < length3) newData[writeIndex++] = data[readIndex++];
  return new Node(generation, node.datamap ^ bit, node.nodemap | bit, newData);
}
function fold(dict, state, fun) {
  const queue = [dict.root];
  while (queue.length) {
    const node = queue.pop();
    const data = node.data;
    const edgesStart = data.length - popcount(node.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      state = fun(state, data[i], data[i + 1]);
    }
    for (let i = edgesStart; i < data.length; ++i) {
      queue.push(data[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}
function index(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
function hashbit(hash, shift) {
  return 1 << (hash >>> shift & mask);
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
var Option$None$const = new None();
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first2 = prefix.head;
      let rest = prefix.tail;
      loop$prefix = rest;
      loop$suffix = prepend(first2, suffix);
    }
  }
}
function reverse(list) {
  return reverse_and_prepend(list, List$Empty$const);
}
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result instanceof Ok) {
    let a = result[0];
    return new Some(a);
  } else {
    return Option$None$const;
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return option;
  }
}
function values_loop(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc2);
    } else {
      let $ = list.head;
      if ($ instanceof Some) {
        let rest = list.tail;
        let first2 = $[0];
        loop$list = rest;
        loop$acc = prepend(first2, acc2);
      } else {
        let rest = list.tail;
        loop$list = rest;
        loop$acc = acc2;
      }
    }
  }
}
function values(options) {
  return values_loop(options, List$Empty$const);
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function to_list(dict) {
  return fold(
    dict,
    List$Empty$const,
    (acc2, key2, value) => {
      return prepend([key2, value], acc2);
    }
  );
}
function from_list_loop(loop$transient, loop$list) {
  while (true) {
    let transient = loop$transient;
    let list = loop$list;
    if (list instanceof Empty) {
      return fromTransient(transient);
    } else {
      let rest = list.tail;
      let key2 = list.head[0];
      let value = list.head[1];
      loop$transient = destructiveTransientInsert(key2, value, transient);
      loop$list = rest;
    }
  }
}
function from_list(list) {
  return from_list_loop(toTransient(make()), list);
}
function values2(dict) {
  return fold(
    dict,
    List$Empty$const,
    (acc2, _, value) => {
      return prepend(value, acc2);
    }
  );
}
function upsert(dict, key2, fun) {
  let $ = get(dict, key2);
  if ($ instanceof Ok) {
    let value = $[0];
    return insert(dict, key2, fun(new Some(value)));
  } else {
    return insert(dict, key2, fun(Option$None$const));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Order$Lt$const = new Lt();
var Eq = class extends CustomType {
};
var Order$Eq$const = new Eq();
var Gt = class extends CustomType {
};
var Order$Gt$const = new Gt();

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function absolute_value(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return x * -1;
  }
}
function max(a, b) {
  let $ = a > b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function min(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return Order$Eq$const;
  } else {
    let $1 = a < b;
    if ($1) {
      return Order$Lt$const;
    } else {
      return Order$Gt$const;
    }
  }
}
function sum_loop(loop$numbers, loop$initial) {
  while (true) {
    let numbers = loop$numbers;
    let initial = loop$initial;
    if (numbers instanceof Empty) {
      return initial;
    } else {
      let first2 = numbers.head;
      let rest = numbers.tail;
      loop$numbers = rest;
      loop$initial = first2 + initial;
    }
  }
}
function sum(numbers) {
  return sum_loop(numbers, 0);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Sorting$Ascending$const = new Ascending();
var Descending = class extends CustomType {
};
var Sorting$Descending$const = new Descending();
function length_loop(loop$list, loop$count) {
  while (true) {
    let list = loop$list;
    let count2 = loop$count;
    if (list instanceof Empty) {
      return count2;
    } else {
      let list$1 = list.tail;
      loop$list = list$1;
      loop$count = count2 + 1;
    }
  }
}
function length(list) {
  return length_loop(list, 0);
}
function count_loop(loop$list, loop$predicate, loop$acc) {
  while (true) {
    let list = loop$list;
    let predicate = loop$predicate;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return acc2;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc2 + 1;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc2;
      }
    }
  }
}
function count(list, predicate) {
  return count_loop(list, predicate, 0);
}
function reverse_and_prepend2(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse2(list) {
  return reverse_and_prepend2(list, List$Empty$const);
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list = loop$list;
    let elem = loop$elem;
    if (list instanceof Empty) {
      return false;
    } else {
      let first$1 = list.head;
      if (isEqual(first$1, elem)) {
        return true;
      } else {
        let rest$1 = list.tail;
        loop$list = rest$1;
        loop$elem = elem;
      }
    }
  }
}
function first(list) {
  if (list instanceof Empty) {
    return new Error(void 0);
  } else {
    let first$1 = list.head;
    return new Ok(first$1);
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc2);
      } else {
        _block = acc2;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list, predicate) {
  return filter_loop(list, predicate, List$Empty$const);
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let _block;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        _block = prepend(first$2, acc2);
      } else {
        _block = acc2;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list, fun) {
  return filter_map_loop(list, fun, List$Empty$const);
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc2);
    }
  }
}
function map3(list, fun) {
  return map_loop(list, fun, List$Empty$const);
}
function map_fold_loop(loop$list, loop$fun, loop$acc, loop$list_acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc2 = loop$acc;
    let list_acc = loop$list_acc;
    if (list instanceof Empty) {
      return [acc2, reverse2(list_acc)];
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = fun(acc2, first$1);
      let acc$1 = $[0];
      let first$2 = $[1];
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = acc$1;
      loop$list_acc = prepend(first$2, list_acc);
    }
  }
}
function map_fold(list, initial, fun) {
  return map_fold_loop(list, fun, initial, List$Empty$const);
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let index2 = loop$index;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let acc$1 = prepend(fun(first$1, index2), acc2);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index2 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list, fun) {
  return index_map_loop(list, fun, 0, List$Empty$const);
}
function drop(loop$list, loop$n) {
  while (true) {
    let list = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list;
    } else {
      if (list instanceof Empty) {
        return list;
      } else {
        let rest$1 = list.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function take_loop(loop$list, loop$n, loop$acc) {
  while (true) {
    let list = loop$list;
    let n = loop$n;
    let acc2 = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse2(acc2);
    } else {
      if (list instanceof Empty) {
        return reverse2(acc2);
      } else {
        let first$1 = list.head;
        let rest$1 = list.tail;
        loop$list = rest$1;
        loop$n = n - 1;
        loop$acc = prepend(first$1, acc2);
      }
    }
  }
}
function take(list, n) {
  return take_loop(list, n, List$Empty$const);
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2 instanceof Empty) {
      return second;
    } else {
      let first$1 = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse2(first2), second);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc2 = loop$acc;
    if (lists instanceof Empty) {
      return reverse2(acc2);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend2(list, acc2);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, List$Empty$const);
}
function flat_map(list, fun) {
  return flatten(map3(list, fun));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return initial;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc2 = loop$acc;
    let with$ = loop$with;
    let index2 = loop$index;
    if (over instanceof Empty) {
      return acc2;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc2, first$1, index2);
      loop$with = with$;
      loop$index = index2 + 1;
    }
  }
}
function index_fold(list, initial, fun) {
  return index_fold_loop(list, initial, fun, 0);
}
function find(loop$list, loop$is_desired) {
  while (true) {
    let list = loop$list;
    let is_desired = loop$is_desired;
    if (list instanceof Empty) {
      return new Error(void 0);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = is_desired(first$1);
      if ($) {
        return new Ok(first$1);
      } else {
        loop$list = rest$1;
        loop$is_desired = is_desired;
      }
    }
  }
}
function all(loop$list, loop$predicate) {
  while (true) {
    let list = loop$list;
    let predicate = loop$predicate;
    if (list instanceof Empty) {
      return true;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
      } else {
        return $;
      }
    }
  }
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list = loop$list;
    let predicate = loop$predicate;
    if (list instanceof Empty) {
      return false;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = predicate(first$1);
      if ($) {
        return $;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}
function zip_loop(loop$one, loop$other, loop$acc) {
  while (true) {
    let one = loop$one;
    let other = loop$other;
    let acc2 = loop$acc;
    if (one instanceof Empty) {
      return reverse2(acc2);
    } else if (other instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first_one = one.head;
      let rest_one = one.tail;
      let first_other = other.head;
      let rest_other = other.tail;
      loop$one = rest_one;
      loop$other = rest_other;
      loop$acc = prepend([first_one, first_other], acc2);
    }
  }
}
function zip(list, other) {
  return zip_loop(list, other, List$Empty$const);
}
function unique_loop(loop$list, loop$seen, loop$acc) {
  while (true) {
    let list = loop$list;
    let seen = loop$seen;
    let acc2 = loop$acc;
    if (list instanceof Empty) {
      return reverse2(acc2);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = has(seen, first$1);
      if ($) {
        loop$list = rest$1;
        loop$seen = seen;
        loop$acc = acc2;
      } else {
        loop$list = rest$1;
        loop$seen = insert(seen, first$1, void 0);
        loop$acc = prepend(first$1, acc2);
      }
    }
  }
}
function unique(list) {
  return unique_loop(list, make(), List$Empty$const);
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare3 = loop$compare;
    let acc2 = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend2(list, acc2);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend2(list, acc2);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare3(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc2);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc2);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc2);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare3 = loop$compare;
    let acc2 = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse2(acc2);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse2(prepend(reverse2(sequence), acc2));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare3,
          List$Empty$const
        );
        loop$sequences = rest$1;
        loop$compare = compare3;
        loop$acc = prepend(ascending, acc2);
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare3 = loop$compare;
    let acc2 = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend2(list, acc2);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend2(list, acc2);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare3(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare3;
        loop$acc = prepend(first1, acc2);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc2);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare3;
        loop$acc = prepend(first2, acc2);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare3 = loop$compare;
    let acc2 = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse2(acc2);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse2(prepend(reverse2(sequence), acc2));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare3,
          List$Empty$const
        );
        loop$sequences = rest$1;
        loop$compare = compare3;
        loop$acc = prepend(descending, acc2);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare3 = loop$compare;
    if (sequences2 instanceof Empty) {
      return sequences2;
    } else if (direction instanceof Ascending) {
      if (sequences2.tail instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(
          sequences2,
          compare3,
          List$Empty$const
        );
        loop$sequences = sequences$1;
        loop$direction = Sorting$Descending$const;
        loop$compare = compare3;
      }
    } else if (sequences2.tail instanceof Empty) {
      let sequence = sequences2.head;
      return reverse2(sequence);
    } else {
      let sequences$1 = merge_descending_pairs(
        sequences2,
        compare3,
        List$Empty$const
      );
      loop$sequences = sequences$1;
      loop$direction = Sorting$Ascending$const;
      loop$compare = compare3;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare3 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc2 = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse2(growing$1), acc2);
      } else {
        return prepend(growing$1, acc2);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare3(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare3;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc2;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare3;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc2;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse2(growing$1), acc2);
          } else {
            _block = prepend(growing$1, acc2);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(prepend(new$1, List$Empty$const), acc$1);
          } else {
            let next3 = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare3(new$1, next3);
            if ($1 instanceof Lt) {
              _block$1 = Sorting$Ascending$const;
            } else if ($1 instanceof Eq) {
              _block$1 = Sorting$Ascending$const;
            } else {
              _block$1 = Sorting$Descending$const;
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare3;
            loop$growing = prepend(new$1, List$Empty$const);
            loop$direction = direction$1;
            loop$prev = next3;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse2(growing$1), acc2);
        } else {
          _block = prepend(growing$1, acc2);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(prepend(new$1, List$Empty$const), acc$1);
        } else {
          let next3 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare3(new$1, next3);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare3;
          loop$growing = prepend(new$1, List$Empty$const);
          loop$direction = direction$1;
          loop$prev = next3;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse2(growing$1), acc2);
        } else {
          _block = prepend(growing$1, acc2);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(prepend(new$1, List$Empty$const), acc$1);
        } else {
          let next3 = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare3(new$1, next3);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare3;
          loop$growing = prepend(new$1, List$Empty$const);
          loop$direction = direction$1;
          loop$prev = next3;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc2;
      }
    }
  }
}
function sort(list, compare3) {
  if (list instanceof Empty) {
    return list;
  } else {
    let $ = list.tail;
    if ($ instanceof Empty) {
      return list;
    } else {
      let x = list.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare3(x, y);
      if ($1 instanceof Lt) {
        _block = Sorting$Ascending$const;
      } else if ($1 instanceof Eq) {
        _block = Sorting$Ascending$const;
      } else {
        _block = Sorting$Descending$const;
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare3,
        prepend(x, List$Empty$const),
        direction,
        y,
        List$Empty$const
      );
      return merge_all(sequences$1, Sorting$Ascending$const, compare3);
    }
  }
}
function partition_loop(loop$list, loop$categorise, loop$trues, loop$falses) {
  while (true) {
    let list = loop$list;
    let categorise = loop$categorise;
    let trues = loop$trues;
    let falses = loop$falses;
    if (list instanceof Empty) {
      return [reverse2(trues), reverse2(falses)];
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = categorise(first$1);
      if ($) {
        loop$list = rest$1;
        loop$categorise = categorise;
        loop$trues = prepend(first$1, trues);
        loop$falses = falses;
      } else {
        loop$list = rest$1;
        loop$categorise = categorise;
        loop$trues = trues;
        loop$falses = prepend(first$1, falses);
      }
    }
  }
}
function partition(list, categorise) {
  return partition_loop(list, categorise, List$Empty$const, List$Empty$const);
}
function max_loop(loop$list, loop$compare, loop$max) {
  while (true) {
    let list = loop$list;
    let compare3 = loop$compare;
    let max4 = loop$max;
    if (list instanceof Empty) {
      return max4;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare3(first$1, max4);
      if ($ instanceof Lt) {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$max = max4;
      } else if ($ instanceof Eq) {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$max = max4;
      } else {
        loop$list = rest$1;
        loop$compare = compare3;
        loop$max = first$1;
      }
    }
  }
}
function max2(list, compare3) {
  if (list instanceof Empty) {
    return new Error(void 0);
  } else {
    let first$1 = list.head;
    let rest$1 = list.tail;
    return new Ok(max_loop(rest$1, compare3, first$1));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
var All = class extends CustomType {
};
var Direction$All$const = new All();

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
var Leading = class extends CustomType {
};
var Direction$Leading$const = new Leading();
var Trailing = class extends CustomType {
};
var Direction$Trailing$const = new Trailing();
function replace(string, pattern, substitute) {
  let _pipe = string;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var Missing = class extends CustomType {
};
var Lookup$Missing$const = new Missing();
var InvalidIndex = class extends CustomType {
};
var Lookup$InvalidIndex$const = new InvalidIndex();
var InvalidKey = class extends CustomType {
};
var Lookup$InvalidKey$const = new InvalidKey();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function string_replace(string, target, substitute) {
  return string.replaceAll(target, substitute);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u200E",
  // Left-to-right mark
  "\u200F",
  // Right-to-left mark
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function ceiling(float) {
  return Math.ceil(float);
}
function round2(float) {
  return Math.round(float);
}
function truncate(float) {
  return Math.trunc(float);
}
function power2(base, exponent) {
  return Math.pow(base, exponent);
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function float_to_string(float) {
  const string = float.toString().replace("+", "");
  if (string.indexOf(".") >= 0) {
    return string;
  } else {
    const index2 = string.indexOf("e");
    if (index2 >= 0) {
      return string.slice(0, index2) + ".0" + string.slice(index2);
    } else if (globalThis.Number.isInteger(float)) {
      return string + ".0";
    } else {
      return "//js(" + string + ")";
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function max3(a, b) {
  let $ = a > b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function min2(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function compare2(a, b) {
  let $ = a === b;
  if ($) {
    return Order$Eq$const;
  } else {
    let $1 = a < b;
    if ($1) {
      return Order$Lt$const;
    } else {
      return Order$Gt$const;
    }
  }
}
function absolute_value2(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return 0 - x;
  }
}
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}
function power(base, exponent) {
  let fractional = ceiling(exponent) - exponent > 0;
  let $ = base < 0 && fractional || base === 0 && exponent < 0;
  if ($) {
    return new Error(void 0);
  } else {
    return new Ok(power2(base, exponent));
  }
}
function square_root(x) {
  return power(x, 0.5);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function unwrap2(result, default$) {
  if (result instanceof Ok) {
    let v2 = result[0];
    return v2;
  } else {
    return default$;
  }
}
function lazy_or(first2, second) {
  if (first2 instanceof Ok) {
    return first2;
  } else {
    return second();
  }
}

// build/dev/javascript/gleam_yielder/gleam/yielder.mjs
var Stop = class extends CustomType {
};
var Action$Stop$const = new Stop();
var Done = class extends CustomType {
};
var Step$Done$const = new Done();
var NoMore = class extends CustomType {
};
var SizedChunk$NoMore$const = new NoMore();

// build/dev/javascript/gleam_community_maths/maths.mjs
function sin(float) {
  return Math.sin(float);
}
function pi() {
  return Math.PI;
}
function atan2(floaty, floatx) {
  return Math.atan2(floaty, floatx);
}
function cos(float) {
  return Math.cos(float);
}

// build/dev/javascript/gleam_community_maths/gleam_community/maths.mjs
var lanczos_p = /* @__PURE__ */ prepend(
  0.9999999999998099,
  prepend(
    676.5203681218851,
    prepend(
      -1259.1392167224028,
      prepend(
        771.3234287776531,
        prepend(
          -176.6150291621406,
          prepend(
            12.507343278686905,
            prepend(
              -0.13857109526572012,
              prepend(
                9984369578019572e-21,
                prepend(15056327351493116e-23, List$Empty$const)
              )
            )
          )
        )
      )
    )
  )
);
function sin2(x) {
  return sin(x);
}
function cos2(x) {
  return cos(x);
}
function atan22(y, x) {
  return atan2(y, x);
}
function pi2() {
  return pi();
}

// build/dev/javascript/triangle_platformer/physics.mjs
var Rect = class extends CustomType {
  constructor(x, y, w, h, one_way) {
    super();
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.one_way = one_way;
  }
};
var Motion = class extends CustomType {
  constructor(x, y, vx, vy, grounded, on_platform, wall) {
    super();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.grounded = grounded;
    this.on_platform = on_platform;
    this.wall = wall;
  }
};
var skin = 1e-4;
var gravity = 60;
var max_fall = 22;
function box(x, y, w, h) {
  return new Rect(x - w / 2, y, w, h, false);
}
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function inside(a, b) {
  return a.x + skin < b.x + b.w && a.x + a.w - skin > b.x && a.y + skin < b.y + b.h && a.y + a.h - skin > b.y;
}
function collide(m, w, h, level, dt, platforms) {
  let half = w / 2;
  let solids = filter(level, (r) => {
    return !r.one_way;
  });
  let $ = fold2(
    solids,
    [m.x + m.vx * dt, m.vx],
    (acc2, r) => {
      let x2 = acc2[0];
      let vx2 = acc2[1];
      let $12 = inside(box(x2, m.y, w, h), r);
      let $22 = vx2 > 0;
      if ($12) {
        if ($22) {
          return [r.x - half, 0];
        } else {
          return [r.x + r.w + half, 0];
        }
      } else {
        return acc2;
      }
    }
  );
  let x = $[0];
  let vx = $[1];
  let $1 = fold2(
    level,
    [m.y + m.vy * dt, m.vy, false, false],
    (acc2, r) => {
      let y2 = acc2[0];
      let vy2 = acc2[1];
      let top = r.y + r.h;
      let $22 = r.one_way;
      if ($22) {
        let lands = platforms && vy2 <= 0 && m.y >= top - 1e-3 && y2 < top && x + half > r.x && x - half < r.x + r.w;
        if (lands) {
          return [top, 0, true, true];
        } else {
          return acc2;
        }
      } else {
        let $32 = inside(box(x, y2, w, h), r);
        let $4 = vy2 <= 0;
        if ($32) {
          if ($4) {
            return [top, 0, true, false];
          } else {
            return [r.y - h, 0, acc2[2], acc2[3]];
          }
        } else {
          return acc2;
        }
      }
    }
  );
  let y = $1[0];
  let vy = $1[1];
  let grounded = $1[2];
  let on_platform = $1[3];
  let touching = (dx) => {
    return any(solids, (r) => {
      return inside(box(x + dx, y, w, h), r);
    });
  };
  let _block;
  let $2 = touching(-0.05);
  let $3 = touching(0.05);
  if ($2) {
    _block = -1;
  } else if ($3) {
    _block = 1;
  } else {
    _block = 0;
  }
  let wall = _block;
  return new Motion(x, y, vx, vy, grounded, on_platform, wall);
}
function ground_at(level, x, y) {
  return any(
    level,
    (r) => {
      return x >= r.x && x <= r.x + r.w && absolute_value2(
        r.y + r.h - y
      ) < 0.05;
    }
  );
}
function approach(v2, target, amount) {
  let $ = v2 < target;
  if ($) {
    return min2(v2 + amount, target);
  } else {
    return max3(v2 - amount, target);
  }
}
function normalize(x, y) {
  let _block;
  let $ = square_root(x * x + y * y);
  if ($ instanceof Ok) {
    let l = $[0];
    if (l > 0) {
      _block = l;
    } else {
      _block = 1;
    }
  } else {
    _block = 1;
  }
  let len = _block;
  return [divideFloat(x, len), divideFloat(y, len)];
}

// build/dev/javascript/triangle_platformer/enemy.mjs
var Dummy = class extends CustomType {
};
var Kind$Dummy$const = new Dummy();
var Charger = class extends CustomType {
};
var Kind$Charger$const = new Charger();
var Shooter = class extends CustomType {
};
var Kind$Shooter$const = new Shooter();
var Flyer = class extends CustomType {
};
var Kind$Flyer$const = new Flyer();
var Bouncer = class extends CustomType {
};
var Kind$Bouncer$const = new Bouncer();
var Boss = class extends CustomType {
};
var Kind$Boss$const = new Boss();
var Idle = class extends CustomType {
};
var Mode$Idle$const = new Idle();
var Windup = class extends CustomType {
  constructor(t) {
    super();
    this.t = t;
  }
};
var Charging = class extends CustomType {
  constructor(t) {
    super();
    this.t = t;
  }
};
var Recover = class extends CustomType {
  constructor(t) {
    super();
    this.t = t;
  }
};
var Stunned = class extends CustomType {
  constructor(t) {
    super();
    this.t = t;
  }
};
var Leaping = class extends CustomType {
  constructor(t) {
    super();
    this.t = t;
  }
};
var Enemy = class extends CustomType {
  constructor(id, kind, x, y, vx, vy, home_x, home_y, facing, grounded, wall, hp, max_hp4, respawn, flash, mode, cooldown, pattern, awake) {
    super();
    this.id = id;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.home_x = home_x;
    this.home_y = home_y;
    this.facing = facing;
    this.grounded = grounded;
    this.wall = wall;
    this.hp = hp;
    this.max_hp = max_hp4;
    this.respawn = respawn;
    this.flash = flash;
    this.mode = mode;
    this.cooldown = cooldown;
    this.pattern = pattern;
    this.awake = awake;
  }
};
var Projectile = class extends CustomType {
  constructor(x, y, vx, vy, ttl) {
    super();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ttl = ttl;
  }
};
var boss_rest = 1;
var boss_charge_speed = 11;
var boss_walk = 2.5;
var boss_windup = 0.7;
var fire_windup = 0.4;
var fire_cooldown = 1.8;
var shot_ttl = 3;
var shot_speed = 9;
var shooter_range = 12;
var charge_speed = 13;
var recover_time = 0.8;
var charge_time = 0.7;
var patrol_speed = 2;
var windup_time = 0.45;
var sight = 8;
var bounce_x = 5;
var bounce_up = 15;
var flyer_swoop = 12;
var flyer_drift = 2.5;
var stun_time = 0.25;
var shot_size = 0.4;
var shot_damage = 8;
function max_hp(kind) {
  if (kind instanceof Dummy) {
    return 40;
  } else if (kind instanceof Charger) {
    return 30;
  } else if (kind instanceof Shooter) {
    return 20;
  } else if (kind instanceof Flyer) {
    return 18;
  } else if (kind instanceof Bouncer) {
    return 25;
  } else {
    return 400;
  }
}
function spawn(id, kind, x, y) {
  let hp = max_hp(kind);
  return new Enemy(
    id,
    kind,
    x,
    y,
    0,
    0,
    x,
    y,
    -1,
    false,
    0,
    hp,
    hp,
    0,
    0,
    Mode$Idle$const,
    1,
    0,
    kind instanceof Flyer || kind instanceof Bouncer || kind instanceof Dummy
  );
}
function xp_value(kind) {
  if (kind instanceof Dummy) {
    return 0;
  } else if (kind instanceof Charger) {
    return 20;
  } else if (kind instanceof Shooter) {
    return 15;
  } else if (kind instanceof Flyer) {
    return 15;
  } else if (kind instanceof Bouncer) {
    return 15;
  } else {
    return 150;
  }
}
function respawn_delay(kind) {
  if (kind instanceof Dummy) {
    return 1.5;
  } else {
    return 5;
  }
}
function size3(kind) {
  if (kind instanceof Dummy) {
    return [0.9, 1.6];
  } else if (kind instanceof Charger) {
    return [1.1, 1.1];
  } else if (kind instanceof Shooter) {
    return [0.8, 1.4];
  } else if (kind instanceof Flyer) {
    return [0.9, 0.7];
  } else if (kind instanceof Bouncer) {
    return [1, 1];
  } else {
    return [2.4, 2.4];
  }
}
function body(e) {
  let $ = size3(e.kind);
  let w = $[0];
  let h = $[1];
  return box(e.x, e.y, w, h);
}
function alive(e) {
  return e.hp > 0;
}
function contact_damage(e) {
  let $ = e.kind;
  let $1 = e.mode;
  if ($ instanceof Dummy) {
    return 0;
  } else if ($ instanceof Charger && $1 instanceof Charging) {
    return 20;
  } else if ($ instanceof Flyer && $1 instanceof Charging) {
    return 12;
  } else if ($ instanceof Boss) {
    if ($1 instanceof Charging) {
      return 20;
    } else if ($1 instanceof Leaping) {
      return 20;
    } else {
      return 12;
    }
  } else {
    return 10;
  }
}
function telegraphing(e) {
  let $ = e.mode;
  if ($ instanceof Windup) {
    return true;
  } else {
    return false;
  }
}
function fall(e, level, dt) {
  let $ = size3(e.kind);
  let w = $[0];
  let h = $[1];
  let vy = max3(e.vy - gravity * dt, 0 - max_fall);
  let m = collide(
    new Motion(e.x, e.y, e.vx, vy, e.grounded, false, e.wall),
    w,
    h,
    level,
    dt,
    true
  );
  return new Enemy(
    e.id,
    e.kind,
    m.x,
    m.y,
    m.vx,
    m.vy,
    e.home_x,
    e.home_y,
    e.facing,
    m.grounded,
    m.wall,
    e.hp,
    e.max_hp,
    e.respawn,
    e.flash,
    e.mode,
    e.cooldown,
    e.pattern,
    e.awake
  );
}
function sign2(x) {
  let $ = x < 0;
  if ($) {
    return -1;
  } else {
    return 1;
  }
}
function boss(e, level, px, py, dt) {
  let $ = size3(Kind$Boss$const);
  let w = $[0];
  let h = $[1];
  let dx = px - e.x;
  let toward = sign2(dx);
  let blocked = e.grounded && (e.wall === e.facing || !ground_at(
    level,
    e.x + e.facing * (w / 2 + 0.1),
    e.y
  ));
  let $1 = e.mode;
  if ($1 instanceof Idle) {
    let rest = e.cooldown - dt;
    let $2 = rest <= 0;
    if ($2) {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          toward,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Windup(boss_windup),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    } else {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          toward * boss_walk,
          e.vy,
          e.home_x,
          e.home_y,
          toward,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          e.mode,
          rest,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    }
  } else if ($1 instanceof Windup) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    let $3 = e.pattern % 3;
    if ($2) {
      if ($3 === 0) {
        return [
          new Enemy(
            e.id,
            e.kind,
            e.x,
            e.y,
            e.vx,
            e.vy,
            e.home_x,
            e.home_y,
            e.facing,
            e.grounded,
            e.wall,
            e.hp,
            e.max_hp,
            e.respawn,
            e.flash,
            new Charging(0.9),
            e.cooldown,
            e.pattern + 1,
            e.awake
          ),
          List$Empty$const
        ];
      } else if ($3 === 1) {
        let sy = e.y + h * 0.7;
        let $4 = normalize(dx, py - sy);
        let nx = $4[0];
        let ny = $4[1];
        let _block;
        let _pipe = prepend(
          -2,
          prepend(
            -1,
            prepend(
              0,
              prepend(1, prepend(2, List$Empty$const))
            )
          )
        );
        _block = map3(
          _pipe,
          (k) => {
            let a = k * 0.22;
            let c = cos2(a);
            let sn = sin2(a);
            return new Projectile(
              e.x,
              sy,
              (nx * c - ny * sn) * 8,
              (nx * sn + ny * c) * 8,
              3
            );
          }
        );
        let shots = _block;
        return [
          new Enemy(
            e.id,
            e.kind,
            e.x,
            e.y,
            e.vx,
            e.vy,
            e.home_x,
            e.home_y,
            e.facing,
            e.grounded,
            e.wall,
            e.hp,
            e.max_hp,
            e.respawn,
            e.flash,
            new Recover(0.8),
            e.cooldown,
            e.pattern + 1,
            e.awake
          ),
          shots
        ];
      } else {
        let reach3 = min2(absolute_value2(dx), 9);
        return [
          new Enemy(
            e.id,
            e.kind,
            e.x,
            e.y,
            toward * reach3 / 0.6,
            17,
            e.home_x,
            e.home_y,
            e.facing,
            false,
            e.wall,
            e.hp,
            e.max_hp,
            e.respawn,
            e.flash,
            new Leaping(0),
            e.cooldown,
            e.pattern + 1,
            e.awake
          ),
          List$Empty$const
        ];
      }
    } else {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Windup(t - dt),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    }
  } else if ($1 instanceof Charging) {
    let t = $1.t;
    let $2 = t - dt <= 0 || blocked;
    if ($2) {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Recover(0.7),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    } else {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          e.facing * boss_charge_speed,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Charging(t - dt),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    }
  } else if ($1 instanceof Recover) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    if ($2) {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          Mode$Idle$const,
          boss_rest,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    } else {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Recover(t - dt),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    }
  } else if ($1 instanceof Stunned) {
    return [
      new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        Mode$Idle$const,
        e.cooldown,
        e.pattern,
        e.awake
      ),
      List$Empty$const
    ];
  } else {
    let t = $1.t;
    let $2 = t > 0.2 && e.grounded;
    if ($2) {
      let wave = (dir) => {
        return new Projectile(e.x, e.y + 0.3, dir * 10, 0, 1.4);
      };
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          0,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Recover(0.9),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        prepend(wave(1), prepend(wave(-1), List$Empty$const))
      ];
    } else {
      return [
        new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          e.vx,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          new Leaping(t + dt),
          e.cooldown,
          e.pattern,
          e.awake
        ),
        List$Empty$const
      ];
    }
  }
}
function result_list(r) {
  if (r instanceof Ok) {
    let x = r[0];
    return prepend(x, List$Empty$const);
  } else {
    return List$Empty$const;
  }
}
function countdown(e, t, dt, mode) {
  let $ = t - dt <= 0;
  if ($) {
    return new Enemy(
      e.id,
      e.kind,
      e.x,
      e.y,
      e.vx,
      e.vy,
      e.home_x,
      e.home_y,
      e.facing,
      e.grounded,
      e.wall,
      e.hp,
      e.max_hp,
      e.respawn,
      e.flash,
      Mode$Idle$const,
      e.cooldown,
      e.pattern,
      e.awake
    );
  } else {
    return new Enemy(
      e.id,
      e.kind,
      e.x,
      e.y,
      e.vx,
      e.vy,
      e.home_x,
      e.home_y,
      e.facing,
      e.grounded,
      e.wall,
      e.hp,
      e.max_hp,
      e.respawn,
      e.flash,
      mode(t - dt),
      e.cooldown,
      e.pattern,
      e.awake
    );
  }
}
function shooter(e, px, py, dt) {
  let dx = px - e.x;
  let in_range = absolute_value2(dx) < shooter_range && absolute_value2(
    py - e.y
  ) < 8;
  let e$1 = new Enemy(
    e.id,
    e.kind,
    e.x,
    e.y,
    e.vx,
    e.vy,
    e.home_x,
    e.home_y,
    (() => {
      if (in_range) {
        return sign2(dx);
      } else {
        return e.facing;
      }
    })(),
    e.grounded,
    e.wall,
    e.hp,
    e.max_hp,
    e.respawn,
    e.flash,
    e.mode,
    e.cooldown - dt,
    e.pattern,
    e.awake
  );
  let $ = e$1.mode;
  if ($ instanceof Windup) {
    let t = $.t;
    let $1 = t - dt <= 0;
    if ($1) {
      let $2 = size3(Kind$Shooter$const);
      let h = $2[1];
      let sy = e$1.y + h * 0.7;
      let $3 = normalize(px - e$1.x, py - sy);
      let nx = $3[0];
      let ny = $3[1];
      let shot = new Projectile(
        e$1.x,
        sy,
        nx * shot_speed,
        ny * shot_speed,
        shot_ttl
      );
      return [
        new Enemy(
          e$1.id,
          e$1.kind,
          e$1.x,
          e$1.y,
          e$1.vx,
          e$1.vy,
          e$1.home_x,
          e$1.home_y,
          e$1.facing,
          e$1.grounded,
          e$1.wall,
          e$1.hp,
          e$1.max_hp,
          e$1.respawn,
          e$1.flash,
          Mode$Idle$const,
          fire_cooldown,
          e$1.pattern,
          e$1.awake
        ),
        new Some(shot)
      ];
    } else {
      return [
        new Enemy(
          e$1.id,
          e$1.kind,
          e$1.x,
          e$1.y,
          e$1.vx,
          e$1.vy,
          e$1.home_x,
          e$1.home_y,
          e$1.facing,
          e$1.grounded,
          e$1.wall,
          e$1.hp,
          e$1.max_hp,
          e$1.respawn,
          e$1.flash,
          new Windup(t - dt),
          e$1.cooldown,
          e$1.pattern,
          e$1.awake
        ),
        Option$None$const
      ];
    }
  } else if ($ instanceof Stunned) {
    let t = $.t;
    return [
      countdown(e$1, t, dt, (var0) => {
        return new Stunned(var0);
      }),
      Option$None$const
    ];
  } else {
    let $1 = in_range && e$1.cooldown <= 0;
    if ($1) {
      return [
        new Enemy(
          e$1.id,
          e$1.kind,
          e$1.x,
          e$1.y,
          e$1.vx,
          e$1.vy,
          e$1.home_x,
          e$1.home_y,
          e$1.facing,
          e$1.grounded,
          e$1.wall,
          e$1.hp,
          e$1.max_hp,
          e$1.respawn,
          e$1.flash,
          new Windup(fire_windup),
          e$1.cooldown,
          e$1.pattern,
          e$1.awake
        ),
        Option$None$const
      ];
    } else {
      return [
        new Enemy(
          e$1.id,
          e$1.kind,
          e$1.x,
          e$1.y,
          e$1.vx,
          e$1.vy,
          e$1.home_x,
          e$1.home_y,
          e$1.facing,
          e$1.grounded,
          e$1.wall,
          e$1.hp,
          e$1.max_hp,
          e$1.respawn,
          e$1.flash,
          Mode$Idle$const,
          e$1.cooldown,
          e$1.pattern,
          e$1.awake
        ),
        Option$None$const
      ];
    }
  }
}
function charger(e, level, px, py, dt) {
  let $ = size3(Kind$Charger$const);
  let w = $[0];
  let h = $[1];
  let dx = px - e.x;
  let sees = absolute_value2(dx) < sight && absolute_value2(
    py - (e.y + h / 2)
  ) < 1.5;
  let blocked = e.grounded && (e.wall === e.facing || !ground_at(
    level,
    e.x + e.facing * (w / 2 + 0.1),
    e.y
  ));
  let $1 = e.mode;
  if ($1 instanceof Idle) {
    if (sees) {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        e.vy,
        e.home_x,
        e.home_y,
        sign2(dx),
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Windup(windup_time),
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else if (blocked) {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        e.vy,
        e.home_x,
        e.home_y,
        negate(e.facing),
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.facing * patrol_speed,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Windup) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    if ($2) {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Charging(charge_time),
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Windup(t - dt),
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Charging) {
    let t = $1.t;
    let $2 = t - dt <= 0 || blocked;
    if ($2) {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Recover(recover_time),
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else {
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.facing * charge_speed,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Charging(t - dt),
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Recover) {
    let t = $1.t;
    return countdown(
      new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      ),
      t,
      dt,
      (var0) => {
        return new Recover(var0);
      }
    );
  } else if ($1 instanceof Stunned) {
    let t = $1.t;
    return countdown(
      new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        approach(e.vx, 0, 20 * dt),
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      ),
      t,
      dt,
      (var0) => {
        return new Stunned(var0);
      }
    );
  } else {
    return new Enemy(
      e.id,
      e.kind,
      e.x,
      e.y,
      e.vx,
      e.vy,
      e.home_x,
      e.home_y,
      e.facing,
      e.grounded,
      e.wall,
      e.hp,
      e.max_hp,
      e.respawn,
      e.flash,
      Mode$Idle$const,
      e.cooldown,
      e.pattern,
      e.awake
    );
  }
}
function bouncer(e, level, dt) {
  let $ = size3(Kind$Bouncer$const);
  let w = $[0];
  let h = $[1];
  let _block;
  let $1 = e.vx === 0;
  if ($1) {
    _block = e.facing * bounce_x;
  } else {
    _block = e.vx;
  }
  let vx = _block;
  let vy = max3(e.vy - gravity * dt, 0 - max_fall);
  let m = collide(
    new Motion(e.x, e.y, vx, vy, e.grounded, false, e.wall),
    w,
    h,
    level,
    dt,
    true
  );
  let _block$1;
  let $2 = m.vx === 0;
  if ($2) {
    _block$1 = negate(sign2(vx));
  } else {
    _block$1 = sign2(vx);
  }
  let facing = _block$1;
  let _block$2;
  let $3 = m.grounded;
  if ($3) {
    _block$2 = bounce_up;
  } else {
    _block$2 = m.vy;
  }
  let vy$1 = _block$2;
  return new Enemy(
    e.id,
    e.kind,
    m.x,
    m.y,
    facing * max3(absolute_value2(m.vx), bounce_x),
    vy$1,
    e.home_x,
    e.home_y,
    facing,
    false,
    m.wall,
    e.hp,
    e.max_hp,
    e.respawn,
    e.flash,
    Mode$Idle$const,
    e.cooldown,
    e.pattern,
    e.awake
  );
}
function flyer(e, level, px, py, dt, alert) {
  let $ = size3(Kind$Flyer$const);
  let w = $[0];
  let h = $[1];
  let _block;
  let $1 = e.mode;
  if ($1 instanceof Idle) {
    let cooldown = e.cooldown - dt;
    let _block$1;
    let $2 = e.x > e.home_x + 6 && e.facing > 0;
    let $3 = e.x < e.home_x - 6 && e.facing < 0;
    if ($2) {
      _block$1 = -1;
    } else if ($3) {
      _block$1 = 1;
    } else {
      _block$1 = e.facing;
    }
    let facing = _block$1;
    let $4 = alert && cooldown <= 0;
    if ($4) {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        0,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Windup(0.5),
        cooldown,
        e.pattern,
        e.awake
      );
    } else {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        facing * flyer_drift,
        (e.home_y - e.y) * 2,
        e.home_x,
        e.home_y,
        facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Windup) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    if ($2) {
      let $3 = normalize(px - e.x, py - (e.y + h / 2));
      let nx = $3[0];
      let ny = $3[1];
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        nx * flyer_swoop,
        ny * flyer_swoop,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Charging(0.55),
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Windup(t - dt),
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Charging) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    if ($2) {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        0,
        0,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Recover(0.8),
        e.cooldown,
        e.pattern,
        e.awake
      );
    } else {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Charging(t - dt),
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Recover) {
    let t = $1.t;
    let $2 = t - dt <= 0;
    if ($2) {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        Mode$Idle$const,
        2,
        e.pattern,
        e.awake
      );
    } else {
      _block = new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        (e.home_y - e.y) * 1.5,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        new Recover(t - dt),
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  } else if ($1 instanceof Stunned) {
    let t = $1.t;
    _block = countdown(
      new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        approach(e.vx, 0, 20 * dt),
        approach(e.vy, 0, 20 * dt),
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        e.hp,
        e.max_hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      ),
      t,
      dt,
      (var0) => {
        return new Stunned(var0);
      }
    );
  } else {
    _block = new Enemy(
      e.id,
      e.kind,
      e.x,
      e.y,
      e.vx,
      e.vy,
      e.home_x,
      e.home_y,
      e.facing,
      e.grounded,
      e.wall,
      e.hp,
      e.max_hp,
      e.respawn,
      e.flash,
      Mode$Idle$const,
      e.cooldown,
      e.pattern,
      e.awake
    );
  }
  let e$1 = _block;
  let m = collide(
    new Motion(e$1.x, e$1.y, e$1.vx, e$1.vy, false, false, e$1.wall),
    w,
    h,
    filter(level, (r) => {
      return !r.one_way;
    }),
    dt,
    false
  );
  return new Enemy(
    e$1.id,
    e$1.kind,
    m.x,
    m.y,
    e$1.vx,
    e$1.vy,
    e$1.home_x,
    e$1.home_y,
    e$1.facing,
    e$1.grounded,
    m.wall,
    e$1.hp,
    e$1.max_hp,
    e$1.respawn,
    e$1.flash,
    e$1.mode,
    e$1.cooldown,
    e$1.pattern,
    e$1.awake
  );
}
function think(e, level, px, py, dt, alert) {
  let $ = e.kind;
  let $1 = alive(e);
  if ($ instanceof Dummy) {
    return [e, List$Empty$const];
  } else if ($ instanceof Charger) {
    if ($1) {
      if (!e.awake) {
        return [
          fall(
            new Enemy(
              e.id,
              e.kind,
              e.x,
              e.y,
              0,
              e.vy,
              e.home_x,
              e.home_y,
              e.facing,
              e.grounded,
              e.wall,
              e.hp,
              e.max_hp,
              e.respawn,
              e.flash,
              e.mode,
              e.cooldown,
              e.pattern,
              e.awake
            ),
            level,
            dt
          ),
          List$Empty$const
        ];
      } else {
        return [
          (() => {
            let _pipe = charger(e, level, px, py, dt);
            return fall(_pipe, level, dt);
          })(),
          List$Empty$const
        ];
      }
    } else {
      return [e, List$Empty$const];
    }
  } else if ($ instanceof Shooter) {
    if ($1) {
      if (!e.awake) {
        return [
          fall(
            new Enemy(
              e.id,
              e.kind,
              e.x,
              e.y,
              0,
              e.vy,
              e.home_x,
              e.home_y,
              e.facing,
              e.grounded,
              e.wall,
              e.hp,
              e.max_hp,
              e.respawn,
              e.flash,
              e.mode,
              e.cooldown,
              e.pattern,
              e.awake
            ),
            level,
            dt
          ),
          List$Empty$const
        ];
      } else {
        let $2 = shooter(e, px, py, dt);
        let e$1 = $2[0];
        let shot = $2[1];
        return [
          fall(e$1, level, dt),
          (() => {
            let _pipe = to_result(shot, void 0);
            return result_list(_pipe);
          })()
        ];
      }
    } else {
      return [e, List$Empty$const];
    }
  } else if ($ instanceof Flyer) {
    if ($1) {
      if (!e.awake) {
        return [
          fall(
            new Enemy(
              e.id,
              e.kind,
              e.x,
              e.y,
              0,
              e.vy,
              e.home_x,
              e.home_y,
              e.facing,
              e.grounded,
              e.wall,
              e.hp,
              e.max_hp,
              e.respawn,
              e.flash,
              e.mode,
              e.cooldown,
              e.pattern,
              e.awake
            ),
            level,
            dt
          ),
          List$Empty$const
        ];
      } else {
        return [flyer(e, level, px, py, dt, alert), List$Empty$const];
      }
    } else {
      return [e, List$Empty$const];
    }
  } else if ($ instanceof Bouncer) {
    if ($1) {
      if (!e.awake) {
        return [
          fall(
            new Enemy(
              e.id,
              e.kind,
              e.x,
              e.y,
              0,
              e.vy,
              e.home_x,
              e.home_y,
              e.facing,
              e.grounded,
              e.wall,
              e.hp,
              e.max_hp,
              e.respawn,
              e.flash,
              e.mode,
              e.cooldown,
              e.pattern,
              e.awake
            ),
            level,
            dt
          ),
          List$Empty$const
        ];
      } else {
        return [bouncer(e, level, dt), List$Empty$const];
      }
    } else {
      return [e, List$Empty$const];
    }
  } else if ($1) {
    if (!e.awake) {
      return [
        fall(
          new Enemy(
            e.id,
            e.kind,
            e.x,
            e.y,
            0,
            e.vy,
            e.home_x,
            e.home_y,
            e.facing,
            e.grounded,
            e.wall,
            e.hp,
            e.max_hp,
            e.respawn,
            e.flash,
            e.mode,
            e.cooldown,
            e.pattern,
            e.awake
          ),
          level,
          dt
        ),
        List$Empty$const
      ];
    } else {
      let $2 = boss(e, level, px, py, dt);
      let e$1 = $2[0];
      let shots = $2[1];
      return [fall(e$1, level, dt), shots];
    }
  } else {
    return [e, List$Empty$const];
  }
}
function take_hit(e, damage3, push_x, push_y) {
  let hit = new Enemy(
    e.id,
    e.kind,
    e.x,
    e.y,
    e.vx,
    e.vy,
    e.home_x,
    e.home_y,
    e.facing,
    e.grounded,
    e.wall,
    max(e.hp - damage3, 0),
    e.max_hp,
    respawn_delay(e.kind),
    0.12,
    e.mode,
    e.cooldown,
    e.pattern,
    e.awake
  );
  let hit$1 = new Enemy(
    hit.id,
    hit.kind,
    hit.x,
    hit.y,
    hit.vx,
    hit.vy,
    hit.home_x,
    hit.home_y,
    hit.facing,
    hit.grounded,
    hit.wall,
    hit.hp,
    hit.max_hp,
    hit.respawn,
    hit.flash,
    hit.mode,
    hit.cooldown,
    hit.pattern,
    true
  );
  let $ = e.kind;
  if ($ instanceof Dummy) {
    return hit$1;
  } else if ($ instanceof Bouncer) {
    return new Enemy(
      hit$1.id,
      hit$1.kind,
      hit$1.x,
      hit$1.y,
      sign2(push_x) * bounce_x * 1.6,
      max3(push_y, 8),
      hit$1.home_x,
      hit$1.home_y,
      hit$1.facing,
      hit$1.grounded,
      hit$1.wall,
      hit$1.hp,
      hit$1.max_hp,
      hit$1.respawn,
      hit$1.flash,
      hit$1.mode,
      hit$1.cooldown,
      hit$1.pattern,
      hit$1.awake
    );
  } else if ($ instanceof Boss) {
    return hit$1;
  } else {
    return new Enemy(
      hit$1.id,
      hit$1.kind,
      hit$1.x,
      hit$1.y,
      push_x,
      push_y,
      hit$1.home_x,
      hit$1.home_y,
      hit$1.facing,
      hit$1.grounded,
      hit$1.wall,
      hit$1.hp,
      hit$1.max_hp,
      hit$1.respawn,
      hit$1.flash,
      new Stunned(stun_time),
      hit$1.cooldown,
      hit$1.pattern,
      hit$1.awake
    );
  }
}
function tick(e, dt) {
  let respawn = e.respawn - dt;
  let $ = e.kind instanceof Dummy && e.hp === 0 && respawn <= 0;
  if ($) {
    return spawn(e.id, e.kind, e.home_x, e.home_y);
  } else {
    return new Enemy(
      e.id,
      e.kind,
      e.x,
      e.y,
      e.vx,
      e.vy,
      e.home_x,
      e.home_y,
      e.facing,
      e.grounded,
      e.wall,
      e.hp,
      e.max_hp,
      respawn,
      e.flash - dt,
      e.mode,
      e.cooldown,
      e.pattern,
      e.awake
    );
  }
}
function shot_box(s) {
  return new Rect(
    s.x - shot_size / 2,
    s.y - shot_size / 2,
    shot_size,
    shot_size,
    false
  );
}
function fly(s, level, dt) {
  let s$1 = new Projectile(
    s.x + s.vx * dt,
    s.y + s.vy * dt,
    s.vx,
    s.vy,
    s.ttl - dt
  );
  let hit_wall = any(
    level,
    (r) => {
      return !r.one_way && overlaps(shot_box(s$1), r);
    }
  );
  let $ = s$1.ttl <= 0 || hit_wall;
  if ($) {
    return Option$None$const;
  } else {
    return new Some(s$1);
  }
}

// build/dev/javascript/triangle_platformer/rng.mjs
function next(seed) {
  return seed * 48271 % 2147483647;
}
function unit(seed) {
  let s = next(seed);
  return [s, identity(s) / 2147483647];
}
function between(seed, lo, hi) {
  let $ = unit(seed);
  let s = $[0];
  let u = $[1];
  return [s, lo + u * (hi - lo)];
}

// build/dev/javascript/triangle_platformer/rooms.mjs
var Template = class extends CustomType {
  constructor(level, entry, spawns, doors, npcs, air, tier) {
    super();
    this.level = level;
    this.entry = entry;
    this.spawns = spawns;
    this.doors = doors;
    this.npcs = npcs;
    this.air = air;
    this.tier = tier;
  }
};
var Npc = class extends CustomType {
  constructor(x, y, role) {
    super();
    this.x = x;
    this.y = y;
    this.role = role;
  }
};
var Mentor = class extends CustomType {
};
var Role$Mentor$const = new Mentor();
var Statue = class extends CustomType {
  constructor(keystone) {
    super();
    this.keystone = keystone;
  }
};
var tunnel_end = 10;
function hub() {
  return new Template(
    prepend(
      new Rect(-14, -2, 84, 2, false),
      prepend(
        new Rect(-15, -2, 1, 30, false),
        prepend(
          new Rect(70, -2, 1, 30, false),
          prepend(
            new Rect(14, 3.5, 6, 0.3, true),
            prepend(
              new Rect(24, 5.5, 6, 0.3, true),
              prepend(
                new Rect(34, 3.5, 6, 0.3, true),
                prepend(
                  new Rect(44, 5.5, 6, 0.3, true),
                  prepend(
                    new Rect(55, 2.5, 1.5, 12, false),
                    prepend(
                      new Rect(59.5, 2.5, 1.5, 12, false),
                      List$Empty$const
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    [-2, 0],
    prepend(
      [-11, 0, Kind$Dummy$const],
      prepend(
        [-9.5, 0, Kind$Dummy$const],
        prepend([-8, 0, Kind$Dummy$const], List$Empty$const)
      )
    ),
    prepend([3.5, 0], List$Empty$const),
    prepend(
      new Npc(1, 0, Role$Mentor$const),
      index_map(
        toList([3, 7, 11, 12, 0, 1, 2, 4, 5, 6, 8, 9, 10, 13, 14, 15]),
        (k, i) => {
          return new Npc(6 + 3 * identity(i), 0, new Statue(k));
        }
      )
    ),
    [0, 0],
    0
  );
}
function walls(w, h) {
  return prepend(
    new Rect(0, -2, w, 2, false),
    prepend(
      new Rect(-1, -2, 1, h, false),
      prepend(new Rect(w, -2, 1, h, false), List$Empty$const)
    )
  );
}
function boss_room() {
  return new Template(
    prepend(
      new Rect(13, 2.2, 6, 0.3, true),
      prepend(new Rect(28, 2.2, 6, 0.3, true), walls(44, 20))
    ),
    [2, 0],
    prepend([34, 0, Kind$Boss$const], List$Empty$const),
    prepend([24, 0], List$Empty$const),
    List$Empty$const,
    [0, 0],
    0
  );
}
function tunnel() {
  return new Rect(-1, 3.2, 11, 1, false);
}
function gate() {
  return new Rect(9.4, 0, 0.6, 3.2, false);
}
function tunnel_inside() {
  return new Rect(-1, 0, 11, 3.2, false);
}
function room(level, spawns, doors, air, tier) {
  return new Template(
    level,
    [2, 0],
    spawns,
    doors,
    List$Empty$const,
    air,
    tier
  );
}
function gauntlet() {
  return room(
    prepend(
      new Rect(13, 2.2, 6, 0.3, true),
      prepend(
        new Rect(21, 4.4, 6, 0.3, true),
        prepend(
          new Rect(29, 2.2, 6, 0.3, true),
          prepend(
            new Rect(37, 4.4, 6, 0.3, true),
            prepend(new Rect(45, 2.2, 6, 0.3, true), walls(56, 18))
          )
        )
      )
    ),
    prepend(
      [16, 2.5, Kind$Shooter$const],
      prepend(
        [24, 4.7, Kind$Charger$const],
        prepend(
          [32, 2.5, Kind$Shooter$const],
          prepend(
            [40, 4.7, Kind$Shooter$const],
            prepend(
              [48, 2.5, Kind$Charger$const],
              prepend([52, 0, Kind$Charger$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([50, 0], prepend([53, 0], List$Empty$const)),
    [30, 8],
    3
  );
}
function cellar() {
  return room(
    prepend(
      new Rect(-1, 6, 34, 1, false),
      prepend(
        new Rect(16, 0, 1.5, 2, false),
        prepend(new Rect(24, 0, 1.5, 2, false), walls(32, 10))
      )
    ),
    prepend(
      [13, 0, Kind$Charger$const],
      prepend(
        [16.7, 2, Kind$Shooter$const],
        prepend(
          [20, 0, Kind$Charger$const],
          prepend(
            [24.7, 2, Kind$Shooter$const],
            prepend(
              [28, 0, Kind$Charger$const],
              prepend([30, 0, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([27, 0], prepend([30, 0], List$Empty$const)),
    [20, 4.5],
    3
  );
}
function box2() {
  return room(
    prepend(
      new Rect(-1, 8, 28, 1, false),
      prepend(
        new Rect(14, 2.2, 5, 0.3, true),
        prepend(new Rect(19, 4.4, 4, 0.3, true), walls(26, 12))
      )
    ),
    prepend(
      [15, 2.5, Kind$Shooter$const],
      prepend(
        [18, 0, Kind$Charger$const],
        prepend(
          [21, 4.7, Kind$Shooter$const],
          prepend(
            [23, 0, Kind$Charger$const],
            prepend(
              [13, 0, Kind$Charger$const],
              prepend([24, 0, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([21, 0], prepend([24, 0], List$Empty$const)),
    [18, 6],
    3
  );
}
function bridge() {
  return room(
    prepend(new Rect(13, 2.2, 26, 0.3, true), walls(52, 18)),
    prepend(
      [16, 2.5, Kind$Shooter$const],
      prepend(
        [20, 0, Kind$Charger$const],
        prepend(
          [26, 2.5, Kind$Shooter$const],
          prepend(
            [30, 0, Kind$Charger$const],
            prepend(
              [36, 2.5, Kind$Charger$const],
              prepend([46, 0, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([47, 0], prepend([50, 0], List$Empty$const)),
    [30, 7],
    2
  );
}
function long_hall() {
  return room(
    prepend(
      new Rect(20, 4.5, 8, 1, false),
      prepend(
        new Rect(40, 4.5, 8, 1, false),
        prepend(
          new Rect(31, 0, 2, 1.2, false),
          prepend(new Rect(51, 0, 2, 1.2, false), walls(64, 16))
        )
      )
    ),
    prepend(
      [15, 0, Kind$Charger$const],
      prepend(
        [24, 0, Kind$Shooter$const],
        prepend(
          [35, 0, Kind$Charger$const],
          prepend(
            [44, 0, Kind$Shooter$const],
            prepend(
              [55, 0, Kind$Charger$const],
              prepend([59, 0, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([59, 0], prepend([62, 0], List$Empty$const)),
    [38, 9],
    2
  );
}
function stairs() {
  return room(
    prepend(
      new Rect(12, 0, 6, 1.8, false),
      prepend(
        new Rect(18, 0, 6, 3.6, false),
        prepend(
          new Rect(24, 0, 6, 5.4, false),
          prepend(
            new Rect(30, 0, 6, 7.2, false),
            prepend(
              new Rect(36, 0, 12, 9, false),
              walls(48, 22)
            )
          )
        )
      )
    ),
    prepend(
      [15, 1.8, Kind$Charger$const],
      prepend(
        [21, 3.6, Kind$Shooter$const],
        prepend(
          [27, 5.4, Kind$Charger$const],
          prepend(
            [33, 7.2, Kind$Shooter$const],
            prepend(
              [40, 9, Kind$Charger$const],
              prepend([44, 9, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([42, 9], prepend([45, 9], List$Empty$const)),
    [22, 11],
    2
  );
}
function bowl() {
  return room(
    prepend(
      new Rect(12, 0, 6, 2, false),
      prepend(
        new Rect(27, 0, 13, 2, false),
        prepend(new Rect(33, 2, 7, 2.2, false), walls(40, 20))
      )
    ),
    prepend(
      [15, 2, Kind$Shooter$const],
      prepend(
        [21, 0, Kind$Charger$const],
        prepend(
          [24, 0, Kind$Charger$const],
          prepend(
            [30, 2, Kind$Charger$const],
            prepend(
              [36, 4.2, Kind$Shooter$const],
              prepend([38, 4.2, Kind$Charger$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([35, 4.2], prepend([38, 4.2], List$Empty$const)),
    [22, 7],
    2
  );
}
function tower() {
  return room(
    prepend(
      new Rect(12, 2.2, 6, 0.3, true),
      prepend(
        new Rect(16, 4.4, 8, 0.3, true),
        prepend(
          new Rect(26, 6.6, 8, 0.3, true),
          prepend(new Rect(16, 8.8, 8, 0.3, true), walls(40, 26))
        )
      )
    ),
    prepend(
      [14, 0, Kind$Charger$const],
      prepend(
        [20, 4.7, Kind$Shooter$const],
        prepend(
          [30, 0, Kind$Charger$const],
          prepend(
            [30, 6.9, Kind$Shooter$const],
            prepend(
              [15, 2.5, Kind$Charger$const],
              prepend([20, 9.1, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend(
      [17.5, 9.1],
      prepend([20, 9.1], prepend([22.5, 9.1], List$Empty$const))
    ),
    [24, 12],
    2
  );
}
function pillars() {
  return room(
    prepend(
      new Rect(14, 0, 2, 2, false),
      prepend(
        new Rect(22, 0, 2, 2.4, false),
        prepend(
          new Rect(30, 0, 2, 2, false),
          prepend(
            new Rect(17, 4.2, 4, 0.3, true),
            prepend(new Rect(33, 4.2, 4, 0.3, true), walls(44, 20))
          )
        )
      )
    ),
    prepend(
      [18, 0, Kind$Charger$const],
      prepend(
        [23, 2.4, Kind$Shooter$const],
        prepend(
          [27, 0, Kind$Charger$const],
          prepend(
            [31, 2, Kind$Shooter$const],
            prepend(
              [38, 0, Kind$Charger$const],
              prepend([19, 4.5, Kind$Charger$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend([38, 0], prepend([41, 0], List$Empty$const)),
    [28, 8],
    1
  );
}
function mesa() {
  return room(
    prepend(
      new Rect(16, 0, 8, 2.2, false),
      prepend(
        new Rect(10.5, 2.2, 3, 0.3, true),
        prepend(
          new Rect(26.5, 2.2, 3, 0.3, true),
          prepend(new Rect(30, 4, 5, 0.5, false), walls(40, 20))
        )
      )
    ),
    prepend(
      [14, 0, Kind$Charger$const],
      prepend(
        [20, 2.2, Kind$Shooter$const],
        prepend(
          [28, 0, Kind$Charger$const],
          prepend(
            [31, 4.5, Kind$Shooter$const],
            prepend(
              [33, 4.5, Kind$Charger$const],
              prepend([37, 0, Kind$Charger$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend(
      [30, 0],
      prepend([34, 0], prepend([38, 0], List$Empty$const))
    ),
    [24, 8],
    1
  );
}
function arena() {
  return room(
    prepend(
      new Rect(12, 2.2, 6, 0.3, true),
      prepend(
        new Rect(26, 2.2, 6, 0.3, true),
        prepend(new Rect(16, 4.4, 9, 0.3, true), walls(40, 20))
      )
    ),
    prepend(
      [16, 0, Kind$Charger$const],
      prepend(
        [20, 4.7, Kind$Shooter$const],
        prepend(
          [30, 0, Kind$Charger$const],
          prepend(
            [14, 2.5, Kind$Shooter$const],
            prepend(
              [35, 0, Kind$Charger$const],
              prepend([29, 2.5, Kind$Shooter$const], List$Empty$const)
            )
          )
        )
      )
    ),
    prepend(
      [32, 0],
      prepend([35, 0], prepend([38, 0], List$Empty$const))
    ),
    [26, 8],
    1
  );
}
function run_rooms() {
  return toList([
    arena(),
    mesa(),
    pillars(),
    tower(),
    bowl(),
    stairs(),
    long_hall(),
    bridge(),
    box2(),
    cellar(),
    gauntlet()
  ]);
}

// build/dev/javascript/triangle_platformer/skills.mjs
var OnJump = class extends CustomType {
};
var Trigger$OnJump$const = new OnJump();
var OnDash = class extends CustomType {
};
var Trigger$OnDash$const = new OnDash();
var OnHardLanding = class extends CustomType {
};
var Trigger$OnHardLanding$const = new OnHardLanding();
var Every = class extends CustomType {
  constructor(period) {
    super();
    this.period = period;
  }
};
var OnHit = class extends CustomType {
  constructor(period) {
    super();
    this.period = period;
  }
};
var JumpSlash = class extends CustomType {
};
var Effect$JumpSlash$const = new JumpSlash();
var DashStrike = class extends CustomType {
};
var Effect$DashStrike$const = new DashStrike();
var Shockwave = class extends CustomType {
};
var Effect$Shockwave$const = new Shockwave();
var Knife = class extends CustomType {
};
var Effect$Knife$const = new Knife();
var Bolt = class extends CustomType {
};
var Effect$Bolt$const = new Bolt();
var Arrow = class extends CustomType {
};
var Effect$Arrow$const = new Arrow();
var Orb = class extends CustomType {
};
var Effect$Orb$const = new Orb();
var Heal = class extends CustomType {
};
var Effect$Heal$const = new Heal();
var Skill = class extends CustomType {
  constructor(trigger, effect, timer) {
    super();
    this.trigger = trigger;
    this.effect = effect;
    this.timer = timer;
  }
};
var Strike = class extends CustomType {
  constructor(effect, x, y, w, h, vx, vy, ttl, follow, pierce, damage3, hit) {
    super();
    this.effect = effect;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = vx;
    this.vy = vy;
    this.ttl = ttl;
    this.follow = follow;
    this.pierce = pierce;
    this.damage = damage3;
    this.hit = hit;
  }
};
var Boost = class extends CustomType {
  constructor(damage3, reach3, slash2, shockwave, knives, pierce) {
    super();
    this.damage = damage3;
    this.reach = reach3;
    this.slash = slash2;
    this.shockwave = shockwave;
    this.knives = knives;
    this.pierce = pierce;
  }
};
var middle = 0.75;
var orbit_radius = 1.8;
var arrow_ttl = 0.8;
var arrow_speed = 22;
var orbit_squash = 0.35;
var orbit_speed = 3.9;
var arrow_far = 6;
function upto(from, to) {
  let $ = from > to;
  if ($) {
    return List$Empty$const;
  } else {
    return prepend(from, upto(from + 1, to));
  }
}
function volley(effect, cx, cy, w, h, speed3, ttl, damage3, b, aim) {
  return map3(
    upto(0, b.knives - 1),
    (i) => {
      let spread = (identity(i) - identity(b.knives - 1) / 2) * 0.15;
      let c = cos2(spread);
      let s = sin2(spread);
      let vx = aim[0] * c - aim[1] * s;
      let vy = aim[0] * s + aim[1] * c;
      return new Strike(
        effect,
        cx - w / 2,
        cy - h / 2,
        w,
        h,
        vx * speed3,
        vy * speed3,
        ttl,
        false,
        b.pierce,
        damage3,
        List$Empty$const
      );
    }
  );
}
function spawn2(effect, px, py, base, b, aim, facing) {
  let dmg = (f) => {
    return max(1, round(identity(base) * f * b.damage));
  };
  if (effect instanceof JumpSlash) {
    let k = b.reach * b.slash;
    let w = 2 * k;
    let _block;
    let $ = facing > 0;
    if ($) {
      _block = -0.2;
    } else {
      _block = 0.2 - w;
    }
    let x = _block;
    return prepend(
      new Strike(
        effect,
        x,
        0.3,
        w,
        1.6 * k,
        0,
        0,
        0.15,
        true,
        true,
        dmg(0.7),
        List$Empty$const
      ),
      List$Empty$const
    );
  } else if (effect instanceof DashStrike) {
    return prepend(
      new Strike(
        effect,
        -0.8,
        0,
        1.6,
        1.5,
        0,
        0,
        0.14,
        true,
        true,
        dmg(0.8),
        List$Empty$const
      ),
      List$Empty$const
    );
  } else if (effect instanceof Shockwave) {
    let w = 3.5 * b.reach * b.shockwave;
    return prepend(
      new Strike(
        effect,
        px - w / 2,
        py,
        w,
        0.8,
        0,
        0,
        0.15,
        false,
        true,
        dmg(1),
        List$Empty$const
      ),
      List$Empty$const
    );
  } else if (effect instanceof Knife) {
    return volley(effect, px, py + 0.9, 0.5, 0.2, 16, 0.8, dmg(0.5), b, aim);
  } else if (effect instanceof Bolt) {
    let d = 0.4 * b.reach;
    return volley(effect, px, py + 0.9, d, d, 16, 0.8, dmg(0.5), b, aim);
  } else if (effect instanceof Arrow) {
    let _block;
    let $1 = absolute_value2(aim[1]) > absolute_value2(aim[0]);
    if ($1) {
      _block = [0.15, 0.7];
    } else {
      _block = [0.7, 0.15];
    }
    let $ = _block;
    let w = $[0];
    let h = $[1];
    return volley(
      effect,
      px,
      py + middle,
      w,
      h,
      arrow_speed,
      arrow_ttl,
      dmg(1),
      b,
      aim
    );
  } else if (effect instanceof Orb) {
    let d = 0.5 * b.reach;
    return map3(
      prepend(
        orbit_radius,
        prepend(0 - orbit_radius, List$Empty$const)
      ),
      (ox) => {
        return new Strike(
          effect,
          ox - d / 2,
          middle - d / 2,
          d,
          d,
          0,
          0,
          1,
          true,
          true,
          dmg(0.6),
          List$Empty$const
        );
      }
    );
  } else {
    return List$Empty$const;
  }
}
function describe(s) {
  let _block;
  let $ = s.trigger;
  if ($ instanceof OnJump) {
    _block = "on jump";
  } else if ($ instanceof OnDash) {
    _block = "on dash";
  } else if ($ instanceof OnHardLanding) {
    _block = "on hard landing";
  } else if ($ instanceof Every) {
    let p = $.period;
    _block = "every " + float_to_string(p) + "s";
  } else {
    let p = $.period;
    _block = "on swing hit (" + float_to_string(p) + "s recharge)";
  }
  let when = _block;
  let _block$1;
  let $1 = s.effect;
  if ($1 instanceof JumpSlash) {
    _block$1 = "slash";
  } else if ($1 instanceof DashStrike) {
    _block$1 = "dash strike";
  } else if ($1 instanceof Shockwave) {
    _block$1 = "shockwave";
  } else if ($1 instanceof Knife) {
    _block$1 = "knife";
  } else if ($1 instanceof Bolt) {
    _block$1 = "mana bolt";
  } else if ($1 instanceof Arrow) {
    _block$1 = "arrow";
  } else if ($1 instanceof Orb) {
    _block$1 = "orb";
  } else {
    _block$1 = "heal";
  }
  let what = _block$1;
  return when + " -> " + what;
}
function strike_box(s, px, py) {
  let $ = s.follow;
  if ($) {
    return new Rect(px + s.x, py + s.y, s.w, s.h, false);
  } else {
    return new Rect(s.x, s.y, s.w, s.h, false);
  }
}
function advance(s, dt) {
  let $ = s.effect;
  if ($ instanceof Orb) {
    let half = s.w / 2;
    let x = s.x + half;
    let y = divideFloat(s.y + half - middle, orbit_squash);
    let c = cos2(orbit_speed * dt);
    let sn = sin2(orbit_speed * dt);
    return new Ok(
      new Strike(
        s.effect,
        x * c - y * sn - half,
        (x * sn + y * c) * orbit_squash + middle - half,
        s.w,
        s.h,
        s.vx,
        s.vy,
        s.ttl,
        s.follow,
        s.pierce,
        s.damage,
        s.hit
      )
    );
  } else {
    let s$1 = new Strike(
      s.effect,
      s.x + s.vx * dt,
      s.y + s.vy * dt,
      s.w,
      s.h,
      s.vx,
      s.vy,
      s.ttl - dt,
      s.follow,
      s.pierce,
      s.damage,
      s.hit
    );
    let $1 = s$1.ttl > 0;
    if ($1) {
      return new Ok(s$1);
    } else {
      return new Error(void 0);
    }
  }
}
function far(s) {
  return s.effect instanceof Arrow && (arrow_ttl - s.ttl) * arrow_speed >= arrow_far;
}

// build/dev/javascript/triangle_platformer/stats.mjs
var Fighter = class extends CustomType {
};
var Axis$Fighter$const = new Fighter();
var Rogue = class extends CustomType {
};
var Axis$Rogue$const = new Rogue();
var Mage = class extends CustomType {
};
var Axis$Mage$const = new Mage();
var Stats = class extends CustomType {
  constructor(fighter, rogue, mage) {
    super();
    this.fighter = fighter;
    this.rogue = rogue;
    this.mage = mage;
  }
};
function add2(s, axis) {
  if (axis instanceof Fighter) {
    return new Stats(s.fighter + 1, s.rogue, s.mage);
  } else if (axis instanceof Rogue) {
    return new Stats(s.fighter, s.rogue + 1, s.mage);
  } else {
    return new Stats(s.fighter, s.rogue, s.mage + 1);
  }
}
function lowest(s, axis) {
  let _block;
  if (axis instanceof Fighter) {
    _block = s.fighter;
  } else if (axis instanceof Rogue) {
    _block = s.rogue;
  } else {
    _block = s.mage;
  }
  let mine = _block;
  return mine === min(s.fighter, min(s.rogue, s.mage));
}
function max_hp2(s) {
  return 50 + 12 * s.fighter + 3 * s.rogue + 3 * s.mage;
}
function damage(s) {
  return 5 + 2 * s.fighter + 3 * s.rogue + s.mage;
}
function max_targets(s) {
  return 1 + globalThis.Math.trunc(s.mage / 2);
}
function reach(s) {
  return min2(1 + 0.08 * identity(s.mage), 2.5);
}
function speed(s) {
  let r = identity(s.rogue);
  return 1 + divideFloat(r, r + 15);
}

// build/dev/javascript/triangle_platformer/tree.mjs
var FILEPATH = "src/tree.gleam";
var Cell = class extends CustomType {
  constructor(id, name, f, r, m, up, x, y, starter) {
    super();
    this.id = id;
    this.name = name;
    this.f = f;
    this.r = r;
    this.m = m;
    this.up = up;
    this.x = x;
    this.y = y;
    this.starter = starter;
  }
};
var DoubleJump = class extends CustomType {
};
var Move$DoubleJump$const = new DoubleJump();
var Dash = class extends CustomType {
};
var Move$Dash$const = new Dash();
var WallJump = class extends CustomType {
};
var Move$WallJump$const = new WallJump();
var PogoRefreshesAir = class extends CustomType {
};
var Rule$PogoRefreshesAir$const = new PogoRefreshesAir();
var KillRefreshesDash = class extends CustomType {
};
var Rule$KillRefreshesDash$const = new KillRefreshesDash();
var FreeSwing = class extends CustomType {
};
var Rule$FreeSwing$const = new FreeSwing();
var DashCrits = class extends CustomType {
};
var Rule$DashCrits$const = new DashCrits();
var ThirdSwingBig = class extends CustomType {
};
var Rule$ThirdSwingBig$const = new ThirdSwingBig();
var Crash = class extends CustomType {
};
var Rule$Crash$const = new Crash();
var Bow = class extends CustomType {
};
var Rule$Bow$const = new Bow();
var Orbit = class extends CustomType {
};
var Rule$Orbit$const = new Orbit();
var AllRounder = class extends CustomType {
};
var Rule$AllRounder$const = new AllRounder();
var Aegis = class extends CustomType {
};
var Rule$Aegis$const = new Aegis();
var Plunge = class extends CustomType {
};
var Rule$Plunge$const = new Plunge();
var Stat = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var MaxHp = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DamagePct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var AttackSpeedPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ReachPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var CooldownPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Iframes = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var XpPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var KnockbackPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var CritPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Shield = class extends CustomType {
};
var Bonus$Shield$const = new Shield();
var ExtraKnife = class extends CustomType {
};
var Bonus$ExtraKnife$const = new ExtraKnife();
var KnifePierce = class extends CustomType {
};
var Bonus$KnifePierce$const = new KnifePierce();
var ShockwavePct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SlashPct = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ExtraDash = class extends CustomType {
};
var Bonus$ExtraDash$const = new ExtraDash();
var GrantSkill = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var GrantMove = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var GrantRule = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Keystone = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var Small = class extends CustomType {
  constructor(bonus) {
    super();
    this.bonus = bonus;
  }
};
var Notable = class extends CustomType {
  constructor(name, grant) {
    super();
    this.name = name;
    this.grant = grant;
  }
};
var Node2 = class extends CustomType {
  constructor(id, kind, cell, x, y) {
    super();
    this.id = id;
    this.kind = kind;
    this.cell = cell;
    this.x = x;
    this.y = y;
  }
};
var Tree = class extends CustomType {
  constructor(cells2, nodes2, neighbours, rings, edges) {
    super();
    this.cells = cells2;
    this.nodes = nodes2;
    this.neighbours = neighbours;
    this.rings = rings;
    this.edges = edges;
  }
};
var Spec = class extends CustomType {
  constructor(skill, second) {
    super();
    this.skill = skill;
    this.second = second;
  }
};
var Acc = class extends CustomType {
  constructor(seed, next_id, nodes2, edges) {
    super();
    this.seed = seed;
    this.next_id = next_id;
    this.nodes = nodes2;
    this.edges = edges;
  }
};
var side = 210;
var sqrt3 = 1.7320508075688772;
var spur_room = 3;
var spacing = 3;
var layout_seed = 20261122;
function keystone_rule(name) {
  if (name === "Knight") {
    return new Some(Rule$Crash$const);
  } else if (name === "Hunter") {
    return new Some(Rule$Bow$const);
  } else if (name === "Sorcerer") {
    return new Some(Rule$Orbit$const);
  } else if (name === "Bard") {
    return new Some(Rule$AllRounder$const);
  } else if (name === "Paladin") {
    return new Some(Rule$Aegis$const);
  } else if (name === "Thief") {
    return new Some(Rule$Plunge$const);
  } else {
    return Option$None$const;
  }
}
function point(f, r, m) {
  let h = side * sqrt3 / 2;
  return [r * (0 - side / 2) + m * (side / 2), f * h];
}
function cells() {
  let _pipe = toList([
    ["Warrior", 3, 0, 0, true, false],
    ["Cavalier", 2, 1, 0, true, false],
    ["Berserker", 2, 0, 1, true, false],
    ["Knight", 2, 0, 0, false, true],
    ["Thief", 0, 3, 0, true, false],
    ["Bandit", 1, 2, 0, true, false],
    ["Trickster", 0, 2, 1, true, false],
    ["Hunter", 0, 2, 0, false, true],
    ["Wizard", 0, 0, 3, true, false],
    ["Cleric", 1, 0, 2, true, false],
    ["Witch", 0, 1, 2, true, false],
    ["Sorcerer", 0, 0, 2, false, true],
    ["Bard", 1, 1, 1, true, true],
    ["Duelist", 1, 1, 0, false, false],
    ["Paladin", 1, 0, 1, false, false],
    ["Alchemist", 0, 1, 1, false, false]
  ]);
  return index_map(
    _pipe,
    (c, id) => {
      let name = c[0];
      let f = c[1];
      let r = c[2];
      let m = c[3];
      let up = c[4];
      let starter = c[5];
      let _block;
      if (up) {
        _block = 1 / 3;
      } else {
        _block = 2 / 3;
      }
      let k = _block;
      let $ = point(
        (identity(f) + k) / 4,
        (identity(r) + k) / 4,
        (identity(m) + k) / 4
      );
      let x = $[0];
      let y = $[1];
      return new Cell(id, name, f, r, m, up, x, y, starter);
    }
  );
}
function starters() {
  let _pipe = cells();
  let _pipe$1 = filter(_pipe, (c) => {
    return c.starter;
  });
  return map3(_pipe$1, (c) => {
    return c.id;
  });
}
function spec(name) {
  if (name === "Warrior") {
    return new Spec(
      new Skill(Trigger$OnHardLanding$const, Effect$Shockwave$const, 0),
      new GrantRule(Rule$ThirdSwingBig$const)
    );
  } else if (name === "Cavalier") {
    return new Spec(
      new Skill(Trigger$OnDash$const, Effect$Shockwave$const, 0),
      new GrantMove(Move$Dash$const)
    );
  } else if (name === "Berserker") {
    return new Spec(
      new Skill(new Every(2), Effect$Shockwave$const, 2),
      new GrantRule(Rule$FreeSwing$const)
    );
  } else if (name === "Knight") {
    return new Spec(
      new Skill(Trigger$OnHardLanding$const, Effect$Shockwave$const, 0),
      new GrantMove(Move$Dash$const)
    );
  } else if (name === "Thief") {
    return new Spec(
      new Skill(Trigger$OnDash$const, Effect$Knife$const, 0),
      new GrantRule(Rule$KillRefreshesDash$const)
    );
  } else if (name === "Bandit") {
    return new Spec(
      new Skill(Trigger$OnJump$const, Effect$Knife$const, 0),
      new GrantRule(Rule$DashCrits$const)
    );
  } else if (name === "Trickster") {
    return new Spec(
      new Skill(Trigger$OnDash$const, Effect$JumpSlash$const, 0),
      new GrantMove(Move$WallJump$const)
    );
  } else if (name === "Hunter") {
    return new Spec(
      new Skill(Trigger$OnDash$const, Effect$DashStrike$const, 0),
      new GrantMove(Move$Dash$const)
    );
  } else if (name === "Wizard") {
    return new Spec(
      new Skill(new Every(1), Effect$Bolt$const, 1),
      new GrantMove(Move$DoubleJump$const)
    );
  } else if (name === "Cleric") {
    return new Spec(
      new Skill(new OnHit(5), Effect$Heal$const, 0),
      new GrantRule(Rule$FreeSwing$const)
    );
  } else if (name === "Witch") {
    return new Spec(
      new Skill(new Every(2), Effect$JumpSlash$const, 2),
      new GrantRule(Rule$PogoRefreshesAir$const)
    );
  } else if (name === "Sorcerer") {
    return new Spec(
      new Skill(new Every(1.5), Effect$Bolt$const, 1.5),
      new GrantMove(Move$Dash$const)
    );
  } else if (name === "Bard") {
    return new Spec(
      new Skill(Trigger$OnJump$const, Effect$JumpSlash$const, 0),
      new GrantMove(Move$Dash$const)
    );
  } else if (name === "Duelist") {
    return new Spec(
      new Skill(Trigger$OnJump$const, Effect$DashStrike$const, 0),
      new GrantRule(Rule$DashCrits$const)
    );
  } else if (name === "Paladin") {
    return new Spec(
      new Skill(new OnHit(10), Effect$Heal$const, 0),
      new GrantRule(Rule$ThirdSwingBig$const)
    );
  } else {
    return new Spec(
      new Skill(new Every(3), Effect$Shockwave$const, 3),
      new GrantRule(Rule$PogoRefreshesAir$const)
    );
  }
}
function nth(items, i) {
  let _block;
  let _pipe = drop(items, i);
  _block = first(_pipe);
  let $ = _block;
  let x;
  if ($ instanceof Ok) {
    x = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "tree",
      262,
      "nth",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 7402,
        end: 7454,
        pattern_start: 7413,
        pattern_end: 7418
      }
    );
  }
  return x;
}
function spur_grant(i) {
  let grants = prepend(
    new GrantMove(Move$Dash$const),
    prepend(
      new GrantMove(Move$DoubleJump$const),
      prepend(
        new GrantMove(Move$WallJump$const),
        prepend(
          new GrantRule(Rule$PogoRefreshesAir$const),
          prepend(
            new GrantRule(Rule$KillRefreshesDash$const),
            prepend(
              new GrantRule(Rule$FreeSwing$const),
              prepend(
                new GrantRule(Rule$DashCrits$const),
                prepend(
                  new GrantRule(Rule$ThirdSwingBig$const),
                  List$Empty$const
                )
              )
            )
          )
        )
      )
    )
  );
  return nth(grants, remainderInt(i, length(grants)));
}
function lesser(s) {
  let $ = s.effect;
  if ($ instanceof JumpSlash) {
    return [new SlashPct(10), new DamagePct(5)];
  } else if ($ instanceof DashStrike) {
    return [new DamagePct(5), new Iframes(0.1)];
  } else if ($ instanceof Shockwave) {
    return [new ShockwavePct(10), new DamagePct(5)];
  } else if ($ instanceof Knife) {
    return [new DamagePct(5), new CooldownPct(5)];
  } else if ($ instanceof Bolt) {
    return [new DamagePct(5), new CooldownPct(5)];
  } else if ($ instanceof Arrow) {
    return [new DamagePct(5), new CooldownPct(5)];
  } else if ($ instanceof Orb) {
    return [new DamagePct(5), new ReachPct(10)];
  } else {
    return [new MaxHp(5), new CooldownPct(5)];
  }
}
function upgrades(s) {
  let $ = s.effect;
  if ($ instanceof JumpSlash) {
    return [new SlashPct(30), new SlashPct(30)];
  } else if ($ instanceof DashStrike) {
    return [Bonus$ExtraDash$const, new DamagePct(10)];
  } else if ($ instanceof Shockwave) {
    return [new ShockwavePct(30), new ShockwavePct(30)];
  } else if ($ instanceof Knife) {
    return [Bonus$ExtraKnife$const, Bonus$KnifePierce$const];
  } else if ($ instanceof Bolt) {
    return [Bonus$ExtraKnife$const, Bonus$KnifePierce$const];
  } else if ($ instanceof Arrow) {
    return [Bonus$ExtraKnife$const, Bonus$KnifePierce$const];
  } else if ($ instanceof Orb) {
    return [new DamagePct(10), new ReachPct(15)];
  } else {
    return [new CooldownPct(15), new MaxHp(10)];
  }
}
function pool(axis) {
  if (axis instanceof Fighter) {
    return prepend(
      new Stat(Axis$Fighter$const),
      prepend(
        new MaxHp(10),
        prepend(
          new DamagePct(8),
          prepend(
            new KnockbackPct(25),
            prepend(
              Bonus$Shield$const,
              prepend(new Iframes(0.2), List$Empty$const)
            )
          )
        )
      )
    );
  } else if (axis instanceof Rogue) {
    return prepend(
      new Stat(Axis$Rogue$const),
      prepend(
        new AttackSpeedPct(8),
        prepend(
          new CritPct(5),
          prepend(
            new DamagePct(8),
            prepend(
              new XpPct(15),
              prepend(new CooldownPct(8), List$Empty$const)
            )
          )
        )
      )
    );
  } else {
    return prepend(
      new Stat(Axis$Mage$const),
      prepend(
        new ReachPct(10),
        prepend(
          new CooldownPct(10),
          prepend(
            new DamagePct(8),
            prepend(
              new XpPct(15),
              prepend(new MaxHp(8), List$Empty$const)
            )
          )
        )
      )
    );
  }
}
function adjacent(loop$a, loop$b) {
  while (true) {
    let a = loop$a;
    let b = loop$b;
    let $ = a.up;
    let $1 = b.up;
    if ($) {
      if (!$1) {
        return a.f + a.r + a.m - 1 === b.f + b.r + b.m && a.f >= b.f && a.r >= b.r && a.m >= b.m;
      } else {
        return false;
      }
    } else if ($1) {
      loop$a = b;
      loop$b = a;
    } else {
      return false;
    }
  }
}
function region(c) {
  let $ = c.f >= 2;
  let $1 = c.r >= 2;
  let $2 = c.m >= 2;
  if ($) {
    return new Some(Axis$Fighter$const);
  } else if ($1) {
    return new Some(Axis$Rogue$const);
  } else if ($2) {
    return new Some(Axis$Mage$const);
  } else {
    return Option$None$const;
  }
}
function ring_size(neighbours) {
  if (neighbours === 1) {
    return 8;
  } else if (neighbours === 2) {
    return 10;
  } else {
    return 12;
  }
}
function facing_axis(x, y, cx, cy) {
  let dx = x - cx;
  let dy = y - cy;
  let f = dy;
  let r = 0 - dx * sqrt3 / 2 - dy / 2;
  let m = dx * sqrt3 / 2 - dy / 2;
  let $ = f >= r && f >= m;
  let $1 = r >= m;
  if ($) {
    return Axis$Fighter$const;
  } else if ($1) {
    return Axis$Rogue$const;
  } else {
    return Axis$Mage$const;
  }
}
function add3(acc2, kind, cell, x, y) {
  let $ = between(acc2.seed, -0.5, 0.5);
  let s = $[0];
  let jx = $[1];
  let $1 = between(s, -0.5, 0.5);
  let s$1 = $1[0];
  let jy = $1[1];
  let n = new Node2(acc2.next_id, kind, cell, x + jx, y + jy);
  return [
    new Acc(s$1, acc2.next_id + 1, prepend(n, acc2.nodes), acc2.edges),
    n
  ];
}
function link(acc2, a, b) {
  return new Acc(
    acc2.seed,
    acc2.next_id,
    acc2.nodes,
    prepend([a, b], acc2.edges)
  );
}
function small(acc2, axis) {
  let items = pool(axis);
  let s = next(acc2.seed);
  return [
    new Acc(s, acc2.next_id, acc2.nodes, acc2.edges),
    new Small(nth(items, remainderInt(s, length(items))))
  ];
}
function find2(acc2, id) {
  let $ = find(acc2.nodes, (n2) => {
    return n2.id === id;
  });
  let n;
  if ($ instanceof Ok) {
    n = $[0];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "tree",
      382,
      "find",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 10834,
        end: 10895,
        pattern_start: 10845,
        pattern_end: 10850
      }
    );
  }
  return n;
}
function grant_name(g) {
  if (g instanceof GrantSkill) {
    let s = g[0];
    return describe(s);
  } else if (g instanceof GrantMove) {
    let $ = g[0];
    if ($ instanceof DoubleJump) {
      return "Move: double jump (+1 air jump)";
    } else if ($ instanceof Dash) {
      return "Move: dash (+1 dash charge)";
    } else {
      return "Move: wall-jump";
    }
  } else {
    let $ = g[0];
    if ($ instanceof PogoRefreshesAir) {
      return "Pogo hits refresh your air jump";
    } else if ($ instanceof KillRefreshesDash) {
      return "Kills refresh your dash";
    } else if ($ instanceof FreeSwing) {
      return "Ground swings don't stop you";
    } else if ($ instanceof DashCrits) {
      return "Hits while dashing always crit";
    } else if ($ instanceof ThirdSwingBig) {
      return "Every third swing is twice as big";
    } else if ($ instanceof Crash) {
      return "Crash: a hard landing readies a block (one at a time)";
    } else if ($ instanceof Bow) {
      return "Bow: attack fires arrows; they crit past 6 tiles";
    } else if ($ instanceof Orbit) {
      return "Orbit: two orbs circle you and hit what they touch";
    } else if ($ instanceof AllRounder) {
      return "All-rounder: raising your lowest stat raises it twice";
    } else if ($ instanceof Aegis) {
      return "Aegis: hits deal half damage and can't knock you back";
    } else {
      return "Plunge: the first down attack of a jump dives, always crits and bounces off what it hits";
    }
  }
}
function upto2(from, to) {
  let $ = from > to;
  if ($) {
    return List$Empty$const;
  } else {
    return prepend(from, upto2(from + 1, to));
  }
}
function dist2(ax, ay, bx, by) {
  return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
}
function unit2(x, y) {
  let _block;
  let $ = square_root(x * x + y * y);
  if ($ instanceof Ok) {
    let l = $[0];
    if (l > 0) {
      _block = l;
    } else {
      _block = 1;
    }
  } else {
    _block = 1;
  }
  let len = _block;
  return [divideFloat(x, len), divideFloat(y, len)];
}
function perp(x, y) {
  return unit2(0 - y, x);
}
function build() {
  let cs = cells();
  let degree = (c) => {
    return count(cs, (_capture) => {
      return adjacent(c, _capture);
    });
  };
  let centre = point(1 / 3, 1 / 3, 1 / 3);
  let keystones = map3(
    cs,
    (c) => {
      return new Node2(c.id, new Keystone(c.name), c.id, c.x, c.y);
    }
  );
  let acc2 = new Acc(layout_seed, 16, keystones, List$Empty$const);
  let $ = fold2(
    cs,
    [acc2, List$Empty$const],
    (state, c) => {
      let acc$12 = state[0];
      let rings2 = state[1];
      let n = ring_size(degree(c));
      let sp = spec(c.name);
      let $1 = lesser(sp.skill);
      let up1 = $1[0];
      let up2 = $1[1];
      let $2 = between(acc$12.seed, 6.5, 8);
      let s = $2[0];
      let base = $2[1];
      let $3 = between(s, 0.75, 1);
      let s$1 = $3[0];
      let squash = $3[1];
      let $4 = between(s$1, 0, 3.14);
      let s$2 = $4[0];
      let tilt = $4[1];
      let acc$22 = new Acc(s$2, acc$12.next_id, acc$12.nodes, acc$12.edges);
      let to_centre = atan22(centre[1] - c.y, centre[0] - c.x);
      let $5 = fold2(
        upto2(0, n - 1),
        [acc$22, List$Empty$const],
        (st, k) => {
          let acc$33 = st[0];
          let ids2 = st[1];
          let a = to_centre + divideFloat(
            2 * pi2() * identity(k),
            identity(n)
          );
          let $6 = between(acc$33.seed, -1, 1);
          let s$3 = $6[0];
          let noise = $6[1];
          let acc$42 = new Acc(s$3, acc$33.next_id, acc$33.nodes, acc$33.edges);
          let _block2;
          let $7 = region(c);
          if ($7 instanceof Some) {
            let $82 = $7[0];
            if ($82 instanceof Fighter) {
              _block2 = base * 1.1;
            } else if ($82 instanceof Rogue) {
              _block2 = base * (1 + 0.2 * noise);
            } else {
              let $92 = k % 2;
              if ($92 === 0) {
                _block2 = base * 1.2;
              } else {
                _block2 = base * 0.8;
              }
            }
          } else {
            _block2 = base;
          }
          let r = _block2;
          let ex = r * cos2(a);
          let ey = r * squash * sin2(a);
          let x = c.x + ex * cos2(tilt) - ey * sin2(tilt);
          let y = c.y + ex * sin2(tilt) + ey * cos2(tilt);
          let _block$1;
          if (k === 0) {
            _block$1 = [
              acc$42,
              new Notable(
                c.name + ": " + describe(sp.skill),
                new GrantSkill(sp.skill)
              )
            ];
          } else if (k === 1) {
            _block$1 = [acc$42, new Small(up1)];
          } else if (k === n - 1) {
            _block$1 = [acc$42, new Small(up2)];
          } else if (k === divideInt(n, 2)) {
            _block$1 = [acc$42, new Notable(grant_name(sp.second), sp.second)];
          } else {
            _block$1 = small(
              acc$42,
              unwrap(region(c), facing_axis(x, y, c.x, c.y))
            );
          }
          let $8 = _block$1;
          let acc$5 = $8[0];
          let kind = $8[1];
          let $9 = add3(acc$5, kind, c.id, x, y);
          let acc$6 = $9[0];
          let node = $9[1];
          return [link(acc$6, c.id, node.id), prepend(node.id, ids2)];
        }
      );
      let acc$32 = $5[0];
      let ids = $5[1];
      let ids$1 = reverse2(ids);
      let _block;
      if (ids$1 instanceof Empty) {
        _block = acc$32;
      } else {
        let first2 = ids$1.head;
        let _pipe = zip(
          ids$1,
          append(
            drop(ids$1, 1),
            prepend(first2, List$Empty$const)
          )
        );
        _block = fold2(
          _pipe,
          acc$32,
          (acc3, e) => {
            return link(acc3, e[0], e[1]);
          }
        );
      }
      let acc$4 = _block;
      return [acc$4, prepend([c.id, ids$1], rings2)];
    }
  );
  let acc$1 = $[0];
  let rings = $[1];
  let rings$1 = from_list(rings);
  let nearest = (acc3, cell, tx, ty) => {
    let $1 = get(rings$1, cell.id);
    let ring;
    if ($1 instanceof Ok) {
      ring = $1[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "tree",
        456,
        "build",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 13705,
          end: 13751,
          pattern_start: 13716,
          pattern_end: 13724
        }
      );
    }
    let _block;
    let _pipe = ring;
    let _pipe$1 = map3(
      _pipe,
      (_capture) => {
        return find2(acc3, _capture);
      }
    );
    _block = sort(
      _pipe$1,
      (p, q) => {
        return compare2(dist2(p.x, p.y, tx, ty), dist2(q.x, q.y, tx, ty));
      }
    );
    let $2 = _block;
    let n;
    if ($2 instanceof Empty) {
      throw makeError(
        "let_assert",
        FILEPATH,
        "tree",
        457,
        "build",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $2,
          start: 13756,
          end: 13930,
          pattern_start: 13767,
          pattern_end: 13774
        }
      );
    } else {
      n = $2.head;
    }
    return n;
  };
  let pairs = flat_map(
    cs,
    (a) => {
      return filter_map(
        cs,
        (b) => {
          let $1 = a.up && adjacent(a, b);
          if ($1) {
            return new Ok([a, b]);
          } else {
            return new Error(void 0);
          }
        }
      );
    }
  );
  let acc$2 = index_fold(
    pairs,
    acc$1,
    (acc3, pair, i) => {
      let a = pair[0];
      let b = pair[1];
      let from = nearest(acc3, a, b.x, b.y);
      let to = nearest(acc3, b, a.x, a.y);
      let $1 = between(acc3.seed, 2, 5.99);
      let s = $1[0];
      let len = $1[1];
      let $2 = between(s, -5, 5);
      let s$1 = $2[0];
      let bend = $2[1];
      let acc$22 = new Acc(s$1, acc3.next_id, acc3.nodes, acc3.edges);
      let gap = square_root(dist2(from.x, from.y, to.x, to.y));
      let fits = truncate(divideFloat(unwrap2(gap, 0), spacing)) - 1;
      let len$1 = max(0, min(truncate(len), fits));
      let $3 = perp(to.x - from.x, to.y - from.y);
      let nx = $3[0];
      let ny = $3[1];
      let cx = (from.x + to.x) / 2 + nx * bend;
      let cy = (from.y + to.y) / 2 + ny * bend;
      let $4 = fold2(
        upto2(1, len$1),
        [acc$22, prepend(from.id, List$Empty$const)],
        (st, k) => {
          let acc$33 = st[0];
          let chain2 = st[1];
          let t = divideFloat(identity(k), identity(len$1 + 1));
          let u = 1 - t;
          let x = u * u * from.x + 2 * u * t * cx + t * t * to.x;
          let y = u * u * from.y + 2 * u * t * cy + t * t * to.y;
          let $52 = small(acc$33, facing_axis(x, y, centre[0], centre[1]));
          let acc$42 = $52[0];
          let kind = $52[1];
          let $6 = add3(acc$42, kind, -1, x, y);
          let acc$5 = $6[0];
          let node = $6[1];
          let prev;
          if (chain2 instanceof Empty) {
            throw makeError(
              "let_assert",
              FILEPATH,
              "tree",
              501,
              "build",
              "Pattern match failed, no pattern matched the value.",
              {
                value: chain2,
                start: 15545,
                end: 15574,
                pattern_start: 15556,
                pattern_end: 15566
              }
            );
          } else {
            prev = chain2.head;
          }
          return [link(acc$5, prev, node.id), prepend(node.id, chain2)];
        }
      );
      let acc$32 = $4[0];
      let chain = $4[1];
      let last3;
      if (chain instanceof Empty) {
        throw makeError(
          "let_assert",
          FILEPATH,
          "tree",
          504,
          "build",
          "Pattern match failed, no pattern matched the value.",
          {
            value: chain,
            start: 15650,
            end: 15679,
            pattern_start: 15661,
            pattern_end: 15671
          }
        );
      } else {
        last3 = chain.head;
      }
      let acc$4 = link(acc$32, last3, to.id);
      let $5 = i % 3;
      if ($5 === 0) {
        let mid = find2(acc$4, nth(chain, globalThis.Math.trunc(len$1 / 2)));
        let px = mid.x + nx * 3;
        let py = mid.y + ny * 3;
        let axis = facing_axis(px, py, centre[0], centre[1]);
        let $6 = small(acc$4, axis);
        let acc$5 = $6[0];
        let k1 = $6[1];
        let $7 = add3(acc$5, k1, -1, px - ny * 1.5, py + nx * 1.5);
        let acc$6 = $7[0];
        let n1 = $7[1];
        let $8 = small(acc$6, axis);
        let acc$7 = $8[0];
        let k2 = $8[1];
        let $9 = add3(acc$7, k2, -1, px + ny * 1.5, py - nx * 1.5);
        let acc$8 = $9[0];
        let n2 = $9[1];
        let _pipe = acc$8;
        let _pipe$1 = link(_pipe, mid.id, n1.id);
        let _pipe$2 = link(_pipe$1, n1.id, n2.id);
        return link(_pipe$2, n2.id, mid.id);
      } else {
        return acc$4;
      }
    }
  );
  let acc$3 = index_fold(
    cs,
    acc$2,
    (acc3, c, i) => {
      let _block;
      let $2 = c.starter && c.f === 1;
      if ($2) {
        _block = [-0.6, -0.8];
      } else {
        _block = unit2(c.x - centre[0], c.y - centre[1]);
      }
      let $1 = _block;
      let dx = $1[0];
      let dy = $1[1];
      let $3 = between(acc3.seed, -0.9, 0.9);
      let s = $3[0];
      let turn = $3[1];
      let acc$32 = new Acc(s, acc3.next_id, acc3.nodes, acc3.edges);
      let lay = (turn2) => {
        let rx2 = dx * cos2(turn2) - dy * sin2(turn2);
        let ry2 = dx * sin2(turn2) + dy * cos2(turn2);
        return [nearest(acc$32, c, c.x + rx2 * 20, c.y + ry2 * 20), rx2, ry2];
      };
      let room2 = (spur) => {
        let start2 = spur[0];
        let rx2 = spur[1];
        let ry2 = spur[2];
        return fold2(
          upto2(2, 8),
          1e3,
          (least, k) => {
            let d = identity(k) * 1.5;
            return fold2(
              acc$32.nodes,
              least,
              (least2, n) => {
                let $42 = n.id === start2.id;
                if ($42) {
                  return least2;
                } else {
                  let _pipe2 = dist2(
                    n.x,
                    n.y,
                    start2.x + rx2 * d,
                    start2.y + ry2 * d
                  );
                  return min2(_pipe2, least2);
                }
              }
            );
          }
        );
      };
      let spurs = flat_map(
        upto2(0, 10),
        (k) => {
          let off = identity(k) * 0.3;
          return prepend(
            lay(turn + off),
            prepend(lay(turn - off), List$Empty$const)
          );
        }
      );
      let _block$1;
      let _pipe = find(
        spurs,
        (s4) => {
          return room2(s4) >= spur_room * spur_room;
        }
      );
      _block$1 = lazy_or(
        _pipe,
        () => {
          return max2(
            spurs,
            (a, b) => {
              return compare2(room2(a), room2(b));
            }
          );
        }
      );
      let $4 = _block$1;
      let start;
      let rx;
      let ry;
      if ($4 instanceof Ok) {
        start = $4[0][0];
        rx = $4[0][1];
        ry = $4[0][2];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "tree",
          562,
          "build",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $4,
            start: 17907,
            end: 18127,
            pattern_start: 17918,
            pattern_end: 17938
          }
        );
      }
      let axis = unwrap(
        region(c),
        facing_axis(start.x, start.y, c.x, c.y)
      );
      let $5 = upgrades(spec(c.name).skill);
      let strong1 = $5[0];
      let strong2 = $5[1];
      let $6 = small(acc$32, axis);
      let acc$4 = $6[0];
      let k1 = $6[1];
      let $7 = add3(acc$4, k1, c.id, start.x + rx * 3, start.y + ry * 3);
      let acc$5 = $7[0];
      let s1 = $7[1];
      let $8 = add3(
        acc$5,
        new Small(strong1),
        c.id,
        start.x + rx * 6,
        start.y + ry * 6
      );
      let acc$6 = $8[0];
      let s2 = $8[1];
      let $9 = add3(
        acc$6,
        new Small(strong2),
        c.id,
        start.x + rx * 9,
        start.y + ry * 9
      );
      let acc$7 = $9[0];
      let s3 = $9[1];
      let g = spur_grant(i);
      let $10 = add3(
        acc$7,
        new Notable(grant_name(g), g),
        c.id,
        start.x + rx * 12,
        start.y + ry * 12
      );
      let acc$8 = $10[0];
      let end = $10[1];
      let _pipe$1 = acc$8;
      let _pipe$2 = link(_pipe$1, start.id, s1.id);
      let _pipe$3 = link(_pipe$2, s1.id, s2.id);
      let _pipe$4 = link(_pipe$3, s2.id, s3.id);
      return link(_pipe$4, s3.id, end.id);
    }
  );
  let neighbours = fold2(
    acc$3.edges,
    make(),
    (d, e) => {
      let _pipe = d;
      let _pipe$1 = upsert(
        _pipe,
        e[0],
        (v2) => {
          return prepend(e[1], unwrap(v2, List$Empty$const));
        }
      );
      return upsert(
        _pipe$1,
        e[1],
        (v2) => {
          return prepend(e[0], unwrap(v2, List$Empty$const));
        }
      );
    }
  );
  return new Tree(
    cs,
    from_list(map3(acc$3.nodes, (n) => {
      return [n.id, n];
    })),
    neighbours,
    rings$1,
    acc$3.edges
  );
}
function can_allocate(t, owned, id) {
  let $ = get(t.nodes, id);
  if ($ instanceof Ok) {
    if ($[0].kind instanceof Keystone) {
      return false;
    } else {
      return !contains(owned, id) && any(
        (() => {
          let _pipe = get(t.neighbours, id);
          let _pipe$1 = from_result(_pipe);
          return unwrap(_pipe$1, List$Empty$const);
        })(),
        (_capture) => {
          return contains(owned, _capture);
        }
      );
    }
  } else {
    return false;
  }
}
function saturated(t, owned, own) {
  let _pipe = to_list(t.rings);
  return filter_map(
    _pipe,
    (pair) => {
      let key2 = pair[0];
      let ring = pair[1];
      let $ = key2 !== own && all(
        ring,
        (_capture) => {
          return contains(owned, _capture);
        }
      );
      if ($) {
        return new Ok(key2);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function nodes(t) {
  return values2(t.nodes);
}
function bonus_name(b) {
  let pct2 = (n, what) => {
    return "+" + to_string(n) + "% " + what;
  };
  if (b instanceof Stat) {
    let $ = b[0];
    if ($ instanceof Fighter) {
      return "+1 Fighter";
    } else if ($ instanceof Rogue) {
      return "+1 Rogue";
    } else {
      return "+1 Mage";
    }
  } else if (b instanceof MaxHp) {
    let n = b[0];
    return "+" + to_string(n) + " max HP";
  } else if (b instanceof DamagePct) {
    let n = b[0];
    return pct2(n, "damage");
  } else if (b instanceof AttackSpeedPct) {
    let n = b[0];
    return pct2(n, "attack speed");
  } else if (b instanceof ReachPct) {
    let n = b[0];
    return pct2(n, "reach");
  } else if (b instanceof CooldownPct) {
    let n = b[0];
    return "-" + to_string(n) + "% skill cooldowns";
  } else if (b instanceof Iframes) {
    let s = b[0];
    return "+" + float_to_string(s) + "s invulnerability after a hit";
  } else if (b instanceof XpPct) {
    let n = b[0];
    return pct2(n, "XP");
  } else if (b instanceof KnockbackPct) {
    let n = b[0];
    return pct2(n, "knockback");
  } else if (b instanceof CritPct) {
    let n = b[0];
    return pct2(n, "crit chance");
  } else if (b instanceof Shield) {
    return "+1 shield (blocks one hit per room)";
  } else if (b instanceof ExtraKnife) {
    return "+1 knife, bolt or arrow per throw";
  } else if (b instanceof KnifePierce) {
    return "Knives, bolts and arrows pierce";
  } else if (b instanceof ShockwavePct) {
    let n = b[0];
    return pct2(n, "shockwave size");
  } else if (b instanceof SlashPct) {
    let n = b[0];
    return pct2(n, "slash size");
  } else {
    return "+1 dash charge";
  }
}
function bfs(loop$t, loop$target, loop$frontier, loop$seen, loop$depth) {
  while (true) {
    let t = loop$t;
    let target = loop$target;
    let frontier = loop$frontier;
    let seen = loop$seen;
    let depth = loop$depth;
    let _block;
    let _pipe = frontier;
    let _pipe$1 = flat_map(
      _pipe,
      (id) => {
        let _pipe$12 = get(t.neighbours, id);
        let _pipe$22 = from_result(_pipe$12);
        return unwrap(_pipe$22, List$Empty$const);
      }
    );
    let _pipe$2 = unique(_pipe$1);
    _block = filter(
      _pipe$2,
      (id) => {
        return !contains(seen, id) && (() => {
          let $2 = get(t.nodes, id);
          if ($2 instanceof Ok && $2[0].kind instanceof Keystone) {
            return false;
          } else {
            return true;
          }
        })();
      }
    );
    let next3 = _block;
    let $ = contains(next3, target);
    if (next3 instanceof Empty) {
      return -1;
    } else if ($) {
      return depth;
    } else {
      loop$t = t;
      loop$target = target;
      loop$frontier = next3;
      loop$seen = append(seen, next3);
      loop$depth = depth + 1;
    }
  }
}
function distance(t, owned, id) {
  let $ = contains(owned, id);
  if ($) {
    return 0;
  } else {
    return bfs(t, id, owned, owned, 1);
  }
}
function details(t, n) {
  let _block;
  let _pipe = get(t.rings, n.cell);
  let _pipe$1 = from_result(_pipe);
  let _pipe$2 = unwrap(_pipe$1, List$Empty$const);
  _block = contains(_pipe$2, n.id);
  let in_ring = _block;
  let _block$1;
  let $ = find(t.cells, (c) => {
    return c.id === n.cell;
  });
  if ($ instanceof Ok) {
    if (in_ring) {
      let c = $[0];
      _block$1 = c.name + "'s ring";
    } else {
      let c = $[0];
      _block$1 = "a spur off " + c.name + "'s ring";
    }
  } else {
    _block$1 = "a path between rings";
  }
  let home = _block$1;
  let $1 = n.kind;
  if ($1 instanceof Keystone) {
    let name = $1.name;
    let sp = spec(name);
    let _block$2;
    let _pipe$3 = get(t.rings, n.id);
    let _pipe$4 = from_result(_pipe$3);
    _block$2 = unwrap(_pipe$4, List$Empty$const);
    let ring = _block$2;
    return flatten(
      prepend(
        prepend(
          name,
          prepend(
            "Keystone: a class. You get one per run, picked at the start.",
            List$Empty$const
          )
        ),
        prepend(
          (() => {
            let $2 = keystone_rule(name);
            if ($2 instanceof Some) {
              let rule = $2[0];
              return prepend(
                grant_name(new GrantRule(rule)),
                List$Empty$const
              );
            } else {
              return List$Empty$const;
            }
          })(),
          prepend(
            prepend(
              "Signature skill (on its ring): " + describe(sp.skill),
              prepend(
                "Also on its ring: " + grant_name(sp.second),
                prepend(
                  "Ring: " + to_string(length(ring)) + " nodes. Fill all of them to unlock " + name + ".",
                  List$Empty$const
                )
              )
            ),
            List$Empty$const
          )
        )
      )
    );
  } else if ($1 instanceof Small) {
    let b = $1.bonus;
    return prepend(
      bonus_name(b),
      prepend(
        "Small node: a bonus.",
        prepend("In " + home + ".", List$Empty$const)
      )
    );
  } else {
    let name = $1.name;
    let g = $1.grant;
    return unique(
      prepend(
        name,
        prepend(
          (() => {
            if (g instanceof GrantSkill) {
              return "Notable: a skill (trigger -> effect, fires on its own).";
            } else if (g instanceof GrantMove) {
              return "Notable: a move.";
            } else {
              return "Notable: a minor rule-bender.";
            }
          })(),
          prepend(
            grant_name(g),
            prepend("In " + home + ".", List$Empty$const)
          )
        )
      )
    );
  }
}
function ring_progress(t, owned, keystone) {
  let _block;
  let _pipe = get(t.rings, keystone);
  let _pipe$1 = from_result(_pipe);
  _block = unwrap(_pipe$1, List$Empty$const);
  let ring = _block;
  return [
    count(ring, (_capture) => {
      return contains(owned, _capture);
    }),
    length(ring)
  ];
}

// build/dev/javascript/triangle_platformer/game.mjs
var FILEPATH2 = "src/game.gleam";
var Input = class extends CustomType {
  constructor(move_x, move_y, jump_held, jump_pressed, dash_pressed, attack_pressed) {
    super();
    this.move_x = move_x;
    this.move_y = move_y;
    this.jump_held = jump_held;
    this.jump_pressed = jump_pressed;
    this.dash_pressed = dash_pressed;
    this.attack_pressed = attack_pressed;
  }
};
var Forward = class extends CustomType {
};
var Dir$Forward$const = new Forward();
var Up = class extends CustomType {
};
var Dir$Up$const = new Up();
var Down = class extends CustomType {
};
var Dir$Down$const = new Down();
var Attack = class extends CustomType {
  constructor(dir, time, hit) {
    super();
    this.dir = dir;
    this.time = time;
    this.hit = hit;
  }
};
var Hit = class extends CustomType {
  constructor(x, y, damage3, crit) {
    super();
    this.x = x;
    this.y = y;
    this.damage = damage3;
    this.crit = crit;
  }
};
var Blocked = class extends CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
};
var Healed = class extends CustomType {
  constructor(x, y, amount) {
    super();
    this.x = x;
    this.y = y;
    this.amount = amount;
  }
};
var LevelUp = class extends CustomType {
  constructor(level) {
    super();
    this.level = level;
  }
};
var Hurt = class extends CustomType {
  constructor(x, y, damage3) {
    super();
    this.x = x;
    this.y = y;
    this.damage = damage3;
  }
};
var Died = class extends CustomType {
};
var Event$Died$const = new Died();
var EnteredRoom = class extends CustomType {
  constructor(depth) {
    super();
    this.depth = depth;
  }
};
var GateShut = class extends CustomType {
};
var Event$GateShut$const = new GateShut();
var RunComplete = class extends CustomType {
  constructor(seconds, kills, level) {
    super();
    this.seconds = seconds;
    this.kills = kills;
    this.level = level;
  }
};
var Rewarded = class extends CustomType {
  constructor(label2) {
    super();
    this.label = label2;
  }
};
var Said = class extends CustomType {
  constructor(text) {
    super();
    this.text = text;
  }
};
var Unlocked = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var Point = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Heal2 = class extends CustomType {
};
var Reward$Heal$const = new Heal2();
var Door = class extends CustomType {
  constructor(x, y, reward) {
    super();
    this.x = x;
    this.y = y;
    this.reward = reward;
  }
};
var Player = class extends CustomType {
  constructor(x, y, vx, vy, grounded, on_platform, wall, facing, coyote, jump_buffer, air_jumps, dash_time, dashes, drop_time, can_cut, up_held, jumped, dashed, struck, plunged, loadout, class$, allocated, mods, shield, crash_wait, swings, attack, stats, lvl, xp, points, hp, invuln, hurt2) {
    super();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.grounded = grounded;
    this.on_platform = on_platform;
    this.wall = wall;
    this.facing = facing;
    this.coyote = coyote;
    this.jump_buffer = jump_buffer;
    this.air_jumps = air_jumps;
    this.dash_time = dash_time;
    this.dashes = dashes;
    this.drop_time = drop_time;
    this.can_cut = can_cut;
    this.up_held = up_held;
    this.jumped = jumped;
    this.dashed = dashed;
    this.struck = struck;
    this.plunged = plunged;
    this.loadout = loadout;
    this.class = class$;
    this.allocated = allocated;
    this.mods = mods;
    this.shield = shield;
    this.crash_wait = crash_wait;
    this.swings = swings;
    this.attack = attack;
    this.stats = stats;
    this.lvl = lvl;
    this.xp = xp;
    this.points = points;
    this.hp = hp;
    this.invuln = invuln;
    this.hurt = hurt2;
  }
};
var Mods = class extends CustomType {
  constructor(bonus_hp, damage_pct, attack_speed_pct, reach_pct, cooldown_pct, iframes, xp_pct, knockback_pct, crit_pct, shields, knives, pierce, shockwave_pct, slash_pct, air_jumps, dashes, wall_jump, rules) {
    super();
    this.bonus_hp = bonus_hp;
    this.damage_pct = damage_pct;
    this.attack_speed_pct = attack_speed_pct;
    this.reach_pct = reach_pct;
    this.cooldown_pct = cooldown_pct;
    this.iframes = iframes;
    this.xp_pct = xp_pct;
    this.knockback_pct = knockback_pct;
    this.crit_pct = crit_pct;
    this.shields = shields;
    this.knives = knives;
    this.pierce = pierce;
    this.shockwave_pct = shockwave_pct;
    this.slash_pct = slash_pct;
    this.air_jumps = air_jumps;
    this.dashes = dashes;
    this.wall_jump = wall_jump;
    this.rules = rules;
  }
};
var World = class extends CustomType {
  constructor(player2, level, enemies, projectiles, strikes, events, depth, cleared, doors, exits, seed, tree, unlocked, npcs, time, kills, room_time, safe_x, sealed, plan) {
    super();
    this.player = player2;
    this.level = level;
    this.enemies = enemies;
    this.projectiles = projectiles;
    this.strikes = strikes;
    this.events = events;
    this.depth = depth;
    this.cleared = cleared;
    this.doors = doors;
    this.exits = exits;
    this.seed = seed;
    this.tree = tree;
    this.unlocked = unlocked;
    this.npcs = npcs;
    this.time = time;
    this.kills = kills;
    this.room_time = room_time;
    this.safe_x = safe_x;
    this.sealed = sealed;
    this.plan = plan;
  }
};
var no_dash = -1;
var boss_depth = 12;
var sandbox = /* @__PURE__ */ new Mods(
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  false,
  0,
  0,
  1,
  1,
  true,
  List$Empty$const
);
var bare = /* @__PURE__ */ new Mods(
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  false,
  0,
  0,
  0,
  0,
  false,
  List$Empty$const
);
var height = 1.5;
var width = 0.75;
var hurt_time = 0.3;
var knockback_y = 9;
var knockback_x = 8;
var invuln_time = 1;
var crash_recharge = 4;
var dash_grace = 0.15;
var points_per_level = 1;
var level_up_heal = 20;
var pogo_speed = 15;
var half_width = 0.375;
var attack_startup = 0.07;
var attack_active = 0.1;
var attack_total = 0.34;
var linger = 4;
var dash_duration = 0.14;
var dash_speed = 20;
var air_jump_speed = 17;
var wall_jump_y = 17;
var wall_jump_x = 9;
var jump_speed = 20;
var drop_duration = 0.25;
var wall_slide = 4;
var jump_cut = 8;
var run_speed = 7;
var air_drag = 10;
var air_accel = 35;
var ground_friction = 60;
var ground_accel = 80;
var dash_recharge = 0.5;
var buffer_time = 0.12;
var coyote_time = 0.1;
var dash_exit = 0.45;
function xp_needed(lvl) {
  return 10 * lvl;
}
function load(world2, t, depth) {
  let _block;
  if (depth === 0) {
    _block = length(t.spawns);
  } else {
    _block = 2 + globalThis.Math.trunc(depth / 2);
  }
  let count2 = _block;
  let $ = t.air;
  let ax = $[0];
  let ay = $[1];
  let _block$1;
  let $1 = depth === boss_depth || depth === 0;
  let $2 = depth >= 6;
  let $3 = depth >= 4;
  if ($1) {
    _block$1 = List$Empty$const;
  } else if ($2) {
    _block$1 = prepend(
      [ax, ay, Kind$Flyer$const],
      prepend([ax + 4, ay, Kind$Bouncer$const], List$Empty$const)
    );
  } else if ($3) {
    _block$1 = prepend([ax, ay, Kind$Flyer$const], List$Empty$const);
  } else {
    _block$1 = List$Empty$const;
  }
  let roamers = _block$1;
  let toughness = 1 + 0.06 * identity(max(depth - 1, 0));
  let _block$2;
  let _pipe = t.spawns;
  let _pipe$1 = take(_pipe, count2);
  let _pipe$2 = append(_pipe$1, roamers);
  _block$2 = index_map(
    _pipe$2,
    (s, i) => {
      let e = spawn(i + 1, s[2], s[0], s[1]);
      let _block$3;
      let $4 = e.kind;
      if ($4 instanceof Boss) {
        _block$3 = e.max_hp;
      } else {
        _block$3 = round(identity(e.max_hp) * toughness);
      }
      let hp = _block$3;
      return new Enemy(
        e.id,
        e.kind,
        e.x,
        e.y,
        e.vx,
        e.vy,
        e.home_x,
        e.home_y,
        e.facing,
        e.grounded,
        e.wall,
        hp,
        hp,
        e.respawn,
        e.flash,
        e.mode,
        e.cooldown,
        e.pattern,
        e.awake
      );
    }
  );
  let enemies = _block$2;
  let p = world2.player;
  return new World(
    new Player(
      t.entry[0],
      t.entry[1],
      0,
      0,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      no_dash,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      p.mods,
      p.mods.shields,
      p.crash_wait,
      p.swings,
      Option$None$const,
      p.stats,
      p.lvl,
      p.xp,
      p.points,
      p.hp,
      p.invuln,
      p.hurt
    ),
    (() => {
      if (depth === 0) {
        return t.level;
      } else {
        return prepend(tunnel(), t.level);
      }
    })(),
    enemies,
    List$Empty$const,
    List$Empty$const,
    world2.events,
    depth,
    false,
    List$Empty$const,
    t.doors,
    world2.seed,
    world2.tree,
    world2.unlocked,
    t.npcs,
    world2.time,
    world2.kills,
    0,
    tunnel_end,
    false,
    world2.plan
  );
}
function new_world(seed) {
  let player2 = new Player(
    0,
    0,
    0,
    0,
    false,
    false,
    0,
    1,
    0,
    0,
    1,
    no_dash,
    1,
    0,
    false,
    false,
    false,
    false,
    false,
    false,
    List$Empty$const,
    Option$None$const,
    List$Empty$const,
    sandbox,
    0,
    0,
    0,
    Option$None$const,
    new Stats(0, 0, 0),
    1,
    0,
    0,
    max_hp2(new Stats(0, 0, 0)),
    0,
    0
  );
  let world2 = new World(
    player2,
    List$Empty$const,
    List$Empty$const,
    List$Empty$const,
    List$Empty$const,
    List$Empty$const,
    0,
    true,
    List$Empty$const,
    List$Empty$const,
    absolute_value(seed) % 2147483646 + 1,
    build(),
    starters(),
    List$Empty$const,
    0,
    0,
    0,
    0,
    false,
    List$Empty$const
  );
  let world$1 = load(world2, hub(), 0);
  return new World(
    world$1.player,
    world$1.level,
    world$1.enemies,
    world$1.projectiles,
    world$1.strikes,
    world$1.events,
    world$1.depth,
    true,
    map3(
      world$1.exits,
      (e) => {
        return new Door(e[0], e[1], Option$None$const);
      }
    ),
    world$1.exits,
    world$1.seed,
    world$1.tree,
    world$1.unlocked,
    world$1.npcs,
    world$1.time,
    world$1.kills,
    world$1.room_time,
    world$1.safe_x,
    world$1.sealed,
    world$1.plan
  );
}
function tick_enemies(world2, dt) {
  return new World(
    world2.player,
    world2.level,
    map3(
      world2.enemies,
      (_capture) => {
        return tick(_capture, dt);
      }
    ),
    world2.projectiles,
    world2.strikes,
    world2.events,
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    world2.time,
    world2.kills,
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function kit_mods(name) {
  if (name === "Hunter") {
    return new Mods(
      bare.bonus_hp,
      bare.damage_pct,
      bare.attack_speed_pct,
      bare.reach_pct,
      bare.cooldown_pct,
      bare.iframes,
      bare.xp_pct,
      bare.knockback_pct,
      bare.crit_pct,
      bare.shields,
      bare.knives,
      bare.pierce,
      bare.shockwave_pct,
      bare.slash_pct,
      bare.air_jumps,
      1,
      bare.wall_jump,
      bare.rules
    );
  } else if (name === "Sorcerer") {
    return new Mods(
      bare.bonus_hp,
      bare.damage_pct,
      bare.attack_speed_pct,
      bare.reach_pct,
      bare.cooldown_pct,
      bare.iframes,
      bare.xp_pct,
      bare.knockback_pct,
      bare.crit_pct,
      bare.shields,
      bare.knives,
      bare.pierce,
      bare.shockwave_pct,
      bare.slash_pct,
      bare.air_jumps,
      1,
      bare.wall_jump,
      bare.rules
    );
  } else if (name === "Thief") {
    return new Mods(
      bare.bonus_hp,
      bare.damage_pct,
      bare.attack_speed_pct,
      bare.reach_pct,
      bare.cooldown_pct,
      bare.iframes,
      bare.xp_pct,
      bare.knockback_pct,
      bare.crit_pct,
      bare.shields,
      bare.knives,
      bare.pierce,
      bare.shockwave_pct,
      bare.slash_pct,
      bare.air_jumps,
      1,
      bare.wall_jump,
      bare.rules
    );
  } else if (name === "Bard") {
    return new Mods(
      bare.bonus_hp,
      bare.damage_pct,
      bare.attack_speed_pct,
      bare.reach_pct,
      bare.cooldown_pct,
      bare.iframes,
      bare.xp_pct,
      bare.knockback_pct,
      bare.crit_pct,
      bare.shields,
      bare.knives,
      bare.pierce,
      bare.shockwave_pct,
      bare.slash_pct,
      bare.air_jumps,
      bare.dashes,
      true,
      bare.rules
    );
  } else {
    return new Mods(
      bare.bonus_hp,
      bare.damage_pct,
      bare.attack_speed_pct,
      bare.reach_pct,
      bare.cooldown_pct,
      bare.iframes,
      bare.xp_pct,
      bare.knockback_pct,
      bare.crit_pct,
      bare.shields,
      bare.knives,
      bare.pierce,
      bare.shockwave_pct,
      bare.slash_pct,
      1,
      bare.dashes,
      bare.wall_jump,
      bare.rules
    );
  }
}
function choose_class(world2, keystone) {
  let p = world2.player;
  let cell = find(world2.tree.cells, (c) => {
    return c.id === keystone;
  });
  let free = p.class instanceof None || length(p.allocated) <= 1;
  let $ = world2.depth;
  let $1 = contains(world2.unlocked, keystone);
  if (free && $1 && cell instanceof Ok && $ === 0) {
    let c = cell[0];
    let s = new Stats(c.f, c.r, c.m);
    return new World(
      new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        0,
        p.dash_time,
        0,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        new Some(keystone),
        prepend(keystone, List$Empty$const),
        (() => {
          let _record = kit_mods(c.name);
          return new Mods(
            _record.bonus_hp,
            _record.damage_pct,
            _record.attack_speed_pct,
            _record.reach_pct,
            _record.cooldown_pct,
            _record.iframes,
            _record.xp_pct,
            _record.knockback_pct,
            _record.crit_pct,
            _record.shields,
            _record.knives,
            _record.pierce,
            _record.shockwave_pct,
            _record.slash_pct,
            _record.air_jumps,
            _record.dashes,
            _record.wall_jump,
            values(
              prepend(keystone_rule(c.name), List$Empty$const)
            )
          );
        })(),
        0,
        0,
        p.swings,
        p.attack,
        s,
        p.lvl,
        p.xp,
        p.points,
        max_hp2(s),
        p.invuln,
        p.hurt
      ),
      world2.level,
      world2.enemies,
      world2.projectiles,
      world2.strikes,
      world2.events,
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    );
  } else {
    return world2;
  }
}
function npc_box(n) {
  return box(n.x, n.y, 1.4, 2.2);
}
function near_npc(world2) {
  let p = world2.player;
  let me = box(p.x, p.y, width, height);
  return find(world2.npcs, (n) => {
    return overlaps(me, npc_box(n));
  });
}
function talk(world2, up_fresh) {
  let $ = near_npc(world2);
  if (up_fresh && $ instanceof Ok) {
    let $1 = $[0].role;
    if ($1 instanceof Statue) {
      let k = $1.keystone;
      return choose_class(world2, k);
    } else {
      return world2;
    }
  } else {
    return world2;
  }
}
function reward_label(r) {
  if (r instanceof Some) {
    let $ = r[0];
    if ($ instanceof Point) {
      let $1 = $[0];
      if ($1 instanceof Fighter) {
        return "+1 Fighter";
      } else if ($1 instanceof Rogue) {
        return "+1 Rogue";
      } else {
        return "+1 Mage";
      }
    } else {
      return "Full heal";
    }
  } else {
    return "Start run";
  }
}
function max_hp3(p) {
  return max_hp2(p.stats) + p.mods.bonus_hp;
}
function has2(p, rule) {
  return contains(p.mods.rules, rule);
}
function apply_reward(p, r) {
  if (r instanceof Point) {
    let axis = r[0];
    let once = add2(p.stats, axis);
    let _block;
    let $ = has2(p, Rule$AllRounder$const) && lowest(p.stats, axis);
    if ($) {
      _block = add2(once, axis);
    } else {
      _block = once;
    }
    let new$2 = _block;
    return new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      p.mods,
      p.shield,
      p.crash_wait,
      p.swings,
      p.attack,
      new$2,
      p.lvl,
      p.xp,
      p.points,
      p.hp + max_hp2(new$2) - max_hp2(p.stats),
      p.invuln,
      p.hurt
    );
  } else {
    return new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      p.mods,
      p.shield,
      p.crash_wait,
      p.swings,
      p.attack,
      p.stats,
      p.lvl,
      p.xp,
      p.points,
      max_hp3(p),
      p.invuln,
      p.hurt
    );
  }
}
function nth_room(i) {
  let $ = drop(run_rooms(), i);
  let t;
  if ($ instanceof Empty) {
    throw makeError(
      "let_assert",
      FILEPATH2,
      "game",
      1713,
      "nth_room",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 48626,
        end: 48678,
        pattern_start: 48637,
        pattern_end: 48644
      }
    );
  } else {
    t = $.head;
  }
  return t;
}
function next2(seed) {
  return next(seed);
}
function shuffle(items, seed) {
  let $ = map_fold(
    items,
    seed,
    (s, x) => {
      let s$1 = next2(s);
      return [s$1, [s$1, x]];
    }
  );
  let seed$1 = $[0];
  let keyed = $[1];
  let _block;
  let _pipe = keyed;
  let _pipe$1 = sort(
    _pipe,
    (a, b) => {
      return compare(a[0], b[0]);
    }
  );
  _block = map3(_pipe$1, (pair) => {
    return pair[1];
  });
  let shuffled = _block;
  return [shuffled, seed$1];
}
function plan_run(seed) {
  let indexed = index_map(
    run_rooms(),
    (t, i) => {
      return [i, t.tier];
    }
  );
  return fold2(
    prepend(1, prepend(2, prepend(3, List$Empty$const))),
    [List$Empty$const, seed],
    (acc2, tier) => {
      let plan = acc2[0];
      let seed$1 = acc2[1];
      let _block;
      let _pipe = indexed;
      let _pipe$1 = filter(_pipe, (p) => {
        return p[1] === tier;
      });
      _block = map3(_pipe$1, (p) => {
        return p[0];
      });
      let ids = _block;
      let $ = shuffle(ids, seed$1);
      let shuffled = $[0];
      let seed$2 = $[1];
      return [append(plan, shuffled), seed$2];
    }
  );
}
function door_box(d) {
  return box(d.x, d.y, 1.2, 2);
}
function use_door(world2, up_fresh) {
  let p = world2.player;
  let me = box(p.x, p.y, width, height);
  let ready = world2.depth > 0 || !(p.class instanceof None);
  let _block;
  let $ = world2.cleared && up_fresh && ready;
  if ($) {
    _block = find(
      world2.doors,
      (d) => {
        return overlaps(me, door_box(d));
      }
    );
  } else {
    _block = new Error(void 0);
  }
  let door = _block;
  if (door instanceof Ok) {
    if (world2.depth === 12) {
      let fresh = new_world(next2(world2.seed));
      return new World(
        fresh.player,
        fresh.level,
        fresh.enemies,
        fresh.projectiles,
        fresh.strikes,
        append(
          world2.events,
          prepend(new EnteredRoom(0), List$Empty$const)
        ),
        fresh.depth,
        fresh.cleared,
        fresh.doors,
        fresh.exits,
        fresh.seed,
        fresh.tree,
        world2.unlocked,
        fresh.npcs,
        fresh.time,
        fresh.kills,
        fresh.room_time,
        fresh.safe_x,
        fresh.sealed,
        fresh.plan
      );
    } else {
      let d = door[0];
      let seed = next2(world2.seed);
      let depth = world2.depth + 1;
      let _block$1;
      let $2 = world2.depth;
      if ($2 === 0) {
        _block$1 = plan_run(seed);
      } else {
        _block$1 = [world2.plan, seed];
      }
      let $1 = _block$1;
      let plan = $1[0];
      let seed$1 = $1[1];
      let world$1 = new World(
        world2.player,
        world2.level,
        world2.enemies,
        world2.projectiles,
        world2.strikes,
        world2.events,
        world2.depth,
        world2.cleared,
        world2.doors,
        world2.exits,
        world2.seed,
        world2.tree,
        world2.unlocked,
        world2.npcs,
        world2.time,
        world2.kills,
        world2.room_time,
        world2.safe_x,
        world2.sealed,
        plan
      );
      let _block$2;
      let $3 = depth === boss_depth;
      let $4 = drop(plan, depth - 1);
      if ($3) {
        _block$2 = boss_room();
      } else if ($4 instanceof Empty) {
        _block$2 = nth_room(0);
      } else {
        let i = $4.head;
        _block$2 = nth_room(i);
      }
      let t = _block$2;
      let world$2 = load(
        new World(
          world$1.player,
          world$1.level,
          world$1.enemies,
          world$1.projectiles,
          world$1.strikes,
          world$1.events,
          world$1.depth,
          world$1.cleared,
          world$1.doors,
          world$1.exits,
          seed$1,
          world$1.tree,
          world$1.unlocked,
          world$1.npcs,
          world$1.time,
          world$1.kills,
          world$1.room_time,
          world$1.safe_x,
          world$1.sealed,
          world$1.plan
        ),
        t,
        depth
      );
      let _block$3;
      let $5 = d.reward;
      if ($5 instanceof Some) {
        let r = $5[0];
        let after = apply_reward(world$2.player, r);
        let total = (p2) => {
          return p2.stats.fighter + p2.stats.rogue + p2.stats.mage;
        };
        let _block$4;
        let $6 = total(after) - total(world$2.player);
        if ($6 === 2) {
          _block$4 = replace(reward_label(new Some(r)), "+1", "+2");
        } else {
          _block$4 = reward_label(new Some(r));
        }
        let label2 = _block$4;
        _block$3 = new World(
          after,
          world$2.level,
          world$2.enemies,
          world$2.projectiles,
          world$2.strikes,
          append(
            world$2.events,
            prepend(new Rewarded(label2), List$Empty$const)
          ),
          world$2.depth,
          world$2.cleared,
          world$2.doors,
          world$2.exits,
          world$2.seed,
          world$2.tree,
          world$2.unlocked,
          world$2.npcs,
          world$2.time,
          world$2.kills,
          world$2.room_time,
          world$2.safe_x,
          world$2.sealed,
          world$2.plan
        );
      } else {
        _block$3 = world$2;
      }
      let world$3 = _block$3;
      return new World(
        world$3.player,
        world$3.level,
        world$3.enemies,
        world$3.projectiles,
        world$3.strikes,
        append(
          world$3.events,
          prepend(new EnteredRoom(depth), List$Empty$const)
        ),
        world$3.depth,
        world$3.cleared,
        world$3.doors,
        world$3.exits,
        world$3.seed,
        world$3.tree,
        world$3.unlocked,
        world$3.npcs,
        world$3.time,
        world$3.kills,
        world$3.room_time,
        world$3.safe_x,
        world$3.sealed,
        world$3.plan
      );
    }
  } else {
    return world2;
  }
}
function check_clear(world2) {
  let hostile_left = any(
    world2.enemies,
    (e) => {
      return !(e.kind instanceof Dummy) && alive(e);
    }
  );
  let $ = world2.cleared || hostile_left;
  if ($) {
    return world2;
  } else {
    let $1 = shuffle(
      prepend(
        new Point(Axis$Fighter$const),
        prepend(
          new Point(Axis$Rogue$const),
          prepend(
            new Point(Axis$Mage$const),
            prepend(Reward$Heal$const, List$Empty$const)
          )
        )
      ),
      world2.seed
    );
    let rewards = $1[0];
    let seed = $1[1];
    let n = 2 + seed % 2;
    let _block;
    let $3 = world2.depth === boss_depth;
    if ($3) {
      _block = [
        (() => {
          let _pipe = take(world2.exits, 1);
          return map3(
            _pipe,
            (e) => {
              return new Door(e[0], e[1], Option$None$const);
            }
          );
        })(),
        prepend(
          new RunComplete(world2.time, world2.kills, world2.player.lvl),
          List$Empty$const
        )
      ];
    } else {
      _block = [
        (() => {
          let _pipe = zip(
            take(world2.exits, n),
            take(rewards, n)
          );
          return map3(
            _pipe,
            (pair) => {
              return new Door(pair[0][0], pair[0][1], new Some(pair[1]));
            }
          );
        })(),
        List$Empty$const
      ];
    }
    let $2 = _block;
    let doors = $2[0];
    let finale = $2[1];
    let $4 = [world2.player, List$Empty$const];
    let player2 = $4[0];
    let events = $4[1];
    return new World(
      player2,
      world2.level,
      world2.enemies,
      world2.projectiles,
      world2.strikes,
      flatten(
        prepend(
          world2.events,
          prepend(events, prepend(finale, List$Empty$const))
        )
      ),
      world2.depth,
      true,
      doors,
      world2.exits,
      seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    );
  }
}
function blocked_by_shield(world2, k) {
  let p = world2.player;
  let $ = p.shield > 0;
  if ($) {
    return new World(
      new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield - 1,
        crash_recharge,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        invuln_time,
        p.hurt
      ),
      world2.level,
      world2.enemies,
      world2.projectiles,
      world2.strikes,
      append(
        world2.events,
        prepend(new Blocked(p.x, p.y + height), List$Empty$const)
      ),
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    );
  } else {
    return k();
  }
}
function hurt(world2, damage3, from_x) {
  let p = world2.player;
  return blocked_by_shield(
    world2,
    () => {
      let firm = has2(p, Rule$Aegis$const);
      let _block;
      if (firm) {
        _block = globalThis.Math.trunc((damage3 + 1) / 2);
      } else {
        _block = damage3;
      }
      let damage$1 = _block;
      let _block$1;
      let $ = p.x >= from_x;
      if ($) {
        _block$1 = 1;
      } else {
        _block$1 = -1;
      }
      let away = _block$1;
      let ouch = new Hurt(p.x, p.y + height, damage$1);
      let $1 = p.hp - damage$1 <= 0;
      if ($1) {
        let fresh = new_world(next2(world2.seed));
        return new World(
          fresh.player,
          fresh.level,
          fresh.enemies,
          fresh.projectiles,
          fresh.strikes,
          append(
            world2.events,
            prepend(ouch, prepend(Event$Died$const, List$Empty$const))
          ),
          fresh.depth,
          fresh.cleared,
          fresh.doors,
          fresh.exits,
          fresh.seed,
          fresh.tree,
          world2.unlocked,
          fresh.npcs,
          fresh.time,
          fresh.kills,
          fresh.room_time,
          fresh.safe_x,
          fresh.sealed,
          fresh.plan
        );
      } else {
        let p$1 = new Player(
          p.x,
          p.y,
          p.vx,
          p.vy,
          p.grounded,
          p.on_platform,
          p.wall,
          p.facing,
          p.coyote,
          p.jump_buffer,
          p.air_jumps,
          p.dash_time,
          p.dashes,
          p.drop_time,
          p.can_cut,
          p.up_held,
          p.jumped,
          p.dashed,
          p.struck,
          p.plunged,
          p.loadout,
          p.class,
          p.allocated,
          p.mods,
          p.shield,
          p.crash_wait,
          p.swings,
          p.attack,
          p.stats,
          p.lvl,
          p.xp,
          p.points,
          p.hp - damage$1,
          invuln_time + p.mods.iframes,
          p.hurt
        );
        let _block$2;
        if (firm) {
          _block$2 = p$1;
        } else {
          _block$2 = new Player(
            p$1.x,
            p$1.y,
            away * knockback_x,
            knockback_y,
            p$1.grounded,
            p$1.on_platform,
            p$1.wall,
            p$1.facing,
            p$1.coyote,
            p$1.jump_buffer,
            p$1.air_jumps,
            no_dash,
            p$1.dashes,
            p$1.drop_time,
            false,
            p$1.up_held,
            p$1.jumped,
            p$1.dashed,
            p$1.struck,
            p$1.plunged,
            p$1.loadout,
            p$1.class,
            p$1.allocated,
            p$1.mods,
            p$1.shield,
            p$1.crash_wait,
            p$1.swings,
            Option$None$const,
            p$1.stats,
            p$1.lvl,
            p$1.xp,
            p$1.points,
            p$1.hp,
            p$1.invuln,
            hurt_time
          );
        }
        let p$2 = _block$2;
        return new World(
          p$2,
          world2.level,
          world2.enemies,
          world2.projectiles,
          world2.strikes,
          append(world2.events, prepend(ouch, List$Empty$const)),
          world2.depth,
          world2.cleared,
          world2.doors,
          world2.exits,
          world2.seed,
          world2.tree,
          world2.unlocked,
          world2.npcs,
          world2.time,
          world2.kills,
          world2.room_time,
          world2.safe_x,
          world2.sealed,
          world2.plan
        );
      }
    }
  );
}
function take_damage(world2) {
  let p = world2.player;
  let me = box(p.x, p.y, width, height);
  let contact = find(
    world2.enemies,
    (e) => {
      return alive(e) && contact_damage(e) > 0 && overlaps(
        me,
        body(e)
      );
    }
  );
  let $ = partition(
    world2.projectiles,
    (s) => {
      return overlaps(me, shot_box(s));
    }
  );
  let shot_hits = $[0];
  let shots_left = $[1];
  let safe = p.invuln > 0 || p.dash_time > 0 - dash_grace;
  if (safe) {
    return world2;
  } else if (contact instanceof Ok) {
    let e = contact[0];
    return hurt(world2, contact_damage(e), e.x);
  } else if (shot_hits instanceof Empty) {
    return world2;
  } else {
    let s = shot_hits.head;
    return hurt(
      new World(
        world2.player,
        world2.level,
        world2.enemies,
        shots_left,
        world2.strikes,
        world2.events,
        world2.depth,
        world2.cleared,
        world2.doors,
        world2.exits,
        world2.seed,
        world2.tree,
        world2.unlocked,
        world2.npcs,
        world2.time,
        world2.kills,
        world2.room_time,
        world2.safe_x,
        world2.sealed,
        world2.plan
      ),
      shot_damage,
      s.x - s.vx
    );
  }
}
function gain_xp(loop$p, loop$xp, loop$events) {
  while (true) {
    let p = loop$p;
    let xp = loop$xp;
    let events = loop$events;
    let total = p.xp + xp;
    let need = xp_needed(p.lvl);
    let $ = total >= need;
    if ($) {
      let lvl = p.lvl + 1;
      let healed = min(
        max_hp3(p),
        p.hp + globalThis.Math.trunc(max_hp3(p) * level_up_heal / 100)
      ) - p.hp;
      let p$1 = new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        lvl,
        0,
        p.points + points_per_level,
        p.hp + healed,
        p.invuln,
        p.hurt
      );
      let _block;
      let $1 = healed > 0;
      if ($1) {
        _block = prepend(
          new Healed(p$1.x, p$1.y + height, healed),
          List$Empty$const
        );
      } else {
        _block = List$Empty$const;
      }
      let heal_events = _block;
      loop$p = p$1;
      loop$xp = total - need;
      loop$events = append(
        heal_events,
        prepend(new LevelUp(lvl), events)
      );
    } else {
      return [
        new Player(
          p.x,
          p.y,
          p.vx,
          p.vy,
          p.grounded,
          p.on_platform,
          p.wall,
          p.facing,
          p.coyote,
          p.jump_buffer,
          p.air_jumps,
          p.dash_time,
          p.dashes,
          p.drop_time,
          p.can_cut,
          p.up_held,
          p.jumped,
          p.dashed,
          p.struck,
          p.plunged,
          p.loadout,
          p.class,
          p.allocated,
          p.mods,
          p.shield,
          p.crash_wait,
          p.swings,
          p.attack,
          p.stats,
          p.lvl,
          total,
          p.points,
          p.hp,
          p.invuln,
          p.hurt
        ),
        reverse2(events)
      ];
    }
  }
}
function pct(n) {
  return 1 + identity(n) / 100;
}
function hit_enemies(world2, targets, dmg, sure_crit, push) {
  let p = world2.player;
  let always_crit = sure_crit || p.dash_time > 0 && has2(
    p,
    Rule$DashCrits$const
  );
  let shove = pct(p.mods.knockback_pct);
  let $ = map_fold(
    targets,
    world2.seed,
    (seed2, e) => {
      let $12 = unit(seed2);
      let seed$1 = $12[0];
      let u = $12[1];
      let crit = always_crit || u * 100 < identity(p.mods.crit_pct);
      let _block2;
      if (crit) {
        _block2 = dmg * 2;
      } else {
        _block2 = dmg;
      }
      let d = _block2;
      return [seed$1, [e.id, d, crit]];
    }
  );
  let seed = $[0];
  let rolls = $[1];
  let roll = (id) => {
    let $12 = find(rolls, (r2) => {
      return r2[0] === id;
    });
    let r;
    if ($12 instanceof Ok) {
      r = $12[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH2,
        "game",
        803,
        "hit_enemies",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $12,
          start: 21241,
          end: 21297,
          pattern_start: 21252,
          pattern_end: 21257
        }
      );
    }
    return r;
  };
  let ids = map3(targets, (e) => {
    return e.id;
  });
  let enemies = map3(
    world2.enemies,
    (e) => {
      let $12 = contains(ids, e.id);
      if ($12) {
        let $22 = push(e);
        let push_x = $22[0];
        let push_y = $22[1];
        return take_hit(e, roll(e.id)[1], push_x * shove, push_y * shove);
      } else {
        return e;
      }
    }
  );
  let killed = filter(
    enemies,
    (e) => {
      return e.hp === 0 && contains(ids, e.id);
    }
  );
  let _block;
  let _pipe = killed;
  let _pipe$1 = map3(_pipe, (e) => {
    return xp_value(e.kind);
  });
  _block = sum(_pipe$1);
  let xp = _block;
  let xp$1 = round(identity(xp) * pct(p.mods.xp_pct));
  let _block$1;
  let $1 = !(killed instanceof Empty) && has2(
    p,
    Rule$KillRefreshesDash$const
  );
  if ($1) {
    _block$1 = new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.mods.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      p.mods,
      p.shield,
      p.crash_wait,
      p.swings,
      p.attack,
      p.stats,
      p.lvl,
      p.xp,
      p.points,
      p.hp,
      p.invuln,
      p.hurt
    );
  } else {
    _block$1 = p;
  }
  let p$1 = _block$1;
  let $2 = gain_xp(p$1, xp$1, List$Empty$const);
  let player2 = $2[0];
  let level_ups = $2[1];
  let hits = map3(
    targets,
    (e) => {
      let b = body(e);
      let $3 = roll(e.id);
      let d = $3[1];
      let crit = $3[2];
      return new Hit(e.x, b.y + b.h, d, crit);
    }
  );
  return new World(
    player2,
    world2.level,
    enemies,
    world2.projectiles,
    world2.strikes,
    flatten(
      prepend(
        world2.events,
        prepend(hits, prepend(level_ups, List$Empty$const))
      )
    ),
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    world2.time,
    world2.kills + count(
      killed,
      (e) => {
        return !(e.kind instanceof Dummy);
      }
    ),
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function strikes_act(world2, dt) {
  let p = world2.player;
  return fold2(
    world2.strikes,
    new World(
      world2.player,
      world2.level,
      world2.enemies,
      world2.projectiles,
      List$Empty$const,
      world2.events,
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    ),
    (w, s) => {
      let box4 = strike_box(s, p.x, p.y);
      let over = filter(
        w.enemies,
        (e) => {
          return alive(e) && overlaps(box4, body(e));
        }
      );
      let touching = filter(
        over,
        (e) => {
          return !contains(s.hit, e.id);
        }
      );
      let _block;
      let $ = s.pierce;
      if ($) {
        _block = touching;
      } else {
        _block = take(touching, 1);
      }
      let targets = _block;
      let w$1 = hit_enemies(
        w,
        targets,
        s.damage,
        far(s),
        (e) => {
          let $12 = e.x >= p.x;
          if ($12) {
            return [4, 3];
          } else {
            return [-4, 3];
          }
        }
      );
      let ids = (es) => {
        return map3(es, (e) => {
          return e.id;
        });
      };
      let s$1 = new Strike(
        s.effect,
        s.x,
        s.y,
        s.w,
        s.h,
        s.vx,
        s.vy,
        s.ttl,
        s.follow,
        s.pierce,
        s.damage,
        (() => {
          let $12 = s.effect;
          if ($12 instanceof Orb) {
            return ids(over);
          } else {
            return append(ids(targets), s.hit);
          }
        })()
      );
      let walled = s$1.effect instanceof Arrow && any(
        w$1.level,
        (r) => {
          return !r.one_way && overlaps(box4, r);
        }
      );
      let _block$1;
      let $1 = s$1.pierce;
      if (walled) {
        _block$1 = new Error(void 0);
      } else if (!$1) {
        if (targets instanceof Empty) {
          _block$1 = advance(s$1, dt);
        } else {
          _block$1 = new Error(void 0);
        }
      } else {
        _block$1 = advance(s$1, dt);
      }
      let next$1 = _block$1;
      if (next$1 instanceof Ok) {
        let s$2 = next$1[0];
        return new World(
          w$1.player,
          w$1.level,
          w$1.enemies,
          w$1.projectiles,
          prepend(s$2, w$1.strikes),
          w$1.events,
          w$1.depth,
          w$1.cleared,
          w$1.doors,
          w$1.exits,
          w$1.seed,
          w$1.tree,
          w$1.unlocked,
          w$1.npcs,
          w$1.time,
          w$1.kills,
          w$1.room_time,
          w$1.safe_x,
          w$1.sealed,
          w$1.plan
        );
      } else {
        return w$1;
      }
    }
  );
}
function damage2(p) {
  return round(
    identity(damage(p.stats)) * pct(p.mods.damage_pct)
  );
}
function plunging(p) {
  let $ = p.attack;
  if ($ instanceof Some && $[0].dir instanceof Down) {
    return has2(p, Rule$Plunge$const) && !p.grounded && !p.plunged;
  } else {
    return false;
  }
}
function strike(world2, a, box4) {
  let p = world2.player;
  let room2 = max_targets(p.stats) - length(a.hit);
  let dist = (e) => {
    return absolute_value2(e.x - p.x) + absolute_value2(e.y - p.y);
  };
  let _block;
  let _pipe = world2.enemies;
  let _pipe$1 = filter(
    _pipe,
    (e) => {
      return alive(e) && !contains(a.hit, e.id) && overlaps(
        box4,
        body(e)
      );
    }
  );
  let _pipe$2 = sort(
    _pipe$1,
    (e1, e2) => {
      return compare2(dist(e1), dist(e2));
    }
  );
  _block = take(_pipe$2, room2);
  let targets = _block;
  if (targets instanceof Empty) {
    return world2;
  } else {
    let ids = map3(targets, (e) => {
      return e.id;
    });
    let dive = plunging(p);
    let _block$1;
    if (dive) {
      _block$1 = new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        true,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        Option$None$const,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    } else {
      _block$1 = new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        new Some(new Attack(a.dir, a.time, append(ids, a.hit))),
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    }
    let p$1 = _block$1;
    let _block$2;
    let $ = a.dir;
    let $1 = has2(p$1, Rule$PogoRefreshesAir$const);
    if ($1) {
      if ($ instanceof Down) {
        _block$2 = new Player(
          p$1.x,
          p$1.y,
          p$1.vx,
          pogo_speed,
          p$1.grounded,
          p$1.on_platform,
          p$1.wall,
          p$1.facing,
          p$1.coyote,
          p$1.jump_buffer,
          p$1.mods.air_jumps,
          p$1.dash_time,
          p$1.dashes,
          p$1.drop_time,
          false,
          p$1.up_held,
          p$1.jumped,
          p$1.dashed,
          p$1.struck,
          p$1.plunged,
          p$1.loadout,
          p$1.class,
          p$1.allocated,
          p$1.mods,
          p$1.shield,
          p$1.crash_wait,
          p$1.swings,
          p$1.attack,
          p$1.stats,
          p$1.lvl,
          p$1.xp,
          p$1.points,
          p$1.hp,
          p$1.invuln,
          p$1.hurt
        );
      } else {
        _block$2 = p$1;
      }
    } else if ($ instanceof Down) {
      _block$2 = new Player(
        p$1.x,
        p$1.y,
        p$1.vx,
        pogo_speed,
        p$1.grounded,
        p$1.on_platform,
        p$1.wall,
        p$1.facing,
        p$1.coyote,
        p$1.jump_buffer,
        p$1.air_jumps,
        p$1.dash_time,
        p$1.dashes,
        p$1.drop_time,
        false,
        p$1.up_held,
        p$1.jumped,
        p$1.dashed,
        p$1.struck,
        p$1.plunged,
        p$1.loadout,
        p$1.class,
        p$1.allocated,
        p$1.mods,
        p$1.shield,
        p$1.crash_wait,
        p$1.swings,
        p$1.attack,
        p$1.stats,
        p$1.lvl,
        p$1.xp,
        p$1.points,
        p$1.hp,
        p$1.invuln,
        p$1.hurt
      );
    } else {
      _block$2 = p$1;
    }
    let p$2 = _block$2;
    let p$3 = new Player(
      p$2.x,
      p$2.y,
      p$2.vx,
      p$2.vy,
      p$2.grounded,
      p$2.on_platform,
      p$2.wall,
      p$2.facing,
      p$2.coyote,
      p$2.jump_buffer,
      p$2.air_jumps,
      p$2.dash_time,
      p$2.dashes,
      p$2.drop_time,
      p$2.can_cut,
      p$2.up_held,
      p$2.jumped,
      p$2.dashed,
      true,
      p$2.plunged,
      p$2.loadout,
      p$2.class,
      p$2.allocated,
      p$2.mods,
      p$2.shield,
      p$2.crash_wait,
      p$2.swings,
      p$2.attack,
      p$2.stats,
      p$2.lvl,
      p$2.xp,
      p$2.points,
      p$2.hp,
      p$2.invuln,
      p$2.hurt
    );
    let _block$3;
    let $2 = a.dir;
    if ($2 instanceof Forward) {
      _block$3 = [p$3.facing * 6, 3];
    } else if ($2 instanceof Up) {
      _block$3 = [0, 10];
    } else {
      _block$3 = [0, -5];
    }
    let push = _block$3;
    return hit_enemies(
      new World(
        p$3,
        world2.level,
        world2.enemies,
        world2.projectiles,
        world2.strikes,
        world2.events,
        world2.depth,
        world2.cleared,
        world2.doors,
        world2.exits,
        world2.seed,
        world2.tree,
        world2.unlocked,
        world2.npcs,
        world2.time,
        world2.kills,
        world2.room_time,
        world2.safe_x,
        world2.sealed,
        world2.plan
      ),
      targets,
      damage2(p$3),
      dive,
      (_) => {
        return push;
      }
    );
  }
}
function reach2(p) {
  return reach(p.stats) * pct(p.mods.reach_pct);
}
function hitbox(p, dir) {
  let _block;
  let $ = has2(p, Rule$ThirdSwingBig$const) && p.swings % 3 === 0;
  if ($) {
    _block = 2;
  } else {
    _block = 1;
  }
  let big = _block;
  let s = reach2(p) * big;
  if (dir instanceof Forward) {
    let w = 1.4 * s;
    let h = 1 * s;
    let _block$1;
    let $1 = p.facing > 0;
    if ($1) {
      _block$1 = p.x + half_width - 0.1;
    } else {
      _block$1 = p.x - half_width + 0.1 - w;
    }
    let x = _block$1;
    return new Rect(x, p.y + height / 2 - h / 2 + 0.1, w, h, false);
  } else if (dir instanceof Up) {
    let w = 1.2 * s;
    return new Rect(p.x - w / 2, p.y + height - 0.2, w, 1.3 * s, false);
  } else {
    let w = 1 * s;
    let h = 1.3 * s;
    return new Rect(p.x - w / 2, p.y - h + 0.2, w, h, false);
  }
}
function speed2(p) {
  return speed(p.stats) * pct(p.mods.attack_speed_pct);
}
function active_hitbox(p) {
  let $ = p.attack;
  let $1 = has2(p, Rule$Bow$const);
  if ($ instanceof Some && !$1) {
    let a = $[0];
    let t = a.time * speed2(p);
    let live = t < attack_startup + attack_active || plunging(p);
    let $2 = t >= attack_startup && live;
    if ($2) {
      return new Some(hitbox(p, a.dir));
    } else {
      return Option$None$const;
    }
  } else {
    return Option$None$const;
  }
}
function boost(p) {
  let m = p.mods;
  return new Boost(
    pct(m.damage_pct),
    reach2(p),
    pct(m.slash_pct),
    pct(m.shockwave_pct),
    m.knives,
    m.pierce
  );
}
function loose(world2, dir) {
  let p = world2.player;
  let _block;
  if (dir instanceof Forward) {
    _block = [p.facing, 0];
  } else if (dir instanceof Up) {
    _block = [0, 1];
  } else {
    _block = [0, -1];
  }
  let aim = _block;
  let arrows = spawn2(
    Effect$Arrow$const,
    p.x,
    p.y,
    damage(p.stats),
    boost(p),
    aim,
    p.facing
  );
  return new World(
    world2.player,
    world2.level,
    world2.enemies,
    world2.projectiles,
    append(world2.strikes, arrows),
    world2.events,
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    world2.time,
    world2.kills,
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function combat(world2) {
  let p = world2.player;
  let $ = p.attack;
  if ($ instanceof Some) {
    let a = $[0];
    let $1 = a.time * speed2(p) >= attack_total && !plunging(p);
    let $2 = has2(p, Rule$Bow$const);
    if ($1) {
      return new World(
        new Player(
          p.x,
          p.y,
          p.vx,
          p.vy,
          p.grounded,
          p.on_platform,
          p.wall,
          p.facing,
          p.coyote,
          p.jump_buffer,
          p.air_jumps,
          p.dash_time,
          p.dashes,
          p.drop_time,
          p.can_cut,
          p.up_held,
          p.jumped,
          p.dashed,
          p.struck,
          p.plunged,
          p.loadout,
          p.class,
          p.allocated,
          p.mods,
          p.shield,
          p.crash_wait,
          p.swings,
          Option$None$const,
          p.stats,
          p.lvl,
          p.xp,
          p.points,
          p.hp,
          p.invuln,
          p.hurt
        ),
        world2.level,
        world2.enemies,
        world2.projectiles,
        world2.strikes,
        world2.events,
        world2.depth,
        world2.cleared,
        world2.doors,
        world2.exits,
        world2.seed,
        world2.tree,
        world2.unlocked,
        world2.npcs,
        world2.time,
        world2.kills,
        world2.room_time,
        world2.safe_x,
        world2.sealed,
        world2.plan
      );
    } else if ($2) {
      let $3 = a.time === 0;
      if ($3) {
        return loose(world2, a.dir);
      } else {
        return world2;
      }
    } else {
      let $3 = active_hitbox(p);
      if ($3 instanceof Some) {
        let box4 = $3[0];
        return strike(world2, a, box4);
      } else {
        return world2;
      }
    }
  } else {
    return world2;
  }
}
function enemies_act(world2, dt) {
  let p = world2.player;
  let left_entry = p.x > world2.safe_x;
  let alert = left_entry || world2.room_time > linger;
  let $ = map_fold(
    world2.enemies,
    List$Empty$const,
    (shots2, e) => {
      let _block2;
      let $1 = left_entry && !e.awake;
      if ($1) {
        _block2 = new Enemy(
          e.id,
          e.kind,
          e.x,
          e.y,
          e.vx,
          e.vy,
          e.home_x,
          e.home_y,
          e.facing,
          e.grounded,
          e.wall,
          e.hp,
          e.max_hp,
          e.respawn,
          e.flash,
          e.mode,
          e.cooldown,
          e.pattern,
          true
        );
      } else {
        _block2 = e;
      }
      let e$1 = _block2;
      let $2 = think(
        e$1,
        world2.level,
        p.x,
        p.y + height / 2,
        dt,
        alert
      );
      let e$2 = $2[0];
      let new$2 = $2[1];
      return [append(new$2, shots2), e$2];
    }
  );
  let shots = $[0];
  let enemies = $[1];
  let _block;
  let _pipe = append(world2.projectiles, shots);
  _block = filter_map(
    _pipe,
    (s) => {
      let _pipe$1 = fly(s, world2.level, dt);
      return to_result(_pipe$1, void 0);
    }
  );
  let projectiles = _block;
  return new World(
    world2.player,
    world2.level,
    enemies,
    projectiles,
    world2.strikes,
    world2.events,
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    world2.time,
    world2.kills,
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function seal(world2) {
  let out = world2.depth > 0 && !world2.sealed && world2.player.x > world2.safe_x + 0.5;
  let empty3 = !any(
    world2.enemies,
    (e) => {
      return alive(e) && overlaps(body(e), tunnel_inside());
    }
  );
  let $ = out && empty3;
  if ($) {
    return new World(
      world2.player,
      prepend(gate(), world2.level),
      world2.enemies,
      world2.projectiles,
      world2.strikes,
      append(
        world2.events,
        prepend(Event$GateShut$const, List$Empty$const)
      ),
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      true,
      world2.plan
    );
  } else {
    return world2;
  }
}
function orbit(world2) {
  let p = world2.player;
  let $ = partition(
    world2.strikes,
    (s) => {
      return s.effect instanceof Orb;
    }
  );
  let orbs = $[0];
  let rest = $[1];
  let _block;
  let $1 = has2(p, Rule$Orbit$const);
  if ($1) {
    _block = spawn2(
      Effect$Orb$const,
      p.x,
      p.y,
      damage(p.stats),
      boost(p),
      [1, 0],
      p.facing
    );
  } else {
    _block = List$Empty$const;
  }
  let want = _block;
  let current = length(orbs) === length(want) && all(
    zip(orbs, want),
    (pair) => {
      return pair[0].damage === pair[1].damage && pair[0].w === pair[1].w;
    }
  );
  if (current) {
    return world2;
  } else {
    return new World(
      world2.player,
      world2.level,
      world2.enemies,
      world2.projectiles,
      append(rest, want),
      world2.events,
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      world2.unlocked,
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    );
  }
}
function aim_at_nearest(world2) {
  let p = world2.player;
  let cy = p.y + height / 2;
  let dist = (e) => {
    let b = body(e);
    let dx = e.x - p.x;
    let dy = b.y + b.h / 2 - cy;
    return [dx * dx + dy * dy, dx, dy];
  };
  let _block;
  let _pipe = world2.enemies;
  let _pipe$1 = filter(_pipe, alive);
  let _pipe$2 = map3(_pipe$1, dist);
  let _pipe$3 = filter(_pipe$2, (d) => {
    return d[0] < 100;
  });
  _block = sort(_pipe$3, (a, b) => {
    return compare2(a[0], b[0]);
  });
  let nearest = _block;
  if (nearest instanceof Empty) {
    return [p.facing, 0];
  } else {
    let dx = nearest.head[1];
    let dy = nearest.head[2];
    return normalize(dx, dy);
  }
}
function fire_skills(world2, before, dt) {
  let p = world2.player;
  let hard_landing = !before.grounded && p.grounded && before.vy < -15;
  let _block;
  let $1 = hard_landing && has2(p, Rule$Crash$const) && p.shield < 1 && p.crash_wait <= 0;
  if ($1) {
    _block = [
      new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        1,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      ),
      prepend(new Said("Block ready"), List$Empty$const)
    ];
  } else {
    _block = [p, List$Empty$const];
  }
  let $ = _block;
  let p$1 = $[0];
  let said = $[1];
  let aim = aim_at_nearest(world2);
  let $2 = map_fold(
    p$1.loadout,
    [List$Empty$const, 0],
    (acc2, w) => {
      let _block$12;
      let $4 = w.trigger;
      if ($4 instanceof OnJump) {
        _block$12 = [p$1.jumped, w];
      } else if ($4 instanceof OnDash) {
        _block$12 = [p$1.dashed, w];
      } else if ($4 instanceof OnHardLanding) {
        _block$12 = [hard_landing, w];
      } else if ($4 instanceof Every) {
        let period = $4.period;
        let t = w.timer - dt;
        let period$1 = max3(
          0.3,
          period * (1 - identity(p$1.mods.cooldown_pct) / 100)
        );
        let _block$2;
        let $5 = w.trigger;
        if ($5 instanceof OnHit) {
          _block$2 = p$1.struck;
        } else {
          _block$2 = true;
        }
        let go = _block$2;
        let $6 = t <= 0 && go;
        if ($6) {
          _block$12 = [
            true,
            new Skill(w.trigger, w.effect, max3(t, 0 - dt) + period$1)
          ];
        } else {
          _block$12 = [false, new Skill(w.trigger, w.effect, t)];
        }
      } else {
        let period = $4.period;
        let t = w.timer - dt;
        let period$1 = max3(
          0.3,
          period * (1 - identity(p$1.mods.cooldown_pct) / 100)
        );
        let _block$2;
        let $5 = w.trigger;
        if ($5 instanceof OnHit) {
          _block$2 = p$1.struck;
        } else {
          _block$2 = true;
        }
        let go = _block$2;
        let $6 = t <= 0 && go;
        if ($6) {
          _block$12 = [
            true,
            new Skill(w.trigger, w.effect, max3(t, 0 - dt) + period$1)
          ];
        } else {
          _block$12 = [false, new Skill(w.trigger, w.effect, t)];
        }
      }
      let $32 = _block$12;
      let fires = $32[0];
      let w$1 = $32[1];
      if (fires) {
        let strikes = spawn2(
          w$1.effect,
          p$1.x,
          p$1.y,
          damage(p$1.stats),
          boost(p$1),
          aim,
          p$1.facing
        );
        let _block$2;
        let $5 = w$1.effect;
        if ($5 instanceof Heal) {
          _block$2 = 1;
        } else {
          _block$2 = 0;
        }
        let heal = _block$2;
        return [[append(strikes, acc2[0]), acc2[1] + heal], w$1];
      } else {
        return [acc2, w$1];
      }
    }
  );
  let new$2;
  let heals;
  let loadout;
  loadout = $2[1];
  new$2 = $2[0][0];
  heals = $2[0][1];
  let amount = heals * max(
    3,
    globalThis.Math.trunc(max_hp3(p$1) * 8 / 100)
  );
  let healed = min(max_hp3(p$1), p$1.hp + amount) - p$1.hp;
  let _block$1;
  let $3 = healed > 0;
  if ($3) {
    _block$1 = prepend(
      new Healed(p$1.x, p$1.y + height, healed),
      List$Empty$const
    );
  } else {
    _block$1 = List$Empty$const;
  }
  let events = _block$1;
  return new World(
    new Player(
      p$1.x,
      p$1.y,
      p$1.vx,
      p$1.vy,
      p$1.grounded,
      p$1.on_platform,
      p$1.wall,
      p$1.facing,
      p$1.coyote,
      p$1.jump_buffer,
      p$1.air_jumps,
      p$1.dash_time,
      p$1.dashes,
      p$1.drop_time,
      p$1.can_cut,
      p$1.up_held,
      p$1.jumped,
      p$1.dashed,
      false,
      p$1.plunged,
      loadout,
      p$1.class,
      p$1.allocated,
      p$1.mods,
      p$1.shield,
      p$1.crash_wait,
      p$1.swings,
      p$1.attack,
      p$1.stats,
      p$1.lvl,
      p$1.xp,
      p$1.points,
      p$1.hp + healed,
      p$1.invuln,
      p$1.hurt
    ),
    world2.level,
    world2.enemies,
    world2.projectiles,
    append(world2.strikes, new$2),
    flatten(
      prepend(
        world2.events,
        prepend(said, prepend(events, List$Empty$const))
      )
    ),
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    world2.time,
    world2.kills,
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function move(p, level, dt) {
  let m = collide(
    new Motion(p.x, p.y, p.vx, p.vy, p.grounded, p.on_platform, p.wall),
    width,
    height,
    level,
    dt,
    p.drop_time <= 0
  );
  return new Player(
    m.x,
    m.y,
    m.vx,
    m.vy,
    m.grounded,
    m.on_platform,
    m.wall,
    p.facing,
    p.coyote,
    p.jump_buffer,
    p.air_jumps,
    p.dash_time,
    p.dashes,
    p.drop_time,
    p.can_cut,
    p.up_held,
    p.jumped,
    p.dashed,
    p.struck,
    p.plunged,
    p.loadout,
    p.class,
    p.allocated,
    p.mods,
    p.shield,
    p.crash_wait,
    p.swings,
    p.attack,
    p.stats,
    p.lvl,
    p.xp,
    p.points,
    p.hp,
    p.invuln,
    p.hurt
  );
}
function unless_attacking(p, k) {
  let $ = p.attack;
  if ($ instanceof Some) {
    return p;
  } else {
    return k();
  }
}
function dash(p, input) {
  return unless_attacking(
    p,
    () => {
      let $ = input.dash_pressed && p.dashes > 0 && p.dash_time <= 0;
      if ($) {
        let _block;
        let $2 = absolute_value2(input.move_x) < 0.1 && absolute_value2(
          input.move_y
        ) < 0.1;
        if ($2) {
          _block = [p.facing, 0];
        } else {
          _block = normalize(input.move_x, input.move_y);
        }
        let $1 = _block;
        let dx = $1[0];
        let dy = $1[1];
        return new Player(
          p.x,
          p.y,
          dx * dash_speed,
          dy * dash_speed,
          p.grounded,
          p.on_platform,
          p.wall,
          p.facing,
          p.coyote,
          p.jump_buffer,
          p.air_jumps,
          dash_duration,
          p.dashes - 1,
          p.drop_time,
          p.can_cut,
          p.up_held,
          p.jumped,
          true,
          p.struck,
          p.plunged,
          p.loadout,
          p.class,
          p.allocated,
          p.mods,
          p.shield,
          p.crash_wait,
          p.swings,
          p.attack,
          p.stats,
          p.lvl,
          p.xp,
          p.points,
          p.hp,
          p.invuln,
          p.hurt
        );
      } else {
        return p;
      }
    }
  );
}
function jump(p, input) {
  return unless_attacking(
    p,
    () => {
      let wants = p.jump_buffer > 0;
      let drop2 = input.move_y < -0.5 && p.grounded && p.on_platform;
      let on_ground = p.grounded || p.coyote > 0;
      let on_wall = p.mods.wall_jump && p.wall !== 0 && !p.grounded;
      if (wants) {
        if (drop2) {
          return new Player(
            p.x,
            p.y,
            p.vx,
            p.vy,
            false,
            p.on_platform,
            p.wall,
            p.facing,
            p.coyote,
            0,
            p.air_jumps,
            p.dash_time,
            p.dashes,
            drop_duration,
            p.can_cut,
            p.up_held,
            p.jumped,
            p.dashed,
            p.struck,
            p.plunged,
            p.loadout,
            p.class,
            p.allocated,
            p.mods,
            p.shield,
            p.crash_wait,
            p.swings,
            p.attack,
            p.stats,
            p.lvl,
            p.xp,
            p.points,
            p.hp,
            p.invuln,
            p.hurt
          );
        } else if (on_ground) {
          return new Player(
            p.x,
            p.y,
            p.vx,
            jump_speed,
            false,
            p.on_platform,
            p.wall,
            p.facing,
            0,
            0,
            p.air_jumps,
            min2(p.dash_time, 0),
            p.dashes,
            p.drop_time,
            true,
            p.up_held,
            true,
            p.dashed,
            p.struck,
            p.plunged,
            p.loadout,
            p.class,
            p.allocated,
            p.mods,
            p.shield,
            p.crash_wait,
            p.swings,
            p.attack,
            p.stats,
            p.lvl,
            p.xp,
            p.points,
            p.hp,
            p.invuln,
            p.hurt
          );
        } else if (on_wall) {
          return new Player(
            p.x,
            p.y,
            negate(p.wall) * wall_jump_x,
            wall_jump_y,
            p.grounded,
            p.on_platform,
            p.wall,
            negate(p.wall),
            p.coyote,
            0,
            p.air_jumps,
            min2(p.dash_time, 0),
            p.dashes,
            p.drop_time,
            true,
            p.up_held,
            true,
            p.dashed,
            p.struck,
            p.plunged,
            p.loadout,
            p.class,
            p.allocated,
            p.mods,
            p.shield,
            p.crash_wait,
            p.swings,
            p.attack,
            p.stats,
            p.lvl,
            p.xp,
            p.points,
            p.hp,
            p.invuln,
            p.hurt
          );
        } else {
          let $ = input.jump_pressed && p.air_jumps > 0;
          if ($) {
            return new Player(
              p.x,
              p.y,
              p.vx,
              air_jump_speed,
              p.grounded,
              p.on_platform,
              p.wall,
              p.facing,
              p.coyote,
              0,
              p.air_jumps - 1,
              min2(p.dash_time, 0),
              p.dashes,
              p.drop_time,
              true,
              p.up_held,
              true,
              p.dashed,
              p.struck,
              p.plunged,
              p.loadout,
              p.class,
              p.allocated,
              p.mods,
              p.shield,
              p.crash_wait,
              p.swings,
              p.attack,
              p.stats,
              p.lvl,
              p.xp,
              p.points,
              p.hp,
              p.invuln,
              p.hurt
            );
          } else {
            return p;
          }
        }
      } else {
        let $ = input.jump_pressed && p.air_jumps > 0;
        if ($) {
          return new Player(
            p.x,
            p.y,
            p.vx,
            air_jump_speed,
            p.grounded,
            p.on_platform,
            p.wall,
            p.facing,
            p.coyote,
            0,
            p.air_jumps - 1,
            min2(p.dash_time, 0),
            p.dashes,
            p.drop_time,
            true,
            p.up_held,
            true,
            p.dashed,
            p.struck,
            p.plunged,
            p.loadout,
            p.class,
            p.allocated,
            p.mods,
            p.shield,
            p.crash_wait,
            p.swings,
            p.attack,
            p.stats,
            p.lvl,
            p.xp,
            p.points,
            p.hp,
            p.invuln,
            p.hurt
          );
        } else {
          return p;
        }
      }
    }
  );
}
function unless_dashing(p, k) {
  let $ = p.dash_time > 0;
  if ($) {
    return p;
  } else {
    return k();
  }
}
function vertical(p, input, dt) {
  return unless_dashing(
    p,
    () => {
      let vy = p.vy - gravity * dt;
      let _block;
      let $ = p.can_cut && !input.jump_held && vy > jump_cut;
      if ($) {
        _block = jump_cut;
      } else {
        _block = vy;
      }
      let vy$1 = _block;
      let pushing_wall = p.mods.wall_jump && p.wall !== 0 && input.move_x * p.wall > 0.1;
      let _block$1;
      if (pushing_wall) {
        _block$1 = wall_slide;
      } else {
        _block$1 = max_fall;
      }
      let cap = _block$1;
      let _block$2;
      let $1 = plunging(p);
      if ($1) {
        _block$2 = 0 - max_fall;
      } else {
        _block$2 = max3(vy$1, 0 - cap);
      }
      let vy$2 = _block$2;
      return new Player(
        p.x,
        p.y,
        p.vx,
        vy$2,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut && vy$2 > 0,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    }
  );
}
function horizontal(p, input, dt) {
  return unless_dashing(
    p,
    () => {
      let has_input = absolute_value2(input.move_x) > 0.1 && (!p.grounded || p.attack instanceof None || has2(
        p,
        Rule$FreeSwing$const
      ));
      let _block;
      let $ = p.grounded;
      if ($) {
        if (has_input) {
          _block = ground_accel;
        } else {
          _block = ground_friction;
        }
      } else if (has_input) {
        _block = air_accel;
      } else {
        _block = air_drag;
      }
      let rate = _block;
      let _block$1;
      if (has_input) {
        _block$1 = input.move_x * run_speed;
      } else {
        _block$1 = 0;
      }
      let target = _block$1;
      return new Player(
        p.x,
        p.y,
        approach(p.vx, target, rate * dt),
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    }
  );
}
function start_attack(p, input) {
  let $ = input.attack_pressed;
  let $1 = p.attack;
  let $2 = p.dash_time <= 0;
  if ($ && $1 instanceof None && $2) {
    let _block;
    let $3 = input.move_y > 0.5;
    let $4 = input.move_y < -0.5 && !p.grounded;
    if ($3) {
      _block = Dir$Up$const;
    } else if ($4) {
      _block = Dir$Down$const;
    } else {
      _block = Dir$Forward$const;
    }
    let dir = _block;
    return new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      p.mods,
      p.shield,
      p.crash_wait,
      p.swings + 1,
      new Some(new Attack(dir, 0, List$Empty$const)),
      p.stats,
      p.lvl,
      p.xp,
      p.points,
      p.hp,
      p.invuln,
      p.hurt
    );
  } else {
    return p;
  }
}
function tick2(p, input, dt) {
  let dash_time = p.dash_time - dt;
  let dash_ended = p.dash_time > 0 && dash_time <= 0;
  let _block;
  if (dash_ended) {
    _block = dash_exit;
  } else {
    _block = 1;
  }
  let exit = _block;
  return new Player(
    p.x,
    p.y,
    p.vx * exit,
    p.vy * exit,
    p.grounded,
    p.on_platform,
    p.wall,
    (() => {
      let $ = p.attack;
      let $1 = input.move_x > 0.1;
      let $2 = input.move_x < -0.1;
      if ($ instanceof None) {
        if ($1) {
          return 1;
        } else if ($2) {
          return -1;
        } else {
          return p.facing;
        }
      } else {
        return p.facing;
      }
    })(),
    (() => {
      let $ = p.grounded;
      if ($) {
        return coyote_time;
      } else {
        return p.coyote - dt;
      }
    })(),
    (() => {
      let $ = input.jump_pressed;
      if ($) {
        return buffer_time;
      } else {
        return p.jump_buffer - dt;
      }
    })(),
    (() => {
      let $ = p.grounded;
      if ($) {
        return p.mods.air_jumps;
      } else {
        return p.air_jumps;
      }
    })(),
    dash_time,
    (() => {
      let $ = p.grounded && p.dash_time < 0 - dash_recharge;
      if ($) {
        return p.mods.dashes;
      } else {
        return p.dashes;
      }
    })(),
    p.drop_time - dt,
    p.can_cut,
    p.up_held,
    false,
    false,
    p.struck,
    p.plunged && !p.grounded,
    p.loadout,
    p.class,
    p.allocated,
    p.mods,
    p.shield,
    p.crash_wait - dt,
    p.swings,
    map(
      p.attack,
      (a) => {
        return new Attack(a.dir, a.time + dt, a.hit);
      }
    ),
    p.stats,
    p.lvl,
    p.xp,
    p.points,
    p.hp,
    p.invuln - dt,
    p.hurt - dt
  );
}
function step2(world2, input, dt) {
  let up_fresh = input.move_y > 0.5 && !world2.player.up_held;
  let before = world2.player;
  let _block;
  let $ = world2.player.hurt > 0;
  if ($) {
    _block = new Input(0, 0, false, false, false, false);
  } else {
    _block = input;
  }
  let input$1 = _block;
  let _block$1;
  let _pipe = world2.player;
  let _pipe$1 = tick2(_pipe, input$1, dt);
  let _pipe$2 = start_attack(_pipe$1, input$1);
  let _pipe$3 = horizontal(_pipe$2, input$1, dt);
  let _pipe$4 = vertical(_pipe$3, input$1, dt);
  let _pipe$5 = jump(_pipe$4, input$1);
  let _pipe$6 = dash(_pipe$5, input$1);
  _block$1 = move(_pipe$6, world2.level, dt);
  let player2 = _block$1;
  let player$1 = new Player(
    player2.x,
    player2.y,
    player2.vx,
    player2.vy,
    player2.grounded,
    player2.on_platform,
    player2.wall,
    player2.facing,
    player2.coyote,
    player2.jump_buffer,
    player2.air_jumps,
    player2.dash_time,
    player2.dashes,
    player2.drop_time,
    player2.can_cut,
    input$1.move_y > 0.5,
    player2.jumped,
    player2.dashed,
    player2.struck,
    player2.plunged,
    player2.loadout,
    player2.class,
    player2.allocated,
    player2.mods,
    player2.shield,
    player2.crash_wait,
    player2.swings,
    player2.attack,
    player2.stats,
    player2.lvl,
    player2.xp,
    player2.points,
    player2.hp,
    player2.invuln,
    player2.hurt
  );
  let _block$2;
  let $1 = world2.depth > 0 && !(world2.depth === boss_depth && world2.cleared);
  if ($1) {
    _block$2 = world2.time + dt;
  } else {
    _block$2 = world2.time;
  }
  let time = _block$2;
  let _pipe$7 = new World(
    player$1,
    world2.level,
    world2.enemies,
    world2.projectiles,
    world2.strikes,
    List$Empty$const,
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    world2.unlocked,
    world2.npcs,
    time,
    world2.kills,
    world2.room_time + dt,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
  let _pipe$8 = fire_skills(_pipe$7, before, dt);
  let _pipe$9 = orbit(_pipe$8);
  let _pipe$10 = seal(_pipe$9);
  let _pipe$11 = enemies_act(_pipe$10, dt);
  let _pipe$12 = combat(_pipe$11);
  let _pipe$13 = strikes_act(_pipe$12, dt);
  let _pipe$14 = take_damage(_pipe$13);
  let _pipe$15 = check_clear(_pipe$14);
  let _pipe$16 = use_door(_pipe$15, up_fresh);
  let _pipe$17 = talk(_pipe$16, up_fresh);
  return tick_enemies(_pipe$17, dt);
}
function apply_node(p, kind) {
  let m = p.mods;
  let with$ = (m2) => {
    return new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      p.allocated,
      m2,
      p.shield,
      p.crash_wait,
      p.swings,
      p.attack,
      p.stats,
      p.lvl,
      p.xp,
      p.points,
      p.hp,
      p.invuln,
      p.hurt
    );
  };
  if (kind instanceof Keystone) {
    return p;
  } else if (kind instanceof Small) {
    let $ = kind.bonus;
    if ($ instanceof Stat) {
      let axis = $[0];
      return apply_reward(p, new Point(axis));
    } else if ($ instanceof MaxHp) {
      let n = $[0];
      return new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        new Mods(
          m.bonus_hp + n,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        ),
        p.shield,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp + n,
        p.invuln,
        p.hurt
      );
    } else if ($ instanceof DamagePct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct + n,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof AttackSpeedPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct + n,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof ReachPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct + n,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof CooldownPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          min(m.cooldown_pct + n, 60),
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof Iframes) {
      let t = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes + t,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof XpPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct + n,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof KnockbackPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct + n,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof CritPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct + n,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof Shield) {
      return new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        p.loadout,
        p.class,
        p.allocated,
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields + 1,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        ),
        p.shield + 1,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    } else if ($ instanceof ExtraKnife) {
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives + 1,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof KnifePierce) {
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          true,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof ShockwavePct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct + n,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else if ($ instanceof SlashPct) {
      let n = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct + n,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          m.rules
        )
      );
    } else {
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes + 1,
          m.wall_jump,
          m.rules
        )
      );
    }
  } else {
    let $ = kind.grant;
    if ($ instanceof GrantSkill) {
      let skill = $[0];
      return new Player(
        p.x,
        p.y,
        p.vx,
        p.vy,
        p.grounded,
        p.on_platform,
        p.wall,
        p.facing,
        p.coyote,
        p.jump_buffer,
        p.air_jumps,
        p.dash_time,
        p.dashes,
        p.drop_time,
        p.can_cut,
        p.up_held,
        p.jumped,
        p.dashed,
        p.struck,
        p.plunged,
        prepend(skill, p.loadout),
        p.class,
        p.allocated,
        p.mods,
        p.shield,
        p.crash_wait,
        p.swings,
        p.attack,
        p.stats,
        p.lvl,
        p.xp,
        p.points,
        p.hp,
        p.invuln,
        p.hurt
      );
    } else if ($ instanceof GrantMove) {
      let $1 = $[0];
      if ($1 instanceof DoubleJump) {
        return with$(
          new Mods(
            m.bonus_hp,
            m.damage_pct,
            m.attack_speed_pct,
            m.reach_pct,
            m.cooldown_pct,
            m.iframes,
            m.xp_pct,
            m.knockback_pct,
            m.crit_pct,
            m.shields,
            m.knives,
            m.pierce,
            m.shockwave_pct,
            m.slash_pct,
            m.air_jumps + 1,
            m.dashes,
            m.wall_jump,
            m.rules
          )
        );
      } else if ($1 instanceof Dash) {
        return with$(
          new Mods(
            m.bonus_hp,
            m.damage_pct,
            m.attack_speed_pct,
            m.reach_pct,
            m.cooldown_pct,
            m.iframes,
            m.xp_pct,
            m.knockback_pct,
            m.crit_pct,
            m.shields,
            m.knives,
            m.pierce,
            m.shockwave_pct,
            m.slash_pct,
            m.air_jumps,
            m.dashes + 1,
            m.wall_jump,
            m.rules
          )
        );
      } else {
        return with$(
          new Mods(
            m.bonus_hp,
            m.damage_pct,
            m.attack_speed_pct,
            m.reach_pct,
            m.cooldown_pct,
            m.iframes,
            m.xp_pct,
            m.knockback_pct,
            m.crit_pct,
            m.shields,
            m.knives,
            m.pierce,
            m.shockwave_pct,
            m.slash_pct,
            m.air_jumps,
            m.dashes,
            true,
            m.rules
          )
        );
      }
    } else {
      let rule = $[0];
      return with$(
        new Mods(
          m.bonus_hp,
          m.damage_pct,
          m.attack_speed_pct,
          m.reach_pct,
          m.cooldown_pct,
          m.iframes,
          m.xp_pct,
          m.knockback_pct,
          m.crit_pct,
          m.shields,
          m.knives,
          m.pierce,
          m.shockwave_pct,
          m.slash_pct,
          m.air_jumps,
          m.dashes,
          m.wall_jump,
          prepend(rule, m.rules)
        )
      );
    }
  }
}
function allocate(world2, id) {
  let p = world2.player;
  let ok = p.points > 0 && !(p.class instanceof None) && can_allocate(
    world2.tree,
    p.allocated,
    id
  );
  let $ = get(world2.tree.nodes, id);
  if (ok && $ instanceof Ok) {
    let node = $[0];
    let p$1 = new Player(
      p.x,
      p.y,
      p.vx,
      p.vy,
      p.grounded,
      p.on_platform,
      p.wall,
      p.facing,
      p.coyote,
      p.jump_buffer,
      p.air_jumps,
      p.dash_time,
      p.dashes,
      p.drop_time,
      p.can_cut,
      p.up_held,
      p.jumped,
      p.dashed,
      p.struck,
      p.plunged,
      p.loadout,
      p.class,
      prepend(id, p.allocated),
      p.mods,
      p.shield,
      p.crash_wait,
      p.swings,
      p.attack,
      p.stats,
      p.lvl,
      p.xp,
      p.points - 1,
      p.hp,
      p.invuln,
      p.hurt
    );
    let p$2 = apply_node(p$1, node.kind);
    let own = unwrap(p$2.class, -1);
    let _block;
    let _pipe = saturated(world2.tree, p$2.allocated, own);
    _block = filter(
      _pipe,
      (k) => {
        return !contains(world2.unlocked, k);
      }
    );
    let fresh = _block;
    let names = filter_map(
      world2.tree.cells,
      (c) => {
        let $1 = contains(fresh, c.id);
        if ($1) {
          return new Ok(new Unlocked(c.name));
        } else {
          return new Error(void 0);
        }
      }
    );
    return new World(
      p$2,
      world2.level,
      world2.enemies,
      world2.projectiles,
      world2.strikes,
      append(world2.events, names),
      world2.depth,
      world2.cleared,
      world2.doors,
      world2.exits,
      world2.seed,
      world2.tree,
      append(world2.unlocked, fresh),
      world2.npcs,
      world2.time,
      world2.kills,
      world2.room_time,
      world2.safe_x,
      world2.sealed,
      world2.plan
    );
  } else {
    return world2;
  }
}
function set_unlocked(world2, unlocked) {
  return new World(
    world2.player,
    world2.level,
    world2.enemies,
    world2.projectiles,
    world2.strikes,
    world2.events,
    world2.depth,
    world2.cleared,
    world2.doors,
    world2.exits,
    world2.seed,
    world2.tree,
    unique(append(starters(), unlocked)),
    world2.npcs,
    world2.time,
    world2.kills,
    world2.room_time,
    world2.safe_x,
    world2.sealed,
    world2.plan
  );
}
function class_name(world2) {
  let id = unwrap(world2.player.class, -1);
  let $ = find(world2.tree.cells, (c) => {
    return c.id === id;
  });
  if ($ instanceof Ok) {
    let c = $[0];
    return c.name;
  } else {
    return "No class";
  }
}
function kit_move(name) {
  let m = kit_mods(name);
  let $ = m.dashes;
  let $1 = m.wall_jump;
  if ($ === 1) {
    return "dash";
  } else if ($1) {
    return "wall-jump";
  } else {
    return "air jump";
  }
}
function npc_lines(world2, n) {
  let $ = n.role;
  if ($ instanceof Mentor) {
    return prepend(
      "Mentor",
      prepend(
        "Take it easy here. Nothing in the hub bites.",
        prepend(
          "Keys: move WASD \xB7 jump Space \xB7 dash Shift \xB7 attack J \xB7 tree T",
          prepend(
            "Pad: move stick \xB7 jump X / Y \xB7 dash LB / RB \xB7 attack A \xB7 tree Select",
            prepend(
              "Walk up to a statue and press up to become that class.",
              prepend(
                "Level-ups give points to spend in the tree.",
                prepend(
                  "When you're ready, the door next to me starts a run.",
                  List$Empty$const
                )
              )
            )
          )
        )
      )
    );
  } else {
    let k = $.keystone;
    let $1 = get(world2.tree.nodes, k);
    let node;
    if ($1 instanceof Ok) {
      node = $1[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH2,
        "game",
        1668,
        "npc_lines",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 47265,
          end: 47316,
          pattern_start: 47276,
          pattern_end: 47284
        }
      );
    }
    let $2 = details(world2.tree, node);
    let name;
    let rest;
    if ($2 instanceof Empty) {
      throw makeError(
        "let_assert",
        FILEPATH2,
        "game",
        1670,
        "npc_lines",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $2,
          start: 47399,
          end: 47460,
          pattern_start: 47410,
          pattern_end: 47427
        }
      );
    } else {
      let $3 = $2.tail;
      if ($3 instanceof Empty) {
        throw makeError(
          "let_assert",
          FILEPATH2,
          "game",
          1670,
          "npc_lines",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $2,
            start: 47399,
            end: 47460,
            pattern_start: 47410,
            pattern_end: 47427
          }
        );
      } else {
        name = $2.head;
        rest = $3.tail;
      }
    }
    let about = take(rest, length(rest) - 1);
    let _block;
    let $4 = isEqual(world2.player.class, new Some(k));
    let $5 = contains(world2.unlocked, k);
    if ($4) {
      _block = "This is you.";
    } else if ($5) {
      _block = "Press up to become " + name + ".";
    } else {
      _block = "Locked: fill " + name + "'s ring during a run.";
    }
    let status = _block;
    return flatten(
      prepend(
        prepend(name, List$Empty$const),
        prepend(
          about,
          prepend(
            prepend(
              "Starts with: " + kit_move(name),
              prepend(status, List$Empty$const)
            ),
            List$Empty$const
          )
        )
      )
    );
  }
}

// treescreen.js
var W = 1280;
var H = 720;
var INK = "#3b2b25";
var STRONG = "#2b1d18";
var BODY = "#5b4a43";
var SECTION = "#8a766d";
var PAGE = "#fbf6ee";
var PANE = "#f4ece2";
var RED = "#d94c43";
var GREEN = "#4f9e3f";
var BLUE = "#5a5fd6";
var GOLD = "#e0a21b";
var TEAL = "#1f9fb5";
var KIND = { bonus: "#8a8f99", skill: GOLD, move: TEAL, rule: "#9b59c9" };
var KIND_NAME = { stat: "Stat", bonus: "Bonus", skill: "Skill", move: "Move", rule: "Rule", key: "Class" };
var R = { key: 13, skill: 7.5, move: 7.5, rule: 7.5, bonus: 4.6, stat: 4.6 };
var F = {
  title: '800 17px "Baloo 2"',
  chip: "800 12px Nunito",
  body: "600 14px Nunito",
  strong: "800 14px Nunito",
  section: "800 13px Nunito",
  number: '800 24px "Baloo 2"',
  small: "700 12px Nunito",
  label: '800 19px "Baloo 2"',
  button: "800 13px Nunito",
  hint: "600 14px Nunito",
  badge: '800 15px "Baloo 2"',
  tab: '800 14px "Baloo 2"'
};
var BTN = { A: GREEN, B: RED, X: BLUE, Y: GOLD };
var PANE_AREA = { x: 468, y: 16, w: 796, h: 650 };
var ZOOM = 2.5;
var RING_BEND = 1;
function createTreeScreen({ getWorld, setWorld, onUnlock }) {
  const cv = document.createElement("canvas");
  cv.id = "tree";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let open = false, focusId = null, wholeTree = false, tab = 0, kitIndex = 0;
  let cam = null;
  let view = { s: 1, ox: 0, oy: 0 };
  let lastMove = 0, held = null, padPrev = {};
  const w0 = getWorld();
  const nodes2 = nodes(w0.tree).toArray();
  const byId = new Map(nodes2.map((n) => [n.id, n]));
  const edges = w0.tree.edges.toArray().map((e) => [e[0], e[1]]);
  const neighbours = new Map(nodes2.map((n) => [n.id, []]));
  for (const [a, b] of edges) {
    neighbours.get(a).push(b);
    neighbours.get(b).push(a);
  }
  const cells2 = w0.tree.cells.toArray();
  const onRing = (n) => n.cell >= 0 && neighbours.get(n.id).includes(n.cell);
  const onPath = (n) => n.cell < 0;
  const bends = edges.map(([a, b]) => {
    const A = byId.get(a), B = byId.get(b);
    if (onRing(A) && onRing(B) && A.cell === B.cell) {
      const K = byId.get(A.cell), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const d = Math.hypot(mx - K.x, my - K.y) || 1;
      const sag = (Math.hypot(A.x - K.x, A.y - K.y) + Math.hypot(B.x - K.x, B.y - K.y)) / 2 - d;
      const cx = mx + (mx - K.x) / d * 2 * sag * RING_BEND, cy = my + (my - K.y) / d * 2 * sag * RING_BEND;
      return [A.x + (cx - A.x) * 2 / 3, A.y + (cy - A.y) * 2 / 3, B.x + (cx - B.x) * 2 / 3, B.y + (cy - B.y) * 2 / 3];
    }
    if (!onPath(A) && !onPath(B)) return null;
    const tan2 = (P, Q) => {
      const ns = neighbours.get(P.id);
      if (!onPath(P) || ns.length !== 2) return [Q.x - P.x, Q.y - P.y];
      const O = byId.get(ns[0] === Q.id ? ns[1] : ns[0]);
      return [(Q.x - O.x) / 2, (Q.y - O.y) / 2];
    };
    const ta = tan2(A, B), tb = tan2(B, A);
    return [A.x + ta[0] / 3, A.y + ta[1] / 3, B.x + tb[0] / 3, B.y + tb[1] / 3];
  });
  const xs = nodes2.map((n) => n.x), ys = nodes2.map((n) => n.y);
  const bounds = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  const kindOf = (n) => {
    if (n.kind instanceof Keystone) return "key";
    if (n.kind instanceof Small) return n.kind.bonus instanceof Stat ? "stat" : "bonus";
    return n.kind.grant instanceof GrantSkill ? "skill" : n.kind.grant instanceof GrantMove ? "move" : "rule";
  };
  const AX = (a) => a instanceof Fighter ? RED : a instanceof Rogue ? GREEN : BLUE;
  const colorOf = (n) => kindOf(n) === "stat" ? AX(n.kind.bonus[0]) : n.kind instanceof Keystone ? INK : KIND[kindOf(n)];
  const say = (s, x, y, font, color, align = "left") => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const width2 = (s, font) => {
    ctx.font = font;
    return ctx.measureText(s).width;
  };
  function fit(s, font, max4) {
    if (width2(s, font) <= max4) return s;
    while (s.length > 1 && width2(s + "\u2026", font) > max4) s = s.slice(0, -1);
    return s + "\u2026";
  }
  function shapePath(kind, x, y, r) {
    ctx.beginPath();
    if (kind === "skill") {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.15;
        ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
      }
      ctx.closePath();
    } else if (kind === "move") {
      ctx.moveTo(x, y - r * 1.1);
      ctx.lineTo(x + r, y + r * 0.8);
      ctx.lineTo(x - r, y + r * 0.8);
      ctx.closePath();
    } else if (kind === "rule") {
      ctx.moveTo(x, y - r * 1.15);
      ctx.lineTo(x + r * 1.15, y);
      ctx.lineTo(x, y + r * 1.15);
      ctx.lineTo(x - r * 1.15, y);
      ctx.closePath();
    } else if (kind === "bonus") ctx.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.35);
    else ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  function chip(s, x, y, col) {
    const cw = width2(s, F.chip) + 20;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(x, y - 15, cw, 24, 12);
    ctx.fill();
    say(s, x + cw / 2, y + 2, F.chip, "#fff", "center");
    return cw;
  }
  function button(b, x, y) {
    if (BTN[b]) {
      ctx.fillStyle = BTN[b];
      ctx.beginPath();
      ctx.arc(x + 11, y - 5, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      say(b, x + 11, y, F.button, "#fff", "center");
      return 26;
    }
    const w = width2(b, F.button) + 16;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y - 16, w, 22, 7);
    ctx.fill();
    ctx.stroke();
    say(b, x + w / 2, y, F.button, INK, "center");
    return w + 4;
  }
  function card(x, y, w, h, fill = "#fff") {
    ctx.fillStyle = fill;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
  }
  function glyph(g, x, y, col) {
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (g === "heart") {
      ctx.moveTo(x, y + 7);
      ctx.bezierCurveTo(x - 12, y - 2, x - 6, y - 11, x, y - 4);
      ctx.bezierCurveTo(x + 6, y - 11, x + 12, y - 2, x, y + 7);
      ctx.fill();
    } else if (g === "shield") {
      ctx.moveTo(x - 8, y - 8);
      ctx.lineTo(x + 8, y - 8);
      ctx.lineTo(x + 7, y + 2);
      ctx.lineTo(x, y + 9);
      ctx.lineTo(x - 7, y + 2);
      ctx.closePath();
      ctx.fill();
    } else if (g === "sword") {
      ctx.moveTo(x - 7, y + 7);
      ctx.lineTo(x + 7, y - 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 1);
      ctx.lineTo(x - 1, y + 7);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 5);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 2);
      ctx.stroke();
    }
  }
  const pct2 = (v2) => `${v2 > 0 ? "+" : ""}${Math.round(v2)}%`;
  function mix(f, r, m) {
    const t = f + r + m || 1, c = (a, b, d) => Math.round((a * f + b * r + d * m) / t);
    return `rgb(${c(217, 79, 90)},${c(76, 158, 95)},${c(67, 63, 214)})`;
  }
  function derive() {
    const w = getWorld(), p = w.player;
    const picking = p.class instanceof None;
    const owned = new Set(p.allocated.toArray());
    const unlocked = new Set(w.unlocked.toArray());
    const available = (n) => picking ? n.kind instanceof Keystone && unlocked.has(n.id) && w.depth === 0 : p.points > 0 && can_allocate(w.tree, p.allocated, n.id);
    return { w, p, picking, owned, unlocked, available };
  }
  function defaultFocus() {
    const { p } = derive();
    const owned = p.allocated.toArray();
    return owned.length ? owned[0] : 12;
  }
  function moveFocus(dx, dy) {
    const from = byId.get(focusId);
    const pick = (ids, cone) => {
      let best = null, bestScore = -Infinity;
      for (const id of ids) {
        const n = byId.get(id), vx = n.x - from.x, vy = n.y - from.y, len = Math.hypot(vx, vy);
        if (!len) continue;
        const cos3 = (vx * dx + vy * dy) / len;
        if (cos3 < cone) continue;
        const score = cos3 * 2 - len / 40;
        if (score > bestScore) {
          bestScore = score;
          best = id;
        }
      }
      return best;
    };
    const next3 = pick(neighbours.get(focusId), 0.35) ?? pick(nodes2.map((n) => n.id), 0.7);
    if (next3 != null) focusId = next3;
  }
  function take3() {
    const { w, picking } = derive();
    const n = byId.get(focusId);
    const after = picking ? choose_class(w, n.id) : allocate(w, n.id);
    setWorld(after);
    if (after.events.toArray().some((ev) => ev instanceof Unlocked)) onUnlock();
  }
  function jumpClass(step3) {
    const order = cells2.map((c) => c.id);
    const cur = byId.get(focusId);
    const here = cur.kind instanceof Keystone ? cur.id : cur.cell >= 0 ? cur.cell : order[0];
    const i = order.indexOf(here);
    focusId = order[(i + step3 + order.length) % order.length];
  }
  function toggle() {
    open = !open;
    if (open) {
      if (focusId == null || !byId.has(focusId)) focusId = defaultFocus();
      cam = null;
    }
  }
  function key2(e) {
    if (!open) return false;
    const c = e.code;
    const dirs = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1] };
    if (dirs[c]) moveFocus(...dirs[c]);
    else if (c === "Enter" || c === "Space" || c === "KeyJ") {
      if (!e.repeat) take3();
    } else if (c === "Escape" || c === "KeyT" || c === "Tab") toggle();
    else if (c === "KeyQ") jumpClass(-1);
    else if (c === "KeyE") jumpClass(1);
    else if (c === "KeyZ") tab = (tab + 2) % 3;
    else if (c === "KeyC") tab = (tab + 1) % 3;
    else if (c === "KeyX") kitIndex++;
    else if (c === "KeyY") wholeTree = !wholeTree;
    else return true;
    e.preventDefault();
    return true;
  }
  function pad(gp, now) {
    const pressed = (i) => !!gp?.buttons[i]?.pressed;
    const edge = (i) => {
      const on = pressed(i), was = padPrev[i];
      padPrev[i] = on;
      return on && !was;
    };
    if (!gp) return open;
    if (edge(8)) toggle();
    if (!open) {
      for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) padPrev[i] = pressed(i);
      return false;
    }
    if (edge(0)) take3();
    if (edge(1)) toggle();
    if (edge(2)) kitIndex++;
    if (edge(3)) wholeTree = !wholeTree;
    if (edge(4)) jumpClass(-1);
    if (edge(5)) jumpClass(1);
    if (edge(6)) tab = (tab + 2) % 3;
    if (edge(7)) tab = (tab + 1) % 3;
    let dx = gp.axes[0] ?? 0, dy = -(gp.axes[1] ?? 0);
    if (pressed(14)) dx = -1;
    if (pressed(15)) dx = 1;
    if (pressed(12)) dy = 1;
    if (pressed(13)) dy = -1;
    const mag = Math.hypot(dx, dy);
    if (mag > 0.5) {
      const dirKey = `${Math.round(dx * 2)},${Math.round(dy * 2)}`;
      const wait = held === dirKey ? 130 : 0;
      if (held !== dirKey || now - lastMove > wait) {
        moveFocus(dx / mag, dy / mag);
        lastMove = now + (held === dirKey ? 0 : 160);
        held = dirKey;
      }
    } else held = null;
    return true;
  }
  const toDesign = (e) => [(e.clientX - view.ox) / view.s, (e.clientY - view.oy) / view.s];
  let mouseNode = null;
  cv.addEventListener("mousemove", (e) => {
    const [mx, my] = toDesign(e);
    mouseNode = null;
    for (const n of nodes2) {
      const [x, y] = project(n.x, n.y);
      if (Math.hypot(mx - x, my - y) < R[kindOf(n)] * scaleOf() + 6 && inPane(mx, my)) {
        mouseNode = n.id;
        break;
      }
    }
    if (mouseNode != null) focusId = mouseNode;
  });
  cv.addEventListener("click", () => {
    if (mouseNode != null) take3();
  });
  const scaleOf = () => wholeTree ? 1 : 1.6;
  function baseScale() {
    return Math.min(PANE_AREA.w / (bounds.x1 - bounds.x0), PANE_AREA.h / (bounds.y1 - bounds.y0));
  }
  function project(x, y) {
    const zoom = wholeTree ? 0.92 : ZOOM, sc = baseScale() * zoom;
    const c = wholeTree ? [(bounds.x0 + bounds.x1) / 2, (bounds.y0 + bounds.y1) / 2] : cam;
    return [PANE_AREA.x + PANE_AREA.w / 2 + (x - c[0]) * sc, PANE_AREA.y + PANE_AREA.h / 2 - (y - c[1]) * sc - (wholeTree ? 0 : 40)];
  }
  const inPane = (x, y) => x > PANE_AREA.x && x < PANE_AREA.x + PANE_AREA.w && y > PANE_AREA.y && y < PANE_AREA.y + PANE_AREA.h;
  function drawPane(d) {
    const f = byId.get(focusId);
    const target = [f.x, f.y];
    cam = cam ? [cam[0] + (target[0] - cam[0]) * 0.18, cam[1] + (target[1] - cam[1]) * 0.18] : target;
    card(PANE_AREA.x, PANE_AREA.y, PANE_AREA.w, PANE_AREA.h, PANE);
    const s = scaleOf();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PANE_AREA.x + 2, PANE_AREA.y + 2, PANE_AREA.w - 4, PANE_AREA.h - 4, 12);
    ctx.clip();
    edges.forEach(([a, b], i) => {
      const on = d.owned.has(a) && d.owned.has(b);
      const [ax, ay] = project(byId.get(a).x, byId.get(a).y), [bx, by] = project(byId.get(b).x, byId.get(b).y);
      ctx.strokeStyle = on ? INK : "rgba(60,40,35,0.32)";
      ctx.lineWidth = on ? wholeTree ? 2.5 : 4 : wholeTree ? 1 : 1.6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      const c = bends[i];
      if (c) ctx.bezierCurveTo(...project(c[0], c[1]), ...project(c[2], c[3]), bx, by);
      else ctx.lineTo(bx, by);
      ctx.stroke();
    });
    for (const n of nodes2) {
      const [x, y] = project(n.x, n.y);
      if (x < PANE_AREA.x - 30 || x > PANE_AREA.x + PANE_AREA.w + 30 || y < PANE_AREA.y - 30 || y > PANE_AREA.y + PANE_AREA.h + 30) continue;
      const k = kindOf(n), r = R[k] * s, has3 = d.owned.has(n.id), can = d.available(n);
      const col = k === "key" ? d.unlocked.has(n.id) ? INK : "#9a8d86" : colorOf(n);
      ctx.globalAlpha = has3 || can || k === "key" ? 1 : 0.5;
      shapePath(k, x, y, r);
      ctx.fillStyle = has3 ? col : "#fffdf8";
      ctx.fill();
      ctx.lineWidth = can ? 3.5 : k === "key" ? 3 : 2;
      ctx.strokeStyle = can ? TEAL : col;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const c of cells2) {
      const [x, y] = project(c.x, c.y);
      ctx.font = wholeTree ? '800 14px "Baloo 2"' : F.label;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.strokeStyle = PANE;
      ctx.lineWidth = 5;
      const ly = y + (wholeTree ? 26 : 44);
      ctx.strokeText(c.name, x, ly);
      ctx.fillStyle = d.unlocked.has(c.id) ? STRONG : "#8a7a73";
      ctx.fillText(c.name, x, ly);
    }
    const [fx, fy] = project(f.x, f.y), fr = R[kindOf(f)] * s + 8;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    shapePath(kindOf(f), fx, fy, fr);
    ctx.stroke();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    shapePath(kindOf(f), fx, fy, fr + 4);
    ctx.stroke();
    ctx.restore();
    button("Y", PANE_AREA.x + PANE_AREA.w - 148, PANE_AREA.y + 34);
    say(wholeTree ? "Zoom in" : "Whole tree", PANE_AREA.x + PANE_AREA.w - 116, PANE_AREA.y + 34, F.hint, BODY);
    const lines = details(d.w.tree, f).toArray();
    const title = lines[0];
    const body2 = lines.slice(1).filter((l) => !/^(Small node|Notable|Keystone)/.test(l));
    let status, go = false;
    if (d.owned.has(f.id)) status = "Owned";
    else if (f.kind instanceof Keystone) {
      const [have, of] = ring_progress(d.w.tree, d.p.allocated, f.id);
      status = d.picking ? d.unlocked.has(f.id) ? (go = true, `Start as ${f.kind.name}`) : "Locked: fill its ring in a run" : `Ring ${have}/${of}${d.unlocked.has(f.id) ? " \xB7 unlocked" : ""}`;
    } else if (d.picking) status = "Pick a class first";
    else if (d.available(f)) {
      status = "Take it";
      go = true;
    } else if (d.p.points === 0 && can_allocate(d.w.tree, d.p.allocated, f.id)) status = "Needs a point";
    else {
      const dist = distance(d.w.tree, d.p.allocated, f.id);
      status = dist > 0 ? `${dist} points away` : "Unreachable";
    }
    const cw = 560, ch = 64 + Math.min(body2.length, 4) * 20, cx = PANE_AREA.x + 20, cy = PANE_AREA.y + PANE_AREA.h - ch - 20;
    card(cx, cy, cw, ch);
    say(fit(title, '800 19px "Baloo 2"', cw - 180), cx + 18, cy + 32, '800 19px "Baloo 2"', STRONG);
    const kw = chip(KIND_NAME[kindOf(f)], cx + 18, cy + 60, colorOf(f));
    body2.slice(0, 4).forEach((l, i) => say(fit(l, F.body, cw - kw - 60), cx + 26 + kw, cy + 61 + i * 20, F.body, BODY));
    if (go) {
      button("A", cx + cw - 150, cy + 34);
      say(status, cx + cw - 118, cy + 34, F.strong, "#1d5b2a");
    } else say(status, cx + cw - 18, cy + 34, F.strong, SECTION, "right");
  }
  function kitTiles(p) {
    const tiles = [];
    for (const s of p.loadout.toArray()) {
      const [when, what] = describe(s).split(" -> ");
      tiles.push({ k: "skill", name: what[0].toUpperCase() + what.slice(1), sub: when, detail: describe(s) });
    }
    const m = p.mods;
    if (m.air_jumps > 0) tiles.push({ k: "move", name: "Air jump", sub: `\xD7${m.air_jumps}`, detail: `${m.air_jumps} extra jump${m.air_jumps > 1 ? "s" : ""} in the air` });
    if (m.dashes > 0) tiles.push({ k: "move", name: "Dash", sub: `\xD7${m.dashes}`, detail: `${m.dashes} dash charge${m.dashes > 1 ? "s" : ""}; refills on the ground` });
    if (m.wall_jump) tiles.push({ k: "move", name: "Wall-jump", sub: "move", detail: "Jump off walls" });
    for (const r of m.rules.toArray()) {
      const text = grant_name(new GrantRule(r));
      const named = text.includes(": ");
      tiles.push({ k: "rule", name: named ? text.split(": ")[0] : text.split(" ").slice(0, 2).join(" "), sub: named ? "keystone" : "rule", detail: text });
    }
    return tiles;
  }
  function drawSheet(d) {
    const { p, w } = d, x = 16, sw = 436;
    card(x, 16, sw, 650);
    const st = p.stats;
    const name = d.picking ? "No class yet" : class_name(w);
    ctx.fillStyle = d.picking ? "#c9bdb3" : mix(st.fighter, st.rogue, st.mage);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + 16, 32, 104, 124, 14);
    ctx.fill();
    ctx.stroke();
    say(d.picking ? "?" : name[0], x + 68, 112, '800 60px "Baloo 2"', "#fff", "center");
    say("portrait", x + 68, 144, F.small, "rgba(255,255,255,0.8)", "center");
    say(fit(name, '800 32px "Baloo 2"', 280), x + 136, 64, '800 32px "Baloo 2"', STRONG);
    say(`Level ${p.lvl}`, x + 138, 90, '700 17px "Baloo 2"', "#6b5a52");
    const need = xp_needed(p.lvl), bx = x + 138, by = 100, bw = 168;
    ctx.fillStyle = "#efe5d8";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 10, 5);
    ctx.fill();
    ctx.fillStyle = "#4fb3d9";
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(4, bw * p.xp / need), 10, 5);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 10, 5);
    ctx.stroke();
    say(`${p.xp} / ${need} XP`, bx + bw + 8, by + 10, F.small, SECTION);
    if (p.points > 0) {
      const label2 = `${p.points} point${p.points > 1 ? "s" : ""} to spend`, pw = width2(label2, F.badge) + 28;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.roundRect(x + 138, 122, pw, 30, 15);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      say(label2, x + 152, 143, F.badge, STRONG);
    } else say(d.picking ? "Talk to a statue to pick a class" : "Level up to earn points", x + 138, 143, F.hint, SECTION);
    const tx = x + 30, ty = 196, ts = 104, th = ts * Math.sqrt(3) / 2;
    const top = [tx + ts / 2, ty], bl = [tx, ty + th], br = [tx + ts, ty + th];
    ctx.beginPath();
    ctx.moveTo(...top);
    ctx.lineTo(...br);
    ctx.lineTo(...bl);
    ctx.closePath();
    ctx.fillStyle = "#f7efe6";
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    const corner = (pt, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    corner(top, RED);
    corner(bl, GREEN);
    corner(br, BLUE);
    const tot = st.fighter + st.rogue + st.mage;
    if (tot > 0) {
      const dot = [0, 1].map((i) => (top[i] * st.fighter + bl[i] * st.rogue + br[i] * st.mage) / tot);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(dot[0], dot[1], 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(dot[0], dot[1], 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    say("Where you stand", x + 162, 206, F.section, SECTION);
    const axes = [["Fighter", st.fighter, RED], ["Rogue", st.rogue, GREEN], ["Mage", st.mage, BLUE]];
    axes.forEach(([n, v2, c], i) => {
      const yy = 234 + i * 26;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + 170, yy - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      say(n, x + 184, yy, F.body, BODY);
      say(String(v2), x + 264, yy, F.strong, STRONG);
    });
    const ranked = [...axes].sort((a, b) => b[1] - a[1]);
    const lean = tot === 0 ? "Untrained" : ranked[0][1] === ranked[2][1] ? "Perfectly balanced" : ranked[1][1] > 0 && ranked[1][1] < ranked[0][1] ? `Leaning ${ranked[0][0]}, a touch of ${ranked[1][0]}` : ranked[1][1] === ranked[0][1] ? `${ranked[0][0]} and ${ranked[1][0]} in step` : `Pure ${ranked[0][0]}`;
    say(lean, x + 162, 312, F.small, SECTION);
    const vitals = [
      ["heart", `${p.hp}`, `HP of ${max_hp3(p)}`, RED],
      ["shield", `${p.mods.shields}`, "Shield / room", TEAL],
      ["sword", `${damage2(p)}`, "Damage", INK],
      ["clock", `${speed2(p).toFixed(2)}\xD7`, "Atk speed", INK]
    ];
    vitals.forEach(([g, v2, label2, col], i) => {
      const vx = x + 16 + i * 102, vy = 330;
      ctx.fillStyle = "#faf5ee";
      ctx.strokeStyle = "rgba(59,43,37,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(vx, vy, 94, 70, 12);
      ctx.fill();
      ctx.stroke();
      glyph(g, vx + 18, vy + 24, col);
      say(v2, vx + 32, vy + 32, F.number, STRONG);
      say(label2, vx + 12, vy + 58, F.small, SECTION);
    });
    const tiles = kitTiles(p);
    say("Kit", x + 18, 424, F.section, SECTION);
    if (tiles.length > 5) say(`${tiles.length} total \xB7 X to browse`, x + sw - 18, 424, F.small, SECTION, "right");
    if (!tiles.length) say("Nothing yet: skills, moves and rules from the tree land here", x + 18, 466, F.body, SECTION);
    const ki = tiles.length ? kitIndex % tiles.length : 0;
    const start = Math.max(0, Math.min(ki - 2, tiles.length - 5));
    tiles.slice(start, start + 5).forEach((t, j) => {
      const i = start + j, kx = x + 16 + j * 82, ky = 434, on = i === ki;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = on ? INK : "rgba(59,43,37,0.35)";
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(kx, ky, 74, 74, 12);
      ctx.fill();
      ctx.stroke();
      shapePath(t.k, kx + 37, ky + 28, 11);
      ctx.fillStyle = KIND[t.k];
      ctx.fill();
      say(fit(t.name, "800 12px Nunito", 68), kx + 37, ky + 56, "800 12px Nunito", STRONG, "center");
      say(fit(t.sub, "600 10px Nunito", 68), kx + 37, ky + 69, "600 10px Nunito", SECTION, "center");
    });
    if (tiles.length) say(fit(tiles[ki].detail, F.body, sw - 36), x + 18, 530, F.body, BODY);
    const m = p.mods, tabs = ["Offense", "Defense", "Movement"];
    const rows = [
      [
        ["Damage", `${damage2(p)}`, true],
        ["Attack speed", `${speed2(p).toFixed(2)}\xD7`, speed2(p) > 1.001],
        ["Crit chance", `${m.crit_pct}%`, m.crit_pct > 0],
        ["Reach", pct2((reach2(p) - 1) * 100), reach2(p) > 1.001],
        ["Targets", `${max_targets(st)}`, max_targets(st) > 1],
        ["Cooldowns", m.cooldown_pct ? `-${m.cooldown_pct}%` : "0%", m.cooldown_pct > 0],
        ["Knockback", pct2(m.knockback_pct), m.knockback_pct > 0],
        ["XP gain", pct2(m.xp_pct), m.xp_pct > 0]
      ],
      [
        ["Max HP", `${max_hp3(p)}`, true],
        ["Bonus HP", `+${m.bonus_hp}`, m.bonus_hp > 0],
        ["Shields / room", `${m.shields}`, m.shields > 0],
        ["Extra i-frames", `+${m.iframes.toFixed(1)}s`, m.iframes > 0],
        ["Level-up heal", "20%", true],
        ["Dash i-frames", "on", true]
      ],
      [
        ["Air jumps", `${m.air_jumps}`, m.air_jumps > 0],
        ["Dash charges", `${m.dashes}`, m.dashes > 0],
        ["Wall-jump", m.wall_jump ? "yes" : "no", m.wall_jump],
        ["Fast fall", "yes", true],
        ["Skills", `${p.loadout.toArray().length}`, p.loadout.toArray().length > 0],
        ["Rules", `${m.rules.toArray().length}`, m.rules.toArray().length > 0]
      ]
    ];
    let tabX = x + 16;
    const ty2 = 562;
    tabX += button("LT", tabX, ty2 + 2) + 2;
    tabs.forEach((t, i) => {
      const tw = width2(t, F.tab) + 24, on = i === tab;
      ctx.fillStyle = on ? INK : "#f1e9df";
      ctx.beginPath();
      ctx.roundRect(tabX, ty2 - 15, tw, 26, 13);
      ctx.fill();
      say(t, tabX + tw / 2, ty2 + 4, F.tab, on ? "#fff" : BODY, "center");
      tabX += tw + 6;
    });
    button("RT", tabX + 2, ty2 + 2);
    rows[tab].forEach(([label2, v2, raised], i) => {
      const cx = x + 18 + i % 2 * 206, cy = ty2 + 28 + Math.floor(i / 2) * 20;
      ctx.globalAlpha = raised ? 1 : 0.45;
      say(label2, cx, cy, F.body, BODY);
      say(v2, cx + 186, cy, F.strong, STRONG, "right");
      ctx.globalAlpha = 1;
    });
  }
  function drawPrompts() {
    let px = 24;
    for (const [bs, label2] of [[["A"], "Take"], [["B"], "Close"], [["LB", "RB"], "Jump to class"], [["LT", "RT"], "Stat tabs"], [["X"], "Kit"], [["L"], "Move"]]) {
      for (const b of bs) px += button(b, px, 704);
      say(label2, px + 6, 704, F.hint, BODY);
      px += 6 + width2(label2, F.hint) + 22;
    }
    say("Keys: arrows \xB7 Enter \xB7 Esc \xB7 Q/E \xB7 Z/C \xB7 X \xB7 Y", W - 24, 704, F.small, SECTION, "right");
  }
  function draw() {
    cv.style.display = open ? "block" : "none";
    if (!open) return;
    const dpr = devicePixelRatio, cw = innerWidth, ch = innerHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
    }
    const s = Math.min(cw / W, ch / H);
    view = { s, ox: (cw - W * s) / 2, oy: (ch - H * s) / 2 };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAGE;
    ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * view.ox, dpr * view.oy);
    if (focusId == null || !byId.has(focusId)) focusId = defaultFocus();
    const d = derive();
    drawPane(d);
    drawSheet(d);
    drawPrompts();
    cv.style.cursor = mouseNode != null && d.available(byId.get(mouseNode)) ? "pointer" : "default";
  }
  return { isOpen: () => open, toggle, key: key2, pad, draw };
}

// main.js
var DT = 1 / 60;
var VIEW_H = 16;
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();
scene.background = new THREE.Color(723723);
var camera = new THREE.OrthographicCamera();
camera.position.z = 50;
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  const half = VIEW_H * innerWidth / innerHeight / 2;
  Object.assign(camera, { left: -half, right: half, top: VIEW_H / 2, bottom: -VIEW_H / 2 });
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
var world = new_world(Math.floor(Math.random() * 2 ** 31));
window.game = { get world() {
  return world;
}, set world(w) {
  world = w;
} };
var box3 = (w, h, color, opts = {}) => new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), new THREE.MeshBasicMaterial({ color, ...opts }));
var player = box3(width, height, 16777215);
scene.add(player);
var slash = box3(1, 1, 16766287, { transparent: true, opacity: 0.55 });
slash.position.z = 1;
scene.add(slash);
var kindColor = (k) => k instanceof Boss ? 16740096 : k instanceof Charger ? 12986408 : k instanceof Shooter ? 9315498 : k instanceof Flyer ? 2541274 : k instanceof Bouncer ? 12634675 : 7162945;
var roomGroup = new THREE.Group();
var doorGroup = new THREE.Group();
scene.add(roomGroup, doorGroup);
var builtDepth = -1;
var builtLevel = null;
var builtDoors = null;
var enemyMeshes = /* @__PURE__ */ new Map();
var doorLabels = [];
var npcMeshes = [];
var npcLabels = [];
var HUB = { bg: 16512750, solid: 16777215, oneway: 15260879, edge: true };
var RUN = { bg: 723723, solid: 15263976, oneway: 7829367, edge: false };
var pal = RUN;
var edgeMat = new THREE.MeshBasicMaterial({ color: 3877669 });
function outline(m) {
  if (!pal.edge) return;
  const { width: width2, height: height2 } = m.geometry.parameters;
  const back = new THREE.Mesh(new THREE.BoxGeometry(width2 + 0.14, height2 + 0.14, 1), edgeMat);
  back.position.z = -0.05;
  m.add(back);
}
function empty2(group2) {
  group2.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material !== edgeMat) o.material.dispose();
  });
  group2.clear();
}
function syncRoom() {
  if (world.depth !== builtDepth || world.level !== builtLevel) {
    [builtDepth, builtLevel] = [world.depth, world.level];
    pal = world.depth === 0 ? HUB : RUN;
    scene.background.set(pal.bg);
    empty2(roomGroup);
    for (const r of world.level.toArray()) {
      const m = box3(r.w, r.h, r.one_way ? pal.oneway : pal.solid);
      outline(m);
      m.position.set(r.x + r.w / 2, r.y + r.h / 2, 0);
      roomGroup.add(m);
    }
    enemyMeshes = new Map(
      world.enemies.toArray().map((e) => {
        const [w, h] = size3(e.kind);
        const body2 = box3(w, h, kindColor(e.kind));
        const bar = box3(w, 0.12, 6732650);
        roomGroup.add(body2, bar);
        return [e.id, { body: body2, bar, w, h, color: kindColor(e.kind) }];
      })
    );
    npcLabels.forEach((l) => l.el.remove());
    npcMeshes = world.npcs.toArray().map((n) => {
      const b = npc_box(n), statue = n.role instanceof Statue;
      const m = box3(b.w, b.h, statue ? 16777215 : 14721563);
      outline(m);
      m.position.set(b.x + b.w / 2, b.y + b.h / 2, -0.3);
      roomGroup.add(m);
      return { m, n, statue };
    });
    npcLabels = npcMeshes.map(({ n, statue }) => {
      const el = document.createElement("div");
      el.className = "door npc";
      el.textContent = statue ? world.tree.cells.toArray()[n.role.keystone].name : "Mentor";
      document.body.appendChild(el);
      return { el, x: n.x, y: n.y + npc_box(n).h + 0.2, n };
    });
    builtDoors = null;
  }
  if (world.doors !== builtDoors) {
    builtDoors = world.doors;
    empty2(doorGroup);
    doorLabels.forEach((l) => l.el.remove());
    doorLabels = world.doors.toArray().map((d) => {
      const b = door_box(d);
      const m = box3(b.w, b.h, 5227511, { transparent: true, opacity: 0.35 });
      m.position.set(b.x + b.w / 2, b.y + b.h / 2, -0.5);
      doorGroup.add(m);
      const el = document.createElement("div");
      el.className = "door";
      el.textContent = world.depth > 0 && d.reward instanceof None ? "Back to hub" : reward_label(d.reward);
      document.body.appendChild(el);
      return { el, x: d.x, y: b.y + b.h + 0.2 };
    });
  }
}
var speech = document.createElement("div");
speech.id = "speech";
speech.className = "sticker";
document.body.appendChild(speech);
var v = new THREE.Vector3();
function toScreen(x, y) {
  v.set(x, y, 0).project(camera);
  return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
}
function pool2(color, opts) {
  const meshes = [];
  return (rects) => {
    rects.forEach((r, i) => {
      if (!meshes[i]) scene.add(meshes[i] = box3(1, 1, color, opts));
      meshes[i].visible = true;
      meshes[i].position.set(r.x + r.w / 2, r.y + r.h / 2, 1);
      meshes[i].scale.set(r.w, r.h, 1);
    });
    for (let i = rects.length; i < meshes.length; i++) meshes[i].visible = false;
  };
}
var drawShots = pool2(16740419);
var drawStrikes = pool2(16766287, { transparent: true, opacity: 0.45 });
var drawMagic = pool2(9146357);
var drawArrows = pool2(6274890);
var isMagic = (s) => s.effect instanceof Bolt || s.effect instanceof Orb;
var isArrow = (s) => s.effect instanceof Arrow;
var keys2 = /* @__PURE__ */ new Set();
var JUMP_KEYS = ["Space", "KeyK"];
var DASH_KEYS = ["ShiftLeft", "KeyL"];
var ATTACK_KEYS = ["KeyJ"];
var prevJump = false;
var prevDash = false;
var prevAttack = false;
var usingPad = false;
var pendJump = false;
var pendDash = false;
var pendAttack = false;
addEventListener("keydown", (e) => {
  usingPad = false;
  if (treeScreen.key(e)) return;
  keys2.add(e.code);
  if (!e.repeat) {
    pendJump ||= JUMP_KEYS.includes(e.code);
    pendDash ||= DASH_KEYS.includes(e.code);
    pendAttack ||= ATTACK_KEYS.includes(e.code);
    if (e.code === "KeyT" || e.code === "Tab") {
      e.preventDefault();
      treeScreen.toggle();
    }
  }
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
addEventListener("keyup", (e) => keys2.delete(e.code));
var key = (...codes) => codes.some((c) => keys2.has(c));
var dead = (v2) => Math.abs(v2) < 0.25 ? 0 : v2;
function readInput() {
  const pad = [...navigator.getGamepads()].find(Boolean);
  const btn = (...i) => !!pad && i.some((n) => pad.buttons[n]?.pressed);
  if (pad && (pad.buttons.some((b) => b.pressed) || dead(pad.axes[0] ?? 0) || dead(pad.axes[1] ?? 0))) usingPad = true;
  const mx = key("ArrowRight", "KeyD") - key("ArrowLeft", "KeyA") || btn(15) - btn(14) || dead(pad?.axes[0] ?? 0);
  const my = key("ArrowUp", "KeyW") - key("ArrowDown", "KeyS") || btn(12) - btn(13) || -dead(pad?.axes[1] ?? 0);
  const jump2 = key(...JUMP_KEYS) || btn(2, 3);
  const dash2 = key(...DASH_KEYS) || btn(4, 5, 6, 7);
  const attack = key(...ATTACK_KEYS) || btn(0);
  pendJump ||= jump2 && !prevJump;
  pendDash ||= dash2 && !prevDash;
  pendAttack ||= attack && !prevAttack;
  [prevJump, prevDash, prevAttack] = [jump2, dash2, attack];
  return { mx, my, jump: jump2 };
}
function floatText(x, y, text, cls) {
  const [sx, sy] = toScreen(x, y);
  const el = document.createElement("div");
  el.className = `float ${cls}`;
  el.textContent = text;
  el.style.left = `${sx}px`;
  el.style.top = `${sy}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}
var UNLOCK_KEY = "trip.unlocked";
function saveUnlocks() {
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(world.unlocked.toArray()));
  } catch {
  }
}
function loadUnlocks() {
  try {
    world = set_unlocked(world, toList(JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]")));
  } catch {
  }
}
loadUnlocks();
if (new URLSearchParams(location.search).has("unlock")) world = set_unlocked(world, toList([...Array(16).keys()]));
var treeScreen = createTreeScreen({ getWorld: () => world, setWorld: (w) => {
  world = w;
}, onUnlock: saveUnlocks });
var hud = document.getElementById("hud");
var HINT = {
  keys: "Move WASD \xB7 Jump Space \xB7 Dash Shift \xB7 Attack J (+up / +down in air) \xB7 Up at doors & statues \xB7 T tree",
  pad: "Move stick \xB7 Jump X / Y \xB7 Dash LB / RB \xB7 Attack A (+up / +down in air) \xB7 Up at doors & statues \xB7 Select tree"
};
var treeKey = () => usingPad ? "Select" : "T";
hud.textContent = HINT.keys;
var whoEl = document.getElementById("who");
var whereEl = document.getElementById("where");
var pointsEl = document.getElementById("points");
var hpEl = document.getElementById("hp");
var hpFill = document.getElementById("hp-fill");
var hpGhost = document.getElementById("hp-ghost");
var hpText = document.getElementById("hp-text");
var shieldsEl = document.getElementById("shields");
var vignette = document.getElementById("vignette");
var ghostHp = null;
var ghostHold = 0;
var hurtFlash = 0;
var healFlash = 0;
function onHurt() {
  vignette.classList.remove("hit");
  void vignette.offsetWidth;
  vignette.classList.add("hit");
  hurtFlash = 0.15;
  ghostHold = 0.45;
}
var xpEl = document.getElementById("xp");
var xpFill = document.getElementById("xp-fill");
var xpText = document.getElementById("xp-text");
function drawXp(p) {
  const need = xp_needed(p.lvl);
  xpFill.style.width = `${100 * p.xp / need}%`;
  xpText.textContent = `Lv ${p.lvl}   ${p.xp} / ${need} XP` + (p.points ? `   \xB7   ${p.points} tree point${p.points > 1 ? "s" : ""} (${treeKey()})` : "");
}
var bossEl = document.getElementById("boss");
var bossFill = document.getElementById("boss-fill");
function drawBossBar() {
  const b = world.enemies.toArray().find((e) => e.kind instanceof Boss && e.hp > 0);
  bossEl.style.display = b ? "block" : "none";
  if (b) bossFill.style.width = `${100 * b.hp / b.max_hp}%`;
}
var summary = document.getElementById("summary");
function showSummary(ev) {
  const m = Math.floor(ev.seconds / 60), s = Math.floor(ev.seconds % 60).toString().padStart(2, "0");
  const skills = world.player.loadout.toArray().length;
  summary.innerHTML = `<h2>Run complete</h2>
    <p>${class_name(world)} \xB7 level ${ev.level}</p>
    <p>Time ${m}:${s} \xB7 ${ev.kills} kills \xB7 ${skills} skill${skills === 1 ? "" : "s"}</p>
    <p class="dim">A door back to the hub has opened.</p>`;
  summary.style.display = "block";
}
function onLevelUp() {
  xpEl.classList.remove("up");
  void xpEl.offsetWidth;
  xpEl.classList.add("up");
}
function drawHp(p, dt) {
  const max4 = max_hp3(p);
  if (ghostHp === null || p.hp > ghostHp) ghostHp = p.hp;
  if ((ghostHold -= dt) <= 0) ghostHp = Math.max(p.hp, ghostHp - max4 * 1.5 * dt);
  hpFill.style.width = `${100 * p.hp / max4}%`;
  hpGhost.style.width = `${100 * ghostHp / max4}%`;
  hpText.textContent = `${p.hp} / ${max4}`;
  hpEl.classList.toggle("low", p.hp / max4 < 0.3);
  hpEl.classList.toggle("healed", (healFlash -= dt) > 0);
  shieldsEl.innerHTML = p.shield ? `<span class="pill teal">\u25C6 ${p.shield} shield${p.shield > 1 ? "s" : ""}</span>` : "";
}
var acc = 0;
var last2 = performance.now();
var stepMs = 0;
var frames = 0;
function frame(now) {
  const frameDt = Math.min((now - last2) / 1e3, 0.1);
  acc = Math.min(acc + (now - last2) / 1e3, 0.1);
  last2 = now;
  const { mx, my, jump: jump2 } = readInput();
  if (treeScreen.pad([...navigator.getGamepads()].find(Boolean), now)) {
    acc = 0;
    pendJump = pendDash = pendAttack = false;
  }
  while (acc >= DT) {
    const t0 = performance.now();
    world = step2(world, new Input(mx, my, jump2, pendJump, pendDash, pendAttack), DT);
    stepMs = stepMs * 0.95 + (performance.now() - t0) * 0.05;
    pendJump = pendDash = pendAttack = false;
    acc -= DT;
    for (const ev of world.events) {
      if (ev instanceof Hit) floatText(ev.x, ev.y, ev.crit ? `${ev.damage}!` : ev.damage, ev.crit ? "dmg crit" : "dmg");
      if (ev instanceof Blocked) floatText(ev.x, ev.y, "BLOCK", "lvl");
      if (ev instanceof LevelUp) onLevelUp();
      if (ev instanceof LevelUp) floatText(world.player.x, world.player.y + 2.5, `LEVEL ${ev.level}`, "lvl");
      if (ev instanceof Hurt) {
        floatText(ev.x, ev.y, `-${ev.damage}`, "hurt");
        onHurt();
      }
      if (ev instanceof Healed) {
        floatText(ev.x, ev.y, `+${ev.amount}`, "heal");
        healFlash = 0.3;
      }
      if (ev instanceof Died) floatText(world.player.x, world.player.y + 2.5, "RUN OVER", "hurt");
      if (ev instanceof EnteredRoom) {
        summary.style.display = "none";
        if (ev.depth > 0) floatText(world.player.x, world.player.y + 2.5, ev.depth === boss_depth ? "BOSS" : `DEPTH ${ev.depth}`, ev.depth === boss_depth ? "hurt" : "lvl");
      }
      if (ev instanceof RunComplete) showSummary(ev);
      if (ev instanceof GateShut) floatText(world.safe_x - 1, 3.6, "the gate shuts", "npc");
      if (ev instanceof Unlocked) {
        floatText(world.player.x, world.player.y + 3, `UNLOCKED ${ev.name}`, "lvl");
        saveUnlocks();
      }
      if (ev instanceof Rewarded) floatText(world.player.x, world.player.y + 2.5, ev.label, "lvl");
      if (ev instanceof Said) floatText(world.player.x, world.player.y + 2.5, ev.text, "lvl");
    }
  }
  syncRoom();
  const p = world.player;
  player.position.set(p.x, p.y + height / 2, 0);
  hurtFlash -= frameDt;
  player.material.color.set(hurtFlash > 0 ? 16717636 : p.dash_time > 0 ? 16777215 : p.dashes > 0 ? 5227511 : 2781071);
  drawHp(p, frameDt);
  drawXp(p);
  drawBossBar();
  player.visible = p.invuln <= 0 || Math.floor(now / 60) % 2 === 0;
  const hb = active_hitbox(p);
  slash.visible = hb instanceof Some;
  if (slash.visible) {
    const r = hb[0];
    slash.position.set(r.x + r.w / 2, r.y + r.h / 2, 1);
    slash.scale.set(r.w, r.h, 1);
  }
  for (const e of world.enemies) {
    if (!enemyMeshes.has(e.id)) {
      builtLevel = null;
      continue;
    }
    const { body: body2, bar, w, h, color } = enemyMeshes.get(e.id);
    body2.visible = bar.visible = e.hp > 0;
    body2.position.set(e.x, e.y + h / 2, 0);
    const tell = telegraphing(e) && Math.floor(now / 50) % 2 === 0;
    body2.material.color.set(e.flash > 0 ? 16777215 : tell ? 16771899 : color);
    if (!e.awake) body2.material.color.multiplyScalar(0.45);
    const frac = e.hp / e.max_hp;
    bar.scale.x = Math.max(frac, 1e-3);
    bar.position.set(e.x - w * (1 - frac) / 2, e.y + h + 0.3, 0);
  }
  drawShots(world.projectiles.toArray().map((s) => ({ x: s.x - shot_size / 2, y: s.y - shot_size / 2, w: shot_size, h: shot_size })));
  const strikes = world.strikes.toArray(), boxes = (keep) => strikes.filter(keep).map((s) => strike_box(s, p.x, p.y));
  drawStrikes(boxes((s) => !isMagic(s) && !isArrow(s)));
  drawMagic(boxes(isMagic));
  drawArrows(boxes(isArrow));
  camera.position.x += (p.x - camera.position.x) * 0.15;
  camera.position.y += (p.y + 3 - camera.position.y) * 0.15;
  renderer.render(scene, camera);
  const unlockedNow = new Set(world.unlocked.toArray());
  const mine = world.player.class instanceof Some ? world.player.class[0] : -1;
  for (const { m, n, statue } of npcMeshes) {
    if (!statue) continue;
    const k = n.role.keystone;
    m.material.color.set(k === mine ? 14721563 : unlockedNow.has(k) ? 16777215 : 13616829);
  }
  for (const l of npcLabels) {
    const [sx, sy] = toScreen(l.x, l.y);
    l.el.style.left = `${sx}px`;
    l.el.style.top = `${sy}px`;
  }
  const near = near_npc(world);
  speech.style.display = near.isOk() ? "block" : "none";
  if (near.isOk()) {
    const lines = npc_lines(world, near[0]).toArray();
    speech.innerHTML = `<b>${lines[0]}</b>` + lines.slice(1).map((l) => `<p>${l}</p>`).join("");
    const [sx, sy] = toScreen(near[0].x, near[0].y + npc_box(near[0]).h + 1.2);
    speech.style.left = `${sx}px`;
    speech.style.top = `${sy}px`;
  }
  for (const l of doorLabels) {
    const [sx, sy] = toScreen(l.x, l.y);
    l.el.style.left = `${sx}px`;
    l.el.style.top = `${sy}px`;
  }
  if (++frames % 15 === 0) {
    hud.textContent = usingPad ? HINT.pad : HINT.keys;
    whoEl.textContent = class_name(world) === "No class" ? "No class yet" : class_name(world);
    const boss2 = world.depth === boss_depth, cleared = world.cleared && world.depth > 0;
    whereEl.textContent = world.depth === 0 ? "Hub" : boss2 ? "Boss" : `Room ${world.depth} / ${boss_depth - 1}`;
    if (cleared) whereEl.textContent += " \xB7 cleared";
    whereEl.className = boss2 ? "boss" : cleared ? "cleared" : "";
    pointsEl.innerHTML = p.points ? `<span class="pill gold">${p.points} point${p.points > 1 ? "s" : ""} \xB7 ${treeKey()}</span>` : "";
  }
  treeScreen.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
