function interpretResults(globalProps, globalTypes, resultJSON) {
	
	if (globalTypes !== undefined && '0' in globalTypes) {
		var origintypestring= '<a target="_blank" href="' + globalTypes['0']['value'] + '">' + globalTypes['0']['label'] + '</a>';
	}
	var new_json_obj = [];
	for (var i=0; i<resultJSON.length; i++) {
		var userProperties = "";
		if(globalProps === undefined || globalProps.length < 1){
			userProperties = "No specific properties chosen.";
		} 
		else {
			userProperties += '<ul class="pull-left"> <u> chosen properties </u>';
			for(var j=0; j<globalProps.length; j++){
				if (resultJSON[i] !== undefined) {
					var prop_id = globalProps[j]['id'];
					if (resultJSON[i][prop_id]!== undefined) {
						userProperties += '<li><a target="_blank" href="'+globalProps[j]['value']+'"<a>'+globalProps[j]['label']+'</a>:';
						userProperties += resultJSON[i][prop_id].value 
						userProperties +=' </li>';	
					}
				}
			}
			userProperties += '</ul>';
		}	
		new_json_obj.push({'type':resultJSON[i].return.type, 'value': resultJSON[i].return.value, 'displayvalue': resultJSON[i].return.value.substring(resultJSON[i].return.value.lastIndexOf("/")+1), 'origin_type': origintypestring, 'user_properties': userProperties});
	}
	$('#result_container').html($('#result_template_container').html());
	// render result json in TEMPO (template rendering engine)
	Tempo.prepare("result_container").render(new_json_obj);
	$('#result_container').css('display','block');
	var typeliststring = '';
	if (globalTypes !== undefined) {
		for (i=0; i<globalTypes.length; i++) {
			typeliststring += '<li>'+globalTypes[i]['label']+'</li>';
		}
	}
	$('.type_structure').html(typeliststring);
	$('.detail_request').on('click', function(event){
		event.preventDefault();
		var element = $(this).next();
		if(element.css('display')=='none') {
		var id='details';
		var htmlstring = sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 1000, "return": "?return ?label"},{"model": "triple", "t1": "<'+$(this).attr('data-value')+'>", "t2": "?label", "t3": "?return"}]', id, element);
		}
		element.fadeToggle('fast');
	});
	$('.thumbnail_image').on('click', function(event){
		event.preventDefault();
		var element = $(this);
		var id = 'thumb';
		sendingRequest('[{"model": "META", "source": "'+$('#source').attr('data-value')+'", "limit": 1000, "return": "?return ?label"},{"model": "triple", "t1": "<'+$(this).parent().parent().parent().find('.detail_request').attr('data-value')+'>", "t2": "?label", "t3": "?return"}]', id, element);
	});
}