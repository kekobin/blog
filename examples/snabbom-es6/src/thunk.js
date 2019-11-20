import { h } from './h';

// 将 vnode 上的数据拷贝到 thunk 上，在 patchVnode 中会进行判断，如果相同会结束 patchVnode
// 并将 thunk 的 fn 和 args 属性保存到 vnode 上，在 prepatch 时需要进行比较
function copyToThunk(vnode, thunk) {
    thunk.elm = vnode.elm;
    vnode.data.fn = thunk.data.fn;
    vnode.data.args = thunk.data.args;
    thunk.data = vnode.data;
    thunk.children = vnode.children;
    thunk.text = vnode.text;
    thunk.elm = vnode.elm;
}
function init(thunk) {
    var cur = thunk.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunk);
}
function prepatch(oldVnode, thunk) {
    var i, old = oldVnode.data, cur = thunk.data;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        // 如果 fn 不同或 args 长度不同，说明发生了变化，调用 fn 生成新的 vnode 并返回
        copyToThunk(cur.fn.apply(undefined, args), thunk);
        return;
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            // 如果每个参数发生变化，逻辑同上
            copyToThunk(cur.fn.apply(undefined, args), thunk);
            return;
        }
    }
    copyToThunk(oldVnode, thunk);
}
export var thunk = function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    // 使用 h 函数返回 vnode，为其添加 init 和 prepatch 钩子
    return h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args
    });
};
export default thunk;
//# sourceMappingURL=thunk.js.map