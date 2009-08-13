var RP_Tests = {
	run_all: function(){
		RUN_TESTS = true;
		for(var group in RP_TestsGroups){
			RP_TestsGroups[group].group_title = group + ' Tests';
			$.extend(RP_TestsGroups[group], this);
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
	assert_equals: function(expected, actual, message){
		if($.isArray(expected) && $.isArray(actual)){
			this._assert_equals_arrays(expected, actual, message);
		}else{
			var assertion = (expected === actual);
			this.assert(assertion, ["assert_equals failed! Actual: %o, expected: %o; ", actual, expected, message || '']);
		}
	},
	assert_false: function(false_assertion, message){
		var assertion = (false === false_assertion);
		this.assert(assertion, ["assert_false failed! Assertion was true; ", message || '']);
	},
	assert_string: function(object, message){
		var assertion = ("string" == typeof object);
		this.assert(assertion, ["assert_string failed! %o was not a string; ", object, message || '']);
	},
	assert_array: function(object, message){
		var assertion = $.isArray(object);
		this.assert(assertion, ["assert_array failed! %o was not an Array; ", object, message || '']);
	},
	assert_instanceof: function(object, expected_class, message){
		var assertion = (object instanceof expected_class);
		this.assert(assertion, ["assert_instanceof failed! %o was not an instance of the expected type; ", object, message || '']);
	},
	assert_undefined: function(object, message){
		var assertion = (undefined === object);
		this.assert(assertion, ["assert_undefined failed! %o was defined; ", object, message || '']);
	},
	assert_defined: function(object, message){
		var assertion = (undefined !== object);
		this.assert(assertion, ["assert_defined failed! variable was undefined; ", message || '']);
	},
	assert_diplay: function(element_id, message){
		var assertion = ($('#' + element_id).attr('display') != 'none');
		this.assert(assertion, ["assert_diplay failed! element was hidden; ", message || '']);
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
	_assert_equals_arrays: function(expected, actual, message){
		var assertion = false;
		if(expected.length == actual.length){
			assertion = true;
			for(var i = 0; i < expected.length; i++){
				if(expected[i] !== actual[i]){
					assertion = false;
					break;
				}
			}
		}
		this.assert(assertion, ["assert_equals_arrays failed! Actual: %o, expected: %o; ", actual, expected, message || ''])
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
		DISABLE_VIEW = true;
		this.players = {
			not_acted: new RP_Player({}),
			not_acted_1: new RP_Player({}),
			acted: new RP_Player({in_pot: 100}),
			acted_1: new RP_Player({in_pot: 100})
		};
		RP_Players._players = [new RP_Player({sit: 0}), new RP_Player({sit: 1}), new RP_Player({sit: 2})];
		RP_Players.count = 3;
		$.extend(RP_Game, {
			blind_position: 0,
			small_blind_position: 1,
			blind_size: 200,
			ante: 0,
			active_player_id: 1,
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
	test_load_players_should_add_players_from_players_to_load_array: function(){with(this){
		RP_Players._players = [];
		RP_Players.count = 0;
		RP_Game.players_to_load = [{id: 1, sit: 0}, {id: 2, sit: 1}];
		RP_Game._load_players();
		assert_undefined(RP_Game.players_to_load);
		assert_equals(2, RP_Players.count, 'count');
		assert_equals(1, RP_Players._players[0].id);
		assert_equals(2, RP_Players._players[1].id);
	}},
	test_set_stage_cards_should_update_table_cards: function(){with(this){
		RP_Game.set_stage_cards('flop', new RP_CardsSet('H7:DT:CJ'));
		assert_equals('H7, D10, CJ', RP_Game.table_cards.flop.alt());
		RP_Game.set_stage_cards('turn', new RP_CardsSet('D7'));
		assert_equals('D7', RP_Game.table_cards.turn.alt());
		RP_Game.set_stage_cards('river', new RP_CardsSet('D7'));
		assert_equals('D7', RP_Game.table_cards.river.alt());
	}},
	test_set_stage_cards_should_update_cards_view: function(){with(this){
		DISABLE_VIEW = undefined;
		$('#flop').hide();
		$('#turn').hide();
		$('#river').hide();
		
		RP_Game.status = 'on_flop';
		RP_Game.set_stage_cards('flop', new RP_CardsSet('H7:H7:H7'));
		assert_equals('/images/game/cards/H7.gif', $('#flop_0').attr('src'));
		assert_diplay('flop');

		RP_Game.status = 'on_turn';
		RP_Game.set_stage_cards('turn', new RP_CardsSet('H7'));
		assert_equals('/images/game/cards/H7.gif', $('#turn_0').attr('src'));
		assert_diplay('turn');

		RP_Game.status = 'on_river';
		RP_Game.set_stage_cards('river', new RP_CardsSet('H7'));
		assert_equals('/images/game/cards/H7.gif', $('#river_0').attr('src'));
		assert_diplay('river');
	}},
	test_is_one_winner_should_return_true_if_all_players_except_one_are_folds: function(){with(this){
		RP_Players._players[0].set_status('fold');
		RP_Players._players[1].set_status('fold');
		RP_Players._players[2].set_status('active');
		assert(RP_Game._is_one_winner());
		assert(RP_Game.is_new_distribution());

		RP_Players._players[1].set_status('active');
		assert_false(RP_Game._is_one_winner());
		assert_false(RP_Game.is_new_distribution());

		RP_Players._players = [new RP_Player({sit: 0, status:'pass'}), new RP_Player({sit: 1})];
		assert(RP_Game._is_one_winner());
		assert(RP_Game.is_new_distribution());
	}},
	test_is_allin_and_call_should_return_true_if_players_in_all_in_and_call_condition: function(){with(this){
		RP_Players._players[0].set_status('fold');
		RP_Players._players[1].set_status('allin');
		RP_Players._players[1].stack = 0;
		RP_Players._players[1].in_pot = 1000;
		RP_Players._players[1].for_call = 0;
		RP_Players._players[2].set_status('active');
		RP_Players._players[2].stack = 100;
		RP_Players._players[2].in_pot = 1000;
		RP_Players._players[2].for_call = 0;
		assert(RP_Game._is_allin_and_call());
		assert(RP_Game.is_new_distribution());

		RP_Players._players[0].set_status('allin');
		RP_Players._players[0].stack = 0;
		RP_Players._players[0].in_pot = 1000;
		RP_Players._players[0].for_call = 0;
		RP_Players._players[1].set_status('allin');
		RP_Players._players[1].stack = 0;
		RP_Players._players[1].in_pot = 1000;
		RP_Players._players[1].for_call = 0;
		RP_Players._players[2].set_status('active');
		RP_Players._players[2].stack = 100;
		RP_Players._players[2].in_pot = 1000;
		RP_Players._players[2].for_call = 0;
		assert(RP_Game._is_allin_and_call());
		assert(RP_Game.is_new_distribution());

		delete RP_Players._players[2];
		RP_Players._players[0].set_status('allin');
		RP_Players._players[0].stack = 0;
		RP_Players._players[0].in_pot = 1000;
		RP_Players._players[0].for_call = 0;
		RP_Players._players[1].set_status('allin');
		RP_Players._players[1].stack = 0;
		RP_Players._players[1].in_pot = 1000;
		RP_Players._players[1].for_call = 0;
		assert(RP_Game._is_allin_and_call());
		assert(RP_Game.is_new_distribution());
	}},
	test_is_next_stage_should_return_true_if_all_players_acted: function(){with(this){
		RP_Players._players[0].act_in_this_round = true;
		RP_Players._players[1].act_in_this_round = true;
		RP_Players._players[2].act_in_this_round = true;
		assert(RP_Game.is_next_stage());
		RP_Game.status = 'on_river';
		assert(RP_Game.is_new_distribution());
	}},
	test_is_on_stage_should_return_true_if_current_stage_is_given_in_parameter: function(){with(this){
		RP_Game.status = 'on_flop';
		assert(RP_Game.is_on_stage('flop'));
		assert_false(RP_Game.is_on_stage('turn'));
		assert_false(RP_Game.is_on_stage('river'));
		RP_Game.status = 'on_turn';
		assert(RP_Game.is_on_stage('turn'));
		assert_false(RP_Game.is_on_stage('flop'));
		assert_false(RP_Game.is_on_stage('river'));
		RP_Game.status = 'on_river';
		assert(RP_Game.is_on_stage('river'));
		assert_false(RP_Game.is_on_stage('flop'));
		assert_false(RP_Game.is_on_stage('turn'));
	}},
	test_pot_should_return_zero_if_players_not_acted_yet: function(){with(this){
		RP_Players._players = [players.not_acted, players.not_acted_1];
		assert_equals(0, RP_Game.pot());
	}},
	test_pot_should_return_value_if_all_players_already_act: function(){with(this){
		RP_Players._players = [players.acted, players.acted_1];
		assert_equals(200, RP_Game.pot());
	}},
	test_pot_should_return_value_if_some_players_already_act: function(){with(this){
		RP_Players._players = [players.not_acted, players.acted];
		assert_equals(100, RP_Game.pot());
	}},
	test_current_stage_cards_should_return_cards_set: function(){with(this){
		RP_Game.status = 'on_flop';
		cards = RP_Game.current_stage_cards();
		assert_instanceof(cards, RP_CardsSet);
		assert_equals('H6, D10, CJ', cards.alt());
		RP_Game.status = 'on_turn';
		cards = RP_Game.current_stage_cards();
		assert_instanceof(cards, RP_CardsSet);
		assert_equals('H2', cards.alt());
		RP_Game.status = 'on_river';
		cards = RP_Game.current_stage_cards();
		assert_instanceof(cards, RP_CardsSet);
		assert_equals('H7', cards.alt());
	}},
	test_player_on_small_blind_should_return_player: function(){with(this){
		player = RP_Game._player_on_small_blind();
		assert_instanceof(player, RP_Player);
	}},
	test_player_on_small_blind_should_find_correct_player: function(){with(this){
		player = RP_Game._player_on_small_blind();
		assert_equals(1, player.sit);
	}},
	test_player_on_blind_should_return_player: function(){with(this){
		player = RP_Game._player_on_blind();
		assert_instanceof(player, RP_Player);
	}},
	test_player_on_blind_should_find_correct_player: function(){with(this){
		player = RP_Game._player_on_blind();
		assert_equals(0, player.sit);
	}},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_is_zero: function(){with(this){
		RP_Game._take_blinds();
		in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.count * RP_Game.ante;
		assert_equals(in_pot, RP_Game.pot());
	}},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_more_than_zero: function(){with(this){
		RP_Game.ante = 10;
		RP_Game._take_blinds();
		in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.count * RP_Game.ante;
		assert_equals(in_pot, RP_Game.pot());
	}},
	test_take_blinds_should_increase_for_call_for_all_non_blind_players: function(){with(this){
		RP_Game._take_blinds();
		assert_equals(0, RP_Players.at_sit(0).for_call);
		assert_equals(RP_Game.small_blind_size(), RP_Players.at_sit(1).for_call);
		assert_equals(RP_Game.blind_size, RP_Players.at_sit(2).for_call);
	}},
	test_take_blinds_should_increase_in_pot_for_blind_players: function(){with(this){
		RP_Game._take_blinds();
		assert_equals(RP_Game.blind_size, RP_Players.at_sit(0).in_pot);
		assert_equals(RP_Game.small_blind_size(), RP_Players.at_sit(1).in_pot);
		assert_equals(0, RP_Players.at_sit(2).in_pot);
	}}
};

RP_TestsGroups.Client = {
	setup: function() {
		RP_Game.blind_size = 100;
		RP_Game.current_bet = 0;
		RP_Players._players[0] = new RP_Player({sit: 0});
		RP_Client.sit = 0;
		RP_Timer.player = RP_Client._player();
		RP_Timer._activated = true;
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
		assert_false(RP_Client.is_see_button('call'));
	}},
	test_is_see_button_should_return_false_for_check_and_true_for_call_if_client_for_call_more_than_zero: function(){with(this){
		RP_Players._players[0].for_call = 100;
		assert_false(RP_Client.is_see_button('check'));
		assert(RP_Client.is_see_button('call'));
	}},
	test_is_see_button_should_return_true_for_bet_and_false_for_raise_if_client_can_do_bet: function(){with(this){
		RP_Game.current_bet = 100;
		assert(RP_Client.is_see_button('bet'));
		assert_false(RP_Client.is_see_button('raise'));
	}},
	test_is_see_button_should_return_true_for_raise_and_false_for_bet_if_client_can_do_raise: function(){with(this){
		RP_Game.current_bet = 200;
		assert(RP_Client.is_see_button('raise'));
		assert_false(RP_Client.is_see_button('bet'));
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
	test_update_should_update_given_params: function(){with(this){
		player = players.ordinary;
		player.update({
			status: 'absent',
			stack: 1500,
			act_in_this_round: true,
			for_call: 300,
			in_pot: 100
		});
		assert(player.is_away());
		assert_equals(1500, player.stack);
		assert(player.act_in_this_round);
		assert_equals(300, player.for_call);
		assert_equals(100, player.in_pot);
	}},
	test_set_status_should_set_correct_status: function(){with(this){
		player = players.active;
		player.set_status('fold');
		assert(player.is_fold(), 'on setting "fold" status');
		player.set_status('away');
		assert(player.is_away(), 'on setting "away" status');
		player.set_status('active');
		assert(player.is_active(), 'on setting "active" status');
		player.set_status('away');
		assert(player.is_away(), 'on setting "away" status');
		player.set_status('allin');
		assert(player.is_allin(), 'on setting "allin" status');
	}},
	test_stake_should_inscrease_game_current_bet_if_value_more_than_zero: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assert_equals(100, RP_Game.current_bet);
	}},
	test_stake_should_take_chips_from_player: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assert_equals(900, player.stack);
	}},
	test_stake_should_increase_in_pot_for_player: function(){with(this){
		player = players.ordinary;
		player.stake(100);
		assert_equals(100, player.in_pot);
	}},
	test_stake_should_include_players_for_call: function(){with(this){
		player = players.small_for_call;
		player.stake(100);
		assert_equals(200, player.in_pot);
		assert_equals(800, player.stack);
		assert_equals(0, player.for_call);
	}},
	test_stake_should_decrease_for_call_if_for_call_more_than_stack: function(){with(this){
		player = players.big_for_call;
		player.stake(0);
		assert_equals(100, player.for_call);
	}},
	test_stake_should_take_less_than_or_equal_players_stack: function(){with(this){
		player = players.small_stack;
		player.stake(200);
		assert_equals(0, player.stack);
		assert(player.is_allin());
		assert_equals(100, player.in_pot);
	}},
	test_stake_should_call_if_value_is_zero: function(){with(this){
        player = players.small_for_call;
        player.stake(0);
        assert_equals(0, player.for_call);
        assert_equals(900, player.stack);
	}},
	test_stake_should_add_for_call_for_other_players_if_value_more_than_zero: function(){with(this){
		player_1 = players.ordinary;
		player_2 = players.ordinary_copy;
		RP_Players._players = [player_1, player_2];
		player_1.stake(100);
		assert_equals(100, player_2.for_call);
	}},
	test_take_chips_should_take_chips_from_player: function(){with(this){
		player = players.ordinary;
		player.take_chips(100);
		assert_equals(900, player.stack);
	}},
	test_take_chips_should_decrease_for_call_if_for_call_more_than_stake_value: function(){with(this){
		player = players.small_for_call;
		player.take_chips(50);
		assert_equals(50, player.for_call);
	}},
	test_take_chips_should_set_allin_status_for_player_if_stake_equal_or_more_than_stack: function(){with(this){
		player = players.small_stack;
		player.take_chips(100);
		assert_equals(0, player.stack);
		assert(player.is_allin());
		assert_equals(100, player.in_pot);
	}},
	test_take_chips_should_set_for_call_in_zero_if_for_call_less_than_or_equal_stake_value: function(){with(this){
		player = players.small_for_call;
		player.take_chips(200);
		assert_equals(0, player.for_call);
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
		assert_equals('HA', set.alt());
		set = new RP_CardsSet(cards_in_str.two);
		assert_equals('D3, S10', set.alt());
		set = new RP_CardsSet(cards_in_str.three);
		assert_equals('CK, S8, HJ', set.alt());
	}},
	test_cards_set_initialize_should_create_set_of_given_cards_or_default_cards: function(){with(this){
		set = new RP_CardsSet(cards_in_str.one);
		assert_equals(1, set._cards.length);
		set = new RP_CardsSet(cards_in_str.two);
		assert_equals(2, set._cards.length);
		set = new RP_CardsSet(cards_in_str.three);
		assert_equals(3, set._cards.length);
	}},
	test_card_initialize_should_create_card_with_src_and_alt: function(){with(this){
		card = new RP_Card(cards_in_str.one);
		assert_equals('HA', card.alt);
		assert_equals('/images/game/cards/HA.gif', card.src);
	}}
};

RP_TestsGroups.Players = {
	setup: function(){
		DISABLE_VIEW = true;
		this.player_1 = new RP_Player({sit: 0, id: 1});
		this.player_2 = new RP_Player({sit: 1, id: 233});
		this.player_3 = new RP_Player({sit: 2, id: 32});
		RP_Players._players = [this.player_1, this.player_2, this.player_3];
		RP_Players.count = 3;
	},
	test_each_should_apply_callback_for_all_players: function(){with(this){
		RP_Players.each(function(player){
			player.stack = 0;
		});
		assert_equals(0, RP_Players._players[0].stack);
		assert_equals(0, RP_Players._players[1].stack);
		assert_equals(0, RP_Players._players[2].stack);

		delete RP_Players._players[1];
		RP_Players.each(function(player){
			player.stack = 0;
		});
		assert_equals(0, RP_Players._players[0].stack);
		assert_equals(0, RP_Players._players[2].stack);
	}},
	test_losers_should_find_all_players_who_lose: function(){with(this){
		players = RP_Players.losers([1]);
		assert_array(players);
		assert_equals(2, players.length);
		assert_equals(0, players[0].sit);
		assert_equals(2, players[1].sit);
		players = RP_Players.losers([1, 2]);
		assert_array(players);
		assert_equals(1, players.length);
		assert_equals(0, players[0].sit);
		players = RP_Players.losers([0, 1, 2]);
		assert_array(players);
		assert_equals(0, players.length);
	}},
	test_find_next_player_should_return_correct_player: function(){with(this){
		player = RP_Players.find_next_player(player_1);
		assert_instanceof(player, RP_Player);
		assert_equals(233, player.id);

		player = RP_Players.find_next_player(player_2);
		assert_instanceof(player, RP_Player);
		assert_equals(32, player.id);

		player = RP_Players.find_next_player(player_3);
		assert_instanceof(player, RP_Player);
		assert_equals(1, player.id);

		delete RP_Players._players[1];
		player = RP_Players.find_next_player(player_1);
		assert_instanceof(player, RP_Player);
		assert_equals(32, player.id);
	}},
	test_ids_should_return_array_of_players_ids_if_all_players_in_game: function(){with(this){
		ids_array = RP_Players.ids();
		assert_array(ids_array);
		assert_equals(3, ids_array.length);
		assert_equals(1, ids_array[0]);
		assert_equals(233, ids_array[1]);
		assert_equals(32, ids_array[2]);
	}},
	test_ids_should_return_array_of_players_ids_if_some_players_leave_game: function(){with(this){
		delete RP_Players._players[1];
		ids_array = RP_Players.ids();
		assert_array(ids_array);
		assert_equals(2, ids_array.length);
		assert_equals(1, ids_array[0]);
		assert_equals(32, ids_array[1]);

		delete RP_Players._players[2];
		ids_array = RP_Players.ids();
		assert_array(ids_array);
		assert_equals(1, ids_array.length);
		assert_equals(1, ids_array[0]);
	}},
	test_refresh_acted_flags_should_set_all_players_to_not_acted_state: function(){with(this){
		RP_Players.at_sit(0).act_in_this_round = true;
		RP_Players.at_sit(1).act_in_this_round = true;
		RP_Players.at_sit(2).act_in_this_round = true;
		RP_Players.refresh_acted_flags();
		assert_false(RP_Players.at_sit(0).act_in_this_round);
		assert_false(RP_Players.at_sit(1).act_in_this_round);
		assert_false(RP_Players.at_sit(2).act_in_this_round);
	}},
	test_add_player_should_increase_players_count_if_sit_param_is_correct: function(){with(this){
		RP_Players._players = [];
		RP_Players.count = 0;
		RP_Players.add_player(new RP_Player({sit:0, id: 2}));
		assert_equals(1, RP_Players.count, 'cache');
		assert_equals(1, RP_Players._players.length, 'real');
		RP_Players.add_player(new RP_Player({sit:1, id: 3}));
		assert_equals(2, RP_Players.count, 'cache');
		assert_equals(2, RP_Players._players.length, 'real');
	}},
	test_remove_player_should_decrease_players_count_if_id_is_correct: function(){with(this){
		RP_Players.remove_player(1);
		assert_equals(2, RP_Players.count);
	}},
	test_remove_player_should_delete_player_from_players_array_if_id_is_correct: function(){with(this){
		RP_Players.remove_player(1);
		assert_undefined(RP_Players.find(1));
	}},
	test_remove_player_should_return_undefined_if_id_param_is_incorrect: function(){with(this){
		assert_undefined(RP_Players.remove_player(0));
	}},
	test_find_should_return_correct_player: function(){with(this){
		player = RP_Players.find(1);
		assert_instanceof(player, RP_Player);
		assert_equals(1, player.id);
		assert_equals(0, player.sit);
	}},
	test_find_should_return_undefined_if_id_is_incorrect: function(){with(this){
		player = RP_Players.find(0);
		assert_undefined(player);
	}},
	test_still_in_game_players_should_return_array_of_players: function(){with(this){
		players = RP_Players._still_in_game_players();
		assert_array(players);
		assert_equals(3, players.length);
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
		assert_false(RP_Players.is_all_acted());
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
		assert_false(RP_Players.is_all_away());
	}}
};

RP_TestsGroups.Visualizers = {
	setup: function(){
		DISABLE_VEIW = undefined;
	},
	test_create_should_return_function: function(){with(this){
		assert_instanceof(RP_Visualizers.create('Game'), Function);
		assert_instanceof(new RP_Player({sit: 1}).view, Function);
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
		assert_false(RP_Timer.is_turn_of(player_for_check));
	}},
	test_is_turn_of_should_return_false_if_timer_is_stoped: function(){with(this){
		RP_Timer._activated = false;
		player_for_check_1 = new RP_Player({id: 1});
		assert_false(RP_Timer.is_turn_of(player_for_check_1));
	}},
	test_start_should_start_timer_and_set_timers_params: function(){with(this){
		RP_Timer.start(player, 21);
		assert(RP_Timer._activated);
		assert_defined(RP_Timer._timer);
		assert_equals(0, RP_Timer.player.sit);
		assert_equals(21, RP_Timer.time);
		RP_Timer.stop();
	}},
	test_stop_should_clear_timer_params: function(){with(this){
		RP_Timer.start(player, 21);
		RP_Timer.stop();
		assert_false(RP_Timer._activated);
	}},
	test_reduce_time_should_reduce_time_by_one_if_time_more_than_zero: function(){with(this){
		RP_Timer.time = 30;
		counter = 30;
		while(0 < counter){
			counter--;
			RP_Timer._reduce_time();
			assert_equals(counter, RP_Timer.time);
		}
	}},
	test_reduce_time_should_stoped_if_time_is_over: function(){with(this){
		RP_Timer.time = 0;
		RP_Timer._activated = true;
		RP_Timer._reduce_time();
		assert_false(RP_Timer._activated);
	}}
};

RP_TestsGroups.Action = {
	setup: function(){
		DISABLE_VIEW = true;
		RP_Players._players = [new RP_Player({sit: 0, id: 1, stack: 1000}), new RP_Player({sit: 1, id: 2}), new RP_Player({sit: 2, id: 3})];
		RP_Players.count = 3;
	},
	test_influence_should_set_act_in_this_round_flag_to_player: function(){with(this){
		for(var kind = -4; kind < 5; kind++){
			RP_Players._players[0].act_in_this_round = false;
			action = new RP_Action({player_id: 1, kind: kind});
			action.execute();
			assert(RP_Players._players[0].act_in_this_round);
		}
	}},
	test_influence_should_set_correct_status_for_fold_action: function(){with(this){
		new RP_Action({player_id: 1, kind: 0}).execute();
		assert(RP_Players._players[0].is_fold());
	}},
	test_influence_should_set_correct_status_for_auto_actions: function(){with(this){
		for(var kind = -4; kind < 0; kind++){
			RP_Players._players[0].status = 'active';
			new RP_Action({player_id: 1, kind: kind}).execute();
			assert(RP_Players._players[0].is_away());
		}
	}},
	test_influence_should_set_correct_status_for_player_actions: function(){with(this){
		for(var kind = 0; kind < 5; kind++){
			RP_Players._players[0].status = 'absent';
			new RP_Action({player_id: 1, kind: kind}).execute();
			assert_false(RP_Players._players[0].is_away());
		}
	}},
	test_influence_should_set_allin_status_for_call_action: function(){with(this){
		RP_Players._players[0].for_call = 1000;
		new RP_Action({player_id: 1, kind: 2}).execute();
		assert(RP_Players._players[0].is_allin());
		assert_equals(0, RP_Players._players[0].stack);
		assert_equals(1000, RP_Players._players[0].in_pot);
	}},
	test_influence_should_set_allin_status_for_bet_action: function(){with(this){
		new RP_Action({player_id: 1, kind: 3, value: 1000}).execute();
		assert(RP_Players._players[0].is_allin());
		assert_equals(0, RP_Players._players[0].stack);
		assert_equals(1000, RP_Players._players[0].in_pot);
	}},
	test_influence_should_set_allin_status_for_raise_action: function(){with(this){
		new RP_Action({player_id: 1, kind: 4, value: 1000}).execute();
		assert(RP_Players._players[0].is_allin());
	}},
	test_influence_should_not_change_status_and_stack_for_check_action: function(){with(this){
		old_status = RP_Players._players[0].status;
		old_stack = RP_Players._players[0].stack;
		new RP_Action({player_id: 1, kind: 1}).execute();
		assert_equals(old_status, RP_Players._players[0].status);
		assert_equals(old_stack, RP_Players._players[0].stack);
	}},
	test_influence_should_take_for_call_and_value_of_chips_from_player_for_bet_action: function(){with(this){
		RP_Players._players[0].for_call = 100;
		new RP_Action({player_id: 1, kind: 3, value: 100}).execute();
		assert_equals(800, RP_Players._players[0].stack);
	}}
}

RP_TestsGroups.Synchronizers = {
	setup: function(){
		DISABLE_VIEW = true;
		this.players_array = [{"for_call": 50, "stack": 1050, "id": 5}, {"status": "active", "act_in_this_round": false, "id": 6}];
		RP_Players._players = [new RP_Player({id: 5}), new RP_Player({id: 6}), new RP_Player({id: 7})];
		RP_Players.count = 3;
	},
	test_sync_players_on_distribution_should_remove_losers_from_rp_players_object: function(){with(this){
		RP_Synchronizers.Game._sync_players_on_distribution(players_array);
		assert_defined(RP_Players._players[0]);
		assert_defined(RP_Players._players[1]);
		assert_undefined(RP_Players._players[2]);
	}},
	test_sync_players_on_distribution_should_update_players_state: function(){with(this){
		RP_Synchronizers.Game._sync_players_on_distribution(players_array);
		assert_equals(50, RP_Players._players[0].for_call);
		assert_equals(1050, RP_Players._players[0].stack);
		assert_equals('active', RP_Players._players[1].status);
		assert_false(RP_Players._players[1].act_in_this_round);
	}}
}

