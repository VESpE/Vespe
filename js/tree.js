var labelType, useGradients, nativeTextSupport, animate;
var url = "lod_api.php";



(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();


function init(initPew){
    $('#infovis').html("");   

    var makeRequst = function (startType, limit, callback) {
		var source = $('#source').attr('data-value');
        var query = '[{"model": "META", "source": "'+source+'", "limit": ' + limit + ', "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},{"model": "triple", "t1": "?return", "t2": "rdfs:subClassOf", "t3": "<' + startType + '>"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}]';
        $.ajax({
            url: url,
            type: "POST",
            data: {'json': query},
            dataType: "json",
            async: true
        }).done(function (result) {
            callback(result);
        });
    };

    //A client-side tree generator
    var getTree = (function() {
        var i = 0;
       
        return function(nodeId, level, callback) {
             var sparqlClass;
            if(nodeId.lastIndexOf('#') >= 0){
               sparqlClass = nodeId.substring(0,nodeId.lastIndexOf('#'))} 
                else {
                   sparqlClass = nodeId}

          makeRequst(sparqlClass, '25', function (data) {
	    var subtree = [];

if(data.results == null || data.results.bindings.length === 0){
  var obj = {'id': 'vespeDummyNode#'+i+Math.random() , 'children':[], 'data' :{}, 'name' : 'No Subtype'};
  subtree.push(obj);
} else {



	    for(var j = 0; j < data.results.bindings.length; j++) {
		var obj = { 'id': data.results.bindings[j].return.value + '#' + i,
			'children': [],
			'data': {'uri': data.results.bindings[j]['return'].value},
			'name': data.results.bindings[j].label.value
		}
		subtree.push(obj);
	    }
	    i++;
}
	    
	    var newTree = {
		'id': nodeId,
		'children': subtree	
	    };
	    var lastIndex = nodeId.lastIndexOf('#');
	    var substr = nodeId.substring(0, lastIndex);
	    if(substr === "vespeDummyNode") {
	  	callback.onComplete();
		return;
	     }
	     callback.onComplete(nodeId, newTree);	
          });
        };
    })();
    
    //Implement a node rendering function called 'nodeline' that plots a straight line
    //when contracting or expanding a subtree.
    $jit.ST.Plot.NodeTypes.implement({
        'nodeline': {
          'render': function(node, canvas, animating) {
                if(animating === 'expand' || animating === 'contract') {
                  var pos = node.pos.getc(true), nconfig = this.node, data = node.data;
                  var width  = nconfig.width, height = nconfig.height;
                  var algnPos = this.getAlignedPos(pos, width, height);
                  var ctx = canvas.getCtx(), ort = this.config.orientation;
                  ctx.beginPath();
                  if(ort == 'left' || ort == 'right') {
                      ctx.moveTo(algnPos.x, algnPos.y + height / 2);
                      ctx.lineTo(algnPos.x + width, algnPos.y + height / 2);
                  } else {
                      ctx.moveTo(algnPos.x + width / 2, algnPos.y);
                      ctx.lineTo(algnPos.x + width / 2, algnPos.y + height);
                  }
                  ctx.stroke();
              } 
          }
        }
          
    });

    //init Spacetree
    //Create a new ST instance
    var st = new $jit.ST({
        'injectInto': 'infovis',
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 50,
        //set max levels to show. Useful when used with
        //the request method for requesting trees of specific depth
        levelsToShow: 2,
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 20,
            width: 70,
            //use a custom
            //node rendering function
            type: 'nodeline',
            color:'#000000',
            lineWidth: 2,
            align:"center",
            overridable: true
        },
        
        Edge: {
            type: 'bezier',
            lineWidth: 2,
            color:'#AABBCC',
            overridable: true
        },
        
        //Add a request method for requesting on-demand json trees. 
        //This method gets called when a node
        //is clicked and its subtree has a smaller depth
        //than the one specified by the levelsToShow parameter.
        //In that case a subtree is requested and is added to the dataset.
        //This method is asynchronous, so you can make an Ajax request for that
        //subtree and then handle it to the onComplete callback.
        //Here we just use a client-side tree generator (the getTree function).
        request: function(nodeId, level, onComplete) {
          getTree(nodeId, level, onComplete);
          //var subTree = makeRequst
          //onComplete.onComplete(nodeId, ans);
        },
        
        onBeforeCompute: function(node){
        },
        
        onAfterCompute: function(){
        },
        
        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;            
            label.innerHTML =node.name;
            var lastIndex = node.id.lastIndexOf('#');
	    var substr = node.id.substring(0, lastIndex);
	    if(substr !== "vespeDummyNode") {
            label.onclick = function(){
                st.onClick(node.id);

                //update Shit
            //set stuff          
            var htmlString = '<a href="'+label.id+'">'+node.name+'</a>';     
            $("#current_type").html(htmlString);

                         var sparqlClass;
            if(node.id.lastIndexOf('#') >= 0){
               sparqlClass = node.id.substring(0,node.id.lastIndexOf('#'))} 
                else {
                   sparqlClass = node.id}
            		$("#current_type").attr('data-value', sparqlClass);

            	};
	    }
            //set label styles
            var style = label.style;         
            style.cursor = 'pointer';
            style.color = '#010101';
            style.fontSize = '0.8em';
            style.textAlign= 'center';
            style.paddingTop = '3px';

        },
        
        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#ff7";
            }
            else {
                delete node.data.$color;
            }
        },
        
        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    var startId = initPew.id;
    var startJson = { 'id': initPew.id, 'name':initPew.name, 'data':{}, 'children':[] };
    var htmlString = '<a href="'+initPew.id+'">'+initPew.name+'</a>';
    $("#current_type").attr('data-value', initPew.id).html(htmlString);
  

  
    //var startJson = { 'id': 'http://dbpedia.org/ontology/Person#-', 'name': 'Person', 'data': {}, 'children': []  };
    st.loadJSON(startJson);
    //compute node positions and layout
    st.compute();
    //emulate a click on the root node.
    st.onClick(st.root);
    //end
    //Add event handlers to switch spacetree orientation.
   function get(id) {
      return document.getElementById(id);  
    };

    var top = get('r-top'), 
    left = get('r-left'), 
    bottom = get('r-bottom'), 
    right = get('r-right');
    
    function changeHandler() {
        if(this.checked) {
            top.disabled = bottom.disabled = right.disabled = left.disabled = true;
            st.switchPosition(this.value, "animate", {
                onComplete: function(){
                    top.disabled = bottom.disabled = right.disabled = left.disabled = false;
                }
            });
        }
    };
    
    //top.onchange = left.onchange = bottom.onchange = right.onchange = changeHandler;
    //end

}

