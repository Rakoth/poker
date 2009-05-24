Function.prototype.bind = function(object) {
	var __method = this;
	return function() {
		__method.apply(object, arguments);
	}
}

$.extend({
	escape: function(html_to_escape){
		return html_to_escape.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
});

//=============================================================================
$(function(){
	$.extend(Game, GameMethods);
	Game.on_load();
	
	if(Game.is_wait()){
		GameSynchronizer.start();
	}else{
		ActionsSynchronizer.start();
	}
	ChatSynchronizer.last_message_id = Game.last_message_id || 0;
	ChatSynchronizer.start();
});

//=============================================================================
var GameMethods = {
	players_count: 0,
	players: [],
	is_wait: function(){
		return 'waited' == this.status;
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
	small_blind: function(){
		return this.blind_size / 2;
	},
	on_load: function(){
		this._add_players_from_game();
		this._initialize_table_cards();
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
		this.show_necessary_action_buttons();
	},
	_add_players_from_game: function(){
		this._add_players_from_array(this.players_to_load);
		this.players_to_load = null;
	},
	_initialize_table_cards: function(){
		this.flop = new CardsSet('flop', 'game');
		this.turn = new CardsSet('turn', 'game');
		this.river = new CardsSet('river', 'game');
		this.update_cards();
	},
	_add_players_from_array: function(players_array){
		for(var i in players_array){
			this.add_player(players_array[i]);
		}
	},
	add_player: function(player){
		var new_player = new Player(player);
		this.players[player.sit] = new_player;
		ChatSynchronizer.add_system_message('join', new_player.login);
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
			ChatSynchronizer.add_system_message('leave', this.players[sit].login);
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
		return $.map($.grep(this.players, function(player){
			return player;
		}), function(player){
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
	next_turn: function(time_left){
		this.active_player.end_turn();
		// если не началась новая раздача, то продолжаем передавать ход
		if(!this._goto_next_stage()){
			this._set_next_active_player();
			this.active_player.start_turn(time_left);
		}
		this.show_necessary_action_buttons();
	},
	set_active_player: function(){
		var sit;
		$(this.players).each(function(){
			if(this.id == Game.active_player_id){
				sit = this.sit.id;
				return;
			}
		});
		this.active_player = this.players[sit];
		this.active_player_id = null;
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
		$.each(this.players, function(i, player){
			if(player){
				pot += player.in_pot;
			}
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
		var stages_array = ['flop', 'turn', 'river'];
		$.each(stages_array, function(i, stage){
			if(this[stage + '_to_load']){
				if('on_' + stage == Game.status){
					ChatSynchronizer.add_system_message(this[stage + '_to_load'], stage)
				}
				this[stage].set_cards(this[stage + '_to_load']);
			}else{
				this[stage].hide();
			}
		}.bind(this));
	},
	clear_cards: function(){
		this.flop.hide();
		this.turn.hide();
		this.river.hide();
	},
	client_action: function(action_kind){
		action_name = ActionsExecuter.name_by_kind[action_kind];
		action = [this.client_sit, action_kind];
		if('bet' == action_name || 'raise' == action_name){
			value = this.active_player.for_call + parseInt($('#stake_value').attr('value'));
			action.push(value);
		}
		ActionsExecuter.perform(action);
	},
	_goto_next_stage: function(){
		if(this._is_one_winner() || (this._is_next_stage() && this.is_on_river()) || this._is_allin_and_call()){
			GameSynchronizer.new_distribution();
			return true; // new_distribution сам установит нового active_player -а и начнет его ход
		}else{
			if(this._is_next_stage()){
				GameSynchronizer.next_stage();
			}
			return false; // продолжаем передавать ход в обычном порядке
		}
	},
	_is_one_winner: function(){
		var count = 0;
		$.each(this.players, function(i, player){
			if(player && !player.is_fold()){
				count++;
			}
		});
		return (1 == count);
	},
	_is_next_stage: function(){
		var next_stage = true;
		$.each(this.players, function(i, player){
			if(player && !player.has_called() && !player.is_fold()){
				next_stage = false;
				return;
			}
		});
		return next_stage;
	},
	_is_allin_and_call: function(){
		if(0 == $.grep(this.players, function(player){ 
			return player && !player.has_called() && !player.is_fold()
		}).length){
			if($.grep(this.players, function(player){ 
				return player && !player.is_fold() && !player.is_allin()
			}).length <= 1){
				return true;
			}
		}
		return false;
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
	},
	show_final: function(final_in_json){
		this.flop.set_cards(final_in_json.flop);
		this.turn.set_cards(final_in_json.turn);
		this.river.set_cards(final_in_json.river);

		$.each(final_in_json.players, function(){
			if(this.hand){
				Game.players[this.sit].update_hand(this.hand);
			}
		});

		//console.log(final_in_json);
	},
	notify_about_lose: function(){
		ActionsSynchronizer.stop();
		Game.active_player.end_turn();
		//TODO
		alert("Вы проиграли");
		setTimeout("window.close();", 2000);
	},
	notify_about_win: function(){
		alert("Вы выйграли");
		setTimeout("window.close();", 2000);
	},
	client_away: function(){
		$('#away_screen').show();
		$('#away_screen').fadeTo('fast', 0.5);
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
		var last_action_time_left = json.pop();
		this._last_action_id = json.pop();
		var last_action = json.pop();
		$(json).each(function(){
			ActionsExecuter.perform(this);
		});
		//		Game.active_player.set_time_for_action(time);
		ActionsExecuter.perform(last_action, last_action_time_left);
	},
	notify_about_action_timeout: function(player_id){
		// показываем окошко "я вернулся", если это клиент
		if(Game.players[Game.client_sit].id == player_id){
			Game.client_away();
		}
		$.ajax({
			url: '/actions/timeout/',
			type: 'POST',
			data: ({
				game_id: Game.id,
				player_id: player_id
			}),
			error: function(XMLHttpRequest){
				if(HurrySyncErrorStatus == XMLHttpRequest.status){
					setTimeout("ActionsSynchronizer.notify_about_action_timeout(" + player_id + ")", this._notify_period * 1000);
				}
			}
		});
	}
};

var ActionsExecuter = {
	name_by_kind: ['fold', 'check', 'call', 'bet', 'raise'],
	perform: function(action, time_left){
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
		ChatSynchronizer.add_player_action(action_name, value)
		Game.next_turn(time_left);
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
		player.stake(value);
	},
	raise: function(value){
		this.bet(value);
	}
}
//=============================================================================
var GameSynchronizer = {
	_period: 5,
	_show_final_time: 3,
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
			if(json.previous_final){
				Game.show_final(json.previous_final);
				delete json.previous_final;
				setTimeout(function(){
					GameSynchronizer.synchronize_on_new_distribution(json)
				}, this._show_final_time * 1000);
			}else{
				GameSynchronizer.synchronize_on_new_distribution(json);
			}
		});
	},
	synchronize_on_new_distribution: function(game_state_in_json){
		GameSynchronizer.synchronize_players_on_new_distribution(game_state_in_json.players_to_load);
		// сообщаем о проигрыше
		if(undefined == Game.players[Game.client_sit]){
			Game.notify_about_lose();
			return;
		}
		delete game_state_in_json.players_to_load;
		GameSynchronizer.synchronize_game_on_new_distribution(game_state_in_json);
	},
	synchronize_players_on_new_distribution: function(players_state_in_json){
		// удаляем проигравших игроков
		var remained_players_sits = $.map(players_state_in_json, function(player){ 
			return player.sit;
		});
		var players_to_remove = [];
		$.each(Game.players, function(sit, player){
			if(player && -1 == $.inArray(sit, remained_players_sits)){
				players_to_remove.push(player.id);
			}
		});
		$.each(players_to_remove, function(){
			Game.remove_player(this);
		});
		
		// обновляем параметры оставшимся игрокам
		$.each(players_state_in_json, function(){
			sit_id = this.sit;
			delete this.sit;
			$.extend(Game.players[sit_id], this);
			Game.players[sit_id].show_previous_win();
			current_player = Game.players[sit_id];
			current_player.sit.update_stack();
			current_player.sit.update_status();
		});
	},
	synchronize_game_on_new_distribution: function(game_state_in_json){
		$.extend(Game, game_state_in_json);
		Game.update_client_hand();
		Game.update_blinds();
		Game.update_pot();
		Game.clear_cards();

		Game.active_player.end_turn();
		Game.on_start();
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
var ChatSynchronizer = {
	_period: 5,
	last_message_id: 0,
	start: function(){
		this._timer = setInterval(this._check_for_new_messages.bind(this), this._period * 1000);
	},
	_check_for_new_messages: function(){
		$.getJSON(
			'/log_messages',
			{
				'last_message_id': this.last_message_id,
				'game_id': Game.id
			},
			this._add_messages.bind(this)
		);
	},
	_add_messages: function(json){
		$.each(json, function(i, message){
			this.last_message_id = message.id;
			this.add_player_message(message.login, message.text);
		}.bind(this));
	},
	add_player_message: function(login, text){
		var user_message = this._build_user_message(login, text);
		this._add_to_log(user_message);
	},
	add_client_message: function(text){
		this.add_player_message(Game.players[Game.client_sit].login, text);
	},
	add_player_action: function(action_name, value){
		var player_action = this._build_player_action(action_name, value);
		this._add_to_log(player_action);
	},
	add_system_message: function(text, title){
		var system_message;
		if(title){
			system_message = this._build_system_message_with_title(title, text);
		}else{
			system_message = this._build_system_message_without_title(text);
		}
		this._add_to_log(system_message);
	},
	_build_user_message: function(login, text){
		return '<div class="log_record">' +
			'<span class="log_user_login">' + $.escape(login) + ': </span>' +
			'<span class="log_message_text">' + $.escape(text) + '</span>' +
		'</div>';
	},
	_build_player_action: function(action, value){
		var text = value ? action + ' to ' + value : action;
		return this._build_system_message_with_title(Game.active_player.login, text);
	},
	_build_system_message_with_title: function(title, text){
		return '<div class="log_record">' +
			'<span class="log_player_login">' + $.escape(title) + ': </span>' +
			'<span class="log_action_body">' + $.escape(text) + '</span>' +
		'</div>';
	},
	_build_system_message_without_title: function(text){
		return '<div class="log_record">' +
			'<span class="log_action_body">' + $.escape(text) + '</span>' +
		'</div>';
	},
	_add_to_log: function(html){
		$('#log_body').html(html + $('#log_body').html());
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
		this.sit.cards.hide();
		this.status = 'pass';
	},
	is_fold: function(){
		return 'pass' == this.status || 'pass_away' == this.status;
	},
	has_called: function(){
		return (
		0 == this.for_call &&
			(this.id == Game.active_player.id || this.sit.id != Game.blind_position || Game.current_bet != Game.blind_size)
	);
	},
	is_allin: function(){
		return 0 == this.stack;
	},
	add_for_call: function(value){
		this.for_call += value;
		//this.sit.for_call.update(this.for_call);
	},
	show_previous_win: function(){
		if(0 != this.previous_win){
			var text = 'win ' + this.previous_win;
			ChatSynchronizer.add_system_message(text, this.login)
		}
		//TODO
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
		this.hand_to_load = new_hand_string;
		this.sit.update_hand();
	},
	start_turn: function(time_left){
		this.timer.start(time_left);
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
	this.cards = new CardsSet('cards_' + this.id, 'player');
	if(this.player.hand_to_load){
		this.update_hand();
	}
	this.update_status();
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
		switch(this.player.status){
			case 'pass': this.cards.hide(); break;
			case 'pass_away': this.cards.hide(); break;
			case 'active': /*this.cards.show(); */ break;
			default:
				//this.cards.show();
				break;
		}
		//this.status.text(new_value);
	},
	update_stack: function(){
		this.stack.text(this.player.stack);
	},
	update_hand: function(){
		this.cards.set_cards(this.player.hand_to_load);
		//this.player.hand.show('card_' + this.id);
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
	this._activated = false;

	$.extend(this, PlayerTimerMethods);
};
var PlayerTimerMethods = {
	start: function(time){
		if(!this._activated){
			this._activated = true;
			this._set_time(time);
			this._timer = setInterval(this._reduce_time.bind(this), 1000);
		}
	},
	stop: function(){
		if(this._activated){
			this._activated = false;
			window.clearTimeout(this._timer);
			this._set_time(0);
		}
	},
	_set_time: function(time){
		if(undefined == time || time < 0 || Game.time_for_action < time){
			time = Game.time_for_action;
		}
		this.time = time;
		this.player.sit.update_timer();
	},
	_reduce_time: function(){
		if(this.time  && 0 < this.time){
			this._set_time(this.time - 1);
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
	};
};

//=============================================================================
var CardsSet = function(container_id, type){
	this.container_id = '#' + container_id;
	this.type = type; // 'player' или 'game'

	$.extend(this, CardsSetMethods);
};
var CardsSetMethods = {
	set_cards: function(cards_string){
		this.cards = $($(cards_string.split(':')).map(function(){
			return new Card(this);
		}));
		// устанавливаем нужные src соответствующим элементам на странице
		this.cards.each(function(i, card){
			$(this.container_id + '_' + i).attr('src', card.src).attr('alt', card.alt);
		}.bind(this));
		this._show();
	},
	_show: function(){
		$(this.container_id).show();
	},
	hide: function(){
		switch(this.type){
			case 'player':
				if(this.cards){
					this.cards = this.cards.map(function(i){
						$(this.container_id + '_' + i).attr('src', defaultCard.src).attr('alt', defaultCard.alt);
						return null;
					}.bind(this));
				}
				break;
			case 'game':
				$(this.container_id).hide();
				break;
			default:
				alert('Error in CardsSet#hide');
				break;
		}
	}
};

//=============================================================================
var Card = function(card_string){
	this.suit = card_string.split('')[0];
	this.value = card_string.split('')[1];
	this.src = '/images/game/cards/' + card_string + '.gif';
	this.alt = card_string;
};
var defaultCard = {
	src: '/images/game/cards/default.gif',
	alt: 'RP'
};