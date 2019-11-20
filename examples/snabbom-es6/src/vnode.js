export function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    // 仅仅返回了一个描述dom节点的对象，即 虚拟dom节点
    return { sel: sel, data: data, children: children, text: text, elm: elm, key: key };
}
export default vnode;
