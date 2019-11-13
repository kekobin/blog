// 差异类型
const DF_TYPES = {
	REPLACE: 0, // 替换原先的节点
	REORDER: 1, // 重新排序
	PROPS: 2, // 修改了节点的属性
	TEXT: 3 // 文本内容改变 
}

export default function patch(node, patches) {
	// 定义一个监控指针，时刻指向每个节点的索引
	const watcher = { index: 0 }
	dfsWalk(node, watcher, patches)
}

// 深度遍历节点，检索每个节点是否匹配patches中的差异，如果有则根据对应的差异类型进行变更
function dfsWalk(node, watcher, patches) {
	const diffArr = patches[watcher.index]

	// 如果有，去应用差异进行变更
	if (diffArr && diffArr.length > 0) {
		applyPatches(node, diffArr)
	}

	// 当前节点检索完了，遍历其子节点情况
	const { childNodes } = node 
	childNodes.forEach(child => {
		// 这里需要知道的是: html解析dom树也是按照类似dfs深度遍历算法去解析和渲染的，
		// 所以可以直接根据子节点数加1就是对应节点的索引
		watcher.index += 1
		dfsWalk(child, watcher, patches)
	})
}

function applyPatches(node, diffArr) {
	for(let i=0; i< diffArr.length; i++) {
		const cp = diffArr[i]
		const { type } = cp 

		switch(type) {
			case DF_TYPES.REPLACE:
				// 这里分两种情况，一种要替换的是节点是字符串，则创建文本节点进行替换，否则视为Element实例节点
				const newNode = typeof cp.node === 'string' ? document.createTextNode(cp.node) : cp.node.render()
				node.parentNode.replaceChild(newNode, node)
				break
			case DF_TYPES.REORDER: 
				reorderChildren(node, cp.moves)
				break
			case DF_TYPES.PROPS: 
				resetProps(node, cp.props)
				break
			case DF_TYPES.TEXT: 
				const { content } = cp
				if (node.textContent) {
					node.textContent = content
				} else { // for ie browser
					node.nodeValue = content
				}
				break
			default: 
				throw Error(`Unknow patch type ${type}`)
		}
	}
}

function resetProps(node, props) {
	props.forEach(prop => {
		node.setAttribute(prop.k, prop.v)
	})
}

function reorderChildren(node, moves) {
	// 所谓的reorder并不是重新排序，而是针对位置变动，进行删除(removing)和插入(inserting)
	// 而移动的对象节点，都是node的子节点

	// 先获取node子节点，并序列化成array
	const staticNodeList = [ ...node.childNodes ]
	// 用于存储staticNodeList中节点的key和对应节点映射
	const maps = {}
	// 检索出设有key的节点，并使用map存储其key-node映射,之所以要做这一步，是因为moves中的item只会存元素的key，并不会存节点元素，
  // 座椅下面遍历moves时，需要根据映射关系获取到key对应的元素节点
	staticNodeList.forEach(n => {
		// 只存元素的key
		if (n.nodeType === 1) {
			const key = n.getAttribute('key')

			if (key) {
				maps[key] = n
			}
		}
	})

	// 根据moves里的对象类型，分别处理对应节点是删除还是插入
	moves.forEach(move => {
		const { type, index, item } = move

		if (type === 0) { // removing
			node.removeChild(node.childNodes[index])
		} else { // inserting
			const insertNode = maps[item.key]
				? maps[item.key].cloneNode(true)
				: (typeof item === 'object' ? item.render() : document.createTextNode(item))

			node.insertBefore(insertNode, node.childNodes[index] || null)
		}
	})
}

// // list-diff2 示例
// var diff = require("list-diff2")
// var oldList = [{id: "a"}, {id: "b"}, {id: "c"}, {id: "d"}, {id: "e"}]
// // 只更改 位置 0和4
// var newList = [{id: "n"}, {id: "b"}, {id: "c"}, {id: "d"}, {id: "f"}]
// 根据id属性进行差异比对
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

