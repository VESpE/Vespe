<?php

class Node{
	var $par;
	var $content;
	function __construct($parent, $content){
		$this->par =$parent;
		$this->content = $content;
	}

}

class Leaf extends Node{
}

class Operator extends Node{
	var $children;
	
	function __construct($parent){
		$this->par = $parent;
		$this->children = array();
	}
	
	function addNode($node){
		array_push($this->children, $node);
	}
}

class Tree{
	var $root;
	
	function __construct(){
		$this->root = new Operator(null);
	}
}


