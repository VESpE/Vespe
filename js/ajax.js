function sendingRequest(jsonString, id, element) {
	var url = 'lod_api.php';
	$.ajax({
		url: url,
		type: "POST",
		data: {'json': jsonString},
		dataType: "json",
		async: true
	}).done(function(data) {
		if (id != "sparql_editor") {
			$('#sparql_editor').val(data['query']);
		}
		$('#json_results').val(JSON.stringify(data));
		var target = id;
		// modify target elements for super and sub (should modify starttype instead)
		switch(id) {
			case 'super':
				target = "starttype";
				break;
			case 'sub':
				target = "starttype";
				break;
			default:
				break;
		}
		json = new Array();
		var array = data.results.bindings;
		for (i=0; i < array.length; i++) {
			var label = '';
			if (array[i].hasOwnProperty('label')) {
				label = array[i].label.value;
			} else {
			label = array[i].return.value;
			}
			var range = '';
			if (array[i].hasOwnProperty('range')) {
				range = array[i].range.value;
			}
			json.push({'value': array[i].return.value, 'label': label, 'range': range});
		
		}
		// try to get thumbnail
		if (id == 'thumb') {
			var valid_extensions = /(\.jpg|\.jpeg|\.gif|\.png|\.JPG|\.JPEG|\.GIF|\.PNG)$/i;   
			var isImg = false;
			for(var i = 0; i<json.length; i++){
				if(json[i]['value'].indexOf("http://")>= 0 && valid_extensions.test(json[i]['value']) && !isImg){
					isImg = true;
					var htmlString = '<img class="result-image" src="'+json[i]['value']+'" alt="'+json[i]['value']+'"> </img>';
					element.html(htmlString);
				}
			} 
			if (!isImg) {
				var htmlString = 'There is no image available';
				element.html(htmlString);
			}
		} else if (id == 'details') {
			var htmlstring = '';
			for (var i = 0; i < json.length; i++) {
				htmlstring += '<div>';

				if(json[i]['value'].indexOf("http://") >= 0){
					htmlstring+= json[i]['label'].substring(json[i]['label'].lastIndexOf('#')+1)+'<br /> <a target="_blank" href="'+json[i]['value']+'" >'+json[i]['value'].substring(json[i]['value'].lastIndexOf('/')+1)+'</a>'
				} else {
					htmlstring += json[i]['label'].substring(json[i]['label'].lastIndexOf('#')+1)+':<br />'+json[i]['value']+'<br /><br /><br />';
				}
				htmlstring += '</div>';
			}
			element.html(htmlstring);
		} else {
			// updateing typeahead
			var htmlstring = '<ul class="well">';
			if(json.length == 0) {
				htmlstring += '<li><a href="#">No results.</a></li>';
			}
			for (var i = 0; i < json.length; i++) {
				htmlstring += '<li class="has-tooltip"><a rel="tooltip" data-type="'+id+'" data-tooltip="'+json[i]['value']+'" data-range="'+json[i]['range']+'" class="typeahead_choice" href="#">';
				var label = json[i]['label'];
				htmlstring +=  label;
				htmlstring += '</a>';
				htmlstring += '</li>';
			}
			htmlstring += '</ul>';
			element.parent().find('.typeahead').html(htmlstring);
			// register click eventlistener for typehead items
			$('.typeahead_choice').on('click', function(event){
				event.preventDefault();
				updateValue($(this).attr('data-tooltip'), $(this).html(), $(this).attr('data-type'), $(this).parent().parent().parent().parent().find('input'));
				if (id == 'prop') {
					if ($(this).attr('data-range') == '' || $(this).attr('data-range') === undefined || $(this).attr('data-range') === false) {
						$(this).closest('.prop_wrapper').find('.specify_prop_button').remove();
						$(this).closest('.prop_wrapper').find('.add_specify_prop_button').remove();
					}
					$(this).parent().parent().parent().parent().find('input').attr('data-type-range', $(this).attr('data-range'));
				}
				if (id == 'sparql_editor') {
					update_sparql_editor_value($(this));
				}
			});
			$(".has-tooltip a[rel=tooltip]").hover(function(){
				$(this).parent().append('<div class="well vespe-tooltip">'+$(this).attr('data-tooltip')+'</div>');
			},function(){
				$(this).parent().find('.vespe-tooltip').remove();
			});
		}
	});
}

function update_sparql_editor_value(element) {
	var position = $('#sparql_editor').caret().start;
	var data_value = element.attr('data-tooltip');
	if (data_value !== undefined) {
		element.addClass('has_tooltip');
	} else {
		data_value = element.val();
	}
	var first_part_of_string = $('#sparql_editor').val().substr(0, position);
		first_part_of_string = first_part_of_string.substr(0, first_part_of_string.lastIndexOf("<")+1);
	var second_part_of_string = $('#sparql_editor').val().substr(position, $('#sparql_editor').val().length);
		second_part_of_string = second_part_of_string.substr(second_part_of_string.indexOf(">"), second_part_of_string.length)
	var code = first_part_of_string;
		code = code + data_value;
		code = code + second_part_of_string;
	$('#sparql_editor').val(code);
}

function submitQuery() {
	var url ='lod_api.php';
	$.ajax({
		url: url,
		type: "POST",
		data: {'query': $('#sparql_editor').val(), 'source': $('#source').attr('data-value')},
		dataType: "json",
		async: true
	}).done(function( data ) {
		$('#sparql_editor').val(data['query']);
		$('#query_button').removeAttr('disabled');
		insertResult(data);
	});
}


function getResults(jsonString, globalProps) {
	var url ='lod_api.php';
	$.ajax({
		url: url,
		type: "POST",
		data: {"json": jsonString},
		dataType: "json",
		async: true
	}).done(function( data ) {
		$('#explore_button').removeAttr('disabled');
		$('#sparql_editor').val(data['query']);
		insertResult(data, globalProps, globalTypes);
	});
}


function insertResult(data, globalProps, globalTypes){
	var resultJSON = data.results.bindings;
	interpretResults(globalProps, globalTypes, resultJSON);
}