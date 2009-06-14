//=============================================================================
//$(function(){
//	$.extend(Game, GameMethods);
//	Game.on_load();
//
//	if(Game.is_wait()){
//		GameSynchronizer.start();
//	}else{
//		ActionsSynchronizer.start();
//	}
//	ChatSynchronizer.last_message_id = Game.last_message_id || 0;
//	ChatSynchronizer.start();
//});

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
	is_paused: function(){
		return (null != this.paused);
	},
	small_blind: function(){
		return this.blind_size / 2;
	},
	minimal_bet: function(){
		return this.blind_size;
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
		this._init_client_actions_area();
	},
	on_start: function(){
		this.set_active_player();
		if(!this.is_paused()){
			this.active_player.start_turn(this.action_time_left);
		}
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
			//TODO брать значение со слайдера
			value = this.active_player.for_call + parseInt($('#stake_value').val());
			action.push(value);
		}
		ActionsExecuter.perform(action);
	},
	_goto_next_stage: function(){
		if(!this.is_paused()){
			if(this._is_new_distribution()){
				this._refresh_players_acted_flag();
				GameSynchronizer.new_distribution();
				return true; // new_distribution сам установит нового active_player -а и начнет его ход
			}else{
				if(this._is_next_stage()){
					this._refresh_players_acted_flag();
					GameSynchronizer.next_stage();
				}
				return false; // продолжаем передавать ход в обычном порядке
			}
		}
		return false;
	},
	_is_new_distribution: function(){
		return this._is_one_winner() || (this._is_next_stage() && this.is_on_river()) || this._is_allin_and_call();
	},
	_refresh_players_acted_flag: function(){
		$.each(this.players, function(){
			if(this){
				this.act_in_this_round = false;
			}
		});
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
			if(player && !player.act_in_this_round){ // !player.has_called() && !player.is_fold()){
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
			if(Game._is_need_show_button(this.id)){
				$(this).show();
			}else{
				$(this).hide();
			}
		});
	},
	_is_need_show_button: function(action_name){
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
		away_dialog.dialog('open');
	},
	is_last_active: function(){
		return 1 == $.grep(this.players, function(player){ 
			return player && player.is_active();
		}).length;
	},
	resume: function(){
		Game.paused = null;
		Game.active_player.start_turn();
	},
	_init_client_actions_area: function(){
		$('#stake_slider').slider({
			value:Game.minimal_bet(),
			min: Game.minimal_bet(),
			max: Game.players[Game.client_sit].stack,
			step: Game.small_blind(),
			slide: function(event, ui) {
				$("#stake_value").attr('value', ui.value);
			}
		});
		
		$("#stake_value").val($("#stake_slider").slider("value"));

		$('#stake_value').change(function(){
			var slider_value = parseInt($(this).attr('value'));
			if(Game.minimal_bet() <= slider_value && slider_value <= Game.players[Game.client_sit].stack){
				$('#stake_slider').slider('value', slider_value);
			}else{
				var stake_value;
				if(slider_value < Game.minimal_bet()){
					stake_value = Game.minimal_bet();
				}else{
					stake_value = Game.players[Game.client_sit].stack;
				}
				$('#stake_slider').slider('value', stake_value);
				$(this).attr('value', stake_value);
			}
		});
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
		this._timer = setInterval(this._get_ommited.bind(this), this._period * 1000);
	},
	restart: function(new_period){
		this._period = new_period;
		this.stop();
		this.start();
	},
	stop: function(){
		clearTimeout(this._timer);
	},
	_get_ommited: function(){
		if($.is_request_ready(this._currentRequest)){
			this._currentRequest = $.getJSON(
				'/actions/omitted',
				{
					game_id: Game.id,
					last_action_id: this._last_action_id
				},
				this._perform.bind(this)
				);
		}
	},
	_perform: function(json){
		var last_action_time_left = json.pop();
		this._last_action_id = json.pop();
		var last_action = json.pop();
		$(json).each(function(){
			ActionsExecuter.perform(this);
		});
		
		ActionsExecuter.perform(last_action, last_action_time_left);
	},
	notify_about_action_timeout: function(player_id){
		// показываем окошко "я вернулся", если это клиент
		if(Game.players[Game.client_sit].id == player_id){
			Game.client_away();
		}
		if($.is_request_ready(this._notifyRequest)){
			this._notifyRequest = $.ajax({
				url: '/actions/timeout',
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
	}
};

var ActionsExecuter = {
	name_by_kind: {
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
	perform: function(action, time_left){
		var player_sit = action.shift();
		Game.active_player = Game.players[player_sit];
		var kind = action[0];
		// тип < 0 имеют автоматические действия, и действия по таймауту
		if(kind < 0){
			Game.active_player.set_status('away');
		}else{
			Game.active_player.set_status('active');
		}
		action_name = this.name_by_kind[kind];
		if(action.length == 1){
			ActionsInfluence[action_name]();
			ChatSynchronizer.add_player_action(action_name);
		}else{
			var value = action[1];
			ChatSynchronizer.add_player_action(action_name, value - Game.active_player.for_call);
			ActionsInfluence[action_name](value);
		}
		Game.players[Game.active_player.sit.id].act_in_this_round = true;
		this._show_action(action_name);
		Game.next_turn(time_left);
	},
	_show_action: function(action_name){
		Game.active_player.say_action(action_name);
	}
};
ActionsInfluence = {
	fold: function(){
		Game.active_player.set_status('fold');
	},
	check: function(){},
	call: function(){
		player = Game.active_player;
		player.stake(player.for_call);
	},
	bet: function(value){
		player = Game.active_player;
		player.stake(value, true);
		$.each(Game.players, function(){
			if(this && this.id != Game.active_player.id){
				this.act_in_this_round = false;
			}
		});
	},
	raise: function(value){
		this.bet(value);
	}
}
//=============================================================================
var GameSynchronizer = {
	_period: 5,
	_show_final_time: 4,
	start: function(){
		this._timer = setInterval(this._check_for_new_players.bind(this), this._period * 1000);
	},
	_check_for_new_players: function(){
		var players = Game.get_players_ids();
		$.getJSON(
			'/game_synchronizers/wait_for_start/' + Game.id,
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
	paused_by_away: function(){
		$.ajax({
			async: false,
			url: '/game_synchronizer/' + Game.id + '/really_pause',
			success: function(){
				Game.paused = 'by_away';
				Game._refresh_players_acted_flag();
				GameSynchronizer.new_distribution();
				ChatSynchronizer.stop();
			}
		});
	},
	new_distribution: function(){
		$.getJSON('/game_synchronizers/distribution/' + Game.id, function(json){
			if(json.previous_final){
				Game.show_final(json.previous_final);
				delete json.previous_final;
				setTimeout(function(){
					GameSynchronizer.synchronize_on_new_distribution(json)
				}, this._show_final_time * 1000);
			}else{
				GameSynchronizer.synchronize_on_new_distribution(json);
			}
		}.bind(this));
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
		$.ajax({
			async: false,
			type: "GET",
			url: '/game_synchronizers/stage/' + Game.id,
			data: {
				current_status: Game.status
			},
			dataType: 'json',
			success: function(json){
				$.extend(Game, json);
				Game.update_cards();
			}
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
	stop: function(){
		clearTimeout(this._timer);
	},
	_check_for_new_messages: function(){
		if($.is_request_ready(this._currentRequest)){
			this._currentRequest = $.getJSON(
				'/log_messages',
				{
					'last_message_id': this.last_message_id,
					'game_id': Game.id
				},
				this._add_messages.bind(this)
				);
		}
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
		'<span class="log_user_login">' + $.escape_html(login) + ': </span>' +
		'<span class="log_message_text">' + $.escape_html(text) + '</span>' +
		'</div>';
	},
	_build_player_action: function(action, value){
		var text = action;
		text += value ? ' to ' + value : '';
		return this._build_system_message_with_title(Game.active_player.login, text);
	},
	_build_system_message_with_title: function(title, text){
		return '<div class="log_record">' +
		'<span class="log_player_login">' + $.escape_html(title) + ': </span>' +
		'<span class="log_action_body">' + $.escape_html(text) + '</span>' +
		'</div>';
	},
	_build_system_message_without_title: function(text){
		return '<div class="log_record">' +
		'<span class="log_action_body">' + $.escape_html(text) + '</span>' +
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
	stake: function(value, increase_current_bet){
		if(this.for_call < value){
			var raise = value - this.for_call;
			Game.add_for_call_exept_sit(raise, this.sit);
			if(increase_current_bet){
				Game.current_bet += raise;
			}
		}
		this._update_stack(value, 'out');
		Game.update_pot();
	},
	set_status: function(status){
		var new_status;
		switch(status){
			case 'away':
				if('pass' == this.status){
					new_status = 'pass_away';
				}else{
					new_status = 'absent';
				}
				if(Game.is_last_active()){
					GameSynchronizer.paused_by_away();
				}
				break;
			case 'fold':
				if('absent' == this.status){
					new_status = 'pass_away';
				}else{
					new_status = 'pass';
				}
				break;
			case 'active':
				new_status = 'active';
				break;
			case 'allin':
				new_status = 'allin';
				break;
			default:
				new_status = status;
				break;
		}
		this.status = new_status;
		this.sit.update_status();
	},
	is_fold: function(){
		return 'pass' == this.status || 'pass_away' == this.status;
	},
	is_active: function(){
		return !this.is_away();
	},
	is_away: function(){
		return 'absent' == this.status || 'pass_away' == this.status;
	},
	has_called: function(){
		return (
			0 == this.for_call// &&
			//(this.id == Game.active_player.id || this.sit.id != Game.blind_position || Game.current_bet != Game.blind_size)
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
			if(this.stack < value){
				value = this.stack;
			}
			this.stack -= value;
			this.in_pot += value;
		}else{
			this.stack += value;
			this.in_pot = 0;
		}
		this.for_call = 0;

		if(0 == this.stack){
			this.set_status('allin');
		}

		this.sit.update_stack();
		this.sit.update_in_pot(this.in_pot);
	//this.sit.for_call.update(this.for_call);
	},
	update_hand: function(new_hand_string){
		this.hand_to_load = new_hand_string;
		this.sit.update_hand();
	},
	start_turn: function(time_left){
		if(!Game.is_paused()){
			this.set_status('active');
		}
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
	this.timer = $('#timer_' + this.id);
	this.stack = $('#stack_' + this.id).text(player.stack);
	this.last_action = $('#last_action_' + this.id);
	this.for_call = null;
	this.in_pot = null;
	this.away_layer = $('#away_layer_' + this.id);

	if(this.player.hand_to_load){
		this.update_hand();
	}
	this.update_status();
};

var PlayerSitMethods = {
	update_timer: function(){
		this.timer.attr('src', this._timer_src());
	},
	update_in_pot: function(new_value){
	//this.in_pot.text(new_value);
	},
	update_stack: function(){
		var stack_text = this.player.stack || 'allin';
		this.stack.text(stack_text);
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
	},
	player_away: function(){
		this.away_layer.show();
		this.away_layer.fadeTo('fast', 0.5);
	},
	player_fold: function(){
		this.cards.hide();
	},
	player_active: function(){
		this.away_layer.hide();
		this.cards.show();
	},
	update_status: function(){
		this.player_active();
		switch(this.player.status){
			case 'active':
				break;
			case 'pass':
				this.player_fold();
				break;
			case 'absent':
				this.player_away();
				break;
			case 'allin':
				break;
			case 'pass_away':
				this.player_fold();
				this.player_away();
				break;
			default:
				break;
		}
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
		this.show();
	},
	show: function(){
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
				$(this.container_id).dropOut('slow');
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


//=============================================================================
//=============================================================================
//=============================================================================

Function.prototype.bind = function(object){
	var __method = this;
	return function() {
		__method.apply(object, arguments);
	}
}

$.extend({
	escape_html: function(html_to_escape){
		return html_to_escape.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	is_request_ready: function(request){
		return (!request || 0 == request.readyState || 4 == request.readyState)
	},
	isArray: function(object) {
		return object && object.constructor === Array;
	},
	debug: function(variable_or_vars_array, condition){
		if($.browser.mozilla){
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
});

RP_IS_TEST = true;

$(function(){
	RP_Client.sit = RP_Game.client_sit;
	delete RP_Game.client_sit;

	$.extend(RP_Game, RP_GameMethods);


	if(RP_IS_TEST){
		RP_RunAllTests();
	}else{
		RP_EventsQueue.start();
		RP_Event.initialize('Game', 'on_load');
		if(RP_Game.is_wait()){
			RP_Event.initialize('Syncronize', 'game');
		}else{
			RP_Event.initialize('Syncronize', 'action');
		}
	}
});

//=============================================================================
// В очередь, сукины дети, в очередь!!!
var RP_EventsQueue = {
	live_time: 0,
	_normal_tact_time: 500,
	_current_tact_time: 500,
	_delay_before_next_event: 0,
	_tacts_timer: null,
	_primary_queue: [],
	_main_queue: [],
	_synchronize_queue: [],
	start: function(){
		this._tacts_timer = setInterval(this.process.bind(this), this._current_tact_time);
	},
	restart: function(new_speed){
		this._set_tact_time(new_speed);
		clearTimeout(this._tacts_timer);
		this.start();
	},
	add_event: function(new_event){
		new_event.add_at = this.live_time;
		this['_' + new_event.queue_level + '_queue'].push(new_event);
		
		$.debug(['ADD', new_event.group, new_event.type, new_event], new_event.queue_level != 'synchronize' && !RP_IS_TEST);
	},
	process: function(){
		this.live_time++;
		// если отрисовка предыдущего события окончена, то
		if(this._is_ready_for_event()){
			// выполняем события, пока не будет установлено время на отрисовку
			// события, или пока они не закончатся
			while(this._is_any_event_exists() && this._is_ready_for_event()){
				var current_event = null;
				// если в первостепенной очереди есть события, то взять первое из них
				if(this._is_primary_event_exists()){
					current_event = this._primary_queue.shift();
				// иначе взять первое событие из главной очереди
				}else{
					if(this._is_main_event_exists()){
						current_event = this._main_queue.shift();
					}
				}
				// если событеи получено, то установить время его отрисовки и начать выполнение
				if(current_event){
					this._set_delay_before_next_event(current_event.view_time);
					current_event.execute();

					$.debug(['EXECUTE', current_event.group, current_event.type, current_event]);
				}
			}
		// иначе ждем завершения отрисовки предыдущего действия
		}else{
			this._delay_before_next_event--;
		}
		// обработка очереди действий синхронизации
		var sync_events_count = this._synchronize_queue.length;
		for(var i = 0; i < sync_events_count; i++){
			var sync_event = this._synchronize_queue.shift();
			var is_time_to_synch = (0 == (this.live_time % (sync_event.period_in_sec * 1000 / this._normal_tact_time)));
			if(is_time_to_synch){
				sync_event.execute();
			}else{
				this.add_event(sync_event);
			}
		}
	},
	count_all: function(){
		return this._primary_queue.length + this._main_queue.length + this._synchronize_queue.length;
	},
	clear_all: function(){
		with(this){
			_primary_queue = [];
			_main_queue = [];
			_synchronize_queue = [];
		}
	},
	_is_ready_for_event: function(){
		return 0 == this._delay_before_next_event;
	},
	_is_any_event_exists: function(){
		return this._is_primary_event_exists() || this._is_main_event_exists();
	},
	_is_primary_event_exists: function(){
		return 0 < this._primary_queue.length;
	},
	_is_main_event_exists: function(){
		return 0 < this._main_queue.length;
	},
	_is_system_event_exists: function(){
		return 0 < this._system_queue.length;
	},
	_set_tact_time: function(new_speed){
		var time_factor;
		switch(new_speed){
			case 'very_fast': time_factor = 0.2; break;
			case 'fast': time_factor = 0.5; break;
			case 'normal': time_factor = 1; break;
			case 'slow': time_factor = 2; break;
			default: time_factor = 1; break;
		}
		this._current_tact_time = this._normal_tact_time * time_factor;
	},
	_set_delay_before_next_event: function(event_time){
		var time_in_tacts = event_time * 1000 / this._normal_tact_time;
		this._delay_before_next_event = time_in_tacts;
	}
};

//=============================================================================
var RP_Event = {
	initialize: function(group, type, event_params){
		$.debug([group, type], undefined == this[group][type]);
		
		var new_event = new this[group][type]();

		var params = event_params || {};
		params.view_time = (undefined == new_event.view_time ? RP_Event[group].default_view_time_in_sec : new_event.view_time);
		params.queue_level = new_event.queue_level || RP_Event[group].queue_level;
		$.extend(new_event, params, {
			group: group,
			type: type
		});
		new_event.helpers = RP_EventHelpers[group];
		
		RP_EventsQueue.add_event(new_event);
	},
	Player: {
		queue_level: 'main',
		default_view_time_in_sec: 1,
		action: function(){
			this.execute = function(){
				var target_player = RP_Players.find(this.player_id);
				this.helpers.execute_action(target_player, this.kind, this.value);
			};
		},
		join: function(){
			this.view_time = 0;
			this.queue_level = 'primary';
			this.execute = function(){
				var new_player = RP_Players.add_player(this.player_params);
				RP_Visualizers.Player.join(new_player);
				RP_Event.initialize('Log', 'player_action', {
					player: new_player,
					action: 'join'
				});
			};
		},
		leave: function(){
			this.view_time = 0;
			this.queue_level = 'primary';
			this.execute = function(){
				var removed_player = RP_Players.remove_player(this.player_id);
				RP_Visualizers.Player.leave(removed_player);
				RP_Event.initialize('Log', 'player_action', {
					player: removed_player,
					action: 'leave'
				});
			};
		},
		start_timer: function(){
			this.view_time = 0;
			this.execute = function(){
				RP_Timer.start_for_player(this.player, this.value);
			};
		},
		stop_timer: function(){
			this.view_time = 0;
			this.execute = function(){
				RP_Timer.stop();
			};
		}
	},
	Game: {
		queue_level: 'primary',
		default_view_time_in_sec: 2,
		final_distribution_time_in_sec: 3,
		on_load: function(){
			this.view_time = 1;

			this.execute = function(){
				$.each(RP_Game.players_to_load, function(){
					RP_Event.initialize('Player', 'join', {
						player_params: this
					});
				});
				delete RP_Game.players_to_load;

				// this._initialize_table_cards();
				// TODO ждем CardsSet
				if(!RP_Game.is_paused() && RP_Game.is_started()){
					RP_Event.initialize('Player', 'start_timer', {
						player: RP_Players.find(RP_Game.active_player_id),
						value: RP_Game.action_time_left
					});
					delete RP_Game.active_player_id;
				}

				RP_Event.initialize('Client', 'check_for_away');

				RP_Event.initialize('Client', 'possible_actions_has_changed');
				RP_Event.initialize('Game', 'state_has_changed');
			};
		},
		state_has_changed: function(){
			this.queue_level = 'main';
			this.view_time = 0;

			this.execute = function(){
				RP_Visualizers.Game.update_all();
				RP_Players.each(function(player){
					RP_Visualizers.Player.update_all(player);
				});
			};
		},
		check_for_pause: function(){
			this.view_time = 0;

			this.execute = function(){
				if(RP_Players.is_all_away()){
					$.ajax({
						async: false,
						url: '/game_synchronizer/' + RP_Game.id + '/really_pause',
						success: function(){
							RP_Game.paused = 'by_away';
							RP_Event.initialize('Game', 'next_distribution');
						}
					});
				}
			};
		},
		start: function(){
			this.execute = function(){
				this.helpers.take_blinds();
				RP_Event.initialize('Game', 'state_has_changed');
			};
		},
		next_distribution: function(){
			this.view_time = RP_Event.Game.final_distribution_time_in_sec;

			this.execute = function(){
				RP_Players.refresh_acted_flags();
			// определяем, какие данные нужно отобразить для завершения раздачи
			// запрашиваем нужные данные у сервера
			// показываем финал раздачи
			// обновляем состояние игры до новой раздачи
			};
		},
		next_stage: function(){
			this.execute = function(){
				RP_Players.refresh_acted_flags();
			// запрашиваем у сервера данные о следующей стадии игры
			// отображаем переход к новой стадии
			};
		}
	},
	Client: {
		queue_level: 'main',
		default_view_time_in_sec: 0,
		check_for_away: function(){
			this.execute = function(){
				if(RP_Client.is_away()){
					RP_Visualizers.Client.away();
				}
			};
		},
		new_hand: function(){
			this.execute = function(){
				//RP_Client.set_hand(new RP_CardsSet(this.cards_in_str));
				RP_Visualizers.Client.update_hand();
				RP_Event.initialize('Log', 'received_cards', {
					stage: 'hand',
					cards: this.cards_in_str
				});
			};
		},
		possible_actions_has_changed: function(){
			this.execute = function(){
				RP_Visualizers.Client.update_actions();
			};
		}
	},
	Log: {
		queue_level: 'main',
		default_view_time_in_sec: 0,
		player_action: function(){
			this.execute = function(){
				var log_message = this.value ? this.action + ' ' + this.value : this.action;
				RP_Visualizers.Log.system_message_with_title(this.player.login, log_message);
			};
		},
		received_cards: function(){
			this.execute = function(){
				RP_Visualizers.Log.system_message_with_title(this.stage, this.cards);
			}
		}
	},
	Syncronize: {
		queue_level: 'synchronize',
		game: function(){
			this.period_in_sec = 5;
			this.execute = function(){
				$.ajax({
					url: '/game_synchronizers/wait_for_start/' + RP_Game.id,
					method: 'get',
					dataType: 'json',
					data: {
						'players[]': RP_Players.ids()
					},
					success: function(json){
						this.helpers.parse_game_json(json);
					}.bind(this),
					complete: function(){
						RP_Event.initialize('Syncronize', RP_Game.is_wait() ? 'game' : 'action');
					}
				});
			};
		},
		action: function(){
			this.period_in_sec = 3;
			this.execute = function(){
				$.ajax({
					url: '/actions/omitted',
					method: 'get',
					dataType: 'json',
					data: {
						game_id: RP_Game.id,
						last_action_id: RP_Game.last_action_id
					},
					success: function(json){
						this.helpers.parse_actions_json(json);
					}.bind(this),
					complete: function(){
						RP_Event.initialize('Syncronize', RP_Game.is_paused() ? 'pause' : 'action');
					}
				});
			};
		},
		chat: function(){
			this.period_in_sec = 10;
			this.execute = function(){

			};
		}
	}
};

//=============================================================================
var RP_EventHelpers = {
	Player: {
		name_by_kind: {
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
		_set_state: function(player, action_kind){
			if(0 <= action_kind){
				player.active();
			}else{
				player.absent();
			}
			RP_Visualizers.Player.update_state(player);
		},
		execute_action: function(player, kind, value){
			this._set_state(player, kind);
			var action_name = this.name_by_kind[kind];
			player.action(action_name, value);
			RP_Visualizers.Player[action_name](player, value);
			RP_Visualizers.Player.update_all();
			RP_Visualizers.Game.update_pot();
			RP_Event.initialize('Game', 'check_for_pause');
			RP_Event.initialize('Log', 'player_action', {
				player: player,
				action: action_name,
				value: value
			});
			RP_EventHelpers.Game.proceed_distribution();
		}
	},
	Game: {
		proceed_distribution: function(){
			if(this._is_new_distribution()){
				RP_Event.initialize('Game', 'next_distribution');
			}else{
				if(this._is_next_stage()){
					RP_Event.initialize('Game', 'next_stage');
				}
			// иначе ничего не делаем
			}
		},
		take_blinds: function(){
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
			return RP_Players.at_sit(RP_Game.small_blind_position);
		},
		_player_on_blind: function(){
			return RP_Players.at_sit(RP_Game.blind_position);
		},
		_is_new_distribution: function(){
			return (this._is_one_winner() || (this._is_next_stage() && this.is_on_river()) || this._is_allin_and_call());
		},
		_is_next_stage: function(){
			return RP_Players.is_all_acted();
		},
		_is_one_winner: function(){
			return 1 == RP_Players.still_in_game_count();
		},
		_is_allin_and_call: function(){
			return (0 == RP_Players.must_call_count() && RP_Players.has_chips_and_can_act_count() <= 1)
		}
	},
	Client: {
	},
	Log: {
	},
	Syncronize: {
		parse_game_json: function(json){
			if(json.remove && 0 < json.remove.length){
				this._remove_players(json.remove);
			}
			if(json.add && 0 < json.add.length){
				this._add_players(json.add);
			}
			if(json.game){
				this._start(json.game);
			}
		},
		_remove_players: function(players_ids){
			$(players_ids).each(function(){
				RP_Event.initialize('Player', 'leave', {
					player_id: parseInt(this)
				});
			});
		},
		_add_players: function(players_array){
			$(players_array).each(function(){
				RP_Event.initialize('Player', 'join', {
					player_params: this
				});
			});
		},
		_start: function(game_params){
			$.extend(RP_Game, game_params);

			RP_Event.initialize('Client', 'new_hand', {
				cards_in_str: game_params.client_hand
			});
			RP_Event.initialize('Client', 'possible_actions_has_changed');
			RP_Event.initialize('Game', 'start');
			// TODO
		},
		parse_actions_json: function(json){
			if(json){
				var time_for_next_player = json.pop();
				RP_Game.last_action_id = json.pop();
				var last_acted_player_id = json[json.length - 1][0];
				RP_Event.initialize('Player', 'stop_timer');
				$.each(json, function(){
					RP_Event.initialize('Player', 'action', {
						player_id: this[0],
						kind: this[1],
						value: this[2]
					});
				});
				RP_Event.initialize('Player', 'start_timer', {
					player: RP_Players.find_next_player(last_acted_player_id),
					time_left: time_for_next_player
				});
			}
		}
	}
};

//=============================================================================
var RP_Client = {
	sit: null,
	_player: function(){
		return RP_Players.at_sit(this.sit);
	},
	is_away: function(){
		return this._player().is_away();
	}
}

//=============================================================================
var RP_GameMethods = {
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
	}
};

//=============================================================================
var RP_Player = function(params){
	default_params = {
		stack: RP_Game.start_stack,
		in_pot: 0,
		for_call: 0
	};
	$.extend(this, default_params, params);
//	this.sit = new PlayerSit(this);
//	this.timer = new PlayerTimer(this);
};

RP_Player.prototype = {
	stake: function(value){
		var full_value = this.for_call + value;
		if(0 < value){
			RP_Players.each(function(player){
				player.add_for_call(value);
			});
			this.for_call -= value;
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
	}
}

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
	find_next_player: function(current_player_id){
		var current_player_sit = this.find(current_player_id).sit;
		var player_found;
//		for(var i = 0; i < this.still_in_game_count(); i++){
//			var next_player = this._still_in_game_players()[i];
//			if(current_player_sit < next_player.sit){
//				player_found = next_player;
//				break;
//			}
//		}
		var players = this._still_in_game_players();
		for(var index in players){
			var next_player = players[index];
			if(current_player_sit < next_player.sit){
				player_found = next_player;
				break;
			}
		}
//		$.each(this._still_in_game_players(), function(i, player){
//			if(current_player_sit < player.sit){
//				player_found = player;
//				return;
//			}
//		});
		if(!player_found){
			player_found = this._still_in_game_players()[0];
		}
		return player_found;
	},
	at_sit: function(sit){
		return this._players[sit];
	},
	add_player: function(player_params){
		var new_player = new RP_Player(player_params);
		if(undefined == this.at_sit(player_params.sit)){
			this._players[player_params.sit] = new_player;
			this.players_count++;
			return new_player;
		}else{
			return false;
		}
	},
	remove_player: function(id){
		for(var i in this._players){
			if(this._players[i].id == id){
				var sit = i;
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
			$.grep(
				this._players,
				function(player){
					return !!player;
				}
				),
			function(player){
				return player.id;
			}
			);
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
var RP_Visualizers = {
	Player: {
		_sit: function(player){
			return $('#sit_' + player.sit);
		},
		_login: function(player){
			return $('#login_' + player.sit);
		},
		_stack: function(player){
			return $('#stack_' + player.sit);
		},
		_away_layer: function(player){
			return $('#away_layer_' + player.sit);
		},
		//		_login: function(player){
		//			return $('#login_' + player.sit);
		//		},
		//		_login: function(player){
		//			return $('#login_' + player.sit);
		//		},
		update_stack: function(player){
			var stack_value = (0 == player.stack) ? 'all-in' : player.stack;
			this._stack(player).text(stack_value);
		},
		update_state: function(player){
			if(player.is_away()){
				this.away(player);
			}else{
				this.active(player);
			}
		},
		update_all: function(player){
			this.update_stack(player);
			this.update_state(player);
		},
		join: function(player){
			this._sit(player).show('slow');
			this._login(player).attr('title', player.login).text(player.login);
			// new CardsSet('cards_' + this.id, 'player');
			// $('#timer_' + this.id);
			this._stack(player).text(player.stack);
		},
		leave: function(player){
			this._sit(player).hide('slow');
		},
		away: function(player){

		},
		active: function(player){

		},
		fold: function(player){

		},
		check: function(player){

		},
		call: function(player){

		},
		bet: function(player, value){

		},
		raise: function(player, value){

		}
	},
	Client: {
		_hand: function(){
			return $('#cards_' + RP_Client.sit);
		},
		_hand_card: function(index){
			return $('#cards_' + RP_Client.sit + '_' + index);
		},
		away: function(){
			RP_AwayDialog.dialog('open');
		},
		update_actions: function(){
			return true;
		},
		update_hand: function(){
			$.each(RP_Client.hand, function(index, card){
				this._hand_card(index).attr('src', card.src).attr('alt', card.alt);
			});
		}
	},
	Log: {
		system_message_with_title: function(title, text){
			this._add_to_log(this._build_message({
				title: title,
				text: text,
				type: 'system'
			}));
		},
		_build_message: function(params){
			var message_html = '';
			message_html += '<div class="' + params.type + '_log_record">';
			if(params.title){
				message_html += '<span class="log_message_title">' + $.escape_html(params.title) + ': </span>';
			}
			message_html += '<span class="log_message_text">' + $.escape_html(params.text) + '</span>';
			message_html += '</div>';
			return message_html;
		},
		_add_to_log: function(html){
			$('#log_body').html(html + $('#log_body').html());
		}
	},
	Game: {
		_pot: function(){
			return $('#pot');
		},
		update_all: function(){
			this.update_pot();
		//TODO
		},
		update_pot: function(){
			this._pot().text(RP_Game.pot());
		}
	}
};

//=============================================================================
var RP_Timer = {
	start_for_player: function(player, init_value){

	},
	stop: function(){

	}
};