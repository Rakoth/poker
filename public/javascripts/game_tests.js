function RP_RunAllTests(){
	RP_PlayerTests.run();
	RP_EventHelperTests.run();
	RP_PlayersTests.run();
	RP_GameTests.run();
	RP_SyncEventsHelpersTests.run();
}

RP_Tests = {
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
		this.assert(assertion, ["assertEquals failed! Actual: %o, expected: %o;", actual, expected, message || '']);
	},
	assertFalse: function(assertion, message){
		assertion = (false === assertion);
		this.assert(assertion, ["assertFalse failed! Assertion was true", message || '']);
	},
	assertArray: function(object, message){
		assertion = $.isArray(object);
		this.assert(assertion, ["assertArray failed! %o was not an Array;", object, message || '']);
	},
	assertInstanceof: function(object, expected_class, message){
		assertion = (object instanceof expected_class);
		this.assert(assertion, ["assertInstanceof failed! %o was not an instance of the expected type;", object, message || '']);
	},
	assertUndefined: function(object, message){
		assertion = (undefined === object);
		this.assert(assertion, ["assertUndefined failed! %o was defined;", object, message || '']);
	},
	run: function(){
		console.log(' ');
		console.group(this.group_title || 'Tests');
		console.time('time');

		this._total_assertions = 0;
		this._total_failed = 0;
		this._total_errors = 0;

		for(var test in this){
			if(0 == test.indexOf('test_')){
				if($.isFunction(this.setup)){
					this.setup();
				}

				this._test_assertions = 0;
				this._test_failed = 0;

				var test_title = test.replace('test_', '"').replace('_should_', '" should ');
				console.group(test_title);
				try{
					this[test]();
				}catch(e){
					this._total_errors++;
					var message = '';
					if('object' == typeof e){
						message = e.name + ': ' + e.message + '; line: ' + e.lineNumber;
					}else{
						message = e;
					}
					console.warn("Exception raised: \"%s\"", message);
				}
				if(0 < this._test_failed){
					console.error('assertions: ', this._test_assertions, '; failed: ', this._test_failed);
				}
				console.groupEnd();
			}
		}

		var log_level = (0 == this._total_failed && 0 == this._total_errors) ? 'info' : 'error';
		console[log_level]('assertions: %i, failed: %i, errors: %i', this._total_assertions, this._total_failed, this._total_errors);

		console.timeEnd('time');
		console.groupEnd();
	},
	_show_message: function(message){
		if(!$.isArray(message)){
			message = ['assert failed! ' + (message || '')];
		}
		console.error.apply(console, message);
	}
};

var RP_PlayerTests = {
	group_title: 'Player methods Tests',
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
	},
	test_action_should_set_acted_flag_for_player: function(){
		with(this){
			var player = players.ordinary;
			for(var index in actions){
				player.act_in_this_round = false;
				player.action(actions[index]);
				assert(player.act_in_this_round);
			}
		}
	},
	test_fold_should_set_player_in_fold_status: function(){
		with(this){
			var player = players.ordinary;
			player.fold();
			assert(player.is_fold());
		}
	},
	test_check_should_not_change_status_and_stack: function(){
		with(this){
			var player = players.ordinary;
			var old_status = player.status;
			var old_stack = player.stack;
			player.check();
			assertEquals(old_status, player.status);
			assertEquals(old_stack, player.stack);
		}
	},
	test_call_should_take_chips_from_player: function(){
		with(this){
			var player = players.small_for_call;
			player.call();
			assertEquals(900, player.stack);
			assertEquals(0, player.for_call);
		}
	},
	test_call_should_set_allin_status_if_player_hasnt_enough_chips: function(){
		with(this){
			var player = players.big_for_call;
			player.call();
			assert(player.is_allin());
		}
	},
	test_bet_should_take_chips_from_player: function(){
		with(this){
			var player = players.ordinary;
			player.bet(100);
			assertEquals(900, player.stack);
		}
	},
	test_bet_should_take_for_call_and_value_of_chips_from_player: function(){
		with(this){
			var player = players.small_for_call;
			player.bet(100);
			assertEquals(800, player.stack);
		}
	},
	test_set_status_should_set_correct_status: function(){
		with(this){
			var player = players.active;
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
		}
	},
	test_stake_should_take_chips_from_player: function(){
		with(this){
			var player = players.ordinary;
			player.stake(100);
			assertEquals(900, player.stack);
		}
	},
	test_stake_should_increase_in_pot_for_player: function(){
		with(this){
			var player = players.ordinary;
			player.stake(100);
			assertEquals(100, player.in_pot);
		}
	},
	test_stake_should_include_players_for_call: function(){
		with(this){
			var player = players.small_for_call;
			player.stake(100);
			assertEquals(200, player.in_pot);
			assertEquals(800, player.stack);
			assertEquals(0, player.for_call);
		}
	},
	test_stake_should_decrease_for_call_if_for_call_more_than_stack: function(){
		with(this){
			var player = players.big_for_call;
			player.stake(0);
			assertEquals(100, player.for_call);
		}
	},
	test_stake_should_take_less_than_or_equal_players_stack: function(){
		with(this){
			var player = players.small_stack;
			player.stake(200);
			assertEquals(0, player.stack);
			assertEquals(100, player.in_pot);
		}
	},
	test_stake_should_call_if_value_is_zero: function(){
		with(this){
			var player = players.small_for_call;
			player.stake(0);
			assertEquals(0, player.for_call);
			assertEquals(900, player.stack);
		}
	},
	test_stake_should_add_for_call_for_other_players_if_value_more_than_zero: function(){
		with(this){
			var player_1 = players.ordinary;
			var player_2 = players.ordinary_copy;
			RP_Players._players = [player_1, player_2];
			player_1.stake(100);
			assertEquals(100, player_2.for_call);
		}
	},
	test_blind_stake_should_take_chips_from_player: function(){
		with(this){
			var player = players.ordinary;
			player.blind_stake(100);
			assertEquals(900, player.stack);
		}
	},
	test_blind_stake_should_decrease_for_call_if_for_call_more_than_stake_value: function(){
		with(this){
			var player = players.small_for_call;
			player.blind_stake(50);
			assertEquals(50, player.for_call);
		}
	},
	test_blind_stake_should_set_for_call_in_zero_if_for_call_less_than_or_equal_stake_value: function(){
		with(this){
			var player = players.small_for_call;
			player.blind_stake(200);
			assertEquals(0, player.for_call);
		}
	}
};
$.extend(RP_PlayerTests, RP_Tests);

var RP_EventHelperTests = {
	group_title: 'Events Helpers Tests',
	setup: function(){
		this.players = {
			ordinary: new RP_Player({id: 1})
		};
		var player_1 = new RP_Player({sit: 0});
		var player_2 = new RP_Player({sit: 1});
		var player_3 = new RP_Player({sit: 2});
		RP_Players._players = [player_1, player_2, player_3];
		RP_Players.players_count = 3;
		RP_Game.blind_position = 0;
		RP_Game.small_blind_position = 1;
		RP_Game.blind_size = 200;
		RP_Game.ante = 0;
	},
	test_set_state_should_set_absent_status_for_player_given_if_kind_less_than_zero: function(){
		with(this){
			var player = players.ordinary;
			for(var i = -4; i < 0; i++){
				player.status = 'some_status';
				RP_EventHelpers.Player._set_state(player, i);
				assertEquals('absent', player.status);
			}
		}
	},
	test_set_state_should_set_active_status_for_player_given_if_kind_more_than_or_equal_zero: function(){
		with(this){
			var player = players.ordinary;
			for(var i = 0; i < 4; i++){
				player.status = 'some_status';
				RP_EventHelpers.Player._set_state(player, i);
				assertEquals('active', player.status);
			}
		}
	},
	test_player_on_small_blind_should_return_player: function(){
		with(this){
			var player = RP_EventHelpers.Game._player_on_small_blind();
			assertInstanceof(player, RP_Player);
		}
	},
	test_player_on_small_blind_should_find_correct_player: function(){
		with(this){
			var player = RP_EventHelpers.Game._player_on_small_blind();
			assertEquals(1, player.sit);
		}
	},
	test_player_on_blind_should_return_player: function(){
		with(this){
			var player = RP_EventHelpers.Game._player_on_blind();
			assertInstanceof(player, RP_Player);
		}
	},
	test_player_on_blind_should_find_correct_player: function(){
		with(this){
			var player = RP_EventHelpers.Game._player_on_blind();
			assertEquals(0, player.sit);
		}
	},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_is_zero: function(){
		with(this){
			RP_EventHelpers.Game.take_blinds();
			var in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.players_count * RP_Game.ante;
			assertEquals(in_pot, RP_Game.pot());
		}
	},
	test_take_blinds_should_take_correct_quantity_of_chips_if_ante_more_than_zero: function(){
		with(this){
			RP_Game.ante = 10;
			RP_EventHelpers.Game.take_blinds();
			var in_pot = RP_Game.blind_size + RP_Game.small_blind_size() + RP_Players.players_count * RP_Game.ante;
			assertEquals(in_pot, RP_Game.pot());
		}
	},
	test_take_blinds_should_increase_for_call_for_all_non_blind_players: function(){
		with(this){
			RP_EventHelpers.Game.take_blinds();
			assertEquals(0, RP_Players.at_sit(0).for_call);
			assertEquals(RP_Game.small_blind_size(), RP_Players.at_sit(1).for_call);
			assertEquals(RP_Game.blind_size, RP_Players.at_sit(2).for_call);
		}
	},
	test_take_blinds_should_increase_in_pot_for_blind_players: function(){
		with(this){
			RP_EventHelpers.Game.take_blinds();
			assertEquals(RP_Game.blind_size, RP_Players.at_sit(0).in_pot);
			assertEquals(RP_Game.small_blind_size(), RP_Players.at_sit(1).in_pot);
			assertEquals(0, RP_Players.at_sit(2).in_pot);
		}
	}
};
$.extend(RP_EventHelperTests, RP_Tests);

var RP_PlayersTests = {
	group_title: 'Players object Tests',
	setup: function(){
		var player_1 = new RP_Player({sit: 0, id: 1});
		var player_2 = new RP_Player({sit: 1, id: 233});
		var player_3 = new RP_Player({sit: 2, id: 32});
		RP_Players._players = [player_1, player_2, player_3];
		RP_Players.players_count = 3;
	},
	test_find_next_player_should_return_correct_player: function(){
		with(this){
			var player = RP_Players.find_next_player(1);
			assertInstanceof(player, RP_Player);
			assertEquals(233, player.id);

			player = RP_Players.find_next_player(233);
			assertInstanceof(player, RP_Player);
			assertEquals(32, player.id);

			player = RP_Players.find_next_player(32);
			assertInstanceof(player, RP_Player);
			assertEquals(1, player.id);

			delete RP_Players._players[1];
			player = RP_Players.find_next_player(1);
			assertInstanceof(player, RP_Player);
			assertEquals(32, player.id);
		}
	},
	test_ids_should_return_array_of_players_ids_if_all_players_in_game: function(){
		with(this){
			var ids_array = RP_Players.ids();
			assertArray(ids_array);
			assertEquals(3, ids_array.length);
			assertEquals(1, ids_array[0]);
			assertEquals(233, ids_array[1]);
			assertEquals(32, ids_array[2]);
		}
	},
	test_ids_should_return_array_of_players_ids_if_some_players_leave_game: function(){
		with(this){
			delete RP_Players._players[1];
			var ids_array = RP_Players.ids();
			assertArray(ids_array);
			assertEquals(2, ids_array.length);
			assertEquals(1, ids_array[0]);
			assertEquals(32, ids_array[1]);

			delete RP_Players._players[2];
			ids_array = RP_Players.ids();
			assertArray(ids_array);
			assertEquals(1, ids_array.length);
			assertEquals(1, ids_array[0]);
		}
	},
	test_refresh_acted_flags_should_set_all_players_to_not_acted_state: function(){
		with(this){
			RP_Players.at_sit(0).act_in_this_round = true;
			RP_Players.at_sit(1).act_in_this_round = true;
			RP_Players.at_sit(2).act_in_this_round = true;
			RP_Players.refresh_acted_flags();
			assertFalse(RP_Players.at_sit(0).act_in_this_round);
			assertFalse(RP_Players.at_sit(1).act_in_this_round);
			assertFalse(RP_Players.at_sit(2).act_in_this_round);
		}
	},
	test_refresh_acted_flags_should_set_all_players_to_not_acted_state_except_player_with_given_id: function(){
		with(this){
			RP_Players.at_sit(0).act_in_this_round = true;
			RP_Players.at_sit(1).act_in_this_round = true;
			RP_Players.at_sit(2).act_in_this_round = true;
			RP_Players.refresh_acted_flags(1);
			assert(RP_Players.at_sit(0).act_in_this_round);
			assertFalse(RP_Players.at_sit(1).act_in_this_round);
			assertFalse(RP_Players.at_sit(2).act_in_this_round);
		}
	},
	test_add_player_should_increase_players_count_if_sit_param_is_correct: function(){
		with(this){
			RP_Players.add_player({sit:3, id: 2});
			assertEquals(4, RP_Players.players_count);
		}
	},
	test_add_player_should_insert_player_in_players_array_if_sit_param_is_correct: function(){
		with(this){
			RP_Players.add_player({sit:3, id: 2});
			assertEquals(4, RP_Players._players.length);
		}
	},
	test_add_player_should_return_false_if_sit_param_is_incorrect: function(){
		with(this){
			assertFalse(RP_Players.add_player({sit:0, id: 2}));
		}
	},
	test_remove_player_should_decrease_players_count_if_id_is_correct: function(){
		with(this){
			RP_Players.remove_player(1);
			assertEquals(2, RP_Players.players_count);
		}
	},
	test_remove_player_should_delete_player_from_players_array_if_id_is_correct: function(){
		with(this){
			RP_Players.remove_player(1);
			assertUndefined(RP_Players.find(1));
		}
	},
	test_remove_player_should_return_undefined_if_id_param_is_incorrect: function(){
		with(this){
			assertUndefined(RP_Players.remove_player(0));
		}
	},
	test_find_should_return_correct_player: function(){
		with(this){
			var player = RP_Players.find(1);
			assertInstanceof(player, RP_Player);
			assertEquals(1, player.id);
			assertEquals(0, player.sit);
		}
	},
	test_find_should_return_undefined_if_id_is_incorrect: function(){
		with(this){
			var player = RP_Players.find(0);
			assertUndefined(player);
		}
	},
	test_still_in_game_players_should_return_array_of_players: function(){
		with(this){
			var players = RP_Players._still_in_game_players();
			assertArray(players);
			assertEquals(3, players.length);
		}
	},
	test_is_all_acted_should_return_true_if_all_players_already_act_in_this_round: function(){
		with(this){
			RP_Players.each(function(player){
				player.act_in_this_round = true;
			});
			assert(RP_Players.is_all_acted());
		}
	},
	test_is_all_acted_should_return_false_if_someone_not_act_yet: function(){
		with(this){
			RP_Players.each(function(player){
				player.act_in_this_round = true;
			});
			RP_Players._players[0].act_in_this_round = false;
			assertFalse(RP_Players.is_all_acted());
		}
	},
	test_is_all_away_should_return_true_if_all_players_away: function(){
		with(this){
			RP_Players.each(function(player){
				player.status = 'absent';
			});
			assert(RP_Players.is_all_away());
		}
	},
	test_is_all_away_should_return_false_if_someone_not_away: function(){
		with(this){
			RP_Players.each(function(player){
				player.status = 'absent';
			});
			RP_Players._players[0].status = 'active';
			assertFalse(RP_Players.is_all_away());
		}
	}
};
$.extend(RP_PlayersTests, RP_Tests);

var RP_GameTests = {
	group_title: 'Game Tests',
	setup: function(){
		this.players = {
			not_acted: new RP_Player({}),
			not_acted_1: new RP_Player({}),
			acted: new RP_Player({in_pot: 100}),
			acted_1: new RP_Player({in_pot: 100})
		};
	},
	test_pot_should_return_zero_if_players_not_acted_yet: function(){
		with(this){
			RP_Players._players = [players.not_acted, players.not_acted_1];
			assertEquals(0, RP_Game.pot());
		}
	},
	test_pot_should_return_value_if_all_players_already_act: function(){
		with(this){
			RP_Players._players = [players.acted, players.acted_1];
			assertEquals(200, RP_Game.pot());
		}
	},
	test_pot_should_return_value_if_some_players_already_act: function(){
		with(this){
			RP_Players._players = [players.not_acted, players.acted];
			assertEquals(100, RP_Game.pot());
		}
	}
}
$.extend(RP_GameTests, RP_Tests);

var RP_SyncEventsHelpersTests = {
	group_title: 'Synchronize Helpers Tests',
	setup: function(){
		this.actions_arrays = {
			empty: undefined,
			one_action: [[1, 0], 25, 30],
			two_actions: [[1, 0], [2, 3, 100], 50, 10]
		};
		this.game_jsons = {
			empty: undefined,
			remove_players: [1, 2],
			add_players: [{id:1}, {id:2}, {id:3}],
			start: {status: 'on_preflop'}
		};
		var player_1 = new RP_Player({sit: 0, id: 1});
		var player_2 = new RP_Player({sit: 1, id: 2});
		var player_3 = new RP_Player({sit: 2, id: 3});
		RP_Players._players = [player_1, player_2, player_3];
		RP_EventsQueue.clear_all();
	},
	test_parse_actions_json_should_do_nothing_if_json_is_empty: function(){
		with(this){
			RP_EventHelpers.Syncronize.parse_actions_json(actions_arrays.empty);
			assertEquals(0, RP_EventsQueue.count_all());
		}
	},
	test_parse_actions_json_should_add_players_actions_and_timer_actions_in_queue: function(){
		with(this){
			RP_EventHelpers.Syncronize.parse_actions_json(actions_arrays.two_actions);
			assertEquals(4, RP_EventsQueue.count_all());
			RP_EventHelpers.Syncronize.parse_actions_json(actions_arrays.one_action);
			assertEquals(7, RP_EventsQueue.count_all());
		}
	},
	test_parse_actions_json_should_add_correct_events_in_queue: function(){
		with(this){
			RP_EventHelpers.Syncronize.parse_actions_json(actions_arrays.one_action);
			assertEquals('stop_timer', RP_EventsQueue._main_queue[0].type);
			assertEquals('action', RP_EventsQueue._main_queue[1].type);
			assertEquals('start_timer', RP_EventsQueue._main_queue[2].type);
		}
	},
	test_add_players_should_add_player_join_events: function(){
		with(this){
			RP_EventHelpers.Syncronize._add_players(game_jsons.add_players);
			assertEquals(3, RP_EventsQueue.count_all());
			assertEquals('join', RP_EventsQueue._primary_queue[0].type);
			assertEquals('join', RP_EventsQueue._primary_queue[1].type);
			assertEquals('join', RP_EventsQueue._primary_queue[2].type);
			assertEquals(1, RP_EventsQueue._primary_queue[0].player_params.id);
			assertEquals(2, RP_EventsQueue._primary_queue[1].player_params.id);
			assertEquals(3, RP_EventsQueue._primary_queue[2].player_params.id);
		}
	},
	test_remove_players_should_add_player_leave_events: function(){
		with(this){
			RP_EventHelpers.Syncronize._remove_players(game_jsons.remove_players);
			assertEquals(2, RP_EventsQueue.count_all());
			assertEquals('leave', RP_EventsQueue._primary_queue[0].type);
			assertEquals('leave', RP_EventsQueue._primary_queue[1].type);
			assertEquals(1, RP_EventsQueue._primary_queue[0].player_id);
			assertEquals(2, RP_EventsQueue._primary_queue[1].player_id);
		}
	},
	test_start_should_add_events_for_start_game_and_update_game_state: function(){
		with(this){
			RP_EventHelpers.Syncronize._start(game_jsons.start);
			assertEquals(3, RP_EventsQueue.count_all());
			assertEquals('new_hand', RP_EventsQueue._main_queue[0].type);
			assertEquals('possible_actions_has_changed', RP_EventsQueue._main_queue[1].type);
			assertEquals('start', RP_EventsQueue._primary_queue[0].type);
			assertEquals('on_preflop', RP_Game.status);
		}
	}
}
$.extend(RP_SyncEventsHelpersTests, RP_Tests);