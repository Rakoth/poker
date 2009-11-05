var RUN_TESTS = false;

Function.prototype.bind = function(object){
  var __method = this;
  return function() {
    __method.apply(object, arguments);
  };
};

var RP_HttpStatus = {
  errors: {
    forbidden: 403,
    hurry_sync: 440,
    late_sync: 441
  }
};

//=============================================================================
var RP_Extend = {
  is_request_ready: function(request){
    return (!RUN_TESTS && (!request || 0 == request.readyState || 4 == request.readyState));
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
  },
  build: function(tag_name, params, inner_elements){
    var element = $(document.createElement(tag_name));
    for(var param in params){
      element.attr(param, params[param]);
    }
    if($.isArray(inner_elements)){
      $.each(inner_elements, function(){
        element.append(this);
      });
    }else{
      element.text(inner_elements);
    }
    return element;
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
RP_Extend.prepare_elements = function(){
  $('#veil').click(RP_Visualizers.Game.hide_previous_final.bind(RP_Visualizers.Game));
  $('#actions_veil').css('opacity', 0.2);
  $('.away_veil').css('opacity', 0.5);
  $('#auto_actions input').click(function(){
    if(this.checked){
      $('#auto_actions input').each(function(){
        this.checked = false;
      });
      this.checked = true;
      RP_Client.auto_action_name = $(this).val();
    }else{
      RP_Client.auto_action_name = undefined;
    }
  });
};

$(function(){
  RP_Extend.prepare_elements();

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
        var new_arguments = [];
        var i = 1;
        while(arguments[i] != undefined){
          new_arguments.push(arguments[i]);
          i++;
        }
        return visualizer[arguments[0]].apply(visualizer, new_arguments);
      }
      return false;
    };
  }
};

RP_Visualizers.Game = {
  _show_previous_final_time: 3 * 1000,
  _blinds_level_time_chenging_period: 1000,
  _blinds_level_timer: null,
  _pot: function(){
    return $('#pot');
  },
  _blinds: function(){
    return $('#blinds');
  },
  _level_time: function(){
    return $('#level_time');
  },
  update_all: function(){
    this.update_pot();
    this.update_blinds();
    this.update_level_time();
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
  _add_zero: function( seconds ){
    return seconds < 10 ? "0" + seconds : seconds ;
  },
  _change_timer_value: function(){
    var _time_array = this._level_time().text().split(':').reverse();
    var seconds = _time_array.shift();
    var minutes = _time_array.shift();
    [seconds , minutes] = ( seconds == 0 && 0 < minutes ) ? [ 59 , minutes - 1] : 0 < seconds ? [ seconds -1 , minutes] :  [ 0, 0];
    this._level_time().text(minutes + ":" + this._add_zero(seconds));
  },
  _time_convert: function(next_level_time){
    if(next_level_time != undefined){
      var minutes = parseInt( next_level_time / 60 ) ;
      var seconds = next_level_time % 60 ;
      return minutes + ":" + this._add_zero(seconds)  ;
    }else{
      return "0:00";
    }
  },
  update_level_time: function(){
    clearTimeout(this._blinds_level_timer);
    this._level_time().text(this._time_convert(RP_Game.next_level_time));
    this._blinds_level_timer = setInterval( this._change_timer_value.bind(this) , this._blinds_level_time_chenging_period);
  },
  hide_previous_final: function(){
    clearTimeout(this._previous_final_timer);
    if(!RP_Game.is_finished()){
      $('#veil').hide();
      $('#previous_final').remove();
      $('#room').show();
    }
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
  update_client_actions: function(disable_animation){
    var animation_speed = disable_animation ? 0 : 1000;
    this._update_stake_slider();
    this._update_actions_buttons();
    this._update_auto_actions();
    if(RP_Client.is_turn() && undefined == RP_Client.auto_action_name){
      $('#auto_actions').hide('slide', {
        direction: 'up'
      }, animation_speed);
      $('#client_actions').show('slide', {
        direction: 'down'
      }, animation_speed);
    }else{
      if($('#auto_actions').is(':hidden')){
        $('#client_actions').hide('slide', {
          direction: 'down'
        }, animation_speed);
        $('#auto_actions').show('slide', {
          direction: 'up'
        }, animation_speed);
      }
    }
  },
  _update_stake_slider: function(){
    RP_StakeSlider.slider(RP_Client.can_only_call() ? 'disable' : 'enable');
    RP_StakeSlider.slider('option', 'max', RP_Client.max_bet());
    var min_bet = Math.max(0, Math.min(RP_Game.minimal_bet(), RP_Client.max_bet()));
    RP_StakeSlider.slider('option', 'min', min_bet);
    if(RP_StakeSlider.slider('value') < min_bet || RP_Client.max_bet() < RP_StakeSlider.slider('value')){
      RP_StakeSlider.slider('value', min_bet);
      $('#stake_value').val(min_bet);
    }
  },
  _update_auto_actions: function(){
    //TODO
    $('#auto_actions > span').each(function(){
      $(this)[RP_Client.can_perform_action($(this).find('input').val()) ? 'show' : 'hide']();
    });
    if(parseInt($('#auto_call_value').text()) != RP_Client.for_call() && 'fold' != RP_Client.auto_action_name){
      $('#auto_actions input').each(function(){
        this.checked = false;
      });
      RP_Client.auto_action_name = undefined;
    }
    $('#auto_call_value').text(RP_ChipsCountHelper.format(RP_Client.for_call()));
  },
  _update_actions_buttons: function(){
    $('#client_actions a').each(function(){
      $(this)[RP_Client.can_perform_action(this.id) ? 'show' : 'hide']();
    });
  },
  show_game_over: function(){
    setTimeout(function(){
      if(RP_Client.is_lose()){
        RP_LoseDialog.dialog('open');
      }else{
        RP_WinDialog.dialog('open');
      }
    }, 3 * 1000);
  },
  button_for_auto_action: function(){
    return $('#' + RP_Client.auto_action_name);
  },
  remove_auto_actions: function(){
    $('#auto_actions input').each(function(){
      this.checked = false;
    });
  }
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

};

RP_Visualizers.Player = function(player){
  this.player = player;
  this.sit = player.sit;
};

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
  _hand: function(){
    return [$('#cards_' + this.sit + '_0'), $('#cards_' + this.sit + '_1')];
  },
  _away_veil:  function(){
    return this._element('away_veil');
  },
  _cards: function(){
    return this._element('cards');
  },
  _element: function(id){
    return $('#room #' + id + '_' + this.sit);
  },
  update_stack: function(){
    var stack_value = (0 == this.player.stack) ? 'all-in' : this.player.stack;
    this._stack().text(stack_value);
  },
  update_status: function(){
    if(this.player.is_away() && !this.player.is_allin()){
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
    this.update_all();
  },
  update_all: function(){
    this.update_stack();
    this.update_status();
    this.update_hand();
  },
  leave: function(){
    this._sit().remove();
    this._away_veil().remove();
  },
  away: function(){
    this._away_veil().show();
  },
  active: function(){
    this._away_veil().hide();
  },
  in_fold: function(){
    this._cards().fadeTo('slow', 0.5);
  },
  unfold: function(){
    this._cards().fadeTo(0, 1);
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
  update: RP_Extend.update,
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
    return 0 <= $.inArray(this.status, ['on_preflop', 'on_flop', 'on_turn', 'on_river']);
  },
  is_paused: function(){
    return (undefined != this.paused || (RP_Players.is_all_away() && RP_Synchronizers.Game.is_really_paused()));
  },
  is_finished: function(){
    return 'finished' == this.status;
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
  set_next_level_time: function(next_level_time){
    RP_Game.next_level_time = next_level_time;
    RP_Game.view('update_level_time');
  //TODO
  },
  set_blind_size: function(blind_size){
    RP_Game.blind_size = blind_size;
    RP_Game.view('update_blinds');
  },
  set_ante: function(ante){
    RP_Game.ante = ante;
  },
  set_client_hand: function(new_hand_in_str){
    if(new_hand_in_str){
      RP_Client.set_hand(new RP_CardsSet(new_hand_in_str));
    }
  },
  set_pause: function(type){
    this.paused = ('by_away' == type ? type : 'by_request');
  },
  resume: function(){
    this.paused = undefined;
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
    this.set_status('activated');
    if(RP_Game.is_paused()){
      RP_Game.resume();
    }
  },
  away: function(){
    this.set_status('away');
    if(RP_Game.is_paused()){
      RP_Game.set_pause('by_away');
    }
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
    return (0 == this.for_call || this.is_allin());
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
      case 'activated':
        switch(this.status){
          case 'pass_away': new_status = 'pass'; break;
          case 'allin': new_status = 'allin'; break;
          default: new_status = 'active'; break;
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
  id: null,
  sit: null,
  login: '',
  auto_action_name: undefined,
  view: RP_Visualizers.create('Client'),
  initialize: function(){
    this.sit = RP_Game.client_sit;
    this.id = this._player().id;
    this.login = this._player().login;
    delete RP_Game.client_sit;
    // нужно ли показать клиенту away_dialog
    if(this.is_away()){
      this.view('away');
    }
    this.view('update_client_actions', true);
  },
  _player: function(){
    return RP_Players.at_sit(this.sit);
  },
  max_bet: function(){
    return this.stack() - this.for_call();
  },
  stack: function(){
    return this._player().stack;
  },
  for_call: function(){
    return this._player().for_call;
  },
  can_only_call: function(){
    return this.stack() <= this._player().for_call;
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
  action: function(kind, value, active_player_id){
    RP_Timer.stop();
    new RP_Action({
      player_id: this._player().id,
      kind: kind,
      value: value,
      time_for_next_player: RP_Game.time_for_action,
      next_active_player: RP_Players.find(active_player_id)
    }).execute();
  },
  is_turn: function(){
    return RP_Timer.is_turn_of(this);
  },
  can_perform_action: function(action_name){
    switch(action_name){
      case 'fold': return true;
      case 'check': return (0 == this.for_call());
      case 'call': return (0 < this.for_call());
      case 'bet': return (RP_Game.is_wait() || (RP_Game.current_bet == RP_Game.blind_size && this.for_call() < this.stack()));
      case 'raise': return (RP_Game.blind_size < RP_Game.current_bet && this.for_call() < this.stack());
      default: alert('Error in RP_Client.can_perform_action(). Unexpected param: ' + action_name); return false;
    }
  },
  is_lose: function(){
    return undefined == this._player();
  },
  is_win: function(){
    return (1 == RP_Players.count && !this.is_lose());
  },
  is_game_ower: function(){
    return this.is_lose() || this.is_win();
  },
  active: function(){
    this._player().active();
  },
  perform_auto_action: function(){
    this.view('button_for_auto_action').click();
    this.remove_auto_actions();
  },
  remove_auto_actions: function(){
    this.view('remove_auto_actions');
    this.auto_action_name = undefined;
  },
	back_to_game_after_pause: function(){
		RP_Timer.start(this._player());
		this.view('update_client_actions');
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
        async: false,
        url: '/actions/timeout',
        type: 'post',
        data: {
          game_id: RP_Game.id,
          player_id: away_player.id
        },
        error: function(request){
          if(RP_HttpStatus.errors.hurry_sync == request.status){
            setTimeout(function(){
              this.notify(away_player);
            }.bind(this), this._period);
          }
        }.bind(this)
      });
    }
  }
};

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
    var current_players = this._still_in_game_players(current_player);
    var current_player_position = $.inArray(current_player, current_players);
    return current_players[current_player_position + 1] || current_players[0];
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
  _still_in_game_players: function(add_player_in_any_case){
    return $.grep(this._players, function(player){
      return (player && (!player.is_fold() || player == add_player_in_any_case));
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
    this._activated = true;
    this.player = player;
    this.player.active();
    this._set_time(init_value);
    this._timer = setInterval(this._reduce_time.bind(this), 1000);
    return true;
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
    return this._name_by_kind[this.kind];
  },
  _is_last_omitted_action: function(){
    return this.time_for_next_player != undefined;
  },
  _is_auto_action: function(){
    return this.kind < 0;
  },
  _has_value: function(){
    return (0 <= $.inArray(this.name(), ['bet', 'raise']));
  },
  execute: function(){
    // влияние действия на стэки и состояние игроков
    this._influence();
    RP_Log.player_action(this.player, this.name(), this._has_value() ? this.value : null);

    // продолжение раздачи(проверка на новую раздачу или изменение стадии)
    if(!RP_Game.is_paused()){
      this._proceed_distribution();
      if(RP_Client.is_game_ower()){
        RP_Client.view('show_game_over');
        return false;
      }
    }else{
      RP_Synchronizers.Game.distribution();
      return false;
    }

    // проверка на старт таймера и запуск
    if(this._is_last_omitted_action()){
      if(this._is_last_action_before_distribution){
        RP_Timer.start(RP_Players.find(RP_Game.active_player_id), this.time_for_next_player);
      }else{
        if(!this.next_active_player || this.next_active_player == this.player.next_active()){
          RP_Timer.start(this.player.next_active(), this.time_for_next_player);
        }else{
      // ничего не делаем
      }
      }
    }

    RP_Client.view('update_client_actions');
    // Выполнение автоматического действия, установленного клиентом
    if(RP_Client.is_turn() && RP_Client.auto_action_name != undefined){
      RP_Client.perform_auto_action();
    }
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
  player_message: function(player_or_client, text){
    this._message(player_or_client.login, text, true);
  },
  player_action: function(player, action, value){
    this._message(player.login, action + (value ? ' ' + value : ''));
  },
  game_stage: function(){
    this._message(RP_Game.stage(), RP_Game.current_stage_cards().alt());
  },
  new_player: function(player){
    this._message(player.login, 'join');
  },
  _message: function(title, text, is_user){
    this._add_to_log(this._build_message({
      is_user: is_user,
      title: title,
      text: text
    }));
  },
  _build_message: function(params){
    var message = [$.build('span', {
      'class': 'log_message_text'
    }, params.text)];
    if(params.title){
      message.unshift($.build('span', {
        'class': 'log_message_title'
      }, params.title + ': '));
    }
    return $.build('div', {
      'class': 'log_record' + (params.is_user ? '' : ' system')
    }, message);
  },
  _add_to_log: function(element){
    $('#log_body').prepend(element);
  }
};

//=============================================================================
var RP_Synchronizers = {};

RP_Synchronizers.Base = function(){};
RP_Synchronizers.Base.prototype = {
  _timer: null,
  _request: null,
  start: function(){
    this._initialize();
    this._timer = setInterval(this._get_data.bind(this), this._period * 1000);
  },
  stop: function(){
    clearTimeout(this._timer);
  },
  _get_data: function(){
    if($.is_request_ready(this._request)){
      this._request = $.ajax({
        url: this._url,
        method: 'get',
        dataType: 'json',
        data: this._data(),
        success: this._parse_data.bind(this),
        error: this._error_handler
      });
    }
  },
  _error_handler: function(request){
    if(RP_HttpStatus.errors.forbidden == request.status){
      window.close();
    }
  }
};

RP_Synchronizers.Chat = {
  _url: '/log_messages',
  _period: 5,
  _last_message_id: 0,
  _initialize: function(){
    this._last_message_id = RP_Game.last_message_id || 0;
    delete RP_Game.last_message_id;
  },
  _parse_data: function(json){
    $.each(json, function(i, message){
      this._last_message_id = message.id;
      RP_Log.player_message(RP_Players.find(message.player_id), message.text);
    }.bind(this));
  },
  _data: function(){
    return {
      'last_message_id': this._last_message_id,
      'game_id': RP_Game.id,
      'player_id': RP_Client.id
    };
  }
};

RP_Synchronizers.Action = {
  _url: '/actions/omitted',
  _period: 6,
  _last_action_id: 0,
  _initialize: function(){
    this._last_action_id = RP_Game.last_action_id || this._last_action_id;
    delete RP_Game.last_action_id;
  },
  _parse_data: function(json){
    if(json){
      this._last_action_id = json.last_action_id;

      RP_Timer.stop();

      $.each(json.actions, function(){
        var is_continue_execution = new RP_Action(this).execute();
        if(!is_continue_execution){
          return false;
        }
        return true;
      });
    }
  },
  _data: function(){
    return {
      game_id: RP_Game.id,
      last_action_id: this._last_action_id
    };
  }
};

RP_Synchronizers.Game = {
  _period: 10,
  _initialize: function(){
    this._url = '/game_synchronizers/wait_for_start/' + RP_Game.id;
  },
  _data: function(){
    return {
      'players[]': RP_Players.ids()
    };
  },
  _parse_data: function(json){
    for(var index in json.players_ids_to_remove){
      RP_Players.remove_player(json.players_ids_to_remove[index]);
    }

    for(index in json.players_to_add){
      RP_Players.add_player(new RP_Player(json.players_to_add[index]));
    }

    if(json.data_for_start){
      new_hand = new RP_CardsSet(json.data_for_start.client_hand);
      RP_Client.set_hand(new_hand);
      delete json.data_for_start.client_hand;

      RP_Game.update(json.data_for_start);

      RP_Game.start();

      RP_Client.view('update_client_actions');
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
        if(this.hand){
          RP_Players.at_sit(this.sit).set_hand(new RP_CardsSet(this.hand));
        }
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

    RP_Game.clear_table_cards();
    RP_Game.update(json);
    RP_Game.view('update_pot')
    RP_Client.remove_auto_actions();
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
      data: {
        stage: RP_Game.status
      },
      success: this._sync_on_stage.bind(this)
    });
  },
  _sync_on_stage: function(json){
    RP_Game.status = json.status;
    RP_Game.set_stage_cards(RP_Game.stage(), new RP_CardsSet(json.cards));
    RP_Players.refresh_acted_flags();
    RP_Client.remove_auto_actions();
  },
  is_really_paused: function(){
    var answer = false;
    $.ajax({
      url: '/game_synchronizers/really_paused/' + RP_Game.id,
      async: false,
      type: 'get',
      success: function(){
        answer = true;
      }
    });
    return answer;
  }
};

RP_Synchronizers.Action = $.extend(new RP_Synchronizers.Base(), RP_Synchronizers.Action);
RP_Synchronizers.Game = $.extend(new RP_Synchronizers.Base(), RP_Synchronizers.Game);
RP_Synchronizers.Chat = $.extend(new RP_Synchronizers.Base(), RP_Synchronizers.Chat);

var RP_ChipsCountHelper = {
  format: function(number){
    if(number < 10000){
      return number;
    }
    if(number < 1000000){
      return Math.round(number / 1000) + 'k';
    }
    return Math.round(number / 1000000) + 'm';
  }
};