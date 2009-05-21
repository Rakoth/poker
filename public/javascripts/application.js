// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults
function game_window(href){
	var href_parts = href.split('/');
	var id = href_parts[href_parts.length - 1];
	new_window = window.open(href, 'game' + id, "left=100,top=100,width=700,height=390,menubar=no,location=no,resizable=no,scrollbars=no,status=no");
	new_window.focus();
}

function game_created(request){
	game_window('/games/' + request);
}