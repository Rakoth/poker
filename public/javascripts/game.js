var RUN_TESTS = true;

Function.prototype.bind = function(object){
	var __method = this;
	return function() {
		__method.apply(object, arguments);
	};
};

var RP_Extend = {
	escape_html: function(html_to_escape){
		return html_to_escape.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	is_request_ready: function(request){
		return (!request || 0 == request.readyState || 4 == request.readyState)
	},
	debug: function(variable_or_vars_array, condition){
		if($.browser.mozilla && console){
			condition = (undefined == condition) ? true : condition;
			if(condition){
				var vars_for_log = [];
				if($.isArray(variable_or_vars_array)){
					for(var index in variable_or_vars_array){
						vars_for_log.push(variable_or_vars_array[index], '#');
					}
					vars_for_log.pop();
				}else{
					vars_for_log.push(variable_or_vars_array);
				}
				console.debug.apply(console, vars_for_log);
			}
		}
	}
};
$.extend(RP_Extend);


$(function(){
	RP_Client.initialize();

	if(RUN_TESTS){
		RP_Tests.run_all();
		return;
	}

	RP_Game.on_load();
	RP_Synchronizers[RP_Game.is_wait() ? 'Game' : 'Action'].start();
	RP_Synchronizers.Chat.start();
});

//=============================================================================
var RP_GameMethods = {
	table_cards: {
		flop: null,
		turn: null,
		river: null
	},
	_stage_name: {
		'on_flop': 'flop',
		'on_turn': 'turn',
		'on_river': 'river'
	},
	is_wait: function(){
		return 'waited' == this.status;
	},
	is_on_stage: function(stage_name){
		return 'on_' + stage_name == this.status;
	},
	is_on_river: function(){
		return 'on_river' == this.status;
	},
	is_started: function(){
		return 'on_preflop' == this.status ||
		'on_flop'    == this.status ||
		'on_turn'    == this.status ||
		'on_river'   == this.status;
	},
	is_paused: function(){
		return (null != this.paused);
	},
	small_blind_size: function(){
		return this.blind_size / 2;
	},
	minimal_bet: function(){
		return this.blind_size;
	},
	pot: function(){
		return RP_Players.inject(0, function(value, player){
			return value + player.in_pot;
		});
	},

	on_load: function(){
		// добавить игроков
		this._load_players();

		// если надо запустить таймер
		if(this._is_need_start_timer()){
			// запустить его
			RP_Timer.start(RP_Players.find(this.active_player_id), this.action_time_left);
			delete this.active_player_id;
			delete this.action_time_left;
		}

		// нужно ли показать клиенту away_dialog
		if(RP_Client.is_away()){
			RP_Visualizers.Client.away();
		}

		// отрисовка состояния игры
		RP_Visualizers.Game.update_all();
	},
	initialize_table_cards: function(){
		for(var stage in RP_Game.cards_to_load){
			if(RP_Game.cards_to_load[stage]){
				this.table_cards[stage] = new RP_CardsSet(RP_Game.cards_to_load[stage]);
				if(RP_Game.is_on_stage(stage)){
					RP_Log.game_stage();
					RP_Event.initialize('Log', 'received_cards', {
						stage: stage,
						cards: stage_cards
					});
				}
			}
		}
		delete RP_Game.cards_to_load;
	},
	current_stage_cards: function(){
		return this.table_cards[this._stage_name[this.stage]];
	},
	_is_need_start_timer: function(){
		return this.is_started() && !this.is_paused();
	},
	_load_players: function(){
		for(var index in this.players_to_load){
			var player = new RP_Player(this.players_to_load[index]);
			RP_Players.add_player(player);
		}
	}
};

//=============================================================================
var RP_Player = function(params){
	var default_params = {
		stack: RP_Game.start_stack,
		in_pot: 0,
		for_call: 0,
		hand: new RP_CardsSet()
	};
	if(params.hand_to_load){
		params.hand = new RP_CardsSet(params.hand_to_load);
//		RP_Event.initialize('Log', 'received_cards', {
//			stage: 'hand',
//			cards: new RP_CardsSet(params.hand_to_load)
//		});
		delete params.hand_to_load;
	}

	$.extend(this, default_params, params);
};

RP_Player.prototype = {
	stake: function(value){
		var full_value = this.for_call + value;
		if(0 < value){
			RP_Players.each(function(player){
				player.add_for_call(value);
			});
			this.for_call -= value;
			RP_Game.current_bet += value;
		}
		this.blind_stake(full_value);
	},
	blind_stake: function(value){
		if(this.stack < value){
			value = this.stack;
			this._set_status('allin');
		}
		this.stack -= value;
		this.in_pot += value;
		if(value < this.for_call){
			this.for_call -= value;
		}else{
			this.for_call = 0;
		}
	},
	add_for_call: function(value){
		this.for_call += value;
	},
	active: function(){
		this._set_status('active');
	},
	away: function(){
		this._set_status('away');
	},
	absent: function(){
		this._set_status('absent');
	},
	action: function(action_name, value){
		this[action_name](value);
		this.act_in_this_round = true;
	},
	fold: function(){
		this._set_status('fold');
	},
	check: function(){
	},
	call: function(){
		this.stake(0);
	},
	bet: function(value){
		this.stake(value);
		RP_Players.refresh_acted_flags(this.id);
	},
	raise: function(value){
		this.bet(value);
	},
	is_fold: function(){
		return ('pass' == this.status || 'pass_away' == this.status);
	},
	is_allin: function(){
		return 'allin' == this.status;
	},
	is_active: function(){
		return !this.is_away();
	},
	is_away: function(){
		return ('absent' == this.status || 'pass_away' == this.status);
	},
	has_called: function(){
		return 0 == this.for_call;
	},
	_set_status: function(status){
		var new_status;
		switch(status){
			case 'fold':
				if(this.is_away()){
					new_status = 'pass_away';
				}else{
					new_status = 'pass';
				}
				break;
			case 'away':
				if(this.is_fold()){
					new_status = 'pass_away';
				}else{
					new_status = 'absent';
				}
				break;
			default:
				new_status = status;
				break;
		}
		this.status = new_status;
	},
	next_active: function(){
		return RP_Players.find_next_player(this);
	}
};

//=============================================================================
var RP_Client = {
	sit: null,
	initialize: function(){
		this.sit = RP_Game.client_sit;
		delete RP_Game.client_sit;
	},
	_player: function(){
		return RP_Players.at_sit(this.sit);
	},
	hand: function(){
		return this._player().hand;
	},
	set_hand: function(new_cards_in_str){
		this._player().hand = new RP_CardsSet(new_cards_in_str);
	},
	is_away: function(){
		return this._player().is_away();
	},
	is_a: function(player){
		return this.sit == player.sit;
	},
//	is_turn: function(){
//		return RP_Timer.is_turn_of(this.player());
//	},
	is_see_button: function(action_name){
		switch(action_name){
			case 'fold': return true;
			case 'check': return (0 == this._player().for_call);
			case 'call': return (0 < this._player().for_call);
			case 'bet': return (RP_Game.current_bet == RP_Game.blind_size && this._player().for_call < this._player().stack);
			case 'raise': return (RP_Game.blind_size < RP_Game.current_bet && this._player().for_call < this._player().stack);
			default: alert('Error in RP_Client.is_see_button(). Unexpected param: ' + action_name); return false;
		}
	},
	is_lose: function(){
		return undefined == this._player();
	}
};

//=============================================================================
var RP_Players = {
	_players: [],
	players_count: 0,
	is_all_acted: function(){
		var answer = true;
		$.each(this._still_in_game_players(), function(i, player){
			if(!player.act_in_this_round){
				answer = false;
				return;
			}
		});
		return answer;
	},
	is_all_away: function(){
		var answer = true;
		$.each(this._players, function(i, player){
			if(player && player.is_active()){
				answer = false;
				return;
			}
		});
		return answer;
	},
	each: function(callback){
		$.each(this._players, function(i, player){
			if(!!player){
				callback(player);
			}
		});
	},
	inject: function(start_value, callback){
		var result = start_value;
		for(var index in this._players){
			if(!!this._players[index]){
				result = callback(result, this._players[index]);
			}
		}
		return result;
	},
	find: function(player_id){
		var player_found;
		$.each(this._players, function(i, player){
			if(player && player_id == player.id){
				player_found = player;
				return;
			}
		});
		return player_found;
	},
	find_next_player: function(current_player){
		var current_player_position = $.inArray(current_player, this._still_in_game_players());
		return this._still_in_game_players()[current_player_position + 1] || this._still_in_game_players()[0];
	},
	at_sit: function(sit){
		return this._players[sit];
	},
	add_player: function(new_player){
		this._players[new_player.sit] = new_player;
		this.players_count++;
		return new_player;
	},
	remove_player: function(id){
		var sit;
		for(var i in this._players){
			if(this._players[i].id == id){
				sit = i;
				break;
			}
		}
		if(sit){
			var removed_player = this._players[sit];
			delete this._players[sit];
			this.players_count--;
		}
		return removed_player;
	},
	still_in_game_count: function(){
		return this._still_in_game_players().length;
	},
	must_call_count: function(){
		return this._must_call_players().length;
	},
	has_chips_and_can_act_count: function(){
		return this._has_chips_and_can_act_players().length;
	},
	refresh_acted_flags: function(exept_player_id){
		$.each(this._players, function(i, player){
			if(player && exept_player_id != player.id){
				player.act_in_this_round = false;
			}
		});
	},
	ids: function(){
		return $.map(
			$.grep(this._players, function(player){
				return !!player;
			}),
			function(player){
				return player.id;
			}
		);
	},
	losers: function(pemained_players_sits){
		return $.grep(this._players, function(player){
			return (!!player && -1 == $.inArray(player.sit, pemained_players_sits));
		});
	},
	_still_in_game_players: function(){
		return $.grep(this._players, function(player){
			return (player && !player.is_fold());
		});
	},
	_must_call_players: function(){
		return $.grep(this._still_in_game_players(), function(player){
			return !player.has_called();
		});
	},
	_has_chips_and_can_act_players: function(){
		return $.grep(this._still_in_game_players(), function(player){
			return !player.is_allin();
		});
	}
};

//=============================================================================
var RP_Timer = {

};

//=============================================================================
var RP_Action = function(params){
	$.extend(this, params);
};

RP_Action.prototype = {
	_name_by_kind: {
		'-4': 'check',
		'-3': 'check',
		'-2': 'fold',
		'-1': 'fold',
		'0': 'fold',
		'1': 'check',
		'2': 'call',
		'3': 'bet',
		'4': 'raise'
	},
	player: function(){
		return RP_Players.find(this.player_id);
	},
	name: function(){
		return this._name_by_kind[this.kind]
	},
	is_last_omitted: function(){
		return this.time_for_next_player != undefined
	}
};

//=============================================================================
var RP_CardsSet = function(cards_in_str){
	if(cards_in_str){
		this._cards = $.map(cards_in_str.split(':'), function(card){
			return new RP_Card(card);
		});
	}else{
		this._cards = [RP_DefaultCard, RP_DefaultCard];
	}
};
RP_CardsSet.prototype = {
	card: function(index){
		return this._cards[index] || RP_DefaultCard;
	},
	each: function(callback){
		$.each(this._cards, function(i, card){
			callback(i, card);
		});
	},
	alt: function(){
		return $.map(this._cards, function(card){
			return card.alt;
		}).join(', ');
	}
};

var RP_Card = function(card_string){
	this.src = '/images/game/cards/' + card_string + '.gif';
	this.alt = card_string.replace(/T/g, '10');
};
var RP_DefaultCard = {
	src: '/images/game/cards/RP.gif',
	alt: 'RP'
};

//=============================================================================
var RP_Log = {
	game_stage: function(){
		this._system_message(RP_Game.stage, RP_Game.current_stage_cards().to_s());
	},
	_system_message: function(title, body){
		console.log(title, body);
	}
};

//=============================================================================
var RP_Synchronizers = {
	Game: {

	},
	Action: {

	},
	Chat: {

	}
};

//=============================================================================
var RP_Visualizers = {
	Game: {

	},
	Client: {
		away: function(){
			RP_AwayDialog.dialog('open');
		}
	},
	Player: {

	},
	Timer: {

	},
	Log: {

	}
};