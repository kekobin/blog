import listDiff from 'list-diff2'

// 差异类型
const DF_TYPES = {
	REPLACE: 0, // 替换原先的节点
	REORDER: 1, // 重新排序
	PROPS: 2, // 修改了节点的属性
	TEXT: 3 // 文本内容改变 
}

export default function diff(oldTree, newTree) {
	// 当前节点索引
	let index = 0;
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
	const patches = {};
	dfsNodeCompare(oldTree, newTree, index, patches)
	return patches	
}

// 深度优先比对树节点
// 总体策略： 只比较同级节点，跨级别的舍去
function dfsNodeCompare(oldNode, newNode, index, patches) {
	// 缓存当前树节点差异对象(节点的差异可以是多种的，所以是数组)
	const currentNodeDf = []

	// 策略一: 当前的节点都是字符串，表示都是textNode
	if (typeof oldNode === 'string' && typeof newNode === 'string') {
		if (newNode !== oldNode) {
			currentNodeDf.push({ type: DF_TYPES.TEXT, content: newNode })
		}
	}
	// 策略二： 当前节点元素标签相同，并且key相同(代表是同一个元素),则比较props和children
	else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
		const propsDfs = compareProps(oldNode.props, newNode.props)

		if (propsDfs.length > 0) {
			currentNodeDf.push({ type: DF_TYPES.PROPS, props: propsDfs })
		}

		// 比较子节点异同
		// 这里之所以把index和patches传进去，好处是孩纸也是一个个节点，可能会递归调用dfsNodeCompare，
		// 传进去index和patches就能够直接将对应索引index的差异存到patches，降低要回到当前作用域再进行处理的复杂性
		diffChildren(oldNode.children, newNode.children, index, patches, currentNodeDf)
	} else {
		// 策略三： 节点元素标签都不同，说明是节点替换了
		currentNodeDf.push({ type: DF_TYPES.REPLACE, node: newNode })
	}

	// 当前节点比对完后，判断currentNodeDf是否有值，有则存到patches中
	if (currentNodeDf.length > 0) {
		// 代表节点index发生了currentNodeDf表示的差异
		patches[index] = currentNodeDf
	}
}

function diffChildren(oldChildren, newChildren, index, patches, currentNodeDf) {
	// 正常来说，这里应该是遍历子节点，然后对一个个的新旧节点应用dfsNodeCompare进行递归比对，
	// 只是这里有个特殊情况：万一新旧节点只是位置移动了，还是一个个对比的话，可能相同的节点要先删除再新增，白白损耗了性能。所以要优先处理这种情况，提高性能

	// 判断列表是否有元素移动的算法比较复杂，这里使用开源的list-diff进行处理
	// 注意: 使用list-diff的前提是，你需要在列表item中设置明确的key属性，否则它也检索不出是否移动
	// 移动的处理是 删除、插入
	// `moves` is a sequence of actions (remove or insert): type 0 is removing, type 1 is inserting
	const diffs = listDiff(oldChildren, newChildren, 'key')
	// 这里也特别的有意思: 
	// 如果diffs.moves有值，表示是移动，则diffs.children为oldChildren节点内容(但属性等应该还是newChildren本身对应的)，这样就可以避开后面对新旧节点内容不同情况下的比对，因为只是移动，最多后面还需要比较下属性而已
	// 如果diffs.moves无值，表示不是移动，则diffs.children为newChildren本身
	newChildren = diffs.children

	if (diffs.moves.length) {
	  const reorderPatch = { type: DF_TYPES.REORDER, moves: diffs.moves }
	  currentNodeDf.push(reorderPatch)

	  // 这里没有用return拦截，而是继续执行下面的逻辑，是因为虽然上面移动了，移动后的节点本身及其子节点还是会有变动的，所以下面也得继续比对
	}

	// 遍历children
	// 当前索引指向index
	let currentNodeIndex = index
	// 设置左侧节点，通过它本身的所有子节点数allChildNodes来计算下一个同级节点的索引
	let leftNode = null
	oldChildren.forEach((och, i) => {
		const nch = newChildren[i]

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
		const baseIndexCount = currentNodeIndex + 1
		currentNodeIndex = leftNode && leftNode.allChildNodes ? baseIndexCount + leftNode.allChildNodes : baseIndexCount

		dfsNodeCompare(och, nch, currentNodeIndex, patches)

		// 重置leftNode
		leftNode = och
	})
}

// 策略： 新节点属性中有且不相同的，或者旧属性中不存在的
function compareProps(oldProps, newProps) {
	const currentPropsDf = []

	// 新节点属性在旧节点中有，且不相同的
	for(let i in oldProps) {
		const oldValue = oldProps[i]

		if (newProps[i] && newProps[i] !== oldValue) {
			currentPropsDf.push({ k: i, v: newProps[i] })
		}
	}

	// 旧属性中不存在的
	for(let i in newProps) {
		if (!oldProps[i]) {
			currentPropsDf.push({ k: i, v: newProps[i] })
		}
	}

	return currentPropsDf
}