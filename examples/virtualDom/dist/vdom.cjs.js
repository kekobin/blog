'use strict';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var Element =
/*#__PURE__*/
function () {
  function Element(tagName, props, children) {
    _classCallCheck(this, Element);

    this.tagName = tagName;
    this.props = props;
    this.children = children;
    this.key = props ? props.key : undefined;

    if (props instanceof Array) {
      this.children = props;
      this.props = {};
    }
    /*
     * 设置当前元素子节点及所有子孙节点的节点个数，据此就可以标记每一个节点的索引了
     * 如：
     *			0
     *		1		4	
     *
     *	2	3			5
     *
     * 要计算节点4的索引，可由节点1有两个子节点，所以节点4的索引 index_4 = 当前索引数(1) + 同级左侧节点所有子节点个数 + 节点4本身(1)
     *
    */


    var allChildNodes = 0;
    children.forEach(function (ch) {
      // 如果ch是Element实例，则获取它上面的所有子节点个数
      if (ch instanceof Element) {
        allChildNodes += ch.allChildNodes;
      } // 然后统一加上ch节点本身，即加1即可


      allChildNodes++;
    }); // 设置到每个节点元素上

    this.allChildNodes = allChildNodes;
  } // 渲染得到实例的js描述，也可视为是js dom 树(AST)


  _createClass(Element, [{
    key: "render",
    value: function render() {
      // 创建元素标签
      var el = document.createElement(this.tagName);
      var children = this.children,
          props = this.props; // 赋上元素属性

      for (var k in props) {
        el.setAttribute(k, props[k]);
      } // 渲染子元素，并赋给 父元素 el


      children.forEach(function (ch) {
        // 如果是Element实例，则调用对应的render方法得到它本身的el js描述，否则视为文本节点
        var child = ch instanceof Element ? ch.render() : document.createTextNode(ch);
        el.appendChild(child);
      }); // 返回当前Element实例的el

      return el;
    }
  }]);

  return Element;
}();

function el(tagName, props, children) {
  return new Element(tagName, props, children);
}

/**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @return {Object} - {moves: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 */
function diff (oldList, newList, key) {
  var oldMap = makeKeyIndexAndFree(oldList, key);
  var newMap = makeKeyIndexAndFree(newList, key);

  var newFree = newMap.free;

  var oldKeyIndex = oldMap.keyIndex;
  var newKeyIndex = newMap.keyIndex;

  var moves = [];

  // a simulate list to manipulate
  var children = [];
  var i = 0;
  var item;
  var itemKey;
  var freeIndex = 0;

  // fist pass to check item in old list: if it's removed or not
  while (i < oldList.length) {
    item = oldList[i];
    itemKey = getItemKey(item, key);
    if (itemKey) {
      if (!newKeyIndex.hasOwnProperty(itemKey)) {
        children.push(null);
      } else {
        var newItemIndex = newKeyIndex[itemKey];
        children.push(newList[newItemIndex]);
      }
    } else {
      var freeItem = newFree[freeIndex++];
      children.push(freeItem || null);
    }
    i++;
  }

  var simulateList = children.slice(0);

  // remove items no longer exist
  i = 0;
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i);
      removeSimulate(i);
    } else {
      i++;
    }
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  var j = i = 0;
  while (i < newList.length) {
    item = newList[i];
    itemKey = getItemKey(item, key);

    var simulateItem = simulateList[j];
    var simulateItemKey = getItemKey(simulateItem, key);

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        j++;
      } else {
        // new item, just inesrt it
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item);
        } else {
          // if remove current simulateItem make item in right place
          // then just remove it
          var nextItemKey = getItemKey(simulateList[j + 1], key);
          if (nextItemKey === itemKey) {
            remove(i);
            removeSimulate(j);
            j++; // after removing, current j is right, just jump to next one
          } else {
            // else insert item
            insert(i, item);
          }
        }
      }
    } else {
      insert(i, item);
    }

    i++;
  }

  function remove (index) {
    var move = {index: index, type: 0};
    moves.push(move);
  }

  function insert (index, item) {
    var move = {index: index, item: item, type: 1};
    moves.push(move);
  }

  function removeSimulate (index) {
    simulateList.splice(index, 1);
  }

  return {
    moves: moves,
    children: children
  }
}

/**
 * Convert list to key-item keyIndex object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKeyIndexAndFree (list, key) {
  var keyIndex = {};
  var free = [];
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    var itemKey = getItemKey(item, key);
    if (itemKey) {
      keyIndex[itemKey] = i;
    } else {
      free.push(item);
    }
  }
  return {
    keyIndex: keyIndex,
    free: free
  }
}

function getItemKey (item, key) {
  if (!item || !key) return void 666
  return typeof key === 'string'
    ? item[key]
    : key(item)
}

var makeKeyIndexAndFree_1 = makeKeyIndexAndFree; // exports for test
var diff_2 = diff;

var diff_1 = {
	makeKeyIndexAndFree: makeKeyIndexAndFree_1,
	diff: diff_2
};

var listDiff2 = diff_1.diff;

var DF_TYPES = {
  REPLACE: 0,
  // 替换原先的节点
  REORDER: 1,
  // 重新排序
  PROPS: 2,
  // 修改了节点的属性
  TEXT: 3 // 文本内容改变 

};
function diff$1(oldTree, newTree) {
  // 当前节点索引
  var index = 0;
  /**
   * 存储差异的容器
   * {
   *	 节点index : [
   *		{
   *			type: 差异类型,
   *			content: 差异内容
   *		}
   *	 ]
   * }
   */

  var patches = {};
  dfsNodeCompare(oldTree, newTree, index, patches);
  return patches;
} // 深度优先比对树节点
// 总体策略： 只比较同级节点，跨级别的舍去

function dfsNodeCompare(oldNode, newNode, index, patches) {
  // 缓存当前树节点差异对象(节点的差异可以是多种的，所以是数组)
  var currentNodeDf = []; // 策略一: 当前的节点都是字符串，表示都是textNode

  if (typeof oldNode === 'string' && typeof newNode === 'string') {
    if (newNode !== oldNode) {
      currentNodeDf.push({
        type: DF_TYPES.TEXT,
        content: newNode
      });
    }
  } // 策略二： 当前节点元素标签相同，并且key相同(代表是同一个元素),则比较props和children
  else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
      var propsDfs = compareProps(oldNode.props, newNode.props);

      if (propsDfs.length > 0) {
        currentNodeDf.push({
          type: DF_TYPES.PROPS,
          props: propsDfs
        });
      } // 比较子节点异同
      // 这里之所以把index和patches传进去，好处是孩纸也是一个个节点，可能会递归调用dfsNodeCompare，
      // 传进去index和patches就能够直接将对应索引index的差异存到patches，降低要回到当前作用域再进行处理的复杂性


      diffChildren(oldNode.children, newNode.children, index, patches, currentNodeDf);
    } else {
      // 策略三： 节点元素标签都不同，说明是节点替换了
      currentNodeDf.push({
        type: DF_TYPES.REPLACE,
        node: newNode
      });
    } // 当前节点比对完后，判断currentNodeDf是否有值，有则存到patches中


  if (currentNodeDf.length > 0) {
    // 代表节点index发生了currentNodeDf表示的差异
    patches[index] = currentNodeDf;
  }
}

function diffChildren(oldChildren, newChildren, index, patches, currentNodeDf) {
  // 正常来说，这里应该是遍历子节点，然后对一个个的新旧节点应用dfsNodeCompare进行递归比对，
  // 只是这里有个特殊情况：万一新旧节点只是位置移动了，还是一个个对比的话，可能相同的节点要先删除再新增，白白损耗了性能。所以要优先处理这种情况，提高性能
  // 判断列表是否有元素移动的算法比较复杂，这里使用开源的list-diff进行处理
  // 注意: 使用list-diff的前提是，你需要在列表item中设置明确的key属性，否则它也检索不出是否移动
  // 移动的处理是 删除、插入
  // `moves` is a sequence of actions (remove or insert): type 0 is removing, type 1 is inserting
  var diffs = listDiff2(oldChildren, newChildren, 'key'); // 这里也特别的有意思: 
  // 如果diffs.moves有值，表示是移动，则diffs.children为oldChildren节点内容(但属性等应该还是newChildren本身对应的)，这样就可以避开后面对新旧节点内容不同情况下的比对，因为只是移动，最多后面还需要比较下属性而已
  // 如果diffs.moves无值，表示不是移动，则diffs.children为newChildren本身

  newChildren = diffs.children;

  if (diffs.moves.length) {
    var reorderPatch = {
      type: DF_TYPES.REORDER,
      moves: diffs.moves
    };
    currentNodeDf.push(reorderPatch); // 这里没有用return拦截，而是继续执行下面的逻辑，是因为虽然上面移动了，移动后的节点本身及其子节点还是会有变动的，所以下面也得继续比对
  } // 遍历children
  // 当前索引指向index


  var currentNodeIndex = index; // 设置左侧节点，通过它本身的所有子节点数allChildNodes来计算下一个同级节点的索引

  var leftNode = null;
  oldChildren.forEach(function (och, i) {
    var nch = newChildren[i];
    /**
     * 当前节点都处在同一层级，每遍历出一个，计算它的索引
     * 这里需要根据leftNode是否存在分两种情况
     * (1) 左侧没有同级节点
     * currentNodeIndex + 1(当前本身的节点个数)
     * 
     * (2) 左侧有同级节点 (即在上面的基础上，再加上左侧同级节点的所有子节点个数)
     * currentNodeIndex + 1 + leftNode.allChildNodes
     *
     */

    var baseIndexCount = currentNodeIndex + 1;
    currentNodeIndex = leftNode && leftNode.allChildNodes ? baseIndexCount + leftNode.allChildNodes : baseIndexCount;
    dfsNodeCompare(och, nch, currentNodeIndex, patches); // 重置leftNode

    leftNode = och;
  });
} // 策略： 新节点属性中有且不相同的，或者旧属性中不存在的


function compareProps(oldProps, newProps) {
  var currentPropsDf = []; // 新节点属性在旧节点中有，且不相同的

  for (var i in oldProps) {
    var oldValue = oldProps[i];

    if (newProps[i] && newProps[i] !== oldValue) {
      currentPropsDf.push({
        k: i,
        v: newProps[i]
      });
    }
  } // 旧属性中不存在的


  for (var _i in newProps) {
    if (!oldProps[_i]) {
      currentPropsDf.push({
        k: _i,
        v: newProps[_i]
      });
    }
  }

  return currentPropsDf;
}

// 差异类型
var DF_TYPES$1 = {
  REPLACE: 0,
  // 替换原先的节点
  REORDER: 1,
  // 重新排序
  PROPS: 2,
  // 修改了节点的属性
  TEXT: 3 // 文本内容改变 

};
function patch(node, patches) {
  // 定义一个监控指针，时刻指向每个节点的索引
  var watcher = {
    index: 0
  };
  dfsWalk(node, watcher, patches);
} // 深度遍历节点，检索每个节点是否匹配patches中的差异，如果有则根据对应的差异类型进行变更

function dfsWalk(node, watcher, patches) {
  var diffArr = patches[watcher.index]; // 如果有，去应用差异进行变更

  if (diffArr && diffArr.length > 0) {
    applyPatches(node, diffArr);
  } // 当前节点检索完了，遍历其子节点情况


  var childNodes = node.childNodes;
  childNodes.forEach(function (child) {
    // 这里需要知道的是: html解析dom树也是按照类似dfs深度遍历算法去解析和渲染的，
    // 所以可以直接根据子节点数加1就是对应节点的索引
    watcher.index += 1;
    dfsWalk(child, watcher, patches);
  });
}

function applyPatches(node, diffArr) {
  for (var i = 0; i < diffArr.length; i++) {
    var cp = diffArr[i];
    var type = cp.type;

    switch (type) {
      case DF_TYPES$1.REPLACE:
        // 这里分两种情况，一种要替换的是节点是字符串，则创建文本节点进行替换，否则视为Element实例节点
        var newNode = typeof cp.node === 'string' ? document.createTextNode(cp.node) : cp.node.render();
        node.parentNode.replaceChild(newNode, node);
        break;

      case DF_TYPES$1.REORDER:
        reorderChildren(node, cp.moves);
        break;

      case DF_TYPES$1.PROPS:
        resetProps(node, cp.props);
        break;

      case DF_TYPES$1.TEXT:
        var content = cp.content;

        if (node.textContent) {
          node.textContent = content;
        } else {
          // for ie browser
          node.nodeValue = content;
        }

        break;

      default:
        throw Error("Unknow patch type ".concat(type));
    }
  }
}

function resetProps(node, props) {
  props.forEach(function (prop) {
    node.setAttribute(prop.k, prop.v);
  });
}

function reorderChildren(node, moves) {
  // 所谓的reorder并不是重新排序，而是针对位置变动，进行删除(removing)和插入(inserting)
  // 而移动的对象节点，都是node的子节点
  // 先获取node子节点，并序列化成array
  var staticNodeList = _toConsumableArray(node.childNodes); // 用于存储staticNodeList中节点的key和对应节点映射


  var maps = {}; // 检索出设有key的节点，并使用map存储其key-node映射

  staticNodeList.forEach(function (n) {
    // 只存元素的key
    if (n.nodeType === 1) {
      var key = n.getAttribute('key');

      if (key) {
        maps[key] = n;
      }
    }
  }); // 根据moves里的对象类型，分别处理对应节点是删除还是插入

  moves.forEach(function (move) {
    var type = move.type,
        index = move.index,
        item = move.item;

    if (type === 0) {
      // removing
      node.removeChild(node.childNodes[index]);
    } else {
      // inserting
      var insertNode = maps[item.key] ? maps[item.key].cloneNode(true) : _typeof(item) === 'object' ? item.render() : document.createTextNode(item);
      node.insertBefore(insertNode, node.childNodes[index] || null);
    }
  });
} // // list-diff2 示例
// var diff = require("list-diff2")
// var oldList = [{id: "a"}, {id: "b"}, {id: "c"}, {id: "d"}, {id: "e"}]
// // 只更改 位置 0和4
// var newList = [{id: "n"}, {id: "b"}, {id: "c"}, {id: "d"}, {id: "f"}]
// var moves = diff(oldList, newList, "id")
// console.log(moves)
// /*
// { moves:
// 	// 这里比较有讲究了，先把删除的都放前面，插入的都放后面。而且，所有的索引index都是前一个删除或者添加之后的索引，也就是说到这里已经给你算清楚下一步需要的索引了
//    [ { index: 0, type: 0 },
//      { index: 3, type: 0 },
//      { index: 0, item: [Object], type: 1 },
//      { index: 4, item: [Object], type: 1 } ],
//   // 这里可以看出只是把被删除的位置置为了null
//   children: [ null, { id: 'b' }, { id: 'c' }, { id: 'd' }, null ] 
// }
// */
// moves.moves.forEach(function(move) {
//   if (move.type === 0) {
//     oldList.splice(move.index, 1) // type 0 is removing
//     console.log('-------------removing-----------', move.index)
//     console.log(oldList)
//   } else {
//     oldList.splice(move.index, 0, move.item) // type 1 is inserting
//     console.log('-------------inserting-----------', move.index)
//     console.log(oldList)
//   }
// })
// // 得到结果
// // -------------removing----------- 0                            
// // [ { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' } ]                   (1)
// // -------------removing----------- 3 (这里的3是在上面(1)删除位置4后的第三个，即{ id: 'e' })
// // [ { id: 'b' }, { id: 'c' }, { id: 'd' } ]                                (2)
// // -------------inserting----------- 0 (这里的0，是(2)中的第0个位置插入)
// // [ { id: 'n' }, { id: 'b' }, { id: 'c' }, { id: 'd' } ]                   (3)
// // -------------inserting----------- 4 (这里的4，是(3)中的第4个位置插入)
// // [ { id: 'n' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'f' } ]      (4)

var index = {
  el: el,
  diff: diff$1,
  patch: patch
};

module.exports = index;
