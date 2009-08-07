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

RP_Extend.update = function(new_state){ // принимает Hash
	for(var key in new_state){
		var method_name = 'set_' + key;
		if($.isFunction(this[method_name])){
			this[method_name](new_state[key]);
			delete new_state[key];
		}
	}

	$.extend(this, new_state);
};

$(function(){
	$('#veil').click(RP_Visualizers.Game.hide_previous_final.bind(RP_Visualizers.Game));
	
	if(RUN_TESTS){
		RP_Tests.run_all();
		return;
	}

	RP_Game.on_load();

	RP_Client.initialize();

	if(RP_Game.is_wait()){
		RP_Synchronizers.Game.start();
	}else{
		RP_Synchronizers.Action.start();
	}
	RP_Synchronizers.Chat.start();
});

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
	_show_previous_final_time: 3 * 1000,
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
	_hide_stage_cards: function(){
		$('#' + this._stage).hide();
		this._set_stage_cards();
	},
	_show_stage_cards: function(){
		this._set_stage_cards();
		$('#' + this._stage).show();
	},
	update_stage_cards: function(stage){
		this._stage = stage;
		if(RP_DefaultCards[stage] == RP_Game.table_cards[stage]){
			this._hide_stage_cards();
		}else{
			this._show_stage_cards();
		}
	},
	_set_stage_cards: function(){
		RP_Game.table_cards[this._stage].each(function(i, card){
			this._stage_card(i).attr({
				src: card.src,
				alt: card.alt
			});
		}.bind(this));
	},
	_stage_card: function(index){
		return $('#' + this._stage + '_' + index);
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
	},
	hide_previous_final: function(){
		$('#veil').hide();
		$('#previous_final').remove();
		$('#room').show();
		clearTimeout(this._previous_final_timer);
	},
	show_previous_final: function(){
		$('#room').hide();
		$('#room').clone().attr('id', 'previous_final').appendTo('body').show();
		$('#veil').fadeTo(0, 0.05);
		$('#veil').show();
		this._previous_final_timer = setTimeout(this.hide_previous_final.bind(this), this._show_previous_final_time);
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
	update_status: function(){
		if(this.player.is_away()){
			this.away();
		}else{
			this.active();
		}
		if(this.player.is_fold()){
			this.in_fold();
		}else{
			this.unfold();
		}
	},
	update_hand: function(){
		$.each(this._hand(), function(i, card_img){
			var player_card = this.player.hand.card(i);
			card_img.attr({
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
		this.update_status();
		this.update_hand();
	},
	leave: function(){
		this._sit().hide('slow');
	},
	away: function(){

	},
	active: function(){

	},
	in_fold: function(){

	},
	unfold: function(){

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
var RP_GameMethods = {
	table_cards: {
		flop: null,
		turn: null,
		river: null
	},
	_stage_name: {
		'on_preflop': 'preflop',
		'on_flop': 'flop',
		'on_turn': 'turn',
		'on_river': 'river'
	},
	view: RP_Visualizers.create('Game'),
	stage: function(){
		return this._stage_name[this.status];
	},
	clear_table_cards: function(){
		for(var stage in this.table_cards){
			this.set_stage_cards(stage, RP_DefaultCards[stage], true);
		}
	},
	set_stage_cards: function(stage, cards, is_skip_logging){
		this.table_cards[stage] = cards;
		if(!is_skip_logging && this.is_on_stage(stage)){
			RP_Log.game_stage();
		}
		this.view('update_stage_cards', stage);
	},
	is_wait: function(){
		return 'waited' == this.status;
	},
	is_on_stage: function(stage_name){
		return stage_name == this.stage();
	},
	_is_on_river: function(){
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
		// показать кнопки действий клиенту
		RP_Client.view('update_actions_buttons');
	},
	_take_blinds: function(){
		if(0 < RP_Game.ante){
			RP_Players.each(function(player){
				player.take_chips(RP_Game.ante);
			});
		}
		// снимаем большой блайнл с увеличением for_call для остальных
		this._player_on_blind().stake(RP_Game.blind_size);
		// просто снимаем малый блайнд
		this._player_on_small_blind().take_chips(RP_Game.small_blind_size());
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

		// отрисовка состояния игры
		this.view('update_all');
	},
	initialize_table_cards: function(){
		for(var stage in RP_Game.cards_to_load){
			if(RP_Game.cards_to_load[stage]){
				this.table_cards[stage] = new RP_CardsSet(RP_Game.cards_to_load[stage]);
				if(RP_Game.is_on_stage(stage)){
					RP_Log.game_stage();
				}
			}
		}
		delete RP_Game.cards_to_load;
	},
	current_stage_cards: function(){
		return this.table_cards[this.stage()];
	},
	_is_need_start_timer: function(){
		return this.is_started() && !this.is_paused();
	},
	_load_players: function(){
		$.each(this.players_to_load, function(){
			RP_Players.add_player(new RP_Player(this));
		});
		delete this.players_to_load;
//		for(var index in this.players_to_load){
//			RP_Players.add_player(new RP_Player(this.players_to_load[index]));
//		}
	},
	is_new_distribution: function(){
		return (this._is_one_winner() || (this.is_next_stage() && this._is_on_river()) || this._is_allin_and_call());
	},
	is_next_stage: function(){
		return RP_Players.is_all_acted();
	},
	_is_one_winner: function(){
		return 1 == RP_Players.still_in_game_count();
	},
	_is_allin_and_call: function(){
		return (0 == RP_Players.must_call_count() && RP_Players.has_chips_and_can_act_count() <= 1);
	},
	next_distribution: function(){
		RP_Players.refresh_acted_flags();
		RP_Synchronizers.Game.distribution();
	},
	update: RP_Extend.update,
	set_next_level_time: function(new_time){
		this.next_level_time = new_time;
		//TODO
	},
	set_client_hand: function(new_hand_in_str){
		RP_Client.set_hand(new RP_CardsSet(new_hand_in_str));
	}
};

//=============================================================================
var RP_Player = function(params){
	var default_params = {
		stack: RP_Game.start_stack,
		in_pot: 0,
		for_call: 0,
		hand: RP_DefaultCards.hand,
		status: 'active'
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
		this.take_chips(full_value);
	},
	take_chips: function(value){
		if(this.stack <= value){
			value = this.stack;
			this.set_status('allin');
		}
		this.stack -= value;
		this.in_pot += value;
		if(value < this.for_call){
			this.for_call -= value;
		}else{
			this.for_call = 0;
		}
		this.view('update_stack');
		RP_Game.view('update_pot');
	},
	add_for_call: function(value){
		this.for_call += value;
	},
	active: function(){
		this.set_status('active');
	},
	away: function(){
		this.set_status('away');
	},
	absent: function(){
		this.set_status('absent');
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
	set_status: function(status){
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
		this.view('update_status');
	},
	set_hand: function(cards){
		this.hand = cards;
		this.view('update_hand');
	},
	set_stack: function(new_value){
		this.stack = new_value;
		this.view('update_stack');
	},
	set_previous_win: function(win_value){
		if(0 < win_value){
			RP_Log.player_action(this, 'win', win_value);
		}
	},
	update: RP_Extend.update,
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
		// нужно ли показать клиенту away_dialog
		if(this.is_away()){
			this.view('away');
		}
		this.view('update_actions_buttons');
	},
	_player: function(){
		return RP_Players.at_sit(this.sit);
	},
	hand: function(){
		return this._player().hand;
	},
	set_hand: function(new_hand){
		this._player().set_hand(new_hand);
	},
	is_away: function(){
		return this._player().is_away();
	},
	is_a: function(player){
		return this.sit == player.sit;
	},
	action: function(kind, value){
		RP_Timer.stop();
		new RP_Action({
			player_id: this._player().id,
			kind: kind,
			value: value,
			time_for_next_player: RP_Game.time_for_action
		}).execute();
	},
//	is_turn: function(){
//		return RP_Timer.is_turn_of(this.player());
//	},
	is_see_button: function(action_name){
		if(RP_Timer.is_turn_of(this._player())){
			switch(action_name){
				case 'fold': return true;
				case 'check': return (0 == this._player().for_call);
				case 'call': return (0 < this._player().for_call);
				case 'bet': return (RP_Game.current_bet == RP_Game.blind_size && this._player().for_call < this._player().stack);
				case 'raise': return (RP_Game.blind_size < RP_Game.current_bet && this._player().for_call < this._player().stack);
				default: alert('Error in RP_Client.is_see_button(). Unexpected param: ' + action_name); return false;
			}
		}else{
			return false;
		}
	},
	is_lose: function(){
		return undefined == this._player();
	}
};

//=============================================================================
var RP_ActionTimeoutNotificator = {
	_period: 3 * 1000,
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
							this._period
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
	count: 0,
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
		this.count++;

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
			this.count--;
			removed_player.view('leave');
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
	refresh_acted_flags: function(){
		$.each(this._still_in_game_players(), function(){
			this.act_in_this_round = false;
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
	this.player = RP_Players.find(this.player_id);
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
	name: function(){
		return this._name_by_kind[this.kind]
	},
	_is_last_omitted_action: function(){
		return this.time_for_next_player != undefined
	},
	_is_auto_action: function(){
		return this.kind < 0;
	},
	execute: function(){
		// влияние действия на стэки и состояние игроков
		this._influence();

		// продолжение раздачи(проверка на новую раздачу или изменение стадии)
		if(!RP_Game.is_paused()){
			this._proceed_distribution();
		}else{
			RP_Synchronizers.Game.next_distribution();
			return false;
		}

		// проверка на старт таймера и запуск
		if(this._is_last_omitted_action()){
			if(this._is_last_action_before_distribution){
				RP_Timer.start(RP_Players.find(RP_Game.active_player_id), this.time_for_next_player);
			}else{
				RP_Timer.start(this.player.next_active(), this.time_for_next_player);
			}
		}

		// обновление состояния игры и игроков
		RP_Game.view('update_all');
		RP_Players.view('update_all');
		RP_Client.view('update_actions_buttons');

		return true;
	},
	_influence: function(){
		if(this._is_auto_action()){
			this.player.away();
		}else{
			this.player.active();
		}
		this[this.name()]();
		this.player.act_in_this_round = true;
	},
	fold: function(){
		this.player.set_status('fold');
	},
	check: function(){
	},
	call: function(){
		this.player.stake(0);
	},
	bet: function(){
		this.player.stake(this.value);
		RP_Players.refresh_acted_flags();
	},
	raise: function(){
		this.bet();
	},
	_proceed_distribution: function(){
		if(RP_Game.is_new_distribution()){
			RP_Synchronizers.Game.distribution();
			this._is_last_action_before_distribution = true;
		}else{
			if(RP_Game.is_next_stage()){
				RP_Synchronizers.Game.stage();
			}
		// иначе ничего не делаем
		}
	}
};

//=============================================================================
var RP_CardsSet = function(cards_in_str){
	this._cards = $.map(cards_in_str.split(':'), function(card){
		return new RP_Card(card);
	});
};
RP_CardsSet.prototype = {
	card: function(index){
		return this._cards[index] || RP_DefaultCards.card;
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

var RP_Card = function(card_in_str){
	this.src = '/images/game/cards/' + card_in_str + '.gif';
	this.alt = card_in_str.replace(/T/g, '10');
};

var RP_DefaultCards = {
	card: new RP_Card('RP'),
	hand: new RP_CardsSet('RP:RP'),
	flop: new RP_CardsSet('RP:RP:RP'),
	turn: new RP_CardsSet('RP'),
	river: new RP_CardsSet('RP')
};

//=============================================================================
var RP_Log = {
	view: RP_Visualizers.create('Log'),
	player_action: function(player, action, value){
		this._system_message(player.login, action + ' ' + value);
	},
	game_stage: function(){
		this._system_message(RP_Game.stage(), RP_Game.current_stage_cards().alt());
	},
	new_player: function(player){
		this._system_message(player.login, 'join');
	},
	_system_message: function(title, body){
		$.debug([title, body], !RUN_TESTS);
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
			success: this._parse_game_json.bind(this)
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

			RP_Game.update(game_state.data_for_start)

			RP_Game.start();

			RP_Client.view('update_actions_buttons');
			RP_Game.view('update_all');

			// остановить Game синхронизатор
			this.stop();
			// запустить Action синхронизатор
			RP_Synchronizers.Action.start();
		}
	},
	distribution: function(){
		$.ajax({
			async: false,
			url: '/game_synchronizers/distribution/' + RP_Game.id,
			method: 'get',
			dataType: 'json',
			success: this._sync_on_distribution.bind(this)
		});
	},
	_sync_on_distribution: function(json){
		if(json.previous_final){
			$.each(json.previous_final.players, function(){
				RP_Players.at_sit(this.sit).set_hand(new RP_CardsSet(this.hand));
			});
			for(var stage in RP_Game.table_cards){
				if(json.previous_final[stage]){
					RP_Game.set_stage_cards(stage, new RP_CardsSet(json.previous_final[stage]), true);
				}
			}
			RP_Game.view('show_previous_final');
		}
		delete json.previous_final;

		this._sync_players_on_distribution(json.players_to_load);
		delete json.players_to_load;

		if(RP_Client.is_lose()){
			// RP_Client.view('show_lose');
			alert(1);
			return;
		}
		RP_Game.clear_table_cards();
		RP_Game.update(json);
	},
	_sync_players_on_distribution: function(players_array){
		var remained_players_ids = $.map(players_array, function(player){
			return player.id;
		});
		$.each(RP_Players.ids(), function(){
			var index = $.inArray(parseInt(this), remained_players_ids);
			if(-1 == index){
				RP_Players.remove_player(this);
			}else{
				RP_Players.find(this).update(players_array[index]);
				RP_Players.find(this).set_hand(RP_DefaultCards.hand);
			}
		});
	},
	stage: function(){
		$.ajax({
			async: false,
			url: '/game_synchronizers/stage/' + RP_Game.id,
			method: 'get',
			dataType: 'json',
			data: {stage: RP_Game.status},
			success: this._sync_on_stage.bind(this)
		});
	},
	_sync_on_stage: function(json){
		RP_Game.status = json.status;
		RP_Game.set_stage_cards(RP_Game.stage(), new RP_CardsSet(json.cards));
		RP_Players.refresh_acted_flags();
	}
};
RP_Synchronizers.Action = {
	_period: 6 * 1000,
	_timer: null,
	_request: null,
	_last_action_id: 0,
	start: function(){
		this._last_action_id = RP_Game.last_action_id || this._last_action_id;
		delete RP_Game.last_action_id;
		this._timer = setInterval(this._get_omitted_actions.bind(this), this._period);
	},
	stop: function(){
		clearInterval(this._timer);
	},
	_get_omitted_actions: function(){
		if($.is_request_ready(this._request)){
			this._request = $.ajax({
				url: '/actions/omitted',
				method: 'get',
				dataType: 'json',
				data: {
					game_id: RP_Game.id,
					last_action_id: this._last_action_id
				},
				success: function(json){
					this._parse_actions_json(json);
				}.bind(this)
			});
		}
	},
	_parse_actions_json: function(omitted_actions){
		if(omitted_actions){
			this._last_action_id = omitted_actions.last_action_id;
			
			RP_Timer.stop();

			$.each(omitted_actions.actions, function(){
				var is_continue_execution = new RP_Action(this).execute();
				if(!is_continue_execution){
					return;
				}
			});
		}
	}
}; 
RP_Synchronizers.Chat = {
	_period: 5 * 1000,
	_timer: null,
	_request: null,
	_last_message_id: 0,
	start: function(){
		this._last_message_id = RP_Game.last_message_id || 0;
		delete RP_Game.last_message_id;
		//TODO
	}
};
