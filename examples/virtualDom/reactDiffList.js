// react原版实现

var diff = function(oldList, newList) {
    var changes = [];
    // 访问过的之前children表最大的index
    var lastIndex = 0;
    // 上一个放好的节点，用来做 增/移
    var lastPlacedNode = null;

    // 遍历新的，找出 增/移
    newList.forEach(function(item, i) {
        var index = oldList.indexOf(item);
        if (index === -1) {
            // 增
            changes.push({
                type: 'insert',
                item: item,
                afterNode: lastPlacedNode
            });
        }
        else {
            // lastIndex滤掉相对位置没变的 移
            if (index < lastIndex) {
                // 移
                var step = {
                    type: 'move',
                    item: item,
                    afterNode: lastPlacedNode
                };
                changes.push(step);
            }
            lastIndex = Math.max(index, lastIndex);
        }
        lastPlacedNode = item;
    });

    // 遍历旧的，找出 删
    oldList.forEach(function(item, i) {
        if (newList.indexOf(item) === -1) {
            changes.push({
                type: 'remove',
                index: i
            });
        }
    });

    return changes;
};

// test
var move = function(list, from, to) {
    var item = list.splice(from, 1);
    if (from > to)
        list.splice(to + 1, 0, item[0]);
    else
        list.splice(to, 0, item[0]);
};
var insertAfter = function(list, item, index) {
    list.splice(index + 1, 0, item);
};
var showSteps = function(changes) {
    // 留一份，针对 移 用来查以前的位置
    var _oldList = oldList.slice();
    // 针对 增 移 和 删，模拟DOM操作需要知道patching中，旧元素的当前index
    // 实际做DOM patch的时候不需要，因为找到元素后DOM API不需要index就能 增 移 删
    var patchingIndex = -1;
    changes.forEach(function(change) {
        switch (change.type) {
            case 'insert':
                console.log('insert ' + change.item + ' after ' + change.afterNode);
                patchingIndex = oldList.indexOf(change.afterNode);
                insertAfter(oldList, change.item, patchingIndex);
                break;
            case 'remove':
                console.log('remove ' + _oldList[change.index]);
                patchingIndex = oldList.indexOf(_oldList[change.index]);
                oldList.splice(patchingIndex, 1);
                break;
            case 'move':
                console.log('move ' + change.item + ' to pos after ' + change.afterNode);
                patchingIndex = oldList.indexOf(change.afterNode);
                move(oldList, oldList.indexOf(change.item), patchingIndex);
                break;
            default:
                cosole.error('not here');
                break;
        }
        console.log(oldList);
    });
};
var oldList = [1, 2, 3, 7, 4];
var newList = [1, 4, 5, 3, 7, 6];
// var oldList = [1, 3, 7, 8];
// var newList = [8, 3, 7, 1];
var changes = diff(oldList, newList);
showSteps(changes);