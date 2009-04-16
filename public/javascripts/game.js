Function.prototype.bind = function(object) {
  var __method = this;
  return function() {
    __method.apply(object, arguments);
  }
}

//=============================================================================
$(function(){
	$.extend(Game, GameMethods);
	Game.on_load();
	
	if(Game.is_wait()){
		GameSynchronizer.start();
	}else{
		ActionsSynchronizer.start();
	}
});

//=============================================================================
var GameMethods = {
	players_count: 0,
	players: [],
	is_wait: function(){
		return 'waited' == this.status;
	},
	is_started: function(){
		return 'on_preflop' == this.status ||
					 'on_flop'    == this.status ||
					 'on_turn'    == this.status ||
					 'on_river'   == this.status;
	},
	small_blind: function(){
		return this.blind_size / 2;
	},
	on_load: function(){
		this._add_players_from_game();
		if(this.is_started()){
			this.on_start();
		}
		this.update_pot();
		this.update_blinds();
	},
	on_start: function(){
		this.set_active_player();
		this.active_player.start_turn();
	},
	_add_players_from_game: function(){
		this._add_players_from_array(this.players_to_load);
		this.players_to_load = null;
	},
	_add_players_from_array: function(players_array){
		for(var i in players_array){
			this.add_player(players_array[i]);
		}
	},
	add_player: function(player){
		this.players[player.sit] = new Player(player);
		this.players_count++;
	},
	remove_player: function(id){
		for(var i in this.players){
			if(this.players[i].id == id){
				var sit = i;
				break;
			}
		}
		if(sit){
			this.players[sit].sit.disable();
			delete(this.players[sit]);
			this.players_count--;
		}
	},
	add_for_call_exept_sit: function(value, sit_index){
		for(var i in this.players){
			player = this.players[i];
			if(player && player.sit.id != sit_index){
				player.add_for_call(value);
			}
		}
	},
	get_players_ids: function(){
		var answer = [];
		for(var i in this.players){
			if(this.players[i]){
				answer.push(this.players[i].id)
			}
		}
		return answer;
	},
	take_blinds: function(){
		if(this.ante > 0){
			for(var i in this.players){
				this.players[i].stake(this.ante);
			}
		}
		this.players[this.small_blind_position].stake(this.small_blind());
		this.players[this.blind_position].stake(this.blind_size);
	},
	next_turn: function(){
		this._set_next_active_player();
		this.active_player.start_turn();
	},
	set_active_player: function(){
		if(!this.active_player){
			var sit;
			$(this.players).each(function(){
				if(this.id == Game.active_player_id){
					sit = this.sit.id;
					return;
				}
			});
			this.active_player = this.players[sit];
			this.active_player_id = null;
		}
	},
	_set_next_active_player: function(){
		var next_active_player_sit = this.active_player.sit.id;
		next_active_player_sit++;
		while(!this.players[next_active_player_sit]){
			if(this.max_players == next_active_player_sit)
				next_active_player_sit = 0;
			else
				next_active_player_sit++;
		}
		this.active_player = this.players[next_active_player_sit];
	},
	pot: function(){
		var pot = 0;
		$(this.players).each(function(){pot += this.in_pot});
		return pot;
	},
	update_pot: function(){
		$('#pot').text(this.pot());
	},
	update_blinds: function(){
		$('#blinds').text(this.blind_size + '/' + this.small_blind());
	}
};

//=============================================================================
var ActionsSynchronizer = {
	_period: 25,
	_last_action_id: 0,
	start: function(){
		this._timer = setInterval(this._get_omitted, this._period * 1000);
	},
	restart: function(new_period){
		this._period = new_period;
		clearTimeout(this._timer);
		this.start();
	},
	_get_omitted: function(){
		$.getJSON(ActionsSynchronizer._url(), ActionsSynchronizer._perform);
	},
	_url: function(){
		return '/actions/' + Game.id + '/' + this._last_action_id + '.json';
	},
	_perform: function(json){
		var time = json.pop();
		this._last_action_id = json.pop();
		for(action in json){
			ActionsExecuter.perform(action);
		}
		Game.active_player.set_time_for_action(time);
	},
	notify_about_action_timeout: function(player_id){
		//TODO
		//$.post('actions/timeout/', {game_id: Game.id, player_id: player_id});
		return;
	}
};

var ActionsExecuter = {
	name_by_kind: ['fold', 'check', 'call', 'bet', 'raise'],
	perform: function(action){
		var kind = action[0];
		action_name = this.name_by_kind[kind];
		if(action.length == 1){
			this.ActionsInfluence[action_name]();
		}else{
			var value = action[1];
			this.ActionsInfluence[action_name](value);
		}
		this._show_action(action_name);
		Game.next_active_player();
	},
	ActionsInfluence: {
		fold: function(){
			Game.active_player.fold();
		},
		check: function(){},
		call: function(){
			player = Game.active_player;
			player.stake(player.for_call);
		},
		bet: function(value){
			player = Game.active_player;
			player.stake(player.for_call + value);
		},
		raise: function(value){
			this.bet(value);
		}
	},
	_show_action: function(action_name){
		Game.active_player.say_action(action_name);
	}
};

//=============================================================================
var GameSynchronizer = {
	_period: 5,
	start: function(){
		this._timer = setInterval(this._check_for_new_players.bind(this), this._period * 1000);
	},
	_check_for_new_players: function(){
		var players = Game.get_players_ids();
		$.getJSON(
			this._url(),
			{'players[]': players},
			this._sync_game
		);
	},
	_sync_game: function(json){
		if(json.remove && 0 < json.remove.length){
			$(json.remove).each(function(){
				Game.remove_player(this);
			});
		}
		if(json.add && 0 < json.add.length){
			$(json.add).each(function(){
				Game.add_player(this);
			});
		}
		if(json.game){
			$.extend(Game, json.game);
			GameSynchronizer._start_client_game();
		}
	},
	_start_client_game: function(){
		clearTimeout(this._timer);
		Game.take_blinds();
		Game.on_start();
		ActionsSynchronizer.start();
	},
	_url: function(){
		return '/games/synchronize/' + Game.id + '.json';
	}
};

//=============================================================================
var Player = function(params){
	default_params = {
		stack: Game.start_stack,
		in_pot: 0,
		for_call: 0,
		status: 'active'
	};
	$.extend(this, default_params, params);
	$.extend(this, PlayerMethods);
	this.sit = new PlayerSit(this);
	this.timer = new PlayerTimer(this);
};

var PlayerMethods = {
	say_action: function(action_name){
		alert(action_name);
	},
	stake: function(value){
		if(this.for_call < value){
			Game.add_for_call_exept_sit(value - this.for_call, this.sit);
		}
		this._update_stack(value, 'out');
		Game.update_pot();
	},
	add_for_call: function(value){
		this.for_call += value;
		//this.sit.for_call.update(this.for_call);
	},
	_update_stack: function(value, direction){
		if('out' == direction){
			this.stack -= value;
			this.in_pot += value;
		}else{
			this.stack += value;
			this.in_pot = 0;
		}
		this.for_call = 0;

		this.sit.update_stack(this.stack);
		this.sit.update_in_pot(this.in_pot);
		//this.sit.for_call.update(this.for_call);
	},
	set_time_for_action: function(time){
		this.timer.set_time(time);
	},
	start_turn: function(time_left){
		if(time_left != undefined){
			this.set_time_for_action(time_left);
		}else{
			this.set_time_for_action(Game.time_for_action);
		}
		this.timer.start();
	},
	end_turn_by_timeout: function(){
		 ActionsSynchronizer.notify_about_action_timeout(this.id);
		 Game.next_turn();
	}
};

//=============================================================================
var PlayerSit = function(player){
	this.player = player;
	$.extend(this, PlayerSitMethods);
	this.id = player.sit;
	this.main = $('#sit_' + this.id).show('slow');
	this.login = $('#login_' + this.id).attr('title', player.login).text(player.login);
	this.cards = $('#cards_' + this.id);
	this.timer = $('#timer_' + this.id);
	this.stack = $('#stack_' + this.id).text(player.stack);
	this.for_call = null;
	this.in_pot = null;
};

var PlayerSitMethods = {
	update_timer: function(){
		this.timer.attr('src', this._timer_src());
	},
	update_in_pot: function(new_value){
		//this.in_pot.text(new_value);
	},
	update_stack: function(new_value){
		this.stack.text(new_value);
	},
	_timer_src: function(){
		var time = this.player.timer.time;
		var image = (1 <= time ? time : 'default');
		return '/images/game/timer/' + image + '.gif';
	},
	disable: function(){
		this.main.hide('slow');
	}
};

//=============================================================================
var PlayerTimer = function(player){
	this.player = player;
	this.time = Game.time_for_action;

	$.extend(this, PlayerTimerMethods);
};
var PlayerTimerMethods = {
	start: function(){
		this._timer = setInterval(this._reduce_time.bind(this), 1000);
	},
	stop: function(){
		clearTimeout(this._timer);
	},
	set_time: function(time){
		this.time = time;
		this.player.sit.update_timer()
	},
	_reduce_time: function(){
		if(0 < this.time){
			this.set_time(this.time - 1);
		}else{
			this.stop();
			this.player.end_turn_by_timeout();
		}
	}
}

//=============================================================================