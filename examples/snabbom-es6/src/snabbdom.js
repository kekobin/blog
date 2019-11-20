import vnode from './vnode';
import * as is from './is';
import htmlDomApi from './htmldomapi';
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
var emptyNode = vnode('', {}, [], undefined, undefined);
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
export { h } from './h';
export { thunk } from './thunk';
export function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmlDomApi;

    // 使用策略模式初始化预先设置的hooks表，得到
    // cbs['create'] = [func1, func2...]、cbs['update'] = [func1, func2...] ...
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                data = vnode.data;
            }
        }
        var children = vnode.children, sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (j = 0; j < vnode.children.length; ++j) {
                    i = vnode.children[j];
                    if (i != null && typeof i !== "string") {
                        invokeDestroyHook(i);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    // 调用 destory hook
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else { // Text node
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0, newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;

        // 使用了四个指针oldStartIdx、oldEndIdx、newStartIdx、newEndIdx，在新旧children开始和结束往中间一步步遍历对比
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            // 首先判断几种边界情况

            // condition 1
            // oldStartVnode为空，则oldStartIdx加一位
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            // condition 2
            // oldEndVnode为空，则oldEndIdx减一位
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            // condition 3
            // newStartVnode为空，则newStartIdx加一位
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            // condition 4
            // newEndVnode为空，则newEndIdx减一位
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            // condition 5
            // oldStartVnode, newStartVnode节点相同，则直接比对它们的差异
            // 注意，这种情况 oldStartIdx 和 newStartIdx是相同的，即它们是相同位置节点，没有发生移动
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                // 对应的索引均加一位
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            // condition 6
            // 同上
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                // 对应的索引均减一位
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            // condition 7
            // oldStartVnode, newEndVnode节点相同，说明位置发生了移动，不仅要比对变化，还需要移动位置
            else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                // 这里讲oldStartVnode.elm移动到了oldEndVnode.elm后面
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                // 这里比较容易引起疑惑，dom移动后，后面的会自动填充到前面移走的位置，也就是说自动的重新排好了序，那这里干嘛还要自增自减
                // 因为这里是dom的快照，是虚拟node节点的索引，它们是需要手动维护的
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            // condition 8
            // 同上
            else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                // 排除上面的几种边界情况后，那就是需要判断在孩纸去头去尾的中间还是否有相同的新旧节点
                // 这里利用的是节点身上的key属性，即新旧节点，只要key相同，那么大概率就是相同的节点

                // 所以，首先获取oldCh的所有含有key属性的 key-index 映射对象 oldKeyToIdx
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                // 然后，尝试判断 新节点的key 是否存在与oldKeyToIdx中
                idxInOld = oldKeyToIdx[newStartVnode.key];

                // condition 9
                // 不存在，则肯定是新节点，需要把它插入到 oldStartVnode.elm 前面
                if (isUndef(idxInOld)) { // New element
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                
                else {
                    // 若存在，说明是相同节点，则获取到索引 idxInOld 对应的旧节点
                    elmToMove = oldCh[idxInOld];

                    // condition 10
                    // 然后还需要判断其sel，即元素标签等是否相同
                    // 不同，说明还是新节点，同上插入
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    // condition 11
                    else {
                        // 相同，说明是同一个节点，比对差异
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        // 然后需要在虚拟节点队列中 把 旧节点置灰，并移动到当前索引的节点oldStartVnode前面
                        // 这里要把 oldCh[idxInOld] 置灰，是因为它已经被移动了，在后面的遍历中，不需要再进行遍历处理
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        // 这里是另一种边界处理：旧节点先遍历完，或者新节点先遍历完。因为可能新旧节点数是不一样的(这是很大可能存在的)
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            // condition 12
            // 旧节点先遍历完，说明还有新节点没遍历到，即要添加
            if (oldStartIdx > oldEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                // 添加剩下的所有未遍历到的新节点
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            // condition 13
            else {
                // 新节点先遍历完，说明还有旧节点没遍历到，即要删除
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        // vnode.data.hook.prepatch存在，则执行propatch钩子
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        var elm = vnode.elm = oldVnode.elm;
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        if (oldVnode === vnode) return;
        if (vnode.data !== undefined) {
            // 执行所有modules的update钩子函数(例如，oldVnode和vnode的props变化了，则这里就会将变化更新到对应的elm上)
            // 这样的好处时，预存的钩子中，只要这里新旧节点对应的模块改变了就会更新，不用额外去处理，也不用通过if else判断哪个模块更新了
            for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
        }
        // 根据vnode.text是否存在分两种情况比对
        // 1. vnode.text不存在
        if (isUndef(vnode.text)) {
            // 新旧节点孩纸都存在，如果还不同，则比对更新孩纸
            if (isDef(oldCh) && isDef(ch)) {
                if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            // 如果旧孩纸不存在，新孩纸存在，说明是新增孩纸，需要把旧节点的text去掉，并添加新孩纸
            else if (isDef(ch)) {
                if (isDef(oldVnode.text)) api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            // 如果新孩纸不存在，旧孩纸存在，说明是删除了孩纸，需要把就孩纸干掉
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 新旧孩纸都不存在，那就是text的比对了，需要把旧节点的text干掉
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        // 2. vnode.text存在，说明新节点只设置了text
        else if (oldVnode.text !== vnode.text) {
            // 此时，如果就孩纸存在，则需要一个个干掉
            if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 然后换上vnode.text
            api.setTextContent(elm, vnode.text);
        }
        // postpatch钩子执行
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        var insertedVnodeQueue = [];
        // 执行pre钩子
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        // 如果旧节点不是Vnode，则将其转为Vnode，因为后面的比对都针对统一的Vnode虚拟节点来的
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        // 相同的vnode节点，则开始节点比对
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        // 不相同的，说明是新的节点
        else {
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            // 创建该节点实际的Dom
            createElm(vnode, insertedVnodeQueue);
            if (parent !== null) {
                // 插入到旧节点元素后面，然后删除掉旧元素
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                // 之所以要删除旧节点，是因为这里相当于是根节点都不一样，那么整棵树都要替换
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        // 执行cbs.post钩子
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        // 返回新节点
        return vnode;
    };
}