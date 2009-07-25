var RP_Tests = {
	run_all: function(){
		for(var group in RP_TestsGroups){
			RP_TestsGroups[group].group_title = group + ' Tests';
			$.extend(RP_TestsGroups[group], RP_Tests);
			RP_TestsGroups[group].run();
		}
	},
	assert: function(assertion, message){
		this._test_assertions++;
		this._total_assertions++;
		if(!assertion){
			this._show_message(message);
			this._test_failed++;
			this._total_failed++;
		}
	},
	assertEquals: function(expected, actual, message){
		var assertion = (expected === actual);
		this.assert(assertion, ["assertEquals failed! Actual: %o, expected: %o; ", actual, expected, message || '']);
	},
	assertFalse: function(assertion, message){
		assertion = (false === assertion);
		this.assert(assertion, ["assertFalse failed! Assertion was true; ", message || '']);
	},
	assertString: function(object, message){
		var assertion = ("string" == typeof object);
		this.assert(assertion, ["assertString failed! %o was not a string; ", object, message || '']);
	},
	assertArray: function(object, message){
		var assertion = $.isArray(object);
		this.assert(assertion, ["assertArray failed! %o was not an Array; ", object, message || '']);
	},
	assertInstanceof: function(object, expected_class, message){
		var assertion = (object instanceof expected_class);
		this.assert(assertion, ["assertInstanceof failed! %o was not an instance of the expected type; ", object, message || '']);
	},
	assertUndefined: function(object, message){
		var assertion = (undefined === object);
		this.assert(assertion, ["assertUndefined failed! %o was defined; ", object, message || '']);
	},
	assertDefined: function(object, message){
		var assertion = (undefined !== object);
		this.assert(assertion, ["assertDefined failed! variable was undefined; ", message || '']);
	},
	run: function(){
		this._start_tests_group();
		this._init_total_counters();

		for(var test in this){
			if(this._is_test(test)){
				this._setup();
				this._init_test_counters();
				this._start_test(test);
				try{
					this[test]();
				}catch(e){
					this._error(e);
				}
				this._final_test();
			}
		}
		this._final_tests_group();
	},
	_show_message: function(message){
		if(!$.isArray(message)){
			message = ['assert failed! ' + (message || '')];
		}
		console.error.apply(console, message);
	},
	_init_total_counters: function(){
		this._total_assertions = 0;
		this._total_failed = 0;
		this._total_errors = 0;
	},
	_init_test_counters: function(){
		this._test_assertions = 0;
		this._test_failed = 0;
	},
	_start_tests_group: function(){
		console.log(' ');
		console.group(this.group_title || 'Tests');
		console.time('time');
	},
	_start_test: function(test_name){
		console.group(test_name.replace('test_', '"').replace('_should_', '" should '));
	},
	_final_test: function(){
		if(0 < this._test_failed){
			console.error('assertions: %i, failed: %i', this._test_assertions, this._test_failed);
		}
		console.groupEnd();
	},
	_final_tests_group: function(){
		console.timeEnd('time');
		var log_level = (this._is_errors() ? 'error' : 'info');
		console[log_level]('assertions: %i, failed: %i, errors: %i', this._total_assertions, this._total_failed, this._total_errors);
		console.groupEnd();
	},
	_setup: function(){
		if($.isFunction(this.setup)){
			this.setup();
		}
	},
	_error: function(exception){
		this._total_errors++;
    var message;
		if('object' == typeof exception){
			message = exception.name + ': ' + exception.message + '; line: ' + exception.lineNumber;
		}else{
			message = exception;
		}
		console.warn("Exception raised: \"%s\"", message);
	},
	_is_errors: function(){
		return (0 < this._total_failed || 0 < this._total_errors);
	},
	_is_test: function(method_name){
		return (0 == method_name.indexOf('test_') && $.isFunction(this[method_name]));
	}
};

var RP_TestsGroups = {};

RP_TestsGroups.Game = {
	setup: function(){
		this.players = {
			not_acted: new RP_Player({}),
			not_acted_1: new RP_Player({}),
			acted: new RP_Player({in_pot: 100}),
			acted_1: new RP_Player({in_pot: 100})
		};
		RP_Players._players = [new RP_Player({sit: 0}), new RP_Player({sit: 1}), new RP_Player({sit: 2})];
		RP_Players.players_count = 3;
		$.extend(RP_Game, {
			blind_position: 0,
			small_blind_position: 1,
			blind_size: 200,
			ante: 0,
			active_player_i: 1,
			players_to_load: [{id: 1}, {id: 2}],
			cards_to_load: {
				flop: 'H3:DJ:CA',
				turn: 'S9',
				river: 'S3'
			},
			table_cards: {
				flop: new RP_CardsSet('H6:DT:CJ'),
				turn: new RP_CardsSet('H2'),
				river: new RP_CardsSet('H7')
			},
			status: 'on_flop'
		});
	},
	test_is_on_stage_should_return_true_if_current_stage_is_given_in_parameter: function(){with(this){
		RP_Game.status = 'on_flop';
		assert(RP_Game.is_on_stage('flop'));
		assertFalse(RP_Game.is_on_stage('turn'));
		assertFalse(RP_Game.is_on_stage('river'));
		RP_Game.status = 'on_turn';
		assert(RP_Game.is_on_stage('turn'));
		assertFalse(RP_Game.is_on_stage('flop'));
		assertFalse(RP_Game.is_on_stage('river'));
		RP_Game.status = 'on_river';
		assert(RP_Game.is_on_stage('river'));
		assertFalse(RP_Game.is_on_stage('flop'));
		assertFalse(RP_Game.is_on_stage('turn'));
	}},
	test_pot_should_return_zero_if_players_not_acted_yet: function(){with(this){
		RP_Players._players = [players.not_acted, players.not_acted_1];
		assertEquals(0, RP_Game.pot());
	}},
	test_pot_should_return_value_if_all_players_already_act: function(){with(this){
		RP_Players._players = [players.acted, players.acted_1];
		assertEquals(200, RP_Game.pot());
	}},
	test_pot_should_return_value_if_some_players_already_act: function(){with(this){
		RP_Players._players = [players.not_acted, players.acted];
		assertEquals(100, RP_Game.pot());
	}},
	test_current_stage_cards_should_return_cards_set: function(){with(this){
		RP_Game.stage = 'on_flop';
		cards = RP_Game.current_stage_cards();
		assertInstanceof(cards, RP_CardsSet);
		assertEquals('H6, D10, CJ', cards.alt());
		RP_Game.stage = 'on_turn';
		cards = RP_Game.current_stage_cards();
		assertInstanceof(cards, RP_CardsSet);
		assertEquals('H2', cards.alt());
		RP_Game.stage = 'on_river';
		cards = RP_Game.current_stage_cards();
		assertInstanceof(cards, RP_CardsSet);
		assertEquals('H7', cards.alt());
	}},
	test_player_on_small_blind_should_return_player: function(){with(this){
		player = RP_Game._player_on_small_blind();
		assertInstanceof(player, RP_Player);
	}},
	test_player_on_small_blind_should_find_correct_player: function(){with(this){
		player = RP_Game._player_on_small_blind();
		assertEquals(1, player.sit);
	}},
	test_player_on_blind_should_return_player: function(){with(this){
		player = RP_Game._player_on_blind();
		assertInstanceof(player, RP_Player);
	}},
	test_player_on_blind_should_find_correct_player: function(){with(this){
		player = RP_Game._player_on_blind();
		assertEquals(0, player.sit);
	}},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_is_zero: function(){with(this){
		RP_Game._take_blinds();
		in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.players_count * RP_Game.ante;
		assertEquals(in_pot, RP_Game.pot());
	}},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_more_than_zero: function(){with(this){
		RP_Game.ante = 10;
		RP_Game._take_blinds();
		in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.players_count * RP_Game.ante;
		assertEquals(in_pot, RP_Game.pot());
	}},
	test_take_blinds_should_increase_for_call_for_all_non_blind_players: function(){with(this){
		RP_Game._take_blinds();
		assertEquals(0, RP_Players.at_sit(0).for_call);
		assertEquals(RP_Game.small_blind_size(), RP_Players.at_sit(1).for_call);
		assertEquals(RP_Game.blind_size, RP_Players.at_sit(2).for_call);
	}},
	test_take_blinds_should_increase_in_pot_for_blind_players: function(){with(this){
		RP_Game._take_blinds();
		assertEquals(RP_Game.blind_size, RP_Players.at_sit(0).in_pot);
		assertEquals(RP_Game.small_blind_size(), RP_Players.at_sit(1).in_pot);
		assertEquals(0, RP_Players.at_sit(2).in_pot);
	}}
};

RP_TestsGroups.Client = {
	setup: function() {
		RP_Game.blind_size = 100;
		RP_Game.current_bet = 0;
		RP_Players._players[0] = new RP_Player({sit: 0});
		RP_Client.sit = 0;
	},
	test_is_see_button_should_return_true_for_fold_button: function(){with(this){
		assert(RP_Client.is_see_button('fold'));
		RP_Players._players[0].stack = 0;
		assert(RP_Client.is_see_button('fold'));
		RP_Game.current_bet = 200;
		assert(RP_Client.is_see_button('fold'));
	}},
	test_is_see_button_should_return_true_for_check_and_false_for_call_if_client_for_call_equal_zero: function(){with(this){
		RP_Players._players[0].for_call = 0;
		assert(RP_Client.is_see_button('check'));
		assertFalse(RP_Client.is_see_button('call'));
	}},
	test_is_see_button_should_return_false_for_check_and_true_for_call_if_client_for_call_more_than_zero: function(){with(this){
		RP_Players._players[0].for_call = 100;
		assertFalse(RP_Client.is_see_button('check'));
		assert(RP_Client.is_see_button('call'));
	}},
	test_is_see_button_should_return_true_for_bet_and_false_for_raise_if_client_can_do_bet: function(){with(this){
		RP_Game.current_bet = 100;
		assert(RP_Client.is_see_button('bet'));
		assertFalse(RP_Client.is_see_button('raise'));
	}},
	test_is_see_button_should_return_true_for_raise_and_false_for_bet_if_client_can_do_raise: function(){with(this){
		RP_Game.current_bet = 200;
		assert(RP_Client.is_see_button('raise'));
		assertFalse(RP_Client.is_see_button('bet'));
	}}
};

RP_TestsGroups.Player = {
	setup: function(){
		this.actions = ['fold', 'check', 'call', 'bet', 'raise'];
		this.players = {
			active: new RP_Player({status: 'active'}),
			ordinary: new RP_Player({stack: 1000}),
			ordinary_copy: new RP_Player({stack: 1000}),
			small_for_call: new RP_Player({stack: 1000, for_call: 100}),
			big_for_call: new RP_Player({stack: 100, for_call: 200}),
			small_stack: new RP_Player({stack: 100})
		};
		RP_Game.current_bet = 0;
	},
	test_action_should_set_acted_flag_for_player: function(){with(this){
		player = players.ordinary;
		for(index in actions){
			player.act_in_this_round = false;
			player.action(actions[index]);
			assert(player.act_in_this_round);
		}
	}},
	test_fold_should_set_player_in_fold_status: function(){with(this){
		player = players.ordinary;
		player.fold();
		assert(player.is_fold());
	}},
	test_check_should_not_change_status_and_stack: function(){with(this){
		player = players.ordinary;
		old_status = player.status;
		old_stack = player.stack;
		player.check();
		assertEquals(old_status, player.status);
		assertEquals(old_stack, player.stack);
	}},
	test_call_should_take_chips_from_player: function(){with(this){
		player = players.small_for_call;
		player.call();
		assertEquals(900, player.stack);
		assertEquals(0, player.for_call);
	}},
	test_call_should_set_allin_status_if_player_hasnt_enough_chips: function(){with(this){
		player = players.big_for_call;
		player.call();
		assert(player.is_allin());
	}},
	test_bet_should_take_chips_from_player: function(){with(this){
		player = players.ordinary;
		player.bet(100);
		assertEquals(900, player.stack);
	}},
	test_bet_should_take_for_call_and_value_of_chips_from_player: function(){with(this){
		player = players.small_for_call;
		player.bet(100);
		assertEquals(800, player.stack);
	}},
	test_set_status_should_set_correct_status: function(){with(this){
		player = players.active;
		player._set_status('fold');
		assert(player.is_fold(), 'on setting "fold" status');
		player._set_status('away');
		assert(player.is_away(), 'on setting "away" status');
		player._set_status('active');
		assert(player.is_active(), 'on setting "active" status');
		player._set_status('away');
		assert(player.is_away(), 'on setting "away" status');
		player._set_status('allin');
		assert(player.is_allin(), 'on setting "allin" status');
	}},
	test_stake_should_inscrease_game_current_bet_if_value_more_than_zero: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assertEquals(100, RP_Game.current_bet);
	}},
	test_stake_should_take_chips_from_player: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assertEquals(900, player.stack);
	}},
	test_stake_should_increase_in_pot_for_player: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assertEquals(100, player.in_pot);
	}},
	test_stake_should_include_players_for_call: function(){with(this){
		player = players.small_for_call;
		player.stake(100);
		assertEquals(200, player.in_pot);
		assertEquals(800, player.stack);
		assertEquals(0, player.for_call);
	}},
	test_stake_should_decrease_for_call_if_for_call_more_than_stack: function(){with(this){
		player = players.big_for_call;
		player.stake(0);
		assertEquals(100, player.for_call);
	}},
	test_stake_should_take_less_than_or_equal_players_stack: function(){with(this){
		player = players.small_stack;
		player.stake(200);
		assertEquals(0, player.stack);
		assertEquals(100, player.in_pot);
	}},
	test_stake_should_call_if_value_is_zero: function(){with(this){
        player = players.small_for_call;
        player.stake(0);
        assertEquals(0, player.for_call);
        assertEquals(900, player.stack);
	}},
	test_stake_should_add_for_call_for_other_players_if_value_more_than_zero: function(){with(this){
		player_1 = players.ordinary;
		player_2 = players.ordinary_copy;
		RP_Players._players = [player_1, player_2];
		player_1.stake(100);
		assertEquals(100, player_2.for_call);
	}},
	test_blind_stake_should_take_chips_from_player: function(){with(this){
		player = players.ordinary;
		player.blind_stake(100);
		assertEquals(900, player.stack);
	}},
	test_blind_stake_should_decrease_for_call_if_for_call_more_than_stake_value: function(){with(this){
		player = players.small_for_call;
		player.blind_stake(50);
		assertEquals(50, player.for_call);
	}},
	test_blind_stake_should_set_for_call_in_zero_if_for_call_less_than_or_equal_stake_value: function(){with(this){
		player = players.small_for_call;
		player.blind_stake(200);
		assertEquals(0, player.for_call);
	}}
};

RP_TestsGroups.Cards = {
	setup: function(){
		this.cards_in_str = {
			one: 'HA',
			two: 'D3:ST',
			three: 'CK:S8:HJ'
		};
	},
	test_alt_should_return_alternative_string: function(){with(this){
		set = new RP_CardsSet(cards_in_str.one);
		assertEquals('HA', set.alt());
		set = new RP_CardsSet(cards_in_str.two);
		assertEquals('D3, S10', set.alt());
		set = new RP_CardsSet(cards_in_str.three);
		assertEquals('CK, S8, HJ', set.alt());
	}},
	test_cards_set_initialize_should_create_set_of_given_cards_or_default_cards: function(){with(this){
		set = new RP_CardsSet(cards_in_str.one);
		assertEquals(1, set._cards.length);
		set = new RP_CardsSet(cards_in_str.two);
		assertEquals(2, set._cards.length);
		set = new RP_CardsSet(cards_in_str.three);
		assertEquals(3, set._cards.length);
		set = new RP_CardsSet();
		assertEquals(2, set._cards.length);
		assertEquals('RP', set.card(0).alt);
		assertEquals('RP', set.card(1).alt);
	}},
	test_card_initialize_should_create_card_with_src_and_alt: function(){with(this){
		card = new RP_Card(cards_in_str.one);
		assertEquals('HA', card.alt);
		assertEquals('/images/game/cards/HA.gif', card.src);
	}}
};

RP_TestsGroups.Players = {
	setup: function(){
		DISABLE_VIEW = true;
		this.player_1 = new RP_Player({sit: 0, id: 1});
		this.player_2 = new RP_Player({sit: 1, id: 233});
		this.player_3 = new RP_Player({sit: 2, id: 32});
		RP_Players._players = [this.player_1, this.player_2, this.player_3];
		RP_Players.players_count = 3;
	},
	test_each_should_apply_callback_for_all_players: function(){with(this){
		RP_Players.each(function(player){
			player.stack = 0;
		});
		assertEquals(0, RP_Players._players[0].stack);
		assertEquals(0, RP_Players._players[1].stack);
		assertEquals(0, RP_Players._players[2].stack);

		delete RP_Players._players[1];
		RP_Players.each(function(player){
			player.stack = 0;
		});
		assertEquals(0, RP_Players._players[0].stack);
		assertEquals(0, RP_Players._players[2].stack);
	}},
	test_losers_should_find_all_players_who_lose: function(){with(this){
		players = RP_Players.losers([1]);
		assertArray(players);
		assertEquals(2, players.length);
		assertEquals(0, players[0].sit);
		assertEquals(2, players[1].sit);
		players = RP_Players.losers([1, 2]);
		assertArray(players);
		assertEquals(1, players.length);
		assertEquals(0, players[0].sit);
		players = RP_Players.losers([0, 1, 2]);
		assertArray(players);
		assertEquals(0, players.length);
	}},
	test_find_next_player_should_return_correct_player: function(){with(this){
		player = RP_Players.find_next_player(player_1);
		assertInstanceof(player, RP_Player);
		assertEquals(233, player.id);

		player = RP_Players.find_next_player(player_2);
		assertInstanceof(player, RP_Player);
		assertEquals(32, player.id);

		player = RP_Players.find_next_player(player_3);
		assertInstanceof(player, RP_Player);
		assertEquals(1, player.id);

		delete RP_Players._players[1];
		player = RP_Players.find_next_player(player_1);
		assertInstanceof(player, RP_Player);
		assertEquals(32, player.id);
	}},
	test_ids_should_return_array_of_players_ids_if_all_players_in_game: function(){with(this){
		ids_array = RP_Players.ids();
		assertArray(ids_array);
		assertEquals(3, ids_array.length);
		assertEquals(1, ids_array[0]);
		assertEquals(233, ids_array[1]);
		assertEquals(32, ids_array[2]);
	}},
	test_ids_should_return_array_of_players_ids_if_some_players_leave_game: function(){with(this){
		delete RP_Players._players[1];
		ids_array = RP_Players.ids();
		assertArray(ids_array);
		assertEquals(2, ids_array.length);
		assertEquals(1, ids_array[0]);
		assertEquals(32, ids_array[1]);

		delete RP_Players._players[2];
		ids_array = RP_Players.ids();
		assertArray(ids_array);
		assertEquals(1, ids_array.length);
		assertEquals(1, ids_array[0]);
	}},
	test_refresh_acted_flags_should_set_all_players_to_not_acted_state: function(){with(this){
		RP_Players.at_sit(0).act_in_this_round = true;
		RP_Players.at_sit(1).act_in_this_round = true;
		RP_Players.at_sit(2).act_in_this_round = true;
		RP_Players.refresh_acted_flags();
		assertFalse(RP_Players.at_sit(0).act_in_this_round);
		assertFalse(RP_Players.at_sit(1).act_in_this_round);
		assertFalse(RP_Players.at_sit(2).act_in_this_round);
	}},
	test_refresh_acted_flags_should_set_all_players_to_not_acted_state_except_player_with_given_id: function(){with(this){
		RP_Players.at_sit(0).act_in_this_round = true;
		RP_Players.at_sit(1).act_in_this_round = true;
		RP_Players.at_sit(2).act_in_this_round = true;
		RP_Players.refresh_acted_flags(1);
		assert(RP_Players.at_sit(0).act_in_this_round);
		assertFalse(RP_Players.at_sit(1).act_in_this_round);
		assertFalse(RP_Players.at_sit(2).act_in_this_round);
	}},
	test_add_player_should_increase_players_count_if_sit_param_is_correct: function(){with(this){
		RP_Players._players = [];
		RP_Players.players_count = 0;
		RP_Players.add_player(new RP_Player({sit:0, id: 2}));
		assertEquals(1, RP_Players.players_count, 'cache');
		assertEquals(1, RP_Players._players.length, 'real');
		RP_Players.add_player(new RP_Player({sit:1, id: 3}));
		assertEquals(2, RP_Players.players_count, 'cache');
		assertEquals(2, RP_Players._players.length, 'real');
	}},
	test_remove_player_should_decrease_players_count_if_id_is_correct: function(){with(this){
		RP_Players.remove_player(1);
		assertEquals(2, RP_Players.players_count);
	}},
	test_remove_player_should_delete_player_from_players_array_if_id_is_correct: function(){with(this){
		RP_Players.remove_player(1);
		assertUndefined(RP_Players.find(1));
	}},
	test_remove_player_should_return_undefined_if_id_param_is_incorrect: function(){with(this){
		assertUndefined(RP_Players.remove_player(0));
	}},
	test_find_should_return_correct_player: function(){with(this){
		player = RP_Players.find(1);
		assertInstanceof(player, RP_Player);
		assertEquals(1, player.id);
		assertEquals(0, player.sit);
	}},
	test_find_should_return_undefined_if_id_is_incorrect: function(){with(this){
		player = RP_Players.find(0);
		assertUndefined(player);
	}},
	test_still_in_game_players_should_return_array_of_players: function(){with(this){
		players = RP_Players._still_in_game_players();
		assertArray(players);
		assertEquals(3, players.length);
	}},
	test_is_all_acted_should_return_true_if_all_players_already_act_in_this_round: function(){with(this){
		RP_Players.each(function(player){
			player.act_in_this_round = true;
		});
		assert(RP_Players.is_all_acted());
	}},
	test_is_all_acted_should_return_false_if_someone_not_act_yet: function(){with(this){
		RP_Players.each(function(player){
			player.act_in_this_round = true;
		});
		RP_Players._players[0].act_in_this_round = false;
		assertFalse(RP_Players.is_all_acted());
	}},
	test_is_all_away_should_return_true_if_all_players_away: function(){with(this){
		RP_Players.each(function(player){
			player.status = 'absent';
		});
		assert(RP_Players.is_all_away());
	}},
	test_is_all_away_should_return_false_if_someone_not_away: function(){with(this){
		RP_Players.each(function(player){
			player.status = 'absent';
		});
		RP_Players._players[0].status = 'active';
		assertFalse(RP_Players.is_all_away());
	}}
};

RP_TestsGroups.Visualizers = {
	setup: function(){
		DISABLE_VEIW = undefined;
	},
	test_create_should_return_function: function(){with(this){
		assertInstanceof(RP_Visualizers.create('Game'), Function);
		assertInstanceof(new RP_Player({sit: 1}).view, Function);
	}}
};

RP_TestsGroups.Timer = {
	setup: function(){
		DISABLE_VIEW = true;
		this.player = new RP_Player({sit: 0, id: 1});
		RP_Timer._activated = false;
	},
	test_is_turn_of_should_return_true_if_arg_is_the_player_with_started_timer: function(){with(this){
		RP_Timer._activated = true;
		RP_Timer.player = player;
		player_for_check = new RP_Player({id: 1});
		assert(RP_Timer.is_turn_of(player_for_check));
	}},
	test_is_turn_of_should_return_false_if_arg_isnt_player_with_started_timer: function(){with(this){
		RP_Timer._activated = true;
		RP_Timer.player = player;
		player_for_check = new RP_Player({id: 2});
		assertFalse(RP_Timer.is_turn_of(player_for_check));
	}},
	test_is_turn_of_should_return_false_if_timer_is_stoped: function(){with(this){
		RP_Timer._activated = false;
		player_for_check_1 = new RP_Player({id: 1});
		assertFalse(RP_Timer.is_turn_of(player_for_check_1));
	}},
	test_start_should_start_timer_and_set_timers_params: function(){with(this){
		RP_Timer.start(player, 21);
		assert(RP_Timer._activated);
		assertDefined(RP_Timer._timer);
		assertEquals(0, RP_Timer.player.sit);
		assertEquals(21, RP_Timer.time);
		RP_Timer.stop();
	}},
	test_stop_should_clear_timer_params: function(){with(this){
		RP_Timer.start(player, 21);
		RP_Timer.stop();
		assertFalse(RP_Timer._activated);
	}},
	test_reduce_time_should_reduce_time_by_one_if_time_more_than_zero: function(){with(this){
		RP_Timer.time = 30;
		counter = 30;
		while(0 < counter){
			counter--;
			RP_Timer._reduce_time();
			assertEquals(counter, RP_Timer.time);
		}
	}},
	test_reduce_time_should_stoped_if_time_is_over: function(){with(this){
		RP_Timer.time = 0;
		RP_Timer._activated = true;
		RP_Timer._reduce_time();
		assertFalse(RP_Timer._activated);
	}}
};

