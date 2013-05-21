// add remove function to prototype of array
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var globalTypes = [];
var globalProps = [];
var propcount = 1;
var concatcount = 0;
var returnValue = "";

var baseColor = 0xdddddd;

$("#treeSuper").hide();

// Add keyup event listener to sparql_editor
$('#sparql_editor').on('keyup', function() {
	var error_found = false;
	// get starting position of cursor
	var position = $('#sparql_editor').caret().start;
	
	// search closest ws to cursor position
	var code = $('#sparql_editor').val();
		code = code.substr(0, position + 1);
	code = code.substr(code.lastIndexOf(" ")+1, code.length - 1);
	var is_url = code.indexOf("<") == 0;
	var search_string = code.substr(1, code.length);
	if (search_string.indexOf(">") == search_string.length-1) {
		search_string = search_string.substr(0, search_string.length - 1);
	}
	if (is_url && search_string.length >= 1) {
		//request typeahead
		var $element = $('#sparql_editor');
		$element.attr('data-search-string', search_string);
		updateTypeahead('sparql_editor', $element);
		$(this).parent().find('.typeahead').stop().css('display','block');
	}
	try {
		parser.parse($(this).val());
	} catch(e) {
		$('#sparql_editor_helper').html(e.message);
		error_found = true;
	}
	if(!error_found){
		$('#sparql_editor_helper').html('');
	}
});

// Adding event listeners for typeahead at source choose box
$('#source').on('keyup', function(){
	updateTypeahead('source', $(this));
	$('#source_typeahead').html('<div class="ajax-loader"></div>');
	$('#starttype_container').stop().css('display','block');
});
$('#source_field').on('focusout', function(){
	$('#source_typeahead').delay(200).fadeOut(400);
});
$('#source').on('focus', function(){
	$('#source_typeahead').stop().css('display','block');
	$('#source_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('source', $(this));
	$('#starttype_container').stop().css('display','block');
});


// Adding event listeners for typeahead at supertype choose box
$('#super').on('keyup', function(){
	$('#super_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('super', $(this));
});
$('#super_field').on('focusout', function(){
	$('#super_typeahead').delay(200).fadeOut(400);
});
$('#super').on('focus', function(){
	$('#super_typeahead').stop().css('display','block');
	updateTypeahead('super', $(this));
});

// Adding event listeners for typeahead at starttype choose box
$('#starttype').on('keyup', function(){
	$('#starttype_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('starttype', $(this));
	$('#properties_container').stop().css('display','block');
});
$('#starttype_field').on('focusout', function(){
	$('#starttype_typeahead').delay(200).fadeOut(400);
});
$('#starttype').on('focus', function(){
	$('#starttype_typeahead').stop().css('display','block');
	$('#starttype_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('starttype', $(this));
	$('#properties_container').stop().css('display','block');
});


// Adding event listeners for typeahead at subtype choose box
$('#sub').on('keyup', function(){
	$('#sub_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('sub', $(this));
});
$('#sub_field').on('focusout', function(){
	$('#sub_typeahead').delay(200).fadeOut(400);
});
$('#sub').on('focus', function(){
	$('#sub_typeahead').stop().css('display','block');
	$('#sub_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('sub', $(this));
});

// Adding event listeners for typeahead at property choose box
$('#prop').on('keyup', function(){
	$('#prop_typeahead').html('<div class="ajax-loader"></div>');
	updateTypeahead('prop', $(this));
});
$('#prop_field').on('focusout', function(){
	$('#prop_typeahead').delay(200).fadeOut(400);
});
$('#prop').on('focus', function(){
	$('#prop_typeahead').html('<div class="ajax-loader"></div>');
	$('#prop_typeahead').stop().css('display','block');
	updateTypeahead('prop', $(this));
});

// Adding event listeners for typeahead at value choose box
$('#value').on('keyup', function(){
	updateTypeahead('value', $(this));
});
$('#value_field').on('focusout', function(){
	$('#value_typeahead').delay(200).fadeOut(400);
});
$('#value').on('focus', function(){
	$('#value_typeahead').stop().css('display','block');
	updateTypeahead('value', $(this));
});

// Adding event listeners for typeahead at query button choose box
$('#query_button').on('click', function(event){
	event.preventDefault();
	submitQuery();
	$(this).attr('disabled','disabled');
});

// Adding event listeners for typeahead at explore button choose box
$('#explore_button').on('click', function(event){
	event.preventDefault();
	$(this).attr('disabled','disabled');
	$('#result_wrapper').stop().css('display','block');
	var propcount = 0;
	
	//define interpretation function of properties
	function interpret_prop(element) {
		var string = "";
		// if a property type is selected
		if (element.find('.prop').attr('data-value') !== undefined && element.closest('.prop_wrapper').find('.prop').attr('data-value') !== "") {
			var variable = "?return";
			if (element.closest('.prop_wrapper').attr('data-variable') !== undefined && element.closest('.prop_wrapper').attr('data-variable') !== false) {
				variable = element.closest('.prop_wrapper').attr('data-variable');
			}
			// adding triple to json string
			string += '{"model": "triple", "t1": "'+variable+'", "t2": "<'+element.closest('.prop_wrapper').find('.prop').attr('data-value')+'>", "t3":"?'+element.closest('.prop_wrapper').attr('id')+'" }';
			// adding variable name to return variables
			returnValue += ' ?'+element.closest('.prop_wrapper').attr('id')+'';
			// if there is a value according to the property add a regex filter to this property
			if (element.find('.value').val() != "" && element.find('.value').val() !== undefined) {
				string += ',';
				string += '{"model": "filter", "value": "regex(?'+element.closest('.prop_wrapper').attr('id')+', \\"'+element.find('.value').val()+'\\")"}';
			}
			propcount = propcount + 1;
		}
		// if the property is defined in another triple below the type
		if ($('.'+element.closest('.prop_wrapper').attr('id')+'_specify').length > 0) {
			//find first and last children of the "specify" container and serialize their properties
			var first = $('.'+element.closest('.prop_wrapper').attr('id')+'_specify').find('.prop_wrapper').first();
			var last = $('.'+element.closest('.prop_wrapper').attr('id')+'_specify').find('.prop_wrapper').children().last();
			var recStr = serialize_properties(first,last);
			// if the result of those serialized properties is not the empty list push them to the return string after an AND
			if (recStr != "[]") {
				recStr = '{"model": "concat", "value": "AND"} , ' + '[' + recStr + ']';
			}
			string = '[' + string + ']' + ', ' + recStr;
		}
		return string;
	}
	
	// define interpretation function of concats
	function interpret_concat(element) {
		string = ', {"model": "concat", "value": "';
		string += element.find('option:selected').val();
		string += '"}';
		return string;
	}
	
	// recursive function to serialize properties according all siblings from start element to end element
	function serialize_properties(start, end) {
		var min = 10000;
		var elements = [];
		var thiselement = start;
		
		// find the concat element left value is min
		while (thiselement.attr('id') != end.attr('id')) {
			if (thiselement.hasClass('concat')) {
				if(thiselement.position().left < min) {
					min = thiselement.position().left;
					elements = [];
					elements.push(thiselement);
				} else if(thiselement.position().left == min){
					elements.push(thiselement);
				}
			}
			thiselement = thiselement.next();
		}
		// if there are elements
		if (elements.length > 0) {
			first_min_element = elements[0];
			// serialize the elements before the first concat
			var string = "[" + serialize_properties(start, first_min_element.prev()) + "]";
			for(var i=0; i < elements.length; i++) {
				// interpret furhter properties
				string += interpret_concat(elements[i]);
				if(i + 1 == elements.length) {
					string += ",[" + serialize_properties(elements[i].next(), end) + "]";
				} else {
					string += ",[" + serialize_properties(elements[i].next(), elements[i+1].prev()) + "]";
				}
			}
			return string;
		} else {
			return interpret_prop(start);
		}
	}
	
	// create META model incl. return variables
	var jsonString = '';
	jsonString = '[';
	jsonString += '{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "return": "DISTINCT ?return';
	returnValue = "";
	
	// serializing properties has to be done here because the affected returnValue variable is needed here, recStr (the actual serialized property string) is later added to the string
	var recStr = serialize_properties($('#properties_container').find('.property_forms').children().first(), $('#properties_container').find('.property_forms').children().last());
	if (recStr != '') {
		recStr = '[' + recStr + ']';
	}
	jsonString += returnValue;
	jsonString += '"},';
	// add starttype triple
	jsonString += '{"model": "triple", "t1": "?return", "t2": "a", "t3": "<'+$('#current_type').attr('data-value')+'>"}';
	
	if(recStr !== '')
		jsonString += ',' + recStr;
	jsonString += ']';
	
	// get results
	getResults(jsonString, globalProps, globalTypes);
});

registerPropertyButtons($('#properties'));

function registerPropertyButtons(element) {

	// Adding event listeners for typeahead at property choose boxes
	$('.prop').on('keyup', function(){
		$(this).parent().find('.typeahead').html('<div class="ajax-loader"></div>');
		updateTypeahead('prop', $(this));
	});
	$('.prop').on('focusout', function(){
		$(this).parent().find('.typeahead').delay(200).fadeOut(400);
	});
	$('.prop').on('focus', function(){
		$(this).parent().find('.typeahead').stop().css('display','block');
		$(this).parent().find('.typeahead').html('<div class="ajax-loader"></div>');
		updateTypeahead('prop', $(this));
	});

	// Adding event listeners for typeahead at value choose boxes
	$('.value').on('keyup', function(){
		$(this).parent().find('.typeahead').html('<div class="ajax-loader"></div>');
		updateTypeahead('value', $(this));
	});
	$('.value').on('focusout', function(){
		$(this).parent().find('.typeahead').delay(200).fadeOut(400);
	});
	$('.value').on('focus', function(){
		$(this).parent().find('.typeahead').stop().css('display','block');
		$(this).parent().find('.typeahead').html('<div class="ajax-loader"></div>');
		updateTypeahead('value', $(this));
	});
	$('#sparql_editor').on('focusout', function(){
		$(this).parent().find('.typeahead').delay(200).fadeOut(400);
	});

	// Adding evenlistener for specify property buttons
	$('.specify_prop_button').unbind('click').on('click', function(event){
		event.preventDefault();
		var prop_id = $(this).parent().attr('id');
		var data_range = $(this).parent().find('.prop').attr('data-type-range');
		var label = $(this).parent().find('.prop').val();
		
		// fetching template of property specifications and setting IDs, classes and data-ranges
		var $template = $('.specify_property_template');
		if (data_range !== undefined && data_range != '') {
			var $new_container = $('<div></div>').addClass('row').html($template.html()).addClass(prop_id+'_specify').attr('data-range', data_range);
		} else {
			var $new_container = $('<div></div>').addClass('row').html($template.html()).addClass(prop_id+'_specify');
		}
		$new_container.find('.prop_label').html(label);
		$new_container.find('.specify_property_container').attr('data-range', data_range);
		$new_container.find('.specify_property_container').attr('data-variable', '?'+prop_id);
		$new_container.find('.specify_property_container').html($('.specify_property_template_container').html());
		if (data_range !== undefined && data_range != '') {
			$new_container.find('.specify_property_container').find('.prop').attr('data-range', data_range);	
		}
		$new_container.find('.prop_wrapper').attr('id', 'prop'+propcount).attr('data-variable', '?'+prop_id);
		propcount += 1;
		$('.specify_property_containers').append($new_container);
		registerPropertyButtons($new_container);
		$(this).parent().find('.value_container').remove();
	});
	
	// Adding event listeners for delete buttons
	$('.delete_prop_button').unbind('click').on('click', function(event){
		event.preventDefault();
		// remove from stack
		var propid = $(this).parent().attr('id');
		for(var i=0; i<globalProps.length; i++){
			if(propid == globalProps[i].id){
				globalProps.remove(i);
			}
		}
		// remove dom elements
		if($(this).parent().parent().children().first().attr('id') == $(this).parent().attr('id')){
			$(this).parent().next().remove();
		} else {
			$(this).parent().prev().remove();
		}
		concatcount = concatcount - 1;
		$(this).parent().remove();
	});

	// Adding evenlistener for specify property buttons
	$('.add_prop_button').unbind('click').on('click', function(event) {
		event.preventDefault();
		concatcount = concatcount + 1;
		// Adding concat DOM element
		if(concatcount > 1) {
			var concatstring='<div class="concat well" id="concat_'+propcount+'"><select name="concat"><option>AND</option><option>OR</option></select><br>Slide to indent for logical braces!</div>';
			$(this).parent().find('.property_forms').append(concatstring);
		}
		var htmlstring = $('.property_template').html();
		$(this).parent().find('.property_forms').append(htmlstring);
		$(this).parent().find('.property_forms').children().last().attr('id', 'prop' + propcount);
		propcount += 1;
		$(this).parent().find('.property_forms').find('.concat').draggable({axis: "x", containment: "parent", scroll: false, grid: [ 20, 130 ], stop: function(){
			updatePropertyPositions($(this).parent().children().first(), $(this).parent().children().last(), 0);	
		}});
		registerPropertyButtons($(this).parent().find('.property_forms'));
	});

	// Adding evenlistener for property buttons in specifcation properties
	$('.add_specify_prop_button').unbind('click').on('click', function(event) {
		event.preventDefault();
		concatcount = concatcount + 1;
		var data_variable = $(this).parent().find('.specify_property_container').attr('data-variable');
		var data_range = $(this).parent().find('.specify_property_container').attr('data-range');
		// Adding concat DOM element
		if(concatcount > 1) {
			var concatstring='<div class="concat well" id="concat_'+propcount+'"><select name="concat"><option>AND</option><option>OR</option></select><br>Slide to indent for logical braces!</div>';
			$(this).parent().find('.property_forms').append(concatstring);
		}
		var prop_container = $('.specify_property_template_container').html();
		$(this).parent().find('.property_forms').append(prop_container);
		var $prop_container = $(this).parent().find('.property_forms').children().last();
		if (data_range !== undefined && data_range != '') {
			$prop_container.find('.prop').attr('data-range', data_range);	
		}
		$prop_container.attr('id', 'prop'+propcount).attr('data-variable', data_variable);
		propcount += 1;
		$(this).parent().find('.property_forms').find('.concat').draggable({axis: "x", containment: "parent", scroll: false, grid: [ 20, 130 ], stop: function(){
			updatePropertyPositions($(this).parent().children().first(), $(this).parent().children().last(), 0);	
		}});
		registerPropertyButtons($(this).parent().find('.property_forms'));
	});
	
	// Adding event listener for delete button at specification properties 
	$('.delete_specify_button').unbind('click').on('click', function(e) {
		e.preventDefault();
		$(this).parent().find('.delete_prop_button').click();
		$(this).closest('.specification_container').remove();
	});
};

// function to sort properties according the concats
function updatePropertyPositions(start, end, position){
	var min = 10000;
	var elements = [];
	var thiselement = start;
	while (thiselement.attr('id') !== end.attr('id')) {
		if (thiselement.hasClass('concat')) {
			if (thiselement.position().left < min) {
				min = thiselement.position().left;
				elements = [];
				elements.push(thiselement);
				position = parseInt(thiselement.css('left'));
			} else if(thiselement.position().left === min){
				elements.push(thiselement);
			}
		}
		thiselement = thiselement.next();
	}

	if (elements.length > 0) {
		first_min_element = elements[0];
		updatePropertyPositions(start, first_min_element.prev(), position+10);
		for(var i=0; i < elements.length; i++) {
			if(i+1 == elements.length) {
				updatePropertyPositions(elements[i].next(), end, position+10);
			} else {
				updatePropertyPositions(elements[i].next(), elements[i+1].prev(), position+10);
			}
		}
		return;
	} else {
		start.css('left', position+'px');
		var newColor = 0xdddddd - (position << 16) - (position << 8) - position;
		if(newColor <= 0x6f6f6f) {
		    start.css('color', '#f4f4f4');
		} else {
		    start.css('color', '#424242');
		}
		start.css('background-color', '#'+newColor.toString(16));
	}
}
	
// update typeahead function
function updateTypeahead(id, element) {
	var json = [];
	// switch identifier of typeahead type
	switch(id) {
		case 'source':
		    // extra handling for sources
			// ADD new sources here:
			json = new Array({'value': 'http://linkeddata2012.west.uni-koblenz.de:8890/sparql/', 'label': 'Uni-Koblenz'},
							{'value': 'http://dbpedia.org/sparql/', 'label': 'dbpedia.org'});
			var htmlstring = '<ul class="well">';
			if(json.length === 0) {
				htmlstring += '<li><a href="#">No results.</a></li>';
			}
			for (var i = 0; i < json.length; i++) {
				htmlstring += '<li class="has-tooltip"><a rel="tooltip" data-type="source" data-tooltip="'+json[i]['value']+'" class="typeahead_choice" href="#">';
				var label = json[i]['label'];
				htmlstring +=  label;
				htmlstring += '</a>';
				htmlstring += '</li>';
			}
			htmlstring += '</ul>';
			element.parent().find('.typeahead').html(htmlstring);

			$('.typeahead_choice').on('click', function(event){
				event.preventDefault();
				updateValue($(this).attr('data-tooltip'), $(this).html(), $(this).attr('data-type'), $(this).parent().parent().parent().parent().find('input'));
			});

			$(".has-tooltip a[rel=tooltip]").hover(function(){
				$(this).parent().append('<div class="well vespe-tooltip">'+$(this).attr('data-tooltip')+'</div>');
			},function(){
				$(this).parent().find('.vespe-tooltip').remove();
			});
			break;
			
		case 'super':
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},{"model": "triple", "t1": "<'+$('#starttype').attr('data-value')+'>", "t2": "rdfs:subClassOf", "t3": "?return"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}, {"model":"filter", "value":"regex(str(?label), \\"^'+element.val()+'\\", \\"i\\") || regex(str(?return), \\"^'+element.val()+'\\", \\"i\\")", "optional": true}]', id, element);
			break;
			
		case 'starttype':
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},{"model": "triple", "t1": "?return", "t2": "a", "t3": "owl:Class"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}, {"model":"filter", "value":"regex(str(?label), \\"^'+element.val()+'\\", \\"i\\") || regex(str(?return), \\"^'+element.val()+'\\", \\"i\\")", "optional": true}]', id, element);
			break;
			
		case 'sub':
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},{"model": "triple", "t1": "?return", "t2": "rdfs:subClassOf", "t3": "<'+$('#starttype').attr('data-value')+'>"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}, {"model":"filter", "value":"regex(str(?label), \\"^'+element.val()+'\\", \\"i\\") || regex(str(?return), \\"^'+element.val()+'\\", \\"i\\")", "optional": true}]', id, element);
			break;
			
		case 'prop':
			var type = element.attr('data-range');
			if (type === undefined) {
				type = $('#current_type').attr('data-value');
			}
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label ?range"},{"model": "triple", "t1": "?starttype", "t2": "rdf:type", "t3": "<'+type+'>"},{"model": "triple", "t1": "?starttype", "t2": "?return", "t3": "?value"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}, {"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#range>", "t3": "?range", "optional": true}, {"model":"filter", "value":"regex(str(?label), \\"^'+element.val()+'\\", \\"i\\") || regex(str(?return), \\"^'+element.val()+'\\", \\"i\\")", "optional": true}]', id, element);
			break;
		
		case 'sparql_editor':
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},{"model": "triple", "t1": "?return", "t2": "a", "t3": "owl:Class"},{"model": "triple", "t1": "?return", "t2": "<http://www.w3.org/2000/01/rdf-schema#label>", "t3": "?label", "optional": true}, {"model":"filter", "value":"regex(str(?label), \\"^'+element.attr('data-search-string')+'\\", \\"i\\") || regex(str(?return), \\"^'+element.attr('data-search-string')+'\\", \\"i\\")", "optional": true}]', id, element);
			break;
			
		case 'value':
			var type = element.closest('.prop_wrapper').find('.prop').attr('data-range');
			if (type === undefined) {
				type = $('#current_type').attr('data-value');
			}
			sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 10, "order_by": "ASC (str(?label))", "group_by": "?return", "return": "DISTINCT ?return ?label"},'+
			'{"model": "triple", "t1": "?starttype", "t2": "rdf:type", "t3": "<'+type+'>"},'+
			'{"model": "triple", "t1": "?starttype", "t2": "<'+element.closest('.prop_wrapper').find('.prop').attr('data-value')+'>", "t3": "?return"},'+
			'{"model":"filter", "value":"regex(str(?return), \\"'+element.val()+'\\", \\"i\\")", "optional": true}'+
			']', id, element);
			break;
	}
}

function updateValue(value,label,id,element) {
	if(value === undefined || value === "") {
		// Error while updating value!
		return;
	}

	var setElement = function () {
		element.val(label);
		element.attr("data-value", value);
	};
	
	var getElementPropId = function () {
		return element.closest('.prop_wrapper').attr('id');
	};

	var pushToTypeStack = function () {
		globalTypes.push({
			'label': label,
			'value' : value
		});
	};
	
	var initTree = function(){
		init({'id' : value, 'name' : label});
	};

	switch(id) {
		case "prop":
			// Add property to typeStack
			var updated = false;
			for(var i=0; i<globalProps.length; i++){
				if(globalProps[i].id==getElementPropId()){
					updated = true;
					globalProps[i].label = label;
					globalProps[i].value = value;
				}
			}
			
			if(!updated){
				globalProps.push({
					'label': label,
					'value' : value,
					'id' : getElementPropId()
				});
			}
			
			element.closest('.prop_wrapper').find('.value_container').fadeIn(400);
			setElement();
			break;
			
		case "starttype":
			// New starttype, flush stack
			globalTypes.length = 0;
			pushToTypeStack();
			initTree();
			$('#sub_container').fadeIn(400);
			$('#super_container').fadeIn(400);
			setElement();
			break;
			
		case "super":
			globalTypes.pop();
			// This fallthru is intended!
			
		case "sub":
			pushToTypeStack();
			$('#starttype').val(label);
			$('#'+id).val('');
			$('#'+id).attr('data-value','');
			$('#starttype').attr('data-value',value);
			initTree();
			break;
			
		case "source":
			// New source! Clear all stacks
			globalTypes.length = 0;
			globalProps.length = 0;
			$('#source').val(label);
			$('#source').attr('data-value',value);
			break;
			
		case "value":
			setElement();
			break;
			
		default:
			break;
	}
}

function none() {}
	
$('#expert_button').on('click', function (event) {
	event.preventDefault();
	$('#expert_settings').stop().slideToggle(300);
});
$(document).ready(function() {
	$("#vespe_logo").draggable();
});
