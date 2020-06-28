/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module describes double linked list.
 */

/**
 * Defines linked list node class.
 *
 * @param {Object}         data   The data.
 * @param {LinkedListNode} prev   The previous node.
 * @param {LinkedListNode} next   The next node.
 */
function LinkedListNode(data, prev, next) {
	this.data = data;
	this.prev = prev;
	this.next = next;
}

/**
 * Defines linked list class.
 * Internally it's represented as double linked list.
 */
function LinkedList() {
	var head = null;
	var tail = null;
	var length = 0;

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		// Orphan nodes to make it ready for garbage collector
		var node = head;
		var next;
		while (node !== null) {
			next = node.next;
			node.data = null;
			node.prev = null;
			node.next = null;			
			node = next;
		}
	};

	/**
	 * Returns front value.
	 *
	 * @return {Object} The front value.
	 */
	this.front = function() {
		if (head)
			return head.data;
		else
			return null;
	};

	/**
	 * Returns back value.
	 *
	 * @return {Object} The back value.
	 */
	this.back = function() {
		if (tail)
			return tail.data;
		else
			return null;
	};

	/**
	 * Checks if list empty.
	 *
	 * @return True if empty and false otherwise.
	 */
	this.empty = function() {
		return length == 0;
	};

	/**
	 * Pushes value to the front of the list.
	 *
	 * @param {Object} value  The value.
	 */
	this.pushFront = function(value) {
		var node = new LinkedListNode(value, null, head);
		if (head)
			head.prev = node;
		head = node;
		if (!tail)
			tail = node;
		length++;
	};

	/**
	 * Pushes value to the back of the list.
	 *
	 * @param {Object} value  The value.
	 */
	this.pushBack = function(value) {
		var node = new LinkedListNode(value, tail, null);
		if (tail)
			tail.next = node;
		tail = node;
		if (!head)
			head = node;
		length++;
	};

	/**
	 * Pops the front element from the list.
	 *
	 * @return Front element data. Or null.
	 */
	this.popFront = function() {
		var node = head;
		if (node) {
			head = node.next;
			if (head)
				head.prev = null;
			if (tail == node)
				tail = null;
			length--;
			return node.data;
		}
		return null;
	};

	/**
	 * Pops the back element from the list.
	 *
	 * @return Back element data. Or null.
	 */
	this.popBack = function() {
		var node = tail;
		if (node) {
			tail = node.prev;
			if (tail)
				tail.next = null;
			if (head == node)
				head = null;
			length--;
			return node.data;
		}
		return null;
	};

	/**
	 * Removes the element from the list by value.
	 *
	 * @param {Object}   value    The value.
	 * @param {Function} compare  The compare function. function(data, value)
	 * @return Removed element data. Or null.
	 */
	this.remove = function(value, compare) {
		// Find node first
		var node = head;
		while (node != null) {
			if (compare(node.data, value))
				break;
			node = node.next;
		}
		// Then remove the node
		if (node) {
			if (node.prev)
				node.prev.next = node.next;
			if (node.next)
				node.next.prev = node.prev;
			if (head == node)
				head = node.next;
			if (tail == node)
				tail = node.prev;
			length--;
			return node.data;
		}
		return null;
	};
}

export { LinkedList };