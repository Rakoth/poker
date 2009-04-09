$(function(){
	synchronizer.start();
});
var Game = {
	id: 1
};
var synchronizer = {
	period: 5,
	last_action_id: 0,
	url: function(){
		return '/actions/' + Game.id + '/' + this.last_action_id + '.json';
	},
	start: function(){
		this.timer = setInterval(actions_executer.show_actions, this.period * 1000);
	},
	restart: function(){
		clearTimeout(this.timer);
		this.start();
	}
};

var actions_executer = {
	actions: [],
	show_actions: function(){
		actions_executer.get_omited_actions();
		for(action in actions_executer.actions){
			actions_executer._execute_action(action);
		}
	},
	get_omited_actions: function(){
		$.get(synchronizer.url(), this.parse_actions);
	},
	_execute_action: function(action){
		alert(action);
	},
	parse_actions: function(json){
		$('#room').toggle('slow');
	}
};

