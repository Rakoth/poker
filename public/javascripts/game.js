var RUN_TESTS = false;

Function.prototype.bind = function(object){
	var __method = this;
	return function() {
		__method.apply(object, arguments);
	};
};

var RP_HttpStatus = {
	errors: {
		hurry_sync: 440,
		late_sync: 441
	}
}

//=============================================================================
var RP_Visualizers = {
	create: function(group, object){
		var visualizer = (object != undefined) ? new this[group](object) : this[group];
		return function(){
			if('undefined' == typeof DISABLE_VIEW){
				var effect = arguments[0];
				var new_arguments = [];
				var i = 1;
				while(arguments[i] != undefined){
					new_arguments.push(arguments[i]);
					i++;
				}
				visualizer[effect].apply(visualizer, new_arguments);
			}
		};
	}
};

RP_Visualizers.Game = {
	_pot: function(){
		return $('#pot');
	},
	_blinds: function(){
		return $('#blinds');
	},
	update_all: function(){
		this.update_pot();
		this.update_blinds();
	//TODO
	},
	update_blinds: function(){
		this._blinds().text(this._blinds_info());
	},
	_blinds_info: function(){
		var result = RP_Game.blind_size + '/' + RP_Game.small_blind_size();
		if(0 < RP_Game.ante){
			result += ' (' + RP_Game.ante + ')';
		}
		return result;
	},
	update_pot: function(){
		this._pot().text(RP_Game.pot());
	}
};
RP_Visualizers.Client = {
	away: function(){
		RP_AwayDialog.dialog('open');
	},
	update_actions_buttons: function(){
		$('#actions a').each(function(){
			$(this)[RP_Client.is_see_button(this.id) ? 'show' : 'hide']();
		});
	}
};
RP_Visualizers.Player = function(player){
	this.player = player;
	this.sit = player.sit;
};
RP_Visualizers.Players = {
	update_all: function(){
		RP_Players.each(function(player){
			player.view('update_all');
		});
	}
};

RP_Visualizers.Timer = {
	_timer: function(){
		return $('#timer_' + RP_Timer.player.sit);
	},
	_timer_src: function(){
		return '/images/game/timer/' + RP_Timer.time + '.gif';
	},
	update: function(){
		this._timer().attr('alt', RP_Timer.time).attr('src', this._timer_src());
	}
};
RP_Visualizers.Log = {

}

RP_Visualizers.Player.prototype = {
	_sit: function(){
		return this._element('sit');
	},
	_login: function(){
		return this._element('login');
	},
	_stack: function(){
		return this._element('stack');
	},
	_away_layer: function(){
		return this._element('away_layer');
	},
	_hand: function(){
		return [$('#cards_' + this.sit + '_0'), $('#cards_' + this.sit + '_1')];
	},
	_element: function(id){
		return $('#' + id + '_' + this.sit);
	},
	update_stack: function(){
		var stack_value = (0 == this.player.stack) ? 'all-in' : this.player.stack;
		this._stack().text(stack_value);
	},
	update_state: function(){
		if(this.player.is_away()){
			this.away();
		}else{
			this.active();
		}
	},
	update_hand: function(){
		$.each(this._hand(), function(i, card){
			var player_card = this.player.hand.card(i);
			card.attr({
				alt: player_card.alt,
				src: player_card.src
			});
		}.bind(this));
	},
	join: function(){
		this._sit().show('slow');
		var login = this.player.login;
		this._login().attr('title', login).text(login);
		// new CardsSet('cards_' + this.id, 'player');
		// $('#timer_' + this.id);
		// this._stack(player).text(player.stack);
		this.update_all();
	},
	update_all: function(){
		this.update_stack();
		this.update_state();
		this.update_hand();
	},
	leave: function(){
		this._sit().hide('slow');
	},
	away: function(){

	},
	active: function(){

	},
	fold: function(){

	},
	check: function(){

	},
	call: function(){

	},
	bet: function(value){

	},
	raise: function(value){

	}
};

//=============================================================================
//var RP_CreateView = function(group, object){
//	var visualizer = (object != undefined) ? new RP_Visualizers[group](object) : RP_Visualizers[group];
//	return function(){
//		if('undefined' == typeof DISABLE_VIEW){
//			var effect = arguments.shift();
//			visualizer[effect].apply(visualizer, arguments);
//		}
//	};
//};

var RP_Extend = {
	escape_html: function(html_to_escape){
		return html_to_escape.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	is_request_ready: function(request){
		return (!RUN_TESTS && (!request || 0 == request.readyState || 4 == request.readyState))
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
	view: RP_Visualizers.create('Game'),
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
	start: function(){
		// снять блайнды
		this._take_blinds();
		// запустить таймер активному игроку
		RP_Timer.start(RP_Players.find(this.active_player_id), this.action_time_left);
	},
	_take_blinds: function(){
		if(0 < RP_Game.ante){
			RP_Players.each(function(player){
				player.blind_stake(RP_Game.ante);
			});
		}
		// снимаем большой блайнл с увеличением for_call для остальных
		this._player_on_blind().stake(RP_Game.blind_size);
		// просто снимаем малый блайнд
		this._player_on_small_blind().blind_stake(RP_Game.small_blind_size());
	},
	_player_on_small_blind: function(){
		return RP_Players.at_sit(this.small_blind_position);
	},
	_player_on_blind: function(){
		return RP_Players.at_sit(this.blind_position);
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
			RP_Client.view('away');
		}

		// отрисовка состояния игры
		this.view('update_all');
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
		delete params.hand_to_load;
	}

	$.extend(this, default_params, params);
	this.view = RP_Visualizers.create('Player', this);
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
	view: RP_Visualizers.create('Client'),
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
	set_hand: function(new_hand){
		this._player().hand = new_hand;
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

var RP_ActionTimeoutNotificator = {
	_period: 3,
	_request: null,
	notify: function(away_player){
		if(RP_Client.is_a(away_player)){
			RP_Client.view('away');
		}
		if($.is_request_ready(this._request)){
			this._request = $.ajax({
				url: '/actions/timeout',
				type: 'POST',
				data: {
					game_id: RP_Game.id,
					player_id: away_player.id
				},
				error: function(){
					if(RP_HttpStatus.errors.hurry_sync == this._request.status){
						setTimeout(
							function(){
								this.notify(away_player);
							}.bind(this),
							this._period * 1000
						);
					}
				}.bind(this)
			});
		}
	}
}

//=============================================================================
var RP_Players = {
	_players: [],
	players_count: 0,
	view: RP_Visualizers.create('Players'),
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

		new_player.view('join');
		RP_Log.new_player(new_player);
		
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
	_activated: false,
	player: null,
	time: 0,
	_timer: null,
	view: RP_Visualizers.create('Timer'),
	start: function(player, init_value){
		if(this._activated){
			this.stop();
		}
		this.player = player;
		this._activated = true;
		this._set_time(init_value);
		this._timer = setInterval(this._reduce_time.bind(this), 1000);
	},
	stop: function(){
		if(this._activated){
			this._activated = false;
			clearTimeout(this._timer);
			this._set_time(0);
		}
	},
	_set_time: function(time){
		this.time = (undefined == time ? RP_Game.time_for_action : time);
		this.view('update');
	},
	_reduce_time: function(){
		if(this.time && 0 < this.time){
			this._set_time(this.time - 1);
		}else{
			RP_ActionTimeoutNotificator.notify(this.player);
			this.stop();
		}
	},
	is_turn_of: function(player_to_check){
		return (this._activated && this.player.id == player_to_check.id);
	}
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
	view: RP_Visualizers.create('Log'),
	game_stage: function(){
		this._system_message(RP_Game.stage, RP_Game.current_stage_cards().to_s());
	},
	new_player: function(player){
		this._system_message(player.login, 'join');
	},
	_system_message: function(title, body){
		$.debug(title, body);
	}
};

//=============================================================================
var RP_Synchronizers = {};
RP_Synchronizers.Game = {
	_period: 10 * 1000,
	_timer: null,
	_request: null,
	start: function(){
		this._timer = setInterval(this._wait_for_start.bind(this), this._period);
	},
	stop: function(){
		clearTimeout(this._timer);
	},
	_wait_for_start: function(){
		$.ajax({
			url: '/game_synchronizers/wait_for_start/' + RP_Game.id,
			method: 'get',
			dataType: 'json',
			data: {
				'players[]': RP_Players.ids()
			},
			success: function(json){
				this._parse_game_json(json);
			}.bind(this)
		});
	},
	_parse_game_json: function(game_state){
		for(var index in game_state.players_ids_to_remove){
			RP_Players.remove_player(game_state.players_ids_to_remove[index]);
		}

		for(index in game_state.players_to_add){
			RP_Players.add_player(new RP_Player(game_state.players_to_add[index]));
		}

		if(game_state.data_for_start){
			new_hand = new RP_CardsSet(game_state.data_for_start.client_hand);
			RP_Client.set_hand(new_hand);
			delete game_state.data_for_start.client_hand;

			$.extend(RP_Game, game_state.data_for_start);

			RP_Visualizers.Client.update_actions_buttons();

			RP_Game.start();
			RP_Visualizers.Game.update_all();
			RP_Visualizers.Players.update_all();

			// остановить Game синхронизатор
			this.stop();
			// запустить Action синхронизатор
			RP_Synchronizers.Action.start();
		}
	}
};
RP_Synchronizers.Action = {
	_period: 3 * 1000,
	_timer: null,
	_request: null,
	start: function(){

	}
};
RP_Synchronizers.Chat = {
	_period: 5 * 1000,
	_timer: null,
	_request: null,
	start: function(){

	}
};

