<?php

include 'tree.php';

class Api {
	/// Stores the tree instance
	var $tree;

	/// output format
	var $format;
	
	/// received json
	var $json;
	
	/// datasource
	var $source;
	
	/// default-graph-uri
	var $dgu;
	
	/// queryresultvar
	var $result;
	
	/// array of triples in query body
	var $triples;
	
	/// queryoptional
	var $optional;
	
	/// query_filters
	var $filters;
	
	/// query_limit (default 0)
	var $limit;

	/// query_offset (default 0)
	var $offset;
	
	/// query_group
	var $groupby;
	
	/// query_order
	var $oderby;
	
	/// query_string
	var $querystring;

	/// searchurl
	var $searchUrl;

	/// Query Timeout
	var $timeout;

	var $treeUsed;
	
	/**
	 * \brief Constructor which sets all values to a default.
	 */
	function __construct() {
		$this->tree = new Tree();
		$this->dgu 	= '';
		$this->triples = array();
		$this->filters = array();
		$this->timeout = 10000;
		$this->limit 	= 0;
		$this->offset 	= 0;
		$this->format 	= 'json';
		$this->treeUsed = false;
	}
	
	/**
	 * \brief Map the JSON object to the class variables so we can access them easy.
	 */
	function parseJson() {
		$this->json = json_decode($_REQUEST['json']);
				
		for ($i=0; $i<count($this->json); $i++) {
			if(is_array($this->json[$i])){
				$this->tree->root = $this->parseArray($this->json[$i]);
				$this->treeUsed = true;
				continue;
			}
			switch ($this->json[$i]->{'model'}){
				case 'META' : 
					$this->source = $this->json[$i]->{'source'};
					isset($this->json[$i]->{'dgu'}) and $this->dgu = $this->json[$i]->{'dgu'};
					isset($this->json[$i]->{'limit'}) and $this->limit = $this->json[$i]->{'limit'};
					isset($this->json[$i]->{'offset'}) and $this->offset = $this->json[$i]->{'offset'};
					isset($this->json[$i]->{'group_by'}) and $this->groupby = $this->json[$i]->{'group_by'};
					isset($this->json[$i]->{'order_by'}) and $this->orderby = $this->json[$i]->{'order_by'};
					isset($this->json[$i]->{'timeout'}) and $this->timeout = $this->json[$i]->{'timeout'};
					$this->result = $this->json[$i]->{'return'};
					break;
				case 'triple' :
					$array = array();
					$array['t1']=$this->json[$i]->{'t1'};
					$array['t2']=$this->json[$i]->{'t2'};
					$array['t3']=$this->json[$i]->{'t3'};
					$array['opt']= isset($this->json[$i]->{'optional'}) and 'true' == $this->json[$i]->{'optional'};
					array_push($this->triples, $array);
					break;
				case 'filter' : 
					$this->filter = $this->json[$i]->{'value'};
					array_push($this->filters, $this->filter);
					break;			
			}

		}
	}
	
	/**
	 * \brief Here we parse the given array. The logical concatinations contains arrays
	 * which we have to parse to get the desired query.
	 */
	function parseArray($array){
		$expression = array();
		for ($i=0; $i<count($array); $i++) {
			if(is_array($array[$i])){
				array_push($expression, $this->parseArray($array[$i]));
			}else{
				switch ($array[$i]->{'model'}){
					case 'concat' :
						$op = new Operator(null);
						$op->content = $array[$i]->{'value'};
						array_push($expression, $op);
						break;
					case 'triple' :
						$a = array();
						array_push($a, " ".$array[$i]->{'t1'}." ".$array[$i]->{'t2'}." ".$array[$i]->{'t3'}." " );
						if(isset($array[$i+1]) && ($array[$i+1]->{'model'} == 'filter')){
							array_push ($a, $array[$i+1]->{'value'});
						}
						$tr = new Leaf(null, $a);
						return $tr;
						break;						
				}
			}
		}
		return $this->createNode($expression);
	}
	
	function createNode($exp){
		$lastNode = null;
		for($i=count($exp)-2;$i>0;$i-=2){
			$exp[$i]->addNode($exp[$i-1]);
			if($lastNode == null){
				$exp[$i]->addNode($exp[$i+1]);
			}else{
				$exp[$i]->addNode($lastNode);
			}
			$exp[$i+1]->par = $exp[$i];
			$exp[$i-1]->par = $exp[$i];
			$lastNode = $exp[$i];
		}
		return $exp[1];
	}


	/**
     * \brief Here we create a string containing a valid SPARQL query, which we want to send to the datasource.
     */
	function buildQuery(){
			// We open the SPARQL query
			$this->querystring=" SELECT ".$this->result." { \n ";
			
			// To add all the triples we want to add we iterate through the array of triples and add them as we need them.
			foreach ($this->triples as $triple){
				$this->querystring .= " \t ";
				if($triple['opt']){
					$this->querystring.=" OPTIONAL { ";
				}
				$this->querystring .= " ".$triple['t1']." ".$triple['t2']." ".$triple['t3'];
				if($triple['opt']){
					$this->querystring.=" } ";
				}
				$this->querystring .= " . \n ";
			}			
			
			if($this->treeUsed){
				$this->querystring .= $this->buildTreeQuery($this->tree->root);
			}

			// To add the filters we do the same
			foreach ($this->filters as $filter){
				$this->querystring .= " FILTER (".$filter.") \n ";
			}
			
			$this->querystring .= " } \n ";		
			
			// Here we add some general information about the query if needed
			$this->offset!=0 and $this->querystring .= " OFFSET ".$this->offset." \n ";
			empty($this->groupby) or $this->querystring .= " GROUP BY ".$this->groupby." \n ";
			empty($this->orderby) or $this->querystring .= " ORDER BY ".$this->orderby." \n ";
			$this->limit!=0 and $this->querystring .= " LIMIT ".$this->limit." \n ";
	}
	
	/**
	 * Here we create the query out of the given tree. (Recursive)
	 */
	function buildTreeQuery($node){
		$str = '';
		if($node instanceof Operator){
			if($node->content == 'AND'){
				$str = " { " . $this->buildTreeQuery($node->children[0]) . " .\n ". $this->buildTreeQuery($node->children[1]) . " . } "; 
			}else if($node->content == 'OR'){
				$str = " { " . $this->buildTreeQuery($node->children[0]) . " . } UNION {\n ". $this->buildTreeQuery($node->children[1]) . " . } "; 
			}
			return $str;
		}else if($node instanceof Leaf) {
			if(isset($node->content[0])) {
				if(isset($node->content[1])) {
					return $node->content[0] . " . FILTER (".$node->content[1].") \n ";
				}
				return $node->content[0] . "\n ";
			}
		}
	}
	
	/**
	 * \brief Creates a request URL to the given SPARQL endpoint
	 *
	 * Because the SPARQL endpoints are using GET variables we create the needed URL to connect to the datasource. We encode the query and save the URL inside the class
	 */
	function buildURL(){
		$this->searchUrl = $this->source
			.'?default-graph-uri='.$this->dgu.'&query='.urlencode($this->querystring)
			.'&format='.$this->format
			.'&timeout='.$this->timeout;
	}

	/**
	 * \brief This function requests the data using the given URL
	 *
	 * \see buildURL
	 *
	 * We use cURL to make a request to the given Endpoint. This function gets called last, we get the values here.
	 *
	 * \return Query result object generated by the datasource
	 */
	function request(){
	   // is curl installed?
	   if (!function_exists('curl_init')){
		  die('CURL is not installed!');
	   }	 
	   // get curl handle
	   $ch= curl_init();
	   // set request url
	   curl_setopt($ch,
		  CURLOPT_URL,
		  $this->searchUrl);
	   // return response, don't print/echo
	   curl_setopt($ch,
		  CURLOPT_RETURNTRANSFER,
		  true);
	   $response = curl_exec($ch);
	   curl_close($ch);
	   return $response;
	}	
	
	/**
	 * \brief Add the generated Query to the result
	 *
	 * For Debugging purposes we add the generated query to the result object. Because of this we can show the query inside the "expert view".
	 *
	 * \return Query result object including the query itself
	 */
	function addQueryToJson($response) {
		$jsonResponse = json_decode($response);
		$jsonResponse->{'query'} = $this->querystring;
		return json_encode($jsonResponse); 	
	}
	
	/**
	 * \brief This function is the entry point for the API. We call everything we need and return the result object
	 *
	 * \return Query result object
	 */
	function run(){
		if(empty($this->querystring)){
			$this->parseJson();
			$this->buildQuery();
		}
		$this->buildURL();
		echo $this->addQueryToJson($this->request());
	}
}

$api = new Api();
isset($_REQUEST['json']) or ($api->querystring = $_REQUEST['query'] and $api->source = $_REQUEST['source']);
$api->run();
