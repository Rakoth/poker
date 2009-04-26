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
			if(this.last_action_id){
				ActionsSynchronizer.set_last_action_id(this.last_action_id);
			}
			if('on_preflop' != this.status){
				this.update_cards();
			}
		}
		this.update_pot();
		this.update_blinds();
	},
	on_start: function(){
		this.set_active_player();
		this.active_player.start_turn(this.action_time_left);
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
		return $.map($.grep(this.players, function(player){return player;}), function(player){
			return player.id;
		});
	// убивающий firefox код :
	//return $($.grep(this.players, function(){return this;})).map(function(){return this.id});
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
		this.active_player.end_turn();
		this._goto_next_stage();
		this.show_necessary_action_buttons();
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
		var safe_counter = 0;
		while((!this.players[next_active_player_sit] || this.players[next_active_player_sit].is_fold()) && safe_counter <= this.max_players){
			next_active_player_sit += (this.max_players == next_active_player_sit) ? -next_active_player_sit : 1;
			safe_counter++;
		}
		if(this.max_players < safe_counter){
			alert("Can`t find next active player");
		}
		this.active_player = this.players[next_active_player_sit];
	},
	pot: function(){
		var pot = 0;
		$(this.players).each(function(){
			pot += this.in_pot
		});
		return pot;
	},
	update_pot: function(){
		$('#pot').text(this.pot());
	},
	update_blinds: function(){
		$('#blinds').text(this.blind_size + '/' + this.small_blind());
	},
	update_cards: function(){
		if(this.flop){
			this.flop = new PlayerHand(this.flop);
			this.flop.show('flop');
		}
		if(this.turn){
			this.turn = new PlayerHand(this.turn);
			this.turn.show('turn');
		}
		if(this.river){
			this.river = new PlayerHand(this.river);
			this.river.show('river');
		}
	},
	client_action: function(action_kind){
		action_name = ActionsExecuter.name_by_kind[action_kind];
		action = [this.client_sit, action_kind];
		if('bet' == action_name || 'raise' == action_name){
			value = parseInt($('#stake_value').value);
			action.push(value);
		}
		ActionsExecuter.perform(action);
	},
	_goto_next_stage: function(){
		if(this._is_one_winner()){
			GameSynchronizer.new_distribution();
		}else{
			if(this._is_next_stage()){
				GameSynchronizer.next_stage();
			}
		}
	},
	_is_one_winner: function(){
		var count = 0;
		$(this.players).each(function(){
			if(!this.is_fold()){
				count++;
			}
		});
		return (1 == count)
	},
	_is_next_stage: function(){
		var next_stage = true;
		$(this.players).each(function(){
			if(!this.has_called() && !this.is_fold()){
				next_stage = false;
				return;
			}
		});
		return next_stage;
	},
	update_client_hand: function(){
		this.players[this.client_sit].update_hand(this.client_hand);
	},
	show_necessary_action_buttons: function(){
		$('#actions a').each(function(){
			if(Game._need_show_button(this.id)){
				$(this).show();
			}else{
				$(this).hide();
			}
		});
	},
	_need_show_button: function(action_name){
		var client = this.players[this.client_sit];
		switch(action_name){
			case 'fold': return true;
			case 'check': return (0 == client.for_call);
			case 'call': return (0 < client.for_call);
			case 'bet': return (this.current_bet == this.blind_size && client.for_call < client.stack);
			case 'raise': return (this.blind_size < this.current_bet && client.for_call < client.stack);
			default: alert('Error in Game._need_show_button(). Unexpected param: ' + action_name); return false;
		}
	}
};

//=============================================================================
var HurrySyncErrorStatus = 440; // чувак, ты не прав (клиент спешит)
var LateSyncErrorStatus  = 441; // ты молодец, но нам уже сообщили об этом (клиент опаздывает)
var ActionsSynchronizer = {
	_period: 3,
	_notify_period: 2,
	_last_action_id: 0,
	set_last_action_id: function(id){
		this._last_action_id = id;
	},
	start: function(){
		this._timer = setInterval(this._get_omitted.bind(this), this._period * 1000);
	},
	restart: function(new_period){
		this._period = new_period;
		this.stop();
		this.start();
	},
	stop: function(){
		clearTimeout(this._timer);
	},
	_get_omitted: function(){
		if(!this.currentRequest || 4 == this.currentRequest.readyState){
			this.currentRequest = $.getJSON(this._url(), this._perform.bind(this));
		}
	},
	_url: function(){
		return '/actions/' + Game.id + '/' + this._last_action_id + '.json';
	},
	_perform: function(json){
		var time = json.pop();
		this._last_action_id = json.pop();
		$(json).each(function(){
			ActionsExecuter.perform(this);
		});
		Game.active_player.set_time_for_action(time);
	},
	notify_about_action_timeout: function(player_id){
		$.ajax({
			url: '/actions/timeout/',
			type: 'POST',
			data: ({
				game_id: Game.id,
				player_id: player_id
			}),
			error: function(XMLHttpRequest){
				if(HurrySyncErrorStatus == XMLHttpRequest.status){
					//setTimeout("ActionsSynchronizer.notify_about_action_timeout(" + player_id + ")", this._notify_period * 1000);
				}
			}
		});
	}
};

var ActionsExecuter = {
	name_by_kind: ['fold', 'check', 'call', 'bet', 'raise'],
	perform: function(action){
		var player_sit = action.shift();
		Game.active_player = Game.players[player_sit];
		var kind = action[0];
		action_name = this.name_by_kind[kind];
		if(action.length == 1){
			ActionsInfluence[action_name]();
		}else{
			var value = action[1];
			ActionsInfluence[action_name](value);
		}
		this._show_action(action_name);
		Game.next_turn();
	},
	_show_action: function(action_name){
		Game.active_player.say_action(action_name);
	}
};
ActionsInfluence = {
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
}
//=============================================================================
var GameSynchronizer = {
	_period: 5,
	start: function(){
		this._timer = setInterval(this._check_for_new_players.bind(this), this._period * 1000);
	},
	_check_for_new_players: function(){
		var players = Game.get_players_ids();
		$.getJSON(
			'/game_synchronizers/wait_for_start/' + Game.id + '.json',
			{
				'players[]': players
			},
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
		Game.update_client_hand();
		Game.status = 'on_preflop';
		ActionsSynchronizer.start();
	},
	new_distribution: function(){
		$.getJSON('/game_synchronizers/distribution/' + Game.id + '.json', function(json){
				$.each(json.players_to_load, function(){
					sit_id = this.sit;
					delete this.sit
					$.extend(Game.players[sit_id], this);
					current_player = Game.players[sit_id];
					current_player.sit.update_stack();
					current_player.sit.update_status();
				});
				json.players_to_load = null;

				$.extend(Game, json);
				Game.update_client_hand();
				Game.update_blinds();
				
				Game.on_start();
			});
	},
	next_stage: function(){
		$.getJSON('/game_synchronizers/stage/' + Game.id + '.json', {
			current_status: Game.status
		}, function(json){
			$.extend(Game, json);
			Game.update_cards();
		});
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
	if(this.hand){
		this.hand = new PlayerHand(this.hand);
	}
	this.sit = new PlayerSit(this);
	this.timer = new PlayerTimer(this);
};

var PlayerMethods = {
	say_action: function(action_name){
		this.sit.last_action.text(action_name);
	},
	stake: function(value){
		if(this.for_call < value){
			Game.add_for_call_exept_sit(value - this.for_call, this.sit);
			Game.current_bet = value;
		}
		this._update_stack(value, 'out');
		Game.update_pot();
	},
	fold: function(){
		this.sit.cards.hide('slow');
		this.status = 'pass';
	},
	is_fold: function(){
		return 'pass' == this.status || 'pass_away' == this.status;
	},
	has_called: function(){
		return (0 == this.for_call);
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

		this.sit.update_stack();
		this.sit.update_in_pot(this.in_pot);
	//this.sit.for_call.update(this.for_call);
	},
	update_hand: function(new_hand_string){
		this.hand = new PlayerHand(new_hand_string);
		this.sit.update_hand();
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
	end_turn: function(){
		this.timer.stop();
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
	if(this.player.hand){
		this.update_hand();
	}
	if(this.player.is_fold()){
		this.cards.hide();
	}
	this.timer = $('#timer_' + this.id);
	this.stack = $('#stack_' + this.id).text(player.stack);
	this.last_action = $('#last_action_' + this.id);
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
	update_status: function(){
		//this.status.text(new_value);
	},
	update_stack: function(){
		this.stack.text(this.player.stack);
	},
	update_hand: function(){
		this.player.hand.show('card_' + this.id);
	},
	_timer_src: function(){
		var time = this.player.timer.time;
		var image = (0 < time ? time : 'default');
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
		this._timer = setInterval(this._reduce_time.bind(this), 2000);
	},
	stop: function(){
		window.clearTimeout(this._timer);
		this.set_time(0);
	},
	set_time: function(time){
		if(0 <= time){
			this.time = time;
			this.player.sit.update_timer();
		}else{
			alert("Error in set_time");
		}
	},
	_reduce_time: function(){
		if(this.time  && 0 < this.time){
			this.set_time(this.time - 1);
		}else{
			if(0 == this.time){
				this.stop();
				this.time  = null;
				ActionsSynchronizer.notify_about_action_timeout(this.player.id);
			}
		}
	}
};

//=============================================================================
var PlayerHand = function(hand_string){
	this.cards = $($(hand_string.split(':')).map(function(){
		return {
			suit: this.split('')[0],
			value: this.split('')[1],
			src: '/images/game/cards/' + this + '.gif',
			str: this
		};
	}));
	this.show = function(image_id){
		this.cards.each(function(i, card){
			$('#'  + image_id + '_' + i).attr('src', card.src).attr('alt', card.str);
		});
	}
}