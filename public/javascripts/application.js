// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults
function game_window(href){
	var href_parts = href.split('/');
	var id = href_parts[href_parts.length - 1];
	new_window = window.open(href, 'game' + id, "left=100,top=100,width=700,height=400,menubar=no,location=no,resizable=no,scrollbars=no,status=no");
	new_window.focus();
}

function game_created(request){
	game_window('/games/' + request);
}

function disable_image(input_id){
	var image_input = $('#' + input_id)[0];
	image_input.disabled = true;
	var image_parts = image_input.src.split('.');
	var image_type = image_parts.pop();
	image_input.src = image_parts.join('.') + '_disabled.' + image_type;
}

function enable_image(input_id){
	var image_input = $('#' + input_id)[0];
	image_input.disabled = false;
	image_input.src = image_input.src.replace(/_disabled/, '');
}

function move_message_to_log(){
	var text = $('#log_message_text')[0].value;
	$('#log_message')[0].reset();
	ChatSynchronizer.add_client_message(text);
}

